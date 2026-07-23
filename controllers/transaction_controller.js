// controllers/transaction_controller.js
//
// Contains all business logic for handling transaction requests:
// creating, reading, updating, deleting, and generating the
// monthly report. Validation rules here mirror the PRD's
// business rules (Section 4) as a first line of defense —
// the database CHECK constraints (db.js) are the final safety net.

const { ALLOWED_CATEGORIES } = require("../db/db");

const ALLOWED_TYPES = ["expense", "income"];

// ---------------------------------------------
// Helper: validates a transaction payload.
// Returns an array of error messages (empty = valid).
// ---------------------------------------------
function validateTransaction(data) {
    const errors = [];
    const { amount, type, category, date } = data;

    if (
        amount === undefined ||
        amount === null ||
        isNaN(amount) ||
        Number(amount) <= 0
    ) {
        errors.push("Amount is required and must be a positive number.");
    }

    if (!type || !ALLOWED_TYPES.includes(type)) {
        errors.push(
            `Type is required and must be one of: ${ALLOWED_TYPES.join(", ")}.`,
        );
    }

    if (!category || !ALLOWED_CATEGORIES.includes(category)) {
        errors.push(
            `Category is required and must be one of: ${ALLOWED_CATEGORIES.join(", ")}.`,
        );
    }

    if (!date || typeof date !== "string" || date.trim() === "") {
        errors.push("Date is required and cannot be blank.");
    }

    return errors;
}

// ---------------------------------------------
// GET /api/transactions
// Returns a list of transactions, optionally filtered by:
//   - startDate, endDate (date range)
//   - category
//   - minAmount, maxAmount
// ---------------------------------------------
async function getAllTransactions(req, res) {
    try {
        const db = req.app.locals.db;
        const { startDate, endDate, category, minAmount, maxAmount } =
            req.query;

        // Build the WHERE clause dynamically based on which
        // filters were actually provided in the query string.
        const conditions = [];
        const params = [];

        if (startDate) {
            conditions.push("date >= ?");
            params.push(startDate);
        }

        if (endDate) {
            conditions.push("date <= ?");
            params.push(endDate);
        }

        if (category) {
            conditions.push("category = ?");
            params.push(category);
        }

        if (minAmount) {
            conditions.push("amount >= ?");
            params.push(Number(minAmount));
        }

        if (maxAmount) {
            conditions.push("amount <= ?");
            params.push(Number(maxAmount));
        }

        const whereClause =
            conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        const transactions = await db.all(
            `SELECT * FROM transactions ${whereClause} ORDER BY date DESC, id DESC`,
            params,
        );

        res.json(transactions);
    } catch (err) {
        console.error("Error fetching transactions:", err);
        res.status(500).json({ error: "Failed to fetch transactions." });
    }
}

// ---------------------------------------------
// GET /api/transactions/:id
// Returns a single transaction by id.
// ---------------------------------------------
async function getTransactionById(req, res) {
    try {
        const db = req.app.locals.db;
        const { id } = req.params;

        const transaction = await db.get(
            "SELECT * FROM transactions WHERE id = ?",
            [id],
        );

        if (!transaction) {
            return res.status(404).json({ error: "Transaction not found." });
        }

        res.json(transaction);
    } catch (err) {
        console.error("Error fetching transaction:", err);
        res.status(500).json({ error: "Failed to fetch transaction." });
    }
}

