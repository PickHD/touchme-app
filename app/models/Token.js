const mongoose = require("mongoose");
const moment = require("moment");
const mTimezone = require("moment-timezone");
require("mongodb-moment")(moment);

//!set default timezone
mTimezone.tz.setDefault("Asia/Jakarta");

const TokenSchema = mongoose.Schema({
  token: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    get: function () {
      return moment().locale("id").format("LLLL");
    },
  },

  //!Token will expired in 5 minute
  expireAt: {
    type: Date,
    default: Date.now,
    index: { expires: "5m" },
  },
});

const Token = mongoose.model("Token", TokenSchema);

module.exports = Token;
