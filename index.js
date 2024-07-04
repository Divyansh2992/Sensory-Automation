const express = require("express");
const mysqlConnection = require("./trial"); // Assuming this file sets up the MySQL connection
const app = express();
const session = require('express-session');
const path = require("path");
const port = 3000;

// Set up view engine and views directory
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

// Middleware to handle favicon.ico requests
app.get('/favicon.ico', (req, res) => res.status(204));

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Configure session middleware
app.use(session({
  secret: 'your_secret_key', // Replace with a random secret for session encryption
  resave: false,
  saveUninitialized: true
}));

app.use(express.static(path.join(__dirname, 'public')));

let inputDate;

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "public/login.html"));
});

app.post("/login", function (req, res) {
  const username = req.body.username;
  const password = req.body.password;
  
  if (username === 'admin' && password === 'admin123') {
    res.redirect("/directed.html");
  } else {
    res.status(401).send("Incorrect username or password");
  }
});

app.post("/redirect", function (req, res) {
  inputDate = req.body.inputDate;
  req.session.inputDate = inputDate;

  const date = new Date(inputDate);
  const day = date.getDay();

  const urls = [
    "", // Sunday - No page for Sunday
    "/monday.html", // Monday
    "/tuesday.html", // Tuesday
    "/wednesday.html", // Wednesday
    "/thursday.html", // Thursday
    "/friday.html", // Friday
    "/saturday.html" // Saturday
  ];
  
  res.redirect(urls[day]);
});

app.post("/submit-feedback", function (req, res) {
  const feedbackData = req.body;

  if (!inputDate) {
    console.error("Error: inputDate is not defined");
    return res.status(400).send("Error: inputDate is not defined");
  }

  const tableName = inputDate.replace(/-/g, "_");

  const checkTableSql = `SHOW TABLES LIKE '${tableName}'`;
  mysqlConnection.query(checkTableSql, (checkErr, checkResults) => {
    if (checkErr) {
      console.error("Error checking table existence:", checkErr);
      return res.status(500).send("Error checking table existence");
    }

    if (checkResults.length > 0) {
      updateTable(tableName, feedbackData, res);
    } else {
      createNewTable(tableName, feedbackData, res);
    }
  });
});

function updateTable(tableName, feedbackData, res) {
  for (let i = 0; i < feedbackData.itemName.length; i++) {
    const itemName = feedbackData.itemName[i];
    const batch = feedbackData.batch[i];
    const appearance = parseInt(feedbackData[`appearance_${itemName}`]);
    const flavor = parseInt(feedbackData[`flavor_${itemName}`]);
    const taste = parseInt(feedbackData[`taste_${itemName}`]);
    const cooked_properly = parseInt(feedbackData[`cooked_properly_${itemName}`]);
    let Viscosity_or_Thickness = feedbackData[`Viscosity_or_Thickness_${itemName}`] ? parseInt(feedbackData[`Viscosity_or_Thickness_${itemName}`]) : 0;

    if (isNaN(appearance) || isNaN(flavor) || isNaN(taste) || isNaN(cooked_properly)) {
      console.error("Invalid input: appearance, flavor, taste, or cooked_properly is not a number");
      continue;
    }

    if (isNaN(Viscosity_or_Thickness)) {
      Viscosity_or_Thickness = 0;
    }

    const totalscore = appearance + flavor + taste + cooked_properly + Viscosity_or_Thickness;
    const attributeCount = Viscosity_or_Thickness ? 5 : 4;
    const average = totalscore / attributeCount;

    if (isNaN(totalscore) || isNaN(average)) {
      console.error("Invalid input: totalscore or average is not a number");
      continue;
    }

    const updateSql = `UPDATE ${tableName} SET batch=?, appearance=?, flavor=?, taste=?, cooked_properly=?, Viscosity_or_Thickness=?, totalscore=?, average=? WHERE itemName=?`;
    mysqlConnection.query(updateSql, [batch, appearance, flavor, taste, cooked_properly, Viscosity_or_Thickness, totalscore, average, itemName], (updateErr, updateResult) => {
      if (updateErr) {
        console.error("Error updating table:", updateErr);
        return res.status(500).send("Error updating table");
      }
      console.log("Table updated:", tableName);
    });
  }

  res.redirect(`/display`);
}

