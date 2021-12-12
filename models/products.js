const mongoose = require("mongoose");
const slugify = require("slugify");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter a product name"],
      minLength: [2, "Product name must be at least 2 characters long"],
      maxLength: [12, "Product name can be at most 12 characters long"],
      trim: true,
    },
    slug: String,
    description: {
      type: String,
      required: [true, "Please enter a description for the product"],
      minLength: [10, "Description must be at least 10 characters long"],
      trim: true,
    },
    imageUrl: {
      type: String,
      required: [true, "Please upload an image"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Please enter a price."],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, "Please enter a quantity."],
      min: [0, "Quantity cannot be below 0"],
      trim: true,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    //Format id field
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

//Creating product slug before saving
productSchema.pre("save", function (next) {
  //Creating slug before saving to DB
  this.slug = slugify(this.name, { lower: true });
  next();
});

//Allow to use virtual fields from the user collection
productSchema.virtual("userData", {
  ref: "User",
  localField: "user",
  foreignField: "_id",
  justOne: false,
});

module.exports = mongoose.model("Product", productSchema);
