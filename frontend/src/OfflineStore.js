import React, { useEffect, useState } from "react";

function OfflineStore({ onBack }) {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [loadingStores, setLoadingStores] = useState(true); // ✅ NEW

  useEffect(() => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    setLoadingStores(true); // ✅ Show loader immediately

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;

      try {
        const res = await fetch(
          `http://localhost:5000/api/offline-stores?lat=${latitude}&lng=${longitude}`
        );

        const data = await res.json();
        setStores(data);
      } catch (err) {
        console.log("Offline fetch error:", err.message);
      } finally {
        setLoadingStores(false); // ✅ Stop loader
      }
    });
  }, []);

  // Reverse Geocode (Load Full Address)
  const fetchAddress = async (store) => {
    if (store.fullAddress && store.fullAddress !== "Not Available") {
      return store;
    }

    try {
      setLoadingAddress(true);

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${store.lat}&lon=${store.lng}`,
        {
          headers: {
            "User-Agent": "Price-Intel-App"
          }
        }
      );

      const data = await res.json();

      const formattedAddress =
        data.display_name || "Not Available";

      return { ...store, fullAddress: formattedAddress };

    } catch (err) {
      return { ...store, fullAddress: "Not Available" };
    } finally {
      setLoadingAddress(false);
    }
  };

  // ================= DETAIL VIEW =================
  if (selectedStore) {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedStore.name)}`;
    const exactLocationUrl = `https://www.google.com/maps/search/?api=1&query=${selectedStore.lat},${selectedStore.lng}`;

    const openingHours =
      selectedStore.opening_hours &&
      selectedStore.opening_hours !== "Not Available"
        ? selectedStore.opening_hours
        : "9:00 AM – 10:00 PM (Estimated)";

    return (
      <div style={{ padding: "40px", fontFamily: "'Segoe UI', sans-serif", maxWidth: "1000px", margin: "0 auto" }}>
        <button
          onClick={() => setSelectedStore(null)}
          style={{
            marginBottom: "30px",
            padding: "10px 20px",
            background: "#2d3436",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
          }}
        >
          ⬅ Back to Stores
        </button>

        <div style={{ background: "white", padding: "40px", borderRadius: "30px", boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}>
          <h1 style={{ marginBottom: "25px", fontSize: "2.5rem", fontWeight: "800" }}>{selectedStore.name}</h1>

          <img
            src={selectedStore.image}
            alt={selectedStore.name}
            style={{
              width: "100%",
              height: "400px",
              objectFit: "cover",
              borderRadius: "20px",
              marginBottom: "30px",
              boxShadow: "0 10px 20px rgba(0,0,0,0.05)"
            }}
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/650x350?text=Store+Image";
            }}
          />

          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
            gap: "20px",
            fontSize: "17px", 
            lineHeight: "1.6" 
          }}>
            <div style={infoBoxStyle}>
              <span style={{ fontSize: "22px" }}>📞</span>
              <strong>Phone</strong>
              <p style={{ margin: "5px 0 0", color: "#636e72" }}>{selectedStore.phone || "Not Available"}</p>
            </div>
            <div style={infoBoxStyle}>
              <span style={{ fontSize: "22px" }}>🕒</span>
              <strong>Opening Hours</strong>
              <p style={{ margin: "5px 0 0", color: "#636e72" }}>{openingHours}</p>
            </div>
            <div style={{ ...infoBoxStyle, gridColumn: "span 1" }}>
              <span style={{ fontSize: "22px" }}>📍</span>
              <strong>Address</strong>
              {loadingAddress ? (
                <p style={{ margin: "5px 0 0", color: "#0984e3" }}>Loading address...</p>
              ) : (
                <p style={{ margin: "5px 0 0", color: "#636e72" }}>{selectedStore.fullAddress || "Address not loaded"}</p>
              )}
            </div>
          </div>

          <div style={{ marginTop: "40px", display: "flex", gap: "15px", flexWrap: "wrap" }}>
            <button
              onClick={async () => {
                const updatedStore = await fetchAddress(selectedStore);
                setSelectedStore(updatedStore);
              }}
              style={{
                flex: 1,
                minWidth: "160px",
                padding: "15px",
                background: "#0984e3",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
            >
              📍 Load Full Address
            </button>

            <button
              onClick={() => window.open(mapsUrl, "_blank")}
              style={{
                flex: 1,
                minWidth: "160px",
                padding: "15px",
                background: "#f1c40f",
                color: "#2d3436",
                border: "none",
                borderRadius: "12px",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              ⭐ View Ratings
            </button>

            <button
              onClick={() => window.open(exactLocationUrl, "_blank")}
              style={{
                flex: 1,
                minWidth: "160px",
                padding: "15px",
                background: "#00b894",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              🗺 Google Maps
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================= LIST VIEW =================
  return (
    <div style={{ padding: "40px", fontFamily: "'Segoe UI', sans-serif", maxWidth: "1100px", margin: "0 auto" }}>
      <button
        onClick={onBack}
        style={{
          marginBottom: "30px",
          padding: "10px 20px",
          background: "#2d3436",
          color: "white",
          border: "none",
          borderRadius: "10px",
          cursor: "pointer",
          fontWeight: "600",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
        }}
      >
        ⬅ Back to Home
      </button>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "40px" }}>
        <h1 style={{ margin: 0, fontWeight: "800", fontSize: "2.2rem" }}>🏪 Nearby Stores</h1>
        <div style={{ background: "#00b894", color: "white", padding: "5px 15px", borderRadius: "20px", fontSize: "14px", fontWeight: "700" }}>
          LIVE LOCATION ACTIVE
        </div>
      </div>

      {loadingStores && (
        <div style={{ textAlign: "center", padding: "100px 0" }}>
          <h3 style={{ color: "#636e72" }}>🔄 Scanning local area for stores...</h3>
        </div>
      )}

      {!loadingStores && (
        <div style={{ background: "white", borderRadius: "25px", overflow: "hidden", boxShadow: "0 15px 35px rgba(0,0,0,0.05)" }}>
          <table
            style={{
              borderCollapse: "separate",
              borderSpacing: "0",
              width: "100%",
            }}
          >
            <thead style={{ background: "#f8f9fa" }}>
              <tr>
                <th style={{ ...cellStyle, textAlign: "left", color: "#636e72", textTransform: "uppercase", fontSize: "12px", letterSpacing: "1px" }}>Store Name</th>
                <th style={{ ...cellStyle, textAlign: "right", color: "#636e72", textTransform: "uppercase", fontSize: "12px", letterSpacing: "1px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f1f1" }}>
                  <td style={{ ...cellStyle, textAlign: "left", fontWeight: "700", color: "#2d3436", fontSize: "1.1rem" }}>{store.name}</td>
                  <td style={{ ...cellStyle, textAlign: "right" }}>
                    <button
                      onClick={() => setSelectedStore(store)}
                      style={{
                        padding: "10px 25px",
                        background: "#0984e3",
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => e.target.style.background = "#0773c5"}
                      onMouseLeave={(e) => e.target.style.background = "#0984e3"}
                    >
                      View More
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {stores.length === 0 && (
            <div style={{ padding: "40px", textAlign: "center", color: "#b2bec3" }}>No stores found in your current vicinity.</div>
          )}
        </div>
      )}
    </div>
  );
}

const cellStyle = {
  padding: "20px 30px",
  borderBottom: "1px solid #f1f1f1"
};

const infoBoxStyle = {
  background: "#f8f9fa",
  padding: "20px",
  borderRadius: "15px",
  display: "flex",
  flexDirection: "column",
  gap: "5px",
  border: "1px solid #edf2f7"
};

export default OfflineStore;