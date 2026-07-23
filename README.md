# Ledger

A simple single-user expense and income tracker built with Node.js, Express, and SQLite.

## Features

- Add, edit, and delete transactions
- Track expenses and income
- Filter transactions by category, date range, and amount
- Monthly reports with totals and category breakdowns
- SQLite database with automatic initialization
- Input validation for API requests

## Tech Stack

- **Backend:** Node.js, Express
- **Database:** SQLite
- **Frontend:** HTML, CSS, JavaScript

## Getting Started

### Prerequisites

- Node.js 18 or later

### Installation

```bash
git clone https://github.com/Andr3wVnt/Ledger
cd Ledger
npm install sqlite3 sqlite express
```

### Run

```bash
node server.js
```

The application runs at:

```
http://localhost:3000
```

The SQLite database is created automatically on the first launch.

## Project Structure

```text
.
├── controllers/
│   └── transaction_controller.js
├── data/
│   └── expenses.db
├── db/
│   └── db.js
├── public/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── api.js
│   │   └── app.js
│   └── index.html
├── routes/
│   └── transactions.js
├── README.md
└── server.js
```

## API

Base endpoint:

```
/api/transactions
```

| Method | Endpoint          | Description          |
| ------ | ----------------- | -------------------- |
| GET    | `/`               | List transactions    |
| GET    | `/:id`            | Get a transaction    |
| POST   | `/`               | Create a transaction |
| PUT    | `/:id`            | Update a transaction |
| DELETE | `/:id`            | Delete a transaction |
| GET    | `/report/monthly` | Monthly report       |

## Example Transaction

```json
{
    "amount": 42.5,
    "type": "expense",
    "category": "Food",
    "date": "2026-07-23",
    "note": "Groceries"
}
```

## Roadmap

- Recurring transactions
- Charts and reports
- Budget tracking
- Import/export

## License

This project was created for learning purposes.
