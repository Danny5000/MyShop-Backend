const User = require("../models/users");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const queryString = require("query-string");

//Direct user to stripe onboarding => /api/v1/makeSeller
exports.makeSeller = catchAsyncErrors(async (req, res, next) => {
  try {
    const user = await User.findById(req.user);

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    if (!user.stripe_account_id) {
      const account = await stripe.accounts.create({ type: "express" });
      user.stripe_account_id = account.id;
      await user.save();
    }

    if (user.isSeller === true) {
      return next(new ErrorHandler("User is already a seller", 400));
    }

    let accountLink = await stripe.accountLinks.create({
      account: user.stripe_account_id,
      refresh_url: process.env.STRIPE_REDIRECT_URL,
      return_url: process.env.STRIPE_REDIRECT_URL,
      type: "account_onboarding",
    });

    accountLink = Object.assign(accountLink, {
      email: user.email,
    });

    res.send(`${accountLink.url}?${queryString.stringify(accountLink)}`);
  } catch (err) {
    console.log("Make-seller error.", err);
  }
});

//Manage account status after onboarding complete => /api/v1/get-account-status
exports.getAccountStatus = catchAsyncErrors(async (req, res, next) => {
  try {
    const user = await User.findById(req.user);

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    if (user.isSeller === true) {
      return next(new ErrorHandler("User is already a seller", 400));
    }

    const account = await stripe.accounts.retrieve(user.stripe_account_id);

    if (!account.charges_enabled) {
      return next(new ErrorHandler("Onboarding not completed.", 403));
    } else {
      const statusUpdated = await User.findByIdAndUpdate(
        req.user.id,
        {
          stripe_seller: account,
          isSeller: true,
        },
        {
          new: true,
          runValidators: true,
        }
      ).select(
        "-cart -orderHistory -myProductsPurchased -createdAt -isActive -role"
      );

      res.json(statusUpdated);
    }
  } catch (err) {
    console.log("Make-seller error.", err);
  }
});
