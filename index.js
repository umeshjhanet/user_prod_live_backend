const express = require('express');
var cors = require('cors')
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use(cors());

const mysql22 = mysql.createConnection({
  host: "192.168.3.124",
  port: "3306",
  user: "root",
  password: "Root$#123",
  database: "ezeefile_updc",
});
const misdb = mysql.createConnection({
  host: "localhost",
  port: "3306",
  user: "root",
  password: "root",
  database: "updc_misdb",
});

mysql22.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    return;
  }
  console.log("Connected to MySQL database");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
app.options("/users", (req, res) => {
  res.sendStatus(200);
});


app.get('/locations', (req, res) => {
    mysql22.query("SELECT LocationID, LocationName from locationmaster;", (err, results) => {
      if (err) throw err;
      res.json(results);
    });
  });

app.get('/summaryreport',  (req, res) => {
  let locationNames = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;

  const queryParams = [];

  if (!locationNames || (Array.isArray(locationNames) && locationNames.length === 0)) {
    locationNames = null;
  } else {
    if (!Array.isArray(locationNames)) {
      locationNames = [locationNames];
    }
  }

  let whereClause = "";

  if (locationNames) {
    whereClause = `WHERE s.locationname IN ('${locationNames.join("','")}')`;
  }

  let dateClause = "";

  if (startDate && endDate) {
    dateClause = whereClause ? `AND` : `WHERE`;
    dateClause += ` (s.inventorydate BETWEEN '${startDate}' AND '${endDate}'
                OR s.scandate BETWEEN '${startDate}' AND '${endDate}'
                OR s.qcdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.flaggingdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.indexdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.cbslqadate BETWEEN '${startDate}' AND '${endDate}'
                OR s.exportdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.clientqaacceptdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.digisigndate BETWEEN '${startDate}' AND '${endDate}')`;
  }

  const query = `
  SELECT 
  sum(s.scanimages) as 'Scanned',sum(qcimages) as 'QC',
  sum(flaggingimages)  as 'Flagging',sum(indeximages) as 'Indexing',
  sum(cbslqaimages) as 'CBSL_QA',sum(clientqaacceptimages)  as 'Client_QC' FROM scanned s
  ${whereClause}
  ${dateClause}
  ;`;


  mysql22.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("Error fetching summary data:", err);
      res.status(500).json({ error: "Error fetching summary data" });
      return;
    }
    res.json(results);
  });
});


app.get('/detailedreport',  (req, res) => {
  let locationNames = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;

  const queryParams = [];

  if (!locationNames || (Array.isArray(locationNames) && locationNames.length === 0)) {
    locationNames = null;
  } else {
    if (!Array.isArray(locationNames)) {
      locationNames = [locationNames];
    }
  }

  let whereClause = "";

  if (locationNames) {
    whereClause = `WHERE s.locationname IN ('${locationNames.join("','")}')`;
  }

  let dateClause = "";

  if (startDate && endDate) {
    dateClause = whereClause ? `AND` : `WHERE`;
    dateClause += ` (s.inventorydate BETWEEN '${startDate}' AND '${endDate}'
                OR s.scandate BETWEEN '${startDate}' AND '${endDate}'
                OR s.qcdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.flaggingdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.indexdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.cbslqadate BETWEEN '${startDate}' AND '${endDate}'
                OR s.exportdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.clientqaacceptdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.digisigndate BETWEEN '${startDate}' AND '${endDate}')`;
  }

  const query = `
  SELECT 
    s.locationname,
    SUM(s.scanimages) AS 'Scanned',
    SUM(s.qcimages) AS 'QC',
    SUM(s.indeximages) AS 'Indexing',
    SUM(s.flaggingimages) AS 'Flagging',
    SUM(s.cbslqaimages) AS 'CBSL_QA',
    SUM(s.clientqaacceptimages) AS 'Client_QC'
  FROM 
    scanned s
  ${whereClause}
  ${dateClause}
  GROUP BY 
    s.locationname`;

  mysql22.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("Error fetching summary data:", err);
      res.status(500).json({ error: "Error fetching summary data" });
      return;
    }
    res.json(results);
  });
});

