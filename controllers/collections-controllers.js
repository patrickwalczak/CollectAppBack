const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const HttpError = require("../models/http-error");
const User = require("../models/user");
const Collection = require("../models/collection");
const CollectionItem = require("../models/collectionItem");

const fs = require("fs");

const createCollection = async (req, res, next) => {
  const errors = validationResult(req);
  const { userId: whoCreates } = req.userData;
  const { userId } = req.params;

  const {
    customTextFieldsNames,
    customNumberFieldsNames,
    customMultilineTextFieldsNames,
    customDateFieldsNames,
    customBooleanFieldsNames,
    collectionName,
    collectionDescription,
    collectionTopic,
  } = req.body;

  const checkCustomFieldNames = (valueToTest) => {
    if (Array.isArray(valueToTest)) {
      return valueToTest;
    }

    if (!valueToTest.length) {
      return [];
    }
    if (!!valueToTest.length) {
      return [valueToTest];
    }

    return next(
      new HttpError(
        "Invalid collection data was passed, please check your data.",
        422
      )
    );
  };

  const testedCustomTextFieldsNames = checkCustomFieldNames(
    customTextFieldsNames
  );
  const testedCustomNumberFieldsNames = checkCustomFieldNames(
    customNumberFieldsNames
  );
  const testedCustomMultilineTextFieldsNames = checkCustomFieldNames(
    customMultilineTextFieldsNames
  );
  const testedCustomDateFieldsNames = checkCustomFieldNames(
    customDateFieldsNames
  );
  const testedCustomBooleanFieldsNames = checkCustomFieldNames(
    customBooleanFieldsNames
  );

  if (!errors.isEmpty()) {
    return next(
      new HttpError(
        "Invalid collection data was passed, please check your data.",
        422
      )
    );
  }

  if (!userId) {
    return next(new HttpError("User ID was not provided!", 400));
  }

  let creator;
  try {
    creator = await User.findById(whoCreates, "id status userType");
  } catch (err) {
    const error = new HttpError(
      "Creating collection failed, please try again.",
      500
    );
    return next(error);
  }

  if (!creator) {
    const error = new HttpError("Could not find user for provided ID", 404);
    return next(error);
  }

  if (creator.id !== userId && creator.userType !== "admin") {
    const error = new HttpError(
      "You can only create collections on your account!",
      500
    );
    return next(error);
  }

  if (creator.status === "blocked") {
    const error = new HttpError("You account is blocked!", 400);
    return next(error);
  }

  let foundUser;
  try {
    foundUser = await User.findById(userId, "id collections status");
  } catch (err) {
    const error = new HttpError(
      "Creating collection failed, please try again.",
      500
    );
    return next(error);
  }

  if (!foundUser) {
    const error = new HttpError("Could not find user for provided id.", 404);
    return next(error);
  }

  if (foundUser.status === "blocked") {
    const error = new HttpError("You account is blocked!", 400);
    return next(error);
  }

  const createdCollection = new Collection({
    collectionName,
    collectionDescription,
    collectionTopic,
    collectionImage: req?.file?.path || "",
    collectionCustomItem: {
      textFields: testedCustomTextFieldsNames,
      numberFields: testedCustomNumberFieldsNames,
      multilineTextFields: testedCustomMultilineTextFieldsNames,
      dateFields: testedCustomDateFieldsNames,
      booleanFields: testedCustomBooleanFieldsNames,
    },
    author: foundUser,
    items: [],
    numberOfItems: 0,
  });

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdCollection.save({ session: sess });
    foundUser.collections.push(createdCollection);
    await foundUser.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Creating collection failed, please try again.",
      500
    );
    return next(error);
  }

  res
    .status(201)
    .json({ message: "Collection has been created successfully!" });
};

const getCollectionsByUserId = async (req, res, next) => {
  const { userId } = req.params;
  let userAccount;

  try {
    userAccount = await User.findById(userId, "username").populate(
      "collections",
      "-collectionCustomItem -items"
    );
  } catch (err) {
    const error = new HttpError(
      "Fetching collections failed, please try again later.",
      500
    );
    return next(error);
  }

  if (!userAccount) {
    return next(
      new HttpError("Could not find collections for the provided user id.", 404)
    );
  }

  res.json({
    collections: userAccount.collections.map((collections) =>
      collections.toObject({ getters: true })
    ),
    username: userAccount.username,
  });
};

