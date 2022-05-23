const express = require("express");
const { check } = require("express-validator");

const adminControllers = require("../controllers/admin-controllers");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

router.use(checkAuth);

router.patch(
  "/updateUsersAccounts",
  [check("users").isArray().isLength({ min: 1 })],
  adminControllers.updateUsersAccounts
);

router.delete(
  "/delete",
  [check("users").isArray().isLength({ min: 1 })],
  adminControllers.deleteUsers
);

router.post("/users", adminControllers.getUsers);

module.exports = router;
