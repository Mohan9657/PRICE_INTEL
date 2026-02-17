const mongoose = require("mongoose");

const emailLogSchema = new mongoose.Schema({
  productId: mongoose.Schema.Types.ObjectId,
  store: String,
  email: String,
  oldPrice: Number,
  newPrice: Number,
  dropPercent: Number,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("EmailLog", emailLogSchema);

