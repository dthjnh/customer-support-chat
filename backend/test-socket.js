const { io } = require("socket.io-client");

// 🔐 TOKEN from /auth/login
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2Y2Q2NTkwMC01Y2Q0LTQxMTItYjMzMS1mY2RjYWRhMzFmNzEiLCJyb2xlIjoiQUdFTlQiLCJpYXQiOjE3Njg5NjMyMjEsImV4cCI6MTc2OTA0OTYyMX0.LqMORvzrtqWQJqo3Ffd90jun1s-SHWtEvXCR0VlrVks";

const socket = io("http://localhost:5000", {
  auth: { token: TOKEN },
});

const roomId = "958a300a-7cd7-4429-a4c1-21724192b9b4";

// Connected
socket.on("connect", () => {
  console.log("✅ Connected to socket:", socket.id);

  // Join a room
  socket.emit("joinRoom", { roomId: roomId });

  // Send message
  socket.emit("sendMessage", {
    roomId: roomId,
    content: "Hi from test socket 👋",
  });
});

// Receive messages
socket.on("newMessage", (msg) => {
  console.log("📩 New message:", msg);
});

// Errors
socket.on("error", (err) => {
  console.error("❌ Socket error:", err);
});
