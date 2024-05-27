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
  port: "3307",
  user: "root",
  password: "root",
  database: "updc_misdb",
});
const commonDB =  mysql.createConnection({
  host: "localhost",
  port: "3307",
  user: "root",
  password: "root",
  database: "commondb",
});

const telnganaDB =  mysql.createConnection({
  host: "192.168.3.48",
  port: "3306",
  user: "umesh",
  password: "admin@123",
  database: "ezeefile_updc",
});

const KarnatakaDB =  mysql.createConnection({
  host: "192.168.3.48",
  port: "3306",
  user: "umesh",
  password: "admin@123",
  database: "karnataka_misdb",
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
 
 commonDB.query(query, (err, results) => {
   if (err) {
     throw err;
   }
   res.json(results);
 });
});

app.get("/updcSummary", (req, res) => {
  const query1 = `
    SELECT 
      sum(t.Counting) as 'Counting', sum(Inventory) as 'Inventory', 
      sum(DocPreparation) as 'DocPreparation', sum(guard) as 'Guard' 
    FROM tbl_nontech_staff t`;
  const query2 = `
    SELECT 
      sum(s.scanimages) as 'Scanned', sum(qcimages) as 'QC',
      sum(flaggingimages) as 'Flagging', sum(indeximages) as 'Indexing',
      sum(cbslqaimages) as 'CBSL_QA', sum(clientqaacceptimages) as 'Client_QC' 
    FROM scanned s`;

  

  mysql22.query(query1, (err1, results1) => {
    if (err1) {
      console.error("Error fetching summary data:", err1);
      res.status(500).json({ error: "Error fetching summary data" });
      return;
    }

    // Execute the second query after the first one is complete
    mysql22.query(query2, (err2, results2) => {
      if (err2) {
        console.error("Error fetching summary data:", err2);
        res.status(500).json({ error: "Error fetching summary data" });
        return;
      }

      // Combine both results and send the response
      const combinedResults = { NonTech: results1, Tech: results2 };
      res.json(combinedResults);
    });
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
    whereClause = `WHERE locationname IN ('${locationNames.join("','")}')`;
  }


  let dateClause = "";


  if (startDate && endDate) {
    dateClause = whereClause ? `AND` : `WHERE`;
    dateClause += ` (inventorydate BETWEEN '${startDate}' AND '${endDate}'
                OR scandate BETWEEN '${startDate}' AND '${endDate}'
                OR qcdate BETWEEN '${startDate}' AND '${endDate}'
                OR flaggingdate BETWEEN '${startDate}' AND '${endDate}'
                OR indexdate BETWEEN '${startDate}' AND '${endDate}'
                OR cbslqadate BETWEEN '${startDate}' AND '${endDate}'
                OR exportdate BETWEEN '${startDate}' AND '${endDate}'
                OR clientqaacceptdate BETWEEN '${startDate}' AND '${endDate}'
                OR digisigndate BETWEEN '${startDate}' AND '${endDate}')`;
  }


  const query = `
  SELECT 
  sum(scanimages) as 'Scanned',sum(qcimages) as 'QC',
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
  
  mysql22.query(query, [locationName], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});


/////////////////////////////////////////////////////////////API FOR TELANGANA COURTS DATA////////////////////////////////////////////////////////////
app.get("/telgetbusinessrate", (req, res) => {
  const query = `
   SELECT b.*, l.LocationId, l.LocationName
   FROM tbl_set_business AS b
   JOIN locationmaster AS l ON b.LocationId = l.LocationId
 `;
 
 commonDB.query(query, (err, results) => {
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
app.get("/telSummary", (req, res) => {
  const query1 = `
    SELECT 
      sum(t.Counting) as 'Counting', sum(Inventory) as 'Inventory', 
      sum(DocPreparation) as 'DocPreparation', sum(guard) as 'Guard' 
    FROM tbl_nontech_staff t`;
  const query2 = `
    SELECT 
      sum(s.scanimages) as 'Scanned', sum(qcimages) as 'QC',
      sum(flaggingimages) as 'Flagging', sum(indeximages) as 'Indexing',
      sum(cbslqaimages) as 'CBSL_QA', sum(clientqaacceptimages) as 'Client_QC' 
    FROM scanned s`;

  

  misdb.query(query1, (err1, results1) => {
    if (err1) {
      console.error("Error fetching summary data:", err1);
      res.status(500).json({ error: "Error fetching summary data" });
      return;
    }

    // Execute the second query after the first one is complete
    misdb.query(query2, (err2, results2) => {
      if (err2) {
        console.error("Error fetching summary data:", err2);
        res.status(500).json({ error: "Error fetching summary data" });
        return;
      }

      // Combine both results and send the response
      const combinedResults = { NonTech: results1, Tech: results2 };
      res.json(combinedResults);
    });
  });
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

app.get("/telgetstaff", (req, res) => {
  const { locationName } = req.query;
  
  let query = `
    SELECT n.*, l.LocationId, l.LocationName
    FROM tbl_nontech_staff AS n
    JOIN locationmaster AS l ON n.LocationId = l.LocationId
  `;
  
  if (locationName) {
    query += ` WHERE l.LocationName = ?`;
  }
  
  misdb.query(query, [locationName], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
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
////////////////////////////////////////////////////////////API FOR Karnataka COURTS DATA////////////////////////////////////////////////////////////
app.get("/kargetbusinessrate", (req, res) => {
  const query = `
   SELECT b.*, l.LocationId, l.LocationName
   FROM tbl_set_business AS b
   JOIN locationmaster AS l ON b.LocationId = l.LocationId
 `;
 
commonDB.query(query, (err, results) => {
   if (err) {
     throw err;
   }
   res.json(results);
 });
});
app.get("/kargetstaff", (req, res) => {
  const { locationName } = req.query;
  
  let query = `
    SELECT n.*, l.LocationId, l.LocationName
    FROM tbl_nontech_staff AS n
    JOIN locationmaster AS l ON n.LocationId = l.LocationId
  `;
  
  if (locationName) {
    query += ` WHERE l.LocationName = ?`;
  }
  
 kardb.query(query, [locationName], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
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

app.get("/karSummary", (req, res) => {
  const query1 = `
    SELECT 
      sum(t.Counting) as 'Counting', sum(Inventory) as 'Inventory', 
      sum(DocPreparation) as 'DocPreparation', sum(guard) as 'Guard' 
    FROM tbl_nontech_staff t`;
  const query2 = `
    SELECT 
      sum(s.scanimages) as 'Scanned', sum(qcimages) as 'QC',
      sum(flaggingimages) as 'Flagging', sum(indeximages) as 'Indexing',
      sum(cbslqaimages) as 'CBSL_QA', sum(clientqaacceptimages) as 'Client_QC' 
    FROM scanned s`;

  

  kardb.query(query1, (err1, results1) => {
    if (err1) {
      console.error("Error fetching summary data:", err1);
      res.status(500).json({ error: "Error fetching summary data" });
      return;
    }

    // Execute the second query after the first one is complete
    kardb.query(query2, (err2, results2) => {
      if (err2) {
        console.error("Error fetching summary data:", err2);
        res.status(500).json({ error: "Error fetching summary data" });
        return;
      }

      // Combine both results and send the response
      const combinedResults = { NonTech: results1, Tech: results2 };
      res.json(combinedResults);
    });
  });
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



////////////////////////////////////////////////Common

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
 commonDB.query(query, queryParams, (err, result) => {
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

 commonDB.query(query, [scanRate, qcRate, indexRate, flagRate, cbslQaRate, clientQcRate, LocationId], (err, result) => {
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

app.post("/createuser", (req, res) => {
  const data = req.body;
  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      console.error("Error generating salt:", err);
      return res
        .status(500)
        .json({ error: "An error occurred while encrypting password" });
    }

    bcrypt.hash(data.password, salt, (err, hashedPassword) => {
      if (err) {
        console.error("Error hashing password:", err);
        return res
          .status(500)
          .json({ error: "An error occurred while encrypting password" });
      }

      data.password = hashedPassword;
      const selectQuery = "SELECT * FROM tbl_user_master WHERE user_email_id=?";
      commonDB.query(selectQuery, [data.user_email_id], (err, rows) => {
        if (err) {
          console.error("Error checking user existence:", err);
          return res
            .status(500)
            .json({ error: "An error occurred while checking user existence" });
        }

        if (rows.length > 0) {
          return res.status(500).json({ error: "User already exists" });
        }
        const currentDateTime = new Date()
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
        const query1 =
          "INSERT INTO tbl_user_master (user_email_id,first_name,middle_name,last_name,password,designation,phone_no,profile_picture,superior_name,superior_email,user_created_date,emp_id,last_pass_change,login_disabled_date,fpi_template, fpi_template_two,fpi_template_three,fpi_template_four,lang,locations,user_type,projects) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        commonDB.query(
          query1,
          [
            data.user_email_id,
            data.first_name,
            data.middle_name,
            data.last_name,
            data.password,
            data.designation,
            data.phone_no,
            data.profile_picture,
            data.superior_name,
            data.superior_email,
            currentDateTime,
            data.emp_id,
            data.last_pass_change,
            data.login_disabled_date,
            data.fpi_template,
            data.fpi_template_two,
            data.fpi_template_three,
            data.fpi_template_four,
            data.lang,
            data.locations,
            data.user_type,
            data.projects,
          ],
          (err, results) => {
            if (err) {
              console.error("Error inserting user:", err);
              return res
                .status(500)
                .json({ error: "An error occurred while inserting user" });
            }
            const user_id = results.insertId;
            const query2 =
              "INSERT INTO tbl_storagelevel_to_permission (user_id, sl_id) VALUES (?, ?)";
            commonDB.query(query2, [user_id, data.sl_id], (err, results) => {
              if (err) {
                console.error("Error linking user with permission:", err);
                return res
                  .status(500)
                  .json({
                    error:
                      "An error occurred while linking user with permission",
                  });
              }
              const query3 =
                "INSERT INTO tbl_ezeefile_logs (user_id, user_name, action_name, start_date, system_ip, remarks) VALUES (?, ?, ?, ?, ?, ?)";
              commonDB.query(
                query3,
                [
                  user_id,
                  data.user_name,
                  data.action_name,
                  data.start_date,
                  data.system_ip,
                  data.remarks,
                ],
                (err, results) => {
                  if (err) {
                    console.error("Error inserting user log:", err);
                    return res
                      .status(500)
                      .json({
                        error: "An error occurred while inserting user log",
                      });
                  }
                  // First, perform a SELECT query to check if a row with the provided role_id exists
                  const selectQueryRole =
                    "SELECT * FROM tbl_bridge_role_to_um WHERE role_id = ?";
                  commonDB.query(
                    selectQueryRole,
                    [data.role_id],
                    (err, rowsRole) => {
                      if (err) {
                        console.error("Error checking role existence:", err);
                        return res
                          .status(500)
                          .json({
                            error:
                              "An error occurred while checking role existence",
                          });
                      }
                      if (rowsRole.length > 0) {
                        // If a row with the role_id exists, update the user_ids
                        const updateQueryRole =
                          "UPDATE tbl_bridge_role_to_um SET user_ids = CONCAT(user_ids, ', ', ?) WHERE role_id = ?";
                        commonDB.query(
                          updateQueryRole,
                          [user_id, data.role_id],
                          (err, resultsRole) => {
                            if (err) {
                              console.error("Error updating user role:", err);
                              return res
                                .status(500)
                                .json({
                                  error:
                                    "An error occurred while updating user role",
                                });
                            }
                          }
                        );
                      } else {
                        // If a row with the role_id does not exist, insert a new row
                        const insertQueryRole =
                          "INSERT INTO tbl_bridge_role_to_um (role_id, user_ids) VALUES (?, ?)";
                        commonDB.query(
                          insertQueryRole,
                          [data.role_id, user_id],
                          (err, resultsRole) => {
                            if (err) {
                              console.error("Error inserting user role:", err);
                              return res
                                .status(500)
                                .json({
                                  error:
                                    "An error occurred while inserting user role",
                                });
                            }
                          }
                        );
                      }
                      // First, perform a SELECT query to check if the row exists
                      const selectQueryGroup =
                        "SELECT * FROM tbl_bridge_grp_to_um WHERE group_id = ?";
                      commonDB.query(
                        selectQueryGroup,
                        [data.group_id],
                        (err, rowsGroup) => {
                          if (err) {
                            console.error(
                              "Error checking group existence:",
                              err
                            );
                            return res
                              .status(500)
                              .json({
                                error:
                                  "An error occurred while checking group existence",
                              });
                          }
                          if (rowsGroup.length > 0) {
                            const updateQueryGroup =
                              "UPDATE tbl_bridge_grp_to_um SET user_ids = CONCAT(user_ids, ', ', ?), roleids = CONCAT(roleids, ', ', ?) WHERE group_id = ?";
                            commonDB.query(
                              updateQueryGroup,
                              [user_id, data.role_id, data.group_id],
                              (err, resultsGroup) => {
                                if (err) {
                                  console.error(
                                    "Error updating user group:",
                                    err
                                  );
                                  return res
                                    .status(500)
                                    .json({
                                      error:
                                        "An error occurred while updating user group",
                                    });
                                }
                              }
                            );
                          } else {
                            const insertQueryGroup =
                              "INSERT INTO tbl_bridge_grp_to_um (group_id, user_ids, roleids) VALUES (?, ?, ?)";
                            commonDB.query(
                              insertQueryGroup,
                              [data.group_id, user_id, data.role_id],
                              (err, resultsGroup) => {
                                if (err) {
                                  console.error(
                                    "Error inserting user group:",
                                    err
                                  );
                                  return res
                                    .status(500)
                                    .json({
                                      error:
                                        "An error occurred while inserting user group",
                                    });
                                }
                              }
                            );
                          }
                          

                          res
                            .status(200)
                            .json({
                              message: "User added successfully",
                              id: user_id,
                            });
                        }
                      );
                    }
                  );
                }
              );
            });
          }
        );
      });
    });
  });
});
app.get("/group_master", (req, res) => {
  mysql22.query(
    "select group_id,group_name from tbl_group_master order by group_name asc;",
    (err, results) => {
      if (err) {
        throw err;
      }
      res.json(results);
    }
  );
});

app.get("/privilege", (req, res) => {
  mysql22.query(
    "select role_id,user_role from tbl_user_roles order by user_role asc;",
    (err, results) => {
      if (err) {
        throw err;
      }
      res.json(results);
    }
  );
});

app.get("/storage", (req, res) => {
  mysql22.query("select * from tbl_storage_level", (err, results) => {
    if (err) {
      throw err;
    }
    res.json(results);
  });
});

app.get("/reporting", (req, res) => {
  mysql22.query(
    "select * from tbl_user_master where user_id  and active_inactive_users='1' order by first_name,last_name asc;",
    (err, results) => {
      if (err) {
        throw err;
      }
      res.json(results);
    }
  );
});

app.post("/login", (req, res) => {
  const { user_email_id, password } = req.body;
  const selectQuery = "SELECT * FROM tbl_user_master WHERE user_email_id=?";

  misdb.query(selectQuery, [user_email_id], (err, rows) => {
    if (err) {
      console.error("Error checking user existence:", err);
      return res
        .status(500)
        .json({ error: "An error occurred while checking user existence" });
    }
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const userData = rows[0];
    const hashedPassword = userData.password;
    bcrypt.compare(password, hashedPassword, (err, result) => {
      if (err) {
        console.error("Error comparing passwords:", err);
        return res
          .status(500)
          .json({ error: "An error occurred while comparing passwords" });
      }
      if (result) {
        const updateQuery =
          "UPDATE tbl_user_master SET last_active_login = NOW() WHERE user_email_id = ?";
        misdb.query(updateQuery, [user_email_id], (err) => {
          if (err) {
            console.error("Error updating last_active_login:", err);
            return res
              .status(500)
              .json({
                error: "An error occurred while updating last_active_login",
              });
          }
          const selectRolesQuery = `
          SELECT u.*, r.user_role 
          FROM tbl_user_master u
          LEFT JOIN tbl_bridge_role_to_um br ON FIND_IN_SET(u.user_id, REPLACE(br.user_ids, ' ','')) > 0
          LEFT JOIN tbl_user_roles r ON br.role_id = r.role_id
          WHERE u.user_email_id = ?
        `;
          misdb.query(selectRolesQuery, [user_email_id], (err, roleRows) => {
            if (err) {
              console.error("Error fetching user role:", err);
              return res
                .status(500)
                .json({ error: "An error occurred while fetching user role" });
            }
            if (roleRows.length === 0) {
              return res.status(404).json({ error: "User role not found" });
            }
            const user_roles = roleRows.map((row) => row.user_role);
            const { user_id, first_name, last_active_login } = userData;
            return res
              .status(200)
              .json({
                message: "Login successful",
                user_id,
                first_name,
                last_active_login,
                user_roles,
              });
          });
        });
      } else {
        return res.status(401).json({ error: "Invalid password" });
      }
    });
  });
});


//Updc All Cummulative Api

app.get("/summaryreportcummulative", (req, res) => {
  let locationNames = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;

  if (!locationNames || (Array.isArray(locationNames) && locationNames.length === 0)) {
    locationNames = null;
  } else {
    if (!Array.isArray(locationNames)) {
      locationNames = [locationNames];
    }
  }

  let whereClause = "";
  if (locationNames) {
    whereClause = `WHERE locationname IN ('${locationNames.join("','")}')`;
  }

  let dateClause = "";
  if (startDate && endDate) {
    dateClause = whereClause ? `AND` : `WHERE`;
    dateClause += ` (inventorydate BETWEEN '${startDate}' AND '${endDate}'
                OR scandate BETWEEN '${startDate}' AND '${endDate}'
                OR qcdate BETWEEN '${startDate}' AND '${endDate}'
                OR flaggingdate BETWEEN '${startDate}' AND '${endDate}'
                OR indexdate BETWEEN '${startDate}' AND '${endDate}'
                OR cbslqadate BETWEEN '${startDate}' AND '${endDate}'
                OR exportdate BETWEEN '${startDate}' AND '${endDate}'
                OR clientqaacceptdate BETWEEN '${startDate}' AND '${endDate}'
                OR digisigndate BETWEEN '${startDate}' AND '${endDate}')`;
  }

  const scannedQuery = `
  SELECT 
  sum(scanimages) as 'Scanned',
  sum(qcimages) as 'QC',
  sum(flaggingimages) as 'Flagging',
  sum(indeximages) as 'Indexing',
  sum(cbslqaimages) as 'CBSL_QA',
  sum(clientqaacceptimages) as 'Client_QC' 
  FROM scanned s
  ${whereClause}
  ${dateClause}
  ;`;

  let nonTechWhereClause = "";
  if (locationNames) {
    nonTechWhereClause = `WHERE lm.LocationName IN ('${locationNames.join("','")}')`;
  }

  let nonTechDateClause = "";
  if (startDate && endDate) {
    nonTechDateClause = nonTechWhereClause ? `AND` : `WHERE`;
    nonTechDateClause += ` ns.Date BETWEEN '${startDate}' AND '${endDate}'`;
  }

  const nonTechQuery = `
  SELECT 
  sum(Counting) as 'Counting', 
  sum(Inventory) as 'Inventory',
  sum(DocPreparation) as 'DocPreparation',
  sum(Guard) as 'Guard'
  FROM tbl_nontech_staff ns
  ${nonTechWhereClause}
  ${nonTechDateClause}
  ;
  `;

  mysql22.query(scannedQuery, (err, scannedResults) => {
    if (err) {
      console.error("Error fetching scanned summary data:", err);
      res.status(500).json({ error: "Error fetching scanned summary data" });
      return;
    }

    commonDB.query(nonTechQuery, (err, nonTechResults) => {
      if (err) {
        console.error("Error fetching non-tech summary data:", err);
        res.status(500).json({ error: "Error fetching non-tech summary data" });
        return;
      }

      const result = {
        ...scannedResults[0],
        ...nonTechResults[0]
      };

      res.json(result);
    });
  });
});


app.get("/detailedreportcummulative", (req, res) => {
  let locationName = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;

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

  const scannedQuery = `
  SELECT 
    s.locationname AS 'LocationName',
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
    s.locationname;`;

  let nonTechWhereClause = "";
  if (locationName) {
    nonTechWhereClause = `WHERE lm.LocationName IN ('${locationName.join("','")}')`;
  }

  let nonTechDateClause = "";
  if (startDate && endDate) {
    nonTechDateClause = nonTechWhereClause ? `AND` : `WHERE`;
    nonTechDateClause += ` ns.Date BETWEEN '${startDate}' AND '${endDate}'`;
  }

  const nonTechQuery = `
  SELECT 
    lm.LocationName AS 'LocationName',
    SUM(ns.Counting) AS 'Counting', 
    SUM(ns.Inventory) AS 'Inventory',
    SUM(ns.DocPreparation) AS 'DocPreparation',
    SUM(ns.Guard) AS 'Guard'
  FROM 
    tbl_nontech_staff ns
  INNER JOIN 
    locationmaster lm ON ns.LocationID = lm.LocationID
  ${nonTechWhereClause}
  ${nonTechDateClause}
  GROUP BY
    lm.LocationName;`;

  mysql22.query(scannedQuery, (err, scannedResults) => {
    if (err) {
      console.error("Error fetching scanned summary data:", err);
      res.status(500).json({ error: "Error fetching scanned summary data" });
      return;
    }

    commonDB.query(nonTechQuery, (err, nonTechResults) => {
      if (err) {
        console.error("Error fetching non-tech summary data:", err);
        res.status(500).json({ error: "Error fetching non-tech summary data" });
        return;
      }

      // Normalize location names for easier matching
      const normalizeName = name => name.toLowerCase().trim();

      // Create a map for non-tech data keyed by normalized location name
      const nonTechMap = {};
      nonTechResults.forEach(nonTech => {
        const normalizedNonTechName = normalizeName(nonTech.LocationName);
        nonTechMap[normalizedNonTechName] = nonTech;
      });

      // Merge the results
      const mergedResults = scannedResults.map(scanned => {
        const normalizedScannedName = normalizeName(scanned.LocationName);
        
        // Attempt to find the closest matching non-tech location
        const matchingNonTech = Object.keys(nonTechMap).find(nonTechName => 
          normalizedScannedName.includes(nonTechName) || nonTechName.includes(normalizedScannedName)
        );
        
        if (matchingNonTech) {
          return { ...scanned, ...nonTechMap[matchingNonTech] };
        }
        
        return scanned;
      });

      // Add non-tech locations that don't have corresponding scanned data
      Object.keys(nonTechMap).forEach(nonTechName => {
        if (!mergedResults.find(result => normalizeName(result.LocationName).includes(nonTechName))) {
          mergedResults.push(nonTechMap[nonTechName]);
        }
      });

      res.json(mergedResults);
    });
  });
});

app.get("/alldetailedreportlocationwise", (req, res) => {
  let locationName = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate || new Date().toISOString().split('T')[0];

  console.log("Received locationName:", locationName); // Log locationName

  // Ensure locationName is an array if provided
  if (!Array.isArray(locationName)) {
    locationName = [locationName];
  }

  let whereClause = "";
  
  // Build WHERE clause if locationName is provided
  if (locationName.length > 0 && locationName[0]) {
    whereClause = `WHERE locationname IN ('${locationName}')`;
  }

  const scannedQuery = `
    SELECT 
      scanned.locationname AS 'locationName',
      scanned.user AS 'user_type',
      SUM(CASE WHEN user_type = 'scan' THEN scanimages ELSE 0 END) AS Scanned,
      SUM(CASE WHEN user_type = 'qc' THEN qcimages ELSE 0 END) AS QC,
      SUM(CASE WHEN user_type = 'flagging' THEN flaggingimages ELSE 0 END) AS Flagging,
      SUM(CASE WHEN user_type = 'index' THEN indeximages ELSE 0 END) AS Indexing,
      SUM(CASE WHEN user_type = 'cbslqa' THEN cbslqaimages ELSE 0 END) AS CBSL_QA,
      SUM(CASE WHEN user_type = 'clientqaaccept' THEN clientqaacceptimages ELSE 0 END) AS Client_QC
    FROM 
      (
        SELECT 
          scanned.locationname, 
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
          scanned.locationname, 
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
          scanned.locationname, 
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
          scanned.locationname, 
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
          scanned.locationname, 
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
          scanned.locationname, 
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
      ) AS scanned
    GROUP BY 
      scanned.locationname, 
      scanned.user;
  `;

  const nonTechQuery = `
    SELECT 
      locationmaster.LocationName AS 'locationName',
      tbl_nontech_staff.StaffName AS 'user_type',
      SUM(tbl_nontech_staff.Counting) AS 'Counting', 
      SUM(tbl_nontech_staff.Inventory) AS 'Inventory',
      SUM(tbl_nontech_staff.DocPreparation) AS 'DocPreparation',
      SUM(tbl_nontech_staff.Guard) AS 'Guard'
    FROM 
      tbl_nontech_staff
    INNER JOIN 
      locationmaster ON tbl_nontech_staff.LocationID = locationmaster.LocationID
    ${whereClause} AND DATE(Date) BETWEEN '${startDate}' AND '${endDate}'
    GROUP BY 
      locationmaster.LocationName, 
      tbl_nontech_staff.StaffName;
  `;

  mysql22.query(scannedQuery, (err, scannedResults) => {
    if (err) {
      console.error("Error fetching scanned summary data:", err);
      res.status(500).json({ error: "Error fetching scanned summary data" });
      return;
    }

    commonDB.query(nonTechQuery, (err, nonTechResults) => {
      if (err) {
        console.error("Error fetching non-tech summary data:", err);
        res.status(500).json({ error: "Error fetching non-tech summary data" });
        return;
      }

      const combinedResults = [...scannedResults, ...nonTechResults];
      res.json(combinedResults);
    });
  });
});

app.get("/alluserdetailedreportlocationwise", (req, res) => {
  let username = req.query.username;
  let locationName = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate || new Date().toISOString().split('T')[0];

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
  
  const nonTechQuery = `
    SELECT 
      locationmaster.LocationName AS 'locationName',
      tbl_nontech_staff.StaffName AS 'user_type',
      DATE_FORMAT(DATE, '%Y-%m-%d') AS Date,
      SUM(tbl_nontech_staff.Counting) AS 'Counting', 
      SUM(tbl_nontech_staff.Inventory) AS 'Inventory',
      SUM(tbl_nontech_staff.DocPreparation) AS 'DocPreparation',
      SUM(tbl_nontech_staff.Guard) AS 'Guard'
    FROM 
      tbl_nontech_staff
    INNER JOIN 
      locationmaster ON tbl_nontech_staff.LocationID = locationmaster.LocationID
    WHERE
      locationmaster.LocationName IN ('${locationName.join("','")}') 
      AND tbl_nontech_staff.StaffName = '${username}' 
      AND DATE(Date) BETWEEN '${startDate}' AND '${endDate}'
    GROUP BY 
      locationmaster.LocationName, 
      tbl_nontech_staff.StaffName,
      DATE
    ORDER BY 
      DATE ASC;
  `;

  mysql22.query(query, (err, scannedResults) => {
    if (err) {
      console.error("Error fetching scanned summary data:", err);
      res.status(500).json({ error: "Error fetching scanned summary data" });
      return;
    }

    commonDB.query(nonTechQuery, (err, nonTechResults) => {
      if (err) {
        console.error("Error fetching non-tech summary data:", err);
        res.status(500).json({ error: "Error fetching non-tech summary data" });
        return;
      }

      const combinedResults = [...scannedResults, ...nonTechResults];
      res.json(combinedResults);
    });
  });
});

app.get('/detailedreportcummulativecsv', (req, res) => {
  let locationNames = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;

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
      COALESCE(SUM(s.scanimages), 0) as 'ScannedImages',
      COALESCE(SUM(s.qcimages), 0) as 'QCImages',
      COALESCE(SUM(s.indeximages), 0) as 'IndexingImages',
      COALESCE(SUM(s.flaggingimages), 0) as 'FlaggingImages',
      COALESCE(SUM(s.cbslqaimages), 0) as 'CBSL_QAImages',
      COALESCE(SUM(s.clientqaacceptimages), 0) as 'Client_QA_AcceptedImages'
    FROM 
      scanned s
    ${whereClause}
    ${dateClause}
    GROUP BY 
      s.locationname`;


      let nonTechWhereClause = "";
  if (locationNames) {
    nonTechWhereClause = `WHERE lm.LocationName IN ('${locationNames.join("','")}')`;
  }

  let nonTechDateClause = "";
  if (startDate && endDate) {
    nonTechDateClause = nonTechWhereClause ? `AND` : `WHERE`;
    nonTechDateClause += ` ns.Date BETWEEN '${startDate}' AND '${endDate}'`;
  }

  const nonTechQuery = `
    SELECT 
      lm.LocationName AS 'LocationName',
      COALESCE(SUM(ns.Counting), 0) AS 'Counting', 
      COALESCE(SUM(ns.Inventory), 0) AS 'Inventory',
      COALESCE(SUM(ns.DocPreparation), 0) AS 'DocPreparation',
      COALESCE(SUM(ns.Guard), 0) AS 'Guard'
    FROM 
      tbl_nontech_staff ns
    INNER JOIN 
      locationmaster lm ON ns.LocationID = lm.LocationID 
      ${nonTechWhereClause}
      ${nonTechDateClause}
    GROUP BY
      lm.LocationName`;

  mysql22.query(getCsv, (error, scannedResult) => {
    if (error) {
      console.error("Error occurred when exporting CSV:", error);
      res.status(500).json({ error: "An error occurred while exporting the CSV file" });
      return;
    }

    commonDB.query(nonTechQuery, (error, nonTechResult) => {
      if (error) {
        console.error("Error occurred when exporting CSV:", error);
        res.status(500).json({ error: "An error occurred while exporting the CSV file" });
        return;
      }

      const scannedData = scannedResult && scannedResult.length > 0 ? scannedResult : [];
      const nonTechData = nonTechResult && nonTechResult.length > 0 ? nonTechResult : [];

      if (scannedData.length === 0 && nonTechData.length === 0) {
        res.status(404).json({ error: "No data found for the provided parameters" });
        return;
      }

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment;filename=All_location.csv");
      res.write("Sr. No.,Location,ScannedImages,QCImages,IndexingImages,FlaggingImages,CBSL_QAImages,Client_QA_AcceptedImages,Counting,Inventory,DocPreparation,Guard\n");

      // Write CSV data
      scannedData.forEach((row, index) => {
        const nonTechRow= nonTechData.find(item => item.LocationName === row.locationname);
        res.write(`${index + 1},${row.locationname},${row.ScannedImages},${row.QCImages},${row.IndexingImages},${row.FlaggingImages},${row.CBSL_QAImages},${row.Client_QA_AcceptedImages},${nonTechRow ? nonTechRow.Counting : 0},${nonTechRow ? nonTechRow.Inventory : 0},${nonTechRow ? nonTechRow.DocPreparation : 0},${nonTechRow ? nonTechRow.Guard : 0}\n`);
      });

      res.end();
    });
  });
});

app.get("/alldetailedreportlocationwisecsv", (req, res) => {
  let locationName = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate || new Date().toISOString().split('T')[0];
 
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

  let fileName = `${locationName.join("_")}.csv`;

  const scannedResult = `
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

  let nonTechWhereClause = "";
  if (locationName) {
    nonTechWhereClause = `WHERE locationmaster.LocationName IN ('${locationName.join("','")}')`;
  }

  let nonTechDateClause = "";
  if (startDate && endDate) {
    nonTechDateClause = nonTechWhereClause ? `AND` : `WHERE`;
    nonTechDateClause += ` tbl_nontech_staff.Date BETWEEN '${startDate}' AND '${endDate}'`;
  }

  const nonTechQuery = `
  SELECT 
    locationmaster.LocationName AS 'locationName',
    tbl_nontech_staff.StaffName AS 'user_type',
    SUM(tbl_nontech_staff.Counting) AS 'Counting', 
    SUM(tbl_nontech_staff.Inventory) AS 'Inventory',
    SUM(tbl_nontech_staff.DocPreparation) AS 'DocPreparation',
    SUM(tbl_nontech_staff.Guard) AS 'Guard'
  FROM 
    tbl_nontech_staff
  INNER JOIN 
    locationmaster ON tbl_nontech_staff.LocationID = locationmaster.LocationID
  ${nonTechWhereClause}
  ${nonTechDateClause}
  GROUP BY 
    locationmaster.LocationName, 
    tbl_nontech_staff.StaffName;
  `;

  mysql22.query(scannedResult, (error, scannedResults) => {
    if (error) {
      console.error("Error occurred when exporting CSV:", error);
      res.status(500).json({ error: "An error occurred while exporting the CSV file" });
      return;
    }

    commonDB.query(nonTechQuery, (error, nonTechResults) => {
      if (error) {
        console.error("Error occurred when exporting CSV:", error);
        res.status(500).json({ error: "An error occurred while exporting the CSV file" });
        return;
      }

      // Prepare a combined result set
      const combinedResults = [];

      // Add scanned results to combined results
      scannedResults.forEach(row => {
        combinedResults.push({
          locationName: row.locationName,
          user_type: row.user_type,
          Scanned: row.Scanned,
          QC: row.QC,
          Indexing: row.Indexing,
          Flagging: row.Flagging,
          CBSL_QA: row.CBSL_QA,
          Client_QC: row.Client_QC,
          Counting: 0,
          Inventory: 0,
          DocPreparation: 0,
          Guard: 0
        });
      });

      // Add non-tech results to combined results
      nonTechResults.forEach(row => {
        combinedResults.push({
          locationName: row.locationName,
          user_type: row.user_type,
          Scanned: 0,
          QC: 0,
          Indexing: 0,
          Flagging: 0,
          CBSL_QA: 0,
          Client_QC: 0,
          Counting: row.Counting,
          Inventory: row.Inventory,
          DocPreparation: row.DocPreparation,
          Guard: row.Guard
        });
      });

      // Set response headers for CSV file
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment;filename=${fileName}`);
      res.write("Sr. No.,Location,UserName,Scanned,QC,Indexing,Flagging,CBSL_QA,Client_QA_Accepted,Counting,Inventory,DocPreparation,Guard\n");

      // Write combined results to the response
      combinedResults.forEach((row, index) => {
        res.write(`${index + 1},${row.locationName},${row.user_type},${row.Scanned},${row.QC},${row.Indexing},${row.Flagging},${row.CBSL_QA},${row.Client_QC},${row.Counting},${row.Inventory},${row.DocPreparation},${row.Guard}\n`);
      });

      // End response
      res.end();
    });
  });
});

