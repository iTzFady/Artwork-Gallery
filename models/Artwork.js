const mongoose = require("mongoose");
const { Schema } = mongoose;
const RatingSchema = require("./Vote");

const ArtWorkSchema = new Schema({
  description: String,
  imagePath: String,
  createdBy: { type: mongoose.Types.ObjectId, ref: "User" },
  room: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
  votes: [RatingSchema],
});

module.exports = mongoose.model("Artwork", ArtWorkSchema);
