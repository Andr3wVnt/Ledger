// public/js/app.js
//
// Core application logic: renders the summary cards and table,
// handles the add/edit form, filters, and the edit/delete actions
// on each row. Relies on window.api from api.js (loaded first).

// Must match the fixed category list enforced in db.js —
// kept here as a single source of truth for the frontend dropdowns.
const CATEGORIES = [
    "Food",
    "Rent",
    "Transport",
    "Utilities",
    "Entertainment",
    "Salary",
    "Other",
];

// Tracks whether the form is in "add" or "edit" mode.
// null = adding a new transaction; a number = editing that transaction's id.
let editingId = null;

// ---- Element references (grabbed once on load) ----
const form = document.getElementById("tx-form");
const formTitle = document.getElementById("form-title");
const cancelEditBtn = document.getElementById("cancel-edit");
const tableBody = document.getElementById("tx-table-body");

const filterCategory = document.getElementById("filter-category");
const filterStartDate = document.getElementById("filter-start-date");
const filterEndDate = document.getElementById("filter-end-date");
const filterMinAmount = document.getElementById("filter-min-amount");
const filterMaxAmount = document.getElementById("filter-max-amount");
const filterClearBtn = document.getElementById("filter-clear");

const summarySpent = document.getElementById("summary-spent");
const summaryIncome = document.getElementById("summary-income");
const summaryBalance = document.getElementById("summary-balance");

// ---------------------------------------------
// Populates every <select> that needs the fixed
// category list (the add/edit form and the filter bar).
// ---------------------------------------------
function populateCategoryDropdowns() {
    const selects = document.querySelectorAll(".category-select");

    selects.forEach((select) => {
        CATEGORIES.forEach((category) => {
            const option = document.createElement("option");
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });
    });
}

// ---------------------------------------------
// Reads the current filter bar values into a plain object
// shaped the way api.getTransactions() expects.
// ---------------------------------------------
function getActiveFilters() {
    const startDate = filterStartDate.value.trim();
    const endDate = filterEndDate.value.trim();

    return {
        category: filterCategory.value,
        startDate: startDate ? parseDisplayDate(startDate) : "",
        endDate: endDate ? parseDisplayDate(endDate) : "",
        minAmount: filterMinAmount.value,
        maxAmount: filterMaxAmount.value,
    };
}

// ---------------------------------------------
// Renders the three summary cards from a report object:
// { totalExpenses, totalIncome, netBalance, ... }
// ---------------------------------------------
function renderSummary(report) {
    summarySpent.textContent = formatCurrency(report.totalExpenses);
    summaryIncome.textContent = formatCurrency(report.totalIncome);
    summaryBalance.textContent = formatCurrency(report.netBalance);
}

