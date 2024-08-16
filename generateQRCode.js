const QRCode = require("qrcode");
const fs = require("fs");

const attendanceToken = "global-attendance-token"; // Unique token for attendance

const generateQRCode = async () => {
  try {
    // Generate QR code as a data URL
    const qrCodeURL = await QRCode.toDataURL(attendanceToken);

    // Optional: Save the QR code as an image file
    const base64Data = qrCodeURL.replace(/^data:image\/png;base64,/, "");
    fs.writeFileSync("attendanceQRCode.png", base64Data, "base64");

    console.log("QR Code URL:", qrCodeURL); // You can use this URL to display the QR code in your app
  } catch (err) {
    console.error("Error generating QR code:", err);
  }
};

generateQRCode();
