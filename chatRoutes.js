const express = require("express");
const router = express.Router();
const db = require("./db");
const socket = require("./io");

router.post("/create-room", async (req, res) => {
    const { room_name, room_admin, room_password } = req.body;

    if (!room_name || !room_admin || !room_password) {
        return res.status(400).json({ message: "유효성 검사 필요" });
    }

    try {
        const sql = "INSERT INTO chat_rooms (room_name, room_admin, room_password) VALUES (?, ?, ?)";
        const [result] = await db.execute(sql, [room_name, room_admin, room_password]);
        const roomId = result.insertId;
        const sql2 = "INSERT INTO chat_room_members (room_id, user_id) VALUES (?, ?)";
        await db.execute(sql2, [roomId, room_admin]);
        return res.status(201).json({ message: "채팅방 생성 완료", room_id: result.insertId });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "서버 오류" });
    }
});

router.get("/get-room/:Usernum", async (req, res) => {
    const Usernum = req.params.Usernum;
    try {
        const sql = `
            SELECT cr.*
            FROM chat_rooms cr
            JOIN chat_room_members cm ON cr.room_id = cm.room_id
            WHERE cm.user_id = ?
        `;
        const [rooms] = await db.execute(sql, [Usernum]);

        res.status(200).json(rooms);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "서버 오류" });
    }
});

router.get("/get-room-info/:room_id", async (req, res) => {
    const {room_id} = req.params;
    try{
        const [roomInfo] = await db.query("SELECT * FROM chat_rooms WHERE room_id = ?", [room_id]);
        const [message] = await db.query(`
                SELECT c.message, c.user_id, u.Nick AS nickname, c.message_time FROM chat_message c
                JOIN user u ON c.user_id = u.User_num
                WHERE c.room_id = ? ORDER BY c.message_time ASC
            `, [room_id]);
        res.json({
            roomInfo: roomInfo[0],
            message: message || []
        });    
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "채팅방 정보 조회 오류" });
    }
});

router.post("/enter-room/", async (req, res) => {
    const { room_id, room_password, user_id } = req.body;

    try {
        const [ET] = await db.query("SELECT room_password FROM chat_rooms WHERE room_id = ?", [room_id]);
    
        if (ET.length === 0) {
          return res.json({ success: false, message: "방이 존재하지 않습니다." });
        }
    
        if (ET[0].room_password !== room_password) {
          return res.json({ success: false, message: "비밀번호가 틀렸습니다." });
        }
    
        const [existing] = await db.query("SELECT * FROM chat_room_members WHERE room_id = ? AND user_id = ?", [room_id, user_id]);
        if (existing.length === 0) {
            await db.query("INSERT INTO chat_room_members (room_id, user_id) VALUES (?, ?)", [room_id, user_id]);
            const [usernum] = await db.query("SELECT Nick FROM user WHERE User_num = ?", [user_id]);
            await db.query("INSERT INTO chat_message (room_id, user_id, message) VALUES (?, ?, ?)", [room_id, user_id, `${usernum[0].Nick}님이 입장하셨습니다.`]);
            const io = socket.getIO();
            io.to(room_id).emit("userenter", {
                user_id,
                message: `${usernum[0].Nick}님이 입장하였습니다.`,
                message_time: new Date()
        });
        } else {return res.json({ success: false, message: "중복 방지" });}
        return res.json({ success: true });
      } catch (err) {
        console.error("입장 처리 중 오류:", err);
        res.status(500).json({ success: false, message: "서버 오류" });
      }
});

router.get("/get-Whatmyroom/:room_id", async (req, res) => {
    const { room_id } = req.params;
    try {
        const [roominfo] = await db.query("SELECT * FROM chat_rooms WHERE room_id = ?", [room_id]);
        const A = roominfo[0];
        const [admin] = await db.query("SELECT Nick FROM user WHERE User_num = ?", [A.room_admin]);
        res.json({
            roominfo: roominfo[0],
            admin: admin[0].Nick,
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "방 정보 불러오기 오류" });
    }
});

router.post("/Leaveroom", async (req, res) => {
    const { room_id, user_id } = req.body;
    try {
        await db.query("DELETE FROM chat_room_members WHERE room_id = ? AND user_id = ?", [room_id, user_id]);

        const [people] = await db.query("SELECT * FROM chat_room_members WHERE room_id = ?", [room_id]);
        if(people.length === 0) {
            await db.query("DELETE FROM chat_rooms WHERE room_id = ?", [room_id]);
            await db.query("DELETE FROM chat_message WHERE room_id = ?", [room_id]);
        } else {
            const [user] = await db.query("SELECT Nick FROM user WHERE User_num = ?", [user_id]);
            await db.query("INSERT INTO chat_message (room_id, user_id, message) VALUES (?, ?, ?)", [room_id, user_id, `${user[0].Nick}님이 퇴장하셨습니다.`]);
            const io = socket.getIO();
            io.to(room_id).emit("userLeft", {
                user_id,
                message: `${user[0].Nick}님이 퇴장하셨습니다.`,
                message_time: new Date()
        });
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "퇴장 처리 오류" });
    }
});

module.exports = router;
