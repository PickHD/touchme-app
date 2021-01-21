const {
  getSignup,
  getSignin,
  getRefToken,
  signup,
  signin,
  logout,
  verificationEmail,
  refreshToken,
  getForgPass,
  getResetPass,
  resetPass,
  tokenPass,
} = require("../controllers/authController");

const passport = require("passport")

module.exports = (app) => {
  //!SIGNUP ROUTE
  app.get("/users/register", getSignup);
  app.post("/users/register", signup);

  //!EMAIL VERIFICATION ROUTE
  app.post("/users/resend/token", refreshToken);

  app.get("/users/verification", getRefToken);
  app.get("/users/email-verification", verificationEmail);

  //!RESET PASSWORD ROUTE
  app.post("/users/recover/token", tokenPass);

  app.get("/users/forgot-password", getForgPass);
  app.get("/users/reset-pass", getResetPass);

  app.post("/users/reset/password/:getUserId", resetPass);

  //!USERS LOGIN AND LOGOUT ROUTE

  app.get("/users/login", getSignin);

  //!IF USERS CHOOSE OAUTH 
  app.get("/users/login/oauth/google", passport.authenticate("google", { scope: ["profile"] }))
  app.get("/users/login/oauth/github", passport.authenticate("github", { scope: ["profile"] }))

  app.get('/users/oauth/google/callback',
    passport.authenticate('google', { failureRedirect: '/users/login' }), (req, res) => {
      res.redirect('/dashboard');
    });
  app.get('/users/oauth/github/callback',
    passport.authenticate('github', { failureRedirect: '/users/login' }), (req, res) => {
      res.redirect('/dashboard');
    });

  app.post("/users/login", signin);
  app.get("/logout", logout);
};
