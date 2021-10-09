const express = require("express");
const router = express.Router();

const {
  me,
  getUsers,
  getUserByUserName,
} = require("../controllers/userController");

const { isAuthenticatedUser } = require("../middleware/auth");

router.route("/me").get(isAuthenticatedUser, me);
router.route("/users").get(getUsers);
router.route("/users/:username").get(getUserByUserName);

module.exports = router;