app.get('/detailedreportcsv',  (req, res) => {
  let locationNames = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;

  const queryParams = [];

  if (!locationNames || (Array.isArray(locationNames) && locationNames.length === 0)) {
    locationNames = null;
  } else {
    if (!Array.isArray(locationNames)) {
      locationNames = [locationNames];
    }
  }

  let whereClause = "";

  if (locationNames) {
    whereClause = `WHERE s.locationname IN ('${locationNames.join("','")}')`;
  }

  let dateClause = "";

  if (startDate && endDate) {
    dateClause = whereClause ? `AND` : `WHERE`;
    dateClause += ` (s.inventorydate BETWEEN '${startDate}' AND '${endDate}'
                OR s.scandate BETWEEN '${startDate}' AND '${endDate}'
                OR s.qcdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.flaggingdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.indexdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.cbslqadate BETWEEN '${startDate}' AND '${endDate}'
                OR s.exportdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.clientqaacceptdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.digisigndate BETWEEN '${startDate}' AND '${endDate}')`;
  }

  const getCsv = `
    SELECT 
      s.locationname,
      case when sum(s.scanimages) is null then '0' else sum(s.scanimages) end as 'ScannedImages',
        case when sum(s.qcimages) is null then '0' else sum(s.qcimages) end as 'QCImages',
        case when sum(s.indeximages) is null then '0' else sum(s.indeximages) end as 'IndexingImages',
        case when sum(s.flaggingimages) is null then '0' else sum(s.flaggingimages) end as 'FlaggingImages',
        case when sum(s.cbslqaimages) is null then '0' else sum(s.cbslqaimages) end as 'CBSL_QAImages',
        case when sum(s.clientqaacceptimages) is null then '0' else sum(s.clientqaacceptimages) end as 'Client_QA_AcceptedImages'
    FROM 
      scanned s
    ${whereClause}
    ${dateClause}
    GROUP BY 
      s.locationname`;

  mysql22.query(getCsv, (error, result) => {
    if (error) {
      console.error("Error occurred when exporting CSV:", error);
      res.status(500).json({ error: "An error occurred while exporting the CSV file" });
      return;
    }
    const data = result && result.length > 0 ? result : null;
    if (!data) {
      res.status(404).json({ error: "No data found for the provided parameters" });
      return;
    }
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment;filename=export.csv");
    res.write('Sr. No.,Location,Scanning ADF,ImageQC,Flagging,Indexing,CBSLQA,Client QA\n');
    // Write CSV data
    data.forEach((row, index) => {
      res.write(
        (index + 1) + "," +
        row.locationname + "," +
        row.ScannedImages + "," +
        row.QCImages + "," +
        row.FlaggingImages + "," +
        row.IndexingImages + "," +
        row.CBSL_QAImages + "," +
        row.Client_QA_AcceptedImages + "\n"
      );
    });

    
    res.end();
  });
});

app.get("/detailedreportlocationwise",  (req, res) => {
  let locationNames = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;

  const queryParams = [];

  if (!locationNames || (Array.isArray(locationNames) && locationNames.length === 0)) {
    locationNames = null;
  } else {
    if (!Array.isArray(locationNames)) {
      locationNames = [locationNames];
    }
  }

  let whereClause = "";

  if (locationNames) {
    whereClause = `WHERE s.locationname IN ('${locationNames.join("','")}')`;
  }

  let dateClause = "";

  if (startDate && endDate) {
    dateClause = whereClause ? `AND` : `WHERE`;
    dateClause += ` (s.inventorydate BETWEEN '${startDate}' AND '${endDate}'
                OR s.scandate BETWEEN '${startDate}' AND '${endDate}'
                OR s.qcdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.flaggingdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.indexdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.cbslqadate BETWEEN '${startDate}' AND '${endDate}'
                OR s.exportdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.clientqaacceptdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.digisigndate BETWEEN '${startDate}' AND '${endDate}')`;
  }
 
 

  const query = `
  SELECT 
    SUBSTRING_INDEX(
      CONCAT_WS(', ', 
        COALESCE(s.scanuser, ''),
        COALESCE(s.qcuser, ''),
        COALESCE(s.indexuser, ''),
        COALESCE(s.flagginguser, ''),
        COALESCE(s.cbslqauser, ''),
        COALESCE(s.clientqaacceptuser, '')
      ), 
      ', ', 1
    ) AS user_type,
    s.locationname AS 'locationName',
    SUM(s.scanimages) AS 'Scanned',
    SUM(s.qcimages) AS 'QC',
    SUM(s.indeximages) AS 'Indexing',
    SUM(s.flaggingimages) AS 'Flagging',
    SUM(s.cbslqaimages) AS 'CBSL_QA',
    SUM(s.clientqaacceptimages) AS 'Client_QC'
  FROM 
    scanned s
  ${whereClause}
  ${dateClause}
  GROUP BY 
  s.locationname,
    user_type;
`;



  mysql22.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("Error in MySQL query:", err);
      res.status(500).json({ error: "An error occurred while fetching data from the database" });
      return;
    }
    res.json(results);
  });
});


