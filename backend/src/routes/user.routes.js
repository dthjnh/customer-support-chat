const express = require("express");
const prisma = require("../prisma");
const auth = require("../middlewares/auth");
const role = require("../middlewares/role");

const router = express.Router();

/**
 * =========================================
 * GET /users
 * Get all users
 * Accessible by: ADMIN, AGENT
 * =========================================
 */
router.get("/", auth, role(["ADMIN", "AGENT"]), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.json(users);
  } catch (error) {
    console.error("GET /users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

/**
 * =========================================
 * GET /users/:id
 * Get user by ID
 * Accessible by: ADMIN, AGENT
 * =========================================
 */
router.get("/:id", auth, role(["ADMIN", "AGENT"]), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("GET /users/:id error:", error);
    res.status(400).json({ error: "Invalid user ID" });
  }
});

/**
 * =========================================
 * PATCH /users/:id/role
 * Update user role
 * Accessible by: ADMIN only
 * =========================================
 */
router.patch("/:id/role", auth, role(["ADMIN"]), async (req, res) => {
  try {
    const { role: newRole } = req.body;

    const allowedRoles = ["ADMIN", "AGENT", "CUSTOMER"];
    if (!allowedRoles.includes(newRole)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: { role: newRole },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    res.json({
      message: "User role updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("PATCH /users/:id/role error:", error);
    res.status(400).json({ error: "Failed to update user role" });
  }
});

/**
 * =========================================
 * DELETE /users/:id
 * Delete user
 * Accessible by: ADMIN only
 * =========================================
 */
router.delete("/:id", auth, role(["ADMIN"]), async (req, res) => {
  try {
    await prisma.user.delete({
      where: { id: req.params.id },
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("DELETE /users/:id error:", error);
    res.status(400).json({ error: "Failed to delete user" });
  }
});

module.exports = router;
