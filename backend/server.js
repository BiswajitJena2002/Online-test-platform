const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const testController = require('./controllers/testController');

const app = express();
const PORT = process.env.PORT || 5000;

// Multer Setup for Image Uploads
// Cloudinary Setup
require('dotenv').config();
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path'); // Keep path for static serving if ensuring backward compat, though not needed for new uploads
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// MongoDB Connection
// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test-platform';

// Create a masked URI for logging (hides password)
const maskedURI = MONGODB_URI.replace(/:([^:@]+)@/, ':****@');
console.log(`Attempting to connect to MongoDB at: ${maskedURI}`);

mongoose.connect(MONGODB_URI, {
    family: 4, // Force IPv4 - often fixes Render/Atlas connection issues
    serverSelectionTimeoutMS: 5000 // Fail faster if not connected
})
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch(err => {
        console.error('❌ MongoDB connection error details:', err);
    });

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'online-test-platform', // Folder name in Cloudinary
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    },
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(bodyParser.json());
// Serve static files (optional, for backward compatibility with old local images)
app.use('/public', express.static(path.join(__dirname, 'public')));

// File Upload Endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    // Return the secure Cloudinary URL
    res.json({ url: req.file.path });
});

app.get('/', (req, res) => {
    res.send('Online Test API is running');
});

// API Routes
// New test-based routes
app.post('/api/test/create', testController.createTest);
app.get('/api/test/:testId/info', testController.getTestInfo);
app.post('/api/test/:testId/start', testController.startTestSession);

// Saved tests routes
app.post('/api/test/save', testController.saveTest);
app.get('/api/tests/saved', testController.getSavedTests);
app.get('/api/tests/saved/:id', testController.getSavedTest);

// Legacy routes (backward compatibility)
app.post('/api/questions', testController.uploadQuestions);
app.post('/api/config', testController.setConfig);
app.post('/api/start', testController.startTest);
app.post('/api/submit-answer', testController.submitAnswer);
app.post('/api/end', testController.endTest);
app.get('/api/result/:sessionId', testController.getResult);
app.get('/api/info', testController.getInfo);
app.get('/api/ip', (req, res) => {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    let ipAddress = 'localhost';

    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal (i.e. 127.0.0.1) and non-ipv4 addresses
            if ('IPv4' !== iface.family || iface.internal) {
                continue;
            }
            // Prefer 192.x or 10.x or 172.x addresses (common local networks)
            // But usually the first external IPv4 is good enough
            ipAddress = iface.address;
            break;
        }
        if (ipAddress !== 'localhost') break;
    }

    res.json({ ip: ipAddress });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

