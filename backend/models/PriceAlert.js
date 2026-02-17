const mongoose = require("mongoose");

const priceAlertSchema = new mongoose.Schema({
  productId: mongoose.Schema.Types.ObjectId,
  email: String,
  lastNotifiedPrice: Number
});

module.exports = mongoose.model("PriceAlert", priceAlertSchema);
