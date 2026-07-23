// public/js/api.js
//
// Thin wrapper around fetch() for every backend endpoint.
// Keeping all network calls in one module means app.js never
// has to know URLs, HTTP verbs, or response-parsing details —
// it just calls a function and gets data back (or a thrown error).

const BASE_URL = "/api/transactions";

// Small helper: checks the response, parses JSON, and throws
// a readable error if the server responded with a failure status.
async function handleResponse(res) {
    const data = await res.json().catch(() => null);

    if (!res.ok) {
        // Controller sends either { error: "..." } or { errors: [...] }
        const message =
            data?.error ||
            (data?.errors && data.errors.join(" ")) ||
            "Request failed.";
        throw new Error(message);
    }

    return data;
}

// GET /api/transactions?startDate=&endDate=&category=&minAmount=&maxAmount=
// `filters` is a plain object; only defined/non-empty values are sent.
async function getTransactions(filters = {}) {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            params.append(key, value);
        }
    });

    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${BASE_URL}${query}`);
    return handleResponse(res);
}

// POST /api/transactions
async function createTransaction(transaction) {
    const res = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transaction),
    });
    return handleResponse(res);
}

// PUT /api/transactions/:id
async function updateTransaction(id, transaction) {
    const res = await fetch(`${BASE_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transaction),
    });
    return handleResponse(res);
}

// DELETE /api/transactions/:id
async function deleteTransaction(id) {
    const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
    return handleResponse(res);
}

// GET /api/transactions/report/monthly?year=&month=
// year/month are optional — the backend defaults to the current month.
async function getMonthlyReport(year, month) {
    const params = new URLSearchParams();
    if (year) params.append("year", year);
    if (month) params.append("month", month);

    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${BASE_URL}/report/monthly${query}`);
    return handleResponse(res);
}

// Expose everything as a single object so app.js can do:
//   import { api } from './api.js'  → not used here (no bundler),
// instead we attach to `window` since these are plain <script> tags.
window.api = {
    getTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getMonthlyReport,
};
