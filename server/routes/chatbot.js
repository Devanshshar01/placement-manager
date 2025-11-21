const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const auth = require('../middleware/auth');

router.post('/query', auth, chatbotController.chat);

module.exports = router;