app.get("/detailedreportlocationwisecsv",  (req, res, next) => {
  let locationNames = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;

  console.log("Location Names:", locationNames);

  const queryParams = [];

  if (!locationNames || (Array.isArray(locationNames) && locationNames.length === 0)) {
    locationNames = null;
  } else {
    if (!Array.isArray(locationNames)) {
      locationNames = [locationNames];
    }
  }

  let whereClause = "";

  if (locationNames) {
    whereClause = `WHERE s.locationname IN ('${locationNames.join("','")}')`;
  }

  console.log("Where Clause:", whereClause); // Log generated whereClause

  let dateClause = "";

  if (startDate && endDate) {
    dateClause = whereClause ? `AND` : `WHERE`;
    dateClause += ` (s.inventorydate BETWEEN '${startDate}' AND '${endDate}'
                OR s.scandate BETWEEN '${startDate}' AND '${endDate}'
                OR s.qcdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.flaggingdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.indexdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.cbslqadate BETWEEN '${startDate}' AND '${endDate}'
                OR s.exportdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.clientqaacceptdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.digisigndate BETWEEN '${startDate}' AND '${endDate}')`;
  }

  console.log("Date Clause:", dateClause); // Log generated dateClause

  const getCsv = `
  SELECT 
    SUBSTRING_INDEX(
      CONCAT_WS(', ', 
        COALESCE(s.scanuser, ''),
        COALESCE(s.qcuser, ''),
        COALESCE(s.indexuser, ''),
        COALESCE(s.flagginguser, ''),
        COALESCE(s.cbslqauser, ''),
        COALESCE(s.clientqaacceptuser, '')
      ), 
      ', ', 1
    ) AS user_type,
    case when sum(s.scanimages) is null then '0' else sum(s.scanimages) end as 'Total Scanned',
    case when sum(s.qcimages) is null then '0' else sum(s.qcimages) end as 'Total QC',
    case when sum(s.indeximages) is null then '0' else sum(s.indeximages) end as 'Total Index',
    case when sum(s.flaggingimages) is null then '0' else sum(s.flaggingimages) end as 'Total Flagging',
    case when sum(s.cbslqaimages) is null then '0' else sum(s.cbslqaimages) end as 'Total cbslqa',
    case when sum(s.clientqaacceptimages) is null then '0' else sum(s.clientqaacceptimages) end as 'Total ClientQA'
  FROM 
    scanned s
  ${whereClause}
  ${dateClause}
  GROUP BY 
    user_type;
`;

mysql22.query(getCsv, (error, result) => {
  if (error) {
    console.error("Error occurred when exporting CSV:", error);
    res.status(500).json({ error: "An error occurred while exporting the CSV file" });
    return;
  }
  const data = result && result.length > 0 ? result : null;
  if (!data) {
    res.status(404).json({ error: "No data found for the provided parameters" });
    return;
  }
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment;filename=export.csv");
  res.write('Sr. No.,User Type,Total Scanned,Total QC,Total Index,Total Flagging,Total CBSLQA,Total ClientQA\n');
  // Write CSV data
  data.forEach((row, index) => {
    res.write(
      (index + 1) + "," +
      row.user_type + "," +
      row['Total Scanned'] + "," +
      row['Total QC'] + "," +
      row['Total Index'] + "," +
      row['Total Flagging'] + "," +
      row['Total cbslqa'] + "," +
      row['Total ClientQA'] + "\n"
    );
  });


    // End response
    res.end();
  });
});


