const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");

const userRoutes = require("./routes/users");
const ArtworkRoutes = require("./routes/artwork");
const RoomsRoutes = require("./routes/room");

dotenv.config();
const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/assets/imgs", express.static(path.join(__dirname, "assets", "imgs")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

//Routes
app.use("/api/users", userRoutes);
app.use("/api/artwork", ArtworkRoutes);
app.use("/api/rooms", RoomsRoutes);

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
