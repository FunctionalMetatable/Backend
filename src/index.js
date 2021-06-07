/* >>>>> MODULES <<<<< */
require('dotenv').config()
const express = require("express");
const fetch = require("node-fetch");
const cookieParser = require('cookie-parser')
const auth = require('./auth.js')
const Tutorials = require('./Tutorials.js')
const start = (new Date()).getTime()

/* >>>>> SETTINGS <<<<< */

const port = 3000;
const frontendURL = process.env.FRONTEND_URL || "448me.sse.codesandbox.io"
const backendURL = process.env.BACKEND_URL || "hly3v.sse.codesandbox.io"



const app = express();


app.use(cookieParser());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ uptime: ((new Date()).getTime() - start ) / 1000});
});

app.get("/auth/begin", (req, res) => {
  res.redirect(
    `https://fluffyscratch.hampton.pw/auth/getKeys/v2?redirect=${Buffer.from(
      `${backendURL}/auth/handle`
    ).toString("base64")}`
  );
});

app.get("/auth/handle", async (req, res) => {
  // the user is back from hampton's thing.
  const privateCode = req.query.privateCode;

  let authResponse = await fetch(
    "http://fluffyscratch.hampton.pw/auth/verify/v2/" + privateCode
  );
  let authData = await authResponse.json();

  if (authData.valid) {
    var user = await auth.getUser(authData.username);
    if (!user) {
      user = await auth.createUser(authData.username)
    }


    let session = await auth.createSession(user.username)

    res.cookie('token', session, { path: '/' })

    res.redirect(`//${frontendURL}/login?token=${session}`);
  } else {
    res.redirect(`//${frontendURL}/login?error=1`); // failed fluffyscratch auth
  }
});

app.get('/auth/me', auth.middleware('authenticated'), (req, res) => {
  res.json(req.user)
})

app.get('/auth/delete', auth.middleware('authenticated'), async (req, res) => {
  await auth.deleteSession(req.cookies.token)

  res.clearCookie('token', { path: '/' })
  res.status(200).json({ ok: 'logged out' })
})

app.get('/users/:user', async (req, res) => {
  let user = await auth.getUser(req.params.user.replace(/\*/g, '$1'))
  
  user ? res.json(user) : res.status(404).json({ error: 'user not found'})
})

app.put('/tutorial/new', auth.middleware('authenticated'), async (req, res) => {
  let tutorial = await Tutorials.new(req.body.body, req.user)

  res.json(tutorial)
})

app.get('/tutorial/featured', async (req, res) => {
  let tutorial = await Tutorials.raw.findOne({
    featured: true
  })
  
  tutorial ? res.json(tutorial) : res.status(404).json({ error: 'cannot find tutorial'})
})

app.put('/tutorial/featured', auth.middleware('admin'), async (req, res) => {
  // Remove the last featured tutorial if found
  let tutorial = await Tutorials.raw.findOne({
    featured: true
  })
  
  if (tutorial) {
    await Tutorials.raw.update( { id: tutorial.id }, { $set: { featured: false } })
  }
  
  await Tutorials.raw.update( { id: req.body.id }, { $set: { featured: true } });
  
  return res.json({ ok: 'succesfully featured tutorial' })
})

app.get('/tutorial/:id', async (req, res) => {
  let tutorial = await Tutorials.get(req.params.id)
  tutorial ? res.json(tutorial) : res.status(404).json({ error: 'tutorial not found'})
})


app.use((req, res, next) => {
  res.status(404).json({ code: "NotFound", error: `${req.path} is not a valid API endpoint`})
})

app.listen(port, () => console.log(`Listening on port ${port}`));