app.get("/userdetailedreportlocationwisecsv", cors(corsOptions), (req, res, next) => {
  let username=req.query.username
  let locationNames = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;

  console.log("Location Names:", locationNames);

  const queryParams = [];

  if (!locationNames || (Array.isArray(locationNames) && locationNames.length === 0)) {
    locationNames = null;
  } else {
    if (!Array.isArray(locationNames)) {
      locationNames = [locationNames];
    }
  }

  let whereClause = "";

  if (locationNames) {
    whereClause = `WHERE s.locationname IN ('${locationNames.join("','")}')`;
  }

  

  let dateClause = "";

  if (startDate && endDate) {
    dateClause = whereClause ? `AND` : `WHERE`;
    dateClause += ` (s.inventorydate BETWEEN '${startDate}' AND '${endDate}'
                OR s.scandate BETWEEN '${startDate}' AND '${endDate}'
                OR s.qcdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.flaggingdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.indexdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.cbslqadate BETWEEN '${startDate}' AND '${endDate}'
                OR s.exportdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.clientqaacceptdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.digisigndate BETWEEN '${startDate}' AND '${endDate}')`;
  }





const getCsv = `

SELECT
    CONCAT(
        COALESCE(s.scanuser, ''),
        COALESCE(s.qcuser, ''),
        COALESCE(s.flagginguser, ''),
        COALESCE(s.indexuser, ''),
        COALESCE(s.cbslqauser, ''),
        COALESCE(s.clientqaacceptuser, '')
    ) AS user_type,
    s.locationname AS 'Location Name',
    s.lotno AS 'LotNo',
    s.casetypecode AS 'FileBarcode',
    DATE_FORMAT(s.inventorydate, '%d-%m-%Y') AS 'Date',
    case when sum(s.scanimages) is null then '0' else sum(s.scanimages) end as 'Scanned',
    case when sum(s.qcimages) is null then '0' else sum(s.qcimages) end as 'QC',
    case when sum(s.indeximages) is null then '0' else sum(s.indeximages) end as 'Indexing',
    case when sum(s.flaggingimages) is null then '0' else sum(s.flaggingimages) end as 'Flagging',
    case when sum(s.cbslqaimages) is null then '0' else sum(s.cbslqaimages) end as 'CBSL_QA',
    case when sum(s.clientqaacceptimages) is null then '0' else sum(s.clientqaacceptimages) end as 'Client_QC'
FROM 
    scanned s
${whereClause}  /* Include WHERE clause here */
${dateClause}   /* Include date clause here */
AND  /* Add AND condition if both WHERE and dateClause exist */
    CONCAT(
        COALESCE(s.scanuser, ''),
        COALESCE(s.qcuser, ''),
        COALESCE(s.flagginguser, ''),
        COALESCE(s.indexuser, ''),
        COALESCE(s.cbslqauser, ''),
        COALESCE(s.clientqaacceptuser, '')
    ) LIKE '${username}'
GROUP BY
    user_type,
    s.locationname,
    s.lotno,
    s.casetypecode,
    DATE_FORMAT(s.inventorydate, '%d-%m-%Y');
`;

  

mysql22.query(getCsv, (error, result) => {
  if (error) {
    console.error("Error occurred when exporting CSV:", error);
    res.status(500).json({ error: "An error occurred while exporting the CSV file" });
    return;
  }
  const data = result && result.length > 0 ? result : null;
  if (!data) {
    res.status(404).json({ error: "No data found for the provided parameters" });
    return;
  }
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment;filename=export.csv");
  res.write('Sr. No.,Location Name,UserName,LotNo,FileBarcode,Date,Total Scanned,Total QC,Total Index,Total Flagging,Total CBSLQA,Total ClientQA\n');
  // Write CSV data
  data.forEach((row, index) => {
    res.write(
      (index + 1) + "," +
      row['Location Name'] + "," +  // Access the 'Location Name' column
    row.user_type + "," +
    row.LotNo + "," +  // Access the 'LotNo' column
    row.FileBarcode + "," + 
    row.Date +"," +
      row['Scanned'] + "," +
      row['QC'] + "," +
      row['Indexing'] + "," +
      row['Flagging'] + "," +
      row['CBSL_QA'] + "," +
      row['Client_QC'] + "\n"
    );
  });


    // End response
    res.end();
  });
});


