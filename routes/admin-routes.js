const express = require("express");
const { check } = require("express-validator");

const adminControllers = require("../controllers/admin-controllers");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

router.use(checkAuth);

router.patch("/updateUsersAccounts", adminControllers.updateUsersAccounts);

router.delete("/delete", adminControllers.deleteUsers);

router.post("/users", adminControllers.getUsers);

module.exports = router;
