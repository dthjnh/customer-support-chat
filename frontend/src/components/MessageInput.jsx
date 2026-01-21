import { useState } from "react";

export default function MessageInput({ onSend }) {
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      send();
    }
  };

  return (
    <div style={{ display: "flex", gap: 12, padding: "16px", background: "#ffffff", borderTop: "1px solid #e2e8f0" }}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyPress={handleKeyPress}
        style={{
          flex: 1,
          padding: "12px 16px",
          border: "2px solid #e5e7eb",
          borderRadius: "8px",
          fontSize: 14,
          color: "#1f2937",
          background: "#f9fafb",
          outline: "none",
          transition: "all 0.2s ease",
          fontFamily: "inherit",
        }}
        placeholder="Type a message..."
        onFocus={(e) => {
          e.target.style.borderColor = "#667eea";
          e.target.style.background = "#ffffff";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#e5e7eb";
          e.target.style.background = "#f9fafb";
        }}
      />
      <button 
        onClick={send}
        style={{
          padding: "12px 24px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: 600,
          fontSize: 14,
          transition: "all 0.2s ease",
          whiteSpace: "nowrap",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        Send
      </button>
    </div>
  );
}
