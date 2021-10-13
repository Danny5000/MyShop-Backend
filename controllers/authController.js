const User = require("../models/users");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const sendToken = require("../utils/jwtToken");
const crypto = require("crypto");

//Register a new user => /api/v1/register
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  const { name, userName, email, password } = req.body;

  const user = await User.create({
    name,
    userName,
    email,
    password,
  });

  sendToken(user, 200, res);
});

// Login user => /api/v1/login
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  //Checks if email or password is entered by user
  if (!email || !password) {
    return next(new ErrorHandler("Please enter email & Password", 400));
  }

  //Finding user in database
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid email or password!", 401));
  }

  //Check if password is correct
  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password!", 401));
  }

  if (!user.isActive) {
    return next(new ErrorHandler("The user has been blocked!", 403));
  }

  sendToken(user, 200, res);
});

//Logout user => /api/v1/logout
exports.logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "You have been logged out.",
  });
});
