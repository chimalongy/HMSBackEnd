const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const {
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

  deleteCategory,
  deleteRoom,
  loginAdmin,
  getAllHotels
} = require("../controllers/AdminFunctions");

const authMiddleware = (req, res, next) => {
  const token = req.cookies['admin_token']; // Read the token from cookies

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });

};



const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per 15 minutes
  message: "Too many login attempts, please try again later."
});

router.post("/login", loginLimiter, async (req, res)=>{
  
  const { admin_email, admin_password } = req.body;
  const loginResponse = await loginAdmin(admin_email, admin_password);

  if (loginResponse){
    
  const token = jwt.sign({ admin_email: admin_email, admin_password:admin_password }, process.env.SECRET_KEY, { expiresIn: '1h' });
  res.cookie('admin_token', token, { httpOnly: true, secure: false });
 // res.cookie('admin_token', token, { httpOnly: true, secure: true, sameSite: 'Strict' });
 return res.status(200).json({ message: 'Login successful' });
  }

  res.json(loginResponse);



})


router.post("/createhotel", authMiddleware, async(req,  res) => {
  const {hotel_name,hotel_location,hotel_email,hotel_password}= req.body
   const result =await createHotel(hotel_name, hotel_location,hotel_email,hotel_password);
   if (typeof result === 'string') {
    res.status(401).json({ message: result });
  } else {
    res.status(200).json({ message: 'success', data: result });
  }
  
 
});

router.post("/createcategory", authMiddleware, async(req, res) => {
  
  const {hotel_id, category_name, category_price} = req.body
  const result = await createCategory(hotel_id, category_name, category_price);
  if (typeof result === 'string') {
    res.status(401).json({ message: result });
  } else {
    res.status(200).json({ message: 'success', data: result });
  }
  
 
});

router.post("/createroom",authMiddleware, async(req, res) => {
  const { hotel_id, category_id, room_number}= req.body
  result =await createRoom(hotel_id, category_id, room_number);
  console.log(typeof result)
  if (typeof result === 'string') {
    res.status(401).json({ message: result });
  } else {
    res.status(200).json({ message: 'success', data: result });
  }
  
});

//update

router.patch("/updatehotelname",authMiddleware, async (req, res) => {
  const { hotel_id, new_hotel_name } = req.body;
  updateHotelName(hotel_id, new_hotel_name)
    .then((updatedHotel) => {
      console.log("Updated Hotel:", updatedHotel);
      res.json({ message: "update complete" });
    })
    .catch((err) => {
      console.error("Error:", err);
    });
});

router.patch("/updatehotellocation",authMiddleware, async(req, res) => {
  const { hotel_id, new_hotel_location } = req.body;

  updateHotelLocation(hotel_id, new_hotel_location)
    .then((updatedHotel) => {
      console.log("Updated Hotel Location:", updatedHotel);
      res.json({
        message: "Hotel location updated successfully",
        hotel: updatedHotel,
      });
    })
    .catch((err) => {
      console.error("Error:", err);
      res.status(500).json({ error: "Error updating hotel location" });
    });
});

router.patch("/updatehotelemail",authMiddleware, (req, res) => {
  const { hotel_id, new_hotel_email } = req.body;

  updateHotelEmail(hotel_id, new_hotel_email)
    .then((updatedHotel) => {
      console.log("Updated Hotel Email:", updatedHotel);
      res.json({
        message: "Hotel email updated successfully",
        hotel: updatedHotel,
      });
    })
    .catch((err) => {
      console.error("Error:", err);
      res.status(500).json({ error: "Error updating hotel email" });
    });
});

router.patch("/updatehotelpassword",authMiddleware, (req, res) => {
  const { hotel_id, new_hotel_password } = req.body;

  updateHotelPassword(hotel_id, new_hotel_password)
    .then((updatedHotel) => {
      console.log("Updated Hotel Password:", updatedHotel);
      res.json({
        message: "Hotel password updated successfully",
        hotel: updatedHotel,
      });
    })
    .catch((err) => {
      console.error("Error:", err);
      res.status(500).json({ error: "Error updating hotel password" });
    });
});

router.delete('/deletehotel',authMiddleware, (req, res) => {
  const { hotel_id } = req.body;

  deleteHotel(hotel_id)
    .then((deletedHotel) => {
      if (deletedHotel) {
        res.json({ message: 'Hotel deleted successfully', hotel: deletedHotel });
      } else {
        res.status(404).json({ message: 'Hotel not found' });
      }
    })
    .catch((err) => {
      console.error('Error:', err);
      res.status(500).json({ error: 'Error deleting hotel' });
    });
});


