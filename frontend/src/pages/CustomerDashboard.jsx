import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function CustomerDashboard() {
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
      const response = await api.get("/chat/my-rooms");
      setRooms(response.data);
    } catch (err) {
      console.error("❌ Failed to fetch rooms:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewChat = async () => {
    try {
      const response = await api.post("/chat/rooms");
      const newRoomId = response.data.id;
      navigate(`/chat/${newRoomId}`);
    } catch (err) {
      console.error("❌ Failed to create room:", err);
      alert("Failed to create room: " + (err.response?.data?.error || err.message));
    }
  };

  const handleOpenChat = (roomId) => {
    navigate(`/chat/${roomId}`);
  };

  const handleDeleteRoom = async (roomId, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this chat room? This cannot be undone.")) return;

    try {
      await api.delete(`/chat/rooms/${roomId}`);
      setRooms((prev) => prev.filter((room) => room.id !== roomId));
    } catch (err) {
      console.error("❌ Failed to delete room:", err);
      alert("Failed to delete room: " + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <div style={{ color: "white", padding: 16 }}>Loading...</div>;

  return (
    <div style={{ height: "100vh", background: "#1e1e1e", color: "white", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1>My Chat Rooms</h1>
        <button
          onClick={handleCreateNewChat}
          style={{
            padding: "8px 16px",
            background: "#0ea5e9",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          New Chat
        </button>
      </div>

      <div style={{ marginTop: 20 }}>
        {rooms.length === 0 ? (
          <p>No chat rooms yet. Create one to get started!</p>
        ) : (
          <div style={{ display: "grid", gap: "10px" }}>
            {rooms.map((room) => (
              <div
                key={room.id}
                onClick={() => handleOpenChat(room.id)}
                style={{
                  padding: 16,
                  background: "#2d2d2d",
                  borderRadius: "8px",
                  cursor: "pointer",
                  border: "1px solid #444",
                  transition: "all 0.3s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#3d3d3d";
                  e.currentTarget.style.borderColor = "#0ea5e9";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "#2d2d2d";
                  e.currentTarget.style.borderColor = "#444";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", width: "100%" }}>
                  <div>
                    <h3 style={{ margin: 0, marginBottom: 4 }}>
                      Support Room
                    </h3>
                    <p style={{ margin: 0, color: "#aaa", fontSize: 14 }}>
                      Room ID: {room.id.slice(0, 8)}...
                    </p>
                    {room.messages && room.messages.length > 0 && (
                      <p style={{ margin: "8px 0 0 0", color: "#999", fontSize: 13 }}>
                        {room.messages[room.messages.length - 1]?.content?.slice(0, 60)}...
                      </p>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    <span
                      style={{
                        padding: "4px 12px",
                        background: room.status === "ASSIGNED" ? "#10b981" : "#f59e0b",
                        borderRadius: "4px",
                        fontSize: 12,
                      }}
                    >
                      {room.status}
                    </span>
                    <button
                      onClick={(e) => handleDeleteRoom(room.id, e)}
                      style={{
                        padding: "4px 12px",
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
