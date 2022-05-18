const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true, minlength: 2 },
  userType: { type: String },
  status: { type: String },
  lastLoginTime: { type: Number, required: true },
  registrationTime: { type: Number, required: true },
  collections: [
    { type: mongoose.Types.ObjectId, required: true, ref: "Collection" },
  ],
  likes: [
    { type: mongoose.Types.ObjectId, required: true, ref: "CollectionItem" },
  ],
});

module.exports = mongoose.model("User", userSchema);
