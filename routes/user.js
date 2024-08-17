const express = require("express");
const app = express();
const user = require("../models/user");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require('bcryptjs');
const faceapi = require("face-api.js");

const { verifyToken } = require("../middlewares/jwtUtils");
const attendance = require("../models/attendance");
const { generateToken } = require("../middlewares/jwtUtils");
const { loadModels, detectFaces } = require("../faceRecognition");

app.use(express.urlencoded({ extended: false }));
// app.use(express.json());

const jwt = require("jsonwebtoken");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Ensure this directory exists
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
// Filter function to accept only specific image types
const fileFilter = (req, file, cb) => {
  // Allowed MIME types for images
  const validTypes = ["image/jpeg", "image/png"];
  if (validTypes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG"), false); // Reject the file
  }
};
const upload = multer({ storage, fileFilter });
const router = express.Router();

//user login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ Status: "Email and password are required" });
  }

  const userInfo = await user.findOne({ email });
  if (!userInfo) {
    return res.status(404).json({ Status: "User not found" });
  }

  // comparing hashed passwrod
 
  const isPasswordValid = await bcrypt.compare(password,userInfo.password);
  if (!isPasswordValid) {
    return res.status(401).json({ Status: "Incorrect password" });
  }

  const token = generateToken(userInfo); // Generate JWT
  return res.status(200).json({
    Status: "Login successful",
    token,
    email: userInfo.email,
    name: userInfo.name, // Ensure 'name' field exists in your schema
    // faceDescriptor: userInfo.faceDescriptor, // Ensure 'faceDescriptor' field exists in your schema
  });
});
// user Register
router.post("/register", upload.single("profileImage"), async (req, res) => {
  const { name, email, password } = req.body;

  // Validate user input
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ Status: "User should enter name, email, and password" });
  }

  try {
    // Check if the email already exists
    const existingUser = await user.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ Status: "Email already exists" });
    }

    // Validate image file upload
    if (!req.file) {
      return res.status(400).json({ Status: "No image uploaded" });
    }

    // Load face detection models
    await loadModels();

    // Perform face detection
    const imgPath = path.join(__dirname, "..", "uploads", req.file.filename);
    const detections = await detectFaces(imgPath);

    // Check if any faces are detected
    if (detections.length > 0) {
      const faceDescriptor = detections[0].descriptor;
  //hash the password
  const saltRounds = 10;
  const hashPassword =  await bcrypt.hash(password,saltRounds)
      // Create and save the new user
      const newUser = await user.create({
        name,
        email,
        password:hashPassword,
        // faceDescriptor
        faceDescriptor: Array.from(faceDescriptor),
      });

      // Clean up the uploaded image file
      fs.unlinkSync(imgPath);

      res.status(201).json({ Status: "User is created" });
    } else {
      res.status(400).json({ Status: "No faces detected" });
    }
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ Status: "Internal server error" });
  }
});
//delete user by id
router.delete("/:email", async (req, res) => {
  const { email } = req.params; // Use req.params to get URL parameters
  if (!email) {
    return res.status(400).json({ Status: "Email is required" });
  }

  try {
    const userToDelete = await user.findOneAndDelete({ email }); // Use findOneAndDelete to delete the user

    if (!userToDelete) {
      return res.status(404).json({ Status: "User is not registered" });
    }

    res.status(200).json({ Status: "User is deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ Status: "Internal server error", Error: error.message }); // Return a 500 error for server issues
  }
});
//delete all users
router.delete("/", async (req, res) => {
  try {
    // Delete all users from the collection
    const result = await user.deleteMany({});

    // Check if any users were deleted
    if (result.deletedCount === 0) {
      return res.status(404).json({ Status: "No users found to delete" });
    }

    res
      .status(200)
      .json({ Status: "All users have been deleted successfully" });
  } catch (error) {
    res.status(500).json({
      Status: "Error occurred while deleting users",
      Error: error.message,
    });
  }
});

//get all users
router.get("/", async (req, res) => {
  const allUser = await user.find({});
  if (allUser.length === 0) {
    return res.status(200).json({ Status: "No user found" });
  }
  return res.status(200).json(allUser);
});
router.get("/attendance", async (req, res) => {
  const userAttendance = await attendance.find({});
  return res.status(200).json(userAttendance);
});
//delete user by email
// Import JWT utility
router.delete("/deleteAll/attendance", async (req, res) => {
  try {
    // Delete all attendance records from the database
    await attendance.deleteMany({});

    // Respond with success status
    return res
      .status(200)
      .json({ Status: "All attendance records have been deleted" });
  } catch (error) {
    console.error("Error deleting attendance records:", error);
    return res.status(500).json({ Status: "Internal server error" });
  }
});

router.post("/attendance/email", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res
      .status(404)
      .json({ Status: "User details required for attendance" });
  }
  try {
    const users = await user.findOne({ email: email });
    const result = await attendance.create({
      name: users.name,
      email: users.email,
      date: new Date(),
    });
    return res.status(202).json({ Status: "Attendance recorded by email" });
  } catch (error) {
    console.error(error);
    return res
      .status(404)
      .json({ Status: "Attendance already marked by email" });
  }
});
//attendance by scanning qr code
router.post("/attendance", async (req, res) => {
  const { token, qrCodeToken } = req.body; // Extract both tokens from request body

  if (!token || !qrCodeToken) {
    return res
      .status(400)
      .json({ Status: "Token and QR code data are required" });
  }

  try {
    // Validate JWT token and process attendance
    const decoded = jwt.verify(token, "012120");

    // Fetch the user from the database
    const users = await user.findOne({ email: decoded.email }); // Example: fetch user by email from JWT

    if (!users) {
      return res.status(404).json({ Status: "User not found" });
    }

    // Mark attendance
    await attendance.create({
      name: users.name,
      email: users.email,
      date: new Date(),
      qrCodeToken: qrCodeToken, // Save QR code token if needed
    });

    return res.status(200).json({ Status: "Attendance marked successfully" });
  } catch (error) {
    console.error("Error marking attendance:", error);
    return res.status(404).json({ Status: "Attendance already marked" });
  }
});

