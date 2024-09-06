

// Import required packages
const express = require('express');
const mysql = require('mysql2');
const { body, validationResult } = require('express-validator');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

// Initialize the Express app
const app = express();

// Middleware setup
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection setup
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
    return;
  }
  console.log('Connected to the MySQL database');
});

// API route to get all transactions
app.get('/api/transactions', (req, res) => {
  connection.query('SELECT * FROM transactions', (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// API route to add a new transaction
app.post(
  '/api/transactions',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
    body('type').isIn(['income', 'expense']).withMessage('Type must be either income or expense'),
    body('date').isISO8601().withMessage('Date must be a valid date'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, amount, type, date } = req.body;

    connection.query(
      'INSERT INTO transactions (name, amount, type, date) VALUES (?, ?, ?, ?)',
      [name, amount, type, date],
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ id: result.insertId, name, amount, type, date });
      }
    );
  }
);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
