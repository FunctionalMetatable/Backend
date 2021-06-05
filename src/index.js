/* >>>>> MODULES <<<<< */
const express = require("express");
const fetch = require("node-fetch");
const cookieParser = require('cookie-parser')
const auth = require('./auth.js')
const Tutorials = require('./Tutorials.js')
const start = (new Date()).getTime()

/* >>>>> SETTINGS <<<<< */

const port = 3000;
const frontendURL = "localhost:3000";
const backendURL = "localhost:3000";



const app = express();

app.use(cookieParser())

app.get("/", (req, res) => {
  res.send({ uptime: ((new Date()).getTime() - start ) / 1000});
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
  console.log(req.get('Host'))
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

app.get('/auth/me', auth.authMiddleware, async (req, res) => {
  res.json(req.user)
})

app.get('/auth/delete', auth.authMiddleware, async (req, res) => {
  await auth.deleteSession(req.cookies.token)

  res.clearCookie('token', { path: '/' })
  res.status(200).json({ ok: 'logged out' })
})

app.get('/users/:user', async (req, res) => {
  let user = await auth.getUser(req.params.user.replace('*', '$1'))
  
  user ? res.json(user) : res.status(404).json({ error: 'user not found'})
})

app.put('/tutorial/new', auth.authMiddleware, async (req, res) => {
  let tutorial = Tutorials.new(req.body, req.user)

  res.json(tutorial)
})

app.get('/tutorial/:id', async (req, res) => {
  let tutorial = await Tutorials.get(req.params.id)
  tutorial ? res.json(tutorial) : res.status(404).json({ error: 'tutorial not found'})
})

app.use((req, res, next) => {
  res.json({ code: "NotFound", error: `${req.path} is not a valid API endpoint`})
})

app.listen(port, () => console.log(`Listening on port ${port}`));
