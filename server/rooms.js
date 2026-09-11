const rooms = {};

export const SEAT_IDS = [
    "A1", "A2", "A3", "A4",
    "B1", "B2", "B3", "B4"
];

export const MAX_MEMBERS = SEAT_IDS.length;

export function getRoom(roomCode) {
    return rooms[roomCode];
}

export function createRoom(roomCode, hostId, hostName) {
    const room = {
        code: roomCode,
        hostId,
        members: {
            [hostId]: {
                id: hostId,
                name: hostName,
                role: "host",
                seatId: null
            }
        },
        seats: {},
        messages: []
    };

    rooms[roomCode] = room;
    return room;
}

export function addMember(roomCode, socketId, name) {
    const room = getRoom(roomCode);

    if (!room) {
        return {
            ok: false,
            message: "Room does not exist."
        };
    }

    // Joining twice from the same connection should not add two members.
    if (room.members[socketId]) {
        return {
            ok: true,
            room
        };
    }

    if (Object.keys(room.members).length >= MAX_MEMBERS) {
        return {
            ok: false,
            message: `This room is full. Maximum ${MAX_MEMBERS} people.`
        };
    }

    room.members[socketId] = {
        id: socketId,
        name,
        role: "member",
        seatId: null
    };

    return {
        ok: true,
        room
    };
}

export function takeSeat(roomCode, socketId, seatId) {
    const room = getRoom(roomCode);
    const member = room?.members[socketId];

    if (!room || !member) {
        return {
            ok: false,
            message: "You are not inside this room."
        };
    }

    if (!SEAT_IDS.includes(seatId)) {
        return {
            ok: false,
            message: "That seat does not exist."
        };
    }

    const currentOccupant = room.seats[seatId];

    if (currentOccupant && currentOccupant !== socketId) {
        return {
            ok: false,
            message: `Seat ${seatId} is already taken.`
        };
    }

    // Free the member's previous seat before assigning the new one.
    if (member.seatId && member.seatId !== seatId) {
        delete room.seats[member.seatId];
    }

    room.seats[seatId] = socketId;
    member.seatId = seatId;

    return {
        ok: true,
        room
    };
}

export function leaveSeat(roomCode, socketId) {
    const room = getRoom(roomCode);
    const member = room?.members[socketId];

    if (!room || !member) {
        return null;
    }

    if (member.seatId) {
        delete room.seats[member.seatId];
        member.seatId = null;
    }

    return room;
}

export function removeMember(roomCode, socketId) {
    const room = getRoom(roomCode);
    const member = room?.members[socketId];

    if (!room || !member) {
        return null;
    }

    if (member.seatId) {
        delete room.seats[member.seatId];
    }

    delete room.members[socketId];

    const remainingMembers = Object.values(room.members);

    if (remainingMembers.length === 0) {
        delete rooms[roomCode];
        return null;
    }

    // Give host permissions to another member if the host leaves.
    if (room.hostId === socketId) {
        const newHost = remainingMembers[0];

        room.hostId = newHost.id;
        newHost.role = "host";
    }

    return room;
}

export function addMessage(roomCode, socketId, text) {
    const room = getRoom(roomCode);
    const member = room?.members[socketId];
    const cleanText = String(text || "").trim().slice(0, 160);

    if (!room || !member || !cleanText) {
        return null;
    }

    const message = {
        id: `${Date.now()}-${socketId}`,
        author: member.name,
        text: cleanText,
        sentAt: Date.now()
    };

    room.messages.push(message);
    room.messages = room.messages.slice(-30);

    return message;
}