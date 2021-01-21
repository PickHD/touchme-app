const {
  index,
  dashboard,
  notFoundPage,
} = require("../controllers/indexController");
const { isLogged } = require("../middleware/isLogged");

module.exports = (app) => {
  app.get("/", index);
  app.get("/dashboard", [isLogged], dashboard);
  app.get("/not-found", notFoundPage);
};
