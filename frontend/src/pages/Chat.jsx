import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import ChatBox from "../components/ChatBox";
import { api } from "../lib/api";

export default function Chat() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleCreateNewChat = async () => {
    try {
      setLoading(true);
      const response = await api.post("/chat/rooms");
      const newRoomId = response.data.id;
      navigate(`/chat/${newRoomId}`);
    } catch (err) {
      console.error("❌ Failed to create room:", err);
      alert("Failed to create room: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!window.confirm("Delete this chat room? This cannot be undone.")) return;

    try {
      setLoading(true);
      await api.delete(`/chat/rooms/${roomId}`);
      navigate("/customer");
    } catch (err) {
      console.error("❌ Failed to delete room:", err);
      alert("Failed to delete room: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: "100vh", background: "#1e1e1e", color: "white" }}>
      <div style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #333" }}>
        <h2>Chat Room: {roomId?.slice(0, 8)}...</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleCreateNewChat}
            disabled={loading}
            style={{
              padding: "8px 16px",
              background: "#0ea5e9",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            New Chat
          </button>
          <button
            onClick={handleDeleteRoom}
            disabled={loading}
            style={{
              padding: "8px 16px",
              background: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            Delete Room
          </button>
        </div>
      </div>
      <ChatBox roomId={roomId} />
    </div>
  );
}
