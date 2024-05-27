const express = require("express");
var cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const app = express();
const PORT = process.env.PORT || 5001;

//hi
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
const commonDB =  mysql.createConnection({
  host: "localhost",
  port: "3306",
  user: "root",
  password: "root",
  database: "commondb",
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

////////////////////////////////API FOR UPDC DATA/////////////////////////////////////////////////////////////////////////
app.get('/locations', (req, res) => {
    commonDB.query("SELECT LocationID, LocationName from locationmaster;", (err, results) => {
      if (err) throw err;
      res.json(results);
    }
  );
});
app.get("/getbusinessrate", (req, res) => {
  const query = `
   SELECT b.*, l.LocationId, l.LocationName
   FROM tbl_set_business AS b
   JOIN locationmaster AS l ON b.LocationId = l.LocationId
 `;
 
 misdb.query(query, (err, results) => {
   if (err) {
     throw err;
   }
   res.json(results);
 });
});
app.get("/summaryreport", (req, res) => {
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
  sum(s.scan) as 'Scanned',sum(qcimages) as 'QC',
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


app.get("/detailedreport", (req, res) => {
  let locationName = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;


  const queryParams = [];

  if (!locationName || (Array.isArray(locationName) && locationName.length === 0)) {
    locationName = null;
  } else {
    if (!Array.isArray(locationName)) {
      locationName = [locationName];
    }
  }


  let whereClause = "";

  if (locationName) {
    whereClause = `WHERE s.locationname IN ('${locationName.join("','")}')`;
  }


  let dateClause = "";


  if (startDate && endDate) {
    dateClause = whereClause ? `AND` : `WHERE`;
    dateClause += ` (s.scandate BETWEEN '${startDate}' AND '${endDate}'
                OR s.qcdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.flaggingdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.indexdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.cbslqadate BETWEEN '${startDate}' AND '${endDate}'
                OR s.clientqaacceptdate BETWEEN '${startDate}' AND '${endDate}')`;
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
      res
        .status(500)
        .json({ error: "An error occurred while exporting the CSV file" });
      return;
    }
    const data = result && result.length > 0 ? result : null;
    if (!data) {
      res
        .status(404)
        .json({ error: "No data found for the provided parameters" });
      return;
    }
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment;filename=All location.csv");
    res.write(
      "Sr. No.,Location,Scanning ADF,ImageQC,Flagging,Indexing,CBSLQA,Client QA\n"
    );
    // Write CSV data
    data.forEach((row, index) => {
      res.write(
        index +
          1 +
          "," +
          row.locationname +
          "," +
          row.ScannedImages +
          "," +
          row.QCImages +
          "," +
          row.FlaggingImages +
          "," +
          row.IndexingImages +
          "," +
          row.CBSL_QAImages +
          "," +
          row.Client_QA_AcceptedImages +
          "\n"
      );
    });

    res.end();
  });
});


app.get("/userdetailedreportlocationwise", (req, res) => {
  let username = req.query.username;
  let locationName = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate || new Date().toISOString().split('T')[0];

  const queryParams = [];

  if (!locationName || (Array.isArray(locationName) && locationName.length === 0)) {
    locationName = null;
  } else {
    if (!Array.isArray(locationName)) {
      locationName = [locationName];
    }
  }

  let whereClause = "";

  if (locationName) {
    whereClause = `WHERE locationname IN ('${locationName.join("','")}')`;
  }
  
  const query = `
  SELECT 
    locationname AS 'locationName',
    user AS 'user_type',
    DATE_FORMAT(DATE, '%Y-%m-%d') AS Date,
    lotno,
    SUM(CASE WHEN user_type = 'scan' THEN scanimages ELSE 0 END) AS Scanned,
    SUM(CASE WHEN user_type = 'qc' THEN qcimages ELSE 0 END) AS QC,
    SUM(CASE WHEN user_type = 'flagging' THEN flaggingimages ELSE 0 END) AS Flagging,
    SUM(CASE WHEN user_type = 'index' THEN indeximages ELSE 0 END) AS Indexing,
    SUM(CASE WHEN user_type = 'cbslqa' THEN cbslqaimages ELSE 0 END) AS CBSL_QA,
    SUM(CASE WHEN user_type = 'clientqaaccept' THEN clientqaacceptimages ELSE 0 END) AS Client_QC
  FROM 
    (
      SELECT 
          locationname, 
          scanuser AS user, 
          scandate AS DATE, 
          lotno, 
          scanimages, 
          0 AS qcimages, 
          0 AS flaggingimages, 
          0 AS indeximages, 
          0 AS cbslqaimages,
          0 AS clientqaacceptimages,
          'scan' AS user_type
      FROM 
          scanned
      ${whereClause} AND scanuser = '${username}' AND DATE(scandate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname, 
          qcuser AS user, 
          qcdate AS DATE, 
          lotno, 
          0 AS scanimages, 
          qcimages, 
          0 AS flaggingimages, 
          0 AS indeximages, 
          0 AS cbslqaimages,
          0 AS clientqaacceptimages,
          'qc' AS user_type
      FROM 
          scanned
      ${whereClause} AND qcuser = '${username}' AND DATE(qcdate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname, 
          flagginguser AS user, 
          flaggingdate AS DATE, 
          lotno, 
          0 AS scanimages, 
          0 AS qcimages, 
          flaggingimages, 
          0 AS indeximages, 
          0 AS cbslqaimages,
          0 AS clientqaacceptimages,
          'flagging' AS user_type
      FROM 
          scanned
      ${whereClause} AND flagginguser = '${username}' AND DATE(flaggingdate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname, 
          indexuser AS user, 
          indexdate AS DATE, 
          lotno, 
          0 AS scanimages, 
          0 AS qcimages, 
          0 AS flaggingimages, 
          indeximages, 
          0 AS cbslqaimages,
          0 AS clientqaacceptimages,
          'index' AS user_type
      FROM 
          scanned
      ${whereClause} AND indexuser = '${username}' AND DATE(indexdate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname, 
          cbslqauser AS user, 
          cbslqadate AS DATE, 
          lotno, 
          0 AS scanimages, 
          0 AS qcimages, 
          0 AS flaggingimages, 
          0 AS indeximages, 
          cbslqaimages, 
          0 AS clientqaacceptimages,
          'cbslqa' AS user_type
      FROM 
          scanned
      ${whereClause} AND cbslqauser = '${username}' AND DATE(cbslqadate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname, 
          clientqaacceptuser AS user, 
          clientqaacceptdate AS DATE, 
          lotno, 
          0 AS scanimages, 
          0 AS qcimages, 
          0 AS flaggingimages, 
          0 AS indeximages, 
          0 AS cbslqaimages, 
          clientqaacceptimages, 
          'clientqaaccept' AS user_type
      FROM 
          scanned
      ${whereClause} AND clientqaacceptuser = '${username}' AND DATE(clientqaacceptdate) BETWEEN '${startDate}' AND '${endDate}'
  ) AS subquery
  
  GROUP BY 
    locationname, 
    user, 
    DATE
  ORDER BY 
    DATE ASC;
`;

 

  mysql22.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("Error in MySQL query:", err);
      res.status(500).json({
        error: "An error occurred while fetching data from the database",
      });
      return;
    }
    res.json(results);
  });
});

