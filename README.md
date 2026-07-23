<div align="center">  
   
# Ledger  
   
**A simple, single-user expense & income tracker.**  
   
![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)  
![Express](https://img.shields.io/badge/Express-backend-black?logo=express&logoColor=white)  
![SQLite](https://img.shields.io/badge/SQLite-database-003B57?logo=sqlite&logoColor=white)  
   
</div>  
   
Ledger tracks personal expenses and income, with monthly totals broken down by category. Built as a learning project to practice a full stack — schema, API, and UI — from scratch.  
   
## Contents  
   
- [Features](#features)  
- [Tech Stack](#tech-stack)  
- [Getting Started](#getting-started)  
- [Project Structure](#project-structure)  
- [API Reference](#api-reference)  
- [Roadmap](#roadmap)  
- [License](#license)  
   
## Features  
   
- Add, edit, and delete transactions (expenses or income)  
- Fixed category list — `Food`, `Rent`, `Transport`, `Utilities`, `Entertainment`, `Salary`, `Other`  
- Filter transactions by category, date range, or amount  
- Monthly summary: total spent, total income, and net balance  
- Input validation in both the API layer and the database schema  
   
## Tech Stack  
   
| Layer | Technology |  
|---|---|  
| Backend | Node.js + Express |  
| Database | SQLite (`sqlite` + `sqlite3`, async/await) |  
| Frontend | Vanilla HTML, CSS, JavaScript — no framework, no build step |  
   
## Getting Started  
   
**Prerequisite:** [Node.js](https://nodejs.org/) v18 or later.  
   
**1. Clone the repository**  
   
```bash  
git clone <your-repo-url>  
cd Finance  
```  
   
**2. Install dependencies**  
   
```bash  
npm install  
```  
   
**3. Start the server**  
   
```bash  
node server.js  
```  
   
The app runs at **http://localhost:3000** (override with the `PORT` environment variable). The SQLite database and `transactions` table are created automatically on first run — open the URL above in your browser to start using it.  
   
## Project Structure  
   
```  
.  
├── controllers/  
│   └── transaction_controller.js   → CRUD logic + monthly report calculation  
├── data/  
│   └── expenses.db                 → SQLite database file (auto-created)  
├── db/  
│   └── db.js                       → DB connection + table initialization  
├── public/                         → Static frontend  
│   ├── css/style.css  
│   ├── js/api.js                   → fetch() wrappers for the API  
│   ├── js/app.js                   → DOM rendering + event handling  
│   └── index.html  
├── routes/  
│   └── transactions.js             → Express route definitions  
└── server.js                       → App entry point  
```  
   
## API Reference  
   
Base URL: `/api/transactions`  
   
**`GET /`**  
List transactions. Optional query params: `startDate`, `endDate`, `category`, `minAmount`, `maxAmount`.  
   
**`GET /:id`**  
Get a single transaction by ID.  
   
**`POST /`**  
Create a new transaction.  
   
**`PUT /:id`**  
Update an existing transaction.  
   
**`DELETE /:id`**  
Delete a transaction.  
   
**`GET /report/monthly`**  
Monthly summary — total expenses, total income, net balance, and a category breakdown. Optional `year` and `month` query params; defaults to the current month.  
   
### Transaction object  
   
```json  
{  
  "amount": 42.50,  
  "type": "expense",  
  "category": "Food",  
  "date": "2026-07-23",  
  "note": "Groceries at market"  
}  
```  
   
**Validation rules:**  
- `amount` must be a positive number  
- `type` must be `expense` or `income`  
- `category` must be one of the fixed predefined values  
- `date` is required  
   
## Roadmap  
   
Deferred from v1, flagged as possible future work:  
   
- Recurring transactions  
- Visual reporting (charts/graphs)  
- Budget limits with alerts  
- Data export/import  
   
## License  
   
Personal learning project — no license specified.  
