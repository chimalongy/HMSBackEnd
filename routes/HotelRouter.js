const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require("path");



const {
  hotelLogin,
  getHotelCategories,
  getHotelRooms,
  createReservation,
  getStayViewData,
  getGuessTableData,
  updateRoomCleanState,
  updateRoomCheckInState,
  insertRoomLog,
  getRoomLogs,
  updateReservation,
  cancelReservation,
  getCityLedger,
  getHotelReservations,
  checkoutReservation
} = require("../controllers/HotelFunctions");


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads'); // Define the destination folder
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)); // Custom file name
  }
});
const upload = multer({
  storage: storage,
});









const hotelAuthMiddleware = (req, res, next) => {
  const token = req.cookies["hotel_token"]; // Read the token from cookies

  if (token == null) return res.status(200).json({ message: "Unauthorized." });

  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err) return res.status(200).json({ message: "Unauthorized." });
    req.user = user;
    next();
  });
};

router.post("/login", async (req, res) => {
  const { hotel_email, hotel_password } = req.body; // Make sure these match your client request
  const loginResponse = await hotelLogin(hotel_email, hotel_password); // Use the correct variables here

  if (loginResponse.data) {
    console.log("login response", loginResponse);
    let hotel_data = loginResponse.data;
    let hotel_categories = await getHotelCategories(hotel_data.id);
    if (hotel_categories.data) {
      hotel_categories = hotel_categories.data;
    } else {
      hotel_categories = hotel_categories.message;
    }

    let hotel_rooms = await getHotelRooms(hotel_data.id);
    if (hotel_rooms.data) {
      hotel_rooms = hotel_rooms.data;
    } else {
      hotel_rooms = hotel_rooms.message;
    }

    let stayviewData = await getStayViewData("", "", hotel_data.id);
    let guestTableData = await getGuessTableData(hotel_data.id);
    guestTableData = guestTableData.data;

    let reservationData = await getHotelReservations(hotel_data.id);
    let cityLedger = await getCityLedger(hotel_data.id);
    let roomLogs = await getRoomLogs(hotel_data.id);

    const token = jwt.sign(
      { hotel_email: hotel_data.hotel_email },
      process.env.SECRET_KEY,
      { expiresIn: "25h" }
    );
    res.cookie("hotel_token", token, { httpOnly: true, secure: false });
    res.json({
      message: "sucessful",
      hotel_data: hotel_data,
      hotel_category_data: hotel_categories,
      hotel_room_data: hotel_rooms,
      stayviewData: stayviewData,
      hotel_guest_data: guestTableData,
      hotel_reservation_data: reservationData,
      hotel_cityledger: cityLedger,
      hotel_room_logs:roomLogs
      
    });
  } else {
    res.status(200).json(loginResponse);
  }
});

router.post("/logout", (req, res) => {
  // Clear the hotel_token cookie
  res.clearCookie("hotel_token", { httpOnly: true, secure: false });
  return res.status(200).json({ message: "Logout successful" });
});

router.post("/gethotelcategories", hotelAuthMiddleware, async (req, res) => {
  const { hotel_id } = req.body;
  console.log(hotel_id);
  if (!hotel_id) {
    return res
      .status(200)
      .json({ success: false, message: "Hotel ID is required" });
  } else {
    let hotel_categories = await getHotelCategories(hotel_id);
    if (hotel_categories.data) {
      hotel_categories = hotel_categories.data;
    } else {
      hotel_categories = hotel_categories.message;
    }

    return res
      .status(200)
      .json({ success: true, hotel_categories: hotel_categories });
  }
});

router.post("/updateRoomCleanState", async (req, res) => {
  const { hotel_id, room_id, new_cleanState } = req.body;

  if (!room_id || !new_cleanState) {
    return res
      .status(200)
      .json({ message: "room_id or new_cleanState not found" });
  }

  let result = await updateRoomCleanState(room_id, new_cleanState);

  let hotel_rooms = await getHotelRooms(hotel_id);
  if (hotel_rooms.data) {
    hotel_rooms = hotel_rooms.data;
  } else {
    hotel_rooms = hotel_rooms.message;
  }
  res
    .status(200)
    .json({ message: "sucess", new_hoetl_rooms_state: hotel_rooms });
});

router.post("/updateRoomCheckInState", async (req, res) => {
  const { hotel_id, room_id, new_checkin_State } = req.body;
  console.log(req.body);
  // if (!room_id || !new_checkin_State){
  //  return res.status(200).json({message:"room_id or new_cleanState not found"})
  // }

  let result = await updateRoomCheckInState(room_id, new_checkin_State);

  let hotel_rooms = await getHotelRooms(hotel_id);
  if (hotel_rooms.data) {
    hotel_rooms = hotel_rooms.data;
  } else {
    hotel_rooms = hotel_rooms.message;
  }
  res
    .status(200)
    .json({ message: "sucess", new_hoetl_rooms_state: hotel_rooms });
});

