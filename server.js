// server.js
//
// Entry point for the Expense Tracker app. Responsible for:
//   1. Initializing the SQLite database
//   2. Setting up Express middleware
//   3. Mounting the transactions API under /api
//   4. Serving the static frontend from /public
//   5. Starting the server

const express = require("express");
const path = require("path");

const { initializeDb } = require("./db/db");
const transactionsRouter = require("./routes/transactions");

const PORT = process.env.PORT || 3000;

// Wrapped in an async function because we need to "await"
// the database setup before the server starts accepting requests.
async function startServer() {
    const app = express();

    // Initialize the database and table (creates the file/table
    // if they don't already exist). We store the db connection on
    // app.locals so controllers can access it via req.app.locals.db
    // without needing to reopen a connection on every request.
    const db = await initializeDb();
    app.locals.db = db;

    // Parses incoming JSON request bodies (e.g. POST/PUT payloads)
    // and makes them available as req.body.
    app.use(express.json());

    // All transaction-related endpoints live under /api/transactions
    app.use("/api/transactions", transactionsRouter);

    // Serves any static frontend files (HTML/CSS/JS) placed in
    // the /public folder, e.g. http://localhost:3000/index.html
    app.use(express.static(path.join(__dirname, "public")));

    app.listen(PORT, () => {
        console.log(
            `Expense Tracker server running at http://localhost:${PORT}`,
        );
    });
}

// Start everything up, and log clearly if something goes wrong
// during startup (e.g. database couldn't be created).
startServer().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});
