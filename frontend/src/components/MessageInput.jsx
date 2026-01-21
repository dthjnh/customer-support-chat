import { useState, useRef } from "react";

export default function MessageInput({ onSend }) {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const fileInputRef = useRef(null);
  const timerRef = useRef(null);

  const send = () => {
    if (!text.trim()) return;
    onSend({ type: "text", content: text });
    setText("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      onSend({ type: "image", content: event.target.result, fileName: file.name });
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/wav" });
        const reader = new FileReader();
        reader.onload = (event) => {
          onSend({ type: "audio", content: event.target.result, duration: recordingTime });
        };
        reader.readAsDataURL(blob);
        setRecordingTime(0);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("❌ Failed to start recording:", err);
      alert("Microphone access denied or not available");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "16px", background: "#ffffff", borderTop: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "2px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: 14,
              color: "#1f2937",
              background: "#f9fafb",
              outline: "none",
              transition: "all 0.2s ease",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
            placeholder={isRecording ? `Recording... ${recordingTime}s` : "Type a message..."}
            disabled={isRecording}
            onFocus={(e) => {
              if (!isRecording) {
                e.target.style.borderColor = "#667eea";
                e.target.style.background = "#ffffff";
              }
            }}
            onBlur={(e) => {
              if (!isRecording) {
                e.target.style.borderColor = "#e5e7eb";
                e.target.style.background = "#f9fafb";
              }
            }}
          />
        </div>

        {/* Image Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isRecording}
          style={{
            padding: "10px 12px",
            background: isRecording ? "#cbd5e1" : "#e0e7ff",
            color: isRecording ? "#64748b" : "#3730a3",
            border: "none",
            borderRadius: "8px",
            cursor: isRecording ? "not-allowed" : "pointer",
            fontSize: 16,
            transition: "all 0.2s ease",
            opacity: isRecording ? 0.6 : 1,
          }}
          title="Upload image"
          onMouseOver={(e) => {
            if (!isRecording) {
              e.currentTarget.style.background = "#c7d2fe";
            }
          }}
          onMouseOut={(e) => {
            if (!isRecording) {
              e.currentTarget.style.background = "#e0e7ff";
            }
          }}
        >
          🖼️
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: "none" }}
        />

        {/* Audio Recording Button */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          style={{
            padding: "10px 12px",
            background: isRecording ? "#fee2e2" : "#fce7f3",
            color: isRecording ? "#991b1b" : "#be123c",
            border: isRecording ? "2px solid #fecaca" : "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: 16,
            transition: "all 0.2s ease",
            fontWeight: isRecording ? 600 : 400,
          }}
          title={isRecording ? "Stop recording" : "Start recording"}
          onMouseOver={(e) => {
            if (isRecording) {
              e.currentTarget.style.background = "#fecaca";
            } else {
              e.currentTarget.style.background = "#fbcfe8";
            }
          }}
          onMouseOut={(e) => {
            if (isRecording) {
              e.currentTarget.style.background = "#fee2e2";
            } else {
              e.currentTarget.style.background = "#fce7f3";
            }
          }}
        >
          {isRecording ? "⏹️" : "🎙️"}
        </button>

        {/* Send Button */}
        <button
          onClick={send}
          disabled={!text.trim() || isRecording}
          style={{
            padding: "10px 24px",
            background: !text.trim() || isRecording ? "#cbd5e1" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: (!text.trim() || isRecording) ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: 14,
            transition: "all 0.2s ease",
            whiteSpace: "nowrap",
            opacity: (!text.trim() || isRecording) ? 0.6 : 1,
          }}
          onMouseOver={(e) => {
            if (text.trim() && !isRecording) {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
