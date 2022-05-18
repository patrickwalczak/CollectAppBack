const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const HttpError = require("../models/http-error");
const User = require("../models/user");

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  const errorsObj = errors.mapped();

  if (errorsObj?.email) {
    return next(
      new HttpError("Invalid email passed, please check your data.", 422)
    );
  }

  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { username, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne(
      { $or: [{ email: email }, { username: username }] },
      "email username"
    );
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }

  if (existingUser?.email === email) {
    const error = new HttpError(
      "User with provided email exists already, please login instead.",
      422
    );
    return next(error);
  }

  if (existingUser?.username === username) {
    const error = new HttpError("This username is not available", 422);
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError("Could not create user, please try again", 500);
    return next(error);
  }

  const registrationTime = Date.now();

  const createdUser = new User({
    username,
    email,
    password: hashedPassword,
    userType: "user",
    registrationTime,
    status: "active",
    lastLoginTime: registrationTime,
    collections: [],
    likes: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign({ userId: createdUser.id }, process.env.JWT_KEY);
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }

  res.status(201).json({
    username: createdUser.username,
    userId: createdUser.id,
    userType: createdUser.userType,
    token,
  });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let foundUser;
  try {
    await User.findOneAndUpdate(
      { email: email },
      { lastLoginTime: Date.now() }
    );
    foundUser = await User.findOne(
      { email: email },
      "password id username userType"
    );
  } catch (err) {
    const error = new HttpError(
      "Logging in failed, please try again later.",
      500
    );
    return next(error);
  }

  if (!foundUser) {
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      401
    );
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, foundUser.password);
  } catch (err) {
    const error = new HttpError(
      "Could not log you in, invalid credentials",
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      401
    );
    return next(error);
  }

  if (foundUser.status === "blocked") {
    const error = new HttpError("You are blocked, could not log you in.", 401);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign({ userId: foundUser.id }, process.env.JWT_KEY);
  } catch (err) {
    const error = new HttpError(
      "Logging in failed, please try again later.",
      500
    );
    return next(error);
  }

  res.json({
    username: foundUser.username,
    userId: foundUser.id,
    userType: foundUser.userType,
    token,
  });
};

exports.signup = signup;
exports.login = login;