function createNewTable(tableName, feedbackData, res) {
  const createTableSql = `CREATE TABLE IF NOT EXISTS ${tableName} (
    id INT AUTO_INCREMENT PRIMARY KEY,
    itemName VARCHAR(255),
    batch VARCHAR(255),
    appearance INT,
    flavor INT,
    taste INT,
    cooked_properly INT,
    Viscosity_or_Thickness INT,
    totalscore INT,
    average FLOAT
  )`;
  mysqlConnection.query(createTableSql, (createErr, createResult) => {
    if (createErr) {
      console.error("Error creating table:", createErr);
      return res.status(500).send("Error creating table");
    }
    console.log("Table created:", tableName);

    insertIntoTable(tableName, feedbackData, res);
  });
}

function insertIntoTable(tableName, feedbackData, res) {
  for (let i = 0; i < feedbackData.itemName.length; i++) {
    const itemName = feedbackData.itemName[i];
    const batch = feedbackData.batch[i];
    const appearance = parseInt(feedbackData[`appearance_${itemName}`]);
    const flavor = parseInt(feedbackData[`flavor_${itemName}`]);
    const taste = parseInt(feedbackData[`taste_${itemName}`]);
    const cooked_properly = parseInt(feedbackData[`cooked_properly_${itemName}`]);
    let Viscosity_or_Thickness = feedbackData[`Viscosity_or_Thickness_${itemName}`] ? parseInt(feedbackData[`Viscosity_or_Thickness_${itemName}`]) : 0;

    if (isNaN(appearance) || isNaN(flavor) || isNaN(taste) || isNaN(cooked_properly)) {
      console.error("Invalid input: appearance, flavor, taste, or cooked_properly is not a number");
      continue;
    }

    if (isNaN(Viscosity_or_Thickness)) {
      Viscosity_or_Thickness = 0;
    }

    const totalscore = appearance + flavor + taste + cooked_properly + Viscosity_or_Thickness;
    const attributeCount = Viscosity_or_Thickness ? 5 : 4;
    const average = totalscore / attributeCount;

    if (isNaN(totalscore) || isNaN(average)) {
      console.error("Invalid input: totalscore or average is not a number");
      continue;
    }

    const insertSql = `INSERT INTO ${tableName} (itemName, batch, appearance, flavor, taste, cooked_properly, Viscosity_or_Thickness, totalscore, average) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    mysqlConnection.query(insertSql, [itemName, batch, appearance, flavor, taste, cooked_properly, Viscosity_or_Thickness, totalscore, average], (insertErr, insertResult) => {
      if (insertErr) {
        console.error("Error inserting data into table:", insertErr);
        return res.status(500).send("Error inserting data into table");
      }
      console.log("Data inserted into table:", tableName);
    });
  }

  res.redirect(`/display`);
}


// Route handler for displaying fetched data
app.get("/display", function (req, res) {
  const inputDate = req.session.inputDate; // Retrieve inputDate from session
  if (!inputDate) {
    console.error("Error: inputDate is not defined");
    return res.status(400).send("Error: inputDate is not defined");
  }
 
  const tableName = inputDate.replace(/-/g, "_");

  // Select data from dynamically created table
  const sql = `SELECT * FROM \`${tableName}\``;

  mysqlConnection.query(sql, (err, result) => {
    if (err) {
      console.error("Error fetching data from database:", err);
      return res.status(500).send(`Error fetching data from database: ${err.message}`);
    }

    // Render EJS template to display fetched data
    res.render("updated", { data: result, inputDate: inputDate });
  });
});







app.get("/dishes", function (req, res) {
  res.sendFile(path.join(__dirname, "public/dishes.html"));
});

