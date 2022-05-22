const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const HttpError = require("../models/http-error");
const User = require("../models/user");
const Collection = require("../models/collection");
const CollectionItem = require("../models/collectionItem");

const createItem = async (req, res, next) => {
  const { collectionId } = req.params;
  const { userId: whoCreates } = req.userData;
  const { name, tags, ...formData } = req.body;

  if (!collectionId) {
    return next(new HttpError("Collection ID was not provided!", 422));
  }

  let foundCollection, creator;
  try {
    creator = await User.findById(whoCreates, "id status userType");
    foundCollection = await Collection.findById(
      collectionId,
      "items id numberOfItems"
    ).populate("author", "id");
  } catch (err) {
    const error = new HttpError("Creating item failed, please try again.", 500);
    return next(error);
  }

  if (!foundCollection) {
    const error = new HttpError(
      "Could not find collection for provided id.",
      404
    );
    return next(error);
  }

  if (!creator) {
    const error = new HttpError("Could not find user for provided ID", 404);
    return next(error);
  }

  if (
    creator.id !== foundCollection.author.id &&
    creator.userType !== "admin"
  ) {
    const error = new HttpError(
      "You can only create items on your account!",
      400
    );
    return next(error);
  }

  if (creator.status === "blocked") {
    const error = new HttpError("You account is blocked!", 400);
    return next(error);
  }

  const creationDate = Date.now();

  const createdCollectionItem = new CollectionItem({
    belongsToCollection: foundCollection,
    name,
    tags,
    creationDate,
    itemData: formData,
    comments: [],
    likes: [],
  });

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdCollectionItem.save({ session: sess });
    foundCollection.items.push(createdCollectionItem);
    foundCollection.numberOfItems = foundCollection.numberOfItems + 1;
    await foundCollection.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Creating !!! collection item failed, please try again.",
      500
    );
    return next(error);
  }

  res.status(201).json({ message: "Item has been created successfully!" });
};

const editItem = async (req, res, next) => {
  const { itemId } = req.params;
  const { name, tags, ...formData } = req.body;
  const { userId: whoCreates } = req.userData;

  let creator, itemToUpdate;
  try {
    creator = await User.findById(whoCreates, "id status userType").populate(
      "collections",
      "author id"
    );
    itemToUpdate = await CollectionItem.findById(itemId, "belongsToCollection");
  } catch (err) {
    const error = new HttpError("Editing item failed, please try again.", 500);
    return next(error);
  }

  if (!creator) {
    const error = new HttpError("Could not find user!", 404);
    return next(error);
  }

  if (!itemToUpdate) {
    const error = new HttpError("Could not find item!", 404);
    return next(error);
  }

  if (creator.status === "blocked") {
    const error = new HttpError("You account is blocked!", 400);
    return next(error);
  }

  const doItemBelongsToCreator = creator.collections.find(
    ({ id }) => id === itemToUpdate.belongsToCollection.toString()
  );

  if (!doItemBelongsToCreator && creator.userType !== "admin") {
    const error = new HttpError(
      "You can only edit items on your account!",
      400
    );
    return next(error);
  }

  let collectionItem;
  try {
    collectionItem = await CollectionItem.findByIdAndUpdate(itemId, {
      itemData: formData,
      name,
      tags,
    });
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not edit item!",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "Item has been updated successfully!" });
};

const deleteItem = async (req, res, next) => {
  const { itemId } = req.params;
  const { userId: whoRequested } = req.userData;

  let item, editor;
  try {
    item = await CollectionItem.findById(itemId).populate(
      "belongsToCollection",
      "items numberOfItems"
    );
    editor = await User.findById(whoRequested, "id userType status").populate(
      "collections",
      "id"
    );
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete item.",
      500
    );
    return next(error);
  }

  if (!item) {
    const error = new HttpError("Could not find item for this id!", 404);
    return next(error);
  }

  if (!editor) {
    const error = new HttpError("Could not find item for this id!", 404);
    return next(error);
  }

  const doEditorHaveItem = editor.collections.find(
    ({ id }) => id === item.belongsToCollection.id
  );

  if (!doEditorHaveItem && editor.userType !== "admin") {
    const error = new HttpError(
      "You can only delete items on your account!",
      400
    );
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await item.remove({ session: sess });
    item.belongsToCollection.items.pull(item);
    item.belongsToCollection.numberOfItems =
      item.belongsToCollection.numberOfItems - 1;
    await item.belongsToCollection.save({ session: sess });

    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Something went wrong, could not delete collection.",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "Item has been deleted!" });
};

const getItemById = async (req, res, next) => {
  const { itemId } = req.params;

  let item;
  try {
    item = await CollectionItem.findById(itemId, "-creationDate");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not fetch item.",
      500
    );
    next(error);
  }
  if (!item) {
    const error = new HttpError(
      "Something went wrong, could not find item for provided ID.",
      404
    );
    return next(error);
  }

  res.status(200).json({ item: item.toObject({ getters: true }) });
};

