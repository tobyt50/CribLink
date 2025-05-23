const express = require('express');
const router = express.Router();
const { getAllDocs } = require('../controllers/documentController');

router.get('/', getAllDocs);

module.exports = router;