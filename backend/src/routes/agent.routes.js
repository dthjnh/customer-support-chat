const express = require("express");
const prisma = require("../prisma");
const auth = require("../middlewares/auth");

const router = express.Router();

// Agent accepts a chat
router.post("/rooms/:id/assign", auth, async (req, res) => {
  if (req.user.role !== "AGENT") {
    return res.status(403).json({ error: "Only agent allowed" });
  }

  const room = await prisma.chatRoom.update({
    where: { id: req.params.id },
    data: { agentId: req.user.userId },
  });

  res.json(room);
});

module.exports = router;
