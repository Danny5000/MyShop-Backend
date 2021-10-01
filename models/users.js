const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
    },
    userName: {
      type: String,
      required: [true, "Please enter your username"],
      unique: true,
      minLength: [6, "Your username should be at least 6 characters long."],
    },
    email: {
      type: String,
      required: [true, "Please enter your email address"],
      unique: true,
      validate: [validator.isEmail, "Please enter a valid email address"],
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
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
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
      //virtuals: true
    },
    //toObject: { virtuals: true },
  }
);

//Encrypting passwords before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model("User", userSchema);
