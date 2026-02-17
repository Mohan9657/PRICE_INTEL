const mongoose = require("mongoose");

const offlineAnalyticsSchema = new mongoose.Schema({
  storeName: { type: String, required: true },
  views: { type: Number, default: 0 },
  mapClicks: { type: Number, default: 0 },
  reviewClicks: { type: Number, default: 0 }
});

module.exports = mongoose.model("OfflineAnalytics", offlineAnalyticsSchema);

