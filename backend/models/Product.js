const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema({
  store: String,
  price: Number,
  link: String
});

const productSchema = new mongoose.Schema({
  name: String,
  brand: String,
  image: String,
  stores: [storeSchema]
});

module.exports = mongoose.model("Product", productSchema);