router.post("/gethotelrooms", hotelAuthMiddleware, async (req, res) => {
  const { hotel_id } = req.body;
  console.log(hotel_id);

  // Check if hotel_id is provided
  if (!hotel_id) {
    return res
      .status(200)
      .json({ success: false, message: "Hotel ID is required" });
  } else {
    let hotel_rooms = await getHotelRooms(hotel_id);

    if (hotel_rooms.data) {
      hotel_rooms = hotel_rooms.data;
    } else {
      hotel_rooms = hotel_rooms.message;
    }

    // Send a successful response with the hotel rooms
    return res.status(200).json({ success: true, hotel_rooms: hotel_rooms });
  }
});

router.post("/createreservation", async (req, res) => {
  console.log("hitting");
  const reservationData = req.body;

  try {
    const result = await createReservation(reservationData);

    if (result.message == "sucess") {
      let hotel_rooms = await getHotelRooms(reservationData.hotel_id);
      let stayviewData = await getStayViewData(
        "",
        "",
        reservationData.hotel_id
      );
      let guestTableData = await getGuessTableData(reservationData.hotel_id);
      guestTableData = guestTableData.data;
      let hotel_reservations = await getHotelReservations(reservationData.hotel_id);
      let cityledger = await getCityLedger(reservationData.hotel_id)
      let roomLogs = await getRoomLogs({hotel_id:reservationData.hotel_id});


       // res.json({message:"sucessful", hotel_data: hotel_data, hotel_category_data: hotel_categories, hotel_room_data: hotel_rooms, stayviewData:stayviewData, hotel_reservation_data: hotel_reservations})
      
      
      
      res
        .status(200)
        .json({
          message: result.message,
          reservationID: result.reservationID,
          hotel_room_data: hotel_rooms.data,
          hotel_updatedstayview_data: stayviewData,
          hotel_guest_data: guestTableData,
          hotel_reservation_data: hotel_reservations,
          hotel_cityledger: cityledger,
          hotel_room_logs :roomLogs

        });

       



    } else {
      res.status(200).json({ message: "an error occured" });
    }
  } catch (error) {
    res.status(200).json({ error: error.message });
  }
});

router.post("/getstayviewdata", async (req, res) => {
  const { start_date, end_date, hotel_id } = req.body;
  console.log("HITTONG");
  const result = await getStayViewData(
    !start_date || start_date == "" ? "" : start_date,
    !end_date || end_date == "" ? "" : end_date,
    hotel_id
  );
  res.json({ message: "hitting endpoint", data: result });
});

router.get("/getGuestTableData", async (req, res) => {
  const { hotel_id } = req.body;
  let guestTableData = await getGuessTableData(hotel_id);
  if (guestTableData.data) {
    return res.send({ message: "sucess", hotel_guests: guestTableData.data });
  } else {
    return res.send({ message: "failed" });
  }
});

router.post("/insertRoomLog", async (req, res) => {
  // Destructure room log data from the request body
  const {
    reservation_id,
    hotel_id,
    category_id,
    room_id,
    room_number,
    room_category_name,
    activity,
  } = req.body;

  // Create room log data object
  const roomLogData = {
    reservation_id,
    hotel_id,
    category_id,
    room_id,
    room_number,
    room_category_name,
    activity,
  };

  try {
    // Call the insertRoomLog function
    const insertedLog = await insertRoomLog(roomLogData);
    if (insertedLog.data) {
      return res.send({ message: "success", room_log: insertedLog });
    } else {
      return res.send({ message: " failed bad parameters" });
    }
  } catch (err) {
    console.error("Error inserting room log:", err);
    return res.status(500).send({ message: "failed", error: err.message });
  }
});

router.get("/getRoomLogs", async (req, res) => {
  const { hotel_id, reservation_id, room_id, category_id } = req.query; // Get query parameters from the request

  try {
    // Construct the filters object
    const filters = {
      hotel_id: hotel_id || null,
      reservation_id: reservation_id || null,
      room_id: room_id || null,
      category_id: category_id || null,
    };

    // Call getRoomLogs with the filters
    const roomLogs = await getRoomLogs(filters);

    if (roomLogs.length > 0) {
      return res.status(200).send({ message: "Success", roomLogs });
    } else {
      return res.status(404).send({ message: "No room logs found" });
    }
  } catch (err) {
    console.error("Error in getRoomLogs route:", err.message);
    return res.status(500).send({ message: "Internal Server Error" });
  }
});

