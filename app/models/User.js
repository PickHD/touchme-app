const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    default:null
  },
  password: {
    type: String,
    default:null
  },
  number: {
    type: String,
    default:null
  },
  googleToken: {
    type: String,
    default: null
  },
  githubToken: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isVerified: {
    type: Boolean,
    default: false,
  }

});

const User = mongoose.model("User", UserSchema);
module.exports = User;
