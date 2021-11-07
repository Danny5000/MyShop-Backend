const User = require("../models/users");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

//Get user's data => /api/v1/me
exports.me = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  const id = user.id;
  const username = user.userName;
  const isSeller = user.isSeller;

  res.status(200).json({
    id,
    username,
    isSeller,
    stripeId: user.stripe_account_id,
    stripeProfile: user.stripe_seller,
  });
});

//Get all users data => /api/v1/users
exports.getUsers = catchAsyncErrors(async (req, res, next) => {
  const userData = await User.find().select(
    "-_id -cart -isActive -role -myProductsPurchased -orderHistory"
  );

  res.status(200).json({
    success: true,
    userData,
  });
});

//Get user by username => /api/v1/user/:username
exports.getUserByUserName = catchAsyncErrors(async (req, res, next) => {
  const userName = req.params.username;
  const userData = await User.find(
    { userName },
    { cart: 0, role: 0, isActive: 0, myProductsPurchased: 0, orderHistory: 0 }
  ).populate({
    path: "productData",
    select: "name description price quantity imageUrl user",
  });

  res.status(200).json({
    success: true,
    userData,
  });
});

//Get user by id => /api/v1/users/:id
exports.getUserById = catchAsyncErrors(async (req, res, next) => {
  const user = req.params.id;
  const userData = await User.find({ _id: user }).select(
    "-_id -cart -isActive -role -myProductsPurchased -orderHistory"
  );

  res.status(200).json({
    success: true,
    userData,
  });
});

//Get the user's order history => /api/v1/user/orderhist/:id
exports.getOrderHistory = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

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

  const userData = await User.find({ _id: user.id }).select(
    "-_id -name -userName -email -createdAt -cart -isActive -role -myProductsPurchased"
  );

  res.status(200).json({
    success: true,
    userData,
  });
});

//Get the user's products purchased by other users => /api/v1/user/prodspurchased/:id
exports.getMyProductsPurchased = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

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

  const userData = await User.find({ _id: user.id }).select(
    "-_id -name -userName -email -createdAt -cart -isActive -role -orderHistory"
  );

  res.status(200).json({
    success: true,
    userData,
  });
});
