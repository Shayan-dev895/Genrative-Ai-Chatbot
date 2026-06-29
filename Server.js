import express from "express";
import generate from "./Chatbot.js";
import cors from "cors";

const app = express();
app.use(cors())
app.use(express.json());
app.get("/", (req, res) => {
    res.send("Hello World!");
})

app.post("/chat", async (req, res) => {
    const { message,userid } = req.body;

    if (!message || !userid) {
        return res.status(400).json({ error: "message and userid are required" });
    }

    const result = await generate(message,userid);

    res.json({ message, result });
});

app.listen(2001, () => {
    console.log("Server running on 2001");
});