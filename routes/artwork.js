const express = require("express");
const multer = require("multer");
const fs = require("fs");
const {
  uploadArtwork,
  getAllArtwork,
  deleteArtwork,
  getArtwork,
  rateArtwork,
  getArtworkReviews,
} = require("../controllers/artworkController");
const auth = require("../middleware/auth");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/";
    fs.mkdir(uploadDir, { recursive: true }, (err) => {
      if (err) {
        return cb(err);
      }
      cb(null, uploadDir);
    });
  },
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

const router = express.Router();

router.get("/room/:roomId", auth, getAllArtwork);
router.post("/upload", auth, upload.single("image"), uploadArtwork);
router.delete("/:id", auth, deleteArtwork);
router.get("/:id", auth, getArtwork);
router.post("/:id/rate", auth, rateArtwork);
router.get("/:id/reviews", auth, getArtworkReviews);
module.exports = router;
