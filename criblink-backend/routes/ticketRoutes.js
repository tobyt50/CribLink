const express = require('express');
const router = express.Router();
const { getAllTickets } = require('../controllers/ticketController');

router.get('/', getAllTickets);

module.exports = router;
