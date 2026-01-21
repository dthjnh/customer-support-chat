const jwt = require("jsonwebtoken");
const prisma = require("../prisma");

module.exports = (io) => {
  /**
   * ============================
   * 🔐 SOCKET AUTH MIDDLEWARE
   * ============================
   */
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        console.error("❌ Socket connection rejected: No token");
        return next(new Error("Unauthorized"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!decoded?.userId) {
        console.error("❌ Invalid token payload");
        return next(new Error("Unauthorized"));
      }

      socket.user = decoded; // { userId, role }
      next();
    } catch (err) {
      console.error("❌ Socket auth error:", err.message);
      next(new Error("Unauthorized"));
    }
  });

  /**
   * ============================
   * 🔌 SOCKET CONNECTION
   * ============================
   */
  io.on("connection", (socket) => {
    console.log("🔌 Connected user:", socket.user.userId);

    /**
     * ============================
     * 👥 JOIN ROOM
     * ============================
     */
    socket.on("joinRoom", async ({ roomId }) => {
      try {
        let room;
        
        // 👇 Auto-create room if roomId not provided
        if (!roomId) {
          room = await prisma.chatRoom.create({
            data: { 
              customerId: socket.user.userId 
            },
          });
          roomId = room.id; // Use the generated UUID
          console.log("🆕 Room created with ID:", roomId);
        } else {
          room = await prisma.chatRoom.findUnique({
            where: { id: roomId },
          });
          
          if (!room) {
            console.error("❌ Room not found:", roomId);
            return;
          }
        }

        socket.join(roomId);
        console.log(
          `👥 User ${socket.user.userId} joined room ${roomId}`
        );

        // 📨 Send previous messages to the joining user
        const messages = await prisma.message.findMany({
          where: { roomId },
          orderBy: { createdAt: "asc" },
        });
        socket.emit("loadMessages", messages);
      } catch (err) {
        console.error("❌ joinRoom error:", err);
      }
    });

    /**
     * ============================
     * 💬 SEND MESSAGE
     * ============================
     */
    socket.on("sendMessage", async ({ roomId, content, isDirect, type = "text", duration }) => {
      try {
        if (!roomId || !content?.trim()) {
          console.error("❌ sendMessage invalid payload", {
            roomId,
            content,
          });
          return;
        }

        // Get sender info
        const sender = await prisma.user.findUnique({
          where: { id: socket.user.userId },
        });

        // 🔄 Handle Direct Messages
        if (isDirect) {
          try {
            // Extract userId and friendId from roomId (format: "userId|friendId" sorted)
            const [id1, id2] = roomId.split("|");
            const [userId, friendId] = [id1, id2].sort();
            
            // Find the friendship
            const friendship = await prisma.friend.findFirst({
              where: {
                OR: [
                  { userId, friendId: id2 },
                  { userId: id2, friendId: userId },
                ],
              },
            });

            if (!friendship) {
              console.error("❌ Friendship not found:", roomId);
              return;
            }

            // Save direct message to database with type and duration
            const message = await prisma.directMessage.create({
              data: {
                content,
                type,
                duration: type === "audio" ? duration : null,
                senderId: socket.user.userId,
                friendshipId: friendship.id,
              },
            });

            // ✅ emit ONLY to users in that room WITH sender info
            io.to(roomId).emit("receiveMessage", {
              ...message,
              roomId,
              sender: { id: sender.id, name: sender.name, email: sender.email },
            });
            console.log("💬 Direct message saved:", message.id, `[${type}]`);
          } catch (err) {
            console.error("❌ Direct message error:", err);
          }
          return;
        }

        // 🏢 Handle Support Chat Messages
        const room = await prisma.chatRoom.findUnique({
          where: { id: roomId },
        });

        if (!room) {
          console.error("❌ sendMessage: Room not found", roomId);
          return;
        }

        const message = await prisma.message.create({
          data: {
            content,
            type,
            duration: type === "audio" ? duration : null,
            senderId: socket.user.userId,
            roomId,
          },
        });

        // ✅ emit ONLY to users in that room WITH sender info
        io.to(roomId).emit("receiveMessage", {
          ...message,
          roomId,
          sender: { id: sender.id, name: sender.name, email: sender.email },
        });
        console.log("💬 Support message saved:", message.id, `[${type}]`);
      } catch (err) {
        console.error("❌ sendMessage error:", err);
      }
    });

    /**
     * ============================
     * 🗑️ DELETE MESSAGE
     * ============================
     */
    socket.on("deleteMessage", async ({ messageId, roomId, isDirect }) => {
      try {
        if (!messageId || !roomId) {
          console.error("❌ deleteMessage invalid payload");
          return;
        }

        if (isDirect) {
          // Delete direct message
          const message = await prisma.directMessage.findUnique({
            where: { id: messageId },
          });

          if (!message) {
            console.error("❌ Direct message not found:", messageId);
            return;
          }

          if (message.senderId !== socket.user.userId) {
            console.error("❌ User cannot delete someone else's message");
            return;
          }

          await prisma.directMessage.delete({
            where: { id: messageId },
          });

          io.to(roomId).emit("messageDeleted", { messageId });
          console.log("🗑️ Direct message deleted:", messageId);
        } else {
          // Delete support chat message
          const message = await prisma.message.findUnique({
            where: { id: messageId },
          });

          if (!message) {
            console.error("❌ Message not found:", messageId);
            return;
          }

          if (message.senderId !== socket.user.userId) {
            console.error("❌ User cannot delete someone else's message");
            return;
          }

          await prisma.message.delete({
            where: { id: messageId },
          });

          io.to(roomId).emit("messageDeleted", { messageId });
          console.log("🗑️ Message deleted:", messageId);
        }
      } catch (err) {
        console.error("❌ deleteMessage error:", err);
      }
    });

    /**
     * ============================
     * ❌ DISCONNECT
     * ============================
     */
    socket.on("disconnect", () => {
      console.log("❌ Disconnected user:", socket.user.userId);
    });
  });
};
