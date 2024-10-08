const { Pool } = require('pg');
require("dotenv").config();
const jwt = require('jsonwebtoken');
const {encryptPassword} = require("../utils/globals")
// Database connection details
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});







async function createHotel(hotel_name, hotel_location, hotel_email, hotel_password) {
  console.log("Creating a hotel.");

  try {
    
    console.log("Connected to PostgreSQL");

    const queryText = `
      INSERT INTO hoteltable (hotel_name, hotel_location, hotel_email, hotel_password)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    const hashedPassword =await encryptPassword(hotel_password)
    hotel_password= hashedPassword;
    const values = [hotel_name, hotel_location, hotel_email, hotel_password];
    
    // Execute the query directly using the pool
    const res = await pool.query(queryText, values); 
    console.log("Hotel " + hotel_name + " Created:", res.rows[0]); 
    return res.rows;
  } catch (err) {
    console.error("Error executing query", err.message);
    return err.message

  } finally {
    // No need to end the pool after every query, since this closes all connections
    console.log("Operation complete.");
  }
}

async function createCategory(hotel_id, category_name, category_price) {
  console.log("Creating a category.");

  const checkCategoryQuery = `
    SELECT * FROM public.Categories 
    WHERE hotel_id = $1 AND category_name = $2;
  `;

  const insertCategoryQuery = `
    INSERT INTO public.Categories (hotel_id, category_name, category_price)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;

  const checkValues = [hotel_id, category_name];
  const insertValues = [hotel_id, category_name, category_price];

  try {
    
    const checkRes = await pool.query(checkCategoryQuery, checkValues);

    if (checkRes.rows.length > 0) {
      console.log("Category name already exists for this hotel.");
      return { error: "Category name already exists for this hotel." };
    }


    const insertRes = await pool.query(insertCategoryQuery, insertValues);
    console.log("Category created successfully:", insertRes.rows[0]);
    return insertRes.rows[0]; // Returning the newly created category

  } catch (err) {
    console.error("Error creating category:", err.message);
    return { error: err.message };
  }
}


async function createRoom(hotel_id, category_id, room_number, check_in_state = false, clean_state = true) {
  console.log("Creating a room.");

  const checkRoomQuery = `
    SELECT * FROM public.Rooms 
    WHERE hotel_id = $1 AND category_id = $2 AND room_number = $3;
  `;

  const insertRoomQuery = `
    INSERT INTO public.Rooms (hotel_id, category_id, room_number, check_in_state, clean_state)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

  const checkValues = [hotel_id, category_id, room_number];
  const insertValues = [hotel_id, category_id, room_number, check_in_state, clean_state];

  try {
    // Check if the room already exists
    const checkRes = await pool.query(checkRoomQuery, checkValues);

    if (checkRes.rows.length > 0) {
      console.log("Room already exists for this hotel, category, and room number.");
      return { error: "Room already exists for this hotel, category, and room number." };
    }

    // Insert the room if it doesn't exist
    const insertRes = await pool.query(insertRoomQuery, insertValues);
    console.log("Room created successfully:", insertRes.rows[0]);
    return insertRes.rows[0];

  } catch (err) {
    console.error("Error creating room:", err.message);
    return { error: err.message };
  }
}



async function updateHotelName(hotel_id, new_name) {
  console.log("Updating hotel name.");

  const updateHotelQuery = `
    UPDATE public.HotelTable
    SET hotel_name = $1
    WHERE id = $2
    RETURNING *;
  `;

  const values = [new_name, hotel_id];

  try {
    const res = await pool.query(updateHotelQuery, values);
    if (res.rows.length > 0) {
      // console.log("Hotel name updated successfully:", res.rows[0]);
      return res.rows[0]; // Returning the updated hotel record
    } else {
      console.log("No hotel found with the given id.");
    }
  } catch (err) {
    console.error("Error updating hotel name:", err.message);
    return err.message

  }
}

async function updateHotelLocation(hotel_id, new_location) {
  console.log("Updating hotel location.");

  const updateLocationQuery = `
    UPDATE public.HotelTable
    SET hotel_location = $1
    WHERE id = $2
    RETURNING *;
  `;

  const values = [new_location, hotel_id];

  try {
    const res = await pool.query(updateLocationQuery, values);
    if (res.rows.length > 0) {
      console.log("Hotel location updated successfully:", res.rows[0]);
      return res.rows[0]; // Returning the updated hotel record
    } else {
      console.log("No hotel found with the given id.");
    }
  } catch (err) {
    console.error("Error updating hotel location:", err.message);
    return err.message

  }
}

async function updateHotelEmail(hotel_id, new_email) {
  console.log("Updating hotel email.");

  const updateEmailQuery = `
    UPDATE public.HotelTable
    SET hotel_email = $1
    WHERE id = $2
    RETURNING *;
  `;

  const values = [new_email, hotel_id];

  try {
    const res = await pool.query(updateEmailQuery, values);
    if (res.rows.length > 0) {
      console.log("Hotel email updated successfully:", res.rows[0]);
      return res.rows[0]; // Returning the updated hotel record
    } else {
      console.log("No hotel found with the given id.");
    }
  } catch (err) {
    console.error("Error updating hotel email:", err.message);
    return err.message

  }
}

async function updateHotelPassword(hotel_id, new_password) {
  console.log("Updating hotel password.");

  const updatePasswordQuery = `
    UPDATE public.HotelTable
    SET hotel_password = $1
    WHERE id = $2
    RETURNING *;
  `;

  const hashedPassword = await encryptPassword(new_password)
  const values = [hashedPassword, hotel_id];

  try {
    const res = await pool.query(updatePasswordQuery, values);
    if (res.rows.length > 0) {
      console.log("Hotel password updated successfully:", res.rows[0]);
      return res.rows[0]; // Returning the updated hotel record
    } else {
      console.log("No hotel found with the given id.");
    }
  } catch (err) {
    console.error("Error updating hotel password:", err.message);
    return err.message

  }
}

async function deleteHotel(hotel_id) {
  console.log("Deleting hotel.");

  const deleteHotelQuery = `
    DELETE FROM public.HotelTable
    WHERE id = $1
    RETURNING *;
  `;

  const values = [hotel_id];

  try {
    const res = await pool.query(deleteHotelQuery, values);
    if (res.rows.length > 0) {
      console.log("Hotel deleted successfully:", res.rows[0]);
      return res.rows[0]; // Returning the deleted hotel record
    } else {
      console.log("No hotel found with the given id.");
    }
  } catch (err) {
    console.error("Error deleting hotel:", err.message);
    return err.message

  }
}


async function updateCategoryName(id, newName) {
  console.log("Updating category name.");

  const updateNameQuery = `
    UPDATE public.Categories
    SET category_name = $1
    WHERE id = $2
    RETURNING *;
  `;

  const values = [newName, id];

  try {
    const res = await pool.query(updateNameQuery, values);
    if (res.rows.length > 0) {
      console.log("Category name updated successfully:", res.rows[0]);
      return res.rows[0]; // Returning the updated category record
    } else {
      console.log("No category found with the given id.");
    }
  } catch (err) {
    console.error("Error updating category name:", err.message);
    return err.message;
  }
}
async function updateCategoryPrice(id, newPrice) {
  console.log("Updating category price.");

  const updatePriceQuery = `
    UPDATE public.Categories
    SET category_price = $1
    WHERE id = $2
    RETURNING *;
  `;

  const values = [newPrice, id];

  try {
    const res = await pool.query(updatePriceQuery, values);
    if (res.rows.length > 0) {
      console.log("Category price updated successfully:", res.rows[0]);
      return res.rows[0]; // Returning the updated category record
    } else {
      console.log("No category found with the given id.");
    }
  } catch (err) {
    console.error("Error updating category price:", err.message);
    return err.message;
  }
}
async function deleteCategory(category_id) {
  console.log("Deleting category.");

  const deleteCategoryQuery = `
    DELETE FROM public.Categories
    WHERE id = $1
    RETURNING *;
  `;

  const values = [category_id];

  try {
    const res = await pool.query(deleteCategoryQuery, values);
    if (res.rows.length > 0) {
      console.log("Category deleted successfully:", res.rows[0]);
      return res.rows[0]; // Returning the deleted category
    } else {
      console.log("No category found with the given id.");
      return null;
    }
  } catch (err) {
    console.error("Error deleting category:", err.message);
    return err.message;
  }
}




async function updateRoomNumber(room_id, new_room_number) {
  console.log("Updating room number.");

  const updateRoomNumberQuery = `
    UPDATE public.Rooms
    SET room_number = $1
    WHERE id = $2
    RETURNING *;
  `;

  const values = [new_room_number, room_id];

  try {
    const res = await pool.query(updateRoomNumberQuery, values);
    if (res.rows.length > 0) {
      console.log("Room number updated successfully:", res.rows[0]);
      return res.rows[0];
    } else {
      console.log("No room found with the given id.");
    }
  } catch (err) {
    console.error("Error updating room number:", err.message);
    return err.message;
  }
}
async function updateRoomCheckInState(room_id, new_check_in_state) {
  console.log("Updating check-in state.");

  const updateCheckInStateQuery = `
    UPDATE public.Rooms
    SET check_in_state = $1
    WHERE id = $2
    RETURNING *;
  `;

  const values = [new_check_in_state, room_id];

  try {
    const res = await pool.query(updateCheckInStateQuery, values);
    if (res.rows.length > 0) {
      console.log("Check-in state updated successfully:", res.rows[0]);
      return res.rows[0];
    } else {
      console.log("No room found with the given id.");
    }
  } catch (err) {
    console.error("Error updating check-in state:", err.message);
    return err.message;
  }
}
async function updateRoomCleanState(room_id, new_clean_state) {
  console.log("Updating clean state.");

  const updateCleanStateQuery = `
    UPDATE public.Rooms
    SET clean_state = $1
    WHERE id = $2
    RETURNING *;
  `;

  const values = [new_clean_state, room_id];

  try {
    const res = await pool.query(updateCleanStateQuery, values);
    if (res.rows.length > 0) {
      console.log("Clean state updated successfully:", res.rows[0]);
      return res.rows[0];
    } else {
      console.log("No room found with the given id.");
    }
  } catch (err) {
    console.error("Error updating clean state:", err.message);
    return err.message;
  }
}
async function deleteRoom(room_id) {
  console.log("Deleting room.");

  const deleteRoomQuery = `
    DELETE FROM public.Rooms
    WHERE id = $1
    RETURNING *;
  `;

  const values = [room_id];

  try {
    const res = await pool.query(deleteRoomQuery, values);
    if (res.rows.length > 0) {
      console.log("Room deleted successfully:", res.rows[0]);
      return res.rows[0]; // Returning the deleted room
    } else {
      console.log("No room found with the given id.");
      return null;
    }
  } catch (err) {
    console.error("Error deleting room:", err.message);
    return err.message;
  }
}



const loginAdmin = async (admin_email, admin_password) => {
  

  if (admin_email =="admin" && admin_password =="intel2024"){
   return true

  }
  else{
    return false;
  }

   
 
};


const getAllHotels = async () => {
  try {
    const query = 'SELECT * FROM hoteltable'; // Query to fetch all hotels
    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return {  message: 'No hotels found' }; // Return as an object
    }

    return { message:"all hotels retrived", data: result.rows }; // Return the result as part of an object
  } catch (err) {
    console.error('Error fetching hotels:', err);
    return { message: 'Error fetching hotels' }; // Return the error as part of an object
  }
};

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

const editHotel = async (hotel_id, hotel_name, hotel_location, hotel_email, hotel_password) => {
  try {
    
    const updateQuery = `
      UPDATE hoteltable
      SET hotel_name = $1,
          hotel_location = $2,
          hotel_email = $3,
          hotel_password = $4
      WHERE id = $5
      RETURNING *;  
    `;

    const password = await  encryptPassword(hotel_password)
    hotel_password=password
   
    const result = await pool.query(updateQuery, [hotel_name, hotel_location, hotel_email, hotel_password, hotel_id]);

    
    if (result.rows.length === 0) {
      return { message: 'No hotel found with the given ID' }; 
    }

    return { message: 'Hotel updated successfully', data: result.rows[0] }; 
  } catch (err) {
    console.error('Error updating hotel:', err);
    return { message: 'Error updating hotel' }; 
  }
};





const editCategory = async (category_id, category_name, category_price) => {
  try {
    const query = 'UPDATE categories SET category_name = $1, category_price = $2 WHERE id = $3 RETURNING *';
    const result = await pool.query(query, [category_name, category_price, category_id]);

    if (result.rows.length === 0) {
      return { message: 'Category not found or no changes made' }; // Category not found
    }

    return { message: 'Category updated successfully', data: result.rows[0] }; // Return updated category
  } catch (err) {
    console.error('Error updating category:', err);
    return { message: 'Error updating category' }; // Return error message
  }
};

const getRooms = async (hotel_id, category_id) => {
  try {
    const query = 'SELECT * FROM rooms WHERE hotel_id = $1 AND category_id = $2';
    const result = await pool.query(query, [hotel_id, category_id]); // Pass hotel_id and category_id as parameters

    if (result.rows.length === 0) {
      return { message: 'No rooms found for this category in the hotel' }; // No rooms found
    }

    return { message: 'Rooms retrieved', data: result.rows }; // Return rooms
  } catch (err) {
    console.error('Error fetching rooms:', err);
    return { message: 'Error fetching rooms' }; // Return error message
  }
};




 






async function createHotelTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS public.HotelTable (
      id SERIAL PRIMARY KEY,
      hotel_name VARCHAR(100) NOT NULL,
      hotel_location VARCHAR(100) NOT NULL,
      hotel_email VARCHAR(100) UNIQUE NOT NULL,
      hotel_password VARCHAR(100) NOT NULL
    );
  `;

  try {
    await pool.connect();
    await pool.query(createTableQuery);
    console.log("HotelTable created successfully.");
  } catch (err) {
    console.error("Error creating table:", err.stack);
  } finally {
  
  }
}


async function createCategoryTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS public.Categories (
      id SERIAL PRIMARY KEY,
      hotel_id INTEGER NOT NULL,
      category_name VARCHAR(100) NOT NULL,
      category_price INTEGER NOT NULL,
      FOREIGN KEY (hotel_id) REFERENCES public.HotelTable(id) ON DELETE CASCADE
    );
  `;

  try {
    await pool.connect();
    await pool.query(createTableQuery); // Directly use the pool to run the query
    console.log("RoomCategoryTable created successfully.");
  } catch (err) {
    console.error("Error creating table:", err.message);
  }
 finally{
 
 }
}
 

async function createRoomsTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS public.Rooms (
      id SERIAL PRIMARY KEY,
      hotel_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      room_number INTEGER NOT NULL,
      check_in_state BOOLEAN DEFAULT false,
      clean_state BOOLEAN DEFAULT true,
      FOREIGN KEY (hotel_id) REFERENCES public.HotelTable(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES public.Categories(id) ON DELETE CASCADE
    );
  `;

  try {
    await pool.connect();
    await pool.query(createTableQuery);
    console.log("Rooms table created successfully.");
  } catch (err) {
    console.error("Error creating table:", err.message);
  }

}

createHotelTable(); 
createCategoryTable(); 
createRoomsTable(); 




module.exports = {
  createHotel,
  createCategory,
  createRoom,
  updateHotelName,
  updateHotelLocation,
  updateHotelEmail,
  updateHotelPassword,
  deleteHotel,

  updateCategoryName,
  updateCategoryPrice,


  updateRoomNumber,
  updateRoomCheckInState,
  updateRoomCleanState,


  deleteRoom,
  deleteCategory,

  loginAdmin,
  getAllHotels,
  getHotelCategories,
  editHotel,
  editCategory,
  getRooms
};