router.patch('/updatecategoryname',authMiddleware, (req, res) => {
  const {category_id, new_category_name } = req.body;

  updateCategoryName(category_id, new_category_name)
    .then((updatedCategory) => {
      if (updatedCategory) {
        res.json({ message: 'Category name updated successfully', data: updatedCategory });
      } else {
        res.status(404).json({ message: 'Category not found' });
      }
    })
    .catch((err) => {
      console.error('Error:', err);
      res.status(500).json({ error: 'An error occurred while updating the category name' });
    });
});


router.patch('/updatecategoryprice',authMiddleware, (req, res) => {
  const { category_id, new_category_price } = req.body;

  updateCategoryPrice(category_id, new_category_price)
    .then((updatedCategory) => {
      if (updatedCategory) {
        res.json({ message: 'Category price updated successfully', data: updatedCategory });
      } else {
        res.status(404).json({ message: 'Category not found' });
      }
    })
    .catch((err) => {
      console.error('Error:', err);
      res.status(500).json({ error: 'An error occurred while updating the category price' });
    });
});

router.delete('/deletecategory',authMiddleware, (req, res) => {
  const { category_id } = req.body;

  deleteCategory(category_id)
    .then((deletedCategory) => {
      if (deletedCategory) {
        res.json({ message: 'Category deleted successfully', data: deletedCategory });
      } else {
        res.status(404).json({ message: 'Category not found' });
      }
    })
    .catch((err) => {
      console.error('Error:', err);
      res.status(500).json({ error: 'An error occurred while deleting the category' });
    });
});



router.patch('/updateroomnumber',authMiddleware, (req, res) => {
  const { room_id, new_room_number } = req.body;

  updateRoomNumber(room_id, new_room_number)
    .then((updatedRoom) => {
      if (updatedRoom) {
        res.json({ message: 'Room number updated successfully', data: updatedRoom });
      } else {
        res.status(404).json({ message: 'Room not found' });
      }
    })
    .catch((err) => {
      console.error('Error:', err);
      res.status(500).json({ error: 'An error occurred while updating the room number' });
    });
});

router.patch('/updateroomcheckinstate',authMiddleware, (req, res) => {
  const { room_id, new_check_in_state } = req.body;

  updateRoomCheckInState(room_id, new_check_in_state==true? true: false)
    .then((updatedRoom) => {
      if (updatedRoom) {
        res.json({ message: 'Check-in state updated successfully', data: updatedRoom });
      } else {
        res.status(404).json({ message: 'Room not found' });
      }
    })
    .catch((err) => {
      console.error('Error:', err);
      res.status(500).json({ error: 'An error occurred while updating the check-in state' });
    });
});

router.patch('/updateroomcleanstate',authMiddleware, (req, res) => {
  const { room_id, new_clean_state } = req.body;

  updateRoomCleanState(room_id, new_clean_state)
    .then((updatedRoom) => {
      if (updatedRoom) {
        res.json({ message: 'Clean state updated successfully', data: updatedRoom });
      } else {
        res.status(404).json({ message: 'Room not found' });
      }
    })
    .catch((err) => {
      console.error('Error:', err);
      res.status(500).json({ error: 'An error occurred while updating the clean state' });
    });
});

router.delete('/deleteroom',authMiddleware, (req, res) => {
  const { room_id } = req.body;

  deleteRoom(room_id)
    .then((deletedRoom) => {
      if (deletedRoom) {
        res.json({ message: 'Room deleted successfully', data: deletedRoom });
      } else {
        res.status(404).json({ message: 'Room not found' });
      }
    })
    .catch((err) => {
      console.error('Error:', err);
      res.status(500).json({ error: 'An error occurred while deleting the room' });
    });
});

router.get('/gethotels', authMiddleware, (req, res) => {
 getAllHotels()
    .then((hotels) => {
      if (hotels) {
        res.json({ message: 'Hotels fetched successfully', data: hotels });
      } else {
        res.status(200).json({ message: 'No hotels found' });
      }
    })
    .catch((err) => {
      console.error('Error:', err);
      res.status(500).json({ error: 'An error occurred while fetching hostels' });
    });
});

router.post('/logout', (req, res) => {
  // Clear the JWT token from the cookies
  res.clearCookie('admin_token', { httpOnly: true, secure: false });
  return res.status(200).json({ message: 'Logout successful' });
});




module.exports = router; 


