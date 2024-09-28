const bcrypt = require('bcrypt');

const businessName = "BOMAPMS"
async function encryptPassword(plainPassword) {
  const saltRounds = 10; // Higher value means more secure but slower hashing
  try {
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    console.log("Encrypted password:", hashedPassword);
    return hashedPassword;
  } catch (err) {
    console.error("Error encrypting password:", err.message);
  }
}

async function checkPassword(plainPassword, hashedPassword) {
    try {
      const match = await bcrypt.compare(plainPassword, hashedPassword);
    
      if (match) {
        console.log("Password is correct!");
        return true;
      } else {
        console.log("Incorrect password.");
        return false;
      }
    } catch (err) {
      console.error("Error comparing passwords:", err.message);
      return false;
    }
  }

  function getDateMonthsBack(monthsBack) {
    const today = new Date();
    today.setMonth(today.getMonth() - monthsBack);
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-based, so add 1
    const day = String(today.getDate()).padStart(2, '0');
  
    return `${year}-${month}-${day}`;
  }

  function getDateMonthsAhead(monthsAhead) {
    const today = new Date();
    today.setMonth(today.getMonth() + monthsAhead);
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); 
    const day = String(today.getDate()).padStart(2, '0');
  
    return `${year}-${month}-${day}`;
  }

module.exports ={
    encryptPassword,
    checkPassword,
    businessName,
    getDateMonthsBack,
    getDateMonthsAhead
}