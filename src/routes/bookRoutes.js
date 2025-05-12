import express from "express";
import cloudinary from "../lib/cloudinary.js";
import Book from "../models/Book.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protectRoute, async (req, res) => {
  try {
    const { title, caption, rating, image } = req.body;

    if (!title || !caption || !rating || !image) {
      return res.status(400).json({ message: "Please provide all fields" });
    }

    // upload image to cloudinary

    const uploadResponse = await cloudinary.uploader.upload(image);
    const imageURL = uploadResponse.secure_url;

    const newBook = new Book({
      title,
      caption,
      rating,
      image: imageURL,
      user: req.user._id,
    });

    await newBook.save();

    res
      .status(201)
      .json({ message: "Book created successfully", book: newBook });
  } catch (error) {
    console.log("Error in creating book:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 5;
    const skip = (page - 1) * limit;

    const books = await Book.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "username profileImage");

    const totalBooks = await Book.countDocuments();

    res.status(200).json({
      books,
      currentPage: page,
      totalBooks: totalBooks,
      totalPages: Math.ceil(totalBooks / limit),
    });
  } catch (error) {
    console.log("Error in getting books:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/user", protectRoute, async (req, res) => {
  try {
    const books = await Book.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({ books });
  } catch (error) {
    console.log("Error in getting user books:", error);
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (book.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (book.image.includes("cloudinary")) {
      try {
        await cloudinary.uploader.destroy(
          book.image.split("/").pop().split(".")[0]
        );
      } catch (error) {
        console.log("Error in deleting image:", error);
      }
    }

    await book.deleteOne();

    res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    console.log("Error in deleting book:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
