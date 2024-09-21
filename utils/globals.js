const bcrypt = require('bcrypt');

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
  

module.exports ={
    encryptPassword,
    checkPassword
}