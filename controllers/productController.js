const Product = require("../models/products");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const deleteFiles = require("../utils/deleteFiles");
const uploadFiles = require("../utils/uploadFiles");
const path = require("path");
const v4 = require("uuid/v4");
const APIFilters = require("../utils/apiFilters");

//Get all products => /api/v1/products
exports.getProducts = catchAsyncErrors(async (req, res, next) => {
  const apiFilters = new APIFilters(
    Product.find().populate({
      path: "userData",
      select: "userName -_id",
    }),
    req.query
  )
    .searchByQuery()
    .pagination();

  const products = await apiFilters.query;

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
  if (req.user.isSeller === false) {
    return next(
      new ErrorHandler("You are not allowed to post a product.", 403)
    );
  }
  //Adding user to body
  req.body.user = req.user.id;

  // Check the files
  if (!req.files) {
    return next(new ErrorHandler("Please upload file.", 400));
  }

  const file = req.files.imageUrl;

  const pictureId = v4();

  // Renaming product file
  file.name = `${req.user.id}_${pictureId}_${file.name}`;

  req.body.imageUrl = file.name;

  // Check file type
  const supportedFiles = /.jpeg|.jpg|.png|.svg/;
  if (!supportedFiles.test(path.extname(file.name))) {
    return next(new ErrorHandler("Please upload an image file.", 400));
  }

  // Check doucument size
  if (file.size > process.env.MAX_FILE_SIZE) {
    return next(new ErrorHandler("Please upload file less than 2MB.", 400));
  }

  await Product.create(req.body);

  uploadFiles(file, file.name, next);

  res.status(200).json({
    success: true,
    message: "Your product was added successfully.",
  });
});

// Update a product => /api/v1/product/:id
exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  const prodImage = product.imageUrl;

  //Check whether the current user is the product owner
  if (product.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorHandler(
        `User ${req.user.name} is not allowed to update this product.`,
        403
      )
    );
  }

  //If user selects a file on front-end and then unselects
  if (req.files === null) {
    req.body.imageUrl = prodImage;
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  //Do we have a file in the request?
  if (req.files) {
    //Set the file, the file's id, name and what files are supported
    const file = req.files.imageUrl;
    const pictureId = v4();
    file.name = `${req.user.id}_${pictureId}_${file.name}`;
    const supportedFiles = /.jpeg|.jpg|.png|.svg/;

    //Check if file is supported
    if (!supportedFiles.test(path.extname(file.name))) {
      return next(new ErrorHandler("Please upload an image file.", 400));
    }

    // Check doucument size
    if (file.size > process.env.MAX_FILE_SIZE) {
      return next(new ErrorHandler("Please upload file less than 2MB.", 400));
    }
    req.body.imageUrl = file.name;

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (file) {
      uploadFiles(file, file.name, next);
      deleteFiles(prodImage);
    }
  }

  res.status(200).json({
    success: true,
    message: "Product has been updated.",
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
