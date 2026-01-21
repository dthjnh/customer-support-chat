import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import socket from "../socket";
import { api } from "../lib/api";

export default function ChatBox({ roomId, isDirect = false }) {
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  useEffect(() => {
    if (!roomId) return;

    // Load messages from database if it's a direct message
    if (isDirect) {
      loadDirectMessages();
    }

    if (!socket.connected) {
      socket.connect();
    }

    console.log("Joining room:", roomId, "isDirect:", isDirect);
    
    // Clean up old listeners first
    socket.off("loadMessages");
    socket.off("receiveMessage");

    socket.emit("joinRoom", { roomId });

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

    // 📡 Poll for new messages every 2 seconds (for direct messages)
    let pollInterval;
    if (isDirect) {
      pollInterval = setInterval(() => {
        loadDirectMessages();
      }, 2000);
    }

    return () => {
      socket.off("receiveMessage");
      socket.off("messageDeleted");
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [roomId, isDirect]);

  // Smart auto-scroll: only scroll if user is already at the bottom
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, shouldAutoScroll]);

  // Detect if user is scrolling up
  const handleScroll = (e) => {
    const element = e.target;
    const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 50;
    setShouldAutoScroll(isAtBottom);
  };

  const loadDirectMessages = async () => {
    try {
      // Extract friendId from roomId format: "userId|friendId" (sorted)
      const parts = roomId.split("|");
      const currentUserId = localStorage.getItem("userId");
      // Find the friendId (the one that's not the current user)
      const friendId = parts.find(id => id !== currentUserId) || parts[1];
      console.log("Loading DMs for friendId:", friendId, "from roomId:", roomId);
      const response = await api.get(`/users/direct-messages/${friendId}`);
      setMessages(response.data || []);
    } catch (err) {
      console.error("❌ Failed to load direct messages:", err);
    }
  };

  const handleSend = (messageData) => {
    // Handle both string (legacy) and object (new format)
    const msgObject = typeof messageData === "string" 
      ? { type: "text", content: messageData }
      : messageData;

    if (!msgObject.content || (msgObject.type === "text" && !msgObject.content.trim())) return;

    // Optimistic update - add message immediately to UI
    const tempMessage = {
      id: `temp-${Date.now()}`,
      ...msgObject,
      senderId: localStorage.getItem("userId"),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMessage]);

    socket.emit("sendMessage", {
      roomId,
      ...msgObject,
      isDirect,
    });
  };

  const handleDelete = (messageId) => {
    socket.emit("deleteMessage", {
      messageId,
      roomId,
      isDirect,
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#ffffff", flex: 1, overflow: "hidden" }}>
      <div 
        ref={messageContainerRef}
        onScroll={handleScroll}
        style={{ 
          flex: 1, 
          overflowY: "auto", 
          overflowX: "hidden",
          padding: "16px 24px", 
          display: "flex", 
          flexDirection: "column",
          minHeight: 0
        }}
      >
        {messages.map((msg, i) => (
          <MessageBubble 
            key={i} 
            message={msg} 
            roomId={roomId} 
            onDelete={handleDelete} 
            socket={socket} 
            isDirect={isDirect}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ flexShrink: 0, borderTop: "1px solid #e2e8f0", background: "#ffffff" }}>
        <MessageInput onSend={handleSend} />
      </div>
    </div>
  );
}
