const fetch = require("node-fetch")
const crypto = require("crypto")

const db = require('monk')('localhost/flagclicked')
const users = db.get('users')
const sessions = db.get('sessions')

users.createIndex('name', { unique: true })
const Auth = {}

Auth.createUser = async function(username) {
  if (await Auth.getUser(username)) {
    throw `User ${username} has already been created!`
  }

  let res = await fetch(`https://api.scratch.mit.edu/users/${username}`).then(res => res.json());

  if (res.code == 'NotFound') {
    throw `User ${username} is not a valid scratch user!`
  }

  let sysId = await Auth.getCurrentUserCount() + 1

  let User = {
    id: res.id,
    username: res.username,
    sysId,
    admin: false
  }


  await users.insert(User)


  return User
}

Auth.getUser = async function(name) {
  console.log(name)
  let user = await users.findOne({
    username: { $regex: new RegExp(`^${escapeRegExp(name)}$`, 'i') }
  })
  console.dir(user)
  return user ? user : null
}

Auth.createSession = async function(user) {
  let sessionToken = await generateToken()

  await sessions.insert({ user, session: sessionToken })


  return sessionToken
}

Auth.getSession = async function(sessionToken) {
  let sessionUser = await sessions.findOne({
    session: { $regex: new RegExp(`^${escapeRegExp(sessionToken)}$`, 'i')}
  })

  if (sessionUser) {
    return await Auth.getUser(sessionUser.user)
  } else return null
}

Auth.deleteSession = async function(sessionToken) {
  await sessions.remove({ session: sessionToken })
  return true
}

Auth.getCurrentUserCount = async function() {
  return (await users.find()).length
}

Auth.authMiddleware = async function(req, res, next) {
  let sessionUser = await Auth.getSession(req.cookies.token)

  if (!sessionUser) {
    return res.status(403).json({ error: "Invalid Token" })
  } else {
    req.user = sessionUser

    next()
  }
}



function escapeRegExp(string) {
  if (!string) return undefined
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

async function generateToken() {
  let buffer = await new Promise((resolve, reject) => {
    crypto.randomBytes(256, (ex, buffer) => {
      if (ex) return reject('error generating token')
      resolve(buffer)
    })
  })

  let token = crypto
      .createHash('sha1')
      .update(buffer)
      .digest('hex')

  return token
}


module.exports = Auth
