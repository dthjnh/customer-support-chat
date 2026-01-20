const express = require("express");
const cors = require("cors");
require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const prisma = require("./prisma");
const auth = require("./middlewares/auth");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");

const app = express();
app.use(cors());
app.use(express.json());

// ================= ROUTES =================
app.use("/auth", authRoutes);
app.use("/users", userRoutes);

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
  cors: { origin: "*" },
});

app.set("io", io);

// init socket handlers
require("./sockets/chat")(io);

// ================= START =================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server + Socket.IO running on port ${PORT}`);
});
