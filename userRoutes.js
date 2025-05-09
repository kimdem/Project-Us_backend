const express = require("express");
const router = express.Router();
const mysql = require("mysql2");
const bcrypt = require("bcrypt");

const db = mysql.createConnection({
  host: "shuttle.proxy.rlwy.net",
  user: "root",
  password: "bZulBFapnNkFYUBuFjZdMPJAJDXDRDoL",
  database: "railway",
  port: 43012,
});

router.post("/signup", async (req, res) => {
  const { Nick, ID, password, email } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 6);
    const sql = "INSERT INTO user (Nick, ID, Pwd, Email) VALUES (?, ?, ?, ?)";
    db.query(sql, [Nick, ID, hashedPassword, email], (err, result) => {
      if (err) return res.status(500).json({ error: "DB 저장 실패" });
      res.json({ success: true });
    });
  } catch (err) {
    res.status(500).json({ error: "서버 오류" });
  }
});

router.get("/check-duplicate", (req, res) => {
  const { field, value } = req.query;

  if (!field || !value) {
    return res.status(400).json({ error: "잘못된 요청" });
  }

  const checkSql = `SELECT * FROM user WHERE ${field} = ?`;
  db.query(checkSql, [value], (err, results) => {
    if (err) {
      console.error("중복 검사 오류:", err);
      return res.status(500).json({ error: "서버 오류" });
    }

    if (results.length > 0) {
      return res.json({ exists: true });
    } else {
      return res.json({ exists: false });
    }
  });
});

router.post("/login", (req, res) => {
  const { ID, password } = req.body;

  if (!ID || !password) {
    return res.status(400).json({ error: "유효성 검사 이상 발생" });
  }

  const sql = "SELECT * FROM user WHERE ID = ?";
  db.query(sql, [ID], async (err, results) => {
    if (err) {
      console.error("로그인 오류:", err);
      return res.status(500).json({ error: "서버 오류" });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: "ID가 존재하지 않습니다." });
    }

    const user = results[0];

    const passwordMatch = await bcrypt.compare(password, user.Pwd);
    if (!passwordMatch) {
      return res.status(401).json({ error: "비밀번호가 틀렸습니다." });
    }

    res.json({ success: true, message: "로그인 성공", user: { ID: user.ID, Nick: user.Nick, Usernum: user.User_num, Email: user.Email } });
  });
});

module.exports = router;
