const express = require('express');
const router = express.Router();
const Admin = require('../models/admin');

//user register
router.post("/register", async (req, res) => {
  const body = req.body;
  if (!body || !body.name || !body.password) {
    return res.status(400).json({ Status: "Name and password is required" });
  }
  const result = await Admin.create({
    name: body.name,

    password: body.password,
  });
  return res.status(201).json({ Status: "Admin is created" });
});

//admin login
router.post("/login", async (req, res) => {
  const body = req.body;
  if (!body || !body.name || !body.password) {
    return res
      .status(400)
      .json({ Status: "Name and password are required for login" });
  }

  // Declare adminUser explicitly
  let adminUser = await Admin.findOne({ name: body.name });

  if (!adminUser) {
    return res.status(404).json({ Status: "Admin not found" });
  }

  if (adminUser.password !== body.password) {
    return res.status(401).json({ Status: "Incorrect password" });
  }

  res.status(200).json({ Status: "Login successful" });
});

module.exports = router;