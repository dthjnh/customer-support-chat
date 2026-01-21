import { useState } from "react";

export default function MessageBubble({ message, roomId, onDelete, socket, isDirect = false }) {
  const isOwnMessage = message.senderId === localStorage.getItem("userId");
  const [hovering, setHovering] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imageZoom, setImageZoom] = useState(false);
  const messageType = message.type || "text";

  const handleDelete = async () => {
    if (!window.confirm("Delete this message?")) return;

    try {
      setDeleting(true);
      socket.emit("deleteMessage", { messageId: message.id, roomId, isDirect });
      onDelete(message.id);
    } catch (err) {
      console.error("❌ Failed to delete message:", err);
      alert("Failed to delete message");
    } finally {
      setDeleting(false);
    }
  };

  const renderContent = () => {
    if (messageType === "image") {
      return (
        <>
          <img
            src={message.content}
            alt="Shared image"
            onClick={() => setImageZoom(true)}
            style={{
              maxWidth: "300px",
              maxHeight: "400px",
              borderRadius: 8,
              display: "block",
              objectFit: "contain",
              cursor: "pointer",
              transition: "all 0.2s ease",
              opacity: hovering ? 0.9 : 1,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "scale(1.02)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          />
          
          {imageZoom && (
            <div
              onClick={() => setImageZoom(false)}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0, 0, 0, 0.9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                cursor: "pointer",
                animation: "fadeIn 0.2s ease",
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "relative",
                  maxWidth: "90vw",
                  maxHeight: "90vh",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={message.content}
                  alt="Zoomed image"
                  style={{
                    maxWidth: "90vw",
                    maxHeight: "90vh",
                    objectFit: "contain",
                    borderRadius: 8,
                  }}
                />
                <button
                  onClick={() => setImageZoom(false)}
                  style={{
                    position: "absolute",
                    top: "20px",
                    right: "20px",
                    background: "rgba(255, 255, 255, 0.2)",
                    border: "2px solid white",
                    color: "white",
                    fontSize: "28px",
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.4)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
                  }}
                >
                  ✕
                </button>
              </div>
              
              <style>{`
                @keyframes fadeIn {
                  from {
                    opacity: 0;
                  }
                  to {
                    opacity: 1;
                  }
                }
              `}</style>
            </div>
          )}
        </>
      );
    }

    if (messageType === "audio") {
      const duration = message.duration || 0;
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <audio
            src={message.content}
            controls
            style={{
              width: "200px",
              height: "28px",
            }}
          />
          <span style={{ fontSize: 12, opacity: 0.8 }}>
            {minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`}
          </span>
        </div>
      );
    }

    // Default text message
    return message.content;
  };

  return (
    <div
      style={{
        marginBottom: 12,
        display: "flex",
        justifyContent: isOwnMessage ? "flex-end" : "flex-start",
        alignItems: "flex-end",
        gap: 8,
        paddingX: 16,
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div
        style={{
          background: isOwnMessage ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "#f3f4f6",
          color: isOwnMessage ? "white" : "#1f2937",
          padding: messageType === "text" ? "10px 14px" : "8px",
          borderRadius: 12,
          maxWidth: messageType === "text" ? "60%" : "70%",
          wordWrap: "break-word",
          fontSize: 14,
          lineHeight: 1.4,
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }}
      >
        {renderContent()}
      </div>

      {hovering && isOwnMessage && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{
            background: "none",
            border: "none",
            color: "#9ca3af",
            cursor: deleting ? "not-allowed" : "pointer",
            fontSize: 16,
            padding: 0,
            opacity: deleting ? 0.5 : 1,
            transition: "all 0.2s ease",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = "#ef4444";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = "#9ca3af";
          }}
          title="Delete message"
        >
          ✕
        </button>
      )}
    </div>
  );
}
