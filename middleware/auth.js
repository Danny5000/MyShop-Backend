const jwt = require("jsonwebtoken");
const User = require("../models/users");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");

//Check if the user is authenticated or not
exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new ErrorHandler("Login required to access this resource", 401)
    );
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded.id);

  if (!req.user.isActive && req.originalUrl !== "/api/v1/logout") {
    res.cookie("token", "none", {
      expires: new Date(Date.now()),
      httpOnly: true,
    });

    return next(
      new ErrorHandler(
        `The user ${req.user.name} is no longer allowed to access this resource`,
        403
      )
    );
  }

  next();
});

//Handling user roles
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Role ${req.user.role} is not allowed to access this resource`,
          403
        )
      );
    }
    next();
  };
};
