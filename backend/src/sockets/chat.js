const jwt = require("jsonwebtoken");
const prisma = require("../prisma");

module.exports = (io) => {
  // 🔐 Auth socket
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // { userId, role }
      next();
    } catch (err) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.user.userId);

    // Customer only
    socket.on("sendMessage", async ({ content }) => {
      if (socket.user.role !== "CUSTOMER") {
        return socket.emit("error", "Only CUSTOMER can send messages");
      }

      const message = await prisma.message.create({
        data: {
          content,
          senderId: socket.user.userId,
        },
      });

      io.emit("newMessage", message);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.user.userId);
    });
  });
};
