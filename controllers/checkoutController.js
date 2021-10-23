const User = require("../models/users");
const Product = require("../models/products");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
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
        `User ${req.user.name} is not allowed to access this resource.`,
        403
      )
    );
  }

  let message = "";
  const cartItems = user.cart;
  const orderId = v4();
  const orderDate = new Date(Date.now()).toUTCString();

  for (let i = 0; i < cartItems.length; i++) {
    const seller = await User.findById(cartItems[i].seller);

    const product = await Product.findById(cartItems[i].productId);

    if (!seller) {
      message += `The seller for ${cartItems[i].productName} no longer exists. \n`;

      await User.findByIdAndUpdate(
        req.params.userid,
        {
          $pull: {
            cart: { productId: `${cartItems[i].productId}` },
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );
    } else if (!product) {
      message += `Product "${cartItems[i].productName}" no longer exists or has been removed. \n`;

      await User.findByIdAndUpdate(
        req.params.userid,
        {
          $pull: {
            cart: { productId: `${cartItems[i].productId}` },
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );
    } else if (cartItems[i].quantity > product.quantity) {
      message += `The quantiy of ${cartItems[i].quantity} you selected for item "${cartItems[i].productName}" exceeds the available stock of ${product.quantity}. \n`;

      const total = product.price * product.quantity;

      if (product.quantity == 0) {
        await User.findByIdAndUpdate(
          req.params.userid,
          {
            $pull: {
              cart: { productId: `${cartItems[i].productId}` },
            },
          },
          {
            new: true,
            runValidators: true,
          }
        );
      }

      await User.updateOne(
        {
          _id: `${req.params.userid}`,
          "cart.productId": `${cartItems[i].productId}`,
        },
        {
          $set: { "cart.$.quantity": product.quantity, "cart.$.total": total },
        },
        {
          new: true,
          runValidators: true,
        }
      );
    } else {
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

      if (seller.id == cartItems[i].seller) {
        let order = {};
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
      }

      let cartItem = cartItems[i];

      const order = {
        cartItem,
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
            cart: { productId: `${cartItems[i].productId}` },
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );
    }
  }

  res.status(200).json({
    success: true,
    message,
  });
});
