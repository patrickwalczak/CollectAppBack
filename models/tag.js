const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const tagSchema = new Schema({
  title: { type: String, unique: true },
});

tagSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Tag", tagSchema);
