const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { spawn } = require('child_process'); // RESTORED: To boot local Python
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Local CORS
app.use(express.json());
app.use(cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true
}));

const upload = multer({ dest: 'uploads/' });

if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Successfully connected to local MongoDB.'))
    .catch(err => console.error('MongoDB database initialization failure:', err));

// Database Schemas
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String, required: true },
    passwordHash: { type: String, required: false },
    googleId: { type: String, required: false, unique: true, sparse: true },
    profilePic: { type: String, required: false }
});

const PatientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

const ScanSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    prediction: { type: String, required: true },
    confidence: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Patient = mongoose.model('Patient', PatientSchema);
const Scan = mongoose.model('Scan', ScanSchema);

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access token authorization missing.' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decodedUser) => {
        if (err) return res.status(403).json({ error: 'Session token invalid or expired.' });
        req.user = decodedUser;
        next();
    });
};

// -----------------------------------------------------------------------------
// AUTHENTICATION ENDPOINTS
// -----------------------------------------------------------------------------
app.post('/api/auth/register', async (req, res) => {
    const { email, name, password } = req.body;
    if (!email || !name || !password) return res.status(400).json({ error: 'All fields required.' });
    try {
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) return res.status(400).json({ error: 'Account already exists.' });
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password, salt);
        const newUser = new User({ email, name, passwordHash: hashed });
        await newUser.save();
        const token = jwt.sign({ id: newUser._id, name: newUser.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: newUser._id, name: newUser.name, email: newUser.email } });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password = "" } = req.body;
    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || !user.passwordHash) return res.status(401).json({ error: 'Invalid credentials.' });
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials.' });
        const token = jwt.sign({ id: user._id, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user._id, name: user.name, email: user.email, profilePic: user.profilePic } });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/google', async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Google ticket payload missing.' });

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const { sub: gId, email, name, picture } = payload;

        let user = await User.findOne({ googleId: gId });
        if (!user) {
            user = await User.findOne({ email: email.toLowerCase() });
            if (user) {
                user.googleId = gId;
                if (picture) user.profilePic = picture;
            } else {
                user = new User({ googleId: gId, name, email, profilePic: picture });
            }
            await user.save();
        }

        const jwtToken = jwt.sign({ id: user._id, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token: jwtToken, user: { id: user._id, name: user.name, email: user.email, profilePic: user.profilePic } });
    } catch (err) {
        console.error("Internal Google Verification failure details:", err.message);
        res.status(401).json({ error: 'Google authentication verification failure.' });
    }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-passwordHash');
        res.json({ authenticated: true, user: { id: user._id, name: user.name, email: user.email, profilePic: user.profilePic } });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// -----------------------------------------------------------------------------
// IMAGE PROCESSING (LOCAL PYTHON SIDECAR)
// -----------------------------------------------------------------------------
app.post('/api/predict', authenticateToken, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No image file uploaded.' });
    const { patient_name } = req.body;
    if (!patient_name || !patient_name.trim()) return res.status(400).json({ error: 'Patient name required.' });

    const localImagePath = req.file.path;
    const absoluteImagePath = path.resolve(localImagePath);

    try {
        let patient = await Patient.findOne({ name: patient_name.trim(), doctorId: req.user.id });
        if (!patient) {
            patient = new Patient({ name: patient_name.trim(), doctorId: req.user.id });
            await patient.save();
        }

        // RESTORED: Calling your local python script at Port 5001
        const response = await fetch('http://localhost:5001/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_path: absoluteImagePath })
        });

        if (fs.existsSync(localImagePath)) fs.unlinkSync(localImagePath); 

        const parsedResult = await response.json();
        if (!response.ok) return res.status(500).json({ error: parsedResult.error || 'Prediction sidecar server failure.' });

        const newScan = new Scan({
            patientId: patient._id,
            prediction: parsedResult.prediction,
            confidence: parsedResult.confidence
        });
        await newScan.save();

        res.json({
            id: newScan._id,
            patient: patient.name,
            prediction: newScan.prediction,
            confidence: newScan.confidence,
            timestamp: newScan.timestamp.toISOString()
        });

    } catch (err) {
        if (fs.existsSync(localImagePath)) fs.unlinkSync(localImagePath);
        console.error("Prediction Error:", err);
        res.status(500).json({ error: 'Could not communicate with the local Python ML server. Is it running?' });
    }
});

app.get('/api/history', authenticateToken, async (req, res) => {
    try {
        const matchingPatients = await Patient.find({ doctorId: req.user.id });
        const patientIds = matchingPatients.map(p => p._id);
        const databaseScans = await Scan.find({ patientId: { $in: patientIds } }).populate('patientId', 'name').sort({ timestamp: -1 });
        
        res.json(databaseScans.map(scan => ({
            id: scan._id, patient: scan.patientId.name, prediction: scan.prediction, confidence: scan.confidence, timestamp: scan.timestamp.toISOString()
        })));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/history/:id', authenticateToken, async (req, res) => {
    try {
        const scan = await Scan.findById(req.params.id).populate('patientId');
        if (!scan) return res.status(404).json({ error: 'Target clinical record not found.' });
        if (scan.patientId.doctorId.toString() !== req.user.id) return res.status(403).json({ error: 'Unauthorized access.' });
        await Scan.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/history', authenticateToken, async (req, res) => {
    try {
        const patients = await Patient.find({ doctorId: req.user.id });
        const patientIds = patients.map(p => p._id);
        await Scan.deleteMany({ patientId: { $in: patientIds } });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// -----------------------------------------------------------------------------
// ENGINE INITIALIZATION & AUTOMATIC PYTHONSIDECAR INVOCATION
// -----------------------------------------------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Node.js Active full-stack API server serving on port ${PORT}`);
    
    // RESTORED: Booting up the local Python script using your specific path
    const pythonPath = "C:\\Users\\dkg21\\AppData\\Local\\Programs\\Python\\Python311\\python.exe";
    const scriptPath = path.join(__dirname, 'predict_server.py');
    
    console.log(`[System Link] Launching background ML service via Python 3.11...`);
    const pythonProcess = spawn(pythonPath, [scriptPath]);
    
    pythonProcess.stdout.on('data', (data) => {
        console.log(`\x1b[36m%s\x1b[0m`, `[Python Sidecar]: ${data.toString().trim()}`);
    });
    
    pythonProcess.stderr.on('data', (data) => {
        const message = data.toString().trim();
        if (!message.includes('WARNING') && !message.includes('UserWarning')) {
            console.error(`\x1b[31m%s\x1b[0m`, `[Python Log/Stderr]: ${message}`);
        }
    });

    process.on('SIGINT', () => {
        console.log('\nShutting down full-stack processes cleanly...');
        pythonProcess.kill();
        process.exit();
    });
});