app.get('/UserDetailedReport',(req, res) => {
  let username = req.query.username;
  let locationNames = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;

  const queryParams = [];

  if (!locationNames || (Array.isArray(locationNames) && locationNames.length === 0)) {
    locationNames = null;
  } else {
    if (!Array.isArray(locationNames)) {
      locationNames = [locationNames];
    }
  }

  let whereClause = "";

  if (locationNames) {
    whereClause = `WHERE s.locationname IN ('${locationNames.join("','")}')`;
  }

  let dateClause = "";

  if (startDate && endDate) {
    dateClause = whereClause ? `AND` : `WHERE`;
    dateClause += ` (s.inventorydate BETWEEN '${startDate}' AND '${endDate}'
                OR s.scandate BETWEEN '${startDate}' AND '${endDate}'
                OR s.qcdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.flaggingdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.indexdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.cbslqadate BETWEEN '${startDate}' AND '${endDate}'
                OR s.exportdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.clientqaacceptdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.digisigndate BETWEEN '${startDate}' AND '${endDate}')`;
  }
 
  const query = `
  SELECT
    CONCAT(
        COALESCE(s.scanuser, ''),
        COALESCE(s.qcuser, ''),
        COALESCE(s.flagginguser, ''),
        COALESCE(s.indexuser, ''),
        COALESCE(s.cbslqauser, ''),
        COALESCE(s.clientqaacceptuser, '')
    ) AS user_type,
    s.locationname AS 'locationName',
    s.lotno AS 'LotNo',
    s.casetypecode AS 'FileBarcode',
    DATE_FORMAT(s.inventorydate, '%d-%m-%Y') AS 'Date',
    SUM(s.scanimages) AS 'Scanned',
    SUM(s.qcimages) AS 'QC',
    SUM(s.indeximages) AS 'Indexing',
    SUM(s.flaggingimages) AS 'Flagging',
    SUM(s.cbslqaimages) AS 'CBSL_QA',
    SUM(s.clientqaacceptimages) AS 'Client_QC'
FROM 
    scanned s
${whereClause}  /* Include WHERE clause here */
${dateClause}   /* Include date clause here */
AND  /* Add AND condition if both WHERE and dateClause exist */
    CONCAT(
        COALESCE(s.scanuser, ''),
        COALESCE(s.qcuser, ''),
        COALESCE(s.flagginguser, ''),
        COALESCE(s.indexuser, ''),
        COALESCE(s.cbslqauser, ''),
        COALESCE(s.clientqaacceptuser, '')
    ) LIKE '${username}'
GROUP BY
    user_type,
    s.locationname,
    s.lotno,
    s.casetypecode,
    DATE_FORMAT(s.inventorydate, '%d-%m-%Y');
`;




  mysql22.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("Error in MySQL query:", err);
      res.status(500).json({ error: "An error occurred while fetching data from the database" });
      return;
    }
    res.json(results);
  });
});


