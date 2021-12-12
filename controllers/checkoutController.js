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

  let total = 0.0;
  const orders = [];
  let prodsSold = [];
  const cartItems = user.cart;
  const orderId = v4();
  const orderDate = new Date(Date.now()).toUTCString();

  for (let i = 0; i < cartItems.length; i++) {
    const seller = await User.findById(cartItems[i].seller);

    const product = await Product.findById(cartItems[i].productId);

    //Update the product stock if checkout is successful
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

    //Push each item in the cart to the order array
    let orderItem = cartItems[i];
    total += orderItem.total;
    const sellerName = seller.userName;

    const order = {
      orderItem,
      sellerName,
    };

    orders.push(order);

    //Remove the items from the user's cart
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

  //For each seller, add all products purchased by a buyer
  //in that order to their products sold array
  if (orders.length !== 0) {
    let orderTotal = 0.0;
    let temp = [];
    const buyerUserName = user.userName;
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
        //Do not add the same product for the same
        //seller multiple times
        if (
          seller.id == orders[j].orderItem.seller &&
          temp.every((e) => e != seller.id)
        ) {
          orderTotal += orders[j].orderItem.total;
          prodsSold.push(orders[j].orderItem);
        }
      }
      //Add all products sold in that order to the
      //prodsSold array before saving to DB
      if (prodsSold.length !== 0) {
        prodsSold.push(
          { orderId },
          { orderDate },
          { orderTotal },
          { buyerUserName },
          { email: user.email },
          { custDetails: req.body.custDetails }
        );
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
      orderTotal = 0.0;
    }
    temp = [];
  }

  //Save the order in the buyer's order history
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
  });
});

//Controller to validate the cart before a user checks out
exports.validateCart = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  const cart = user.cart;

  //Begin cart validation
  for (let i = 0; i < cart.length; i++) {
    const seller = await User.findById(cart[i].seller);

    const product = await Product.findById(cart[i].productId);

    //If seller no longer exists, remove product from cart
    if (!seller) {
      await User.findByIdAndUpdate(
        user.id,
        {
          $pull: {
            cart: { productId: `${cart[i].productId}` },
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      return next(
        new ErrorHandler(
          `The seller for ${cart[i].productName} no longer exists. Your selection has been updated to reflect this.`,
          404
        )
      );
      //If product no longer exists, remove product from cart
    } else if (!product) {
      await User.findByIdAndUpdate(
        user.id,
        {
          $pull: {
            cart: { productId: `${cart[i].productId}` },
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      return next(
        new ErrorHandler(
          `Product "${cart[i].productName}" no longer exists or has been removed. Your selection has been updated to reflect this.`,
          404
        )
      );
      //If cart quantity exceeds product stock
    } else if (cart[i].quantity > product.quantity) {
      const total = product.price * product.quantity;

      //If the stock of the product is 0, remove from cart
      if (product.quantity == 0) {
        await User.findByIdAndUpdate(
          user.id,
          {
            $pull: {
              cart: { productId: `${cart[i].productId}` },
            },
          },
          {
            new: true,
            runValidators: true,
          }
        );
      }

      //If stock is not 0, adjust the quantity of the user's cart
      //quantity will match the current available stock
      await User.updateOne(
        {
          _id: `${user.id}`,
          "cart.productId": `${cart[i].productId}`,
        },
        {
          $set: { "cart.$.quantity": product.quantity, "cart.$.total": total },
        },
        {
          new: true,
          runValidators: true,
        }
      );
      return next(
        new ErrorHandler(
          `The quantiy of ${cart[i].quantity} you selected for item "${cart[i].productName}" exceeds the available stock of ${product.quantity}. Your selection has been updated to reflect this.`,
          400
        )
      );
    }
  }
  res.json({ success: true });
});
