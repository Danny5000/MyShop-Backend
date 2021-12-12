const User = require("../models/users");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const queryString = require("query-string");
const axios = require("axios");
const v4 = require("uuid/v4");

//Direct user to stripe onboarding => /api/v1/makeSeller
exports.makeSeller = catchAsyncErrors(async (req, res, next) => {
  try {
    const user = await User.findById(req.user);

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    //Check if user already has Stripe id, if not create new one
    //If user already has account id, use that account
    if (!user.stripe_account_id) {
      const account = await stripe.accounts.create({ type: "express" });
      user.stripe_account_id = account.id;
      await user.save();
    }

    //If user already seller, will be redirected back to the same page
    if (user.isSeller === true) {
      return res.send("add-product");
    }

    //Create the onboarding link for the seller
    let accountLink = await stripe.accountLinks.create({
      account: user.stripe_account_id,
      refresh_url: process.env.STRIPE_REDIRECT_URL,
      return_url: process.env.STRIPE_REDIRECT_URL,
      type: "account_onboarding",
    });

    //Add user's email to the account link so it is
    //already filled in when they start onboarding
    accountLink = Object.assign(accountLink, {
      email: user.email,
    });

    //Sent the link in the response
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

    //Check if onboarding complete, if not let the user know
    //If complete, update their seller status
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

//Process what appears in the Stripe checkout session
exports.processStripeCheckout = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorHandler("Checkout failed - user not found!", 404));
  }

  const cart = user.cart;

  //Sets the product names and prices that the user
  //will see in the Stripe checkout session
  const stripeLineItems = cart.map((item) => ({
    name: item.productName,
    amount: Math.round(item.total.toFixed(2) * 100) / item.quantity,
    currency: "usd",
    quantity: item.quantity,
  }));

  //Create the Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],

    line_items: stripeLineItems,
    billing_address_collection: "required",
    shipping_address_collection: {
      allowed_countries: ["US"],
    },

    success_url: `${process.env.STRIPE_SUCCESS_URL}`,
    cancel_url: `${process.env.STRIPE_CANCEL_URL}`,
  });

  //Update the user document with the Stripe checkout session
  await User.findByIdAndUpdate(req.user.id, { stripeSession: session });

  //Return the session id
  res.json(session.id);
});

//If the Stripe checkout session succeeds
exports.stripeSuccess = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorHandler("User not found.", 404));
  }

  if (!user.stripeSession.id) {
    return next(
      new ErrorHandler("Invalid attempt to access this resource.", 400)
    );
  }

  //Retrieve the Stripe checkout session using the Stripe session id,
  //saved in the user document
  const session = await stripe.checkout.sessions.retrieve(
    user.stripeSession.id
  );

  //If the status of the session is not "paid"
  //the user should be accessing this route
  if (session.payment_status !== "paid") {
    return next(
      new ErrorHandler("Invalid attempt to access this resource.", 400)
    );
  }

  //Get the user cart, set feeds
  const cart = user.cart;
  const groupId = v4();
  const stripeFee = 0.029;
  const additionalStripeCharge = 30;
  const platformFee = 0.1;

  for (let i = 0; i < cart.length; i++) {
    const seller = await User.findById(cart[i].seller);
    const stripe_account_id = seller.stripe_account_id;

    //Subtract the feeds from amount the seller will be paid
    const amount = Math.round(cart[i].total.toFixed(2) * 100);
    const deduction =
      amount * (stripeFee + platformFee) + additionalStripeCharge;

    //Round the transfer amount to prevent errors
    const transferAmount = Math.round(amount - deduction);

    //Create a transfer to each seller for the amount
    //they should be paid based on what products were
    //sold in that user's cart.
    await stripe.transfers.create({
      amount: transferAmount,
      currency: "usd",
      destination: `${stripe_account_id}`,
      transfer_group: groupId,
    });
  }

  //Get the customer details from the Stripe session
  const custDetails = {
    name: session.shipping.name,
    streetAddress: session.shipping.address.line1,
    city: session.shipping.address.city,
    state: session.shipping.address.state,
    zipCode: session.shipping.address.postal_code,
  };

  //Call the checkout handling route and pass the
  //customer details so the seller can see who
  //bought their product and their address for shipping
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    const token = req.headers.authorization.split(" ")[1];
    await axios.post(
      `${process.env.API_URL}/checkout/${user.id}`,
      { custDetails },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
  }

  await User.findByIdAndUpdate(user.id, {
    $set: { stripeSession: {} },
  });

  res.json({ success: true });
});