const addComment = async (req, res, next) => {
  const { itemId } = req.params;
  const { userId: whoCreates } = req.userData;
  const { comment, author } = req.body;

  if (!itemId) {
    const error = new HttpError("Item ID was not provided.", 404);
    return next(error);
  }

  let creator;
  try {
    creator = await User.findById(whoCreates, "username ");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not add comment!",
      500
    );
    next(error);
  }

  if (creator.username.toLowerCase() !== author.toLowerCase()) {
    const error = new HttpError(
      "Something went wrong, could not add comment!",
      404
    );
    next(error);
  }

  let item;
  try {
    item = await CollectionItem.findById(itemId, "comments");
    item.comments.push({ comment, author });
    await item.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not add comment",
      500
    );
    next(error);
  }

  if (!item) {
    const error = new HttpError(
      "Something went wrong, could not find item for provided ID.",
      404
    );
    next(error);
  }

  res.status(200).json({ message: "Comment has been added successfully!" });
};

const likeItem = async (req, res, next) => {
  const { itemId } = req.params;
  const { userId: whoLiked } = req.userData;

  if (!itemId) {
    const error = new HttpError("Item ID was not provided.", 404);
    next(error);
  }

  let collectionItem, user;
  try {
    user = await User.findById(whoLiked, "id status likes");
    collectionItem = await CollectionItem.findById(itemId, "id likes");
  } catch (err) {
    const error = new HttpError("Liking item failed!", 500);
    next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided ID", 404);
    return next(error);
  }

  if (!collectionItem) {
    const error = new HttpError("Could not find item for provided ID", 404);
    return next(error);
  }

  const checkIfUserAlreadyLikedItem = user.likes.find((id) => id === itemId);

  if (checkIfUserAlreadyLikedItem) {
    const error = new HttpError("User already liked this item", 404);
    return next(error);
  }

  try {
    collectionItem, user;
    const sess = await mongoose.startSession();
    sess.startTransaction();
    user.likes.push(collectionItem);
    await user.save({ session: sess });
    collectionItem.likes.push(user);
    await collectionItem.save({ session: sess });

    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Creating collection failed, please try again.",
      500
    );
    return next(error);
  }

  res.status(201).json({ message: "Item has been liked successfully!" });
};

const removeLike = async (req, res, next) => {
  const { itemId } = req.params;
  const { userId: whoLiked } = req.userData;

  if (!itemId) {
    const error = new HttpError("Item ID was not provided.", 404);
    next(error);
  }

  let collectionItem, user;
  try {
    user = await User.findById(whoLiked, "id status likes");
    collectionItem = await CollectionItem.findById(itemId, "id likes");
  } catch (err) {
    const error = new HttpError("Liking item failed!", 500);
    next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided ID", 404);
    return next(error);
  }

  if (!collectionItem) {
    const error = new HttpError("Could not find item for provided ID", 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    user.likes.pull(collectionItem);
    await user.save({ session: sess });
    collectionItem.likes.pull(user);
    await collectionItem.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Creating collection failed, please try again.",
      500
    );
    return next(error);
  }

  res.status(201).json({ message: "Like has been removed successfully" });
};

const getLatestItems = async (req, res, next) => {
  let latestItems;
  let authorsUsernames = [];
  try {
    latestItems = await CollectionItem.find({}, "name")
      .sort({
        creationDate: -1,
      })
      .limit(10)
      .populate("belongsToCollection", "collectionName author");
    const authors = latestItems.map(
      ({ belongsToCollection }) => belongsToCollection.author
    );
    for (const author of authors) {
      const user = await User.findById(author.toString(), "username");
      authorsUsernames.push(user);
    }
  } catch (err) {
    const error = new HttpError("Fetching latest items failed!", 500);
    next(error);
  }

  const convertedItems = latestItems.map(
    ({ id, name, belongsToCollection }, index) => ({
      firstHeading: name,
      id,
      collectionName: belongsToCollection.collectionName,
      author: authorsUsernames[index].username,
    })
  );

  res.status(201).json({
    latestItems: convertedItems,
  });
};

const getFullTextSearchResults = async (req, res, next) => {
  const { query } = req.params;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError("No search query was provided!", 404));
  }

  let items;
  try {
    items = await CollectionItem.aggregate([
      {
        $search: {
          index: "collectionItemIndex",
          text: {
            query: query,
            path: {
              wildcard: "*",
            },
          },
        },
      },
    ]);
  } catch (err) {
    console.log(err);
    return next(new HttpError("Could not fetch results!", 404));
  }

  const convertedItems = items.map(({ _id, name }) => ({
    id: _id.toString(),
    name,
  }));

  res.status(201).json({
    results: convertedItems,
  });
};

exports.createItem = createItem;
exports.editItem = editItem;
exports.deleteItem = deleteItem;
exports.getItemById = getItemById;
exports.addComment = addComment;
exports.likeItem = likeItem;
exports.removeLike = removeLike;
exports.getLatestItems = getLatestItems;
exports.getFullTextSearchResults = getFullTextSearchResults;
