import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "../socket";
import MessageBubble from "../components/MessageBubble";
import MessageInput from "../components/MessageInput";
import CallModal from "../components/CallModal";
import { api } from "../lib/api";

export default function DirectMessage() {
  const { friendId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [friendInfo, setFriendInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
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
    socket.off("callOffer");
    socket.off("callAnswer");
    socket.off("iceCandidate");
    socket.off("endCall");

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

    // Call event listeners
    socket.on("callOffer", ({ offer, callType }) => {
      console.log("📞 Incoming call:", callType);
      window.__incomingOffer = offer;
      setIncomingCall(callType);
    });

    socket.on("callAnswer", ({ answer }) => {
      console.log("✅ Call answered");
      if (window.__peerConnection) {
        window.__peerConnection.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }
    });

    socket.on("iceCandidate", ({ candidate }) => {
      console.log("🧊 ICE candidate received");
      if (window.__peerConnection && window.__peerConnection.remoteDescription) {
        window.__peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on("endCall", () => {
      console.log("📵 Call ended");
      setActiveCall(null);
      setIncomingCall(null);
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("messageDeleted");
      socket.off("callOffer");
      socket.off("callAnswer");
      socket.off("iceCandidate");
      socket.off("endCall");
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

  const startCall = (type) => {
    if (!friendId) return;
    setActiveCall(type);
  };

  const endCall = () => {
    setActiveCall(null);
    setIncomingCall(null);
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
      {/* Active Call */}
      {(activeCall || incomingCall) && (
        <CallModal
          friendId={friendId}
          friendName={friendInfo?.name}
          callType={activeCall || incomingCall}
          incomingCall={!!incomingCall}
          onEnd={endCall}
        />
      )}

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

        {/* Call Buttons */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => startCall("audio")}
            style={{
              padding: "8px 12px",
              background: "#667eea",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: 16,
              transition: "all 0.2s ease",
              whiteSpace: "nowrap",
              title: "Voice Call",
            }}
            title="Voice Call"
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#5568d3";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#667eea";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            🎙️
          </button>
          <button
            onClick={() => startCall("video")}
            style={{
              padding: "8px 12px",
              background: "#764ba2",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: 16,
              transition: "all 0.2s ease",
              whiteSpace: "nowrap",
            }}
            title="Video Call"
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#6a3d8f";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#764ba2";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            📹
          </button>
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
