require('dotenv').config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const port = process.env.PORT;
const cron = require('node-cron');
const cookieParser = require('cookie-parser');
const {getCurrentFormattedDate} = require("./utils/globals")
const { checkoutReservation}= require("./controllers/HotelFunctions")
const { Pool } = require("pg");

const app = express();

// Ensure the correct path for the router
const adminRoutes = require(path.join(__dirname, "./routes/AdminRouter"));
const hotelRoutes = require(path.join(__dirname, "./routes/HotelRouter"))

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

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




  




//CRONE JOB 

// Schedule the task to run at 12 PM every day, West Africa Time (WAT)
cron.schedule('0 12 * * *', async () => {
  try {
    const today = getCurrentFormattedDate();
    console.log(`Running checkout for date: ${today}`);

    // Step 1: Fetch all reservations with today's checkout date
    const getReservationsQuery = `
      SELECT id 
      FROM public.Reservations
      WHERE checkout_date = $1 AND reservation_status != 'checkedout';
    `;
    
    const reservationsResult = await pool.query(getReservationsQuery, [today]);
    const reservationsToCheckout = reservationsResult.rows;

    if (reservationsToCheckout.length === 0) {
      console.log('No reservations to check out today.');
      return;
    }

    // Step 2: Loop through each reservation and call checkoutReservation
    for (const reservation of reservationsToCheckout) {
      const reservationID = reservation.id;
      const checkedOutBy = "System"; // Automated checkout

      // Perform the checkout for each reservation
      await checkoutReservation(reservationID, checkedOutBy);
      console.log(`Successfully checked out reservation with ID: ${reservationID}`);
    }
  } catch (err) {
    console.error('Error running scheduled checkout:', err.message);
  }
}, {
  scheduled: true,
  timezone: "Africa/Lagos" // Set to West Africa Timezone
});












// START SERVER
app.listen(port, () => {
  console.log(`Listening on Port ${port}`);
});