// Route handler for form submission from dishes.html
app.post("/dishes", function (req, res) {
  const itemName = req.body.itemName; // Get itemName from form submission

  // Validate itemName or handle any required input validation here
  if (!itemName) {
    return res.status(400).send("Item name is required.");
  }

  // Create a new table based on itemName if it doesn't exist
  const tableName = `${itemName}`; // Example table name format feedback_YYYY_MM_DD_itemName

  const createTableSql = `CREATE TABLE IF NOT EXISTS \`${tableName}\` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    batch VARCHAR(255),
    appearance INT,
    flavor INT,
    taste INT,
    cooked_properly INT,
    Viscosity_or_Thickness INT,
    totalscore INT,
    average FLOAT,
    date VARCHAR(255) unique
  )`;

  // Execute the SQL query to create the table
  mysqlConnection.query(createTableSql, (err, result) => {
    if (err) {
      console.error("Error creating table:", err);
      return res.status(500).send("Error creating table");
    }
    console.log("Table created successfully:", tableName);

    // Fetch data from all tables and populate feedback_itemName table
    fetchAndPopulateTables(itemName, tableName);

    // Redirect or respond as needed
   // res.status(200).send(`Table ${tableName} created successfully.`);
   res.redirect(`/${encodeURIComponent(itemName)}`);
  });
});

// Helper function to fetch data from all tables and populate feedback_itemName table
function fetchAndPopulateTables(itemName, feedbackTableName) {
  // Query to get all table names in the database
  const showTablesSql = 'SHOW TABLES';
  mysqlConnection.query(showTablesSql, (err, tables) => {
    if (err) {
      console.error('Error fetching tables:', err);
      return;
    }

    // Extract table names from the result
    const tableNames = tables.map(table => table[`Tables_in_${mysqlConnection.config.database}`]);

    // Iterate through each table name and fetch rows where itemName matches
    tableNames.forEach(table => {
      const escapedTableName = mysqlConnection.escapeId(table); // Escape table name to avoid SQL injection
      const selectSql = `SELECT *, '${table}' AS sourceTable FROM ${escapedTableName} WHERE itemName = ?`; // Add source table name as a column
      mysqlConnection.query(selectSql, [itemName], (selectErr, rows) => {
        if (selectErr) {
          console.error(`Error fetching rows from ${table}:`, selectErr);
          return;
        }

        // Insert fetched rows into the feedbackTableName
        rows.forEach(row => {
          // Handle Viscosity_or_Thickness when it's undefined or empty
          let Viscosity_or_Thickness = row.Viscosity_or_Thickness ? parseInt(row.Viscosity_or_Thickness) : 0;

          // Calculate totalscore based on available attributes
          const totalscore = parseInt(row.appearance) + parseInt(row.flavor) + parseInt(row.taste) + parseInt(row.cooked_properly) + Viscosity_or_Thickness;

          // Calculate average based on the number of valid attributes
          const attributeCount = Viscosity_or_Thickness ? 5 : 4; // Adjust count based on presence of Viscosity_or_Thickness
          const average = totalscore / attributeCount;

          // Insert fetched rows into the feedbackTableName
          const insertSql = `INSERT INTO ${feedbackTableName} (batch, appearance, flavor, taste, cooked_properly, Viscosity_or_Thickness, totalscore, average, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
          mysqlConnection.query(insertSql, [row.batch, row.appearance, row.flavor, row.taste, row.cooked_properly, Viscosity_or_Thickness, row.totalscore, row.average, row.sourceTable], (insertErr, insertResult) => {
            if (insertErr) {
              console.error(`Error inserting row into ${feedbackTableName}:`, insertErr);
              return;
            }
            console.log(`Inserted row into ${feedbackTableName} from table ${table}`);
          });
        });
      });
    });
  });
}

// Route handler to display feedback data using EJS template
app.get("/:itemName", function (req, res) {
  const itemName = req.params.itemName;
  const tableName = `${itemName}`;

  // Query to fetch data from feedback table
  const selectSql = `SELECT * FROM ${tableName}`;
  mysqlConnection.query(selectSql, (err, rows) => {
    if (err) {
      console.error(`Error fetching data from ${tableName}:`, err);
      return res.status(500).send("Error fetching data");
    }

    // Render EJS template and pass fetched data
    res.render("feedback", { itemName, feedbackData: rows });
  });
});



// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
