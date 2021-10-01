const express = require("express");
const router = express.Router();

const {
  registerUser,
  //loginUser,
  //forgotPassword,
  //resetPassword,
  //logout,
} = require("../controllers/authController");

router.route("/register").post(registerUser);

module.exports = router;
