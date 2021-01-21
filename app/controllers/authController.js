const bCrypt = require("bcryptjs");
const crypto = require("crypto");
const path = require("path");
const ejs = require("ejs");
const passport = require("passport");

//!IMPORT MODELS
const User = require("../models/User");
const Token = require("../models/Token");

const { transporter } = require("../config/smtpConfig");

//!RENDERING PAGE
exports.getSignup = (req, res) => {
  res.render("register");
};
exports.getSignin = (req, res) => {
  res.render("login");
};
exports.getRefToken = (req, res) => {
  res.render("refToken");
};
exports.getForgPass = (req, res) => {
  res.render("forgPass");
};

//?REGISTER HANDLER
exports.signup = async (req, res) => {
  try {
    //!VALIDATION
    const { name, email, number, password, password2 } = req.body;

    let errors = [];

    if (!password.match(/([0-9])/)) {
      errors.push({ msg: "Password harus berisi angka" });
    }
    if (!password.match(/([A-Z])/)) {
      errors.push({ msg: "Password harus berisi setidaknya 1 huruf kapital" });
    }

    if (password !== password2) {
      errors.push({ msg: "Password tidak cocok" });
    }

    if (errors.length > 0) {
      res.render("register", {
        errors,
        name,
        email,
        number,
        password,
        password2,
      });
    } else {
      //? if Validation passed
      const getEmail = await User.findOne({
        email: email,
      });
      if (getEmail) {
        errors.push({
          msg:
            "Email tersebut sudah terpakai , coba untuk menggunakan email yang lain",
        });
        res.render("register", {
          errors,
          name,
          email,
          number,
          password,
          password2,
        });
      } else {
        const newUser = new User({
          name,
          email,
          number,
          password,
        });
        const hashedPass = await bCrypt.hash(newUser.password, 8);

        newUser.password = hashedPass;
        await newUser.save();

        //!CREATE TOKEN
        const newToken = new Token({
          token: crypto.randomBytes(16).toString("hex"),
          userId: newUser._id,
        });
        await newToken.save();

        ejs.renderFile(
          path.join(__dirname, "../views/verifEmailTemplate.ejs"),
          {
            getUser: newUser.name,
            getHost: req.headers.host,
            getToken: newToken.token,
            getDate: newToken.createdAt,
          },
          (err, data) => {
            if (err) {
              req.flash("error_msg", `${err.message}`);
              res.redirect("/users/login");
              return;
            } else {
              let mailOptions = {
                from: "NO-REPLY <taufikjanuar35@gmail.com>",
                to: newUser.email,
                subject: `${newUser.name},Mohon Untuk Verifikasi Email Anda`,
                html: data,
              };
              //?SEND EMAIL TO USER
              transporter.sendMail(mailOptions, (err) => {
                //!if error
                if (err) {
                  req.flash("error_msg", `${err.message}`);
                  res.redirect("/users/login");
                  return;
                }
                //!send success response
                req.flash(
                  "info_msg",
                  `Verifikasi Email telah terkirim ke akun ${newUser.email}, silahkan untuk verifikasi terlebih dahulu.`
                );
                res.redirect("/users/login");
              });
            }
          }
        );
      }
    }
  } catch (err) {
    req.flash("error_msg", `${err.message}`);
    res.redirect("/users/login");
    return;
  }
};

//?RESEND TOKEN VERIFICATION HANDLER
exports.refreshToken = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      req.flash("error_msg", "Email harus diisi ");
      res.redirect("/users/verification");
      return;
    }
    const getEmail = await User.findOne({
      email: email,
    });
    if (!getEmail) {
      req.flash("error_msg", "Email tidak ditemukan,silahkan coba lagi ");
      res.redirect("/users/verification");
      return;
    }

    //? if got email user,create token and send email again use nodemailer transporter

    //!CREATE TOKEN
    const refToken = new Token({
      token: crypto.randomBytes(16).toString("hex"),
      userId: getEmail._id,
    });
    await refToken.save();

    ejs.renderFile(
      path.join(__dirname, "../views/verifEmailTemplate.ejs"),
      {
        getUser: getEmail.name,
        getHost: req.headers.host,
        getToken: refToken.token,
        getDate: refToken.createdAt,
      },
      (err, data) => {
        if (err) {
          req.flash("error_msg", `${err.message}`);
          res.redirect("/users/verification");
          return;
        } else {
          let mailOptions = {
            from: "NO-REPLY <taufikjanuar35@gmail.com>",
            to: getEmail.email,
            subject: `${getEmail.name},Mohon Untuk Verifikasi Email Anda`,
            html: data,
          };
          //?SEND EMAIL TO USER
          transporter.sendMail(mailOptions, (err) => {
            //!if error
            if (err) {
              req.flash("error_msg", `${err.message}`);
              res.redirect("/users/verfication");
              return;
            }
            //!send success response
            req.flash(
              "info_msg",
              `Verifikasi Email telah terkirim ke akun ${getEmail.email}, silahkan untuk verifikasi terlebih dahulu.`
            );
            res.redirect("/users/login");
          });
        }
      }
    );
  } catch (err) {
    req.flash("error_msg", `${err.message}`);
    res.redirect("/users/verification");
    return;
  }
};
//!CATCH TOKEN AND ACTION HANDLER
exports.verificationEmail = (req, res) => {
  const { getToken } = req.query;
  Token.findOne({
    token: getToken,
  }).then((token) => {
    const link = "/users/verification";
    if (!token) {
      req.flash(
        "error_msg",
        `Token anda sudah tidak valid,silahkan untuk meminta token kembali <a href="${link}" class="alert-link">Link</a> ini`
      );
      res.redirect("/users/login");
      return;
    }
    //?UPDATE USER FIELDS ISVERIFIED SET TO TRUE
    User.findOneAndUpdate(
      { _id: token.userId },
      { isVerified: true },
      { useFindAndModify: false }
    )
      .populate("Token")
      .then((user) => {
        if (!user) {
          req.flash(
            "error_msg",
            `Verifikasi Email Anda gagal,silahkan coba verifikasi kembali `
          );
          res.redirect("/users/login");
          return;
        } else {
          req.flash(
            "success_msg",
            `Verifikasi Email Anda telah berhasil, silahkan untuk login `
          );
          res.redirect("/users/login");
        }
      })
      .catch((err) => {
        req.flash("error_msg", `${err.message}`);
        res.redirect("/users/login");
        return;
      });
  });
};

