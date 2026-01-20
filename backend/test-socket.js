const { io } = require("socket.io-client");

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3ODhmMWJmMi0xMTNkLTQyZDAtYmM4ZC1kNmQ1ODRhZjM1OWUiLCJyb2xlIjoiQ1VTVE9NRVIiLCJpYXQiOjE3Njg4OTA4NTEsImV4cCI6MTc2ODk3NzI1MX0.y5LUrAuhK-ceF2SqfBg-zqQT94vMYXafkSPvI8YeheQ";

const socket = io("http://localhost:5000", {
  auth: {
    token,
  },
});

socket.on("connect", () => {
  console.log("✅ Connected:", socket.id);

  socket.emit("sendMessage", {
    content: "Hello from Node test client",
  });
});

socket.on("newMessage", (msg) => {
  console.log("📩 New message:", msg);
});

socket.on("error", (err) => {
  console.error("❌ Error:", err);
});
