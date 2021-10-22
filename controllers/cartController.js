const User = require("../models/users");
const Product = require("../models/products");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const getTotal = require("../utils/getTotal");

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

  const totalPrice = getTotal(cartItems);

  res.status(200).json({
    success: true,
    data: cartItems,
    cartTotal: totalPrice,
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

  const cartItems = user.cart;

  //Check the cart for the product
  //If the product is present, only increment the quantity
  //Does NOT add another entry to the cart
  for (let i = 0; i < cartItems.length; i++) {
    if (cartItems[i].productId === product.id) {
      let newQuantity = 0;
      newQuantity = cartItems[i].quantity + req.body.quantity;
      if (newQuantity < 1) {
        return next(
          new ErrorHandler(`A quantity of atleast 1 is required.`, 400)
        );
      } else if (newQuantity % 1 != 0) {
        return next(
          new ErrorHandler(`The quantity must be a whole number.`, 400)
        );
      } else if (newQuantity > product.quantity) {
        return next(
          new ErrorHandler(
            `You cannot add more than the current stock (${product.quantity}).`,
            400
          )
        );
      }
      const total = cartItems[i].productPrice * newQuantity;

      try {
        user = await User.updateOne(
          {
            _id: `${req.params.userid}`,
            "cart.productId": `${cartItems[i].productId}`,
          },
          {
            $set: { "cart.$.quantity": newQuantity, "cart.$.total": total },
          },
          {
            new: true,
            runValidators: true,
          }
        );
      } catch (err) {
        return next(new ErrorHandler(`${err.message}`, 500));
      }

      user = await User.findById(req.params.userid);
      const cartTotal = getTotal(user.cart);

      return res.status(200).json({
        success: true,
        message: "Cart Entry Updated",
        data: user.cart,
        cartTotal,
      });
    }
  }

  if (req.body.quantity > product.quantity) {
    return next(
      new ErrorHandler(
        `You cannot add more than the current stock (${product.quantity}).`,
        400
      )
    );
  }

  const total = product.price * req.body.quantity;

  const cartEntry = {
    productId: product.id,
    productName: product.name,
    productPrice: product.price,
    seller: product.user,
    quantity: req.body.quantity,
    total,
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
    }
  );

  user = await User.findById(req.params.userid);
  const cartTotal = getTotal(user.cart);

  res.status(200).json({
    success: true,
    message: "Product has been added to cart",
    data: user.cart,
    cartTotal,
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

  const cartItems = user.cart;

  //Check cart to see if the product is still in the cart before deleting
  for (let i = 0; i < cartItems.length; i++) {
    if (cartItems[i].productId === req.params.productid) {
      const item = cartItems[i].productName;
      //Delete an item from the cart
      user = await User.findByIdAndUpdate(
        req.params.userid,
        {
          $pull: {
            cart: { productId: `${req.params.productid}` },
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      user = await User.findById(req.params.userid);
      const totalPrice = getTotal(user.cart);

      return res.status(200).json({
        data: user.cart,
        success: true,
        cartTotal: totalPrice,
        message: `Item "${item}" was removed from the cart.`,
      });
    }
  }

  res.status(400).json({
    success: false,
    message: "Product no longer in cart",
  });
});

//Update the cart => /api/v1/cart/:userid/:productid
exports.updateCart = catchAsyncErrors(async (req, res, next) => {
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

  if (req.body.quantity > product.quantity) {
    return next(
      new ErrorHandler(
        `You cannot add more than the current stock (${product.quantity}).`,
        400
      )
    );
  }

  const total = product.price * req.body.quantity;

  user = await User.updateOne(
    {
      _id: `${req.params.userid}`,
      "cart.productId": `${req.params.productid}`,
    },
    {
      $set: { "cart.$.quantity": req.body.quantity, "cart.$.total": total },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  user = await User.findById(req.params.userid);

  const cartItems = user.cart;
  const cartTotal = getTotal(cartItems);

  res.status(200).json({
    success: true,
    data: cartItems,
    cartTotal,
  });
});
