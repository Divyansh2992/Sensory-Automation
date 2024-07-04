const mysql = require('mysql2');

// Create the connection to database
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'ap',
  password: '123456',
});

// Connect to the database
connection.connect(function(err) {
  if (err) {
    console.error('Error connecting to database:', err.stack);
    return;
  }
  console.log('Connected to database as ID:', connection.threadId);

  // Query to fetch all table names
  connection.query('SHOW TABLES', function(err, results, fields) {
    if (err) {
      console.error('Error fetching tables:', err.stack);
      return;
    }

    // Extract table names from the results
    const tableNames = results.map(result => result[Object.keys(result)[0]]);

    // Print or use the table names
    console.log('Tables in the database:', tableNames);

    // Example query to select all rows from feedback_2024_06_03 table
    // connection.query('SELECT * FROM feedback_2024_06_17', function(err, result) {
    //   if (err) {
    //     console.error('Error fetching data from feedback_2024_06_17:', err.stack);
    //     return;
    //   }
    //   console.log('Data from feedback_2024_06_17:', result);
    // });
  });
});

// Export the connection for use in other modules
module.exports = connection;
