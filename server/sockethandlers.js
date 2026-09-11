import {
    addMember,
    addMessage,
    addReaction,
    beginScreenShare,
    createRoom,
    endScreenShare,
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
                const activePreviousRoom = getRoom(previousRoomCode);
                const previousSharerId = activePreviousRoom?.screenSharerId;
                const wasPreviousSharer = previousSharerId === socket.id;
                const previousRoom = removeMember(previousRoomCode, socket.id);

                if (previousSharerId && !wasPreviousSharer) {
                    io.to(previousSharerId).emit("screen:viewer-left", {
                        viewerId: socket.id
                    });
                }

                if (wasPreviousSharer) {
                    io.to(previousRoomCode).emit("screen:stopped", {
                        sharerId: socket.id
                    });
                }

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

            if (room.screenSharerId && room.screenSharerId !== socket.id) {
                socket.emit("screen:started", {
                    sharerId: room.screenSharerId
                });
                io.to(room.screenSharerId).emit("screen:viewer-ready", {
                    viewerId: socket.id
                });
            }
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

            if (result.changed) {
                io.to(roomCode).emit("seat:taken", {
                    memberId: socket.id,
                    memberName: result.memberName,
                    seatId
                });
            }
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

        socket.on("reaction:send", ({ symbol } = {}) => {
            const roomCode = socket.data.roomCode;
            const reaction = addReaction(roomCode, socket.id, symbol);

            if (reaction) {
                io.to(roomCode).emit("reaction:show", reaction);
            }
        });

        socket.on("screen:start", (reply) => {
            const respond = typeof reply === "function" ? reply : () => {};
            const roomCode = socket.data.roomCode;
            const result = beginScreenShare(roomCode, socket.id);

            if (!result.ok) {
                respond({ ok: false, message: result.message });
                return;
            }

            const room = result.room;
            respond({ ok: true });
            io.to(roomCode).emit("room:state", room);
            io.to(roomCode).emit("screen:started", {
                sharerId: socket.id
            });

            Object.keys(room.members).forEach((memberId) => {
                if (memberId !== socket.id) {
                    socket.emit("screen:viewer-ready", {
                        viewerId: memberId
                    });
                }
            });
        });

        socket.on("screen:countdown", ({ seconds } = {}, reply) => {
            const respond = typeof reply === "function" ? reply : () => {};
            const room = getRoom(socket.data.roomCode);
            const duration = Number(seconds);

            if (!room?.members[socket.id] || room.hostId !== socket.id) {
                respond({ ok: false, message: "Only the host can start the countdown." });
                return;
            }

            if (![3, 5, 10].includes(duration)) {
                respond({ ok: false, message: "Choose a valid countdown length." });
                return;
            }

            const startsAt = Date.now() + 250;
            const endsAt = startsAt + duration * 1000;
            const countdown = {
                seconds: duration,
                startsAt,
                endsAt,
                hostName: room.members[socket.id].name
            };

            respond({ ok: true, startsAt, endsAt });
            io.to(room.code).emit("screen:countdown", countdown);
        });

        socket.on("screen:stop", () => {
            const roomCode = socket.data.roomCode;
            const room = endScreenShare(roomCode, socket.id);

            if (room) {
                io.to(roomCode).emit("room:state", room);
                io.to(roomCode).emit("screen:stopped", {
                    sharerId: socket.id
                });
            }
        });

        socket.on("screen:offer", ({ targetId, description } = {}) => {
            const room = getRoom(socket.data.roomCode);

            if (
                room?.screenSharerId !== socket.id ||
                !room.members[targetId] ||
                targetId === socket.id ||
                !description
            ) {
                return;
            }

            io.to(targetId).emit("screen:offer", {
                sharerId: socket.id,
                description
            });
        });

        socket.on("screen:answer", ({ targetId, description } = {}) => {
            const room = getRoom(socket.data.roomCode);

            if (
                !room?.members[socket.id] ||
                room.screenSharerId !== targetId ||
                !description
            ) {
                return;
            }

            io.to(targetId).emit("screen:answer", {
                viewerId: socket.id,
                description
            });
        });

        socket.on("screen:ice", ({ targetId, candidate } = {}) => {
            const room = getRoom(socket.data.roomCode);
            const isValidPair = room && (
                room.screenSharerId === socket.id ||
                room.screenSharerId === targetId
            );

            if (!isValidPair || !room.members[targetId] || !candidate) {
                return;
            }

            io.to(targetId).emit("screen:ice", {
                fromId: socket.id,
                candidate
            });
        });

        socket.on("disconnect", () => {
            const roomCode = socket.data.roomCode;
            const activeRoom = getRoom(roomCode);
            const sharerId = activeRoom?.screenSharerId;
            const wasScreenSharer = sharerId === socket.id;
            const room = removeMember(roomCode, socket.id);

            if (sharerId && !wasScreenSharer) {
                io.to(sharerId).emit("screen:viewer-left", {
                    viewerId: socket.id
                });
            }

            if (wasScreenSharer) {
                io.to(roomCode).emit("screen:stopped", {
                    sharerId: socket.id
                });
            }

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
