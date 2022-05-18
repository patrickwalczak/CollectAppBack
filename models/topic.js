const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const topicSchema = new Schema({
  title: { type: String, unique: true },
});

topicSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Topic", topicSchema);