const editCollection = async (req, res, next) => {
  const { collectionId } = req.params;
  const { userId: whoCreates } = req.userData;
  const { collectionName, collectionDescription, collectionTopic } = req.body;

  let creator, collectionToEdit;
  try {
    creator = await User.findById(whoCreates, "id status userType");
    collectionToEdit = await Collection.findById(collectionId, "").populate(
      "author",
      "id"
    );
  } catch (err) {
    const error = new HttpError(
      "Editing collection failed, please try again.",
      500
    );
    return next(error);
  }

  if (!creator) {
    const error = new HttpError("Could not find user!", 404);
    return next(error);
  }

  if (
    creator.id !== collectionToEdit.author.id &&
    creator.userType !== "admin"
  ) {
    const error = new HttpError(
      "You can only edit collections on your account!",
      400
    );
    return next(error);
  }

  if (creator.status === "blocked") {
    const error = new HttpError("You account is blocked!", 400);
    return next(error);
  }

  let collection;
  try {
    collection = await Collection.findByIdAndUpdate(collectionId, {
      collectionName: collectionName,
      collectionDescription: collectionDescription,
      collectionTopic: collectionTopic,
    });
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not edit collection!",
      500
    );
    return next(error);
  }

  res
    .status(200)
    .json({ message: "Collection has been updated successfully!" });
};

const deleteCollection = async (req, res, next) => {
  const { collectionId } = req.params;
  const { userId: whoRequested } = req.userData;

  let collection, editor;

  try {
    editor = await User.findById(whoRequested, "id userType status").populate(
      "collections",
      "id"
    );
    collection = await Collection.findById(collectionId)
      .populate("author", "id collections")
      .populate("items");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete collection.",
      500
    );
    return next(error);
  }

  if (!collection) {
    const error = new HttpError("Could not find collection for this id!", 404);
    return next(error);
  }

  if (!editor) {
    const error = new HttpError("Could not find user!", 404);
    return next(error);
  }

  if (editor.status === "blocked") {
    const error = new HttpError("You account is blocked!", 400);
    return next(error);
  }

  const doEditorHaveCollection = editor.collections.find(
    ({ id }) => id === collectionId
  );

  if (!doEditorHaveCollection && editor.userType !== "admin") {
    const error = new HttpError(
      "You can only delete collections on your account!",
      400
    );
    return next(error);
  }

  const imagePath = collection.collectionImage;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await collection.remove({ session: sess });
    collection.author.collections.pull(collection);
    await CollectionItem.deleteMany({
      belongsToCollection: collection.id,
    });
    await collection.author.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete collection.",
      500
    );
    return next(error);
  }

  fs.unlink(imagePath, (err) => console.log(err));

  res.status(200).json({ message: "Collection has been deleted!" });
};

const getCollectionById = async (req, res, next) => {
  const { collectionId } = req.params;

  if (!collectionId) {
    const error = new HttpError("Collection ID was not provided.", 404);
    return next(error);
  }

  let collection;
  try {
    collection = await Collection.findById(
      collectionId,
      "collectionCustomItem author"
    ).populate("items", "itemData tags name");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not provide collection.",
      500
    );
    next(error);
  }

  if (!collection) {
    const error = new HttpError(
      "Something went wrong, could not find collection for provided ID.",
      404
    );
    return next(error);
  }

  res.status(200).json({ collection: collection.toObject({ getters: true }) });
};

const getLargestCollections = async (req, res, next) => {
  let largestCollections;

  try {
    largestCollections = await Collection.find(
      {},
      "id collectionName numberOfItems"
    )
      .sort({
        numberOfItems: -1,
      })
      .limit(5)
      .populate("author", "username");
  } catch (err) {
    const error = new HttpError("Fetching largest collections failed!", 500);
    next(error);
  }

  const convertedCollections = largestCollections.map(
    ({ id, author, collectionName, numberOfItems }) => ({
      id,
      author: author.username,
      collectionName,
      firstHeading: numberOfItems,
    })
  );

  res.status(201).json({
    largestCollections: convertedCollections,
  });
};

exports.getLargestCollections = getLargestCollections;
exports.getCollectionsByUserId = getCollectionsByUserId;
exports.getCollectionById = getCollectionById;
exports.createCollection = createCollection;
exports.editCollection = editCollection;
exports.deleteCollection = deleteCollection;