app.post("/createuser", (req, res) => {
  const data = req.body;
  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      console.error("Error generating salt:", err);
      return res.status(500).json({ error: "An error occurred while encrypting password" });
    }
   
    bcrypt.hash(data.password, salt, (err, hashedPassword) => {
      if (err) {
        console.error("Error hashing password:", err);
        return res.status(500).json({ error: "An error occurred while encrypting password" });
      }
     
      data.password = hashedPassword;
      const selectQuery = "SELECT * FROM tbl_user_master WHERE user_email_id=?";
      misdb.query(selectQuery, [data.user_email_id], (err, rows) => {
        if (err) {
          console.error("Error checking user existence:", err);
          return res.status(500).json({ error: "An error occurred while checking user existence" });
        }
        
        if (rows.length > 0) {
          return res.status(500).json({ error: "User already exists" });
        }
        const currentDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const query1 = "INSERT INTO tbl_user_master (user_email_id,first_name,middle_name,last_name,password,designation,phone_no,profile_picture,superior_name,superior_email,user_created_date,emp_id,last_pass_change,login_disabled_date,fpi_template, fpi_template_two,fpi_template_three,fpi_template_four,lang,locations,user_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        misdb.query(query1, [data.user_email_id, data.first_name, data.middle_name, data.last_name, data.password, data.designation, data.phone_no, data.profile_picture, data.superior_name, data.superior_email, currentDateTime, data.emp_id, data.last_pass_change, data.login_disabled_date, data.fpi_template, data.fpi_template_two, data.fpi_template_three, data.fpi_template_four, data.lang, data.locations, data.user_type], (err, results) => {
          if (err) {
            console.error("Error inserting user:", err);
            return res.status(500).json({ error: "An error occurred while inserting user" });
          }
          const user_id = results.insertId;
          const query2 = "INSERT INTO tbl_storagelevel_to_permission (user_id, sl_id) VALUES (?, ?)";
          misdb.query(query2, [user_id, data.sl_id], (err, results) => {
            if (err) {
              console.error("Error linking user with permission:", err);
              return res.status(500).json({ error: "An error occurred while linking user with permission" });
            }
            const query3 = "INSERT INTO tbl_ezeefile_logs (user_id, user_name, action_name, start_date, system_ip, remarks) VALUES (?, ?, ?, ?, ?, ?)";
            misdb.query(query3, [user_id, data.user_name, data.action_name, data.start_date, data.system_ip, data.remarks], (err, results) => {
              if (err) {
                console.error("Error inserting user log:", err);
                return res.status(500).json({ error: "An error occurred while inserting user log" });
              }
              // First, perform a SELECT query to check if a row with the provided role_id exists
              const selectQueryRole = "SELECT * FROM tbl_bridge_role_to_um WHERE role_id = ?";
              misdb.query(selectQueryRole, [data.role_id], (err, rowsRole) => {
                if (err) {
                  console.error("Error checking role existence:", err);
                  return res.status(500).json({ error: "An error occurred while checking role existence" });
                }
                if (rowsRole.length > 0) {
                  // If a row with the role_id exists, update the user_ids
                  const updateQueryRole = "UPDATE tbl_bridge_role_to_um SET user_ids = CONCAT(user_ids, ', ', ?) WHERE role_id = ?";
                  misdb.query(updateQueryRole, [user_id, data.role_id], (err, resultsRole) => {
                    if (err) {
                      console.error("Error updating user role:", err);
                      return res.status(500).json({ error: "An error occurred while updating user role" });
                    }
                  });
                } else {
                  // If a row with the role_id does not exist, insert a new row
                  const insertQueryRole = "INSERT INTO tbl_bridge_role_to_um (role_id, user_ids) VALUES (?, ?)";
                  misdb.query(insertQueryRole, [data.role_id, user_id], (err, resultsRole) => {
                    if (err) {
                      console.error("Error inserting user role:", err);
                      return res.status(500).json({ error: "An error occurred while inserting user role" });
                    }
                  });
                }
                // First, perform a SELECT query to check if the row exists
                const selectQueryGroup = "SELECT * FROM tbl_bridge_grp_to_um WHERE group_id = ?";
                misdb.query(selectQueryGroup, [data.group_id], (err, rowsGroup) => {
                  if (err) {
                    console.error("Error checking group existence:", err);
                    return res.status(500).json({ error: "An error occurred while checking group existence" });
                  }
                  if (rowsGroup.length > 0) {
                    const updateQueryGroup = "UPDATE tbl_bridge_grp_to_um SET user_ids = CONCAT(user_ids, ', ', ?), roleids = CONCAT(roleids, ', ', ?) WHERE group_id = ?";
                    misdb.query(updateQueryGroup, [user_id, data.role_id, data.group_id], (err, resultsGroup) => {
                      if (err) {
                        console.error("Error updating user group:", err);
                        return res.status(500).json({ error: "An error occurred while updating user group" });
                      }
                    });
                  } else {
                    const insertQueryGroup = "INSERT INTO tbl_bridge_grp_to_um (group_id, user_ids, roleids) VALUES (?, ?, ?)";
                    misdb.query(insertQueryGroup, [data.group_id, user_id, data.role_id], (err, resultsGroup) => {
                      if (err) {
                        console.error("Error inserting user group:", err);
                        return res.status(500).json({ error: "An error occurred while inserting user group" });
                      }
                    });
                  }
                  // const mailData = {
                  //   from: 'ezeefileadmin@cbslgroup.in',
                  //   to: data.user_email_id,
                  //   subject: 'Welcome to Our Platform!',
                  //   text: `Dear ${data.first_name},\n\nWelcome to our platform! Your account has been successfully created.\nUsername: ${data.user_email_id}\nPassword: ${data.password}\n`,
                  //   html: `<p>Dear ${data.first_name},</p><p>Welcome to our platform! Your account has been successfully created.</p><p>Username: ${data.user_email_id}</p><p>Password: ${data.password}</p>`
                  // };
                  // transporter.sendMail(mailData, (error, info) => {
                  //   if (error) {
                  //     console.error('Error sending welcome email:', error);
                  //   } else {
                  //     console.log('Welcome email sent:', info.response);
                  //   }
                    
                    res.status(200).json({ message: "User added successfully", id: user_id });
                  });
                });
              });
            });
          });
        });
      });
    });
  });



