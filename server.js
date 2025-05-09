require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const http = require("http");
const server = http.createServer(app);
const {Server} = require("socket.io");
const socket = require("./io");
const db = require("./db");
const userRoutes = require("./userRoutes"); 
const chatRoutes = require("./chatRoutes");
const DOCRouter = require("./DOCRouter");
const admin = require("./admin");

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/DOC", DOCRouter);
app.use("/api/admin", admin);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

socket.setIO(io);

io.on("connection", (socket) => {
  console.log("websocket 연결:", socket.id);

  socket.on("joinRoom", (room_id) => {
    socket.join(room_id);
  });

  socket.on("sendMessage", async (data) => {
    const { room_id, user_id, message } = data;
    try {
      await db.query("INSERT INTO chat_message (room_id, user_id, message) VALUES (?, ?, ?)", [room_id, user_id, message]);
      const [NICK] = await db.query("SELECT Nick FROM user WHERE User_num = ?", [user_id]);
      io.to(room_id).emit("receiveMessage", {
        user_id,
        nickname: NICK[0].Nick,
        message,
        message_time: new Date()
      });
    } catch (err) {
      console.error("메시지 저장 오류:", err);
    }
  });

  socket.on("joinDOC", (docId) => {
    socket.join(docId);
  });



  socket.on("docEdit", ({ docId, content }) => {
    socket.to(`DOC_${docId}`).emit("docUpdate", content);
  });

  socket.on("disconnect", () => {
    console.log("사용자 퇴장:", socket.id);
  });
});


server.listen(5000, () => {
  console.log("서버 구동 성공");
});
