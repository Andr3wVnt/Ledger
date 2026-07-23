**Ledger — Personal Expense Tracker**  
A simple, single-user web app for tracking personal expenses and income, with monthly totals broken down by category. Built as a learning project to practice a full Node.js/Express/SQLite stack from schema to UI.  
**Features**  
- Add, edit, and delete transactions (expenses or income)  
- Fixed category list: Food, Rent, Transport, Utilities, Entertainment, Salary, Other  
- Filter transactions by category, date range, or amount  
- Monthly summary: total spent, total income, and net balance  
- Input validation both in the API and at the database level  
**Tech Stack**  
- **Backend:** Node.js, Express  
- **Database:** SQLite (via the sqlite + sqlite3 packages, using async/await)  
- **Frontend:** Vanilla HTML, CSS, and JavaScript (no framework, no build step)  
**Project Structure**  
.  
 ├── controllers/  
 │   └── transaction_controller.js   # CRUD logic + monthly report calculation  
 ├── data/  
 │   └── expenses.db                 # SQLite database file (auto-created)  
 ├── db/  
 │   └── db.js                       # DB connection + table initialization  
 ├── public/                         # Static frontend  
 │   ├── css/  
 │   │   └── style.css  
 │   ├── js/  
 │   │   ├── api.js                  # fetch() wrappers for the API  
 │   │   └── app.js                  # DOM rendering + event handling  
 │   └── index.html  
 ├── routes/  
 │   └── transactions.js             # Express route definitions  
 ├── server.js                       # App entry point  
 └── package.json  
   
**Getting Started**  
**Prerequisites**  
- [Node.js (v18 or later recommended)](https://nodejs.org/ "https://nodejs.org/")  
**Installation**  
# Clone the repository  
 git clone <your-repo-url>  
 cd Finance  
   
 # Install dependencies  
 npm install  
   
**Running the app**  
node server.js  
   
The server starts on **http://localhost:3000** by default (configurable via the PORT environment variable). The SQLite database and transactions table are created automatically on first run.  
Open http://localhost:3000 in your browser to use the app.  
**API Reference**  
Base URL: /api/transactions  
| | | |  
|-|-|-|  
| **Method** | **Endpoint** | **Description** |   
| GET | / | List transactions. Supports query params: startDate, endDate, category, minAmount, maxAmount |   
| GET | /:id | Get a single transaction by ID |   
| POST | / | Create a new transaction |   
| PUT | /:id | Update an existing transaction |   
| DELETE | /:id | Delete a transaction |   
| GET | /report/monthly | Monthly summary (totals + category breakdown). Optional year and month query params; defaults to the current month |   
   
**Transaction object**  
{  
   "amount": 42.50,  
   "type": "expense",  
   "category": "Food",  
   "date": "2026-07-23",  
   "note": "Groceries at market"  
 }  
   
**Validation rules:**  
- amount must be a positive number  
- type must be expense or income  
- category must be one of the fixed predefined values  
- date is required  
**Roadmap**  
Out of scope for v1, flagged for possible future work:  
- Recurring transactions  
- Visual reporting (charts/graphs)  
- Budget limits with alerts  
- Data export/import  
**License**  
Personal learning project — no license specified.  
