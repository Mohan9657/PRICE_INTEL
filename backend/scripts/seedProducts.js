require("dotenv").config();
const mongoose = require("mongoose");
const csv = require("csv-parser");
const fs = require("fs");
const Product = require("../models/Product");

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Mongo Connected for Seeding"));

const products = [];
const seenNames = new Set();

// 🟦 COMMON STORE TEMPLATE
function defaultStores() {
  return [
    { store: "Amazon", price: 0, link: "https://amazon.in" },
    { store: "Flipkart", price: 0, link: "https://flipkart.com" },
    { store: "Croma", price: 0, link: "https://croma.com" },
    { store: "Reliance Digital", price: 0, link: "https://reliancedigital.in" },
    { store: "Vijay Sales", price: 0, link: "https://vijaysales.com" }
  ];
}

// 🧠 Detect headset type from model name
function detectHeadsetType(model) {
  const m = model.toLowerCase();

  if (m.includes("airdopes") || m.includes("buds") || m.includes("pods"))
    return "Earbuds";

  if (m.includes("rockerz") || m.includes("neckband") || m.includes("bullets"))
    return "Bluetooth Neckband";

  if (m.includes("bassheads") || m.includes("wired"))
    return "Wired Earphone";

  return "Headphones";
}

// 🔵 PHONE LOADER
function loadPhones() {
  return new Promise((resolve) => {
    fs.createReadStream(__dirname + "/../dataset/phones.csv")
      .pipe(csv())
      .on("data", (row) => {
        const name = (row["Name"] || row["name"] || "").trim();
        const brand = (row["brand_name"] || row["brand"] || "").trim();

        if (name && brand && !seenNames.has(name.toLowerCase())) {
          seenNames.add(name.toLowerCase());

          const image = `https://tse3.mm.bing.net/th?q=${name.replace(/\s+/g, "+")}+smartphone&pid=Api&rs=1&c=1`;

          products.push({ name, brand, image, stores: defaultStores() });
        }
      })
      .on("end", resolve);
  });
}

// 🟢 LAPTOP LOADER
function loadLaptops() {
  return new Promise((resolve) => {
    fs.createReadStream(__dirname + "/../dataset/laptops.csv")
      .pipe(csv())
      .on("data", (row) => {
        const brand = (row["Manufacturer"] || "").trim();
        const model = (row["Model Name"] || "").trim();
        const cpu = (row["CPU"] || "").trim();
        const ram = (row["RAM"] || "").trim();
        const storage = (row["Storage"] || "").trim();

        if (brand && model && cpu) {
          const name = `${brand} ${model} ${cpu} ${ram} ${storage} Laptop`;

          if (!seenNames.has(name.toLowerCase())) {
            seenNames.add(name.toLowerCase());

            const image = `https://tse3.mm.bing.net/th?q=${name.replace(/\s+/g, "+")}&pid=Api&rs=1&c=1`;

            products.push({ name, brand, image, stores: defaultStores() });
          }
        }
      })
      .on("end", resolve);
  });
}

// 🟣 WATCHES LOADER
function loadWatches() {
  return new Promise((resolve) => {
    fs.createReadStream(__dirname + "/../dataset/watches.csv")
      .pipe(csv())
      .on("data", (row) => {
        const keys = Object.keys(row);
        const brand = (row[keys[0]] || "").trim();
        const model = (row[keys[1]] || "").trim();

        if (brand && model) {
          const name = `${brand} ${model} Smart Watch`;

          if (!seenNames.has(name.toLowerCase())) {
            seenNames.add(name.toLowerCase());

            const image = `https://tse3.mm.bing.net/th?q=${name.replace(/\s+/g, "+")}&pid=Api&rs=1&c=1`;

            products.push({ name, brand, image, stores: defaultStores() });
          }
        }
      })
      .on("end", resolve);
  });
}

// 🔴 HEADSET LOADER (NEW)
function loadHeadsets() {
  return new Promise((resolve) => {
    fs.createReadStream(__dirname + "/../dataset/headset.csv")
      .pipe(csv())
      .on("data", (row) => {
        const keys = Object.keys(row);
        const brand = (row[keys[0]] || "").trim();
        const model = (row[keys[1]] || "").trim();

        if (brand && model) {
          const type = detectHeadsetType(model);
          const name = `${brand} ${model} ${type}`;

          if (!seenNames.has(name.toLowerCase())) {
            seenNames.add(name.toLowerCase());

            const image = `https://tse3.mm.bing.net/th?q=${name.replace(/\s+/g, "+")}&pid=Api&rs=1&c=1`;

            products.push({ name, brand, image, stores: defaultStores() });
          }
        }
      })
      .on("end", resolve);
  });
}


// 🟡 TABLETS LOADER (NEW)
function loadTablets() {
  return new Promise((resolve) => {
    fs.createReadStream(__dirname + "/../dataset/tablets.csv")
      .pipe(csv())
      .on("data", (row) => {
        const name = (row["name"] || "").trim();
        const brand = (row["brand"] || "").trim();

        if (name && brand) {
          const fullName = `${name} Tablet`;

          if (!seenNames.has(fullName.toLowerCase())) {
            seenNames.add(fullName.toLowerCase());

            const image = `https://tse3.mm.bing.net/th?q=${name.replace(/\s+/g, "+")}&pid=Api&rs=1&c=1`;


            products.push({
              name: fullName,
              brand,
              image,
              stores: defaultStores(),
            });
          }
        }
      })
      .on("end", resolve);
  });
}

// 🚀 RUN ALL LOADERS
(async () => {
  await loadPhones();
  await loadLaptops();
  await loadWatches();
  await loadHeadsets();
   await loadTablets();

  console.log("Total Unique Products:", products.length);

  await Product.deleteMany({});
  await Product.insertMany(products);

  console.log("Seeding Done ✅");
  process.exit();
})();
