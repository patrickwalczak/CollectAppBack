const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const topicSchema = new Schema({
  title: { type: String },
});

module.exports = mongoose.model("Topic", topicSchema);
