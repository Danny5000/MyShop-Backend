const Product = require("../models/products");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const path = require("path");
const deleteFiles = require("../utils/deleteFiles");

//Get all products => /api/v1/products
exports.getProducts = catchAsyncErrors(async (req, res, next) => {
  const products = await Product.find();

  res.status(200).json({
    success: true,
    results: products.length,
    data: products,
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

  // Check file type
  const supportedFiles = /.jpeg|.png|.svg/;
  if (!supportedFiles.test(path.extname(file.name))) {
    return next(new ErrorHandler("Please upload document file.", 400));
  }

  // Check doucument size
  if (file.size > process.env.MAX_FILE_SIZE) {
    return next(new ErrorHandler("Please upload file less than 2MB.", 400));
  }

  // Renaming product file
  file.name = `${req.user.id}_${file.name}`;

  file.mv(`${process.env.UPLOAD_PATH}/${file.name}`, async (err) => {
    if (err) {
      console.log(err);
      return next(new ErrorHandler("Resume upload failed.", 500));
    }
  });

  req.body.imageUrl = file.name;

  const product = await Product.create(req.body);

  res.status(200).json({
    success: true,
    message: "Product Created",
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
