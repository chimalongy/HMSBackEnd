require('dotenv').config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const port = process.env.PORT;
const cookieParser = require('cookie-parser');

const app = express();

// Ensure the correct path for the router
const adminRoutes = require(path.join(__dirname, "./routes/AdminRouter"));
const hotelRoutes = require(path.join(__dirname, "./routes/HotelRouter"))

// MIDDLEWARES
app.use(cookieParser()); 
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',  // Replace with the exact origin of your React app
  credentials: true,                // Allow credentials to be sent (cookies, authorization headers, etc.)
}));

// ROUTES
app.use("/admin", adminRoutes); 
app.use("/hotels", hotelRoutes);

// START SERVER
app.listen(port, () => {
  console.log(`Listening on Port ${port}`);
});
