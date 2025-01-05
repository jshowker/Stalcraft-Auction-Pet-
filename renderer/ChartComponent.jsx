import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function ChartComponent() {
  const [chartData, setChartData] = useState([]); // Chart data state

  // Listen for custom events and update chart data dynamically
  useEffect(() => {
    function handleChartDataUpdated(event) {
      const newData = event.detail; // Data from the custom event
      const sortedData = [...newData].sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date
      setChartData(sortedData);
    }

    // Add event listener
    window.addEventListener("chartDataUpdated", handleChartDataUpdated);

    // Clean up the event listener on unmount
    return () => {
      window.removeEventListener("chartDataUpdated", handleChartDataUpdated);
    };
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2>Area Chart</h2>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorQuantity" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tickFormatter={(tick) => tick.split("-").slice(1).join("-")} />
          <Tooltip formatter={(value) => value.toLocaleString()} />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#8884d8"
            fill="url(#colorPrice)"
          />
          <Area
            type="monotone"
            dataKey="quantity"
            stroke="#82ca9d"
            fill="url(#colorQuantity)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ChartComponent;
