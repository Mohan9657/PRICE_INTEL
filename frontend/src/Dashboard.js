import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Cell
} from "recharts";

function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch("https://price-intel-rnjr.onrender.com/api/dashboard-stats")
      .then((res) => res.json())
      .then((data) => setStats(data));
  }, []);

  if (!stats) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)" }}>
      <h3 style={{ fontFamily: "'Inter', sans-serif", color: "#636e72" }}>Loading Dashboard Analytics...</h3>
    </div>
  );

  const chartData = Object.entries(stats.storeDrops).map(([store, count]) => ({
    store,
    count,
  }));

  const COLORS = ['#0984e3', '#00b894', '#6c5ce7', '#e17055', '#fdcb6e'];

  return (
    <div style={{ 
      fontFamily: "'Segoe UI', Roboto, sans-serif", 
      color: "#2d3436",
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)", // Matches App.js
      minHeight: "100vh",
      padding: "20px"
    }}>
      <h1 style={{ marginBottom: "30px", fontWeight: "800", fontSize: "2.5rem", textAlign: "center" }}>
        📊 Dashboard Analytics
      </h1>

      {/* DEMO BADGE */}
      {stats.demoMode && (
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div
            style={{
              background: "rgba(255, 243, 205, 0.8)",
              backdropFilter: "blur(10px)",
              padding: "12px 25px",
              borderRadius: "30px",
              color: "#856404",
              fontWeight: "600",
              border: "1px solid rgba(255, 238, 186, 0.5)",
              display: "inline-block",
              boxShadow: "0 4px 15px rgba(0,0,0,0.05)"
            }}
          >
            🧪 Demo Data Mode — Real analytics unlock after 20 active users
          </div>
        </div>
      )}

      {/* TOP CARDS */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          marginBottom: "40px",
          flexWrap: "wrap"
        }}
      >
        <Card title="Total Products" value={stats.totalProducts} color="#0984e3" />
        <Card title="Total Alerts" value={stats.totalAlerts} color="#6c5ce7" />
        <Card title="Total Emails Sent" value={stats.totalEmailsSent} color="#00b894" />
      </div>

      <div
        style={{
          display: "flex",
          gap: "30px",
          alignItems: "stretch",
          flexWrap: "wrap"
        }}
      >
        {/* LEFT SIDE: TOP PRODUCT */}
        <div style={{ 
          flex: 1, 
          background: "rgba(255, 255, 255, 0.7)", 
          backdropFilter: "blur(10px)",
          padding: "30px", 
          borderRadius: "24px", 
          boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
          minWidth: "300px",
          border: "1px solid rgba(255, 255, 255, 0.3)"
        }}>
          <h2 style={{ fontSize: "1.1rem", color: "#636e72", marginBottom: "20px", textTransform: "uppercase", letterSpacing: "1px" }}>
            ⭐ Most Tracked Product
          </h2>
          <div style={{ 
            background: "white", 
            padding: "25px", 
            borderRadius: "15px", 
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)"
          }}>
            <p style={{ fontSize: "22px", fontWeight: "800", margin: 0, color: "#2d3436" }}>
              {stats.topProduct}
            </p>
          </div>
        </div>

        {/* RIGHT SIDE: CHART */}
        <div style={{ 
          flex: 2, 
          background: "rgba(255, 255, 255, 0.7)", 
          backdropFilter: "blur(10px)",
          padding: "30px", 
          borderRadius: "24px", 
          boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
          minWidth: "400px",
          border: "1px solid rgba(255, 255, 255, 0.3)"
        }}>
          <h2 style={{ fontSize: "1.1rem", color: "#636e72", marginBottom: "20px", textTransform: "uppercase", letterSpacing: "1px" }}>
            📉 Store Drop Distribution
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="store" axisLine={false} tickLine={false} tick={{fill: '#636e72', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#636e72', fontSize: 12}} />
              <Tooltip 
                cursor={{fill: 'rgba(0,0,0,0.02)'}}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }} 
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ margin: "60px 0 30px", display: "flex", alignItems: "center", gap: "20px" }}>
        <h2 style={{ margin: 0, fontWeight: "800" }}>🏪 Offline Analytics</h2>
        <div style={{ flex: 1, height: "1px", background: "rgba(0,0,0,0.1)" }}></div>
      </div>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        <Card title="Store Views" value={stats.offlineStats?.totalStoreViews || 0} color="#e17055" />
        <Card title="Map Clicks" value={stats.offlineStats?.totalMapClicks || 0} color="#00cec9" />
        <Card title="Review Clicks" value={stats.offlineStats?.totalReviewClicks || 0} color="#6c5ce7" />
      </div>

      <div style={{ 
        marginTop: "40px", 
        background: "white", 
        padding: "20px 40px", 
        borderRadius: "50px", 
        display: "inline-block",
        boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
        border: "1px solid rgba(255,255,255,0.8)"
      }}>
        <p style={{ margin: 0, fontWeight: "600", color: "#636e72" }}>
          🏆 Most Popular Store: <span style={{ color: "#2d3436", fontWeight: "800", marginLeft: "10px" }}>{stats.offlineStats?.mostViewedStore || "None"}</span>
        </p>
      </div>
    </div>
  );
}

function Card({ title, value, color }) {
  return (
    <div
      style={{
        flex: 1,
        background: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(12px)",
        padding: "30px",
        borderRadius: "24px",
        textAlign: "center",
        boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
        transition: "transform 0.3s ease",
        minWidth: "220px",
        border: "1px solid rgba(255, 255, 255, 0.5)",
        borderTop: `5px solid ${color}`
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-8px)"}
      onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
    >
      <h3 style={{ fontSize: "0.9rem", color: "#636e72", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "1px" }}>
        {title}
      </h3>
      <h1 style={{ color: color, fontSize: "2.8rem", margin: 0, fontWeight: "800" }}>
        {value}
      </h1>
    </div>
  );
}

export default Dashboard;