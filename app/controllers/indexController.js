exports.index = (req, res) => {
  res.render("welcome");
};
exports.dashboard = (req, res) => {
  res.render("dashboard", {
    nameUser: req.user.name,
  });
};
exports.notFoundPage = (req, res) => {
  res.render("notFound");
};
