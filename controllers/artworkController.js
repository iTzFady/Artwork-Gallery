const Artwork = require("../models/Artwork");
const Room = require("../models/Room");
const fs = require("fs");
const path = require("path");

exports.uploadArtwork = async (req, res) => {
  try {
    const { description, roomId } = req.body;
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    if (room.status === "ended") {
      return res.status(403).json({ error: "This competition has ended" });
    }
    const isOwner = room.owner.toString() === req.user.id;
    const isMember = room.invitedUsers.some(
      (member) => member.toString() === req.user.id
    );

    if (!isOwner && !isMember) {
      return res.status(403).json({
        error: "You must be the room owner or a member to upload artwork",
      });
    }
    const existingArtwork = await Artwork.findOne({
      createdBy: req.user.id,
      room: roomId,
    });

    if (existingArtwork) {
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({
        error: "You can only upload one artwork per competition",
        code: "ALREADY_UPLOADED",
      });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Artwork image is required" });
    }
    const imagePath = req.file.path;

    const existing = await Artwork.findOne({
      createdBy: req.user.id,
      imagePath,
    });
    if (existing) {
      fs.unlinkSync(imagePath);
      return res
        .status(409)
        .json({ error: "This Artwork is already uploaded" });
    }

    const artwork = new Artwork({
      description,
      imagePath,
      createdBy: req.user.id,
      room: roomId,
    });
    await artwork.save();
    res.status(201).json(artwork);
  } catch (err) {
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    res.status(400).json({ error: err.message });
  }
};
exports.getAllArtwork = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findOne({ inviteCode: roomId });
    const artworks = await Artwork.find({ room: roomId })
      .populate("createdBy", "name _id profilePicture")
      .populate("room", "status")
      .sort({ _id: -1 });
    res.json(artworks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getArtwork = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id)
      .populate("createdBy", "name profilePicture")
      .populate("room", "status");
    if (!artwork) {
      return res.status(404).json({ error: "Artwork not found" });
    }
    res.json(artwork);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.rateArtwork = async (req, res) => {
  try {
    const { rating, review } = req.body;
    const userId = req.user.id;
    const artwork = await Artwork.findById(req.params.id)
      .populate("createdBy")
      .populate("room");
    if (artwork.room.status === "ended") {
      return res.status(403).json({ error: "This competition has ended" });
    }
    if (!artwork) {
      return res.status(404).json({ error: "Artwork not found" });
    }
    if (artwork.createdBy._id.toString() === req.user.id) {
      return res.status(403).json({
        error: "You can't vote on your own artwork",
        code: "SELF_VOTE_NOT_ALLOWED",
      });
    }
    const existingRating = artwork.votes.find(
      (r) => r.user.toString() === userId
    );

    if (existingRating) {
      existingRating.rating = rating;
      existingRating.review = review;
      existingRating.date = Date.now();
    } else {
      artwork.votes.push({
        user: userId,
        rating: rating,
        review: review,
        date: Date.now(),
      });
    }

    await artwork.save();
    res.json({ message: "Rating submitted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getArtworkReviews = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id).populate({
      path: "votes.user",
      model: "User",
      select: "name",
    });
    if (!artwork) {
      return res.status(404).json({ error: "Artwork not found" });
    }
    const reviews =
      artwork.votes?.map((vote) => ({
        user: {
          _id: vote.user?._id,
          name: vote.user.name,
        },
        rating: vote.rating,
        review: vote.opinion || vote.review,
        date: vote.date,
      })) || [];

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.deleteArtwork = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);

    if (!artwork) {
      return res.status(404).json({ error: "Artwork not found" });
    }

    if (artwork.createdBy.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ error: "You can only delete your own artworks" });
    }

    fs.unlinkSync(path.resolve(artwork.imagePath));

    await artwork.deleteOne();

    res.json({ message: "Artwork deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
