const express = require("express");
const { check } = require("express-validator");

const usersController = require("../controllers/users-controllers");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

router.post(
  "/signup",
  [
    check("username").isLength({ min: 3, max: 20 }),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 2, max: 15 }),
  ],
  usersController.signup
);

router.post("/login", usersController.login);

module.exports = router;
