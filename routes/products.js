const express = require("express");
const router = express.Router();

//Product controller functions
const {
  getProducts,
  newProduct,
  deleteProduct,
} = require("../controllers/productController");

const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

router.route("/products").get(getProducts);
router
  .route("/product/new")
  .post(isAuthenticatedUser, authorizeRoles("user", "admin"), newProduct);

router
  .route("/product/:id")
  .delete(isAuthenticatedUser, authorizeRoles("user", "admin"), deleteProduct);

module.exports = router;
