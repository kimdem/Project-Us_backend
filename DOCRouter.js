const express = require("express");
const puppeteer = require('puppeteer');
const router = express.Router();
const path = require("path");
const db = require("./db");

router.post("/create-doc", async (req, res) => {
    const { doc_name, doc_password, doc_des, doc_admin } = req.body;

    if (!doc_name || !doc_password || !doc_admin) {
        return res.status(400).json({ message: "유효성 검사 필요" });
    }

    try {
        const sql = "INSERT INTO DOC (DOC_name, DOC_password, des, DOC_admin) VALUES (?, ?, ?, ?)";
        const [result] = await db.execute(sql, [doc_name, doc_password, doc_des, doc_admin]);
        const docId = result.insertId;
        const sql2 = "INSERT INTO DOC_members (DOC_id, user_id) VALUES (?, ?)";
        await db.execute(sql2, [docId, doc_admin]);
        const sql3 = "INSERT INTO DOC_content (DOC_id, content) VALUES (?, ?)";
        const def = "문서를 입력하세요."
        await db.execute(sql3, [docId, def]);
        return res.status(201).json({ message: "문서 방 생성 완료"});
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "서버 오류" });
    }
});

router.post("/enter-doc", async (req, res) => {
    const { doc_id, doc_password, user_id } = req.body;
    if (!doc_id || !doc_password || !user_id) {
        return res.status(400).json({ message: "유효성 검사 필요" });
    }
    try {
        const sql = "SELECT * FROM DOC WHERE DOC_id = ? AND DOC_password = ?";
        const [doc] = await db.execute(sql, [doc_id, doc_password]);
        if (doc.length === 0) {
            return res.status(404).json({ message: "문서 방을 찾을 수 없습니다." });
        }
        if (doc[0].DOC_password !== doc_password) {
            return res.json({ success: false, message: "비밀번호가 틀렸습니다." });
        }
        const [existing] = await db.execute("SELECT * FROM DOC_members WHERE DOC_id = ? AND user_id = ?", [doc_id, user_id]);
        if (existing.length > 0) {
            return res.status(400).json({ message: "이미 참가한 문서 방입니다." });
        }
        const sql2 = "INSERT INTO DOC_members (DOC_id, user_id) VALUES (?, ?)";
        await db.execute(sql2, [doc_id, user_id]);
        return res.status(200).json({ success: true, message: "문서 방에 참가했습니다." });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "서버 오류" });
    }
});

router.get("/get-doc/:user_id", async (req, res) => {
    const { user_id } = req.params;
    if (!user_id) {
        return res.status(400).json({ message: "유효성 검사 필요" });
    }
    try {
        const sql = `SELECT doc.* FROM DOC doc JOIN DOC_members dm ON doc.DOC_id = dm.DOC_id WHERE dm.user_id = ?`;
        const [docs] = await db.execute(sql, [user_id]);
        return res.status(200).json(docs);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "서버 오류" });
    }
});

router.get("/getDOCinfo/:DOC_id", async (req, res) => {
    const {DOC_id} = req.params;
    if(!DOC_id) {return res.status(400).json({message: "파라미터 오류"})}
    
    try {
        const sql = "SELECT DOC_name FROM DOC WHERE DOC_id = ?";
        const [docname] = await db.execute(sql, [DOC_id]);

        if(docname.length === 0) {return res.status(404).json({ error: "404 error : 페이지 탐색 실패" });}
        const sql2 = "SELECT u.Nick FROM DOC_members dm JOIN user u ON dm.user_id = u.User_num WHERE dm.doc_id=?"
        const [member] = await db.execute(sql2, [DOC_id]);

        if(member.length === 0) {return res.status(404).json({ error: "404 error : 사용자 탐색 실패" });}

        const DOCNAME = docname[0].DOC_name;
        const MEMBER = member.map(Nickname => Nickname.Nick);
        return res.json({DOCNAME, MEMBER});
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "서버 오류" });
    }
});

router.post("/saveDOC", async (req, res) => {
    const {DOC_id, msg} = req.body;
    if(!DOC_id || msg === undefined) {
        return res.status(400).json({message: "데이터 요청 오류"})
    }

    try {
        const sql = "UPDATE DOC_content SET content = ? WHERE DOC_id = ?"
        const [save] = await db.execute(sql, [msg, DOC_id]);
        if(save.length === 0) {return res.status(404).json({message: "404"});}

        return res.json({success: true});
    } catch(err) {
        console.log(err);
        return res.status(500).json({ message: "서버 오류" });
    }
});

router.get("/loadDOC/:docId", async (req, res) => {
    const {docId} = req.params;
    if(!docId) {return res.status(400).json({error: "params오류"});}
    try {
        const sql = "SELECT content FROM DOC_content WHERE DOC_id = ?";
        const [load] = await db.execute(sql, [docId]);
        if(load.length === 0) {return res.status(200).json({content: "none"});}
        return res.json({content: load[0].content});
    } catch(err) {
        console.log("loadDoc: ", err)
        return res.status(500).json({error: "서버오류"});
    }
});

router.post("/editor_pdf", express.text({type: "text/html" }), async (req, res) => {
    const  html = req.body;
    try {
        const browser = await puppeteer.launch({headless: true});
        const page = await browser.newPage();
        try {
            await page.setContent(html, { waitUntil: 'networkidle0' });
            await page.addStyleTag({path: path.join(__dirname, "htmltag.css")});
        } catch (styleError) {
            console.error("Style Error: " + styleError);
        }
        const pdfBuffer = await page.pdf({ format: 'A4' });
        await browser.close();
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename=document.pdf',
        });
        res.send(Buffer.from(pdfBuffer));
    } catch (error) {
        console.log("error: " + error);
        res.status(500).send('Error generating PDF');
    }
});

module.exports = router;