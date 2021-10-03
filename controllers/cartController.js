const User = require("../models/users");
const Product = require("../models/products");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const v4 = require("uuid/v4");

/* eslint-disable */

//Add product to cart => /api/v1/cart/:userid
exports.getCart = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.userid);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  //Check whether the current user is the cart owner
  if (user.id.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorHandler(
        `User ${req.user.name} is not allowed to add this product to cart.`,
        403
      )
    );
  }

  const cartItems = user.cart;

  let totalPrice = 0.0;

  for (let i = 0; i < cartItems.length; i++) {
    totalPrice += cartItems[i].total;
  }

  res.status(200).json({
    success: true,
    data: cartItems,
    totalPrice,
  });
});

//Add product to cart => /api/v1/cart/:userid/:productid
exports.addToCart = catchAsyncErrors(async (req, res, next) => {
  let user = await User.findById(req.params.userid);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  const product = await Product.findById(req.params.productid);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  //Check whether the current user is the cart owner
  if (user.id.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorHandler(
        `User ${req.user.name} is not allowed to add this product to cart.`,
        403
      )
    );
  }

  //Check if there is a quantity greater than 1
  if (
    req.body.quantity === null ||
    req.body.quantity === undefined ||
    req.body.quantity < 1
  ) {
    return next(new ErrorHandler(`A quantity of atleast 1 is required.`, 400));
  }

  const total = product.price * req.body.quantity;

  const entryId = v4();

  const cartEntry = {
    entryId,
    productName: product.name,
    productPrice: product.price,
    quantity: req.body.quantity,
    total: total,
  };

  //Push a new product & its selected quantity into the cart
  user = await User.findByIdAndUpdate(
    req.params.userid,
    {
      $push: {
        cart: cartEntry,
      },
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
    message: "Product has been added to cart",
    data: cartEntry,
  });
});

//Delete product from cart => /api/v1/cart/:userid/:entryid
exports.deleteFromCart = catchAsyncErrors(async (req, res, next) => {
  let user = await User.findById(req.params.userid);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  //Check whether the current user is the cart owner
  if (user.id.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorHandler(
        `User ${req.user.name} is not allowed to add this product to cart.`,
        403
      )
    );
  }

  //Push a new product & its selected quantity into the cart
  user = await User.findByIdAndUpdate(
    req.params.userid,
    {
      $pull: {
        cart: { entryId: `${req.params.entryid}` },
      },
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
    message: "Product has been deleted from cart",
  });
});

//Update the cart => /api/v1/cart/:userid/:entryid
exports.updateCart = catchAsyncErrors(async (req, res, next) => {
  let user = await User.findById(req.params.userid);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  //Check whether the current user is the cart owner
  if (user.id.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorHandler(
        `User ${req.user.name} is not allowed to add this product to cart.`,
        403
      )
    );
  }

  //Check if there is a quantity greater than 1
  if (
    req.body.quantity === null ||
    req.body.quantity === undefined ||
    req.body.quantity < 1
  ) {
    return next(new ErrorHandler(`A quantity of atleast 1 is required.`, 400));
  }

  user = await User.updateOne(
    {
      _id: `${req.params.userid}`,
      "cart.entryId": `${req.params.entryid}`,
    },
    {
      $set: { "cart.$.quantity": req.body.quantity },
      $set: {
        "cart.$.total": "$cart.$.productPrice",
      },
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
    message: "Entry updated",
  });
});
