const HttpError = require("../models/http-error");
const User = require("../models/user");
const Collection = require("../models/collection");
const CollectionItem = require("../models/collectionItem");
const mongoose = require("mongoose");

const getUsers = async (req, res, next) => {
  const { userId: loggedUserId } = req.userData;

  let users, whoRequested;
  try {
    users = await User.find({}, "-password -collections");
    whoRequested = await User.findById(loggedUserId, "status userType");
  } catch (err) {
    const error = new HttpError(
      "Fetching users failed, please try again later.",
      500
    );
    return next(error);
  }

  if (!whoRequested?.userType || whoRequested?.userType !== "admin") {
    const error = new HttpError("You don't have access to users data!", 400);
    return next(error);
  }

  if (!whoRequested?.status || whoRequested?.status === "blocked") {
    const error = new HttpError("Your account is blocked!", 400);
    return next(error);
  }

  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const updateUsersAccounts = async (req, res, next) => {
  const { users, ...propertyToUpdate } = req.body;
  const { userId: loggedUserId } = req.userData;

  if (!users.length) {
    const error = new HttpError("None of the users have been selected!", 400);
    return next(error);
  }

  let whoRequested;
  try {
    whoRequested = await User.findById(loggedUserId, "userType status");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update user account.",
      500
    );
    return next(error);
  }

  if (whoRequested.userType !== "admin") {
    const error = new HttpError(
      "You don't have access to edit users accounts!",
      400
    );
    return next(error);
  }

  if (whoRequested.status === "blocked") {
    const error = new HttpError("Your account is blocked!", 400);
    return next(error);
  }

  const convertedUsers = users.map((user) => mongoose.Types.ObjectId(user));

  let user, usersToUpdate;
  try {
    usersToUpdate = await User.find({
      _id: {
        $in: convertedUsers,
      },
    });
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update user account.",
      500
    );
    return next(error);
  }

  if (!usersToUpdate.length) {
    const error = new HttpError(
      "Something went wrong, could not find user for provided ID!",
      404
    );
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    for await (const user of usersToUpdate) {
      await User.findByIdAndUpdate(user.id, propertyToUpdate);
    }
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete users accounts.",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "Users have been updated!" });
};

const deleteUsers = async (req, res, next) => {
  const { users } = req.body;
  const { userId: loggedUserId } = req.userData;

  let whoRequested;
  try {
    whoRequested = await User.findById(loggedUserId, "status userType");
  } catch (err) {
    const error = new HttpError("Deleting user failed!", 500);
    return next(error);
  }

  if (!whoRequested?.userType || whoRequested?.userType !== "admin") {
    const error = new HttpError(
      "You are not allowed to delete user account!",
      400
    );
    return next(error);
  }

  if (!whoRequested?.status || whoRequested?.status === "blocked") {
    const error = new HttpError("Your account is blocked!", 400);
    return next(error);
  }

  const convertedUsers = users.map((user) => mongoose.Types.ObjectId(user));

  let usersToDelete;
  try {
    usersToDelete = await User.find({
      _id: {
        $in: convertedUsers,
      },
    }).populate("collections", "id");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete user account!",
      500
    );
    return next(error);
  }

  if (!usersToDelete.length) {
    const error = new HttpError(
      "Something went wrong, could not find user for provided ID!",
      404
    );
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    usersToDelete.forEach(async (user) => {
      await Collection.deleteMany({
        author: user.id,
      });
      const colllectionsId = user.collections;
      for await (const collectionId of colllectionsId) {
        await CollectionItem.deleteMany({
          belongsToCollection: collectionId.id,
        });
      }
    });
    for await (const userToDelete of usersToDelete) {
      await User.findByIdAndDelete(userToDelete.id);
    }
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete users accounts.",
      500
    );
    return next(error);
  }

  res
    .status(200)
    .json({ message: "Users accounts have been deleted successfully!" });
};

exports.deleteUsers = deleteUsers;
exports.updateUsersAccounts = updateUsersAccounts;
exports.getUsers = getUsers;
