require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const sgMail = require("@sendgrid/mail");
const cron = require("node-cron");
const NodeCache = require("node-cache");
const { createClient } = require("redis");

const EmailLog = require("./models/EmailLog");
const Product = require("./models/Product");
const PriceHistory = require("./models/PriceHistory");
const PriceAlert = require("./models/PriceAlert");
const OfflineAnalytics = require("./models/OfflineAnalytics");

const { getPricesFromSerper } = require("./utils/serperPrice");

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("Mongo Error:", err.message));

const app = express();
app.use(cors());
app.use(express.json());

app.get("/ping", (req, res) => {
  res.status(200).send("Server Alive 🚀");
});


sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/* ================= HYBRID CACHE SETUP ================= */

let redisClient = null;
let cache;
let useRedis = false;

if (process.env.REDIS_URL) {
  console.log("🚀 Using Redis Cache");

  redisClient = createClient({
    url: process.env.REDIS_URL
  });

  redisClient.connect().catch(console.error);
  useRedis = true;

} else {
  console.log("🖥 Using Node Memory Cache");

  cache = new NodeCache({
    stdTTL: 300,
    checkperiod: 60
  });
}

async function cacheGet(key) {
  if (useRedis) {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } else {
    return cache.get(key);
  }
}

async function cacheSet(key, value, ttl = 300) {
  if (useRedis) {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
  } else {
    cache.set(key, value, ttl);
  }
}

/* ===================================================== */
/* 🔍 SEARCH */
/* ===================================================== */
app.get("/api/search", async (req, res) => {

  const q = req.query.q;
  const cacheKey = `search-${q}`;

  const cached = await cacheGet(cacheKey);
  if (cached) {
    console.log("⚡ Search from cache");
    return res.json(cached);
  }

  const products = await Product.aggregate([
    { $match: { name: { $regex: q, $options: "i" } } },
    { $group: { _id: "$name", doc: { $first: "$$ROOT" } } },
    { $replaceRoot: { newRoot: "$doc" } },
    { $limit: 20 }
  ]);

  await cacheSet(cacheKey, products, 120);
  res.json(products);
});

/* ===================================================== */
/* 💡 SUGGEST */
/* ===================================================== */
app.get("/api/suggest", async (req, res) => {

  const q = req.query.q;
  if (!q) return res.json([]);

  const cacheKey = `suggest-${q}`;
  const cached = await cacheGet(cacheKey);

  if (cached) {
    console.log("⚡ Suggest from cache");
    return res.json(cached);
  }

  const suggestions = await Product.find({
    name: { $regex: "^" + q, $options: "i" }
  }).limit(8).select("name");

  await cacheSet(cacheKey, suggestions, 120);
  res.json(suggestions);
});

/* ===================================================== */
/* 🔥 LIVE PRICE */
/* ===================================================== */
app.get("/api/live-price/:id", async (req, res) => {

  const cacheKey = `live-price-${req.params.id}`;
  const cached = await cacheGet(cacheKey);

  if (cached) {
    console.log("⚡ Live price from cache");
    return res.json(cached);
  }

  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.json([]);

    const prices = await getPricesFromSerper(product.name, product._id);

    await cacheSet(cacheKey, prices, 300);
    res.json(prices);

  } catch (err) {
    console.log("Live Price Error:", err.message);
    res.json([]);
  }
});


/* ===================================================== */
/* 🔔 SAVE ALERT */
/* ===================================================== */
app.post("/api/price-alert", async (req, res) => {
  try {

    const { productId, email } = req.body;

    const exists = await PriceAlert.findOne({ productId, email });

    if (exists) {
      return res.json({ message: "Already subscribed." });
    }

    await PriceAlert.create({
      productId,
      email,
      lastNotifiedPrice: 0
    });

    console.log("✅ Alert saved:", email);

    res.json({ message: "Alert Activated Successfully" });

  } catch (err) {
    console.log("Alert Error:", err.message);
    res.json({ message: "Alert failed." });
  }
});

