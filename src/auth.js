const Database = require("@replit/database")
const fetch = require("node-fetch")
const crypto = require("crypto")

const db = new Database()
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

  await db.set(`currentUsers`, sysId)

  await db.set(`user-${User.username.toLowerCase()}`, User)


  return User
}

Auth.getUser = async function(name) {
  let user = await db.get(`user-${name.toLowerCase()}`)

  return user ? user : null
}

Auth.createSession = async function(user, tries = 0) {
  let session = crypto.randomBytes(256).toString('hex');

  let old = await db.get(`session-${session}`);

  if (tries > 10) throw 'Max tries reached'
  if (old) return await Auth.createSession(user, tries + 1)

  await db.set(`session-${session}`, user.toLowerCase())

  return session
}

Auth.getSession = async function(sessionToken) {
  let sessionUser = await db.get(`session-${sessionToken}`)

  if (sessionUser) {
    return await Auth.getUser(sessionUser)
  } else return null
}

Auth.deleteSession = async function(sessionToken) {
  let sessionUser = await db.get(`session-${sessionToken}`)

  if (!!sessionUser) {
    await db.delete(`session-${sessionToken}`)
    return true
  } else {
    return false
  }
}

Auth.getCurrentUserCount = async function() {
  return Number(await db.get("currentUsers") || "0")
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

module.exports = Auth