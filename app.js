const express = require("express");
const path = require("path");

const bodyParser = require("body-parser");

const mongoose = require("mongoose");

const HttpError = require("./models/http-error");

const usersRoutes = require("./routes/users-routes");
const collectionsRoutes = require("./routes/collections-routes");
const configRoutes = require("./routes/config-routes");
const itemsRoutes = require("./routes/items-routes");
const adminRoutes = require("./routes/admin-routes");

const cors = require("cors");

const { createServer } = require("http");

const { Server } = require("socket.io");

const app = express();

const httpServer = createServer(app);

app.use(cors());

app.use(bodyParser.json());

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "DELETE", "PATCH"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Authorization",
    ],
  },
});

io.on("connection", (socket) => {
  socket.on("new_comment", (data) => {
    io.emit("receive_comment", data);
  });
});

app.use("/api/users", usersRoutes);

app.use("/api/collections", collectionsRoutes);

app.use("/api/items", itemsRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/config", configRoutes);

app.use((req, res, next) => {
  const error = new HttpError("Could not found this route!", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }

  res
    .status(error.code || 500)
    .json({ message: error.message || "Something went wrong in the server." });
});

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_NAME}.oqozi.mongodb.net/cmdb?retryWrites=true&w=majority`
  )
  .then(() => {})
  .catch((err) => {
    console.log(err);
  });

httpServer.listen(process.env.PORT || 5000);
