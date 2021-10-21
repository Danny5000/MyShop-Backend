const User = require("../models/users");
const Product = require("../models/products");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const getTotal = require("../utils/getTotal");
const v4 = require("uuid/v4");

exports.handlePurchase = catchAsyncErrors(async (req, res, next) => {
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
  const orderId = v4();
  const orderDate = new Date(Date.now()).toUTCString();

  for (let i = 0; i < cartItems.length; i++) {
    const seller = await User.findById(cartItems[i].seller);
    let order = {};

    if (!seller) {
      return next(new ErrorHandler("Something went wrong.", 500));
    }

    const product = await Product.findById(cartItems[i].productId);

    if (!product) {
      return next(new ErrorHandler("Something went wrong.", 500));
    }

    if (seller.id == cartItems[i].seller) {
      order.item = cartItems[i];
      order.orderDate = orderDate;
      order.orderId = orderId;
      order.purchasedByName = user.name;
      order.purchasedByEmail = user.email;

      await User.findByIdAndUpdate(
        seller.id,
        {
          $push: {
            myProductsPurchased: order,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      const newQuantity = product.quantity - cartItems[i].quantity;

      await Product.findByIdAndUpdate(
        product.id,
        {
          $set: {
            quantity: newQuantity,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );
    }
  }

  const order = {
    cartItems,
    orderDate,
    orderId,
  };

  await User.findByIdAndUpdate(
    req.params.userid,
    {
      $push: {
        orderHistory: order,
      },
      $pull: {
        cart: {},
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
  });
});
