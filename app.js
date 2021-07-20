const express = require("express");
const app = express();
app.use(express.json());
const {
  models: { User },
} = require("./db");
const path = require("path");

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

// POST Route authenticates the user
// login route
app.post("/api/auth", async (req, res, next) => {
  try { // and returns a token back to the client
    res.send({ token: await User.authenticate(req.body) });
  } catch (ex) {
    next(ex);
  }
});

// route assumes that the authorization header has been set on the request
app.get("/api/auth", async (req, res, next) => {
  try {
    res.send(await User.byToken(req.headers.authorization));
    // verifies the JWT
  } catch (ex) {
    next(ex);
  }
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
