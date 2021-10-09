const User = require("../models/users");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

//Get user's data => /api/v1/me
exports.me = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  //Check whether the current user is the requester
  if (user.id.toString() !== req.user.id) {
    return next(
      new ErrorHandler(
        `User ${req.user.name} is not allowed to access this resource.`,
        403
      )
    );
  }

  const id = user.id;
  const username = user.userName;

  res.status(200).json({
    success: true,
    id,
    username,
  });
});

//Get all users data => /api/v1/users
exports.getUsers = catchAsyncErrors(async (req, res, next) => {
  const userData = await User.find().select("-cart -isActive -role");

  res.status(200).json({
    success: true,
    userData,
  });
});

//Get user by username => /api/v1/user/:username
exports.getUserByUserName = catchAsyncErrors(async (req, res, next) => {
  const userName = req.params.username;
  const userData = await User.find({ userName }).select(
    "-cart -isActive -role"
  );

  res.status(200).json({
    success: true,
    userData,
  });
});
