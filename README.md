
# 🚀 Electronics Price Intelligence Platform

A full-stack intelligent price tracking & alert automation system built with performance optimization and cost-efficient architecture.

---

# 🧠 Project Vision

Instead of building a basic price comparison app, this system was engineered to:

* Reduce external API dependency
* Automate price monitoring
* Track multi-store price history
* Send intelligent price drop alerts
* Provide festival-based buying insights
* Deliver analytics dashboard insights
* Track offline store engagement
* Run almost fully on FREE resources

---

# 🌍 Live Deployment

### 🔹 Frontend (Vercel)

[https://price-intel-phi.vercel.app/](https://price-intel-phi.vercel.app/)

### 🔹 Backend (Render)

[https://price-intel-rnjr.onrender.com](https://price-intel-rnjr.onrender.com)

---

# 🏗️ System Architecture

## 🔹 Frontend

* React.js
* Fetch API
* LocalStorage
* Conditional Rendering
* Dashboard Visualization
* Offline Store UI
* Google Maps Integration

## 🔹 Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* Node-Cron (scheduler)
* SendGrid (email service)
* Hybrid Cache (NodeCache + Redis)

## 🔹 External APIs

* Serper API (Live price scraping)
* Bing image URLs (for product image enhancement)
* OpenStreetMap Overpass API (Offline stores)

---

# 🏪 Offline Store Intelligence System

One of the advanced features added beyond normal price trackers.

## 🔎 What It Does

When user clicks **Offline Store**:

* Fetches nearby electronics stores using:

  ```
  OpenStreetMap Overpass API
  ```
* Uses browser Geolocation API
* Displays:

  * Store name
  * Image
  * Phone
  * Website
  * Opening hours
  * Google Maps link
  * Ratings link

---

## 📊 Offline Engagement Tracking

Every user interaction is tracked in MongoDB:

Tracked Events:

* Store View Click
* Google Map Click
* Review Button Click

Collection:

```
OfflineAnalytics
```

Stored fields:

* storeName
* views
* mapClicks
* reviewClicks

---

# 📊 Enhanced Dashboard (Online + Offline Analytics)

API:

```
/api/dashboard-stats
```

Now shows:

### Online Metrics

* Total Products
* Total Alerts
* Total Emails Sent
* Most Tracked Product
* Store Drop Frequency

### Offline Metrics

* Total Store Views
* Total Google Map Clicks
* Total Review Clicks
* Most Popular Store (based on highest views)

This means:

If 2 users view Store A
And 5 users view Store B

Dashboard automatically shows:

```
Most Popular Store: Store B
```

Fully dynamic based on real data.

---

# 📦 DATA ENGINEERING (Main Optimization Layer)

This is the most important part of the project.

Instead of relying entirely on external APIs for product search, I used:

## 🔥 4 Kaggle Datasets

Used real electronics datasets from Kaggle:

1. Mobile Phones dataset
2. Laptops dataset
3. Tablets dataset
4. Smart Watches / Headsets dataset

These datasets were:

* Downloaded as CSV files
* Cleaned in Excel
* Normalized columns
* Standardized naming
* Assigned placeholder images
* Seeded into MongoDB

---

## 📥 Seeding Strategy

Converted CSV → JSON → Inserted into MongoDB using a seeding script.

Each product stored with:

* name
* brand
* category
* placeholder image

This allows:

✔ Instant product search
✔ No API cost for searching
✔ High-speed suggestions
✔ Controlled product catalog
✔ Scalable architecture

This reduces API usage by 80–90%.

---

# 🖼️ Image Strategy

During seeding:

Initial image:

```
https://via.placeholder.com/200
```

Later replaced with:

* Bing image URLs (static links)
* Or maintained placeholder for optimization

Why?
Because image APIs are expensive.
This keeps the system FREE.

---

# 🛒 Supported Stores (Live Price Layer)

When user clicks a product:

Live prices fetched from:

* Amazon
* Flipkart
* Croma
* Reliance Digital

Prices normalized to:

```
{
  store,
  price,
  link
}
```

---

# 📊 Price History Engine

Every scheduler cycle:

* Store previous price
* Save timestamp
* Maintain store-wise history

Collection:

```
PriceHistory
```

Used for drop detection and analytics.

---

# 📉 Intelligent Drop Detection

Formula used:

```
Drop % = (Old - New) / Old × 100
```

Rule:

* If drop ≥ 1%
* And price lower than last notified price
  → Send alert

Prevents spam emails.

---

# 📧 Email Automation System

When drop condition satisfied:

Email includes:

* Product name
* Store name
* Old price
* New price
* Drop %
* Direct buy link

All emails logged in:

```
EmailLog collection
```

---

# ⏰ Background Scheduler

Using:

```
node-cron
```

Runs every 6 hours:

* Fetch all active alerts
* Check latest price
* Compare with history
* Send alert if drop ≥ 1%
* Save new history

Fully automated system.

---

# 🎉 Festival Intelligence Engine

If a major festival is within 7 days:

Displays:

> "Big sales expected. Prices may drop soon. Stay calm and monitor."

Adds predictive buying guidance.

---

# 🎭 Smart Demo Mode Strategy

If:

```
totalAlerts < 20
```

System returns demo analytics.

Once real alerts ≥ 20:
Automatically switches to real database metrics.

---

# ⚡ Advanced Performance Optimization

## 1️⃣ Hybrid Caching (Production Ready)

Implemented:

```
Redis (Production)
Node Memory Cache (Local Development)
```

Logic:

If `REDIS_URL` exists → use Redis
Else → fallback to NodeCache

This makes system:

✔ Production scalable
✔ Faster
✔ Cost efficient

---

## 2️⃣ Cold Start Prevention

Used uptime monitoring to ping:

```
/ping
```

Keeps Render backend awake.
Reduces first-load latency.

---

# 💰 Cost Optimization Strategy

Everything designed for free tier usage:

| Service            | Purpose            | Cost      |
| ------------------ | ------------------ | --------- |
| MongoDB Atlas      | Database           | Free      |
| SendGrid           | Email              | Free tier |
| Serper API         | Price data         | Free tier |
| Redis (Render)     | Production caching | Free tier |
| Node-Cron          | Scheduler          | Free      |
| Kaggle Datasets    | Product data       | Free      |
| Bing static images | Product images     | Free      |
| React + Vercel     | Frontend hosting   | Free      |
| Render             | Backend hosting    | Free      |

No paid infrastructure required.

---

# 🗄️ Database Collections

## Products

* name
* brand
* category
* image

## PriceHistory

* productId
* store
* price
* date

## PriceAlert

* productId
* email
* lastNotifiedPrice

## EmailLog

* productId
* store
* email
* oldPrice
* newPrice
* dropPercent

## OfflineAnalytics

* storeName
* views
* mapClicks
* reviewClicks

---

# 🧩 Engineering Concepts Demonstrated

* Data Seeding
* Aggregation Pipelines
* Event-driven automation
* Scheduler architecture
* Hybrid caching
* API limit optimization
* Cost-aware backend design
* Multi-store normalization
* Offline analytics tracking
* Dashboard metric aggregation
* Demo-mode switching logic
* Production-level email system
* Deployment on Render & Vercel

---

# 👨‍💻 Developer

Built with system-level thinking and cost-optimized engineering by:

**Mohan**

Focused on:

* Performance
* Scalability
* Automation
* Real-world deployment
* Production-ready backend logic

