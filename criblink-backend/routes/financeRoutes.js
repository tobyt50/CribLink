const express = require("express");
const router = express.Router();
const { getAllFinances } = require("../controllers/financeController");

router.get("/", getAllFinances);

module.exports = router;
