const express = require("express");
const app = express();
const mongoose = require("mongoose");
const PORT = 5000; 
const cors = require("cors");
const userRouter = require("./routes/user");
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
const adminRouter = require("./routes/admin");
mongoose
  .connect(
    "mongodb+srv://adminPanelUser:12345@adminpanel.7dnfoax.mongodb.net/?retryWrites=true&w=majority&appName=adminPanel"
  )
  .then(() => {
    console.log("Database is connected");
  });

//admin routes
app.use("/admin", adminRouter);

//user login
app.use("/user", userRouter);

app.listen(PORT, () => console.log(`Server sarted at port : ${PORT}`));
