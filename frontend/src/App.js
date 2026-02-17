import React, { useState, useEffect } from "react";
import Dashboard from "./Dashboard";
import OfflineStore from "./OfflineStore";   // ✅ ADDED

function App() {
  const [showDashboard, setShowDashboard] = useState(false);
  const [showOffline, setShowOffline] = useState(false);  // ✅ ADDED

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [prices, setPrices] = useState([]);

  const [showAdvice, setShowAdvice] = useState(false);
  const [showFestival, setShowFestival] = useState(false);

  const [festivalMessage, setFestivalMessage] = useState("");

  const [email, setEmail] = useState("");
  const [savedEmail, setSavedEmail] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("userEmail");
    if (stored) setSavedEmail(stored);
  }, []);

  if (showOffline) {
    return <OfflineStore onBack={() => setShowOffline(false)} />;
  }

  if (showDashboard) {
    return (
      <div style={{ padding: "40px", fontFamily: "'Inter', sans-serif", background: "#f8f9fa", minHeight: "100vh" }}>
        <button
          onClick={() => setShowDashboard(false)}
          style={{
            marginBottom: "20px",
            padding: "10px 20px",
            background: "#1a1a1a",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            transition: "all 0.3s ease",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
          }}
        >
          ⬅ Back to Home
        </button>
        <Dashboard />
      </div>
    );
  }

  const handleChange = async (e) => {
    const value = e.target.value;
    setQuery(value);

    if (value.length > 0) {
      const res = await fetch(`http://localhost:5000/api/suggest?q=${value}`);
      const data = await res.json();
      setSuggestions(data);
    } else {
      setSuggestions([]);
    }
  };

  const searchProducts = async (searchText = query) => {
    const res = await fetch(`http://localhost:5000/api/search?q=${searchText}`);
    const data = await res.json();

    setResults(data);
    setSelected(null);
    setSuggestions([]);
    setPrices([]);
    setShowAdvice(false);
    setShowFestival(false);
    setFestivalMessage("");
    setMessage("");
  };

  const openProduct = async (p) => {
    setSelected(p);
    setShowAdvice(false);
    setShowFestival(false);
    setFestivalMessage("");
    setMessage("");

    const res = await fetch(
      `http://localhost:5000/api/live-price/${p._id}`
    );
    const data = await res.json();
    setPrices(data);
  };

  const handleRateClick = () => {
    setShowAdvice(true);
    setShowFestival(false);
    setFestivalMessage("");
    setMessage("");
  };

  const handleFestivalClick = async () => {
    setShowFestival(true);
    setShowAdvice(false);
    setMessage("");

    const res = await fetch("http://localhost:5000/api/festival-suggestion");
    const data = await res.json();
    setFestivalMessage(data.message);
  };

  const activateAlert = async () => {
    if (!selected) return;

    const finalEmail = savedEmail || email;

    if (!finalEmail) {
      setMessage("Please enter your email.");
      return;
    }

    const res = await fetch("http://localhost:5000/api/price-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: selected._id,
        email: finalEmail,
      }),
    });

    const data = await res.json();

    if (!savedEmail) {
      localStorage.setItem("userEmail", finalEmail);
      setSavedEmail(finalEmail);
    }

    if (data.message === "Already subscribed.") {
      setMessage("✅ We already have your email. We'll inform you.");
    } else {
      setMessage("🔔 You will be notified when price drops!");
    }

    setEmail("");
  };

  return (
    <div
      style={{
        padding: "40px",
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        minHeight: "100vh",
        color: "#2d3436"
      }}
    >
      <h1 style={{ textAlign: "center", fontWeight: "800", letterSpacing: "-1px", marginBottom: "40px", fontSize: "2.5rem" }}>
        Electronics Price Intelligence
      </h1>

      {!selected && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "20px",
            marginBottom: "40px",
            gap: "15px"
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              searchProducts();
            }}
            style={{ display: "flex", alignItems: "center", position: "relative" }}
          >
            <input
              value={query}
              onChange={handleChange}
              placeholder="Search products..."
              style={{ 
                width: "400px", 
                padding: "15px 25px", 
                borderRadius: "30px", 
                border: "none", 
                boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                fontSize: "16px",
                outline: "none"
              }}
            />
            <button type="submit" style={{ 
              position: "absolute",
              right: "10px",
              height: "40px", 
              padding: "0 25px",
              background: "#636e72",
              color: "white",
              border: "none",
              borderRadius: "20px",
              cursor: "pointer",
              fontWeight: "600"
            }}>
              Search
            </button>

            {suggestions.length > 0 && (
              <div
                style={{
                  border: "none",
                  position: "absolute",
                  top: "60px",
                  left: "20px",
                  width: "360px",
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(10px)",
                  zIndex: 1000,
                  borderRadius: "15px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  overflow: "hidden"
                }}
              >
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    style={{ 
                      padding: "12px 20px", 
                      cursor: "pointer",
                      borderBottom: "1px solid #f1f1f1",
                      transition: "background 0.2s"
                    }}
                    onClick={() => {
                      setQuery(s.name);
                      searchProducts(s.name);
                    }}
                    onMouseEnter={(e) => e.target.style.background = "#f8f9fa"}
                    onMouseLeave={(e) => e.target.style.background = "transparent"}
                  >
                    {s.name}
                  </div>
                ))}
              </div>
            )}
          </form>

          <button
            onClick={() => setShowDashboard(true)}
            style={{
              height: "50px",
              padding: "0 30px",
              background: "#0984e3",
              color: "white",
              border: "none",
              borderRadius: "30px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 4px 10px rgba(9, 132, 227, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            📊 Dashboard
          </button>

          <button
            onClick={() => setShowOffline(true)}
            style={{
              height: "50px",
              padding: "0 30px",
              background: "#00b894",
              color: "white",
              border: "none",
              borderRadius: "30px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 4px 10px rgba(0, 184, 148, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            🏪 Offline Store
          </button>
        </div>
      )}

      {/* 🔥 NEW ADDED SECTIONS */}
      {!selected && results.length === 0 && (
        <div style={{ marginTop: "20px" }}>

          {/* Section 1 */}
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <h1 style={{ fontSize: "2.8rem", color: "#2d3436" }}>Smart Shopping Starts Here</h1>
            <p style={{ maxWidth: "700px", margin: "20px auto", fontSize: "1.1rem", color: "#636e72", lineHeight: "1.6" }}>
              Track real-time online price drops, monitor festival offers,
              discover nearby offline stores, and receive instant email alerts
              when prices fall.
            </p>
          </div>

          {/* Section 2 */}
          <div style={{ display: "flex", justifyContent: "center", gap: "25px", flexWrap: "wrap", marginBottom: "80px" }}>
            {[
              { title: "📉 Live Price Tracking", desc: "Monitor real-time price changes across multiple online platforms.", color: "#74b9ff" },
              { title: "🔔 Smart Price Alerts", desc: "Get instant email notifications when your product price drops.", color: "#a29bfe" },
              { title: "🏪 Nearby Offline Stores", desc: "Discover local stores near you for better price comparison.", color: "#55efc4" },
              { title: "📊 Analytics Dashboard", desc: "Visual insights and smart analytics for smarter buying decisions.", color: "#fab1a0" }
            ].map((card, index) => (
              <div key={index} style={{
                width: "240px",
                padding: "30px",
                background: "rgba(255, 255, 255, 0.7)",
                backdropFilter: "blur(10px)",
                borderRadius: "20px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                textAlign: "center",
                border: "1px solid rgba(255,255,255,0.3)",
                transition: "transform 0.3s ease"
              }}>
                <div style={{ height: "4px", width: "50px", background: card.color, margin: "0 auto 20px", borderRadius: "2px" }}></div>
                <h3 style={{ marginBottom: "15px", fontSize: "1.2rem" }}>{card.title}</h3>
                <p style={{ fontSize: "0.95rem", color: "#636e72" }}>{card.desc}</p>
              </div>
            ))}
          </div>

          {/* Section 3 */}
          <div style={{ 
            textAlign: "center", 
            marginBottom: "80px", 
            background: "rgba(255,255,255,0.4)", 
            padding: "50px", 
            borderRadius: "30px" 
          }}>
            <h2 style={{ marginBottom: "30px" }}>Why Choose Us?</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
              <div style={{ fontWeight: "600" }}>✔ Real-time monitoring</div>
              <div style={{ fontWeight: "600" }}>✔ Festival suggestions</div>
              <div style={{ fontWeight: "600" }}>✔ Offline comparison</div>
              <div style={{ fontWeight: "600" }}>✔ Intelligent alerts</div>
            </div>
          </div>

          {/* Section 4 - Footer */}
          <div style={{ textAlign: "center", padding: "40px 0", borderTop: "1px solid rgba(0,0,0,0.05)", color: "#636e72" }}>
            <p style={{ fontWeight: "600" }}>© 2026 Electronics Price Intelligence</p>
            <p>Need Help? support@ hemanthvulli531@gmail.com</p>
            <p style={{ marginTop: "10px" }}>Built with ❤️ by <strong>Mohan</strong></p>
          </div>

        </div>
      )}

      {!selected && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "25px", justifyContent: "center" }}>
          {results.map((p) => (
            <div
              key={p._id}
              style={{
                border: "none",
                padding: "20px",
                width: "240px",
                textAlign: "center",
                borderRadius: "20px",
                background: "white",
                boxShadow: "0 10px 20px rgba(0,0,0,0.05)",
                cursor: "pointer",
                transition: "transform 0.3s ease"
              }}
              onClick={() => openProduct(p)}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-10px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <img
                src={p.image}
                alt={p.name}
                style={{ width: "100%", height: "200px", objectFit: "contain", borderRadius: "10px", marginBottom: "15px" }}
              />
              <h4 style={{ margin: "10px 0 5px", color: "#2d3436" }}>{p.name}</h4>
              <p style={{ color: "#b2bec3", fontSize: "14px", fontWeight: "600" }}>{p.brand.toUpperCase()}</p>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div style={{ maxWidth: "1000px", margin: "40px auto", background: "white", padding: "40px", borderRadius: "30px", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}>
          <button
            onClick={() => setSelected(null)}
            style={{ 
              marginBottom: "30px", 
              padding: "10px 20px", 
              borderRadius: "10px", 
              border: "1px solid #dfe6e9", 
              background: "white", 
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            ⬅ Back to Products
          </button>

          <div style={{ display: "flex", gap: "40px", alignItems: "flex-start", flexWrap: "wrap" }}>
            <img
              src={selected.image}
              alt={selected.name}
              style={{ width: "400px", height: "400px", objectFit: "contain", borderRadius: "20px", background: "#f8f9fa" }}
            />
            
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: "2rem", marginBottom: "10px" }}>{selected.name}</h1>
              <p style={{ color: "#636e72", fontSize: "1.2rem", marginBottom: "30px" }}>Brand: {selected.brand}</p>
              
              <div style={{ display: "flex", gap: "10px", marginBottom: "30px" }}>
                <button onClick={handleRateClick} style={{ 
                  flex: 1, padding: "15px", borderRadius: "12px", border: "none", background: "#0984e3", color: "white", fontWeight: "600", cursor: "pointer"
                }}>
                  📊 Rate Prediction
                </button>
                <button onClick={handleFestivalClick} style={{ 
                  flex: 1, padding: "15px", borderRadius: "12px", border: "none", background: "#e17055", color: "white", fontWeight: "600", cursor: "pointer"
                }}>
                  🎉 Festival Suggestion
                </button>
              </div>

              {showAdvice && (
                <div style={{ padding: "20px", background: "#f1f2f6", borderRadius: "15px", borderLeft: "5px solid #0984e3" }}>
                  <h3 style={{ marginTop: 0 }}>📊 Price Insight</h3>
                  <p>If the current price fits your budget, you may proceed with purchase.</p>
                  <p style={{ fontWeight: "bold", color: "#0984e3" }}>
                    We’ll notify you immediately when the price decreases.
                  </p>

                  <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
                    {!savedEmail && (
                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #ced4da" }}
                      />
                    )}
                    <button
                      onClick={activateAlert}
                      style={{ padding: "12px 25px", background: "#0984e3", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
                    >
                      Notify Me
                    </button>
                  </div>
                  {message && <p style={{ marginTop: "15px", color: "#2d3436", fontWeight: "bold" }}>{message}</p>}
                </div>
              )}

              {showFestival && (
                <div style={{ padding: "20px", background: "#fff9f0", borderRadius: "15px", borderLeft: "5px solid #ff8800" }}>
                  <h3 style={{ marginTop: 0, color: "#d35400" }}>🎉 Festival Opportunity</h3>
                  <p>{festivalMessage}</p>
                  <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
                    {!savedEmail && (
                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #fab1a0" }}
                      />
                    )}
                    <button
                      onClick={activateAlert}
                      style={{ padding: "12px 25px", background: "#e17055", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
                    >
                      Notify Me
                    </button>
                  </div>
                  {message && <p style={{ marginTop: "15px", color: "#d35400", fontWeight: "bold" }}>{message}</p>}
                </div>
              )}
            </div>
          </div>

          <h2 style={{ marginTop: "50px", borderBottom: "2px solid #f1f1f1", paddingBottom: "10px" }}>Live Price Comparison</h2>

          <table style={{ marginTop: "20px", borderCollapse: "separate", borderSpacing: "0 10px", width: "100%" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#636e72" }}>
                <th style={{ padding: "15px" }}>Store</th>
                <th style={{ padding: "15px" }}>Price</th>
                <th style={{ padding: "15px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {prices.map((item, i) => (
                <tr key={i} style={{ background: "#f8f9fa", borderRadius: "10px" }}>
                  <td style={{ padding: "15px", fontWeight: "700", borderTopLeftRadius: "10px", borderBottomLeftRadius: "10px" }}>{item.store}</td>
                  <td style={{ padding: "15px", color: "#00b894", fontWeight: "800", fontSize: "1.1rem" }}>₹{item.price}</td>
                  <td style={{ padding: "15px", borderTopRightRadius: "10px", borderBottomRightRadius: "10px" }}>
                    <a href={item.link} target="_blank" rel="noreferrer" style={{ 
                      textDecoration: "none", background: "#2d3436", color: "white", padding: "8px 20px", borderRadius: "6px", fontSize: "0.9rem", fontWeight: "600"
                    }}>
                      Visit Store
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;