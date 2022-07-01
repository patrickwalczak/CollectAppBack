const express = require("express");
const { check } = require("express-validator");

const collectionsController = require("../controllers/collections-controllers");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

router.get("/user/:userId", collectionsController.getCollectionsByUserId);

router.get(
  "/getLargestCollections",
  collectionsController.getLargestCollections
);

router.get(
  "/collection/:collectionId",
  collectionsController.getCollectionById
);

router.use(checkAuth);

router.post(
  "/:userId/createCollection",

  [
    check("collectionName").trim().isLength({ min: 3, max: 25 }),
    check("collectionDescription").trim().isLength({ min: 1, max: 300 }),
    check("collectionTopic").trim().not().isEmpty(),
    check("customTextFieldsNames").isArray(),
    check("customNumberFieldsNames").isArray(),
    check("customMultilineTextFieldsNames").isArray(),
    check("customDateFieldsNames").isArray(),
    check("customBooleanFieldsNames").isArray(),
  ],
  collectionsController.createCollection
);

router.patch(
  "/:collectionId/editCollection",
  [
    check("collectionName").trim().isLength({ min: 3, max: 25 }),
    check("collectionDescription").trim().isLength({ min: 1, max: 300 }),
    check("collectionTopic").trim().not().isEmpty(),
  ],
  collectionsController.editCollection
);

router.delete(
  "/:collectionId/deleteCollection",
  collectionsController.deleteCollection
);

module.exports = router;
