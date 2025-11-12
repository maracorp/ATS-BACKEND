require("dotenv").config();
const express = require("express");
const models = require("./models");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const schema = require("./schema/schema");
const session = require("express-session");
const passport = require("passport");
const passportConfig = require("./services/auth");
const MongoStore = require("connect-mongo");

const app = express();

// Load MongoDB URI from environment variables
const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) {
  throw new Error("MONGODB_URI environment variable is not set. Please check your .env file.");
}

mongoose.Promise = global.Promise;
mongoose.connect(MONGO_URI);
mongoose.connection
  .once("open", () => console.log("Connected to Mongo Atlas instance."))
  .on("error", (error) =>
    console.log("Error connecting to Mongo Atlas:", error)
  );

// Configures express to use sessions.  This places an encrypted identifier
// on the users cookie.  When a user makes a request, this middleware examines
// the cookie and modifies the request object to indicate which user made the request
// The cookie itself only contains the id of a session; more data about the session
// is stored inside of MongoDB.
app.use(
  session({
    resave: true,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET || "default-secret-change-this",
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
    }),
  })
);

// Passport is wired into express as a middleware. When a request comes in,
// Passport will examine the request's session (as set by the above config) and
// assign the current user to the 'req.user' object.  See also servces/auth.js
app.use(passport.initialize());
app.use(passport.session());

// GraphQL endpoint will be configured in index.js with Apollo Server
// This allows session and passport middleware to run first

module.exports = { app, schema };
