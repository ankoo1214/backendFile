const faceapi = require('face-api.js');
const canvas = require('canvas');
const path = require('path');
const fs = require('fs');

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const MODEL_URL = path.join(__dirname, 'models');

async function loadModels() {
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_URL); 
    await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_URL);
} 

async function detectFaces(imagePath) {
    const img = await canvas.loadImage(imagePath);
    const detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors();
    return detections;
}

module.exports = { loadModels, detectFaces };
