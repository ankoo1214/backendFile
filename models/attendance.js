const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  name: {
    type: String,
    
  },
  email: {
    type: String,
    lowercase: true,
    required: true,
    unique:true
  },  
  date: {   
    type: Date,
    default: ()=>Date().toLocalDateString()
  },
  // time:{
  //   type: Date,
  //   default: Date.now
  // }
});

const Attendance = mongoose.model("Attendance", attendanceSchema);

module.exports = Attendance;
