const mongoose = require('mongoose');
const { Schema } = mongoose;

const RatingSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});
module.exports = RatingSchema;
