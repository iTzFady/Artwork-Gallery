const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const {
  createRoom,
  joinRoom,
  endRoom,
  getWinners,
} = require("../controllers/roomController");

router.post("/create", auth, createRoom);

router.post("/join/:identifier", auth, joinRoom);

router.post("/end/:roomId", auth, endRoom);

router.get("/:identifier", auth, getWinners);

module.exports = router;
