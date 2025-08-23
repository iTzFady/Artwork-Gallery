const express = require("express");
const Room = require("../models/Room");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const Artwork = require("../models/Artwork");

exports.createRoom = async (req, res) => {
  try {
    const userId = req.user.id;

    const room = new Room({
      owner: userId,
      inviteCode: uuidv4(),
    });
    await room.save();
    res.json({
      roomId: room._id,
      inviteLink: process.env.BASE_URL + "/join/" + room.inviteCode,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.joinRoom = async (req, res) => {
  try {
    const userId = req.user.id;
    const { identifier } = req.params;
    if (!mongoose.Types.ObjectId.isValid(identifier)) {
      return res.status(400).json("Invalid Room ID");
    }
    const room = await Room.findById(identifier);

    if (!room) return res.status(404).json({ error: "Room not found" });

    if (!room.invitedUsers.includes(userId)) {
      room.invitedUsers.push(userId);
      await room.save();
    }

    res.json({ message: "Joined room", roomId: room._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.endRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ error: "Room not found" });
    if (room.owner.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Only room owner can end competition" });
    }
    const topArtworks = await Artwork.aggregate([
      { $match: { room: new mongoose.Types.ObjectId(roomId) } },
      {
        $addFields: {
          totalRating: { $sum: "$votes.rating" },
        },
      },
      { $sort: { totalRating: -1 } },
      { $limit: 6 },
    ]);
    room.status = "ended";
    room.winners = topArtworks.map((art) => art._id);
    await room.save();

    res.json({
      message: "Room ended successfully",
      winners: topArtworks,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getWinners = async (req, res) => {
  try {
    const { identifier } = req.params;

    let room = await Room.findOne({ inviteCode: identifier }).populate({
      path: "winners",
      populate: {
        path: "createdBy",
        select: "name profilePicture",
      },
    });

    if (!room && mongoose.Types.ObjectId.isValid(identifier)) {
      room = await Room.findById(identifier).populate({
        path: "winners",
        populate: {
          path: "createdBy",
          select: "name profilePicture",
        },
      });
    }
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    const enhancedWinners = await Promise.all(
      room.winners.map(async (winner) => {
        const votes = winner.votes || [];
        const totalVotesValue = votes.reduce(
          (sum, vote) => sum + vote.rating,
          0
        );
        return {
          _id: winner._id,
          imagePath: winner.imagePath,
          description: winner.description,
          createdBy: winner.createdBy,
          voteCount: totalVotesValue,
        };
      })
    );
    res.json({
      status: room.status,
      winners: enhancedWinners,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