app.get("/alluserdetailedreportlocationwisecsv",  (req, res, next) => {
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

let nonTechWhereClause = "";
if (locationName) {
  nonTechWhereClause = `WHERE locationmaster.LocationName IN ('${locationName.join("','")}')`;
}

let nonTechDateClause = "";
if (startDate && endDate) {
  nonTechDateClause = nonTechWhereClause ? `AND` : `WHERE`;
  nonTechDateClause += ` tbl_nontech_staff.Date BETWEEN '${startDate}' AND '${endDate}'`;
}


const nonTechQuery = `
    SELECT 
      locationmaster.LocationName AS 'locationName',
      tbl_nontech_staff.StaffName AS 'user_type',
      DATE_FORMAT(date, '%Y-%m-%d') AS date,
      SUM(tbl_nontech_staff.Counting) AS 'Counting', 
      SUM(tbl_nontech_staff.Inventory) AS 'Inventory',
      SUM(tbl_nontech_staff.DocPreparation) AS 'DocPreparation',
      SUM(tbl_nontech_staff.Guard) AS 'Guard'
    FROM 
      tbl_nontech_staff
    INNER JOIN 
      locationmaster ON tbl_nontech_staff.LocationID = locationmaster.LocationID
      ${nonTechWhereClause}
      AND tbl_nontech_staff.StaffName = '${username}' 
      ${nonTechDateClause}
    GROUP BY 
      locationmaster.LocationName, 
      tbl_nontech_staff.StaffName,
      DATE
    ORDER BY 
      DATE ASC;
  `;

  mysql22.query(getCsv, (err,scannedResults) => {
    if (err) {
      console.error("Error fetching scanned summary data:", err);
      res.status(500).json({ error: "Error fetching scanned summary data" });
      return;
    }

    commonDB.query(nonTechQuery, (err, nonTechResults) => {
      if (err) {
        console.error("Error fetching non-tech summary data:", err);
        res.status(500).json({ error: "Error fetching non-tech summary data" });
        return;
      }



      const combinedResults = [];

      // Add scanned results to combined results
      scannedResults.forEach(row => {
        combinedResults.push({
          locationName: row.locationName,
          user_type: row.user_type,
          lotno:row.lotno,
          Date:row.Date,
          Scanned: row.Scanned,
          QC: row.QC,
          Indexing: row.Indexing,
          Flagging: row.Flagging,
          CBSL_QA: row.CBSL_QA,
          Client_QC: row.Client_QC,
          Counting: 0,
          Inventory: 0,
          DocPreparation: 0,
          Guard: 0
        });
      });

      // Add non-tech results to combined results
      nonTechResults.forEach(row => {
        combinedResults.push({
          locationName: row.locationName,
          user_type: row.user_type,
          lotno:0,
          Date:row.date,
          Scanned: 0,
          QC: 0,
          Indexing: 0,
          Flagging: 0,
          CBSL_QA: 0,
          Client_QC: 0,
          Counting: row.Counting,
          Inventory: row.Inventory,
          DocPreparation: row.DocPreparation,
          Guard: row.Guard
        });
      });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment;filename=${fileName}`);
  res.write('Sr. No.,Location Name,UserName,LotNo,Date,Scanned,QC,Index,Flagging,CBSL_QA,Client_QC,Counting,Inventory,DocPreparation,Guard\n');
  // Write CSV data
  combinedResults.forEach((row, index) => {
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
      row['Client_QC'] +","+
      row['Counting']+ ","+
      row['Inventory'] + ","+
      row['DocPreparation'] +","+
      row['Guard'] +","+
       "\n"
    );
  });

    // End response
    res.end();
  });
});
});

//Updc Non Tech Apis

app.get("/summaryreportnontech", (req, res) => {
  let locationNames = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;

  if (!locationNames || (Array.isArray(locationNames) && locationNames.length === 0)) {
    locationNames = null;
  } else {
    if (!Array.isArray(locationNames)) {
      locationNames = [locationNames];
    }
  }

  let nonTechWhereClause = "";
  if (locationNames) {
    nonTechWhereClause = `WHERE lm.LocationName IN ('${locationNames.join("','")}')`;
  }

  let nonTechDateClause = "";
  if (startDate && endDate) {
    nonTechDateClause = nonTechWhereClause ? `AND` : `WHERE`;
    nonTechDateClause += ` ns.Date BETWEEN '${startDate}' AND '${endDate}'`;
  }

  const nonTechQuery = `
    SELECT 
      sum(Counting) as 'Counting', 
      sum(Inventory) as 'Inventory',
      sum(DocPreparation) as 'DocPreparation',
      sum(Guard) as 'Guard'
    FROM tbl_nontech_staff ns
    ${nonTechWhereClause}
    ${nonTechDateClause};
  `;

  commonDB.query(nonTechQuery, (err, nonTechResults) => {
    if (err) {
      console.error("Error fetching non-tech summary data:", err);
      res.status(500).json({ error: "Error fetching non-tech summary data" });
      return;
    }
    if (nonTechResults.length > 0) {
      res.json(nonTechResults[0]); // Send only the first element of the array as response
    } else {
      res.status(404).json({ error: "No data found" });
    }
  });
});

app.get("/detailedreportcummulativenontech", (req, res) => {
    let locationName = req.query.locationName;
    let startDate = req.query.startDate;
    let endDate = req.query.endDate;
  
    // Check if locationName is provided and handle it properly
    if (!locationName || (Array.isArray(locationName) && locationName.length === 0)) {
      locationName = null;
    } else {
      if (!Array.isArray(locationName)) {
        locationName = [locationName];
      }
    }

    // Prepare WHERE clause for filtering by locationName
    let nonTechWhereClause = "";
    if (locationName) {
      nonTechWhereClause = `WHERE lm.LocationName IN ('${locationName.join("','")}')`;
    }
  
    // Prepare WHERE clause for filtering by startDate and endDate
    let nonTechDateClause = "";
    if (startDate && endDate) {
      nonTechDateClause = nonTechWhereClause ? ` AND` : `WHERE`;
      nonTechDateClause += ` ns.Date BETWEEN '${startDate}' AND '${endDate}'`;
    }
  
    const nonTechQuery = `
    SELECT 
      lm.LocationName AS 'LocationName',
      SUM(ns.Counting) AS 'Counting', 
      SUM(ns.Inventory) AS 'Inventory',
      SUM(ns.DocPreparation) AS 'DocPreparation',
      SUM(ns.Guard) AS 'Guard'
    FROM 
      tbl_nontech_staff ns
    INNER JOIN 
      locationmaster lm ON ns.LocationID = lm.LocationID
    ${nonTechWhereClause}
    ${nonTechDateClause}
    GROUP BY
      lm.LocationName;`;

    // Execute the query
    commonDB.query(nonTechQuery, (err, nonTechResults) => {
      if (err) {
        console.error("Error fetching non-tech summary data:", err);
        res.status(500).json({ error: "Error fetching non-tech summary data" });
        return;
      }

      // Send the response with modified format
      const simplifiedData = nonTechResults.map(item => ({
        "LocationName": item.LocationName,
        "Counting": item.Counting,
        "Inventory": item.Inventory,
        "DocPreparation": item.DocPreparation,
        "Guard": item.Guard
      }));

      res.json(simplifiedData);
    });
});

app.get("/alldetailedreportlocationwisenontech", (req, res) => {
  let locationName = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate || new Date().toISOString().split('T')[0];

  // Ensure locationName is an array if provided
  if (!Array.isArray(locationName)) {
    locationName = [locationName];
  }

  // Prepare the WHERE clause based on locationName
  const whereClause = locationName ? `WHERE locationmaster.LocationName IN ('${locationName.join("','")}')` : '';

  const nonTechQuery = `
    SELECT 
      locationmaster.LocationName AS 'locationName',
      tbl_nontech_staff.StaffName AS 'user_type',
      SUM(tbl_nontech_staff.Counting) AS 'Counting', 
      SUM(tbl_nontech_staff.Inventory) AS 'Inventory',
      SUM(tbl_nontech_staff.DocPreparation) AS 'DocPreparation',
      SUM(tbl_nontech_staff.Guard) AS 'Guard'
    FROM 
      tbl_nontech_staff
    INNER JOIN 
      locationmaster ON tbl_nontech_staff.LocationID = locationmaster.LocationID
    ${whereClause} AND DATE(Date) BETWEEN '${startDate}' AND '${endDate}'
    GROUP BY 
      locationmaster.LocationName, 
      tbl_nontech_staff.StaffName;
  `;

  commonDB.query(nonTechQuery, (err, nonTechResults) => {
    if (err) {
      console.error("Error fetching non-tech summary data:", err);
      res.status(500).json({ error: "Error fetching non-tech summary data" });
      return;
    }

    res.json(nonTechResults);
  });
});

app.get("/alluserdetailedreportlocationwisenontech", (req, res) => {
  let username = req.query.username;
  let locationName = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate || new Date().toISOString().split('T')[0];

  if (!locationName || (Array.isArray(locationName) && locationName.length === 0)) {
    locationName = null;
  } else {
    if (!Array.isArray(locationName)) {
      locationName = [locationName];
    }
  }

  const nonTechQuery = `
    SELECT 
      locationmaster.LocationName AS 'locationName',
      tbl_nontech_staff.StaffName AS 'user_type',
      DATE_FORMAT(DATE, '%Y-%m-%d') AS Date,
      SUM(tbl_nontech_staff.Counting) AS 'Counting', 
      SUM(tbl_nontech_staff.Inventory) AS 'Inventory',
      SUM(tbl_nontech_staff.DocPreparation) AS 'DocPreparation',
      SUM(tbl_nontech_staff.Guard) AS 'Guard'
    FROM 
      tbl_nontech_staff
    INNER JOIN 
      locationmaster ON tbl_nontech_staff.LocationID = locationmaster.LocationID
    WHERE
      locationmaster.LocationName IN ('${locationName.join("','")}') 
      AND tbl_nontech_staff.StaffName = '${username}' 
      AND DATE(Date) BETWEEN '${startDate}' AND '${endDate}'
    GROUP BY 
      locationmaster.LocationName, 
      tbl_nontech_staff.StaffName,
      DATE
    ORDER BY 
      DATE ASC;
  `;

  
    commonDB.query(nonTechQuery, (err, nonTechResults) => {
      if (err) {
        console.error("Error fetching non-tech summary data:", err);
        res.status(500).json({ error: "Error fetching non-tech summary data" });
        return;
      }

      
      res.json(nonTechResults);
    });
});

app.get('/detailedreportcummulativecsvnontech', (req, res) => {
  let locationNames = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;

  if (!locationNames || (Array.isArray(locationNames) && locationNames.length === 0)) {
      locationNames = null;
  } else {
      if (!Array.isArray(locationNames)) {
          locationNames = [locationNames];
      }
  }

  let nonTechWhereClause = "";
  if (locationNames) {
      nonTechWhereClause = `WHERE lm.LocationName IN ('${locationNames.join("','")}')`;
  }

  let nonTechDateClause = "";
  if (startDate && endDate) {
      nonTechDateClause = nonTechWhereClause ? `AND` : `WHERE`;
      nonTechDateClause += ` ns.Date BETWEEN '${startDate}' AND '${endDate}'`;
  }

  const nonTechQuery = `
    SELECT 
      lm.LocationName AS 'LocationName',
      COALESCE(SUM(ns.Counting), 0) AS 'Counting', 
      COALESCE(SUM(ns.Inventory), 0) AS 'Inventory',
      COALESCE(SUM(ns.DocPreparation), 0) AS 'DocPreparation',
      COALESCE(SUM(ns.Guard), 0) AS 'Guard'
    FROM 
      tbl_nontech_staff ns
    INNER JOIN 
      locationmaster lm ON ns.LocationID = lm.LocationID 
      ${nonTechWhereClause}
      ${nonTechDateClause}
    GROUP BY
      lm.LocationName`;

  commonDB.query(nonTechQuery, (error, nonTechResult) => {
      if (error) {
          console.error("Error occurred when exporting CSV:", error);
          res.status(500).json({ error: "An error occurred while exporting the CSV file" });
          return;
      }

      const nonTechData = nonTechResult && nonTechResult.length > 0 ? nonTechResult : [];

      if (nonTechData.length === 0) {
          res.status(404).json({ error: "No data found for the provided parameters" });
          return;
      }

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment;filename=All_location.csv");
      res.write("Sr. No.,Location,Counting,Inventory,DocPreparation,Guard\n");

      // Write CSV data
      nonTechData.forEach((row, index) => {
          res.write(`${index + 1},${row.LocationName},${row.Counting},${row.Inventory},${row.DocPreparation},${row.Guard}\n`);
      });

      res.end();
  });
});

app.get("/alldetailedreportlocationwisecsvnontech", (req, res) => {
  let locationName = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate || new Date().toISOString().split('T')[0];

  if (!locationName || (Array.isArray(locationName) && locationName.length === 0)) {
    locationName = null;
  } else {
    if (!Array.isArray(locationName)) {
      locationName = [locationName];
    }
  }

  let nonTechWhereClause = "";
  if (locationName) {
    nonTechWhereClause = `WHERE locationmaster.LocationName IN ('${locationName.join("','")}')`;
  }

  let nonTechDateClause = "";
  if (startDate && endDate) {
    nonTechDateClause = nonTechWhereClause ? `AND` : `WHERE`;
    nonTechDateClause += ` tbl_nontech_staff.Date BETWEEN '${startDate}' AND '${endDate}'`;
  }

  const nonTechQuery = `
  SELECT 
    locationmaster.LocationName AS 'locationName',
    tbl_nontech_staff.StaffName AS 'user_type',
    SUM(tbl_nontech_staff.Counting) AS 'Counting', 
    SUM(tbl_nontech_staff.Inventory) AS 'Inventory',
    SUM(tbl_nontech_staff.DocPreparation) AS 'DocPreparation',
    SUM(tbl_nontech_staff.Guard) AS 'Guard'
  FROM 
    tbl_nontech_staff
  INNER JOIN 
    locationmaster ON tbl_nontech_staff.LocationID = locationmaster.LocationID
  ${nonTechWhereClause}
  ${nonTechDateClause}
  GROUP BY 
    locationmaster.LocationName, 
    tbl_nontech_staff.StaffName;
  `;

  commonDB.query(nonTechQuery, (error, nonTechResults) => {
    if (error) {
      console.error("Error occurred when exporting CSV:", error);
      res.status(500).json({ error: "An error occurred while exporting the CSV file" });
      return;
    }

    // Prepare a combined result set
    const combinedResults = nonTechResults.map((row, index) => ({
      srNo: index + 1,
      locationName: row.locationName,
      user_type: row.user_type,
      Counting: row.Counting || 0,
      Inventory: row.Inventory || 0,
      DocPreparation: row.DocPreparation || 0,
      Guard: row.Guard || 0
    }));

    // Set response headers for CSV file
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment;filename=All_location.csv`);
    res.write("Sr. No.,Location,UserName,Counting,Inventory,DocPreparation,Guard\n");

    // Write combined results to the response
    combinedResults.forEach(row => {
      res.write(`${row.srNo},${row.locationName},${row.user_type},${row.Counting},${row.Inventory},${row.DocPreparation},${row.Guard}\n`);
    });

    // End response
    res.end();
  });
});

app.get("/alluserdetailedreportlocationwisecsv", (req, res, next) => {
  let username = req.query.username;
  let locationName = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate || new Date().toISOString().split('T')[0];
  console.log("Location Names:", locationName);

  if (!locationName || (Array.isArray(locationName) && locationName.length === 0)) {
    locationName = null;
  } else {
    if (!Array.isArray(locationName)) {
      locationName = [locationName];
    }
  }

  let nonTechWhereClause = "";
  if (locationName) {
    nonTechWhereClause = `WHERE locationmaster.LocationName IN ('${locationName.join("','")}')`;
  }

  let nonTechDateClause = "";
  if (startDate && endDate) {
    nonTechDateClause = nonTechWhereClause ? `AND` : `WHERE`;
    nonTechDateClause += ` tbl_nontech_staff.Date BETWEEN '${startDate}' AND '${endDate}'`;
  }

  const nonTechQuery = `
    SELECT 
      locationmaster.LocationName AS 'locationName',
      tbl_nontech_staff.StaffName AS 'user_type',
      DATE_FORMAT(tbl_nontech_staff.Date, '%Y-%m-%d') AS date,
      SUM(tbl_nontech_staff.Counting) AS 'Counting', 
      SUM(tbl_nontech_staff.Inventory) AS 'Inventory',
      SUM(tbl_nontech_staff.DocPreparation) AS 'DocPreparation',
      SUM(tbl_nontech_staff.Guard) AS 'Guard'
    FROM 
      tbl_nontech_staff
    INNER JOIN 
      locationmaster ON tbl_nontech_staff.LocationID = locationmaster.LocationID
    ${nonTechWhereClause}
    AND tbl_nontech_staff.StaffName = '${username}' 
    ${nonTechDateClause}
    GROUP BY 
      locationmaster.LocationName, 
      tbl_nontech_staff.StaffName,
      tbl_nontech_staff.Date
    ORDER BY 
      tbl_nontech_staff.Date ASC;
  `;

  commonDB.query(nonTechQuery, (err, nonTechResults) => {
    if (err) {
      console.error("Error fetching non-tech summary data:", err);
      res.status(500).json({ error: "Error fetching non-tech summary data" });
      return;
    }

    const combinedResults = nonTechResults.map((row, index) => ({
      srNo: index + 1,
      locationName: row.locationName,
      user_type: row.user_type,
      date: row.date,
      Counting: row.Counting,
      Inventory: row.Inventory,
      DocPreparation: row.DocPreparation,
      Guard: row.Guard
    }));

    const fileName = 'All_location.csv';

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment;filename=${fileName}`);
    res.write('Sr. No.,Location Name,UserName,Date,Counting,Inventory,DocPreparation,Guard\n');

    combinedResults.forEach(row => {
      res.write(
        `${row.srNo},${row.locationName},${row.user_type},${row.date},${row.Counting},${row.Inventory},${row.DocPreparation},${row.Guard}\n`
      );
    });

    res.end();
  });
});

//Telangana Non Tech Api

app.get("/summaryreportnontechtelangana", (req, res) => {
  let locationNames = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;

  if (!locationNames || (Array.isArray(locationNames) && locationNames.length === 0)) {
    locationNames = null;
  } else {
    if (!Array.isArray(locationNames)) {
      locationNames = [locationNames];
    }
  }

  let nonTechWhereClause = "";
  if (locationNames) {
    nonTechWhereClause = `WHERE lm.LocationName IN ('${locationNames.join("','")}')`;
  }

  let nonTechDateClause = "";
  if (startDate && endDate) {
    nonTechDateClause = nonTechWhereClause ? `AND` : `WHERE`;
    nonTechDateClause += ` ns.Date BETWEEN '${startDate}' AND '${endDate}'`;
  }

  const nonTechQuery = `
    SELECT 
      sum(Counting) as 'Counting', 
      sum(Inventory) as 'Inventory',
      sum(DocPreparation) as 'DocPreparation',
      sum(Guard) as 'Guard'
    FROM tbl_nontech_staff ns
    ${nonTechWhereClause}
    ${nonTechDateClause};
  `;

  telnganaDB.query(nonTechQuery, (err, nonTechResults) => {
    if (err) {
      console.error("Error fetching non-tech summary data:", err);
      res.status(500).json({ error: "Error fetching non-tech summary data" });
      return;
    }
    if (nonTechResults.length > 0) {
      res.json(nonTechResults[0]); // Send only the first element of the array as response
    } else {
      res.status(404).json({ error: "No data found" });
    }
  });
});


app.get("/detailedreportcummulativenontechtelangana", (req, res) => {
  let locationName = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;

  // Check if locationName is provided and handle it properly
  if (!locationName || (Array.isArray(locationName) && locationName.length === 0)) {
    locationName = null;
  } else {
    if (!Array.isArray(locationName)) {
      locationName = [locationName];
    }
  }

  // Prepare WHERE clause for filtering by locationName
  let nonTechWhereClause = "";
  if (locationName) {
    nonTechWhereClause = `WHERE lm.LocationName IN ('${locationName.join("','")}')`;
  }

  // Prepare WHERE clause for filtering by startDate and endDate
  let nonTechDateClause = "";
  if (startDate && endDate) {
    nonTechDateClause = nonTechWhereClause ? ` AND` : `WHERE`;
    nonTechDateClause += ` ns.Date BETWEEN '${startDate}' AND '${endDate}'`;
  }

  const nonTechQuery = `
  SELECT 
    lm.LocationName AS 'LocationName',
    SUM(ns.Counting) AS 'Counting', 
    SUM(ns.Inventory) AS 'Inventory',
    SUM(ns.DocPreparation) AS 'DocPreparation',
    SUM(ns.Guard) AS 'Guard'
  FROM 
    tbl_nontech_staff ns
  INNER JOIN 
    locationmaster lm ON ns.LocationID = lm.LocationID
  ${nonTechWhereClause}
  ${nonTechDateClause}
  GROUP BY
    lm.LocationName;`;

  // Execute the query
  telnganaDB.query(nonTechQuery, (err, nonTechResults) => {
    if (err) {
      console.error("Error fetching non-tech summary data:", err);
      res.status(500).json({ error: "Error fetching non-tech summary data" });
      return;
    }

    // Send the response with modified format
    const simplifiedData = nonTechResults.map(item => ({
      "LocationName": item.LocationName,
      "Counting": item.Counting,
      "Inventory": item.Inventory,
      "DocPreparation": item.DocPreparation,
      "Guard": item.Guard
    }));

    res.json(simplifiedData);
  });
});

app.get("/alldetailedreportlocationwisenontechtelangana", (req, res) => {
let locationName = req.query.locationName;
let startDate = req.query.startDate;
let endDate = req.query.endDate || new Date().toISOString().split('T')[0];

// Ensure locationName is an array if provided
if (!Array.isArray(locationName)) {
  locationName = [locationName];
}

// Prepare the WHERE clause based on locationName
const whereClause = locationName ? `WHERE locationmaster.LocationName IN ('${locationName.join("','")}')` : '';

const nonTechQuery = `
  SELECT 
    locationmaster.LocationName AS 'locationName',
    tbl_nontech_staff.StaffName AS 'user_type',
    SUM(tbl_nontech_staff.Counting) AS 'Counting', 
    SUM(tbl_nontech_staff.Inventory) AS 'Inventory',
    SUM(tbl_nontech_staff.DocPreparation) AS 'DocPreparation',
    SUM(tbl_nontech_staff.Guard) AS 'Guard'
  FROM 
    tbl_nontech_staff
  INNER JOIN 
    locationmaster ON tbl_nontech_staff.LocationID = locationmaster.LocationID
  ${whereClause} AND DATE(Date) BETWEEN '${startDate}' AND '${endDate}'
  GROUP BY 
    locationmaster.LocationName, 
    tbl_nontech_staff.StaffName;
`;

telnganaDB.query(nonTechQuery, (err, nonTechResults) => {
  if (err) {
    console.error("Error fetching non-tech summary data:", err);
    res.status(500).json({ error: "Error fetching non-tech summary data" });
    return;
  }

  res.json(nonTechResults);
});
});

app.get("/alluserdetailedreportlocationwisenontechtelangana", (req, res) => {
let username = req.query.username;
let locationName = req.query.locationName;
let startDate = req.query.startDate;
let endDate = req.query.endDate || new Date().toISOString().split('T')[0];

if (!locationName || (Array.isArray(locationName) && locationName.length === 0)) {
  locationName = null;
} else {
  if (!Array.isArray(locationName)) {
    locationName = [locationName];
  }
}

const nonTechQuery = `
  SELECT 
    locationmaster.LocationName AS 'locationName',
    tbl_nontech_staff.StaffName AS 'user_type',
    DATE_FORMAT(DATE, '%Y-%m-%d') AS Date,
    SUM(tbl_nontech_staff.Counting) AS 'Counting', 
    SUM(tbl_nontech_staff.Inventory) AS 'Inventory',
    SUM(tbl_nontech_staff.DocPreparation) AS 'DocPreparation',
    SUM(tbl_nontech_staff.Guard) AS 'Guard'
  FROM 
    tbl_nontech_staff
  INNER JOIN 
    locationmaster ON tbl_nontech_staff.LocationID = locationmaster.LocationID
  WHERE
    locationmaster.LocationName IN ('${locationName.join("','")}') 
    AND tbl_nontech_staff.StaffName = '${username}' 
    AND DATE(Date) BETWEEN '${startDate}' AND '${endDate}'
  GROUP BY 
    locationmaster.LocationName, 
    tbl_nontech_staff.StaffName,
    DATE
  ORDER BY 
    DATE ASC;
`;


  telnganaDB.query(nonTechQuery, (err, nonTechResults) => {
    if (err) {
      console.error("Error fetching non-tech summary data:", err);
      res.status(500).json({ error: "Error fetching non-tech summary data" });
      return;
    }

    
    res.json(nonTechResults);
  });
});

app.get('/detailedreportcummulativecsvnontechtelangana', (req, res) => {
let locationNames = req.query.locationName;
let startDate = req.query.startDate;
let endDate = req.query.endDate;

if (!locationNames || (Array.isArray(locationNames) && locationNames.length === 0)) {
    locationNames = null;
} else {
    if (!Array.isArray(locationNames)) {
        locationNames = [locationNames];
    }
}

let nonTechWhereClause = "";
if (locationNames) {
    nonTechWhereClause = `WHERE lm.LocationName IN ('${locationNames.join("','")}')`;
}

let nonTechDateClause = "";
if (startDate && endDate) {
    nonTechDateClause = nonTechWhereClause ? `AND` : `WHERE`;
    nonTechDateClause += ` ns.Date BETWEEN '${startDate}' AND '${endDate}'`;
}

const nonTechQuery = `
  SELECT 
    lm.LocationName AS 'LocationName',
    COALESCE(SUM(ns.Counting), 0) AS 'Counting', 
    COALESCE(SUM(ns.Inventory), 0) AS 'Inventory',
    COALESCE(SUM(ns.DocPreparation), 0) AS 'DocPreparation',
    COALESCE(SUM(ns.Guard), 0) AS 'Guard'
  FROM 
    tbl_nontech_staff ns
  INNER JOIN 
    locationmaster lm ON ns.LocationID = lm.LocationID 
    ${nonTechWhereClause}
    ${nonTechDateClause}
  GROUP BY
    lm.LocationName`;

telnganaDB.query(nonTechQuery, (error, nonTechResult) => {
    if (error) {
        console.error("Error occurred when exporting CSV:", error);
        res.status(500).json({ error: "An error occurred while exporting the CSV file" });
        return;
    }

    const nonTechData = nonTechResult && nonTechResult.length > 0 ? nonTechResult : [];

    if (nonTechData.length === 0) {
        res.status(404).json({ error: "No data found for the provided parameters" });
        return;
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment;filename=All_location.csv");
    res.write("Sr. No.,Location,Counting,Inventory,DocPreparation,Guard\n");

    // Write CSV data
    nonTechData.forEach((row, index) => {
        res.write(`${index + 1},${row.LocationName},${row.Counting},${row.Inventory},${row.DocPreparation},${row.Guard}\n`);
    });

    res.end();
});
});

app.get("/alldetailedreportlocationwisecsvnontechtelangana", (req, res) => {
let locationName = req.query.locationName;
let startDate = req.query.startDate;
let endDate = req.query.endDate || new Date().toISOString().split('T')[0];

if (!locationName || (Array.isArray(locationName) && locationName.length === 0)) {
  locationName = null;
} else {
  if (!Array.isArray(locationName)) {
    locationName = [locationName];
  }
}

let nonTechWhereClause = "";
if (locationName) {
  nonTechWhereClause = `WHERE locationmaster.LocationName IN ('${locationName.join("','")}')`;
}

let nonTechDateClause = "";
if (startDate && endDate) {
  nonTechDateClause = nonTechWhereClause ? `AND` : `WHERE`;
  nonTechDateClause += ` tbl_nontech_staff.Date BETWEEN '${startDate}' AND '${endDate}'`;
}

const nonTechQuery = `
SELECT 
  locationmaster.LocationName AS 'locationName',
  tbl_nontech_staff.StaffName AS 'user_type',
  SUM(tbl_nontech_staff.Counting) AS 'Counting', 
  SUM(tbl_nontech_staff.Inventory) AS 'Inventory',
  SUM(tbl_nontech_staff.DocPreparation) AS 'DocPreparation',
  SUM(tbl_nontech_staff.Guard) AS 'Guard'
FROM 
  tbl_nontech_staff
INNER JOIN 
  locationmaster ON tbl_nontech_staff.LocationID = locationmaster.LocationID
${nonTechWhereClause}
${nonTechDateClause}
GROUP BY 
  locationmaster.LocationName, 
  tbl_nontech_staff.StaffName;
`;

telnganaDB.query(nonTechQuery, (error, nonTechResults) => {
  if (error) {
    console.error("Error occurred when exporting CSV:", error);
    res.status(500).json({ error: "An error occurred while exporting the CSV file" });
    return;
  }

  // Prepare a combined result set
  const combinedResults = nonTechResults.map((row, index) => ({
    srNo: index + 1,
    locationName: row.locationName,
    user_type: row.user_type,
    Counting: row.Counting || 0,
    Inventory: row.Inventory || 0,
    DocPreparation: row.DocPreparation || 0,
    Guard: row.Guard || 0
  }));

  // Set response headers for CSV file
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment;filename=All_location.csv`);
  res.write("Sr. No.,Location,UserName,Counting,Inventory,DocPreparation,Guard\n");

  // Write combined results to the response
  combinedResults.forEach(row => {
    res.write(`${row.srNo},${row.locationName},${row.user_type},${row.Counting},${row.Inventory},${row.DocPreparation},${row.Guard}\n`);
  });

  // End response
  res.end();
});
});

