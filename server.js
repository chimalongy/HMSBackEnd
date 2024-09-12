const express = require("express");
const cors = require("cors");
const path = require("path");
const port = process.env.PORT || 4000;

const app = express();

// Ensure the correct path for the router
const adminRoutes = require(path.join(__dirname, "./routes/AdminRouter"));

// MIDDLEWARES
app.use(express.json());
app.use(cors());

// ROUTES
app.use("/admin", adminRoutes);

// START SERVER
app.listen(port, () => {
  console.log(`Listening on Port ${port}`);
});
