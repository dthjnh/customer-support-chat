const express = require("express");
const prisma = require("../prisma");
const auth = require("../middlewares/auth");

const router = express.Router();

/**
 * Search users by email
 * GET /users/search?email=...
 */
router.get("/search", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: "Email query parameter required" });
    }

    const users = await prisma.user.findMany({
      where: {
        email: {
          contains: email,
          mode: "insensitive",
        },
      },
      select: { id: true, name: true, email: true, role: true },
      take: 10,
    });

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get friends/contacts of current user
 * GET /users/friends (MUST come before /:id to avoid route conflicts)
 */
router.get("/friends", auth, async (req, res) => {
  try {
    const friends = await prisma.friend.findMany({
      where: {
        OR: [
          { userId: req.user.userId },
          { friendId: req.user.userId },
        ],
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        friend: { select: { id: true, name: true, email: true } },
      },
    });

    // Map to return friend data regardless of direction
    const friendsList = friends.map((f) =>
      f.userId === req.user.userId
        ? { ...f.friend, relationId: f.id }
        : { ...f.user, relationId: f.id }
    );

    res.json(friendsList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get direct messages between two users (MUST come before /:id)
 * GET /users/direct-messages/:friendId
 */
router.get("/direct-messages/:friendId", auth, async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.userId;

    // Find the friendship
    const friendship = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    });

    if (!friendship) {
      return res.status(404).json({ error: "Not friends" });
    }

    // Get messages
    const messages = await prisma.directMessage.findMany(
      { where: { friendshipId: friendship.id },
      include: {
        sender: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Mark direct messages as read
 * PUT /users/direct-messages/:friendId/mark-read
 */
router.put("/direct-messages/:friendId/mark-read", auth, async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.userId;

    // Find the friendship
    const friendship = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    });

    if (!friendship) {
      return res.status(404).json({ error: "Not friends" });
    }

    // Mark all messages from the friend as read
    await prisma.directMessage.updateMany(
      { where: { friendshipId: friendship.id, senderId: friendId },
      data: { isRead: true },
    });

    res.json({ message: "Messages marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get user by ID
 * GET /users/:id (MUST come after specific routes)
 */
router.get("/:id", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Add a friend
 * POST /users/friends/:friendId
 */
router.post("/friends/:friendId", auth, async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.userId;

    // Check if already friends
    const existing = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    });

    if (existing) {
      return res.status(400).json({ error: "Already friends" });
    }

    // Create friendship
    const friendship = await prisma.friend.create({
      data: {
        userId,
        friendId,
      },
    });

    res.json(friendship);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Delete a direct message
 * DELETE /users/direct-messages/:messageId
 */
router.delete("/direct-messages/:messageId", auth, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await prisma.directMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.senderId !== req.user.userId) {
      return res.status(403).json({ error: "Cannot delete someone else's message" });
    }

    await prisma.directMessage.delete({
      where: { id: messageId },
    });

    res.json({ success: true, messageId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
