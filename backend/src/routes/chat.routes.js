const express = require("express");
const prisma = require("../prisma");
const auth = require("../middlewares/auth");

const router = express.Router();

/**
 * CUSTOMER creates chat room
 * POST /chat/rooms
 */
router.post("/rooms", auth, async (req, res) => {
  if (req.user.role !== "CUSTOMER") {
    return res.status(403).json({ error: "Only customer can create room" });
  }

  const room = await prisma.chatRoom.create({
    data: {
      customerId: req.user.userId,
    },
  });

  res.json(room);
});

/**
 * GET all rooms (admins can see all rooms)
 * GET /chat/rooms
 */
router.get("/rooms", auth, async (req, res) => {
  try {
    const rooms = await prisma.chatRoom.findMany({
      include: {
        customer: { select: { id: true, name: true, email: true } },
        messages: { select: { id: true, content: true, createdAt: true, senderId: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET customer's own chat rooms
 * GET /chat/my-rooms
 */
router.get("/my-rooms", auth, async (req, res) => {
  try {
    const rooms = await prisma.chatRoom.findMany({
      where: { customerId: req.user.userId },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        messages: { select: { id: true, content: true, createdAt: true, senderId: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE a message
 * DELETE /chat/messages/:messageId
 */
router.delete("/messages/:messageId", auth, async (req, res) => {
  try {
    const { messageId } = req.params;

    // Check if message exists and belongs to the user
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.senderId !== req.user.userId) {
      return res.status(403).json({ error: "Cannot delete someone else's message" });
    }

    // Delete the message
    await prisma.message.delete({
      where: { id: messageId },
    });

    res.json({ success: true, messageId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE a chat room
 * DELETE /chat/rooms/:roomId
 */
router.delete("/rooms/:roomId", auth, async (req, res) => {
  try {
    const { roomId } = req.params;

    // Check if room exists
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Only the customer who created the room can delete it
    if (room.customerId !== req.user.userId) {
      return res.status(403).json({ error: "Cannot delete someone else's room" });
    }

    // Delete the room (cascade will delete messages)
    await prisma.chatRoom.delete({
      where: { id: roomId },
    });

    res.json({ success: true, roomId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
