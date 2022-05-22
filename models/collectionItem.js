const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const collectionItemSchema = new Schema({
  name: { type: String, required: true },
  tags: { type: Array, required: true },
  belongsToCollection: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "Collection",
  },
  creationDate: { type: Number, required: true },
  itemData: { type: Object, required: true },
  comments: { type: Array, required: true },
  likes: [{ type: mongoose.Types.ObjectId, required: true, ref: "User" }],
});

module.exports = mongoose.model("CollectionItem", collectionItemSchema);
