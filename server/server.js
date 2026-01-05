require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const MongoStore = require("connect-mongo");

const app = express();

/* 🔑 REQUIRED FOR RENDER */
app.set("trust proxy", 1);

/* MongoDB */
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.once("open", () =>
  console.log("Connected to Mongo Atlas instance.")
);

/* 🔑 SESSION CONFIG (FINAL) */
app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET || "default-secret-change-this",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
    }),
    cookie: {
      httpOnly: true,
      secure: true,      // HTTPS only
      sameSite: "none",  // cross-origin (Vercel → Render)
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

/* Passport */
app.use(passport.initialize());
app.use(passport.session());

module.exports = { app };
