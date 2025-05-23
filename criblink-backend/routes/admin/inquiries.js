// routes/admin/inquiries.js
const express = require('express');
const router = express.Router();
const {
  getAllInquiries,
  assignInquiry,
  resolveInquiry,
} = require('../../controllers/inquiriesController');

// Already mounted at /admin/inquiries — so no need to prefix it again
router.get('/', getAllInquiries);
router.put('/:id/assign', assignInquiry);
router.put('/:id/resolve', resolveInquiry);

module.exports = router;
