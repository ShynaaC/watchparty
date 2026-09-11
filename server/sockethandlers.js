import {
    addMember,
    addMessage,
    createRoom,
    getRoom,
    leaveSeat,
    removeMember,
    takeSeat
} from "./rooms.js";

export function registerSocketHandlers(io) {
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        socket.on("room:join", (details = {}) => {
            const roomCode = cleanRoomCode(details.roomCode);
            const name = cleanDisplayName(details.name);

            if (!roomCode) {
                socket.emit("room:join-error", {
                    message: "Enter a valid room key."
                });
                return;
            }

            const previousRoomCode = socket.data.roomCode;

            if (previousRoomCode && previousRoomCode !== roomCode) {
                const previousRoom = removeMember(previousRoomCode, socket.id);
                socket.leave(previousRoomCode);

                if (previousRoom) {
                    io.to(previousRoomCode).emit("room:state", previousRoom);
                }
            }

            let room = getRoom(roomCode);

            if (!room) {
                room = createRoom(roomCode, socket.id, name);
                console.log(`${name} created room ${roomCode}`);
            } else {
                const result = addMember(roomCode, socket.id, name);

                if (!result.ok) {
                    socket.emit("room:join-error", {
                        message: result.message
                    });
                    return;
                }

                room = result.room;
                console.log(`${name} joined room ${roomCode}`);
            }

            socket.join(roomCode);
            socket.data.roomCode = roomCode;
            io.to(roomCode).emit("room:state", room);
        });

        socket.on("seat:sit", ({ seatId } = {}) => {
            const roomCode = socket.data.roomCode;
            const result = takeSeat(roomCode, socket.id, seatId);

            if (!result.ok) {
                socket.emit("seat:error", {
                    message: result.message
                });
                return;
            }

            io.to(roomCode).emit("room:state", result.room);
        });

        socket.on("seat:stand", () => {
            const roomCode = socket.data.roomCode;
            const room = leaveSeat(roomCode, socket.id);

            if (room) {
                io.to(roomCode).emit("room:state", room);
            }
        });

        socket.on("chat:send", ({ text } = {}) => {
            const roomCode = socket.data.roomCode;
            const message = addMessage(roomCode, socket.id, text);

            if (message) {
                io.to(roomCode).emit("chat:message", message);
            }
        });

        socket.on("disconnect", () => {
            const roomCode = socket.data.roomCode;
            const room = removeMember(roomCode, socket.id);

            if (room) {
                io.to(roomCode).emit("room:state", room);
            }

            console.log("User disconnected:", socket.id);
        });
    });
}

function cleanRoomCode(value) {
    return String(value || "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 12);
}

function cleanDisplayName(value) {
    const cleanName = String(value || "")
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 24);

    return cleanName || "Guest";
}
