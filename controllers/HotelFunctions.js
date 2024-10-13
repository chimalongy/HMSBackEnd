const { Pool } = require("pg");
const {
  encryptPassword,
  checkPassword,
 businessName,
 getDateMonthsBack,
 getDateMonthsAhead
} = require("../utils/globals");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function hotelLogin(hotel_email, hotel_password) {
  try {
    console.log("hitting");
    // Query to find the user by email
    const queryText = "SELECT * FROM hoteltable WHERE hotel_email = $1";
    const result = await pool.query(queryText, [hotel_email]);

    if (result.rows.length === 0) {
      // No user found with the provided email
      console.log("cout = 0");
      return { success: false, message: "Hotel does not exist" };
    }

    console.log("cout >0");
    const storedPassword = result.rows[0].hotel_password;
    const hotel_data = result.rows[0]; // Get the entire user
    console.log(hotel_data.hotel_password);
    console.log("Stored Emain", hotel_email);
    console.log("Stored Pasword", storedPassword);
    console.log("Hotel Password", hotel_password);
    //Check if the provided password matches the stored (encrypted) password
    const isPasswordValid = await checkPassword(hotel_password, storedPassword);

    if (isPasswordValid) {
      // // Successful login
      console.log("harshed");
      return { success: true, message: "Login successful", data: hotel_data };
    } else {
      if (storedPassword == hotel_password) {
        console.log("unharsed");
        return { success: true, message: "Login successful", data: hotel_data };
      } else {
        return { success: false, message: "Invalid email or password" };
      }
    }
  } catch (error) {
    console.error("Error during hotel login:", error);
    return { success: false, message: "An error occurred during login" };
  }
}
const getHotelData = async (hotel_id) => {
  try {
    const query = "SELECT * FROM hoteltable WHERE id = $1";
    const result = await pool.query(query, [hotel_id]); // Pass hotel_id as parameter

   
    return result.rows
  } catch (err) {
    console.error("Error fetching categories:", err);
    return { message: "Error fetching categories" }; // Return error message
  }
};
const getHotelCategories = async (hotel_id) => {
  try {
    const query = "SELECT * FROM categories WHERE hotel_id = $1";
    const result = await pool.query(query, [hotel_id]); // Pass hotel_id as parameter

    if (result.rows.length === 0) {
      return { message: "No categories found for this hotel" }; // No categories found
    }

    return { message: "Categories retrieved", data: result.rows }; // Return categories
  } catch (err) {
    console.error("Error fetching categories:", err);
    return { message: "Error fetching categories" }; // Return error message
  }
};

const getHotelRooms = async (hotel_id) => {
  try {
    const query = "SELECT * FROM rooms WHERE hotel_id = $1";
    const result = await pool.query(query, [hotel_id]); // Pass hotel_id as parameter

    if (result.rows.length === 0) {
      return { message: "No rooms found for this hotel" }; // No categories found
    }

    return { message: "rooms retrieved", data: result.rows }; // Return categories
  } catch (err) {
    console.error("Error fetching room:", err);
    return { message: "Error fetching room" }; // Return error message
  }
};

