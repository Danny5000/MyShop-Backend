const Product = require("../models/products");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const deleteFiles = require("../utils/deleteFiles");
const uploadFiles = require("../utils/uploadFiles");

//Get all products => /api/v1/products
exports.getProducts = catchAsyncErrors(async (req, res, next) => {
  const products = await Product.find().populate({
    path: "userData",
    select: "userName -_id",
  });

  res.status(200).json({
    success: true,
    results: products.length,
    data: products,
  });
});

//Get product by id => /api/v1/product/:id
exports.getProductById = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate({
    path: "userData",
    select: "userName -_id",
  });

  res.status(200).json({
    success: true,
    data: product,
  });
});

//Create a new product => /api/v1/product/new
exports.newProduct = catchAsyncErrors(async (req, res, next) => {
  //Adding user to body
  req.body.user = req.user.id;

  // Check the files
  if (!req.files) {
    return next(new ErrorHandler("Please upload file.", 400));
  }

  const file = req.files.imageUrl;

  const fileName = uploadFiles(file, req);

  req.body.imageUrl = fileName;

  req.body.price = parseInt(req.body.price);
  req.body.quantity = parseInt(req.body.quantity);

  const product = await Product.create(req.body);

  res.status(200).json({
    success: true,
    message: "Product Created",
    data: product,
  });
});

// Update a product => /api/v1/product/:id
exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  //Check whether the current user is the product owner
  if (product.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorHandler(
        `User ${req.user.name} is not allowed to update this product.`,
        403
      )
    );
  }

  if (req.files) {
    const prodImage = product.imageUrl;
    deleteFiles(prodImage);
    const file = req.files.imageUrl;
    const fileName = uploadFiles(file, req);
    req.body.imageUrl = fileName;
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    message: "Product has been updated.",
    data: product,
  });
});

//Delete a product => /api/v1/product/:id
exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  //Check whether the current user is the product owner or admin
  if (product.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorHandler(
        `User ${req.user.name} is not allowed to delete this product.`,
        403
      )
    );
  }

  //Deleting file associated with the product
  const prodImage = product.imageUrl;

  deleteFiles(prodImage);

  product = await Product.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "Product has been deleted.",
  });
});
