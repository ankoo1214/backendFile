const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true,
  },
  email: {
    type: String,
    require: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    require: true,
  },
  faceDescriptor: {
    type: [Number],
    required: true, 
  },
});

const user = mongoose.model("user", userSchema);

module.exports = user;
