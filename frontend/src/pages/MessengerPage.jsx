import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChatBox from "../components/ChatBox";
import CallModal from "../components/CallModal";
import { api } from "../lib/api";
import socket from "../socket";

export default function MessengerPage() {
  const [rooms, setRooms] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedDM, setSelectedDM] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    fetchRooms();
    fetchDirectMessages();
    fetchUsers();
    const interval = setInterval(() => {
      fetchRooms();
      fetchDirectMessages();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Listen for new messages and show notifications
  useEffect(() => {
    console.log("🎧 Setting up notification listener for room:", selectedRoom?.id || selectedDM?.id);
    
    // Join the selected room to receive messages
    if (selectedRoom?.id) {
      socket.emit("joinRoom", { roomId: selectedRoom.id });
    } else if (selectedDM?.id) {
      const roomId = [localStorage.getItem("userId"), selectedDM.id].sort().join("|");
      socket.emit("joinRoom", { roomId });
    }
    
    // Listen for incoming messages from the selected room
    socket.on("receiveMessage", (message) => {
      console.log("📨 Received message in MessengerPage:", message);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [selectedRoom, selectedDM]);
  
  // Separate effect for notifications from ChatBox messages
  useEffect(() => {
    // Listen for new direct messages from polling
    socket.on("receiveMessage", (message) => {
      console.log("🔔 Message received, checking notification...", message);
      
      const messageRoomId = message?.roomId || null;
      const isCurrentRoom = selectedRoom?.id === messageRoomId;
      const isDMRoom = messageRoomId?.includes("|");
      const isCurrentDM = isDMRoom && selectedDM && 
        (messageRoomId === [localStorage.getItem("userId"), selectedDM.id].sort().join("|"));
      const isCurrentConversation = isCurrentRoom || isCurrentDM;
      
      console.log("Check:", { isCurrentConversation, messageRoomId });
      
      // Show notification if not viewing this conversation
      if (!isCurrentConversation && Notification.permission === "granted") {
        const senderName = message?.sender?.name || "Someone";
        const preview = message?.content?.slice(0, 50) || "Sent a message";
        console.log("🔔 SHOWING NOTIFICATION:", senderName);
        new Notification(senderName, {
          body: preview,
          icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='45' fill='%230ea5e9'/><text x='50' y='60' font-size='50' text-anchor='middle' fill='white' dominant-baseline='middle'>💬</text></svg>",
        });
      }
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [selectedRoom, selectedDM]);

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

  const fetchDirectMessages = async () => {
    try {
      const response = await api.get("/users/friends");
      // Add last message preview to each friend
      const friendsWithMessages = await Promise.all(
        response.data.map(async (friend) => {
          try {
            const messagesRes = await api.get(`/users/direct-messages/${friend.id}`);
            const messages = messagesRes.data || [];
            const unreadCount = messages.filter((msg) => !msg.isRead && msg.senderId !== localStorage.getItem("userId")).length;
            return {
              ...friend,
              lastMessage: messages.length > 0 ? messages[messages.length - 1] : null,
              unreadCount,
              type: "dm",
            };
          } catch {
            return { ...friend, lastMessage: null, unreadCount: 0, type: "dm" };
          }
        })
      );
      setDirectMessages(friendsWithMessages);
    } catch (err) {
      console.error("❌ Failed to fetch direct messages:", err);
    }
  };

  const markMessagesAsRead = async (friendId) => {
    try {
      await api.put(`/users/direct-messages/${friendId}/mark-read`);
    } catch (err) {
      console.error("❌ Failed to mark messages as read:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get("/auth/users");
      setUsers(response.data);
    } catch (err) {
      console.error("❌ Failed to fetch users:", err);
    }
  };

  const startCall = (callType) => {
    if (!selectedDM) {
      alert("Please select a contact to call");
      return;
    }
    setActiveCall(callType);
  };

  const endCall = () => {
    setActiveCall(null);
    setIncomingCall(null);
  };

  // Set up socket listeners for calls
  useEffect(() => {
    socket.on("callOffer", async (data) => {
      console.log("📞 Incoming call from:", data.from, "Type:", data.callType);
      
      // Find the contact info for the caller
      const caller = directMessages.find(dm => dm.id === data.from);
      
      setIncomingCall({
        from: data.from,
        fromName: caller?.name || "Unknown",
        offer: data.offer,
        callType: data.callType,
      });
    });

    socket.on("callAnswer", (data) => {
      console.log("📞 Call answered");
      // CallModal will handle this
    });

    socket.on("iceCandidate", (data) => {
      console.log("❄️ ICE Candidate received");
      // CallModal will handle this
    });

    socket.on("endCall", (data) => {
      console.log("☎️ Call ended");
      endCall();
    });

    return () => {
      socket.off("callOffer");
      socket.off("callAnswer");
      socket.off("iceCandidate");
      socket.off("endCall");
    };
  }, [directMessages]);

  const handleStartChat = async (userId) => {
    try {
      const response = await api.post("/chat/rooms");
      const newRoomId = response.data.id;
      setSelectedRoom({ id: newRoomId });
      setSelectedDM(null);
      setSearchQuery("");
    } catch (err) {
      console.error("❌ Failed to start chat:", err);
    }
  };

  const handleSelectDM = (friend) => {
    setSelectedRoom(null);
    setSelectedDM(friend);
    markMessagesAsRead(friend.id);
  };

  const handleDeleteRoom = async (roomId) => {
    if (window.confirm("Delete this chat room?")) {
      try {
        await api.delete(`/chat/rooms/${roomId}`);
        setSelectedRoom(null);
        fetchRooms();
      } catch (err) {
        console.error("❌ Failed to delete room:", err);
        alert("Failed to delete room");
      }
    }
  };

  const handleDeleteDM = async (friendId) => {
    if (window.confirm("Delete this direct message conversation?")) {
      try {
        await api.delete(`/users/direct-messages/${friendId}`);
        setSelectedDM(null);
        fetchDirectMessages();
      } catch (err) {
        console.error("❌ Failed to delete DM:", err);
        alert("Failed to delete conversation");
      }
    }
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("role");
      socket.disconnect();
      navigate("/login");
    }
  };

  // Combine rooms and direct messages for display
  const allConversations = [
    ...rooms.map((room) => ({ ...room, type: "room", conversationId: room.id })),
    ...directMessages.map((dm) => ({ ...dm, conversationId: `dm-${dm.id}` })),
  ];

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", background: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", margin: 0, padding: 0, boxSizing: "border-box" }}>
      {/* SIDEBAR */}
      <div
        style={{
          width: "25%",
          minWidth: "280px",
          maxWidth: "400px",
          background: "white",
          borderRight: "1px solid #e2e8f0",
          display: "flex",
          flexDirection: "column",
          color: "#1f2937",
          boxSizing: "border-box",
        }}
      >
        <div style={{ padding: "20px 16px", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: "700" }}>Messages</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => navigate("/contacts")}
                style={{
                  padding: "8px 14px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  transition: "transform 0.2s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
                title="Add friends"
              >
                + Contacts
              </button>
              <button
                onClick={handleLogout}
                style={{
                  padding: "8px 14px",
                  background: "#fee2e2",
                  color: "#991b1b",
                  border: "1px solid #fecaca",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#fecaca";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "#fee2e2";
                }}
                title="Logout"
              >
                Logout
              </button>
            </div>
          </div>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              background: "#f3f4f6",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              color: "#1f2937",
              fontSize: 14,
              transition: "all 0.2s ease",
              outline: "none",
            }}
            onFocus={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.borderColor = "#667eea";
            }}
            onBlur={(e) => {
              e.currentTarget.style.background = "#f3f4f6";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          />
        </div>

        {/* CONVERSATIONS LIST */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {allConversations.length === 0 ? (
            <p style={{ padding: 16, color: "#999", textAlign: "center" }}>
              No conversations yet
            </p>
          ) : (
            allConversations.map((item) => {
              const isSelected = item.type === "room" 
                ? selectedRoom?.id === item.id 
                : selectedDM?.id === item.id;
              
              return (
                <div
                  key={item.conversationId}
                  onClick={() => item.type === "room" ? setSelectedRoom(item) : handleSelectDM(item)}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #e2e8f0",
                    cursor: "pointer",
                    background: isSelected ? "#f0f4ff" : "transparent",
                    transition: "all 0.2s ease",
                  }}
                  onMouseOver={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "#f9fafb";
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <p style={{ margin: 0, fontWeight: "600", color: "#1f2937", fontSize: 15 }}>
                          {item.type === "room" ? "Support Chat" : item.name}
                        </p>
                        {item.type === "dm" && item.unreadCount > 0 && (
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: "#ef4444",
                              display: "inline-block",
                            }}
                            title={`${item.unreadCount} unread message${item.unreadCount > 1 ? "s" : ""}`}
                          />
                        )}
                      </div>
                      <p style={{ margin: "4px 0 0 0", color: "#9ca3af", fontSize: 13 }}>
                        {item.type === "room"
                          ? item.messages?.length > 0
                            ? item.messages[item.messages.length - 1]?.content?.slice(0, 30)
                            : "No messages"
                          : item.lastMessage
                          ? item.lastMessage.content.slice(0, 30)
                          : "No messages"}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 12 }}>
                      {item.type === "room" && (
                        <span
                          style={{
                            padding: "4px 8px",
                            background: item.status === "ASSIGNED" ? "#d1fae5" : "#fef3c7",
                            color: item.status === "ASSIGNED" ? "#065f46" : "#92400e",
                            borderRadius: "4px",
                            fontSize: 11,
                            whiteSpace: "nowrap",
                            fontWeight: 500,
                          }}
                        >
                          {item.status}
                        </span>
                      )}
                      {item.type === "dm" && (
                        <span
                          style={{
                            padding: "4px 8px",
                            background: "#e0e7ff",
                            color: "#3730a3",
                            borderRadius: "4px",
                            fontSize: 11,
                            whiteSpace: "nowrap",
                            fontWeight: 500,
                          }}
                        >
                          Friend
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          item.type === "room" ? handleDeleteRoom(item.id) : handleDeleteDM(item.id);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#d1d5db",
                          cursor: "pointer",
                          fontSize: 16,
                          padding: "4px 8px",
                          transition: "all 0.2s ease",
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.color = "#ef4444";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.color = "#d1d5db";
                        }}
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#ffffff", boxSizing: "border-box", minWidth: 0, height: "100%", overflow: "hidden" }}>
        {selectedRoom ? (
          <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
            <div
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid #e2e8f0",
                background: "#ffffff",
                color: "#1f2937",
                flexShrink: 0,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: "600" }}>
                Support Chat
              </h3>
              <p style={{ margin: "4px 0 0 0", color: "#9ca3af", fontSize: 13 }}>
                Room ID: {selectedRoom.id.slice(0, 8)}...
              </p>
            </div>
            <ChatBox roomId={selectedRoom.id} />
          </div>
        ) : selectedDM ? (
          <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
            <div
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid #e2e8f0",
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  onClick={() => setSelectedDM(null)}
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
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: "600", color: "#1f2937" }}>{selectedDM.name}</h3>
                  <p style={{ margin: "4px 0 0 0", color: "#9ca3af", fontSize: 13 }}>
                    {selectedDM.email}
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
            <ChatBox 
              roomId={[localStorage.getItem("userId"), selectedDM.id].sort().join("|")} 
              isDirect={true} 
            />
            {(activeCall || incomingCall) && (
              <CallModal
                selectedDM={selectedDM}
                activeCall={activeCall}
                incomingCall={incomingCall}
                setActiveCall={setActiveCall}
                setIncomingCall={setIncomingCall}
              />
            )}
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#9ca3af",
              background: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
            <p style={{ fontSize: 18, fontWeight: 500, margin: 0 }}>Select a conversation</p>
            <p style={{ fontSize: 14, marginTop: 8, margin: 0 }}>Choose a friend or support room to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
