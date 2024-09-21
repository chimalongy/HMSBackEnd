const { Pool } = require('pg');
const { encryptPassword, checkPassword } = require("../utils/globals");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function hotelLogin(hotel_email, hotel_password) {
    

  try {
    console.log("hitting")
    // Query to find the user by email
    const queryText = 'SELECT * FROM hoteltable WHERE hotel_email = $1';
    const result = await pool.query(queryText, [hotel_email]);

    if (result.rows.length === 0) {
      // No user found with the provided email
      console.log("cout = 0")
      return { success: false, message: "Hotel does not exist" };
      
    }

    console.log("cout >0")
    const storedPassword = result.rows[0].hotel_password;
    const hotel_data = result.rows[0]; // Get the entire user 
    console.log(hotel_data.hotel_password);
    console.log ("Stored Emain",hotel_email);
      console.log ("Stored Pasword",storedPassword);
      console.log("Hotel Password",hotel_password)
    //Check if the provided password matches the stored (encrypted) password
     const isPasswordValid = await checkPassword(hotel_password, storedPassword);
    
    if (isPasswordValid) {
           // // Successful login
           console.log("harshed")
        return { success: true, message: "Login successful", data: hotel_data };
    }
    else{
       
     if (storedPassword == hotel_password){
        console.log("unharsed")
        return { success: true, message: "Login successful", data: hotel_data };
     }
     else{
        return { success: false, message: "Invalid email or password" };
     }
     
    }

  
    
  } catch (error) {
    console.error('Error during hotel login:', error);
    return { success: false, message: "An error occurred during login" };
  }
}




const getHotelCategories = async (hotel_id) => {
    try {
      const query = 'SELECT * FROM categories WHERE hotel_id = $1';
      const result = await pool.query(query, [hotel_id]); // Pass hotel_id as parameter
  
      if (result.rows.length === 0) {
        return { message: 'No categories found for this hotel' }; // No categories found
      }
  
      return { message: 'Categories retrieved', data: result.rows }; // Return categories
    } catch (err) {
      console.error('Error fetching categories:', err);
      return { message: 'Error fetching categories' }; // Return error message
    }
  };
  
  const getHotelRooms = async (hotel_id) => {
    try {
      const query = 'SELECT * FROM rooms WHERE hotel_id = $1';
      const result = await pool.query(query, [hotel_id]); // Pass hotel_id as parameter
  
      if (result.rows.length === 0) {
        return { message: 'No rooms found for this hotel' }; // No categories found
      }
  
      return { message: 'rooms retrieved', data: result.rows }; // Return categories
    } catch (err) {
      console.error('Error fetching room:', err);
      return { message: 'Error fetching room' }; // Return error message
    }
  };
  

  
 
  
  
  module.exports = { hotelLogin, getHotelCategories, getHotelRooms };