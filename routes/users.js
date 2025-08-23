const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  register,
  login,
  getProfile,
  verifyToken,
} = require("../controllers/userController");
const auth = require("../middleware/auth");
const { error } = require("console");
const router = express.Router();

const profilePicStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const profilePicDir = "uploads/profile-pics/";
    fs.mkdir(profilePicDir, { recursive: true }, (err) => {
      if (err) {
        return cb(err);
      }
      cb(null, profilePicDir);
    });
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `profile-${Date.now()}${ext}`);
  },
});
const uploadProfilePic = multer({
  storage: profilePicStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!", false));
    }
  },
});

router.post("/register", uploadProfilePic.single("profilePicture"), register);
router.post("/login", login);
router.get("/profile", auth, getProfile);
router.get("/verify", auth, verifyToken);
module.exports = router;
