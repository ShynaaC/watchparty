import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./socketHandlers.js";

const app = express();
const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

const PORT = 3001;

app.get("/", (req, res) => {
    res.send("WatchParty backend is running!");
});

registerSocketHandlers(io);

server.listen(PORT, () => {
    console.log(`WatchParty server running on http://localhost:${PORT}`);
});