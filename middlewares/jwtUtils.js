const jwt = require("jsonwebtoken");
const secret = "012120"; // Use a strong key in production

// Generate a JWT
const generateToken = (user) => {
  return jwt.sign({ id: user._id, email: user.email }, secret, {
    expiresIn: "1h",
  });
};

// Verify a JWT
const verifyToken = (token) => {
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    return null;
  }
};

module.exports = { generateToken, verifyToken };