router.post("/faceScan", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }

  try {
    await loadModels();
    const imgPath = path.join(__dirname, "..", "uploads", req.file.filename);
    const detections = await detectFaces(imgPath);

    if (detections.length > 0) {
      const faceDescriptor = detections[0].descriptor;

      // to find the user
      const users = await user.find();
      let recognizedUser = null;
      let minDistance = Infinity;

      for (const user of users) {
        if (user.faceDescriptor.length === faceDescriptor.length) {
          const distance = faceapi.euclideanDistance(
            new Float32Array(user.faceDescriptor),
            faceDescriptor
          );
          // console.log(`Comparing with user: ${user.name}, Distance: ${distance}`);

          if (distance < minDistance) {
            minDistance = distance;
            if (distance < 0.6) {
              recognizedUser = user;
              break;
            }
          }
        }
      }

      if (recognizedUser) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendanceExists = await attendance.findOne({
          email: recognizedUser.email,
          date: { $gte: today },
        });

        if (attendanceExists) {
          return res.status(409).json({ Status: "Attendance already marked" });
        }
        await attendance.create({
          name: recognizedUser.name,
          email: recognizedUser.email,
          date: new Date(),
          // qrCodeToken: qrCodeToken, // Save QR code token if needed
        });

        // res.send(
        //   `Attendance recorded for ${recognizedUser.name}, ${recognizedUser.email}`
        // );
        return res.status(202).json({
          Status: "Attendance marked successfully",
          Details: `Attendance recorded for ${recognizedUser.name}, ${recognizedUser.email}`,
        });
      } else {
        res.send("Attendance failed: Face does not match any registered user");
      }
    } else {
      res.send("No faces detected");
    }

    fs.unlinkSync(imgPath);
  } catch (error) {
    console.error("Error marking attendance:", error);
    return res.status(500).json({ Status: "Internal server error" });
    // console.error("Error marking attendance:", error);
    // return res.status(404).json({ Status: "Attendance already marked" });
  }
});

module.exports = router;
