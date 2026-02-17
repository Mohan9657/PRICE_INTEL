const mongoose = require("mongoose");

const priceHistorySchema = new mongoose.Schema({
  productId: mongoose.Schema.Types.ObjectId,
  store: String,
  price: Number,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("PriceHistory", priceHistorySchema);
