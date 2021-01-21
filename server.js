const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const session = require("express-session");
const passport = require("passport");

const expLayouts = require("express-ejs-layouts");
const flash = require("connect-flash");
const favicon = require("serve-favicon");

require("dotenv").config()

//!IMPORT PASSPORT CONFIG
require("./app/config/passport")(passport);

//! Connect to Mongo
mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(console.log("MongoDB Connected !"))
  .catch((err) => console.error(err));

const app = express();

//!Bodyparser
app.use(express.urlencoded({ extended: false }));
//! Set public files path
app.use(express.static(path.join(__dirname, "./app/public/")));
//!Set Favicon
app.use(favicon(path.join(__dirname, "./app/public/favicon.ico")));

//! Express Session Middleware
app.use(
  session({
    secret: "ihavenosecret",
    resave: true,
    saveUninitialized: true,
  })
);

//! Passport initialize & session
app.use(passport.initialize());
app.use(passport.session());

//! Connect Flash
app.use(flash());

//! Create Globals Vars
app.use((req, res, next) => {
  res.locals.info_msg = req.flash("info_msg");
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

//!EJS
app.use(expLayouts);
app.set("views", path.join(__dirname, "./app/views"));
app.set("view engine", "ejs");

//! ROUTES
require("./app/routes/index")(app);
require("./app/routes/users")(app);
require("./app/middleware/notFound")(app);

app.listen(process.env.PORT || 4000, () => {
  console.log("Server is running on port : " + process.env.PORT);
});
