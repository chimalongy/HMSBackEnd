const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken');

const { hotelLogin, getHotelCategories, getHotelRooms } = require("../controllers/HotelFunctions");




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

    
     const token = jwt.sign({ hotel_email:hotel_data.hotel_email }, process.env.SECRET_KEY, { expiresIn: '25h' });
    res.cookie('hotel_token', token, { httpOnly: true, secure: false });
    res.json({message:"sucessful", hotel_data: hotel_data, hotel_category_data: hotel_categories, hotel_room_data: hotel_rooms})
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





  
  module.exports = router;



module.exports = router;
