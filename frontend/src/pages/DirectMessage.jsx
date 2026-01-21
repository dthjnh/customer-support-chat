import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "../socket";
import MessageBubble from "../components/MessageBubble";
import MessageInput from "../components/MessageInput";
import { api } from "../lib/api";

export default function DirectMessage() {
  const { friendId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [friendInfo, setFriendInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const directMessageRoomId = [localStorage.getItem("userId"), friendId]
    .sort()
    .join("|");

  useEffect(() => {
    fetchFriendInfo();
    loadMessages();
  }, [friendId]);

  useEffect(() => {
    if (!directMessageRoomId) return;

    if (!socket.connected) {
      socket.connect();
    }

    console.log("Joining DM room:", directMessageRoomId);

    // Clean up old listeners
    socket.off("loadMessages");
    socket.off("receiveMessage");
    socket.off("messageDeleted");

    socket.emit("joinRoom", { roomId: directMessageRoomId });

    // Listen for incoming messages
    socket.on("receiveMessage", (message) => {
      setMessages((prev) => {
        // Avoid duplicates
        const exists = prev.some((m) => m.id === message.id);
        return exists ? prev : [...prev, message];
      });
    });

    socket.on("messageDeleted", ({ messageId }) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("messageDeleted");
    };
  }, [directMessageRoomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const response = await api.get(`/users/direct-messages/${friendId}`);
      setMessages(response.data || []);
      // Mark messages as read
      await api.put(`/users/direct-messages/${friendId}/mark-read`);
    } catch (err) {
      console.error("❌ Failed to load direct messages:", err);
    }
  };

  const fetchFriendInfo = async () => {
    try {
      const response = await api.get(`/users/${friendId}`);
      setFriendInfo(response.data);
    } catch (err) {
      console.error("❌ Failed to fetch friend info:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (text) => {
    if (!text.trim()) return;

    socket.emit("sendMessage", {
      roomId: directMessageRoomId,
      content: text,
      isDirect: true,
    });
  };

  const handleDelete = (messageId) => {
    socket.emit("deleteMessage", {
      messageId,
      roomId: directMessageRoomId,
      isDirect: true,
    });
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", width: "100vw", background: "#f8fafc", fontSize: 16, color: "#9ca3af", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw", background: "#f8fafc", color: "#1f2937", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", margin: 0, padding: 0, boxSizing: "border-box" }}>
      {/* HEADER */}
      <div
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid #e2e8f0",
          background: "#ffffff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => navigate("/customer")}
            style={{
              background: "none",
              border: "none",
              color: "#667eea",
              cursor: "pointer",
              fontSize: 24,
              padding: 0,
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateX(-4px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateX(0)";
            }}
          >
            ←
          </button>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: "600", color: "#1f2937" }}>{friendInfo?.name || "Friend"}</h3>
            <p style={{ margin: "4px 0 0 0", color: "#9ca3af", fontSize: 13 }}>
              {friendInfo?.email}
            </p>
          </div>
        </div>
      </div>

      {/* CHAT AREA */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", background: "#ffffff" }}>
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "16px 24px", display: "flex", flexDirection: "column", minHeight: 0 }}>
          {messages.length === 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "#9ca3af",
                fontSize: 16,
                fontWeight: 500,
              }}
            >
              Start a conversation with {friendInfo?.name}
            </div>
          ) : (
            messages.map((msg, i) => (
              <MessageBubble
                key={i}
                message={msg}
                roomId={directMessageRoomId}
                onDelete={handleDelete}
                socket={socket}
                isDirect={true}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ flexShrink: 0, borderTop: "1px solid #e2e8f0", background: "#ffffff" }}>
          <MessageInput onSend={handleSend} />
        </div>
      </div>
    </div>
  );
}