//?RESET TOKEN PASS HANDLER
exports.tokenPass = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      req.flash("error_msg", "Email harus diisi ");
      res.redirect("/users/forgot-password");
      return;
    }
    const getEmail = await User.findOne({
      email: email,
    });
    if (!getEmail) {
      req.flash("error_msg", "Email tidak ditemukan,silahkan coba lagi ");
      res.redirect("/users/forgot-password");
      return;
    } else {
      //!CREATE TOKEN PASS
      const newTokenPass = new Token({
        token: crypto.randomBytes(16).toString("hex"),
        userId: getEmail._id,
      });
      await newTokenPass.save();

      ejs.renderFile(
        path.join(__dirname, "../views/resetPassTemplate.ejs"),
        {
          getUser: getEmail.name,
          getHost: req.headers.host,
          getToken: newTokenPass.token,
          getDate: newTokenPass.createdAt,
        },
        (err, data) => {
          if (err) {
            req.flash("error_msg", `${err.message}`);
            res.redirect("/users/forgot-password");
            return;
          } else {
            let mailOptions = {
              from: "NO-REPLY <taufikjanuar35@gmail.com>",
              to: getEmail.email,
              subject: `${getEmail.name},Mohon Untuk Konfirmasi Reset Password Anda`,
              html: data,
            };
            //?SEND EMAIL TO USER
            transporter.sendMail(mailOptions, (err) => {
              //!if error
              if (err) {
                req.flash("error_msg", `${err.message}`);
                res.redirect("/users/forgot-password");
                return;
              }
              //!send success response
              req.flash(
                "info_msg",
                `Konfirmasi Reset Password telah terkirim ke akun ${getEmail.email}, silahkan untuk dicek terlebih dahulu.`
              );
              res.redirect("/users/login");
            });
          }
        }
      );
    }
  } catch (err) {
    req.flash("error_msg", `${err.message}`);
    res.redirect("/users/verification");
    return;
  }
};

//!CATCH TOKEN AND ACTION HANDLER
exports.getResetPass = (req, res) => {
  const { getToken } = req.query;
  Token.findOne({
    token: getToken,
  }).then((token) => {
    const link = "/users/forgot-password";
    if (!token) {
      req.flash(
        "error_msg",
        `Token anda sudah kadaluarsa,silahkan coba meminta token <a href="${link}" class="alert-link">Link</a> ini`
      );
      res.redirect("/users/login");
      return;
    }
    res.render("resetPassword", {
      getUser: token.userId,
    });
  });
};
exports.resetPass = async (req, res) => {
  const { password, password2 } = req.body;
  const { getUserId } = req.params;
  try {
    let errors = [];

    if (password.length < 7) {
      errors.push({ msg: "Password harus lebih dari 7 Karakter" });
    }
    if (!password.match(/([0-9])/)) {
      errors.push({ msg: "Password harus berisi angka" });
    }
    if (!password.match(/([A-Z])/)) {
      errors.push({
        msg: "Password harus berisi setidaknya 1 huruf kapital",
      });
    }
    if (password !== password2) {
      errors.push({ msg: "Password tidak cocok" });
    }

    if (errors.length > 0) {
      return res.render("resetPassword", {
        errors,
        password,
        password2,
        getUser: getUserId,
      });
    } else {
      const hashedPass = await bCrypt.hash(password, 8);
      User.findByIdAndUpdate(
        { _id: getUserId },
        { password: hashedPass },
        { useFindAndModify: false }
      ).then((user) => {
        if (!user) {
          req.flash(
            "error_msg",
            `Gagal mengupdate password!,silahkan coba lagi`
          );
          res.redirect("/users/reset-pass");
          return;
        }
        req.flash("success_msg", `Berhasil mengupdate password,Silahkan login`);
        res.redirect("/users/login");
      });
    }
  } catch (err) {
    req.flash("error_msg", `${err.message}`);
    res.redirect("/users/reset-pass");
    return;
  }
};

//?LOGIN HANDLER
exports.signin = (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/users/login",
    badRequestMessage: "Semua fields harus diisi",
    failureFlash: true,
    successFlash: true,
  })(req, res, next);
};

//?LOGOUT HANDLER
exports.logout = (req, res) => {
  req.logout();
  req.flash("success_msg", "Berhasil Logout!");
  res.redirect("/users/login");
};
