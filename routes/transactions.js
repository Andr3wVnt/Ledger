// routes/transactions.js
//
// Defines the API endpoints for transactions and wires each
// one to its corresponding controller function. Keeping routes
// separate from controllers means this file only deals with
// "which URL maps to which function" — no business logic here.

const express = require("express");
const router = express.Router();

const {
    getAllTransactions,
    getTransactionById,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getMonthlyReport,
} = require("../controllers/transaction_controller");

// IMPORTANT: the monthly report route must be declared BEFORE
// the "/:id" route below. Otherwise Express would treat
// "report" as if it were an :id value and never reach this route.
router.get("/report/monthly", getMonthlyReport);

// GET /api/transactions
// Supports optional filtering via query params:
// ?startDate=&endDate=&category=&minAmount=&maxAmount=
router.get("/", getAllTransactions);

// GET /api/transactions/:id
router.get("/:id", getTransactionById);

// POST /api/transactions
router.post("/", createTransaction);

// PUT /api/transactions/:id
router.put("/:id", updateTransaction);

// DELETE /api/transactions/:id
router.delete("/:id", deleteTransaction);

module.exports = router;
