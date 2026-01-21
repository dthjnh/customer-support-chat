import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function AgentDashboard() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 3000); // Poll every 3s
    return () => clearInterval(interval);
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await api.get("/chat/rooms");
      setRooms(response.data);
    } catch (err) {
      console.error("❌ Failed to fetch rooms:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignAndJoin = async (roomId) => {
    try {
      console.log("🔗 Assigning room:", roomId);
      const response = await api.post(`/chat/rooms/${roomId}/assign`);
      console.log("✅ Room assigned:", response.data);
      navigate(`/chat/${roomId}`);
    } catch (err) {
      console.error("❌ Failed to assign room:", err.response?.data || err.message);
      alert("Failed to assign room: " + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <div style={{ color: "white", padding: 16 }}>Loading...</div>;

  return (
    <div style={{ height: "100vh", background: "#1e1e1e", color: "white", padding: 16 }}>
      <h1>Agent Dashboard</h1>
      <div style={{ marginTop: 20 }}>
        {rooms.length === 0 ? (
          <p>No chat rooms available</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #333" }}>
                <th style={{ textAlign: "left", padding: 8 }}>Room ID</th>
                <th style={{ textAlign: "left", padding: 8 }}>Customer</th>
                <th style={{ textAlign: "left", padding: 8 }}>Status</th>
                <th style={{ textAlign: "left", padding: 8 }}>Messages</th>
                <th style={{ textAlign: "left", padding: 8 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id} style={{ borderBottom: "1px solid #333" }}>
                  <td style={{ padding: 8 }}>{room.id.slice(0, 8)}...</td>
                  <td style={{ padding: 8 }}>{room.customer?.name || "Unknown"}</td>
                  <td style={{ padding: 8 }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        background: room.agentId ? "#10b981" : "#f59e0b",
                        borderRadius: "4px",
                      }}
                    >
                      {room.status}
                    </span>
                  </td>
                  <td style={{ padding: 8 }}>{room.messages?.length || 0}</td>
                  <td style={{ padding: 8 }}>
                    <button
                      onClick={() => handleAssignAndJoin(room.id)}
                      disabled={room.agentId && room.agentId !== localStorage.getItem("userId")}
                      style={{
                        padding: "6px 12px",
                        background: room.agentId && room.agentId !== localStorage.getItem("userId") ? "#6b7280" : "#0ea5e9",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: room.agentId && room.agentId !== localStorage.getItem("userId") ? "not-allowed" : "pointer",
                        opacity: room.agentId && room.agentId !== localStorage.getItem("userId") ? 0.6 : 1,
                      }}
                    >
                      {room.agentId && room.agentId !== localStorage.getItem("userId") ? "Assigned" : "Assign & Join"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
