const express = require("express");
const router = express.Router();
const db = require("./db");
const bcrypt = require("bcrypt");

router.get("/get-user", async (req, res) => {
    try {
        const sql = "SELECT * FROM user";
        const [user] = await db.execute(sql);
        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "서버 오류" });
    }
});

router.get("/get-doc", async (req, res) => {
    try {
        const sql = "SELECT * FROM DOC";
        const [doc] = await db.execute(sql);
        res.status(200).json(doc);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "서버 오류" });
    }
});

router.get("/get-chat", async (req, res) => {
    try {
        const sql = "SELECT * FROM chat_rooms";
        const [chat] = await db.execute(sql);
        res.status(200).json(chat);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "서버 오류" });
    }
});

router.get("/get-userfix/:User_num", async (req, res) => {
    try {
        const {User_num} = req.params;
        const sql = "SELECT * FROM user WHERE User_num = ?";
        const [user] = await db.execute(sql, [User_num]);
        if(user.length > 0) {
            res.status(200).json(user[0]);
        } else {
            res.status(404).json({message: "User_num 파라미터 에러"});
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "서버 오류" });
    }
});

router.post("/user-fix/:User_num", async (req, res) => {
    const {User_num} = req.params;
    const { Nick, ID, Pwd, Email} = req.body;
    if(Pwd.trim() === "") {
        try {
            const sql = "UPDATE user SET Nick=?, ID=?, Email=? WHERE User_num=?";
            const [user] = await db.execute(sql, [Nick, ID, Email, User_num]);
            res.status(200).json({success: true});
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "서버 오류" });
        }
    } else {
        const hashedPassword = await bcrypt.hash(Pwd, 6);
        try {
            const sql = "UPDATE user SET Nick=?, ID=?, Pwd=?, Email=? WHERE User_num=?";
            const [user] = await db.execute(sql, [Nick, ID, hashedPassword, Email, User_num]);
            res.status(200).json({success: true});
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "서버 오류" });
        }
    }
});

router.post("/user-remove/:User_num", async (req, res)=> {
    const {User_num} = req.params;
    try {
        const sql = "DELETE FROM user WHERE User_num=?";
        const [user] = await db.execute(sql, [User_num]);
        res.status(200).json({success: true});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "서버 오류" });
    }
});

router.get("/get-docfix/:DOC_id", async (req, res) => {
    const {DOC_id} = req.params;
    try {
        const sql = "SELECT * FROM DOC WHERE DOC_id=?";
        const [doc] = await db.execute(sql, [DOC_id]);
        if(doc.length > 0) {
            res.status(200).json(doc[0]);
        } else {
            res.status(404).json({message: "DOC_id 파라미터 에러"});
        }
    } catch(error) {
        console.error(error);
        res.status(500).json({ message: "서버 오류" });
    }
});

router.post("/doc-fix/:DOC_id", async (req, res) => {
    const {DOC_id} = req.params;
    const {DOC_name, DOC_admin, DOC_password} = req.body;
    try {
        const sql = "UPDATE DOC SET DOC_name=?, DOC_admin=?, DOC_password=? WHERE DOC_id=?";
        const [doc] = await db.execute(sql, [DOC_name, DOC_admin, DOC_password, DOC_id]);
        res.status(200).json({success: true});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "서버 오류" });
    }
});

router.post("/doc-remove/:DOC_id", async (req, res) => {
    const {DOC_id} = req.params;
    try {
        const sql = "DELETE FROM DOC WHERE DOC_id=?";
        const [doc] = await db.execute(sql, [DOC_id]);
        res.status(200).json({success: true});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "서버 오류" });
    }

});

router.get("/get-chatfix/:room_id", async (req, res) => {
    const {room_id} = req.params;
    try {
        const sql = "SELECT * FROM chat_rooms WHERE room_id=?";
        const [chat] = await db.execute(sql, [room_id]);
        if(chat.length > 0) {
            res.status(200).json(chat[0]);
        } else {
            res.status(404).json({message: "room_id 파라미터 에러"});
        }
    } catch(error) {
        console.error(error);
        res.status(500).json({ message: "서버 오류" });
    }
});

router.post("/chat-remove/:room_id", async (req, res) => {
    const {room_id} = req.params;
    try {
        const sql = "DELETE FROM chat_rooms WHERE room_id=?";
        const [chat] = await db.execute(sql, [room_id]);
        res.status(200).json({success: true});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "서버 오류" });
    }
});

router.post("/chat-fix/:room_id", async (req, res) => {
    const {room_id} = req.params;
    const {room_name, room_password} = req.body;
    try {
        const sql = "UPDATE chat_rooms SET room_name=?, room_password=? WHERE room_id=?";
        const [chat] = await db.execute(sql, [room_name, room_password, room_id]);
        res.status(200).json({success: true});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "서버 오류" });
    }
});
module.exports = router;