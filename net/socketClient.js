import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

socket.on("connect", () => {
    console.log("Connected to backend:", socket.id);
});

socket.on("disconnect", () => {
    console.log("Disconnected from backend");
});

export function joinRoom(roomCode, name) {
    socket.emit("room:join", {
        roomCode,
        name
    });
}

export function requestSeat(seatId) {
    socket.emit("seat:sit", { seatId });
}

export function standUpFromSeat() {
    socket.emit("seat:stand");
}

export function sendChatMessage(text) {
    socket.emit("chat:send", {
        text
    });
}

export function sendReaction(symbol) {
    socket.emit("reaction:send", { symbol });
}

export function onChatMessage(callback) {
    socket.on("chat:message", callback);

    return () => {
        socket.off("chat:message", callback);
    };
}

export function onRoomState(callback) {
    socket.on("room:state", callback);

    return () => {
        socket.off("room:state", callback);
    };
}

export function onRoomJoinError(callback) {
    socket.on("room:join-error", callback);

    return () => {
        socket.off("room:join-error", callback);
    };
}

export function onSeatError(callback) {
    socket.on("seat:error", callback);

    return () => {
        socket.off("seat:error", callback);
    };
}

export function onReaction(callback) {
    socket.on("reaction:show", callback);

    return () => {
        socket.off("reaction:show", callback);
    };
}

export default socket;
