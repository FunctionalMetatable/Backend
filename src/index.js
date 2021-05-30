const express = require("express");
const fetch = require("node-fetch");
const app = express();
const port = 3000;
const frontendURL = "448me.sse.codesandbox.io";
const backEndURL = "hly3v.sse.codesandbox.io";

app.get("/", (req, res) => {
  res.send("This is the WhenFlagClicked API!");
});

app.get("/auth/begin", (req, res) => {
  res.redirect(
    `https://fluffyscratch.hampton.pw/auth/getKeys/v2?redirect=${Buffer.from(
      `${backEndURL}/auth/handle`
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
    // get the proper case of the username instead of url case

    let scratchResponse = await fetch(
      `https://api.scratch.mit.edu/users/${authData.username}/`
    );
    let scratchData = await scratchResponse.json();

    if (scratchData.code) res.redirect(`//${frontendURL}/login?error=0`);

    res.redirect(`//${frontendURL}/login?token=${privateCode}`);
  } else {
    res.redirect(`//${frontendURL}/login?error=0`); // failed fluffyscratch auth
    // res.json({ error: 'failed fluffyscratch auth' }) // commented out because showing users json for a common error isnt great. instead redirecting to the frontend where they can easily log in again is best
  }
});

app.listen(port, () => console.log(`Listening port ${port}`));
