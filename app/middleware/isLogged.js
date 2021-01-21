isLogged = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("error_msg", "Mohon untuk login terlebih dahulu");

  res.redirect("/users/login");
};

const isLogUser = {
  isLogged: isLogged,
};

module.exports = isLogUser;
