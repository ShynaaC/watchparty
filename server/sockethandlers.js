import { getRoom, createRoom, addMember } from "./rooms.js";

export function registerSocketHandlers(io) {

    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        socket.on("room:join", ({ roomCode, name }) => {

            let room = getRoom(roomCode);

            if (!room) {
                room = createRoom(roomCode, socket.id, name);
                console.log(`${name} created room ${roomCode}`);
            } else {
                addMember(roomCode, socket.id, name);
                console.log(`${name} joined room ${roomCode}`);
            }

            socket.join(roomCode);
            io.to(roomCode).emit("room:state", room);
            console.log(room);
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });
}