// ---------------------------------------------
// POST /api/transactions
// Creates a new transaction.
// ---------------------------------------------
async function createTransaction(req, res) {
    try {
        const { amount, type, category, date, note } = req.body;

        const errors = validateTransaction(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        const db = req.app.locals.db;

        const result = await db.run(
            `INSERT INTO transactions (amount, type, category, date, note)
       VALUES (?, ?, ?, ?, ?)`,
            [Number(amount), type, category, date, note || null],
        );

        // result.lastID gives us the auto-generated id of the new row.
        const newTransaction = await db.get(
            "SELECT * FROM transactions WHERE id = ?",
            [result.lastID],
        );

        res.status(201).json(newTransaction);
    } catch (err) {
        console.error("Error creating transaction:", err);
        res.status(500).json({ error: "Failed to create transaction." });
    }
}

// ---------------------------------------------
// PUT /api/transactions/:id
// Updates an existing transaction. Requires all fields
// (amount, type, category, date) to keep the logic simple
// and consistent with the POST validation rules.
// ---------------------------------------------
async function updateTransaction(req, res) {
    try {
        const db = req.app.locals.db;
        const { id } = req.params;
        const { amount, type, category, date, note } = req.body;

        const existing = await db.get(
            "SELECT * FROM transactions WHERE id = ?",
            [id],
        );
        if (!existing) {
            return res.status(404).json({ error: "Transaction not found." });
        }

        const errors = validateTransaction(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        await db.run(
            `UPDATE transactions
       SET amount = ?, type = ?, category = ?, date = ?, note = ?
       WHERE id = ?`,
            [Number(amount), type, category, date, note || null, id],
        );

        const updatedTransaction = await db.get(
            "SELECT * FROM transactions WHERE id = ?",
            [id],
        );

        res.json(updatedTransaction);
    } catch (err) {
        console.error("Error updating transaction:", err);
        res.status(500).json({ error: "Failed to update transaction." });
    }
}

// ---------------------------------------------
// DELETE /api/transactions/:id
// Permanently deletes a transaction.
// ---------------------------------------------
async function deleteTransaction(req, res) {
    try {
        const db = req.app.locals.db;
        const { id } = req.params;

        const existing = await db.get(
            "SELECT * FROM transactions WHERE id = ?",
            [id],
        );
        if (!existing) {
            return res.status(404).json({ error: "Transaction not found." });
        }

        await db.run("DELETE FROM transactions WHERE id = ?", [id]);

        res.json({ message: "Transaction deleted successfully." });
    } catch (err) {
        console.error("Error deleting transaction:", err);
        res.status(500).json({ error: "Failed to delete transaction." });
    }
}

// ---------------------------------------------
// GET /api/transactions/report/monthly
// Returns a summary for a given month:
//   - total expenses
//   - total income
//   - net balance (income - expenses)
//   - expenses broken down by category
//
// Defaults to the current month if no year/month query
// params are provided (e.g. ?year=2026&month=7).
// ---------------------------------------------
async function getMonthlyReport(req, res) {
    try {
        const db = req.app.locals.db;
        const now = new Date();

        const year = req.query.year || now.getFullYear();
        const month = req.query.month
            ? String(req.query.month).padStart(2, "0")
            : String(now.getMonth() + 1).padStart(2, "0");

        const yearMonth = `${year}-${month}`; // e.g. "2026-07"

        // strftime('%Y-%m', date) extracts the year-month portion
        // of each stored date so we can match it against yearMonth.
        const expenseTotalRow = await db.get(
            `SELECT COALESCE(SUM(amount), 0) AS total
       FROM transactions
       WHERE type = 'expense' AND strftime('%Y-%m', date) = ?`,
            [yearMonth],
        );

        const incomeTotalRow = await db.get(
            `SELECT COALESCE(SUM(amount), 0) AS total
       FROM transactions
       WHERE type = 'income' AND strftime('%Y-%m', date) = ?`,
            [yearMonth],
        );

        const categoryBreakdown = await db.all(
            `SELECT category, SUM(amount) AS total
       FROM transactions
       WHERE type = 'expense' AND strftime('%Y-%m', date) = ?
       GROUP BY category
       ORDER BY total DESC`,
            [yearMonth],
        );

        res.json({
            month: yearMonth,
            totalExpenses: expenseTotalRow.total,
            totalIncome: incomeTotalRow.total,
            netBalance: incomeTotalRow.total - expenseTotalRow.total,
            expensesByCategory: categoryBreakdown,
        });
    } catch (err) {
        console.error("Error generating monthly report:", err);
        res.status(500).json({ error: "Failed to generate monthly report." });
    }
}

module.exports = {
    getAllTransactions,
    getTransactionById,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getMonthlyReport,
};