// Formats a number as a currency-style string, e.g. 1234.5 -> "1,234.50"
function formatCurrency(value) {
    return Number(value).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

// Converts "DD/MM/YYYY" (what the user types) into "YYYY-MM-DD"
// (what the database and API expect). Returns null if the input
// doesn't match the expected pattern.
function parseDisplayDate(displayDate) {
    const match = displayDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;

    const [, day, month, year] = match;
    const d = Number(day),
        m = Number(month),
        y = Number(year);

    if (m < 1 || m > 12 || d < 1 || d > 31) return null;

    const isoCandidate = `${year}-${month}-${day}`;
    const parsed = new Date(isoCandidate);
    const isValid = parsed.toISOString().slice(0, 10) === isoCandidate;

    return isValid ? isoCandidate : null;
}

// Converts stored "YYYY-MM-DD" into "DD/MM/YYYY" for display —
// used both in the table and when populating the form for editing.
function formatDate(isoDate) {
    const [year, month, day] = isoDate.split("-");
    return `${day}/${month}/${year}`;
}

// ---------------------------------------------
// Renders the transaction table body from an array of transactions.
// Uses event delegation (see setupTableEvents) rather than attaching
// a listener per row, so it stays simple as rows are added/removed.
// ---------------------------------------------
function renderTable(transactions) {
    tableBody.innerHTML = "";

    if (transactions.length === 0) {
        tableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="6">No transactions match the current filters.</td>
      </tr>
    `;
        return;
    }

    transactions.forEach((tx) => {
        const row = document.createElement("tr");
        row.dataset.id = tx.id;

        const sign = tx.type === "expense" ? "-" : "+";
        const amountClass = tx.type === "expense" ? "expense" : "income";

        row.innerHTML = `
      <td>${formatDate(tx.date)}</td>
      <td><span class="type-tag ${tx.type}">${tx.type}</span></td>
      <td>${tx.category}</td>
      <td class="amount-col ${amountClass}">${sign}${formatCurrency(tx.amount)}</td>
      <td>${tx.note ? escapeHtml(tx.note) : '<span style="color:var(--ink-soft)">—</span>'}</td>
      <td>
        <button class="btn-edit" data-action="edit" data-id="${tx.id}">Edit</button>
        <button class="btn-delete" data-action="delete" data-id="${tx.id}">Delete</button>
      </td>
    `;

        tableBody.appendChild(row);
    });
}

// Basic HTML-escaping for the free-text note field, so a note
// containing "<" or ">" can't break the table markup.
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// ---------------------------------------------
// Loads transactions (respecting current filters) and re-renders the table.
// ---------------------------------------------
async function refreshTable() {
    try {
        const transactions =
            await window.api.getTransactions(getActiveFilters());
        renderTable(transactions);
    } catch (err) {
        alert(`Could not load transactions: ${err.message}`);
    }
}

// ---------------------------------------------
// Loads the current month's report and re-renders the summary cards.
// Note: the summary always reflects the current month, independent
// of whatever filters are applied to the table below it.
// ---------------------------------------------
async function refreshSummary() {
    try {
        const report = await window.api.getMonthlyReport();
        renderSummary(report);
    } catch (err) {
        alert(`Could not load monthly summary: ${err.message}`);
    }
}

// ---------------------------------------------
// Puts the form into "edit" mode for a given transaction:
// fills in its current values and switches the button/title text.
// ---------------------------------------------
async function enterEditMode(id) {
    try {
        // We already have the row's data in the DOM, but re-fetching
        // via the API keeps this reliable even if the table were
        // ever paginated or filtered differently in the future.
        const transactions = await window.api.getTransactions();
        const tx = transactions.find((t) => String(t.id) === String(id));
        if (!tx) return;

        form.amount.value = tx.amount;
        form.type.value = tx.type;
        form.category.value = tx.category;
        form.date.value = formatDate(tx.date);
        form.note.value = tx.note || "";

        editingId = id;
        formTitle.textContent = "Edit Transaction";
        form.querySelector(".btn-primary").textContent = "Update Transaction";
        cancelEditBtn.hidden = false;

        form.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
        alert(`Could not load transaction for editing: ${err.message}`);
    }
}

// Resets the form back to "add new transaction" mode.
function exitEditMode() {
    editingId = null;
    form.reset();
    formTitle.textContent = "Add Transaction";
    form.querySelector(".btn-primary").textContent = "Add Transaction";
    cancelEditBtn.hidden = true;
}

// ---------------------------------------------
// Handles Edit/Delete button clicks using event delegation:
// one listener on the table body instead of one per button.
// ---------------------------------------------
function setupTableEvents() {
    tableBody.addEventListener("click", async (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;

        const { action, id } = button.dataset;

        if (action === "edit") {
            enterEditMode(id);
        }

        if (action === "delete") {
            const confirmed = confirm(
                "Delete this transaction? This cannot be undone.",
            );
            if (!confirmed) return;

            try {
                await window.api.deleteTransaction(id);
                await refreshTable();
                await refreshSummary();

                // If the user was editing the row they just deleted, reset the form.
                if (String(editingId) === String(id)) {
                    exitEditMode();
                }
            } catch (err) {
                alert(`Could not delete transaction: ${err.message}`);
            }
        }
    });
}

// ---------------------------------------------
// Handles the add/edit form submission.
// ---------------------------------------------
function setupFormEvents() {
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const payload = {
            amount: form.amount.value,
            type: form.type.value,
            category: form.category.value,
            date: parseDisplayDate(form.date.value), // convert before sending
            note: form.note.value.trim(),
        };

        if (!payload.date) {
            alert("Please enter a valid date as DD/MM/YYYY.");
            return;
        }

        try {
            if (editingId) {
                await window.api.updateTransaction(editingId, payload);
            } else {
                await window.api.createTransaction(payload);
            }

            exitEditMode();
            await refreshTable();
            await refreshSummary();
        } catch (err) {
            alert(`Could not save transaction: ${err.message}`);
        }
    });

    cancelEditBtn.addEventListener("click", () => {
        exitEditMode();
    });
}

// ---------------------------------------------
// Wires up the filter bar: any change re-fetches the table
// with the current filter values applied.
// ---------------------------------------------
function setupFilterEvents() {
    [
        filterCategory,
        filterStartDate,
        filterEndDate,
        filterMinAmount,
        filterMaxAmount,
    ].forEach((el) => el.addEventListener("change", refreshTable));

    filterClearBtn.addEventListener("click", () => {
        filterCategory.value = "";
        filterStartDate.value = "";
        filterEndDate.value = "";
        filterMinAmount.value = "";
        filterMaxAmount.value = "";
        refreshTable();
    });
}

// ---------------------------------------------
// App entry point: runs once the DOM is ready.
// ---------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    populateCategoryDropdowns();
    setupFormEvents();
    setupFilterEvents();
    setupTableEvents();

    refreshTable();
    refreshSummary();
});
