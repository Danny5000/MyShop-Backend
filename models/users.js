const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
//const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
      trim: true,
    },
    userName: {
      type: String,
      required: [true, "Please enter your username"],
      unique: true,
      minLength: [2, "Your username should be at least 6 characters long."],
      maxLength: [12, "Your username cannot be more than 12 characters long."],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please enter your email address"],
      unique: true,
      validate: [validator.isEmail, "Please enter a valid email address"],
      trim: true,
    },
    role: {
      type: String,
      default: "user",
    },
    password: {
      type: String,
      required: [true, "Please enter a password for your account"],
      minLength: [8, "Your password must be atleast 8 characters long"],
      select: false,
      trim: true,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    cart: {
      type: [Object],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    //resetPasswordToken: String,
    //resetPasswordExpire: Date,
  },
  {
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
      virtuals: true,
    },
    toObject: { virtuals: true },
  }
);

//Encrypting passwords before saving
//Removing spaces from username
userSchema.pre("save", async function (next) {
  //Remove any spaces in the username
  this.userName = this.userName.replaceAll(/\s+/g, "");

  //If the password is not being modified, do not call the hash function
  if (!this.isModified("password")) {
    next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

//Return JSON web token
userSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_TIME,
  });
};

//Compare user password with database password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.virtual("productData", {
  ref: "Product",
  localField: "_id",
  foreignField: "user",
  justOne: false,
});

module.exports = mongoose.model("User", userSchema);
