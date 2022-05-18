const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const HttpError = require("./models/http-error");
const usersRoutes = require("./routes/users-routes");
const collectionsRoutes = require("./routes/collections-routes");
const configRoutes = require("./routes/config-routes");
const itemsRoutes = require("./routes/items-routes");

const adminRoutes = require("./routes/admin-routes");

const app = express();

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );

  next();
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
  // The res.headersSent property is a boolean property that indicates if the app sent HTTP headers for the response.
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
  .then(() => {
    app.listen(process.env.PORT || 5000);
  })
  .catch((err) => {
    console.log(err);
  });
