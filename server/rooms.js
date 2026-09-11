const rooms = {};

export function getRoom(roomCode) {
    return rooms[roomCode];
}

export function createRoom(roomCode, hostId, hostName) {
    rooms[roomCode] = {
        code: roomCode,
        hostId: hostId,
        members: {
            [hostId]: {
                id: hostId,
                name: hostName,
                role: "host"
            }
        },
        seats: {},
        messages: []
    };

    return rooms[roomCode];
}

export function addMember(roomCode, socketId, name) {
    rooms[roomCode].members[socketId] = {
        id: socketId,
        name: name,
        role: "member"
    };
}