import React, { useEffect, useState } from "react";
import { auth } from "./firebase";
import API_BASE_URL from "./apiConfig";

function DebugDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch(`${API_BASE_URL}/api/debug-dashboard/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`API Error: ${res.status} ${res.statusText}`);
        }

        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Error fetching debug dashboard data:", err);
        setError("Failed to load system stats. Please try again later.");
      }
    }

    fetchDashboard();
  }, []);

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!data) return <p>Loading system stats...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>📊 Debug Dashboard</h2>
      {Object.entries(data).map(([section, stats]) => (
        <div key={section} style={{ marginBottom: "20px" }}>
          <h3>{section}</h3>
          <table
            border="1"
            cellPadding="8"
            style={{ borderCollapse: "collapse", width: "100%" }}
          >
            <thead>
              <tr>
                <th>Metric</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {typeof stats === "object" && !Array.isArray(stats) ? (
                Object.entries(stats).map(([key, val]) => (
                  <tr key={key}>
                    <td>{key}</td>
                    <td>{val}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td>{section}</td>
                  <td>{stats}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

export default DebugDashboard;