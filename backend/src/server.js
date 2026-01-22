const express = require("express");
const cors = require("cors");
require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const prisma = require("./prisma");
const auth = require("./middlewares/auth");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const usersRoutes = require("./routes/users.routes");
const chat = require("./sockets/chat");

const app = express();
app.use(cors({
  origin: [
    "http://localhost:5173", 
    "http://192.168.101.18:5173", 
    "http://192.168.101.18:3000",
    "https://neville-intropunitive-paternally.ngrok-free.dev"
  ],
  credentials: true,
}));
app.use(express.json());

// ================= ROUTES =================
app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/users", userRoutes);
app.use("/chat", require("./routes/chat.routes"));




// Health check
app.get("/", (req, res) => {
  res.json({ message: "Customer Support Chat API is running 🚀" });
});

// Protected route
app.get("/me", auth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { id: true, name: true, email: true, role: true },
  });

  res.json(user);
});

// ================= HTTP SERVER =================
const server = http.createServer(app);

// ================= SOCKET.IO =================
const io = new Server(server, {
  cors: { 
    origin: [
      "http://localhost:5173", 
      "http://192.168.101.18:5173", 
      "http://192.168.101.18:3000",
      "https://neville-intropunitive-paternally.ngrok-free.dev"
    ],
    credentials: true,
  },
});

app.set("io", io);

// init socket handlers
require("./sockets/chat")(io);

// ================= START =================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server + Socket.IO running on port ${PORT}`);
});
