const express = require('express');
var cors = require('cors')
const mysql = require('mysql2');
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
  port: "3307",
  user: "root",
  password: "root",
  database: "updc_live",
});

var corsOptions = {
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200,
}

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
app.options("/users", cors(corsOptions), (req, res) => {
  res.sendStatus(200);
});


app.get('/locations', cors(corsOptions), (req, res) => {
    mysql22.query("SELECT LocationID, LocationName from locationmaster;", (err, results) => {
      if (err) throw err;
      res.json(results);
    });
  });

app.get('/summaryreport', cors(corsOptions), (req, res) => {
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
  SELECT Count(distinct locationname) as LocationName,
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


app.get('/detailedreport', cors(corsOptions), (req, res) => {
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

app.get('/detailedreportcsv', cors(corsOptions), (req, res) => {
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

app.get("/detailedreportlocationwise", cors(corsOptions), (req, res) => {
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
 
  // const query = `
  //   SELECT 
  //     s.scanuser AS scanuser,
  //     SUM(s.scanimages) AS 'Total Scanned',
  //     SUM(s.qcimages) AS 'Total QC',
  //     SUM(s.indeximages) AS 'Total Index',
  //     SUM(s.flaggingimages) AS 'Total Flagging',
  //     SUM(s.cbslqaimages) AS 'Total cbslqa',
  //     SUM(s.clientqaacceptimages) AS 'Total ClientQA'
  //   FROM 
  //     scanned s
  //   ${whereClause}
  //   ${dateClause}
  //   GROUP BY 
  //     s.scanuser;`;

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


app.get("/detailedreportlocationwisecsv", cors(corsOptions), (req, res, next) => {
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


app.get("/userdetailedreportlocationwisecsv/:username", cors(corsOptions), (req, res, next) => {
  let username=req.params.username
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
    DATE_FORMAT(s.inventorydate, '%Y-%m-%d') AS 'Date',
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
    DATE_FORMAT(s.inventorydate, '%Y-%m-%d');
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
  res.write('Sr. No.,Location Name,UserName,LotNo,FileBarcode,Total Scanned,Total QC,Total Index,Total Flagging,Total CBSLQA,Total ClientQA\n');
  // Write CSV data
  data.forEach((row, index) => {
    res.write(
      (index + 1) + "," +
      row['Location Name'] + "," +  // Access the 'Location Name' column
    row.user_type + "," +
    row.LotNo + "," +  // Access the 'LotNo' column
    row.FileBarcode + "," + 
    row.Date +"," +
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


app.get('/UserDetailedReport', cors(corsOptions), (req, res) => {
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
    s.inventorydate AS 'Date',
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
    s.inventorydate;
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



  

 
