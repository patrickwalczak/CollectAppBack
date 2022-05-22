const express = require("express");
const { check } = require("express-validator");

const itemsControllers = require("../controllers/items-controllers");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

router.get("/item/:itemId", itemsControllers.getItemById);

router.get("/getLatestItems", itemsControllers.getLatestItems);

router.get(
  "/getFullTextSearchResults/:query",
  [check("query").trim().isLength({ min: 1 })],
  itemsControllers.getFullTextSearchResults
);

router.use(checkAuth);

router.post(
  "/:collectionId/createItem",
  [
    check("name").trim().isLength({ min: 3, max: 25 }),
    check("tags").isArray({ min: 1 }),
  ],
  itemsControllers.createItem
);

router.post(
  "/:itemId/addComment",
  [
    check("comment").trim().isLength({ min: 1, max: 300 }),
    check("author").trim().isLength({ min: 3, max: 25 }),
  ],
  itemsControllers.addComment
);

router.patch("/:itemId/likeItem", itemsControllers.likeItem);

router.patch("/:itemId/removeLike", itemsControllers.removeLike);

router.patch(
  "/:itemId/editItem",
  [
    check("name").trim().isLength({ min: 3, max: 25 }),
    check("tags").isArray({ min: 1 }),
  ],
  itemsControllers.editItem
);

router.delete("/:itemId/deleteItem", itemsControllers.deleteItem);

module.exports = router;