router.put("/updateReservation", async (req, res) => {
  const { reservationID, updatedReservationData } = req.body;

  if (!reservationID || !updatedReservationData) {
    return res
      .status(200)
      .send({ message: "Missing reservationID or updatedReservationData" });
  }

  try {
    const result = await updateReservation(
      reservationID,
      updatedReservationData
    );



    if (result.data) {


      let hotel_room_data =   await getHotelRooms(updatedReservationData.hotel_id)
      hotel_room_data = hotel_room_data.data;
      let stayviewData = await getStayViewData("","", updatedReservationData.hotel_id)
      let reservationData = await getHotelReservations(updatedReservationData.hotel_id)
      let guestTableData = await getGuessTableData(reservationData.hotel_id);
      guestTableData = guestTableData.data;
      let cityledger = getCityLedger(updatedReservationData.hotel_id);
      let roomLogs = await getRoomLogs(updatedReservationData.hotel_id);


      res.status(200)
      .json({
        message: result.message,
        reservationID: result.reservationID,
        hotel_room_data: hotel_room_data,
        hotel_updatedstayview_data: stayviewData,
        hotel_guest_data: guestTableData,
        hotel_reservation_data: reservationData,
        hotel_cityledger: cityledger,
        hotel_room_logs:roomLogs
      });





      // hotel_room_data: hotel_rooms,
      // hotel_updatedstayview_data: stayviewData,
      // hotel_guest_data: guestTableData,
      // hotel_reservation_data: hotel_reservations,
      // hotel_cityledger: cityledger,

      




    } else {
      return res.status(200).send({ message: result.message });
    }
  } catch (error) {
    console.error("Error in updateReservation route:", error.message);
    return res
      .status(500)
      .send({ message: "Error updating reservation", error: error.message });
  }
});

router.delete("/cancelReservation", async (req, res) => {
  const { reservationID, hotel_id } = req.body;

  if (!reservationID) {
    return res.status(200).json({ message: "Reservation ID is required" });
  }

  try {
    const result = await cancelReservation(reservationID);

    if (result.data) {


      
      let hotel_room_data =   await getHotelRooms(hotel_id)
      hotel_room_data = hotel_room_data.data;
      let stayviewData = await getStayViewData("","", hotel_id)
      let reservationData = await getHotelReservations(hotel_id)
      let guestTableData = await getGuessTableData(hotel_id);
      guestTableData = guestTableData.data;
      let cityledger = getCityLedger(hotel_id);
      
      res.status(200).json({
       
        hotel_room_data: hotel_room_data,
        hotel_updatedstayview_data: stayviewData,
        hotel_guest_data: guestTableData,
        hotel_reservation_data: reservationData,
        hotel_cityledger: cityledger,
      });



     
    } else {
      return res.status(200).json({ message: result.message });
    }
  } catch (err) {
    console.error("Error cancelling reservation:", err.message);
    return res
      .status(500)
      .json({ message: "Error cancelling reservation", error: err.message });
  }
});

router.post("checkoutReservation", async(req, res)=>{
  let { hotel_id, reservationID, checkedOutBy}= req.body

  if (!hotel_id || hotel_id==""){
    return  res.status(200).json({message:"no reservationID found"})
    }

  if (!reservationID || checkedOutBy==""){
  return  res.status(200).json({message:"no reservationID found"})
  }

  if (!checkedOutBy || checkedOutBy ==""){
    return  res.status(200).json({message:"no staff name found"})
    }

    let result = await checkoutReservation(reservationID, checkedOutBy)
    if (result.data){
      let hotel_room_data =   await getHotelRooms(hotel_id)
      hotel_room_data = hotel_room_data.data;
      let stayviewData = await getStayViewData("","", hotel_id)
      let reservationData = await getHotelReservations(hotel_id)
      let guestTableData = await getGuessTableData(hotel_id);
      guestTableData = guestTableData.data;
      let cityledger = getCityLedger(hotel_id);
      
      res.status(200).json({
       
        hotel_room_data: hotel_room_data,
        hotel_updatedstayview_data: stayviewData,
        hotel_guest_data: guestTableData,
        hotel_reservation_data: reservationData,
        hotel_cityledger: cityledger,
      });

    }
    else{
      res.status(200).json({message:result.message})
    }


})

router.get("/default", async (req, res) => {
  //let result = await getCityLedger();
 // let result = await getHotelReservations(1);
 
 let result = await checkoutReservation(reservationID, checkedOutBy)
 


  console.log(result);
  res.send(result);
});

router.post ("/sendReport", upload.single('reportFile'), async(req,res)=>{
  const { reportType, hotel_name } = req.body;
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
   
   
    const transporter = nodemailer.createTransport({
      service: 'gmail', 
      auth: {
        user: process.env.SENDER_EMAIL, 
        pass: process.env.SENDER_EMAIL_PASSWORD, 
      },
    }); 

    
    const mailOptions = {
      from: 'me.olegeme@gmail.com',
      to: 'customersreach@gmail.com', 
      subject: `${reportType} AUDIT REPORT FOR: ${hotel_name}`,
      text: `Attached is the ${reportType} report for hotel ID ${hotel_name}.`,
      attachments: [
        {
          filename: req.file.originalname,
          path: req.file.path, 
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);

  
    res.send('File uploaded and email sent successfully!');
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send('Error sending email.');
  }


} )

module.exports = router; 

module.exports = router;
