import { useState } from "react";

export default function MessageBubble({ message, roomId, onDelete, socket, isDirect = false }) {
  const isOwnMessage = message.senderId === localStorage.getItem("userId");
  const [hovering, setHovering] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
          padding: "10px 14px",
          borderRadius: 12,
          maxWidth: "60%",
          wordWrap: "break-word",
          fontSize: 14,
          lineHeight: 1.4,
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }}
      >
        {message.content}
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
