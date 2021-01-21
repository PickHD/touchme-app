const localStategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth").OAuth2Strategy
const GithubStrategy = require("passport-github2").Strategy
const bCrypt = require("bcryptjs");

let cbGoogleURI
let cbGitURI

if (process.env.NODE_ENV === "production") {
  cbGoogleURI = "https://touchme-app.pickhd.repl.co/users/oauth/google/callback"
  cbGitURI = "https://touchme-app.pickhd.repl.co/users/oauth/github/callback"
} else {
  cbGoogleURI = "http://127.0.0.1:4000/users/oauth/google/callback"
  cbGitURI = "http://127.0.0.1:4000/users/oauth/github/callback"
}

//! Load User model
const User = require("../models/User");

module.exports = (passport) => {
  passport.use(
    new localStategy(
      {
        usernameField: "email",
      },
      (email, password, done) => {
        //?Match User
        User.findOne({
          email: email,
        })
          .then((user) => {
            if (!user) {
              return done(null, false, {
                message:
                  "Email Tersebut tidak terdaftar,silahkan register terlebih dahulu",
              });
            }
            if (user.isVerified === false) {
              return done(null, false, {
                message:
                  "Email Tersebut belum terverifikasi,silahkan verifikasi email terlebih dahulu",
              });
            }

            //? Match password
            bCrypt.compare(password, user.password, (err, isMatch) => {
              if (err) throw err;
              if (isMatch) {
                return done(null, user);
              } else {
                return done(null, false, {
                  message: "Password salah,silahkan coba lagi",
                });
              }
            });
          })
          .catch((err) => console.error(err));
      }
    )
  );

  //!Google Strategy 
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: cbGoogleURI
  }, (accessToken, refreshToken, profile, done) => {
    console.log(profile)
    User.create({ name: profile.displayName, googleToken: accessToken })
      .then((user) => {
        user.isVerified = true
        user.save()
        return done(null, user)
      })
      .catch((err) => done(err, null))
  }))

  //! Github Strategy
  passport.use(new GithubStrategy({

    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: cbGitURI

  }, (accessToken, refreshToken, profile, done) => {

    User.create({ name: profile.displayName, email: profile.emails[0].value, githubToken: accessToken })
      .then((user) => {
        user.isVerified = true
        user.save()
        return done(null, user)
      })
      .catch((err) => done(err, null))

  }))

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
      done(err, user);
    });
  });
};
