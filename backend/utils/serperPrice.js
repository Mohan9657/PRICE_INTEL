const axios = require("axios");
const PriceHistory = require("../models/PriceHistory");
const Alert = require("../models/PriceAlert");
const nodemailer = require("nodemailer");

function extractPrice(text) {
  if (!text) return null;

  const matches = text.match(/₹\s?[\d,]+/g);
  if (!matches) return null;

  const prices = matches
    .map(p => parseInt(p.replace(/[₹,\s]/g, "")))
    .filter(p => p >= 1000);

  if (prices.length === 0) return null;

  return Math.max(...prices);
}

// 📧 Mail sender
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

async function checkAlerts(productId, price, productName) {
  const alerts = await Alert.find({ productId });

  for (let alert of alerts) {
    if (price <= alert.targetPrice) {
      await transporter.sendMail({
        from: process.env.MAIL_USER,
        to: alert.email,
        subject: `Price Drop Alert for ${productName}`,
        text: `Good news! Price dropped to ₹${price}. Check now!`
      });
    }
  }
}

async function searchStore(query, storeName, productId) {
  try {
    const res = await axios.post(
      "https://google.serper.dev/search",
      {
        q: `${query} price ${storeName}`,
        gl: "in",
        hl: "en",
      },
      {
        headers: {
          "X-API-KEY": process.env.SERPER_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    const results = res.data.organic || [];

    for (let r of results) {
      const price = extractPrice(r.snippet || "");
      if (price) {

        await PriceHistory.create({
          productId,
          store: storeName,
          price
        });

        await checkAlerts(productId, price, query);

        return {
          store: storeName,
          price,
          link: r.link,
        };
      }
    }

    return null;
  } catch (err) {
    return null;
  }
}

async function getPricesFromSerper(query, productId) {
  const stores = ["Amazon", "Flipkart", "Croma", "Reliance Digital"];
  const final = [];

  for (let store of stores) {
    const data = await searchStore(query, store, productId);
    if (data) final.push(data);
  }

  return final;
}

module.exports = { getPricesFromSerper };