app.get("/alluserdetailedreportlocationwisecsvtelangana", (req, res, next) => {
  let username = req.query.username;
  let locationName = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate || new Date().toISOString().split('T')[0];
  console.log("Location Names:", locationName);

  if (!locationName || (Array.isArray(locationName) && locationName.length === 0)) {
    locationName = null;
  } else {
    if (!Array.isArray(locationName)) {
      locationName = [locationName];
    }
  }

  let nonTechWhereClause = "";
  if (locationName) {
    nonTechWhereClause = `WHERE locationmaster.LocationName IN ('${locationName.join("','")}')`;
  }

  let nonTechDateClause = "";
  if (startDate && endDate) {
    nonTechDateClause = nonTechWhereClause ? `AND` : `WHERE`;
    nonTechDateClause += ` tbl_nontech_staff.Date BETWEEN '${startDate}' AND '${endDate}'`;
  }

  const nonTechQuery = `
    SELECT 
      locationmaster.LocationName AS 'locationName',
      tbl_nontech_staff.StaffName AS 'user_type',
      DATE_FORMAT(tbl_nontech_staff.Date, '%Y-%m-%d') AS Date,
      SUM(tbl_nontech_staff.Counting) AS 'Counting', 
      SUM(tbl_nontech_staff.Inventory) AS 'Inventory',
      SUM(tbl_nontech_staff.DocPreparation) AS 'DocPreparation',
      SUM(tbl_nontech_staff.Guard) AS 'Guard'
    FROM 
      tbl_nontech_staff
    INNER JOIN 
      locationmaster ON tbl_nontech_staff.LocationID = locationmaster.LocationID
    ${nonTechWhereClause}
    AND tbl_nontech_staff.StaffName = '${username}'
    ${nonTechDateClause}
    GROUP BY 
      locationmaster.LocationName, 
      tbl_nontech_staff.StaffName,
      tbl_nontech_staff.Date
    ORDER BY 
      tbl_nontech_staff.Date ASC;
  `;

  telnganaDB.query(nonTechQuery, [username], (err, nonTechResults) => {
    if (err) {
      console.error("Error fetching non-tech summary data:", err);
      res.status(500).json({ error: "Error fetching non-tech summary data" });
      return;
    }

    const combinedResults = nonTechResults.map((row, index) => ({
      srNo: index + 1,
      locationName: row.locationName,
      user_type: row.user_type,
      date: row.Date,
      Counting: row.Counting,
      Inventory: row.Inventory,
      DocPreparation: row.DocPreparation,
      Guard: row.Guard
    }));

    const fileName = 'All_location.csv';

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment;filename=${fileName}`);
    res.write('Sr. No.,Location Name,UserName,Date,Counting,Inventory,DocPreparation,Guard\n');

    combinedResults.forEach(row => {
      res.write(
        `${row.srNo},${row.locationName},${row.user_type},${row.date},${row.Counting},${row.Inventory},${row.DocPreparation},${row.Guard}\n`
      );
    });

    res.end();
  });
});

//Karnataka Non Tech Apis


app.get("/summaryreportnontechkarnataka", (req, res) => {
  let locationNames = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;

  if (!locationNames || (Array.isArray(locationNames) && locationNames.length === 0)) {
    locationNames = null;
  } else {
    if (!Array.isArray(locationNames)) {
      locationNames = [locationNames];
    }
  }

  let nonTechWhereClause = "";
  if (locationNames) {
    nonTechWhereClause = `WHERE lm.LocationName IN ('${locationNames.join("','")}')`;
  }

  let nonTechDateClause = "";
  if (startDate && endDate) {
    nonTechDateClause = nonTechWhereClause ? `AND` : `WHERE`;
    nonTechDateClause += ` ns.Date BETWEEN '${startDate}' AND '${endDate}'`;
  }

  const nonTechQuery = `
    SELECT 
      sum(Counting) as 'Counting', 
      sum(Inventory) as 'Inventory',
      sum(DocPreparation) as 'DocPreparation',
      sum(Guard) as 'Guard'
    FROM tbl_nontech_staff ns
    ${nonTechWhereClause}
    ${nonTechDateClause};
  `;

  KarnatakaDB.query(nonTechQuery, (err, nonTechResults) => {
    if (err) {
      console.error("Error fetching non-tech summary data:", err);
      res.status(500).json({ error: "Error fetching non-tech summary data" });
      return;
    }
    if (nonTechResults.length > 0) {
      res.json(nonTechResults[0]); // Send only the first element of the array as response
    } else {
      res.status(404).json({ error: "No data found" });
    }
  });
});

app.get("/detailedreportcummulativenontechkarnataka", (req, res) => {
  let locationName = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;

  // Check if locationName is provided and handle it properly
  if (!locationName || (Array.isArray(locationName) && locationName.length === 0)) {
    locationName = null;
  } else {
    if (!Array.isArray(locationName)) {
      locationName = [locationName];
    }
  }

  // Prepare WHERE clause for filtering by locationName
  let nonTechWhereClause = "";
  if (locationName) {
    nonTechWhereClause = `WHERE lm.LocationName IN ('${locationName.join("','")}')`;
  }

  // Prepare WHERE clause for filtering by startDate and endDate
  let nonTechDateClause = "";
  if (startDate && endDate) {
    nonTechDateClause = nonTechWhereClause ? ` AND` : `WHERE`;
    nonTechDateClause += ` ns.Date BETWEEN '${startDate}' AND '${endDate}'`;
  }

  const nonTechQuery = `
  SELECT 
    lm.LocationName AS 'LocationName',
    SUM(ns.Counting) AS 'Counting', 
    SUM(ns.Inventory) AS 'Inventory',
    SUM(ns.DocPreparation) AS 'DocPreparation',
    SUM(ns.Guard) AS 'Guard'
  FROM 
    tbl_nontech_staff ns
  INNER JOIN 
    locationmaster lm ON ns.LocationID = lm.LocationID
  ${nonTechWhereClause}
  ${nonTechDateClause}
  GROUP BY
    lm.LocationName;`;

  // Execute the query
  KarnatakaDB.query(nonTechQuery, (err, nonTechResults) => {
    if (err) {
      console.error("Error fetching non-tech summary data:", err);
      res.status(500).json({ error: "Error fetching non-tech summary data" });
      return;
    }

    // Send the response with modified format
    const simplifiedData = nonTechResults.map(item => ({
      "LocationName": item.LocationName,
      "Counting": item.Counting,
      "Inventory": item.Inventory,
      "DocPreparation": item.DocPreparation,
      "Guard": item.Guard
    }));

    res.json(simplifiedData);
  });
});

app.get("/alldetailedreportlocationwisenontechkarnataka", (req, res) => {
let locationName = req.query.locationName;
let startDate = req.query.startDate;
let endDate = req.query.endDate || new Date().toISOString().split('T')[0];

// Ensure locationName is an array if provided
if (!Array.isArray(locationName)) {
  locationName = [locationName];
}

// Prepare the WHERE clause based on locationName
const whereClause = locationName ? `WHERE locationmaster.LocationName IN ('${locationName.join("','")}')` : '';

const nonTechQuery = `
  SELECT 
    locationmaster.LocationName AS 'locationName',
    tbl_nontech_staff.StaffName AS 'user_type',
    SUM(tbl_nontech_staff.Counting) AS 'Counting', 
    SUM(tbl_nontech_staff.Inventory) AS 'Inventory',
    SUM(tbl_nontech_staff.DocPreparation) AS 'DocPreparation',
    SUM(tbl_nontech_staff.Guard) AS 'Guard'
  FROM 
    tbl_nontech_staff
  INNER JOIN 
    locationmaster ON tbl_nontech_staff.LocationID = locationmaster.LocationID
  ${whereClause} AND DATE(Date) BETWEEN '${startDate}' AND '${endDate}'
  GROUP BY 
    locationmaster.LocationName, 
    tbl_nontech_staff.StaffName;
`;

KarnatakaDB.query(nonTechQuery, (err, nonTechResults) => {
  if (err) {
    console.error("Error fetching non-tech summary data:", err);
    res.status(500).json({ error: "Error fetching non-tech summary data" });
    return;
  }

  res.json(nonTechResults);
});
});

app.get("/alluserdetailedreportlocationwisenontechkarnataka", (req, res) => {
let username = req.query.username;
let locationName = req.query.locationName;
let startDate = req.query.startDate;
let endDate = req.query.endDate || new Date().toISOString().split('T')[0];

if (!locationName || (Array.isArray(locationName) && locationName.length === 0)) {
  locationName = null;
} else {
  if (!Array.isArray(locationName)) {
    locationName = [locationName];
  }
}

const nonTechQuery = `
  SELECT 
    locationmaster.LocationName AS 'locationName',
    tbl_nontech_staff.StaffName AS 'user_type',
    DATE_FORMAT(DATE, '%Y-%m-%d') AS Date,
    SUM(tbl_nontech_staff.Counting) AS 'Counting', 
    SUM(tbl_nontech_staff.Inventory) AS 'Inventory',
    SUM(tbl_nontech_staff.DocPreparation) AS 'DocPreparation',
    SUM(tbl_nontech_staff.Guard) AS 'Guard'
  FROM 
    tbl_nontech_staff
  INNER JOIN 
    locationmaster ON tbl_nontech_staff.LocationID = locationmaster.LocationID
  WHERE
    locationmaster.LocationName IN ('${locationName.join("','")}') 
    AND tbl_nontech_staff.StaffName = '${username}' 
    AND DATE(Date) BETWEEN '${startDate}' AND '${endDate}'
  GROUP BY 
    locationmaster.LocationName, 
    tbl_nontech_staff.StaffName,
    DATE
  ORDER BY 
    DATE ASC;
`;


  KarnatakaDB.query(nonTechQuery, (err, nonTechResults) => {
    if (err) {
      console.error("Error fetching non-tech summary data:", err);
      res.status(500).json({ error: "Error fetching non-tech summary data" });
      return;
    }

    
    res.json(nonTechResults);
  });
});

app.get('/detailedreportcummulativecsvnontechkarnataka', (req, res) => {
let locationNames = req.query.locationName;
let startDate = req.query.startDate;
let endDate = req.query.endDate;

if (!locationNames || (Array.isArray(locationNames) && locationNames.length === 0)) {
    locationNames = null;
} else {
    if (!Array.isArray(locationNames)) {
        locationNames = [locationNames];
    }
}

let nonTechWhereClause = "";
if (locationNames) {
    nonTechWhereClause = `WHERE lm.LocationName IN ('${locationNames.join("','")}')`;
}

let nonTechDateClause = "";
if (startDate && endDate) {
    nonTechDateClause = nonTechWhereClause ? `AND` : `WHERE`;
    nonTechDateClause += ` ns.Date BETWEEN '${startDate}' AND '${endDate}'`;
}

const nonTechQuery = `
  SELECT 
    lm.LocationName AS 'LocationName',
    COALESCE(SUM(ns.Counting), 0) AS 'Counting', 
    COALESCE(SUM(ns.Inventory), 0) AS 'Inventory',
    COALESCE(SUM(ns.DocPreparation), 0) AS 'DocPreparation',
    COALESCE(SUM(ns.Guard), 0) AS 'Guard'
  FROM 
    tbl_nontech_staff ns
  INNER JOIN 
    locationmaster lm ON ns.LocationID = lm.LocationID 
    ${nonTechWhereClause}
    ${nonTechDateClause}
  GROUP BY
    lm.LocationName`;

KarnatakaDB.query(nonTechQuery, (error, nonTechResult) => {
    if (error) {
        console.error("Error occurred when exporting CSV:", error);
        res.status(500).json({ error: "An error occurred while exporting the CSV file" });
        return;
    }

    const nonTechData = nonTechResult && nonTechResult.length > 0 ? nonTechResult : [];

    if (nonTechData.length === 0) {
        res.status(404).json({ error: "No data found for the provided parameters" });
        return;
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment;filename=All_location.csv");
    res.write("Sr. No.,Location,Counting,Inventory,DocPreparation,Guard\n");

    // Write CSV data
    nonTechData.forEach((row, index) => {
        res.write(`${index + 1},${row.LocationName},${row.Counting},${row.Inventory},${row.DocPreparation},${row.Guard}\n`);
    });

    res.end();
});
});

app.get("/alldetailedreportlocationwisecsvnontechkarnataka", (req, res) => {
let locationName = req.query.locationName;
let startDate = req.query.startDate;
let endDate = req.query.endDate || new Date().toISOString().split('T')[0];

if (!locationName || (Array.isArray(locationName) && locationName.length === 0)) {
  locationName = null;
} else {
  if (!Array.isArray(locationName)) {
    locationName = [locationName];
  }
}

let nonTechWhereClause = "";
if (locationName) {
  nonTechWhereClause = `WHERE locationmaster.LocationName IN ('${locationName.join("','")}')`;
}

let nonTechDateClause = "";
if (startDate && endDate) {
  nonTechDateClause = nonTechWhereClause ? `AND` : `WHERE`;
  nonTechDateClause += ` tbl_nontech_staff.Date BETWEEN '${startDate}' AND '${endDate}'`;
}

const nonTechQuery = `
SELECT 
  locationmaster.LocationName AS 'locationName',
  tbl_nontech_staff.StaffName AS 'user_type',
  SUM(tbl_nontech_staff.Counting) AS 'Counting', 
  SUM(tbl_nontech_staff.Inventory) AS 'Inventory',
  SUM(tbl_nontech_staff.DocPreparation) AS 'DocPreparation',
  SUM(tbl_nontech_staff.Guard) AS 'Guard'
FROM 
  tbl_nontech_staff
INNER JOIN 
  locationmaster ON tbl_nontech_staff.LocationID = locationmaster.LocationID
${nonTechWhereClause}
${nonTechDateClause}
GROUP BY 
  locationmaster.LocationName, 
  tbl_nontech_staff.StaffName;
`;

KarnatakaDB.query(nonTechQuery, (error, nonTechResults) => {
  if (error) {
    console.error("Error occurred when exporting CSV:", error);
    res.status(500).json({ error: "An error occurred while exporting the CSV file" });
    return;
  }

  // Prepare a combined result set
  const combinedResults = nonTechResults.map((row, index) => ({
    srNo: index + 1,
    locationName: row.locationName,
    user_type: row.user_type,
    Counting: row.Counting || 0,
    Inventory: row.Inventory || 0,
    DocPreparation: row.DocPreparation || 0,
    Guard: row.Guard || 0
  }));

  // Set response headers for CSV file
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment;filename=All_location.csv`);
  res.write("Sr. No.,Location,UserName,Counting,Inventory,DocPreparation,Guard\n");

  // Write combined results to the response
  combinedResults.forEach(row => {
    res.write(`${row.srNo},${row.locationName},${row.user_type},${row.Counting},${row.Inventory},${row.DocPreparation},${row.Guard}\n`);
  });

  // End response
  res.end();
});
});

