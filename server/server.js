const express = require("express");
const models = require("./models");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const schema = require("./schema/schema");
const session = require("express-session");
const passport = require("passport");
const passportConfig = require("./services/auth");
const MongoStore = require("connect-mongo");
const { graphqlHTTP } = require("express-graphql");

const app = express();

// Replace with your Mongo Atlas URI
const MONGO_URI =
  "mongodb+srv://nalinisunderrajan:35WvuAG7jwigSU9c@cluster0.xb7gcok.mongodb.net/lyricalauth?retryWrites=true&w=majority&appName=Cluster0";
if (!MONGO_URI) {
  throw new Error("You must provide a Mongo Atlas URI");
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
    secret: "aaabbbccc",
    store: MongoStore.create({
      dbName: "lyricalauth",
      mongoUrl:
        "mongodb+srv://nalinisunderrajan:35WvuAG7jwigSU9c@cluster0.xb7gcok.mongodb.net/lyricalauth",
    }),
  })
);

// Passport is wired into express as a middleware. When a request comes in,
// Passport will examine the request's session (as set by the above config) and
// assign the current user to the 'req.user' object.  See also servces/auth.js
app.use(passport.initialize());
app.use(passport.session());

app.use(
  "/graphql",
  graphqlHTTP((req) => ({
    schema,
    graphiql: true,
    context: { req },
  }))
);

module.exports = app;
