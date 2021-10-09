const mongoose = require("mongoose");
const slugify = require("slugify");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter a product name"],
      minLength: [2, "Product name must be at least 2 characters long"],
      maxLength: [12, "Product name can be at most 12 characters long"],
    },
    slug: String,
    description: {
      type: String,
      required: [true, "Please enter a description for the product"],
      minLength: [10, "Description must be at least 10 characters long"],
    },
    imageUrl: {
      type: String,
      required: [true, "Please upload an image"],
    },
    price: {
      type: Number,
      required: [true, "Please enter a price."],
    },
    quantity: {
      type: Number,
      required: [true, "Please enter a quantity."],
      min: [1, "Quantaty must be at least 1"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
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

//Creating product slug before saving
productSchema.pre("save", function (next) {
  //Creating slug before saving to DB
  this.slug = slugify(this.name, { lower: true });
  next();
});

productSchema.virtual("userData", {
  ref: "User",
  localField: "user",
  foreignField: "_id",
  justOne: false,
});

module.exports = mongoose.model("Product", productSchema);
