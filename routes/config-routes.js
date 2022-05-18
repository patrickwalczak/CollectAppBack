const express = require("express");
const { check } = require("express-validator");

const configController = require("../controllers/config-controllers");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

router.get("/topics", configController.getTopics);

router.get("/tags/:query", configController.getTags);

router.use(checkAuth);

router.post("/createtopic", configController.createTopic);

router.post("/createtag", configController.createTag);

module.exports = router;