const getHotelRoomsByCategory = async (hotel_id, category_id) => {
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


async function generateUniqueReservationID(businessName, hotelName) {
  // Helper function to generate the reservation ID
  console.log ("BUSINESS NAME: ", businessName);
  console.log ("HOTEL NAME: ", hotelName);
  function generateReservationID(businessName, hotelName) {
    const businessPart = businessName.slice(0, 3).toUpperCase();
    const hotelPart = hotelName.slice(0, 3).toUpperCase();
    const now = Date.now().toString();
    const timePart = now.slice(-10);
    return `${businessPart}-${hotelPart}-${timePart}`;
  }

  let reservationID = generateReservationID(businessName, hotelName);

  // Check if the generated ID already exists in the Reservations table
  const checkIDExistsQuery = `
      SELECT COUNT(*) 
      FROM public.Reservations 
      WHERE id = $1;
    `;

  try {
    let idExists = true;

    while (idExists) {
      const result = await pool.query(checkIDExistsQuery, [reservationID]);

      if (parseInt(result.rows[0].count) === 0) {
        // No match found, ID is unique
        idExists = false;
      } else {
        // ID exists, generate a new one
        reservationID = generateReservationID(businessName, hotelName);
      }
    }

    // Return the unique reservation ID
    return reservationID;
  } catch (err) {
    console.error("Error checking reservation ID:", err.message);
    throw new Error("Failed to generate unique reservation ID");
  }
}

async function getRoomReservationHistory(room_id){
  try {
    let data =[]
    const query = 'SELECT * FROM bookedrooms WHERE room_id = $1';
    const result = await pool.query(query, [room_id]); // Pass hotel_id and category_id as parameters

    if (result.rows.length === 0) {
      return { message: 'No reservations found for this room', data:[] }; // No rooms found
    }

    let roomReservationHistory = result.rows

    for (let i = 0; i<roomReservationHistory.length; i++){
      let reservation_id = roomReservationHistory[i].reservation_id;
      //console.log(reservation_id)
      const fullReservationRequest = "SELECT * FROM reservations WHERE id = $1";
      const result2 = await pool.query(fullReservationRequest, [reservation_id]);
      //console.log(result2.rows[0]);

      const completeRoomReservationData = {...roomReservationHistory[i],...result2.rows[0]}

      data.push(completeRoomReservationData)

    }

 return {data:data}
  } catch (err) {
    console.error('Error fetching rooms:', err);
    return { message: 'Error fetching rooms' }; // Return error message
  }
}

async function createReservation(reservationData) {
  const {
    checkin_date,
    checkout_date,
    nights,
    reservation_type,
    reservation_status,
    business_segment,
    category,
    occupants,
    guestname,
    phonenumber,
    email,
    dateofbirth,
    gender,
    country,
    state,
    city,
    zip,
    address,
    special_request,
    meal_plan,
    billed_to,
    payment_mode,
    payment_status,
    amount,
    booked_by,
    hotel_id,
    booked_rooms // Array of room objects
  } = reservationData;

  console.log(reservationData)
  // Assuming generateUniqueReservationID is defined elsewhere
  const reservationID = await generateUniqueReservationID(businessName, reservationData.hotel_name);
  console.log("Generated Reservation ID:", reservationID);

  // Create reservation query
  const createReservationQuery = `
      INSERT INTO public.Reservations (
        id, checkin_date, checkout_date, nights, reservation_type,
        reservation_status, business_segment, category, occupants,
        guestname, phonenumber, email, dateofbirth, gender, country, state, city, zip, address,
        special_request, meal_plan, billed_to, payment_mode, payment_status, amount, booked_by, hotel_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25,$26,$27)
    `;

  const reservationValues = 
  [
    reservationID, checkin_date, checkout_date, nights, reservation_type, reservation_status,
    business_segment, category, occupants, guestname, phonenumber, email,
    dateofbirth, gender, country, state, city, zip, address, special_request, meal_plan,
    billed_to, payment_mode, payment_status, amount, booked_by, hotel_id
  ]
    

  try {
    // Insert reservation into Reservations table
    const reservationResult = await pool.query(createReservationQuery, reservationValues);
   // console.log (reservationResult.rows[0])
    // const insertedReservationID = reservationResult.rows[0].id;
    

    // Prepare to insert booked rooms
    const createBookedRoomsQuery = `
      INSERT INTO public.BookedRooms (reservation_id, hotel_id, category_id, room_id, room_number, room_category_name, price)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;
    `;

    // Insert each booked room into BookedRooms table
    for (const room of booked_rooms) {
      const bookedRoomValues = [
        reservationID,
        room.hotel_id,
        room.category_id,
        room.room_id,
        room.room_number,
        room.room_category_name,
        room.price,
      ];

    const result =   await pool.query(createBookedRoomsQuery, bookedRoomValues)


   let reservationLogData = {
      reservation_id: reservationID,
      hotel_id: room.hotel_id,
      category_id: room.category_id,
      room_id: room.room_id,
      room_number: room.room_number,
      room_category_name: room.room_category_name, 
      activity: ""
    }

    reservationLogData.activity = reservationData.booked_by +" created reservation "+ reservationID;
    await insertRoomLog(reservationLogData);
    reservationLogData.activity = reservationData.booked_by +" confirmed payment status for reservation "+ reservationID + " as " + reservationData.payment_status;
    await insertRoomLog(reservationLogData);
    reservationLogData.activity = reservationData.booked_by +" registered "+ reservationData.guestname +" to reservation "+ reservationID;
    await insertRoomLog(reservationLogData);
    
    console.log( reservationLogData);
 
     await updateRoomCheckInState(room.room_id, true);
     await updateRoomCleanState(room.room_id, false)
     
    

     

    }

    console.log("Reservation created successfully with ID:", reservationID);
    return {message:"sucess", reservationID:reservationID};
  } catch (err) {
    console.error("Error creating reservation:", err.message);
    throw err; // Rethrow the error to handle it later
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
//**** */
async function updateReservation(reservationID, updatedReservationData) {
  const {
    checkin_date,
    checkout_date,
    nights,
    reservation_type,
    reservation_status,
    business_segment,
    category,
    occupants,
    guestname,
    phonenumber,
    email,
    dateofbirth,
    gender,
    country,
    state,
    city,
    zip,
    address,
    special_request,
    meal_plan,
    billed_to,
    payment_mode,
    payment_status,
    amount,
    booked_by,
    hotel_id,
    booked_rooms // Array of room objects
  } = updatedReservationData;

  // Update reservation query
  const updateReservationQuery = `
    UPDATE public.Reservations
    SET checkin_date = $2, checkout_date = $3, nights = $4, reservation_type = $5,
        reservation_status = $6, business_segment = $7, category = $8, occupants = $9,
        guestname = $10, phonenumber = $11, email = $12, dateofbirth = $13, gender = $14,
        country = $15, state = $16, city = $17, zip = $18, address = $19, special_request = $20,
        meal_plan = $21, billed_to = $22, payment_mode = $23, payment_status = $24, amount = $25,
        booked_by = $26, hotel_id = $27
    WHERE id = $1
  `;

  const reservationValues = [
    reservationID, checkin_date, checkout_date, nights, reservation_type, reservation_status,
    business_segment, category, occupants, guestname, phonenumber, email,
    dateofbirth, gender, country, state, city, zip, address, special_request, meal_plan,
    billed_to, payment_mode, payment_status, amount, booked_by, hotel_id
  ];

  try {
    // Update reservation in Reservations table
    await pool.query(updateReservationQuery, reservationValues);
    console.log(`Reservation ${reservationID} updated successfully.`);


    const reservedRoomsQuery = 'Select * from public.bookedrooms where reservation_id = $1;'
    let res = await pool.query(reservedRoomsQuery, [reservationID]);
    if (res.rows.length > 0) {
      
      for (let i=0; i< res.length; i++){
        const room_to_delete_room_id = res[i].room_id;
        await updateRoomCheckInState(room_to_delete_room_id, false);
        await updateRoomCleanState (room_to_delete_room_id, false);
      }
    
    } 

    // Prepare to update booked rooms (clear existing booked rooms and insert new ones)
    const deleteBookedRoomsQuery = `
      DELETE FROM public.BookedRooms WHERE reservation_id = $1;
    `;
    await pool.query(deleteBookedRoomsQuery, [reservationID]);
    console.log(`Old booked rooms for reservation ${reservationID} deleted.`); 

    // Insert updated booked rooms into BookedRooms table
    const createBookedRoomsQuery = `
      INSERT INTO public.BookedRooms (reservation_id, hotel_id, category_id, room_id, room_number, room_category_name, price)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;
    `;

    for (const room of booked_rooms) {
      const bookedRoomValues = [
        reservationID,
        room.hotel_id,
        room.category_id,
        room.room_id,
        room.room_number,
        room.room_category_name,
        room.price,
      ];

      await pool.query(createBookedRoomsQuery, bookedRoomValues);
      console.log(`Room ${room.room_number} updated for reservation ${reservationID}.`);

      // Update room state (optional based on your business logic)
      await updateRoomCheckInState(room.room_id, true);
      await updateRoomCleanState(room.room_id, false);
      let reservationLogData = {
        reservation_id: reservationID,
        hotel_id: room.hotel_id,
        category_id: room.category_id,
        room_id: room.room_id,
        room_number: room.room_number,
        room_category_name: room.room_category_name, 
        activity: ""
      }
  
      reservationLogData.activity = updatedReservationData.booked_by +" updated the reservation "+ reservationID +" for this room.";
      await insertRoomLog(reservationLogData);
     
    }

    console.log("Reservation updated successfully.");
    return { message: "success", data: reservationID };
  } catch (err) {
    return {message:err.message}
  }
}
async function cancelReservation(reservationID) {
  // Query to delete booked rooms associated with the reservation
  const deleteBookedRoomsQuery = `
    DELETE FROM public.BookedRooms WHERE reservation_id = $1 RETURNING *;
  `;

  // Query to delete the reservation itself
  const deleteReservationQuery = `
    DELETE FROM public.Reservations WHERE id = $1 RETURNING *;
  `;

  try {
    // Begin transaction
    await pool.query('BEGIN');

    // Delete booked rooms first
    const bookedRoomsResult = await pool.query(deleteBookedRoomsQuery, [reservationID]);
    const deletedBookedRooms = bookedRoomsResult.rows;

    // Update room states back to available (optional)
    for (const room of deletedBookedRooms) {
      await updateRoomCheckInState(room.room_id, false); // Mark room as not checked in
      await updateRoomCleanState(room.room_id, false); // Mark room as clean
      let reservationLogData = {
        reservation_id: reservationID,
        hotel_id: room.hotel_id,
        category_id: room.category_id,
        room_id: room.room_id,
        room_number: room.room_number,
        room_category_name: room.room_category_name, 
        activity: ""
      }
  
      reservationLogData.activity = " Room reservation "+ reservationID+ " was CANCELED and Deleted"
      await insertRoomLog(reservationLogData);
      console.log(`Room ${room.room_number} is now available.`);
      
    }

    // Delete the reservation itself
    const reservationResult = await pool.query(deleteReservationQuery, [reservationID]);
    
    if (reservationResult.rowCount === 0) {
      throw new Error(`Reservation with ID ${reservationID} not found.`);
    }

    console.log(`Reservation ${reservationID} and associated booked rooms deleted successfully.`);

    // Commit transaction
    await pool.query('COMMIT');

    return { message: "success", data: reservationID };
  } catch (err) {
    
    await pool.query('ROLLBACK');
    return { message: err.message};
  }
}

async function getCityLedger(hotel_id) {
  const cityLedgerQuery = `
    SELECT 
      id AS reservation_id,
      guestname,
      phonenumber,
      email,
      billed_to,
      amount,
      payment_status,
      payment_mode,
      city,
      state,
      country
    FROM 
      public.Reservations
    WHERE 
      payment_status = 'unpaid' 
      AND hotel_id = $1  -- Filter by hotel_id
    ORDER BY
      city, guestname;
  `;

  try {
    // Pass hotel_id as a parameter to filter city ledger results by hotel
    const result = await pool.query(cityLedgerQuery, [hotel_id]);
   
    return result.rows;
  } catch (err) {
    console.error("Error fetching city ledger for hotel_id:", err.message);
    throw err; // Rethrow to handle it appropriately
  }
}

async function getStayViewData(start_date, end_date, hotel_id) {
  let stayviewData = [];
  
  // Fetch hotel categories
  let hotelCategories = await getHotelCategories(hotel_id);
  hotelCategories = hotelCategories.data;

  // Loop through each hotel category
  for (let i = 0; i < hotelCategories.length; i++) {
      let roomsReservationList = [];  // Reset the room reservation list for each category
      
      // Fetch rooms for the current category
      let categoryRooms = await getHotelRoomsByCategory(hotel_id, hotelCategories[i].id);
      categoryRooms = categoryRooms.data;

         // Check if categoryRooms is undefined or has a length of 0
    if (!categoryRooms || categoryRooms.length === 0 ) {
      // Handle the case where categoryRooms is undefined or has no rooms
      console.warn(`No rooms available for category ID ${hotelCategories[i].id}.`);
       }

      else {
        // Loop through each room in the current category
      for (let j = 0; j < categoryRooms.length; j++) {
        let bookings = [];  // Reset the bookings list for each room
        
        // Fetch reservation history for the current room
        let roomReservationHistory = await getRoomReservationHistory(categoryRooms[j].id);
        roomReservationHistory = roomReservationHistory.data;
         
        // Extract booking data
        for (let k = 0; k < roomReservationHistory.length; k++) {
            const bookingData = {
                guestname: roomReservationHistory[k].guestname,
                checkin_date: roomReservationHistory[k].checkin_date,
                checkout_date: roomReservationHistory[k].checkout_date,
                reservation_id: roomReservationHistory[k].reservation_id
            };
            bookings.push(bookingData);
        }

        // Construct room reservation data
        let roomReservationData = {
            roomNumber: categoryRooms[j].room_number,
            room_id: categoryRooms[j].id,
            price: hotelCategories[i].category_price,
            bookings: bookings,
        };

        roomsReservationList.push(roomReservationData);
    }
      }
     

      // Construct category data and push to stayviewData
      let categoryData = {
          category: hotelCategories[i].category_name,
          rooms: roomsReservationList,
      };

      stayviewData.push(categoryData);
  }

  return stayviewData;
}
async function getGuessTableData(hotel_id){

  try{
    const query = "SELECT guestname,phonenumber,email,dateofbirth,gender,country,state,city,zip,address,special_request, business_segment FROM reservations WHERE hotel_id = $1";
    values=[hotel_id];
    const result = await pool.query(query, [hotel_id]); // Pass hotel_id as parameter

    if (result.rows.length === 0) {
      return { message: "No guests found for this hotel" }; // No categories found
    }

    return { message: "guests retrieved", data: result.rows }; // Return categories
  }
  catch(error){
    console.log(error)
  }

}


async function insertRoomLog(roomLogData) {
  const {
    reservation_id,
    hotel_id,
    category_id,
    room_id,
    room_number,
    room_category_name,
    activity
  } = roomLogData;

  const insertRoomLogQuery = `
    INSERT INTO public.Roomlogs (
      activity_date,
      reservation_id,
      hotel_id,
      category_id,
      room_id,
      room_number,
      room_category_name,
      activity
    ) VALUES (NOW(), $1, $2, $3, $4, $5, $6, $7) RETURNING *;
  `;

  const roomLogValues = [
    reservation_id,
    hotel_id,
    category_id,
    room_id,
    room_number,
    room_category_name,
    activity
  ];

  try {
    const result = await pool.query(insertRoomLogQuery, roomLogValues);
    console.log("Room log inserted successfully:", result.rows[0]);
    return {message:"success", data:result.rows[0]}; // Return the inserted room log
  } catch (err) {
    console.error("Error inserting room log:", err.message);
    return {message: err}; // Rethrow the error to handle it later
  }
}
async function getRoomLogs(filters) {
  const { hotel_id, reservation_id, room_id, category_id } = filters;

  // Base query
  let query = `
    SELECT * FROM public.Roomlogs
  `;
  
  const conditions = [];
  const values = [];

  // Add filters dynamically based on provided parameters
  if (hotel_id) {
    conditions.push(`hotel_id = $${conditions.length + 1}`);
    values.push(hotel_id);
  }
  
  if (reservation_id) {
    conditions.push(`reservation_id = $${conditions.length + 1}`);
    values.push(reservation_id);
  }
  
  if (room_id) {
    conditions.push(`room_id = $${conditions.length + 1}`);
    values.push(room_id);
  }
  
  if (category_id) {
    conditions.push(`category_id = $${conditions.length + 1}`);
    values.push(category_id);
  }

  // If there are any conditions, append them to the query
  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(' AND ');
  }

  try {
    const result = await pool.query(query, values);
    console.log("Room logs retrieved successfully:", result.rows);
    return result.rows; // Return the retrieved room logs
  } catch (err) {
    console.error("Error retrieving room logs:", err.message);
    throw err; // Rethrow the error to handle it later
  }
}

// async function getHotelReservations(hotel_id) {
//   const getReservationsByHotelQuery = `
//     SELECT 
//       public.Reservations.id,
//       public.Reservations.checkin_date,
//       public.Reservations.checkout_date,
//       public.Reservations.nights,
//       public.Reservations.reservation_type,
//       public.Reservations.reservation_status,
//       public.Reservations.business_segment,
//       public.Reservations.category,
//       public.Reservations.occupants,
//       public.Reservations.guestname,
//       public.Reservations.phonenumber,
//       public.Reservations.email,
//       public.Reservations.dateofbirth,
//       public.Reservations.gender,
//       public.Reservations.country,
//       public.Reservations.state,
//       public.Reservations.city,
//       public.Reservations.zip,
//       public.Reservations.address,
//       public.Reservations.special_request,
//       public.Reservations.meal_plan,
//       public.Reservations.billed_to,
//       public.Reservations.payment_mode,
//       public.Reservations.payment_status,
//       public.Reservations.amount,
//       public.Reservations.booked_by,
//       public.Reservations.hotel_id,
//       COUNT(public.BookedRooms.room_id) AS booked_rooms_count
//     FROM 
//       public.Reservations
//     LEFT JOIN 
//       public.BookedRooms 
//     ON 
//       public.Reservations.id = public.BookedRooms.reservation_id
//     WHERE 
//       public.Reservations.hotel_id = $1  -- Filter by hotel_id
//     GROUP BY 
//       public.Reservations.id
//     ORDER BY 
//       public.Reservations.checkin_date DESC;
//   `;

//   try {
//     // Fetch reservations for the specified hotel_id along with the number of booked rooms
//     const result = await pool.query(getReservationsByHotelQuery, [hotel_id]);

//     // Return the reservations for the specified hotel and their booked rooms count
//     return result.rows;
//   } catch (err) {
//     console.error("Error retrieving reservations for hotel_id:", err.message);
//     throw err; // Rethrow the error to handle it later
//   }
// }

         



async function getHotelReservations(hotel_id) {
  const getreservationsByHotelQuery = `
    SELECT 
      reservations.id,
      reservations.checkin_date,
      reservations.checkout_date,
      reservations.nights,
      reservations.reservation_type,
      reservations.reservation_status,
      reservations.business_segment,
      reservations.category,
      reservations.occupants,
      reservations.guestname,
      reservations.phonenumber,
      reservations.email,
      reservations.dateofbirth,
      reservations.gender,
      reservations.country,
      reservations.state,
      reservations.city,
      reservations.zip,
      reservations.address,
      reservations.special_request,
      reservations.meal_plan,
      reservations.billed_to,
      reservations.payment_mode,
      reservations.payment_status,
      reservations.amount,
      reservations.booked_by,
      reservations.hotel_id,
      json_agg(
        json_build_object(
          'room_id', BookedRooms.room_id,
          'category_id', BookedRooms.category_id,
          'room_number', BookedRooms.room_number,
          'room_category_name', BookedRooms.room_category_name,
          'price', BookedRooms.price
        )
      ) AS booked_rooms
    FROM 
      reservations
    LEFT JOIN 
      BookedRooms 
    ON 
      reservations.id = BookedRooms.reservation_id
    WHERE 
      reservations.hotel_id = $1  -- Filter by hotel_id
    GROUP BY 
      reservations.id
    ORDER BY 
      reservations.checkin_date DESC;
  `;

  try {
    // Fetch reservations for the specified hotel_id along with the booked rooms details
    const result = await pool.query(getreservationsByHotelQuery, [hotel_id]);

    // Return the reservations for the specified hotel, each including its booked rooms
    return result.rows;
  } catch (err) {
    console.error("Error retrieving reservations for hotel_id:", err.message);
    throw err; // Rethrow the error to handle it later
  }
}



// async function getHotelReservations(hotel_id) {
//   const getreservationsByHotelQuery = `
//     SELECT 
//       reservations.id,
//       reservations.checkin_date,
//       reservations.checkout_date,
//       reservations.nights,
//       reservations.reservation_type,
//       reservations.reservation_status,
//       reservations.business_segment,
//       reservations.category,
//       reservations.occupants,
//       reservations.guestname,
//       reservations.phonenumber,
//       reservations.email,
//       reservations.dateofbirth,
//       reservations.gender,
//       reservations.country,
//       reservations.state,
//       reservations.city,
//       reservations.zip,
//       reservations.address,
//       reservations.special_request,
//       reservations.meal_plan,
//       reservations.billed_to,
//       reservations.payment_mode,
//       reservations.payment_status,
//       reservations.amount,
//       reservations.booked_by,
//       reservations.hotel_id,
//       COUNT(BookedRooms.room_id) AS booked_rooms_count
//     FROM 
//       reservations
//     LEFT JOIN 
//       BookedRooms 
//     ON 
//       reservations.id = BookedRooms.reservation_id
//     WHERE 
//       reservations.hotel_id = $1  -- Filter by hotel_id
//     GROUP BY 
//       reservations.id
//     ORDER BY 
//       reservations.checkin_date DESC;
//   `;

//   try {
//     // Fetch reservations for the specified hotel_id along with the number of booked rooms
//     const result = await pool.query(getreservationsByHotelQuery, [hotel_id]);

//     // Return the reservations for the specified hotel and their booked rooms count
//     return result.rows;
//   } catch (err) {
//     console.error("Error retrieving reservations for hotel_id:", err.message);
//     throw err; // Rethrow the error to handle it later
//   }
// }



async function checkoutReservation(reservationID, checkedOutBy) {
  try {
    // Step 1: Update the reservation status to 'Checked out' and set the checkout date
    const updateReservationStatusQuery = `
      UPDATE public.Reservations
      SET reservation_status = 'checkedout'
      WHERE id = $1
      RETURNING *;
    `;
    
    const reservationResult = await pool.query(updateReservationStatusQuery, [reservationID]);

    if (reservationResult.rowCount === 0) {
      return {message:"Reservation not found or already checked out."}
    }

    const reservationData = reservationResult.rows[0];

    // Step 2: Retrieve all the rooms associated with this reservation from BookedRooms
    const getBookedRoomsQuery = `
      SELECT hotel_id, category_id, room_id, room_number, room_category_name
      FROM public.BookedRooms
      WHERE reservation_id = $1;
    `;

    const bookedRoomsResult = await pool.query(getBookedRoomsQuery, [reservationID]);

    const bookedRooms = bookedRoomsResult.rows;

    if (bookedRooms.length === 0) {
      
      return {message:"Reservation not found or already checked out."}
    }

    // Step 3: Update the check-in and clean states of each room
    for (const room of bookedRooms) {
      // Log checkout activity
      let checkoutLogData = {
        reservation_id: reservationID,
        hotel_id: room.hotel_id,
        category_id: room.category_id,
        room_id: room.room_id,
        room_number: room.room_number,
        room_category_name: room.room_category_name,
        activity: ""
      };

      checkoutLogData.activity = `${checkedOutBy} checked out reservation ${reservationID}`;
      await insertRoomLog(checkoutLogData);

      // Set room's check-in state to false (available) and clean state to true (cleaned)
      await updateRoomCheckInState(room.room_id, false);
      await updateRoomCleanState(room.room_id, true);
    }

    console.log(`Reservation ${reservationID} checked out successfully.`);
    return { message: "success", data: reservationID };
  } catch (err) {
    console.error("Error during checkout:", err.message);
    throw err; // Rethrow error to handle it elsewhere
  }
}


async function sendReport(reportType, attachmennt, hotel_id){

}






 

async function createReservationsTable() { 
  const createReservationTableQuery= `
  CREATE TABLE IF NOT EXISTS public.Reservations (
  id VARCHAR(255) PRIMARY KEY, 
  checkin_date VARCHAR(255) NOT NULL,
  checkout_date VARCHAR(255) NULL,
  nights INTEGER NOT NULL,  
  reservation_type VARCHAR(50) NOT NULL,
  reservation_status VARCHAR(50) NOT NULL,
  business_segment VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  occupants INTEGER NOT NULL,
  guestname VARCHAR(255) NOT NULL,
  phonenumber VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  dateofbirth VARCHAR(255),
  gender VARCHAR(10),
  country VARCHAR(100),
  state VARCHAR(100),
  city VARCHAR(100),
  zip VARCHAR(20),
  address TEXT,
  special_request TEXT,
  meal_plan VARCHAR(50),
  billed_to VARCHAR(255),
  payment_mode VARCHAR(50),
  payment_status VARCHAR(50),
  amount DECIMAL(10, 2) NOT NULL,
  booked_by VARCHAR(255),
  hotel_id INTEGER NOT NULL,
  FOREIGN KEY (hotel_id) REFERENCES public.HotelTable(id) ON DELETE CASCADE
);
  `
  try {
    await pool.query(createReservationTableQuery);
    console.log("BookedRooms table created successfully.");
  } catch (err) {
    console.error("Error creating BookedRooms table:", err.message);
  }   
}

async function createBookedRoomsTable() {
  const createBookedRoomsTableQuery = `
      CREATE TABLE IF NOT EXISTS public.BookedRooms (
        id SERIAL PRIMARY KEY,
        reservation_id VARCHAR(255) NOT NULL,  -- Matches VARCHAR(255) type of Reservations.id
        hotel_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        room_id INTEGER NOT NULL,
        room_number VARCHAR(50) NOT NULL,
        room_category_name VARCHAR(255),
        price DECIMAL(10, 2),
        FOREIGN KEY (reservation_id) REFERENCES public.Reservations(id) ON DELETE CASCADE,
        FOREIGN KEY (hotel_id) REFERENCES public.HotelTable(id) ON DELETE CASCADE,
        FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES public.Categories(id) ON DELETE CASCADE
      );
    `; 

  try {
    await pool.query(createBookedRoomsTableQuery);
    console.log("BookedRooms table created successfully.");
  } catch (err) {
    console.error("Error creating BookedRooms table:", err.message);
  }
}

async function createRoomLogsTable() {
  const createRoomLogTableQuery = `
  CREATE TABLE IF NOT EXISTS public.Roomlogs (
    id SERIAL PRIMARY KEY,
    activity_date TIMESTAMP NOT NULL,  -- Changed to TIMESTAMP for date and time
    reservation_id VARCHAR(255) NOT NULL,  -- Matches VARCHAR(255) type of Reservations.id
    hotel_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    room_id INTEGER NOT NULL,
    room_number VARCHAR(50) NOT NULL,
    room_category_name VARCHAR(255),
    activity TEXT NOT NULL  -- Changed to TEXT for longer activity descriptions
   
  );
  `;

  try {
    await pool.query(createRoomLogTableQuery);
    console.log("Room Logs table created successfully.");
  } catch (err) {
    console.error("Error creating Room Logs table:", err.message);
  }
}
 

 


createReservationsTable();
createBookedRoomsTable();
createRoomLogsTable(); 
 
module.exports = {
  hotelLogin,
  getHotelCategories,
  getHotelRooms,
  createReservation,
  getStayViewData,
  updateRoomCleanState, 
  updateRoomCheckInState,
  getGuessTableData,
  insertRoomLog,
  getRoomLogs,
  updateReservation,
  cancelReservation,
  getCityLedger,
  getHotelReservations,
  checkoutReservation

};  
 