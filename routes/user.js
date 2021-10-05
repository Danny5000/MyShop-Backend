const express = require("express");
const router = express.Router();

const { me } = require("../controllers/userController");

const { isAuthenticatedUser } = require("../middleware/auth");

router.route("/me").get(isAuthenticatedUser, me);

module.exports = router;
