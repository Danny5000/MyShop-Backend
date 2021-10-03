const express = require("express");
const router = express.Router();

//Product controller functions
const {
  getProducts,
  getProductById,
  newProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

router.route("/products").get(getProducts);
router
  .route("/product/new")
  .post(isAuthenticatedUser, authorizeRoles("user", "admin"), newProduct);

router
  .route("/product/:id")
  .get(getProductById)
  .put(isAuthenticatedUser, authorizeRoles("user", "admin"), updateProduct)
  .delete(isAuthenticatedUser, authorizeRoles("user", "admin"), deleteProduct);

module.exports = router;