app.get("/alluserdetailedreportlocationwisecsvkarnataka", (req, res, next) => {
  let username = req.query.username;
  let locationName = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate || new Date().toISOString().split('T')[0];
  console.log("Location Names:", locationName);

  if (!locationName || (Array.isArray(locationName) && locationName.length === 0)) {
    locationName = null;
  } else {
    if (!Array.isArray(locationName)) {
      locationName = [locationName];
    }
  }

  let nonTechWhereClause = "";
  if (locationName) {
    nonTechWhereClause = `WHERE locationmaster.LocationName IN ('${locationName.join("','")}')`;
  }

  let nonTechDateClause = "";
  if (startDate && endDate) {
    nonTechDateClause = nonTechWhereClause ? `AND` : `WHERE`;
    nonTechDateClause += ` tbl_nontech_staff.Date BETWEEN '${startDate}' AND '${endDate}'`;
  }

  const nonTechQuery = `
    SELECT 
      locationmaster.LocationName AS 'locationName',
      tbl_nontech_staff.StaffName AS 'user_type',
      DATE_FORMAT(tbl_nontech_staff.Date, '%Y-%m-%d') AS Date,
      SUM(tbl_nontech_staff.Counting) AS 'Counting', 
      SUM(tbl_nontech_staff.Inventory) AS 'Inventory',
      SUM(tbl_nontech_staff.DocPreparation) AS 'DocPreparation',
      SUM(tbl_nontech_staff.Guard) AS 'Guard'
    FROM 
      tbl_nontech_staff
    INNER JOIN 
      locationmaster ON tbl_nontech_staff.LocationID = locationmaster.LocationID
    ${nonTechWhereClause}
    AND tbl_nontech_staff.StaffName = '${username}'
    ${nonTechDateClause}
    GROUP BY 
      locationmaster.LocationName, 
      tbl_nontech_staff.StaffName,
      tbl_nontech_staff.Date
    ORDER BY 
      tbl_nontech_staff.Date ASC;
  `;

  KarnatakaDB.query(nonTechQuery, [username], (err, nonTechResults) => {
    if (err) {
      console.error("Error fetching non-tech summary data:", err);
      res.status(500).json({ error: "Error fetching non-tech summary data" });
      return;
    }

    const combinedResults = nonTechResults.map((row, index) => ({
      srNo: index + 1,
      locationName: row.locationName,
      user_type: row.user_type,
      date: row.Date,
      Counting: row.Counting,
      Inventory: row.Inventory,
      DocPreparation: row.DocPreparation,
      Guard: row.Guard
    }));

    const fileName = 'All_location.csv';

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment;filename=${fileName}`);
    res.write('Sr. No.,Location Name,UserName,Date,Counting,Inventory,DocPreparation,Guard\n');

    combinedResults.forEach(row => {
      res.write(
        `${row.srNo},${row.locationName},${row.user_type},${row.date},${row.Counting},${row.Inventory},${row.DocPreparation},${row.Guard}\n`
      );
    });

    res.end();
  });
});









  
  


  