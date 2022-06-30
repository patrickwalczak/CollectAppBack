const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const collectionSchema = new Schema({
  author: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  collectionName: { type: String, required: true },
  collectionDescription: { type: String, required: true },
  collectionTopic: { type: String, required: true },
  collectionCustomItem: { type: Object, required: true },
  collectionImage: { type: String },
  items: [
    { type: mongoose.Types.ObjectId, required: true, ref: "CollectionItem" },
  ],
  numberOfItems: { type: Number, required: true },
});

module.exports = mongoose.model("Collection", collectionSchema);
