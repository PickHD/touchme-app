const nMailer = require("nodemailer");
const { MAIL_HOST, MAIL_USER, MAIL_PASSWORD } = process.env;

exports.transporter = nMailer.createTransport({
  host: MAIL_HOST,
  port: 587,
  ignoreTLS: false,
  secure: false,
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASSWORD,
  },
});
