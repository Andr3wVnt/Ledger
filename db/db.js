// db/db.js
//
// Handles the SQLite connection and one-time table setup.
// Uses the "sqlite" wrapper package so we can use async/await
// instead of sqlite3's native callback style.

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

// Path to the database file. It will be created automatically
// the first time the app runs if it doesn't already exist.
const DB_PATH = path.join(__dirname, "..", "data", "expenses.db");

// Fixed category list from the PRD (Section 3.2).
// Exported so routes/controllers can reuse the same list
// for validation instead of duplicating it.
const ALLOWED_CATEGORIES = [
    "Food",
    "Rent",
    "Transport",
    "Utilities",
    "Entertainment",
    "Salary",
    "Other",
];

// Opens (or creates) the SQLite database connection.
// Returns a promise that resolves to the db instance.
async function openDb() {
    const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database,
    });

    // Enforce foreign key / constraint checks (off by default in SQLite).
    await db.exec("PRAGMA foreign_keys = ON;");

    return db;
}

// Creates the transactions table if it doesn't already exist,
// with validation constraints matching the PRD's business rules:
//   - amount must be a positive number
//   - type must be either 'expense' or 'income'
//   - category must be one of the fixed predefined values
//   - date is required (cannot be null/blank)
//   - note is optional
async function initializeDb() {
    const db = await openDb();

    // Build a SQL-safe CHECK clause from ALLOWED_CATEGORIES,
    // e.g. category IN ('Food','Rent','Transport',...)
    const categoryList = ALLOWED_CATEGORIES.map((cat) => `'${cat}'`).join(", ");

    await db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      -- Must be greater than 0 (positive amount rule from PRD)
      amount REAL NOT NULL CHECK (amount > 0),

      -- Only 'expense' or 'income' allowed
      type TEXT NOT NULL CHECK (type IN ('expense', 'income')),

      -- Must match one of the fixed predefined categories
      category TEXT NOT NULL CHECK (category IN (${categoryList})),

      -- Date is required; stored as ISO string (e.g. '2026-07-23')
      date TEXT NOT NULL CHECK (date <> ''),

      -- Optional free-text note
      note TEXT,

      -- Auto-set timestamp for when the record was created
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

    console.log('Database initialized and "transactions" table is ready.');

    return db;
}

module.exports = {
    openDb,
    initializeDb,
    ALLOWED_CATEGORIES,
};
