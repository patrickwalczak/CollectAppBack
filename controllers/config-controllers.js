const Topic = require("../models/topic");
const Tag = require("../models/tag");

const HttpError = require("../models/http-error");

const createTopic = async (req, res, next) => {
  const { topic } = req.body;

  if (!topic) {
    const error = new HttpError("None collection topic was provided!", 500);
    return next(error);
  }

  let existingTopic;
  try {
    existingTopic = await Topic.findOne({ title: topic });
  } catch (err) {
    const error = new HttpError(
      "Creating topic failed, please try again later.",
      500
    );
    return next(error);
  }

  if (existingTopic) {
    const error = new HttpError("Provided topic already exists!", 500);
    return next(error);
  }

  const createdTopic = new Topic({
    title: topic,
  });

  try {
    await createdTopic.save();
  } catch (err) {
    const error = new HttpError(
      "Creating topic failed, please try again later.",
      500
    );
    return next(error);
  }

  res.status(201).json({ topic: createdTopic });
};

const createTag = async (req, res, next) => {
  const { tag } = req.body;

  if (!tag) {
    const error = new HttpError("No tag was provided!", 500);
    return next(error);
  }

  let existingTag;
  try {
    existingTag = await Tag.findOne({ title: tag });
  } catch (err) {
    const error = new HttpError(
      "Creating tag failed, please try again later.",
      500
    );
    return next(error);
  }

  if (existingTag) {
    const error = new HttpError("Provided tag already exists!", 500);
    return next(error);
  }

  const createdTag = new Tag({
    title: tag,
  });

  try {
    await createdTag.save();
  } catch (err) {
    const error = new HttpError(
      "Creating tag failed, please try again later.",
      500
    );
    return next(error);
  }

  res.status(201).json({ tag: createdTag });
};

const getTopics = async (req, res, next) => {
  let topics;
  try {
    topics = await Topic.find({});
  } catch (err) {
    const error = new HttpError(
      "Fetching topics failed, please try again later.",
      500
    );
    return next(error);
  }

  const convertedTopics = topics
    .map((topic) => topic.toObject({ getters: true }))
    .map((topic) => {
      return { ...topic, value: topic.title, label: topic.title };
    });

  res.json({
    topics: convertedTopics,
  });
};

const getTags = async (req, res, next) => {
  const { query } = req.params;

  if (!query) {
    const error = new HttpError(
      "Your query is empty, type at least one character!",
      500
    );
    return next(error);
  }

  let tags;
  try {
    tags = await Tag.find({ title: { $regex: query } }, "title");
  } catch (err) {
    const error = new HttpError(
      "Fetching tags failed, please try again later.",
      500
    );
    return next(error);
  }

  const convertedTags = tags
    .map((tag) => tag.toObject({ getters: true }))
    .map((tag) => {
      return { label: tag.title, value: tag.title };
    });

  res.json({
    tags: convertedTags,
  });
};

exports.createTopic = createTopic;
exports.createTag = createTag;
exports.getTags = getTags;
exports.getTopics = getTopics;
