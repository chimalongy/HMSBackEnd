const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken');

const { hotelLogin, getHotelCategories, getHotelRooms,createReservation, getStayViewData , getGuessTableData  } = require("../controllers/HotelFunctions");
const { updateRoomCleanState, updateRoomCheckInState } = require("../controllers/AdminFunctions");




const hotelAuthMiddleware = (req, res, next) => {
    const token = req.cookies['hotel_token']; // Read the token from cookies
  
    if (token == null) return res.status(200).json({message:"Unauthorized."});;
  
    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
      if (err) return res.status(200).json({message:"Unauthorized."});;
      req.user = user;
      next();
    });
  
  };



router.post("/login", async (req, res) => {
  const { hotel_email, hotel_password } = req.body; // Make sure these match your client request
  const loginResponse = await hotelLogin(hotel_email, hotel_password); // Use the correct variables here
   
   if (loginResponse.data) {
    console.log("login response" ,loginResponse)
     let hotel_data = loginResponse.data;
     let hotel_categories= await getHotelCategories(hotel_data.id);
     if (hotel_categories.data){hotel_categories=hotel_categories.data}
     else{hotel_categories=hotel_categories.message}

     let hotel_rooms= await getHotelRooms(hotel_data.id);
     if (hotel_rooms.data){hotel_rooms=hotel_rooms.data}
     else{hotel_rooms=hotel_rooms.message}

     let stayviewData= await getStayViewData("","",hotel_data.id)
     let  guestTableData =await getGuessTableData(hotel_data.id);
     guestTableData= guestTableData.data;
     

    
     const token = jwt.sign({ hotel_email:hotel_data.hotel_email }, process.env.SECRET_KEY, { expiresIn: '25h' });
    res.cookie('hotel_token', token, { httpOnly: true, secure: false });
    res.json({message:"sucessful", hotel_data: hotel_data, hotel_category_data: hotel_categories, hotel_room_data: hotel_rooms, stayviewData:stayviewData, hotel_guest_data:guestTableData})
   }
   else{
     res.status(200).json(loginResponse)
   }
});

router.post('/logout', (req, res) => {
    // Clear the hotel_token cookie
    res.clearCookie('hotel_token', { httpOnly: true, secure: false });
    return res.status(200).json({ message: 'Logout successful' });
  });
  

  router.post('/gethotelcategories', hotelAuthMiddleware, async (req, res) => {
    const { hotel_id } = req.body;
  console.log(hotel_id)
    if (!hotel_id) {
      return res.status(200).json({ success: false, message: 'Hotel ID is required' });
    }
  
    else{
        let hotel_categories= await getHotelCategories(hotel_id);
     if (hotel_categories.data){hotel_categories=hotel_categories.data}
     else{hotel_categories=hotel_categories.message}
    
     return res.status(200).json({ success: true, hotel_categories:hotel_categories });

    }
   
   
  });

  router.post("/updateRoomCleanState",  async (req, res) => {
      const {hotel_id,room_id, new_cleanState} = req.body;

      if (!room_id || !new_cleanState){
       return res.status(200).json({message:"room_id or new_cleanState not found"})
      }

      let result = await updateRoomCleanState(room_id, new_cleanState);

      let hotel_rooms= await getHotelRooms(hotel_id);
     if (hotel_rooms.data){hotel_rooms=hotel_rooms.data}
     else{hotel_rooms=hotel_rooms.message}
      res.status(200).json({message:"sucess", new_hoetl_rooms_state:hotel_rooms})
  });

  router.post("/updateRoomCheckInState",  async (req, res) => {
    const { hotel_id,room_id, new_checkin_State} = req.body;
  console.log (req.body)
    // if (!room_id || !new_checkin_State){
    //  return res.status(200).json({message:"room_id or new_cleanState not found"})
    // }

    let result = await updateRoomCheckInState(room_id, new_checkin_State);

    let hotel_rooms= await getHotelRooms(hotel_id);
    if (hotel_rooms.data){hotel_rooms=hotel_rooms.data}
    else{hotel_rooms=hotel_rooms.message}
     res.status(200).json({message:"sucess", new_hoetl_rooms_state:hotel_rooms})
});



  router.post('/gethotelrooms', hotelAuthMiddleware, async (req, res) => {
    const { hotel_id } = req.body;
    console.log(hotel_id);

    // Check if hotel_id is provided
    if (!hotel_id) {
        return res.status(200).json({ success: false, message: 'Hotel ID is required' });
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

router.post('/createreservation',  async (req, res) => {
    console.log("hitting");
    const reservationData = req.body;
  
    try {
      const result = await createReservation(reservationData);
      
      if (result.message =="sucess"){
        let hotel_rooms= await getHotelRooms(reservationData.hotel_id);
        let stayviewData= await getStayViewData("","",hotel_data.id);
        let  guestTableData =await getGuessTableData(hotel_data.id);
        guestTableData= guestTableData.data
     //   res.json({message:"sucessful", hotel_data: hotel_data, hotel_category_data: hotel_categories, hotel_room_data: hotel_rooms, stayviewData:stayviewData})
        res.status(200).json({message:result.message, reservationID: result.reservationID, hotel_room_data:hotel_rooms, hotel_updatedstayview_data: stayviewData, hotel_guest_data:guestTableData});

      }
      else{
        res.status(200).json({message:"an error occured"});
      }

      
     
    } catch (error) {
      res.status(200).json({ error: error.message });
    }
  });
  

  router.post('/getstayviewdata', async (req, res)=>{
    const {start_date, end_date, hotel_id} = req.body;
      console.log("HITTONG")
      const result =  await getStayViewData( !start_date||start_date==""?"":start_date, !end_date||end_date==""?"":end_date,hotel_id);
      res.json({message:"hitting endpoint", data:result})

  })

  router.get("/getGuestTableData", async(req, res)=>{
    const{hotel_id}= req.body;
  let  guestTableData =await getGuessTableData(hotel_id);
    if (guestTableData.data){
      return res.send({message:"sucess", hotel_guests:guestTableData.data})
    }
    else{
     return res.send({message:"failed", })
    }
  })


  
  module.exports = router;



module.exports = router;
