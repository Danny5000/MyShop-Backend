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

  let total = 0.0;
  const orders = [];
  let prodsSold = [];
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

      let orderItem = cartItems[i];
      total += orderItem.total;
      const sellerName = seller.userName;

      const order = {
        orderItem,
        sellerName,
      };

      orders.push(order);

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
  }

  if (orders.length !== 0) {
    let total = 0.0;
    let temp = [];
    for (let i = 0; i < orders.length; i++) {
      const seller = await User.findById(orders[i].orderItem.seller);
      if (!seller) {
        return next(
          new ErrorHandler(
            "Error: Could not process checkout -- The seller no longer exists",
            500
          )
        );
      }
      for (let j = 0; j < orders.length; j++) {
        if (
          seller.id == orders[j].orderItem.seller &&
          temp.every((e) => e != seller.id)
        ) {
          total += orders[j].orderItem.total * orders[j].orderItem.quantity;
          prodsSold.push(orders[j].orderItem);
        }
      }
      if (prodsSold.length !== 0) {
        prodsSold.push({ orderId }, { orderDate }, { total });
        await User.findByIdAndUpdate(
          seller.id,
          {
            $push: {
              myProductsPurchased: {
                $each: [prodsSold],
                $position: 0,
              },
            },
          },
          {
            new: true,
            runValidators: true,
          }
        );
      }
      temp.push(orders[i].orderItem.seller);
      prodsSold = [];
      total = 0.0;
    }
    temp = [];
  }

  if (orders.length !== 0) {
    orders.push({ orderId }, { orderDate }, { total });
    await User.findByIdAndUpdate(
      req.params.userid,
      {
        $push: {
          orderHistory: {
            $each: [orders],
            $position: 0,
          },
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );
  }

  res.status(200).json({
    success: true,
    message,
  });
});