app.post("/login", (req, res) => {
  const { user_email_id, password } = req.body;
  const selectQuery = "SELECT * FROM tbl_user_master WHERE user_email_id=?";
  
  misdb.query(selectQuery, [user_email_id], (err, rows) => {
    if (err) {
      console.error("Error checking user existence:", err);
      return res.status(500).json({ error: "An error occurred while checking user existence" });
    }
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const userData = rows[0];
    const hashedPassword = userData.password;
    bcrypt.compare(password, hashedPassword, (err, result) => {
      if (err) {
        console.error("Error comparing passwords:", err);
        return res.status(500).json({ error: "An error occurred while comparing passwords" });
      }
      if (result) {
        const updateQuery = "UPDATE tbl_user_master SET last_active_login = NOW() WHERE user_email_id = ?";
        misdb.query(updateQuery, [user_email_id], (err) => {
          if (err) {
            console.error("Error updating last_active_login:", err);
            return res.status(500).json({ error: "An error occurred while updating last_active_login" });
          }
          const selectRolesQuery = `
          SELECT u.*, r.user_role 
          FROM tbl_user_master u
          LEFT JOIN tbl_bridge_role_to_um br ON FIND_IN_SET(u.user_id, REPLACE(br.user_ids, ' ','')) > 0
          LEFT JOIN tbl_user_roles r ON br.role_id = r.role_id
          WHERE u.user_email_id = ?
        `;
          misdb.query(selectRolesQuery, [user_email_id], (err,roleRows) => {
            if (err) {
              console.error("Error fetching user role:", err);
              return res.status(500).json({ error: "An error occurred while fetching user role" });
            }
            if (roleRows.length === 0) {
              return res.status(404).json({ error: "User role not found" });
            }
            const user_roles = roleRows.map(row => row.user_role);
            const { user_id, first_name, last_active_login } = userData;
            return res.status(200).json({ message: "Login successful", user_id, first_name, last_active_login, user_roles });
          });
        });
      } else {
        return res.status(401).json({ error: "Invalid password" });
      }
    });
  });
});

app.get('/locations', cors(corsOptions), (req, res) => {
  mysql22.query("SELECT LocationID, LocationName from locationmaster;", (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.get('/group_master' ,cors(corsOptions),(req,res)=>{
  mysql22.query("select group_id,group_name from tbl_group_master order by group_name asc;" ,(err,results)=>{
    if (err){
      throw err;
    }
    res.json(results);
  })
  })

  app.get("/privilege",cors(corsOptions),(req,res)=>{
    mysql22.query("select role_id,user_role from tbl_user_roles order by user_role asc;",(err,results)=>{
      if(err){
        throw err;
      }
      res.json(results);
    })
  })

  app.get("/storage",cors(corsOptions),(req,res)=>{
    mysql22.query("select * from tbl_storage_level",(err,results)=>{
      if(err){
        throw err;
      }
      res.json(results);
    })
  })
  
  app.get("/reporting",cors(corsOptions),(req,res)=>{
    mysql22.query("select * from tbl_user_master where user_id  and active_inactive_users='1' order by first_name,last_name asc;",(err,results)=>{
      if(err){
        throw err;
      }
      res.json(results)
    })
  })


  

 
