module.exports = (app) => {
  app.use((req, res, next) => {
    //? if route not found or not match,return a error response
    if (!req.route) {
      req.flash("error_msg", "Halaman Tidak Ditemukan");
      res.redirect("/not-found");
    }
    next();
  });
};
