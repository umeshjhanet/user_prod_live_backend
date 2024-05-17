const express = require("express");
var cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
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

app.get("/locations", (req, res) => {
  mysql22.query(
    "SELECT LocationID, LocationName from locationmaster;",
    (err, results) => {
      if (err) throw err;
      res.json(results);
    }
  );
});

app.get("/summaryreport", (req, res) => {
  let locationNames = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;

  const queryParams = [];

  if (
    !locationNames ||
    (Array.isArray(locationNames) && locationNames.length === 0)
  ) {
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


app.get("/detailedreport", (req, res) => {
  let locationName = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;

  const queryParams = [];

  if (!locationName || locationName.length === 0) {
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


app.get("/detailedreportcsv", (req, res) => {
  let locationNames = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;

  const queryParams = [];

  if (
    !locationNames ||
    (Array.isArray(locationNames) && locationNames.length === 0)
  ) {
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
      misdb.query(selectQuery, [data.user_email_id], (err, rows) => {
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
          "INSERT INTO tbl_user_master (user_email_id,first_name,middle_name,last_name,password,designation,phone_no,profile_picture,superior_name,superior_email,user_created_date,emp_id,last_pass_change,login_disabled_date,fpi_template, fpi_template_two,fpi_template_three,fpi_template_four,lang,locations,user_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        misdb.query(
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
            misdb.query(query2, [user_id, data.sl_id], (err, results) => {
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
              misdb.query(
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
                  misdb.query(
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
                        misdb.query(
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
                        misdb.query(
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
                      misdb.query(
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
                            misdb.query(
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
                            misdb.query(
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

app.get("/locations", (req, res) => {
  mysql22.query(
    "SELECT LocationID, LocationName from locationmaster;",
    (err, results) => {
      if (err) throw err;
      res.json(results);
    }
  );
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

app.get("/businessrate", (req, res) => {
  misdb.query("select * from tbl_set_business ", (err, results) => {
    if (err) {
      throw err;
    }
    res.json(results);
  });
});

app.get("/getbusinessrate", (req, res) => {
  const query = `
    SELECT b.*, p.id, l.LocationId
    FROM tbl_set_business AS b
    JOIN tbl_projectmaster AS p ON b.id = p.id
    JOIN locationmaster AS l ON b.LocationId = l.LocationId
  `;
  
  misdb.query(query, (err, results) => {
    if (err) {
      throw err;
    }
    res.json(results);
  });
});


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
  const { ScanRate, QcRate, IndexRate, FlagRate, CbslQaRate, ClientQcRate,ProjectId,LocationId } =
    req.body;

  const query =
    "INSERT INTO tbl_set_business (ScanRate, QcRate, IndexRate, FlagRate, CbslQaRate, ClientQcRate,ProjectId,LocationId) VALUES (?, ?, ?, ?, ?, ?,?,?)";

  misdb.query(
    query,
    [ScanRate, QcRate, IndexRate, FlagRate, CbslQaRate, ClientQcRate,ProjectId,LocationId],
    (err, result) => {
      if (err) {
        console.error("Error creating business rate:", err);
        res
          .status(500)
          .json({ error: "An error occurred while creating business rate" });
      } else {
        console.log("Business rate created successfully:", result);
        res.status(200).json({ message: "Rate created successfully" });
      }
    }
  );
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

app.post("/createproject", (req, res) => {
  const { ProjectName } =
    req.body;

  const query =
    "INSERT INTO tbl_projectmaster (ProjectName) VALUES (?)";

  misdb.query(
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
  misdb.query("select * from tbl_projectmaster ", (err, results) => {
    if (err) {
      throw err;
    }
    res.json(results);
  });
});

app.put('/updategroup/:id', (req, res) => {
  const id = req.params.id;
  const {ProjectName } = req.body;
  const query = "UPDATE tbl_projectmaster SET ProjectName = ? WHERE id = ?";

  misdb.query(query, [ProjectName, id], (err, result) => {
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
  misdb.query(
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

  misdb.query(
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

app.get("/gettask", (req, res) => {
  misdb.query("select * from tbl_taskmaster ", (err, results) => {
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

  misdb.query(query, [TaskName, id], (err, result) => {
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
  misdb.query(
    "DELETE FROM tbl_taskmaster WHERE id = ?",
    [id],
    (err) => {
      if (err) throw err;
      res.json({ message: "task deleted successfully" });
    }
  );
});

app.post("/createstaff", (req, res) => {
  const {ProjectId,LocationId,Date,StaffName,TaskName,Volume } =
    req.body;

  const query =
    "INSERT INTO tbl_nontech_staff (ProjectId,LocationId,Date,StaffName,TaskName,Volume) VALUES (?)";

  misdb.query(
    query,
    [ProjectId,LocationId,Date,StaffName,TaskName,Volume],
    (err, result) => {
      if (err) {
        console.error("Error creating non-tech staff:", err);
        res
          .status(500)
          .json({ error: "An error occurred while non-tech staff" });
      } else {
        console.log("non-tech staff created successfully:", result);
        res.status(200).json({ message: "non-tech staff created successfully" });
      }
    }
  );
});

app.get("/getstaff", (req, res) => {
  misdb.query("select * from tbl_nontech_staff ", (err, results) => {
    if (err) {
      throw err;
    }
    res.json(results);
  });
});

app.put('/updatestaff/:id', (req, res) => {
  const id = req.params.id;
  const {ProjectId,LocationId,Date,StaffName,TaskName,Volume } = req.body;
  const query = "UPDATE tbl_taskmaster SET ProjectId=?,LocationId=?,Date=?,StaffName=? TaskName = ? Volume=? WHERE id = ?";

  misdb.query(query, [ProjectId,LocationId,Date,StaffName,TaskName,Volume, id], (err, result) => {
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
  misdb.query(
    "DELETE FROM tbl_nontech_staff WHERE id = ?",
    [id],
    (err) => {
      if (err) throw err;
      res.json({ message: "staff deleted successfully" });
    }
  );
});
