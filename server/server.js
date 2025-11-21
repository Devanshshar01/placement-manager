const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Load environment variables
dotenv.config();

const app = express();

// Security Middleware
app.use(helmet()); // Set security HTTP headers
app.use(cors({
    origin: 'http://localhost:8000', // Allow only frontend origin
    credentials: true // Allow cookies
}));

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '100kb' })); // Limit body size
app.use(cookieParser());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

// Development logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Limit requests to API
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/student', require('./routes/student'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/company', require('./routes/company'));
app.use('/api/drive', require('./routes/drive'));
app.use('/api/application', require('./routes/application'));
app.use('/api/notification', require('./routes/notification'));
app.use('/api/chatbot', require('./routes/chatbot'));

// Global Error Handler
app.use(errorHandler);

// Serve static files from client directory
const path = require('path');
app.use(express.static(path.join(__dirname, '../client')));

// Handle SPA routing (optional, but good for safety)
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ msg: 'API endpoint not found' });
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
