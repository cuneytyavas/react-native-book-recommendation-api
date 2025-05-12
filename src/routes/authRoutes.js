import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

router.post("/register", async (req, res) => {
  try {
    if (!req.body) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({
        message: "Please provide all required fields",
      });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    if (username.length < 3) {
      return res
        .status(400)
        .json({ message: "Username must be at least 3 characters long" });
    }

    // check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email or username" });
    }

    const profileImage = `https://api.dicebear.com/5.x/avataaars/svg?seed=${username}`;

    const user = new User({ email, username, password, profileImage });

    await user.save();

    const token = generateToken(user._id);

    res
      .status(201)
      .json({
        success: true,
        token,
        user: { id: user._id, username, email, profileImage },
      });
  } catch (error) {
    console.log("Error in register route:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isPasswordValid = User.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.log("Error in login route:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
