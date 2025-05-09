const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: "shuttle.proxy.rlwy.net",
  user: "root",
  password: "bZulBFapnNkFYUBuFjZdMPJAJDXDRDoL",
  database: "railway",
  port: 43012
});

module.exports = db;