const express = require("express");
const router = express.Router();

const {
  me,
  getUsers,
  getUserByUserName,
  getUserById,
  getOrderHistory,
  getMyProductsPurchased,
} = require("../controllers/userController");

const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

router.route("/me").get(isAuthenticatedUser, me);
router.route("/users").get(getUsers);
router.route("/user/:username").get(getUserByUserName);
router.route("/users/:id").get(getUserById);
router
  .route("/user/orderhist/:id")
  .get(isAuthenticatedUser, authorizeRoles("user", "admin"), getOrderHistory);
router
  .route("/user/prodspurchased/:id")
  .get(
    isAuthenticatedUser,
    authorizeRoles("user", "admin"),
    getMyProductsPurchased
  );

module.exports = router;
