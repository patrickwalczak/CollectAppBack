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

/*
User likes item --> user will have new Item Object.Id in likes array and CollectionItem will have new user Object.Id

Collection item is being deleted --> I remove item and remove Collection Item Object.Id in the user likes array

Collection is being deleted --> I remove all items and for rach removed Collection Item, I have to remove Object.Id in the user likes array

User is being deleted --> I have to find all items which he liked and for rach removed user Object.id, I have to remove Object.Id in the user likes array
*/
