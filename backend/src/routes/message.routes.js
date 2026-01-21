const express = require("express");
const prisma = require("../prisma");
const auth = require("../middlewares/auth");

const router = express.Router();

router.get("/rooms/:id/messages", auth, async (req, res) => {
  const messages = await prisma.message.findMany({
    where: { roomId: req.params.id },
    orderBy: { createdAt: "asc" },
  });

  res.json(messages);
});

module.exports = router;