app.get("/userdetailedreportlocationwisecsv",  (req, res, next) => {
  let username=req.query.username
  let locationName = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate || new Date().toISOString().split('T')[0];
  console.log("Location Names:", locationName);

  const queryParams = [];

  if (!locationName || (Array.isArray(locationName) && locationName.length === 0)) {
    locationName = null;
  } else {
    if (!Array.isArray(locationName)) {
      locationName= [locationName];
    }
  }

  let whereClause = "";
  if (locationName) {
    whereClause = `WHERE locationname IN ('${locationName.join("','")}')`;
  }

  
  let fileName = `${locationName.join("_")}_${username}.csv`;
const getCsv = `

SELECT 
  locationname AS 'locationName',
  user As 'user_type',
  DATE_FORMAT(Date, '%y-%m-%d') AS Date,
  lotno,
  SUM(CASE WHEN user_type = 'scan' THEN scanimages ELSE 0 END) AS Scanned,
  SUM(CASE WHEN user_type = 'qc' THEN qcimages ELSE 0 END) AS QC,
  SUM(CASE WHEN user_type = 'flagging' THEN flaggingimages ELSE 0 END) AS Flagging,
  SUM(CASE WHEN user_type = 'index' THEN indeximages ELSE 0 END) AS Indexing,
  SUM(CASE WHEN user_type = 'cbslqa' THEN cbslqaimages ELSE 0 END) AS CBSL_QA,
  SUM(CASE WHEN user_type = 'clientqaaccept' THEN clientqaacceptimages ELSE 0 END) AS Client_QC
FROM 
  (
      SELECT 
          locationname , 
          scanuser AS user, 
          scandate AS Date, 
          lotno, 
          scanimages, 
          0 AS qcimages, 
          0 AS flaggingimages, 
          0 AS indeximages, 
          0 AS cbslqaimages,
          0 AS clientqaacceptimages,
          'scan' AS user_type
      FROM 
          scanned
      ${whereClause} AND scanuser = '${username}' AND DATE(scandate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname , 
          qcuser AS user, 
          qcdate AS Date, 
          lotno, 
          0 AS scanimages, 
          qcimages, 
          0 AS flaggingimages, 
          0 AS indeximages, 
          0 AS cbslqaimages,
          0 AS clientqaacceptimages,
          'qc' AS user_type
      FROM 
          scanned
      ${whereClause} AND qcuser = '${username}' AND DATE(qcdate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname , 
          flagginguser AS user, 
          flaggingdate AS Date, 
          lotno, 
          0 AS scanimages, 
          0 AS qcimages, 
          flaggingimages, 
          0 AS indeximages, 
          0 AS cbslqaimages,
          0 AS clientqaacceptimages,
          'flagging' AS user_type
      FROM 
          scanned
      ${whereClause} AND flagginguser = '${username}' AND DATE(flaggingdate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname , 
          indexuser AS user, 
          indexdate AS Date, 
          lotno, 
          0 AS scanimages, 
          0 AS qcimages, 
          0 AS flaggingimages, 
          indeximages, 
          0 AS cbslqaimages,
          0 AS clientqaacceptimages,
          'index' AS user_type
      FROM 
          scanned
      ${whereClause} AND indexuser = '${username}' AND DATE(indexdate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname , 
          cbslqauser AS user, 
          cbslqadate AS Date, 
          lotno, 
          0 AS scanimages, 
          0 AS qcimages, 
          0 AS flaggingimages, 
          0 AS indeximages, 
          cbslqaimages, 
          0 AS clientqaacceptimages,
          'cbslqa' AS user_type
      FROM 
          scanned
      ${whereClause} AND cbslqauser = '${username}' AND DATE(cbslqadate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname , 
          clientqaacceptuser AS user, 
          clientqaacceptdate AS Date, 
          lotno, 
          0 AS scanimages, 
          0 AS qcimages, 
          0 AS flaggingimages, 
          0 AS indeximages, 
          0 AS cbslqaimages, 
          clientqaacceptimages, 
          'clientqaaccept' AS user_type
      FROM 
          scanned
      ${whereClause} AND clientqaacceptuser = '${username}' AND DATE(clientqaacceptdate) BETWEEN '${startDate}' AND '${endDate}'
  ) AS subquery
  
GROUP BY 
  locationname, 
  user, 
  Date
ORDER BY 
  Date ASC;

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
  res.setHeader("Content-Disposition", `attachment;filename=${fileName}`);
  res.write('Sr. No.,Location Name,UserName,LotNo,Date,Scanned,QC,Index,Flagging,CBSL_QA,Client_QC\n');
  // Write CSV data
  data.forEach((row, index) => {
    res.write(
      (index + 1) + "," +
      row['locationName'] + "," +  // Access the 'Location Name' column
    row.user_type + "," +
    row.lotno + "," +  // Access the 'LotNo' column
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

app.get("/detailedreportlocationwise", (req, res) => {
  let locationName = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate || new Date().toISOString().split('T')[0];

  // Ensure locationName is an array if provided
  if (!Array.isArray(locationName)) {
    locationName = [locationName];
  }

  let whereClause = "";
  
  // Build WHERE clause if locationName is provided
  if (locationName.length > 0) {
    whereClause = `WHERE locationname IN ('${locationName.join("','")}')`;
  }

  const query = `
  SELECT 
    locationname AS 'locationName',
    user AS 'user_type',
    SUM(CASE WHEN user_type = 'scan' THEN scanimages ELSE 0 END) AS Scanned,
    SUM(CASE WHEN user_type = 'qc' THEN qcimages ELSE 0 END) AS QC,
    SUM(CASE WHEN user_type = 'flagging' THEN flaggingimages ELSE 0 END) AS Flagging,
    SUM(CASE WHEN user_type = 'index' THEN indeximages ELSE 0 END) AS Indexing,
    SUM(CASE WHEN user_type = 'cbslqa' THEN cbslqaimages ELSE 0 END) AS CBSL_QA,
    SUM(CASE WHEN user_type = 'clientqaaccept' THEN clientqaacceptimages ELSE 0 END) AS Client_QC
  FROM 
    (
      SELECT 
          locationname, 
          scanuser AS user, 
          scanimages, 
          0 AS qcimages, 
          0 AS flaggingimages, 
          0 AS indeximages, 
          0 AS cbslqaimages,
          0 AS clientqaacceptimages,
          'scan' AS user_type
      FROM 
          scanned
      ${whereClause} AND DATE(scandate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname, 
          qcuser AS user, 
          0 AS scanimages, 
          qcimages, 
          0 AS flaggingimages, 
          0 AS indeximages, 
          0 AS cbslqaimages,
          0 AS clientqaacceptimages,
          'qc' AS user_type
      FROM 
          scanned
      ${whereClause} AND DATE(qcdate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname, 
          flagginguser AS user, 
          0 AS scanimages, 
          0 AS qcimages, 
          flaggingimages, 
          0 AS indeximages, 
          0 AS cbslqaimages,
          0 AS clientqaacceptimages,
          'flagging' AS user_type
      FROM 
          scanned
      ${whereClause} AND DATE(flaggingdate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname, 
          indexuser AS user, 
          0 AS scanimages, 
          0 AS qcimages, 
          0 AS flaggingimages, 
          indeximages, 
          0 AS cbslqaimages,
          0 AS clientqaacceptimages,
          'index' AS user_type
      FROM 
          scanned
      ${whereClause} AND DATE(indexdate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname, 
          cbslqauser AS user, 
          0 AS scanimages, 
          0 AS qcimages, 
          0 AS flaggingimages, 
          0 AS indeximages, 
          cbslqaimages, 
          0 AS clientqaacceptimages,
          'cbslqa' AS user_type
      FROM 
          scanned
      ${whereClause} AND DATE(cbslqadate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname, 
          clientqaacceptuser AS user, 
          0 AS scanimages, 
          0 AS qcimages, 
          0 AS flaggingimages, 
          0 AS indeximages, 
          0 AS cbslqaimages, 
          clientqaacceptimages, 
          'clientqaaccept' AS user_type
      FROM 
          scanned
      ${whereClause} AND DATE(clientqaacceptdate) BETWEEN '${startDate}' AND '${endDate}'
  ) AS subquery
  
  GROUP BY 
    locationname, 
    user;
`;

  console.log("Query:", query);

  mysql22.query(query, (err, results) => {
    if (err) {
      console.error("Error in MySQL query:", err);
      res.status(500).json({
        error: "An error occurred while fetching data from the database",
      });
      return;
    }
    res.json(results);
  });
});

app.get("/detailedreportlocationwisecsv", (req, res) => {
  let locationName = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate || new Date().toISOString().split('T')[0];
  console.log("Location Names:", locationName);

  const queryParams = [];

  if (!locationName || (Array.isArray(locationName) && locationName.length === 0)) {
    locationName = null;
  } else {
    if (!Array.isArray(locationName)) {
      locationName= [locationName];
    }
  }

  let whereClause = "";

  if (locationName) {
    whereClause = `WHERE locationname IN ('${locationName.join("','")}')`;
  }

  let fileName = `${locationName.join("_")}.csv`;

const getCsv = `

SELECT 
locationname AS 'locationName',
user AS 'user_type',
SUM(CASE WHEN user_type = 'scan' THEN scanimages ELSE 0 END) AS Scanned,
SUM(CASE WHEN user_type = 'qc' THEN qcimages ELSE 0 END) AS QC,
SUM(CASE WHEN user_type = 'flagging' THEN flaggingimages ELSE 0 END) AS Flagging,
SUM(CASE WHEN user_type = 'index' THEN indeximages ELSE 0 END) AS Indexing,
SUM(CASE WHEN user_type = 'cbslqa' THEN cbslqaimages ELSE 0 END) AS CBSL_QA,
SUM(CASE WHEN user_type = 'clientqaaccept' THEN clientqaacceptimages ELSE 0 END) AS Client_QC
FROM 
(
  SELECT 
      locationname, 
      scanuser AS user, 
      scanimages, 
      0 AS qcimages, 
      0 AS flaggingimages, 
      0 AS indeximages, 
      0 AS cbslqaimages,
      0 AS clientqaacceptimages,
      'scan' AS user_type
  FROM 
      scanned
  ${whereClause} AND DATE(scandate) BETWEEN '${startDate}' AND '${endDate}'
  UNION ALL
  SELECT 
      locationname, 
      qcuser AS user, 
      0 AS scanimages, 
      qcimages, 
      0 AS flaggingimages, 
      0 AS indeximages, 
      0 AS cbslqaimages,
      0 AS clientqaacceptimages,
      'qc' AS user_type
  FROM 
      scanned
  ${whereClause} AND DATE(qcdate) BETWEEN '${startDate}' AND '${endDate}'
  UNION ALL
  SELECT 
      locationname, 
      flagginguser AS user, 
      0 AS scanimages, 
      0 AS qcimages, 
      flaggingimages, 
      0 AS indeximages, 
      0 AS cbslqaimages,
      0 AS clientqaacceptimages,
      'flagging' AS user_type
  FROM 
      scanned
  ${whereClause} AND DATE(flaggingdate) BETWEEN '${startDate}' AND '${endDate}'
  UNION ALL
  SELECT 
      locationname, 
      indexuser AS user, 
      0 AS scanimages, 
      0 AS qcimages, 
      0 AS flaggingimages, 
      indeximages, 
      0 AS cbslqaimages,
      0 AS clientqaacceptimages,
      'index' AS user_type
  FROM 
      scanned
  ${whereClause} AND DATE(indexdate) BETWEEN '${startDate}' AND '${endDate}'
  UNION ALL
  SELECT 
      locationname, 
      cbslqauser AS user, 
      0 AS scanimages, 
      0 AS qcimages, 
      0 AS flaggingimages, 
      0 AS indeximages, 
      cbslqaimages, 
      0 AS clientqaacceptimages,
      'cbslqa' AS user_type
  FROM 
      scanned
  ${whereClause} AND DATE(cbslqadate) BETWEEN '${startDate}' AND '${endDate}'
  UNION ALL
  SELECT 
      locationname, 
      clientqaacceptuser AS user, 
      0 AS scanimages, 
      0 AS qcimages, 
      0 AS flaggingimages, 
      0 AS indeximages, 
      0 AS cbslqaimages, 
      clientqaacceptimages, 
      'clientqaaccept' AS user_type
  FROM 
      scanned
  ${whereClause} AND DATE(clientqaacceptdate) BETWEEN '${startDate}' AND '${endDate}'
) AS subquery

GROUP BY 
locationname, 
user;

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
  res.setHeader("Content-Disposition", `attachment;filename=${fileName}`); 
  res.write('Sr. No.,Location Name,UserName,Scanned,QC,Index,Flagging,CBSL_QA,Client_QC\n');
  // Write CSV data
  data.forEach((row, index) => {
    res.write(
      (index + 1) + "," +
      row['locationName'] + "," +  // Access the 'Location Name' column
    row.user_type + "," +
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


/////////////////////////////////////////////////////////////API FOR TELANGANA COURTS DATA////////////////////////////////////////////////////////////
app.get("/telgetbusinessrate", (req, res) => {
  const query = `
   SELECT b.*, l.LocationId, l.LocationName
   FROM tbl_set_business AS b
   JOIN locationmaster AS l ON b.LocationId = l.LocationId
 `;
 
 misdb.query(query, (err, results) => {
   if (err) {
     throw err;
   }
   res.json(results);
 });
});
app.get('/tellocations', (req, res) => {
  misdb.query("SELECT LocationID, LocationName from locationmaster;", (err, results) => {
    if (err) throw err;
    res.json(results);
  }
);
});

app.get("/telsummaryreport", (req, res) => {
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

misdb.query(query, queryParams, (err, results) => {
  if (err) {
    console.error("Error fetching summary data:", err);
    res.status(500).json({ error: "Error fetching summary data" });
    return;
  }
  res.json(results);
});
});


app.get("/teldetailedreport", (req, res) => {
let locationName = req.query.locationName;
let startDate = req.query.startDate;
let endDate = req.query.endDate;


const queryParams = [];

if (!locationName || (Array.isArray(locationName) && locationName.length === 0)) {
  locationName = null;
} else {
  if (!Array.isArray(locationName)) {
    locationName = [locationName];
  }
}


let whereClause = "";

if (locationName) {
  whereClause = `WHERE s.locationname IN ('${locationName.join("','")}')`;
}


let dateClause = "";


if (startDate && endDate) {
  dateClause = whereClause ? `AND` : `WHERE`;
  dateClause += ` (s.scandate BETWEEN '${startDate}' AND '${endDate}'
              OR s.qcdate BETWEEN '${startDate}' AND '${endDate}'
              OR s.flaggingdate BETWEEN '${startDate}' AND '${endDate}'
              OR s.indexdate BETWEEN '${startDate}' AND '${endDate}'
              OR s.cbslqadate BETWEEN '${startDate}' AND '${endDate}'
              OR s.clientqaacceptdate BETWEEN '${startDate}' AND '${endDate}')`;
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


misdb.query(query, queryParams, (err, results) => {
  if (err) {
    console.error("Error fetching summary data:", err);
    res.status(500).json({ error: "Error fetching summary data" });
    return;
  }
  res.json(results);
});
});

app.get('/teldetailedreportcsv',  (req, res) => {
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


misdb.query(getCsv, (error, result) => {
  if (error) {
    console.error("Error occurred when exporting CSV:", error);
    res
      .status(500)
      .json({ error: "An error occurred while exporting the CSV file" });
    return;
  }
  const data = result && result.length > 0 ? result : null;
  if (!data) {
    res
      .status(404)
      .json({ error: "No data found for the provided parameters" });
    return;
  }
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment;filename=All location.csv");
  res.write(
    "Sr. No.,Location,Scanning ADF,ImageQC,Flagging,Indexing,CBSLQA,Client QA\n"
  );
  // Write CSV data
  data.forEach((row, index) => {
    res.write(
      index +
        1 +
        "," +
        row.locationname +
        "," +
        row.ScannedImages +
        "," +
        row.QCImages +
        "," +
        row.FlaggingImages +
        "," +
        row.IndexingImages +
        "," +
        row.CBSL_QAImages +
        "," +
        row.Client_QA_AcceptedImages +
        "\n"
    );
  });

  res.end();
});
});
app.get("/teluserdetailedreportlocationwise", (req, res) => {
  let username = req.query.username;
  let locationName = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate || new Date().toISOString().split('T')[0];

  const queryParams = [];

  if (!locationName || (Array.isArray(locationName) && locationName.length === 0)) {
    locationName = null;
  } else {
    if (!Array.isArray(locationName)) {
      locationName = [locationName];
    }
  }

  let whereClause = "";

  if (locationName) {
    whereClause = `WHERE locationname IN ('${locationName.join("','")}')`;
  }
  
  const query = `
  SELECT 
    locationname AS 'locationName',
    user AS 'user_type',
    DATE_FORMAT(DATE, '%Y-%m-%d') AS Date,
    lotno,
    SUM(CASE WHEN user_type = 'scan' THEN scanimages ELSE 0 END) AS Scanned,
    SUM(CASE WHEN user_type = 'qc' THEN qcimages ELSE 0 END) AS QC,
    SUM(CASE WHEN user_type = 'flagging' THEN flaggingimages ELSE 0 END) AS Flagging,
    SUM(CASE WHEN user_type = 'index' THEN indeximages ELSE 0 END) AS Indexing,
    SUM(CASE WHEN user_type = 'cbslqa' THEN cbslqaimages ELSE 0 END) AS CBSL_QA,
    SUM(CASE WHEN user_type = 'clientqaaccept' THEN clientqaacceptimages ELSE 0 END) AS Client_QC
  FROM 
    (
      SELECT 
          locationname, 
          scanuser AS user, 
          scandate AS DATE, 
          lotno, 
          scanimages, 
          0 AS qcimages, 
          0 AS flaggingimages, 
          0 AS indeximages, 
          0 AS cbslqaimages,
          0 AS clientqaacceptimages,
          'scan' AS user_type
      FROM 
          scanned
      ${whereClause} AND scanuser = '${username}' AND DATE(scandate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname, 
          qcuser AS user, 
          qcdate AS DATE, 
          lotno, 
          0 AS scanimages, 
          qcimages, 
          0 AS flaggingimages, 
          0 AS indeximages, 
          0 AS cbslqaimages,
          0 AS clientqaacceptimages,
          'qc' AS user_type
      FROM 
          scanned
      ${whereClause} AND qcuser = '${username}' AND DATE(qcdate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname, 
          flagginguser AS user, 
          flaggingdate AS DATE, 
          lotno, 
          0 AS scanimages, 
          0 AS qcimages, 
          flaggingimages, 
          0 AS indeximages, 
          0 AS cbslqaimages,
          0 AS clientqaacceptimages,
          'flagging' AS user_type
      FROM 
          scanned
      ${whereClause} AND flagginguser = '${username}' AND DATE(flaggingdate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname, 
          indexuser AS user, 
          indexdate AS DATE, 
          lotno, 
          0 AS scanimages, 
          0 AS qcimages, 
          0 AS flaggingimages, 
          indeximages, 
          0 AS cbslqaimages,
          0 AS clientqaacceptimages,
          'index' AS user_type
      FROM 
          scanned
      ${whereClause} AND indexuser = '${username}' AND DATE(indexdate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname, 
          cbslqauser AS user, 
          cbslqadate AS DATE, 
          lotno, 
          0 AS scanimages, 
          0 AS qcimages, 
          0 AS flaggingimages, 
          0 AS indeximages, 
          cbslqaimages, 
          0 AS clientqaacceptimages,
          'cbslqa' AS user_type
      FROM 
          scanned
      ${whereClause} AND cbslqauser = '${username}' AND DATE(cbslqadate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname, 
          clientqaacceptuser AS user, 
          clientqaacceptdate AS DATE, 
          lotno, 
          0 AS scanimages, 
          0 AS qcimages, 
          0 AS flaggingimages, 
          0 AS indeximages, 
          0 AS cbslqaimages, 
          clientqaacceptimages, 
          'clientqaaccept' AS user_type
      FROM 
          scanned
      ${whereClause} AND clientqaacceptuser = '${username}' AND DATE(clientqaacceptdate) BETWEEN '${startDate}' AND '${endDate}'
  ) AS subquery
  
  GROUP BY 
    locationname, 
    user, 
    DATE
  ORDER BY 
    DATE ASC;
`;

 

  misdb.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("Error in MySQL query:", err);
      res.status(500).json({
        error: "An error occurred while fetching data from the database",
      });
      return;
    }
    res.json(results);
  });
});

app.get("/teluserdetailedreportlocationwisecsv",  (req, res, next) => {
  let username=req.query.username
  let locationName = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate || new Date().toISOString().split('T')[0];
  console.log("Location Names:", locationName);

  const queryParams = [];

  if (!locationName || (Array.isArray(locationName) && locationName.length === 0)) {
    locationName = null;
  } else {
    if (!Array.isArray(locationName)) {
      locationName= [locationName];
    }
  }

  let whereClause = "";
  if (locationName) {
    whereClause = `WHERE locationname IN ('${locationName.join("','")}')`;
  }

  
  let fileName = `${locationName.join("_")}_${username}.csv`;
const getCsv = `

SELECT 
  locationname AS 'locationName',
  user As 'user_type',
  DATE_FORMAT(Date, '%y-%m-%d') AS Date,
  lotno,
  SUM(CASE WHEN user_type = 'scan' THEN scanimages ELSE 0 END) AS Scanned,
  SUM(CASE WHEN user_type = 'qc' THEN qcimages ELSE 0 END) AS QC,
  SUM(CASE WHEN user_type = 'flagging' THEN flaggingimages ELSE 0 END) AS Flagging,
  SUM(CASE WHEN user_type = 'index' THEN indeximages ELSE 0 END) AS Indexing,
  SUM(CASE WHEN user_type = 'cbslqa' THEN cbslqaimages ELSE 0 END) AS CBSL_QA,
  SUM(CASE WHEN user_type = 'clientqaaccept' THEN clientqaacceptimages ELSE 0 END) AS Client_QC
FROM 
  (
      SELECT 
          locationname , 
          scanuser AS user, 
          scandate AS Date, 
          lotno, 
          scanimages, 
          0 AS qcimages, 
          0 AS flaggingimages, 
          0 AS indeximages, 
          0 AS cbslqaimages,
          0 AS clientqaacceptimages,
          'scan' AS user_type
      FROM 
          scanned
      ${whereClause} AND scanuser = '${username}' AND DATE(scandate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname , 
          qcuser AS user, 
          qcdate AS Date, 
          lotno, 
          0 AS scanimages, 
          qcimages, 
          0 AS flaggingimages, 
          0 AS indeximages, 
          0 AS cbslqaimages,
          0 AS clientqaacceptimages,
          'qc' AS user_type
      FROM 
          scanned
      ${whereClause} AND qcuser = '${username}' AND DATE(qcdate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname , 
          flagginguser AS user, 
          flaggingdate AS Date, 
          lotno, 
          0 AS scanimages, 
          0 AS qcimages, 
          flaggingimages, 
          0 AS indeximages, 
          0 AS cbslqaimages,
          0 AS clientqaacceptimages,
          'flagging' AS user_type
      FROM 
          scanned
      ${whereClause} AND flagginguser = '${username}' AND DATE(flaggingdate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname , 
          indexuser AS user, 
          indexdate AS Date, 
          lotno, 
          0 AS scanimages, 
          0 AS qcimages, 
          0 AS flaggingimages, 
          indeximages, 
          0 AS cbslqaimages,
          0 AS clientqaacceptimages,
          'index' AS user_type
      FROM 
          scanned
      ${whereClause} AND indexuser = '${username}' AND DATE(indexdate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname , 
          cbslqauser AS user, 
          cbslqadate AS Date, 
          lotno, 
          0 AS scanimages, 
          0 AS qcimages, 
          0 AS flaggingimages, 
          0 AS indeximages, 
          cbslqaimages, 
          0 AS clientqaacceptimages,
          'cbslqa' AS user_type
      FROM 
          scanned
      ${whereClause} AND cbslqauser = '${username}' AND DATE(cbslqadate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname , 
          clientqaacceptuser AS user, 
          clientqaacceptdate AS Date, 
          lotno, 
          0 AS scanimages, 
          0 AS qcimages, 
          0 AS flaggingimages, 
          0 AS indeximages, 
          0 AS cbslqaimages, 
          clientqaacceptimages, 
          'clientqaaccept' AS user_type
      FROM 
          scanned
      ${whereClause} AND clientqaacceptuser = '${username}' AND DATE(clientqaacceptdate) BETWEEN '${startDate}' AND '${endDate}'
  ) AS subquery
  
GROUP BY 
  locationname, 
  user, 
  Date
ORDER BY 
  Date ASC;

`;

misdb.query(getCsv, (error, result) => {
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
  res.setHeader("Content-Disposition", `attachment;filename=${fileName}`);
  res.write('Sr. No.,Location Name,UserName,LotNo,Date,Scanned,QC,Index,Flagging,CBSL_QA,Client_QC\n');
  // Write CSV data
  data.forEach((row, index) => {
    res.write(
      (index + 1) + "," +
      row['locationName'] + "," +  // Access the 'Location Name' column
    row.user_type + "," +
    row.lotno + "," +  // Access the 'LotNo' column
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

app.get("/teldetailedreportlocationwise", (req, res) => {
  let locationName = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate || new Date().toISOString().split('T')[0];

  // Ensure locationName is an array if provided
  if (!Array.isArray(locationName)) {
    locationName = [locationName];
  }

  let whereClause = "";
  
  // Build WHERE clause if locationName is provided
  if (locationName.length > 0) {
    whereClause = `WHERE locationname IN ('${locationName.join("','")}')`;
  }

  const query = `
  SELECT 
    locationname AS 'locationName',
    user AS 'user_type',
    SUM(CASE WHEN user_type = 'scan' THEN scanimages ELSE 0 END) AS Scanned,
    SUM(CASE WHEN user_type = 'qc' THEN qcimages ELSE 0 END) AS QC,
    SUM(CASE WHEN user_type = 'flagging' THEN flaggingimages ELSE 0 END) AS Flagging,
    SUM(CASE WHEN user_type = 'index' THEN indeximages ELSE 0 END) AS Indexing,
    SUM(CASE WHEN user_type = 'cbslqa' THEN cbslqaimages ELSE 0 END) AS CBSL_QA,
    SUM(CASE WHEN user_type = 'clientqaaccept' THEN clientqaacceptimages ELSE 0 END) AS Client_QC
  FROM 
    (
      SELECT 
          locationname, 
          scanuser AS user, 
          scanimages, 
          0 AS qcimages, 
          0 AS flaggingimages, 
          0 AS indeximages, 
          0 AS cbslqaimages,
          0 AS clientqaacceptimages,
          'scan' AS user_type
      FROM 
          scanned
      ${whereClause} AND DATE(scandate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname, 
          qcuser AS user, 
          0 AS scanimages, 
          qcimages, 
          0 AS flaggingimages, 
          0 AS indeximages, 
          0 AS cbslqaimages,
          0 AS clientqaacceptimages,
          'qc' AS user_type
      FROM 
          scanned
      ${whereClause} AND DATE(qcdate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname, 
          flagginguser AS user, 
          0 AS scanimages, 
          0 AS qcimages, 
          flaggingimages, 
          0 AS indeximages, 
          0 AS cbslqaimages,
          0 AS clientqaacceptimages,
          'flagging' AS user_type
      FROM 
          scanned
      ${whereClause} AND DATE(flaggingdate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname, 
          indexuser AS user, 
          0 AS scanimages, 
          0 AS qcimages, 
          0 AS flaggingimages, 
          indeximages, 
          0 AS cbslqaimages,
          0 AS clientqaacceptimages,
          'index' AS user_type
      FROM 
          scanned
      ${whereClause} AND DATE(indexdate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname, 
          cbslqauser AS user, 
          0 AS scanimages, 
          0 AS qcimages, 
          0 AS flaggingimages, 
          0 AS indeximages, 
          cbslqaimages, 
          0 AS clientqaacceptimages,
          'cbslqa' AS user_type
      FROM 
          scanned
      ${whereClause} AND DATE(cbslqadate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname, 
          clientqaacceptuser AS user, 
          0 AS scanimages, 
          0 AS qcimages, 
          0 AS flaggingimages, 
          0 AS indeximages, 
          0 AS cbslqaimages, 
          clientqaacceptimages, 
          'clientqaaccept' AS user_type
      FROM 
          scanned
      ${whereClause} AND DATE(clientqaacceptdate) BETWEEN '${startDate}' AND '${endDate}'
  ) AS subquery
  
  GROUP BY 
    locationname, 
    user;
`;

  console.log("Query:", query);

  misdb.query(query, (err, results) => {
    if (err) {
      console.error("Error in MySQL query:", err);
      res.status(500).json({
        error: "An error occurred while fetching data from the database",
      });
      return;
    }
    res.json(results);
  });
});

app.get("/teldetailedreportlocationwisecsv", (req, res) => {
  let locationName = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate || new Date().toISOString().split('T')[0];
  console.log("Location Names:", locationName);

  const queryParams = [];

  if (!locationName || (Array.isArray(locationName) && locationName.length === 0)) {
    locationName = null;
  } else {
    if (!Array.isArray(locationName)) {
      locationName= [locationName];
    }
  }

  let whereClause = "";

  if (locationName) {
    whereClause = `WHERE locationname IN ('${locationName.join("','")}')`;
  }

  let fileName = `${locationName.join("_")}.csv`;

const getCsv = `

SELECT 
locationname AS 'locationName',
user AS 'user_type',
SUM(CASE WHEN user_type = 'scan' THEN scanimages ELSE 0 END) AS Scanned,
SUM(CASE WHEN user_type = 'qc' THEN qcimages ELSE 0 END) AS QC,
SUM(CASE WHEN user_type = 'flagging' THEN flaggingimages ELSE 0 END) AS Flagging,
SUM(CASE WHEN user_type = 'index' THEN indeximages ELSE 0 END) AS Indexing,
SUM(CASE WHEN user_type = 'cbslqa' THEN cbslqaimages ELSE 0 END) AS CBSL_QA,
SUM(CASE WHEN user_type = 'clientqaaccept' THEN clientqaacceptimages ELSE 0 END) AS Client_QC
FROM 
(
  SELECT 
      locationname, 
      scanuser AS user, 
      scanimages, 
      0 AS qcimages, 
      0 AS flaggingimages, 
      0 AS indeximages, 
      0 AS cbslqaimages,
      0 AS clientqaacceptimages,
      'scan' AS user_type
  FROM 
      scanned
  ${whereClause} AND DATE(scandate) BETWEEN '${startDate}' AND '${endDate}'
  UNION ALL
  SELECT 
      locationname, 
      qcuser AS user, 
      0 AS scanimages, 
      qcimages, 
      0 AS flaggingimages, 
      0 AS indeximages, 
      0 AS cbslqaimages,
      0 AS clientqaacceptimages,
      'qc' AS user_type
  FROM 
      scanned
  ${whereClause} AND DATE(qcdate) BETWEEN '${startDate}' AND '${endDate}'
  UNION ALL
  SELECT 
      locationname, 
      flagginguser AS user, 
      0 AS scanimages, 
      0 AS qcimages, 
      flaggingimages, 
      0 AS indeximages, 
      0 AS cbslqaimages,
      0 AS clientqaacceptimages,
      'flagging' AS user_type
  FROM 
      scanned
  ${whereClause} AND DATE(flaggingdate) BETWEEN '${startDate}' AND '${endDate}'
  UNION ALL
  SELECT 
      locationname, 
      indexuser AS user, 
      0 AS scanimages, 
      0 AS qcimages, 
      0 AS flaggingimages, 
      indeximages, 
      0 AS cbslqaimages,
      0 AS clientqaacceptimages,
      'index' AS user_type
  FROM 
      scanned
  ${whereClause} AND DATE(indexdate) BETWEEN '${startDate}' AND '${endDate}'
  UNION ALL
  SELECT 
      locationname, 
      cbslqauser AS user, 
      0 AS scanimages, 
      0 AS qcimages, 
      0 AS flaggingimages, 
      0 AS indeximages, 
      cbslqaimages, 
      0 AS clientqaacceptimages,
      'cbslqa' AS user_type
  FROM 
      scanned
  ${whereClause} AND DATE(cbslqadate) BETWEEN '${startDate}' AND '${endDate}'
  UNION ALL
  SELECT 
      locationname, 
      clientqaacceptuser AS user, 
      0 AS scanimages, 
      0 AS qcimages, 
      0 AS flaggingimages, 
      0 AS indeximages, 
      0 AS cbslqaimages, 
      clientqaacceptimages, 
      'clientqaaccept' AS user_type
  FROM 
      scanned
  ${whereClause} AND DATE(clientqaacceptdate) BETWEEN '${startDate}' AND '${endDate}'
) AS subquery

GROUP BY 
locationname, 
user;

`;

misdb.query(getCsv, (error, result) => {
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
  res.setHeader("Content-Disposition", `attachment;filename=${fileName}`); 
  res.write('Sr. No.,Location Name,UserName,Scanned,QC,Index,Flagging,CBSL_QA,Client_QC\n');
  // Write CSV data
  data.forEach((row, index) => {
    res.write(
      (index + 1) + "," +
      row['locationName'] + "," +  // Access the 'Location Name' column
    row.user_type + "," +
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


/////////////////////////////////////////////////////////////API FOR Karnataka COURTS DATA////////////////////////////////////////////////////////////
app.get("/kargetbusinessrate", (req, res) => {
  const query = `
   SELECT b.*, l.LocationId, l.LocationName
   FROM tbl_set_business AS b
   JOIN locationmaster AS l ON b.LocationId = l.LocationId
 `;
 
misdb.query(query, (err, results) => {
   if (err) {
     throw err;
   }
   res.json(results);
 });
});

app.get('/karlocations', (req, res) => {
  kardb.query("SELECT LocationID, LocationName from locationmaster;", (err, results) => {
    if (err) throw err;
    res.json(results);
  }
);
});

app.get("/karsummaryreport", (req, res) => {
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

kardb.query(query, queryParams, (err, results) => {
  if (err) {
    console.error("Error fetching summary data:", err);
    res.status(500).json({ error: "Error fetching summary data" });
    return;
  }
  res.json(results);
});
});


app.get("/kardetailedreport", (req, res) => {
let locationName = req.query.locationName;
let startDate = req.query.startDate;
let endDate = req.query.endDate;


const queryParams = [];

if (!locationName || (Array.isArray(locationName) && locationName.length === 0)) {
  locationName = null;
} else {
  if (!Array.isArray(locationName)) {
    locationName = [locationName];
  }
}


let whereClause = "";

if (locationName) {
  whereClause = `WHERE s.locationname IN ('${locationName.join("','")}')`;
}


let dateClause = "";


if (startDate && endDate) {
  dateClause = whereClause ? `AND` : `WHERE`;
  dateClause += ` (s.scandate BETWEEN '${startDate}' AND '${endDate}'
              OR s.qcdate BETWEEN '${startDate}' AND '${endDate}'
              OR s.flaggingdate BETWEEN '${startDate}' AND '${endDate}'
              OR s.indexdate BETWEEN '${startDate}' AND '${endDate}'
              OR s.cbslqadate BETWEEN '${startDate}' AND '${endDate}'
              OR s.clientqaacceptdate BETWEEN '${startDate}' AND '${endDate}')`;
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


kardb.query(query, queryParams, (err, results) => {
  if (err) {
    console.error("Error fetching summary data:", err);
    res.status(500).json({ error: "Error fetching summary data" });
    return;
  }
  res.json(results);
});
});

app.get('/kardetailedreportcsv',  (req, res) => {
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


kardb.query(getCsv, (error, result) => {
  if (error) {
    console.error("Error occurred when exporting CSV:", error);
    res
      .status(500)
      .json({ error: "An error occurred while exporting the CSV file" });
    return;
  }
  const data = result && result.length > 0 ? result : null;
  if (!data) {
    res
      .status(404)
      .json({ error: "No data found for the provided parameters" });
    return;
  }
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment;filename=All location.csv");
  res.write(
    "Sr. No.,Location,Scanning ADF,ImageQC,Flagging,Indexing,CBSLQA,Client QA\n"
  );
  // Write CSV data
  data.forEach((row, index) => {
    res.write(
      index +
        1 +
        "," +
        row.locationname +
        "," +
        row.ScannedImages +
        "," +
        row.QCImages +
        "," +
        row.FlaggingImages +
        "," +
        row.IndexingImages +
        "," +
        row.CBSL_QAImages +
        "," +
        row.Client_QA_AcceptedImages +
        "\n"
    );
  });

  res.end();
});
});
app.get("/karuserdetailedreportlocationwise", (req, res) => {
  let username = req.query.username;
  let locationName = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate || new Date().toISOString().split('T')[0];

  const queryParams = [];

  if (!locationName || (Array.isArray(locationName) && locationName.length === 0)) {
    locationName = null;
  } else {
    if (!Array.isArray(locationName)) {
      locationName = [locationName];
    }
  }

  let whereClause = "";

  if (locationName) {
    whereClause = `WHERE locationname IN ('${locationName.join("','")}')`;
  }
  
  const query = `
  SELECT 
    locationname AS 'locationName',
    user AS 'user_type',
    DATE_FORMAT(DATE, '%Y-%m-%d') AS Date,
    lotno,
    SUM(CASE WHEN user_type = 'scan' THEN scanimages ELSE 0 END) AS Scanned,
    SUM(CASE WHEN user_type = 'qc' THEN qcimages ELSE 0 END) AS QC,
    SUM(CASE WHEN user_type = 'flagging' THEN flaggingimages ELSE 0 END) AS Flagging,
    SUM(CASE WHEN user_type = 'index' THEN indeximages ELSE 0 END) AS Indexing,
    SUM(CASE WHEN user_type = 'cbslqa' THEN cbslqaimages ELSE 0 END) AS CBSL_QA,
    SUM(CASE WHEN user_type = 'clientqaaccept' THEN clientqaacceptimages ELSE 0 END) AS Client_QC
  FROM 
    (
      SELECT 
          locationname, 
          scanuser AS user, 
          scandate AS DATE, 
          lotno, 
          scanimages, 
          0 AS qcimages, 
          0 AS flaggingimages, 
          0 AS indeximages, 
          0 AS cbslqaimages,
          0 AS clientqaacceptimages,
          'scan' AS user_type
      FROM 
          scanned
      ${whereClause} AND scanuser = '${username}' AND DATE(scandate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname, 
          qcuser AS user, 
          qcdate AS DATE, 
          lotno, 
          0 AS scanimages, 
          qcimages, 
          0 AS flaggingimages, 
          0 AS indeximages, 
          0 AS cbslqaimages,
          0 AS clientqaacceptimages,
          'qc' AS user_type
      FROM 
          scanned
      ${whereClause} AND qcuser = '${username}' AND DATE(qcdate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname, 
          flagginguser AS user, 
          flaggingdate AS DATE, 
          lotno, 
          0 AS scanimages, 
          0 AS qcimages, 
          flaggingimages, 
          0 AS indeximages, 
          0 AS cbslqaimages,
          0 AS clientqaacceptimages,
          'flagging' AS user_type
      FROM 
          scanned
      ${whereClause} AND flagginguser = '${username}' AND DATE(flaggingdate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname, 
          indexuser AS user, 
          indexdate AS DATE, 
          lotno, 
          0 AS scanimages, 
          0 AS qcimages, 
          0 AS flaggingimages, 
          indeximages, 
          0 AS cbslqaimages,
          0 AS clientqaacceptimages,
          'index' AS user_type
      FROM 
          scanned
      ${whereClause} AND indexuser = '${username}' AND DATE(indexdate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname, 
          cbslqauser AS user, 
          cbslqadate AS DATE, 
          lotno, 
          0 AS scanimages, 
          0 AS qcimages, 
          0 AS flaggingimages, 
          0 AS indeximages, 
          cbslqaimages, 
          0 AS clientqaacceptimages,
          'cbslqa' AS user_type
      FROM 
          scanned
      ${whereClause} AND cbslqauser = '${username}' AND DATE(cbslqadate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname, 
          clientqaacceptuser AS user, 
          clientqaacceptdate AS DATE, 
          lotno, 
          0 AS scanimages, 
          0 AS qcimages, 
          0 AS flaggingimages, 
          0 AS indeximages, 
          0 AS cbslqaimages, 
          clientqaacceptimages, 
          'clientqaaccept' AS user_type
      FROM 
          scanned
      ${whereClause} AND clientqaacceptuser = '${username}' AND DATE(clientqaacceptdate) BETWEEN '${startDate}' AND '${endDate}'
  ) AS subquery
  
  GROUP BY 
    locationname, 
    user, 
    DATE
  ORDER BY 
    DATE ASC;
`;

 

  kardb.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("Error in MySQL query:", err);
      res.status(500).json({
        error: "An error occurred while fetching data from the database",
      });
      return;
    }
    res.json(results);
  });
});

app.get("/karuserdetailedreportlocationwisecsv",  (req, res, next) => {
  let username=req.query.username
  let locationName = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate || new Date().toISOString().split('T')[0];
  console.log("Location Names:", locationName);

  const queryParams = [];

  if (!locationName || (Array.isArray(locationName) && locationName.length === 0)) {
    locationName = null;
  } else {
    if (!Array.isArray(locationName)) {
      locationName= [locationName];
    }
  }

  let whereClause = "";
  if (locationName) {
    whereClause = `WHERE locationname IN ('${locationName.join("','")}')`;
  }

  
  let fileName = `${locationName.join("_")}_${username}.csv`;
const getCsv = `

SELECT 
  locationname AS 'locationName',
  user As 'user_type',
  DATE_FORMAT(Date, '%y-%m-%d') AS Date,
  lotno,
  SUM(CASE WHEN user_type = 'scan' THEN scanimages ELSE 0 END) AS Scanned,
  SUM(CASE WHEN user_type = 'qc' THEN qcimages ELSE 0 END) AS QC,
  SUM(CASE WHEN user_type = 'flagging' THEN flaggingimages ELSE 0 END) AS Flagging,
  SUM(CASE WHEN user_type = 'index' THEN indeximages ELSE 0 END) AS Indexing,
  SUM(CASE WHEN user_type = 'cbslqa' THEN cbslqaimages ELSE 0 END) AS CBSL_QA,
  SUM(CASE WHEN user_type = 'clientqaaccept' THEN clientqaacceptimages ELSE 0 END) AS Client_QC
FROM 
  (
      SELECT 
          locationname , 
          scanuser AS user, 
          scandate AS Date, 
          lotno, 
          scanimages, 
          0 AS qcimages, 
          0 AS flaggingimages, 
          0 AS indeximages, 
          0 AS cbslqaimages,
          0 AS clientqaacceptimages,
          'scan' AS user_type
      FROM 
          scanned
      ${whereClause} AND scanuser = '${username}' AND DATE(scandate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname , 
          qcuser AS user, 
          qcdate AS Date, 
          lotno, 
          0 AS scanimages, 
          qcimages, 
          0 AS flaggingimages, 
          0 AS indeximages, 
          0 AS cbslqaimages,
          0 AS clientqaacceptimages,
          'qc' AS user_type
      FROM 
          scanned
      ${whereClause} AND qcuser = '${username}' AND DATE(qcdate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname , 
          flagginguser AS user, 
          flaggingdate AS Date, 
          lotno, 
          0 AS scanimages, 
          0 AS qcimages, 
          flaggingimages, 
          0 AS indeximages, 
          0 AS cbslqaimages,
          0 AS clientqaacceptimages,
          'flagging' AS user_type
      FROM 
          scanned
      ${whereClause} AND flagginguser = '${username}' AND DATE(flaggingdate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname , 
          indexuser AS user, 
          indexdate AS Date, 
          lotno, 
          0 AS scanimages, 
          0 AS qcimages, 
          0 AS flaggingimages, 
          indeximages, 
          0 AS cbslqaimages,
          0 AS clientqaacceptimages,
          'index' AS user_type
      FROM 
          scanned
      ${whereClause} AND indexuser = '${username}' AND DATE(indexdate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname , 
          cbslqauser AS user, 
          cbslqadate AS Date, 
          lotno, 
          0 AS scanimages, 
          0 AS qcimages, 
          0 AS flaggingimages, 
          0 AS indeximages, 
          cbslqaimages, 
          0 AS clientqaacceptimages,
          'cbslqa' AS user_type
      FROM 
          scanned
      ${whereClause} AND cbslqauser = '${username}' AND DATE(cbslqadate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname , 
          clientqaacceptuser AS user, 
          clientqaacceptdate AS Date, 
          lotno, 
          0 AS scanimages, 
          0 AS qcimages, 
          0 AS flaggingimages, 
          0 AS indeximages, 
          0 AS cbslqaimages, 
          clientqaacceptimages, 
          'clientqaaccept' AS user_type
      FROM 
          scanned
      ${whereClause} AND clientqaacceptuser = '${username}' AND DATE(clientqaacceptdate) BETWEEN '${startDate}' AND '${endDate}'
  ) AS subquery
  
GROUP BY 
  locationname, 
  user, 
  Date
ORDER BY 
  Date ASC;

`;

kardb.query(getCsv, (error, result) => {
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
  res.setHeader("Content-Disposition", `attachment;filename=${fileName}`);
  res.write('Sr. No.,Location Name,UserName,LotNo,Date,Scanned,QC,Index,Flagging,CBSL_QA,Client_QC\n');
  // Write CSV data
  data.forEach((row, index) => {
    res.write(
      (index + 1) + "," +
      row['locationName'] + "," +  // Access the 'Location Name' column
    row.user_type + "," +
    row.lotno + "," +  // Access the 'LotNo' column
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

app.get("/kardetailedreportlocationwise", (req, res) => {
  let locationName = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate || new Date().toISOString().split('T')[0];

  // Ensure locationName is an array if provided
  if (!Array.isArray(locationName)) {
    locationName = [locationName];
  }

  let whereClause = "";
  
  // Build WHERE clause if locationName is provided
  if (locationName.length > 0) {
    whereClause = `WHERE locationname IN ('${locationName.join("','")}')`;
  }

  const query = `
  SELECT 
    locationname AS 'locationName',
    user AS 'user_type',
    SUM(CASE WHEN user_type = 'scan' THEN scanimages ELSE 0 END) AS Scanned,
    SUM(CASE WHEN user_type = 'qc' THEN qcimages ELSE 0 END) AS QC,
    SUM(CASE WHEN user_type = 'flagging' THEN flaggingimages ELSE 0 END) AS Flagging,
    SUM(CASE WHEN user_type = 'index' THEN indeximages ELSE 0 END) AS Indexing,
    SUM(CASE WHEN user_type = 'cbslqa' THEN cbslqaimages ELSE 0 END) AS CBSL_QA,
    SUM(CASE WHEN user_type = 'clientqaaccept' THEN clientqaacceptimages ELSE 0 END) AS Client_QC
  FROM 
    (
      SELECT 
          locationname, 
          scanuser AS user, 
          scanimages, 
          0 AS qcimages, 
          0 AS flaggingimages, 
          0 AS indeximages, 
          0 AS cbslqaimages,
          0 AS clientqaacceptimages,
          'scan' AS user_type
      FROM 
          scanned
      ${whereClause} AND DATE(scandate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname, 
          qcuser AS user, 
          0 AS scanimages, 
          qcimages, 
          0 AS flaggingimages, 
          0 AS indeximages, 
          0 AS cbslqaimages,
          0 AS clientqaacceptimages,
          'qc' AS user_type
      FROM 
          scanned
      ${whereClause} AND DATE(qcdate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname, 
          flagginguser AS user, 
          0 AS scanimages, 
          0 AS qcimages, 
          flaggingimages, 
          0 AS indeximages, 
          0 AS cbslqaimages,
          0 AS clientqaacceptimages,
          'flagging' AS user_type
      FROM 
          scanned
      ${whereClause} AND DATE(flaggingdate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname, 
          indexuser AS user, 
          0 AS scanimages, 
          0 AS qcimages, 
          0 AS flaggingimages, 
          indeximages, 
          0 AS cbslqaimages,
          0 AS clientqaacceptimages,
          'index' AS user_type
      FROM 
          scanned
      ${whereClause} AND DATE(indexdate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname, 
          cbslqauser AS user, 
          0 AS scanimages, 
          0 AS qcimages, 
          0 AS flaggingimages, 
          0 AS indeximages, 
          cbslqaimages, 
          0 AS clientqaacceptimages,
          'cbslqa' AS user_type
      FROM 
          scanned
      ${whereClause} AND DATE(cbslqadate) BETWEEN '${startDate}' AND '${endDate}'
      UNION ALL
      SELECT 
          locationname, 
          clientqaacceptuser AS user, 
          0 AS scanimages, 
          0 AS qcimages, 
          0 AS flaggingimages, 
          0 AS indeximages, 
          0 AS cbslqaimages, 
          clientqaacceptimages, 
          'clientqaaccept' AS user_type
      FROM 
          scanned
      ${whereClause} AND DATE(clientqaacceptdate) BETWEEN '${startDate}' AND '${endDate}'
  ) AS subquery
  
  GROUP BY 
    locationname, 
    user;
`;

  console.log("Query:", query);

  kardb.query(query, (err, results) => {
    if (err) {
      console.error("Error in MySQL query:", err);
      res.status(500).json({
        error: "An error occurred while fetching data from the database",
      });
      return;
    }
    res.json(results);
  });
});

app.get("/kardetailedreportlocationwisecsv", (req, res) => {
  let locationName = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate || new Date().toISOString().split('T')[0];
  console.log("Location Names:", locationName);

  const queryParams = [];

  if (!locationName || (Array.isArray(locationName) && locationName.length === 0)) {
    locationName = null;
  } else {
    if (!Array.isArray(locationName)) {
      locationName= [locationName];
    }
  }

  let whereClause = "";

  if (locationName) {
    whereClause = `WHERE locationname IN ('${locationName.join("','")}')`;
  }

  let fileName = `${locationName.join("_")}.csv`;

const getCsv = `

SELECT 
locationname AS 'locationName',
user AS 'user_type',
SUM(CASE WHEN user_type = 'scan' THEN scanimages ELSE 0 END) AS Scanned,
SUM(CASE WHEN user_type = 'qc' THEN qcimages ELSE 0 END) AS QC,
SUM(CASE WHEN user_type = 'flagging' THEN flaggingimages ELSE 0 END) AS Flagging,
SUM(CASE WHEN user_type = 'index' THEN indeximages ELSE 0 END) AS Indexing,
SUM(CASE WHEN user_type = 'cbslqa' THEN cbslqaimages ELSE 0 END) AS CBSL_QA,
SUM(CASE WHEN user_type = 'clientqaaccept' THEN clientqaacceptimages ELSE 0 END) AS Client_QC
FROM 
(
  SELECT 
      locationname, 
      scanuser AS user, 
      scanimages, 
      0 AS qcimages, 
      0 AS flaggingimages, 
      0 AS indeximages, 
      0 AS cbslqaimages,
      0 AS clientqaacceptimages,
      'scan' AS user_type
  FROM 
      scanned
  ${whereClause} AND DATE(scandate) BETWEEN '${startDate}' AND '${endDate}'
  UNION ALL
  SELECT 
      locationname, 
      qcuser AS user, 
      0 AS scanimages, 
      qcimages, 
      0 AS flaggingimages, 
      0 AS indeximages, 
      0 AS cbslqaimages,
      0 AS clientqaacceptimages,
      'qc' AS user_type
  FROM 
      scanned
  ${whereClause} AND DATE(qcdate) BETWEEN '${startDate}' AND '${endDate}'
  UNION ALL
  SELECT 
      locationname, 
      flagginguser AS user, 
      0 AS scanimages, 
      0 AS qcimages, 
      flaggingimages, 
      0 AS indeximages, 
      0 AS cbslqaimages,
      0 AS clientqaacceptimages,
      'flagging' AS user_type
  FROM 
      scanned
  ${whereClause} AND DATE(flaggingdate) BETWEEN '${startDate}' AND '${endDate}'
  UNION ALL
  SELECT 
      locationname, 
      indexuser AS user, 
      0 AS scanimages, 
      0 AS qcimages, 
      0 AS flaggingimages, 
      indeximages, 
      0 AS cbslqaimages,
      0 AS clientqaacceptimages,
      'index' AS user_type
  FROM 
      scanned
  ${whereClause} AND DATE(indexdate) BETWEEN '${startDate}' AND '${endDate}'
  UNION ALL
  SELECT 
      locationname, 
      cbslqauser AS user, 
      0 AS scanimages, 
      0 AS qcimages, 
      0 AS flaggingimages, 
      0 AS indeximages, 
      cbslqaimages, 
      0 AS clientqaacceptimages,
      'cbslqa' AS user_type
  FROM 
      scanned
  ${whereClause} AND DATE(cbslqadate) BETWEEN '${startDate}' AND '${endDate}'
  UNION ALL
  SELECT 
      locationname, 
      clientqaacceptuser AS user, 
      0 AS scanimages, 
      0 AS qcimages, 
      0 AS flaggingimages, 
      0 AS indeximages, 
      0 AS cbslqaimages, 
      clientqaacceptimages, 
      'clientqaaccept' AS user_type
  FROM 
      scanned
  ${whereClause} AND DATE(clientqaacceptdate) BETWEEN '${startDate}' AND '${endDate}'
) AS subquery

GROUP BY 
locationname, 
user;

`;

kardb.query(getCsv, (error, result) => {
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
  res.setHeader("Content-Disposition", `attachment;filename=${fileName}`); 
  res.write('Sr. No.,Location Name,UserName,Scanned,QC,Index,Flagging,CBSL_QA,Client_QC\n');
  // Write CSV data
  data.forEach((row, index) => {
    res.write(
      (index + 1) + "," +
      row['locationName'] + "," +  // Access the 'Location Name' column
    row.user_type + "," +
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



////////////////////////////////////////////////Common APIs///////////////////////////////////////////////////////////////



app.put("/updatebusinessrate/:id", (req, res) => {
 const id = req.params.id; // Get the id from req.params
 const { ScanRate, QcRate, IndexRate, FlagRate, CbslQaRate, ClientQcRate } =
   req.body;
 const queryParams = [];
 let query = `UPDATE tbl_set_business SET`;

 // Check if each field is provided in the request body and add it to the query
 if (ScanRate !== undefined) {
   query += ` ScanRate = ?,`;
   queryParams.push(ScanRate);
 }
 if (QcRate !== undefined) {
   query += ` QcRate = ?,`;
   queryParams.push(QcRate);
 }
 if (IndexRate !== undefined) {
   query += ` IndexRate = ?,`;
   queryParams.push(IndexRate);
 }
 if (FlagRate !== undefined) {
   query += ` FlagRate = ?,`;
   queryParams.push(FlagRate);
 }
 if (CbslQaRate !== undefined) {
   query += ` CbslQaRate = ?,`;
   queryParams.push(CbslQaRate);
 }
 if (ClientQcRate !== undefined) {
   query += ` ClientQcRate = ?,`;
   queryParams.push(ClientQcRate);
 }

 // Remove the trailing comma and add the WHERE clause
 query = query.slice(0, -1); // Remove the last comma
 query += ` WHERE id = ?;`; // Add the WHERE clause

 // Push the id to queryParams array
 queryParams.push(id);

 // Execute the query
 misdb.query(query, queryParams, (err, result) => {
   if (err) {
     console.error("Error updating rate:", err);
     res
       .status(500)
       .json({ error: "An error occurred while updating business rate" });
   } else {
     res.status(200).json({ message: "Rate updated successfully", id: id });
   }
 });
});

app.post("/createbusinessrate", (req, res) => {
 const { ScanRate, QcRate, IndexRate, FlagRate, CbslQaRate, ClientQcRate, LocationId } = req.body;


 // Ensure all rates are numbers and default to 0 if not provided
 const scanRate = parseFloat(ScanRate) || 0;
 const qcRate = parseFloat(QcRate) || 0;
 const indexRate = parseFloat(IndexRate) || 0;
 const flagRate = parseFloat(FlagRate) || 0;
 const cbslQaRate = parseFloat(CbslQaRate) || 0;
 const clientQcRate = parseFloat(ClientQcRate) || 0;
 

 const query = "INSERT INTO tbl_set_business (ScanRate, QcRate, IndexRate, FlagRate, CbslQaRate, ClientQcRate, LocationId) VALUES (?, ?, ?, ?, ?, ?, ?)";

 misdb.query(query, [scanRate, qcRate, indexRate, flagRate, cbslQaRate, clientQcRate, LocationId], (err, result) => {
     if (err) {
         console.error("Error creating business rate:", err);
         res.status(500).json({ error: "An error occurred while creating business rate" });
     } else {
         console.log("Business rate created successfully:", result);
         res.status(200).json({ message: "Rate created successfully" });
     }
 });
});


app.post("/createproject", (req, res) => {
  const { ProjectName } =
    req.body;

  const query =
    "INSERT INTO tbl_projectmaster (ProjectName) VALUES (?)";

  commonDB.query(
    query,
    [ProjectName],
    (err, result) => {
      if (err) {
        console.error("Error creating Project:", err);
        res
          .status(500)
          .json({ error: "An error occurred while Project" });
      } else {
        console.log("Project created successfully:", result);
        res.status(200).json({ message: "Project created successfully" });
      }
    }
  );
});

app.get("/getproject", (req, res) => {
  commonDB.query("select * from tbl_projectmaster ", (err, results) => {
    if (err) {
      throw err;
    }
    res.json(results);
  });
});

app.put('/updateproject/:id', (req, res) => {
  const id = req.params.id;
  const {ProjectName } = req.body;
  const query = "UPDATE tbl_projectmaster SET ProjectName = ? WHERE id = ?";

  commonDB.query(query, [ProjectName, id], (err, result) => {
    if (err) {
      console.error("Error updating Project name:", err);
      res.status(500).json({ error: "An error occurred while updating Project name" });
    } else {
      if (result.affectedRows === 0) {
        res.status(404).json({ error: "Project not found" });
      } else {
        console.log("Project name updated successfully. Project ID:", id);
        res.status(200).json({ message: "Project name updated successfully", id: id });
      }
    }
  });
});

app.delete("/deleteproject/:id", (req, res) => {
  const { id} = req.params;
  commonDB.query(
    "DELETE FROM tbl_projectmaster WHERE id = ?",
    [id],
    (err) => {
      if (err) throw err;
      res.json({ message: "Project deleted successfully" });
    }
  );
});

app.post("/createtask", (req, res) => {
  const { TaskName } =
    req.body;

  const query =
    "INSERT INTO tbl_taskmaster (TaskName) VALUES (?)";

  commonDB.query(
    query,
    [TaskName],
    (err, result) => {
      if (err) {
        console.error("Error creating Task:", err);
        res
          .status(500)
          .json({ error: "An error occurred while Task" });
      } else {
        console.log("Task created successfully:", result);
        res.status(200).json({ message: "Task created successfully" });
      }
    }
  );
});

app.get("/commonReport", (req, res) => {
  commonDB.query("select * from tbl_common_report ", (err, results) => {
    if (err) {
      throw err;
    }
    res.json(results);
  });
});

app.get("/gettask", (req, res) => {
  commonDB.query("select * from tbl_taskmaster ", (err, results) => {
    if (err) {
      throw err;
    }
    res.json(results);
  });
});

app.put('/updatetask/:id', (req, res) => {
  const id = req.params.id;
  const {TaskName } = req.body;
  const query = "UPDATE tbl_taskmaster SET TaskName = ? WHERE id = ?";

  commonDB.query(query, [TaskName, id], (err, result) => {
    if (err) {
      console.error("Error updating Task name:", err);
      res.status(500).json({ error: "An error occurred while updating Task name" });
    } else {
      if (result.affectedRows === 0) {
        res.status(404).json({ error: "Task not found" });
      } else {
        console.log("Task name updated successfully. Task ID:", id);
        res.status(200).json({ message: "Task name updated successfully", id: id });
      }
    }
  });
});

app.delete("/deletetask/:id", (req, res) => {
  const { id} = req.params;
  commonDB.query(
    "DELETE FROM tbl_taskmaster WHERE id = ?",
    [id],
    (err) => {
      if (err) throw err;
      res.json({ message: "task deleted successfully" });
    }
  );
});

app.post("/createstaff", (req, res) => {
  const { ProjectId, LocationId, Date, StaffName, TaskName, Volume } = req.body;

  const query =
    "INSERT INTO tbl_nontech_staff (ProjectId, LocationId, Date, StaffName, TaskName, Volume) VALUES (?, ?, ?, ?, ?, ?)";

  commonDB.query(
    query,
    [ProjectId, LocationId, Date, StaffName, TaskName, Volume],
    (err, result) => {
      if (err) {
        console.error("Error creating non-tech staff:", err);
        res.status(500).json({ error: "An error occurred while creating non-tech staff" });
      } else {
        console.log("Non-tech staff created successfully:", result);
        res.status(200).json({ message: "Non-tech staff created successfully" });
      }
    }
  );
});

app.get("/getstaff", (req, res) => {
  const { locationName } = req.query;
  
  let query = `
    SELECT n.*, l.LocationId, l.LocationName
    FROM tbl_nontech_staff AS n
    JOIN locationmaster AS l ON n.LocationId = l.LocationId
  `;
  
  if (locationName) {
    query += ` WHERE l.LocationName = ?`;
  }
  
  commonDB.query(query, [locationName], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

app.put('/updatestaff/:id', (req, res) => {
  const id = req.params.id;
  const {ProjectId,LocationId,Date,StaffName,TaskName,Volume } = req.body;
  const query = "UPDATE tbl_taskmaster SET ProjectId=?,LocationId=?,Date=?,StaffName=? TaskName = ? Volume=? WHERE id = ?";

  commonDB.query(query, [ProjectId,LocationId,Date,StaffName,TaskName,Volume, id], (err, result) => {
    if (err) {
      console.error("Error updating nontech staff name:", err);
      res.status(500).json({ error: "An error occurred while updating nontech staff name" });
    } else {
      if (result.affectedRows === 0) {
        res.status(404).json({ error: "nontech staff not found" });
      } else {
        console.log("nontech staff name updated successfully. nontech staff ID:", id);
        res.status(200).json({ message: "nontech staff name updated successfully", id: id });
      }
    }
  });
});

app.delete("/deletestaff/:id", (req, res) => {
  const { id} = req.params;
  commonDB.query(
    "DELETE FROM tbl_nontech_staff WHERE id = ?",
    [id],
    (err) => {
      if (err) throw err;
      res.json({ message: "staff deleted successfully" });
    }
  );
});