/* ===================================================== */
/* 🎉 FESTIVAL SUGGESTION */
/* ===================================================== */
app.get("/api/festival-suggestion", (req, res) => {

  const festivals = [
    { name: "Maha Shivaratri", date: "2026-02-15" },
    { name: "Holi", date: "2026-03-03" },
    { name: "Ugadi", date: "2026-03-18" },
    { name: "Ram Navami", date: "2026-03-27" },
    { name: "Raksha Bandhan", date: "2026-08-30" },
    { name: "Ganesh Chaturthi", date: "2026-09-07" },
    { name: "Navratri", date: "2026-10-03" },
    { name: "Dussehra", date: "2026-10-12" },
    { name: "Diwali", date: "2026-10-29" },
    { name: "Christmas", date: "2026-12-25" }
  ];

  const today = new Date();
  let upcoming = null;

  for (let fest of festivals) {
    const festDate = new Date(fest.date);
    const diffDays = Math.ceil((festDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays <= 7) {
      upcoming = { name: fest.name, daysLeft: diffDays };
      break;
    }
  }

  if (upcoming) {
    res.json({
      message: `🎉 In ${upcoming.daysLeft} day(s): ${upcoming.name}. Big sales expected. Prices may drop soon! Stay calm and monitor.`
    });
  } else {
    res.json({
      message: "📅 No major festival within 7 days."
    });
  }
});

/* ===================================================== */
/* 📧 SEND EMAIL */
/* ===================================================== */
async function sendDropEmail(product, item, oldPrice, dropPercent, alert) {

  const msg = {
    to: alert.email,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: `🔥 ${dropPercent.toFixed(2)}% Price Drop - ${product.name}`,
    html: `
      <div style="font-family: Arial; padding:20px;">
        <h2 style="color:#ff4d4f;">🔥 Price Drop Alert</h2>
        <div style="background:#f5f5f5; padding:20px; border-radius:10px;">
          <h3>${product.name}</h3>
          <p><strong>Store:</strong> ${item.store}</p>
          <p><strong>Old Price:</strong> ₹${oldPrice}</p>
          <p style="font-size:18px;">
            <strong>New Price:</strong> 
            <span style="color:#28a745;">₹${item.price}</span>
          </p>
          <p><strong>Drop:</strong> ${dropPercent.toFixed(2)}%</p>
          <a href="${item.link}" 
            style="display:inline-block;
                   margin-top:15px;
                   padding:12px 20px;
                   background:#007bff;
                   color:white;
                   text-decoration:none;
                   border-radius:6px;">
            Buy Now
          </a>
        </div>
      </div>
    `
  };

  await sgMail.send(msg);

  await EmailLog.create({
    productId: product._id,
    store: item.store,
    email: alert.email,
    oldPrice,
    newPrice: item.price,
    dropPercent
  });

  console.log("✅ Email sent:", alert.email);
}

/* ===================================================== */
/* ⏰ BACKGROUND SCHEDULER (Every 6 Hours) */
/* ===================================================== */

cron.schedule("0 */6 * * *", async () => {

  console.log("⏰ Background scheduler running...");

  try {

    const alerts = await PriceAlert.find();

    for (let alert of alerts) {

      const product = await Product.findById(alert.productId);
      if (!product) continue;

      const prices = await getPricesFromSerper(product.name, product._id);

      for (let item of prices) {

        const last = await PriceHistory.findOne({
          productId: product._id,
          store: item.store
        }).sort({ date: -1 });

        if (!last) {
          await PriceHistory.create({
            productId: product._id,
            store: item.store,
            price: item.price,
            date: new Date()
          });
          continue;
        }

        const dropPercent =
          ((last.price - item.price) / last.price) * 100;

        console.log(
          `Store: ${item.store} | Old: ${last.price} | New: ${item.price} | Drop: ${dropPercent.toFixed(2)}%`
        );

        if (dropPercent >= 1) {

          if (alert.lastNotifiedPrice &&
              item.price >= alert.lastNotifiedPrice) {
            continue;
          }

          await sendDropEmail(product, item, last.price, dropPercent, alert);

          alert.lastNotifiedPrice = item.price;
          await alert.save();
        }

        await PriceHistory.create({
          productId: product._id,
          store: item.store,
          price: item.price,
          date: new Date()
        });
      }
    }

    console.log("✅ Scheduler cycle complete");

  } catch (err) {
    console.log("Scheduler Error:", err.message);
  }

});

/* ===================================================== */
/* 📊 DASHBOARD ANALYTICS */
/* ===================================================== */

app.get("/api/dashboard-stats", async (req, res) => {
  try {

    const totalProducts = await Product.countDocuments();
    const totalAlerts = await PriceAlert.countDocuments();
    const totalEmailsSent = await EmailLog.countDocuments();

    // ================= OFFLINE AGGREGATION =================
const offlineData = await OfflineAnalytics.find();

const totalStoreViews = offlineData.reduce((sum, s) => sum + s.views, 0);
const totalMapClicks = offlineData.reduce((sum, s) => sum + s.mapClicks, 0);
const totalReviewClicks = offlineData.reduce((sum, s) => sum + s.reviewClicks, 0);

const mostViewedStore =
  offlineData.sort((a, b) => b.views - a.views)[0]?.storeName || "None";


    /* ================= DEMO MODE ================= */
    if (totalAlerts < 20) {
     return res.json({
  totalProducts: 6380,
  totalAlerts: 128,
  totalEmailsSent: 342,
  topProduct: "iQOO Z9s Pro 256GB",
  storeDrops: {
    Amazon: 14,
    Flipkart: 22,
    Croma: 7,
    "Reliance Digital": 5
  },
  offlineStats: {
    totalStoreViews: 245,
    totalMapClicks: 121,
    totalReviewClicks: 89,
    mostViewedStore: "Sri Venkateswara Mobiles"
  },
  demoMode: true
});

    }

    const topProductData = await PriceAlert.aggregate([
      { $group: { _id: "$productId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    let topProduct = "No Data";

    if (topProductData.length > 0) {
      const product = await Product.findById(topProductData[0]._id);
      if (product) topProduct = product.name;
    }

    const storeDrops = await EmailLog.aggregate([
      { $group: { _id: "$store", count: { $sum: 1 } } }
    ]);

    const formattedStoreDrops = {};
    storeDrops.forEach(s => {
      formattedStoreDrops[s._id] = s.count;
    });

    res.json({
  totalProducts,
  totalAlerts,
  totalEmailsSent,
  topProduct,
  storeDrops: formattedStoreDrops,
  offlineStats: {
    totalStoreViews,
    totalMapClicks,
    totalReviewClicks,
    mostViewedStore
  }
});


  } catch (err) {
    console.log("Dashboard Error:", err.message);
    res.json({ message: "Dashboard failed" });
  }
});

/* ===================================================== */
/* 🏪 OFFLINE STORE (NOW CACHED) */
/* ===================================================== */

const axios = require("axios");

app.get("/api/offline-stores", async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.json([]);

    const cacheKey = `offline-${lat}-${lng}`;
    const cached = await cacheGet(cacheKey);

    if (cached) {
      console.log("⚡ Offline stores from cache");
      return res.json(cached);
    }

    const query = `
      [out:json];
      (
        node["shop"](around:10000,${lat},${lng});
      );
      out body;
    `;

    const response = await axios.post(
      "https://overpass-api.de/api/interpreter",
      query,
      {
        headers: {
          "Content-Type": "text/plain",
          "User-Agent": "Price-Intel-App"
        },
        timeout: 15000
      }
    );

    const stores = response.data.elements
      .filter(el => {
        const name = el.tags?.name?.toLowerCase() || "";
        return (
          name.includes("mobile") ||
          name.includes("electronics") ||
          name.includes("laptop") ||
          name.includes("computer") ||
          name.includes("digital")
        );
      })
      .map((el) => {

        const name = el.tags?.name || "Unnamed Store";

        const image = `https://tse3.mm.bing.net/th?q=${encodeURIComponent(name + " electronics store exterior")}&pid=Api&rs=1&c=1`;

        return {
          name,
          lat: el.lat,
          lng: el.lon,
          phone: el.tags?.phone || "Not Available",
          website: el.tags?.website || "Not Available",
          openingHours: el.tags?.opening_hours || "Not Available",
          brand: el.tags?.brand || "Not Available",
          shopType: el.tags?.shop || "Not Available",
          address: `${el.tags?.["addr:street"] || ""} ${el.tags?.["addr:city"] || ""}`.trim() || "Not Available",
          image
        };
      });

    const finalStores = stores.slice(0, 20);
    await cacheSet(cacheKey, finalStores, 300);

    res.json(finalStores);

  } catch (err) {
    console.log("Offline Store Error:", err.message);
    res.json([]);
  }
});


/* ===================================================== */
/* 📊 OFFLINE TRACKING */
/* ===================================================== */

app.post("/api/offline-track/view", async (req, res) => {
  try {
    const { storeName } = req.body;

    await OfflineAnalytics.findOneAndUpdate(
      { storeName },
      { $inc: { views: 1 } },
      { upsert: true }
    );

    res.json({ success: true });
  } catch (err) {
    console.log("Offline View Error:", err.message);
    res.json({ success: false });
  }
});

app.post("/api/offline-track/map", async (req, res) => {
  try {
    const { storeName } = req.body;

    await OfflineAnalytics.findOneAndUpdate(
      { storeName },
      { $inc: { mapClicks: 1 } },
      { upsert: true }
    );

    res.json({ success: true });
  } catch (err) {
    console.log("Offline Map Error:", err.message);
    res.json({ success: false });
  }
});

app.post("/api/offline-track/review", async (req, res) => {
  try {
    const { storeName } = req.body;

    await OfflineAnalytics.findOneAndUpdate(
      { storeName },
      { $inc: { reviewClicks: 1 } },
      { upsert: true }
    );

    res.json({ success: true });
  } catch (err) {
    console.log("Offline Review Error:", err.message);
    res.json({ success: false });
  }
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => 
  console.log(`🚀 Server running on port ${PORT}`)
);