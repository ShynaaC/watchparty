const joinForm = document.getElementById("join-form");
const landingScreen = document.getElementById("landing-screen");
const displayNameInput = document.getElementById("display-name-input");
const roomCodeInput = document.getElementById("room-code-input");
const enterTheatreBtn = document.getElementById("enter-theatre");
const roomCodeDisplay = document.getElementById("room-code-display");
const guestNameDisplay = document.getElementById("guest-name-display");
const copyRoomBtn = document.getElementById("copy-room-btn");
const shareScreenBtn = document.getElementById("share-screen-btn");
const stopShareBtn = document.getElementById("stop-share-btn");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatMessages = document.getElementById("chat-messages");
const emoteBar = document.getElementById("emote-bar");
const reactionLayer = document.getElementById("reaction-layer");

const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

let guestName = "Guest";
let roomCode = "";
let localScreenStream = null;
let onScreenStreamChange = () => {};

export function initRoomUI({ onScreenStream }) {
    onScreenStreamChange = onScreenStream;

    const params = new URLSearchParams(window.location.search);
    const requestedRoom = cleanRoomCode(params.get("room") || "");
    const storedName = localStorage.getItem("watchparty_guest_name") || "";

    if (requestedRoom) {
        roomCodeInput.value = requestedRoom;
    }

    if (storedName) {
        displayNameInput.value = storedName;
    }

    joinForm.addEventListener("submit", handleJoin);
    enterTheatreBtn.addEventListener("click", enterRoom);
    copyRoomBtn.addEventListener("click", handleCopyRoom);
    shareScreenBtn.addEventListener("click", handleShareScreen);
    stopShareBtn.addEventListener("click", stopScreenShare);
    chatForm.addEventListener("submit", handleChatSubmit);
    emoteBar.addEventListener("click", handleEmoteClick);

    return {
        cleanup() {
            joinForm.removeEventListener("submit", handleJoin);
            enterTheatreBtn.removeEventListener("click", enterRoom);
            copyRoomBtn.removeEventListener("click", handleCopyRoom);
            shareScreenBtn.removeEventListener("click", handleShareScreen);
            stopShareBtn.removeEventListener("click", stopScreenShare);
            chatForm.removeEventListener("submit", handleChatSubmit);
            emoteBar.removeEventListener("click", handleEmoteClick);
            stopScreenShare();
        }
    };
}

function handleJoin(event) {
    event.preventDefault();
    enterRoom();
}

function enterRoom() {
    guestName = cleanDisplayName(displayNameInput.value);
    roomCode = cleanRoomCode(roomCodeInput.value) || createRoomCode();

    localStorage.setItem("watchparty_guest_name", guestName);

    roomCodeDisplay.textContent = roomCode;
    guestNameDisplay.textContent = guestName;
    roomCodeInput.value = roomCode;
    landingScreen.classList.add("hidden");

    const url = new URL(window.location.href);
    url.searchParams.set("room", roomCode);
    window.history.replaceState({}, "", url);

    addChatMessage("System", `Joined private room ${roomCode}.`);
}

async function handleCopyRoom() {
    if (!roomCode) {
        return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set("room", roomCode);

    try {
        await navigator.clipboard.writeText(url.toString());
        addChatMessage("System", "Room link copied.");
    } catch {
        addChatMessage("System", `Room key: ${roomCode}`);
    }
}

async function handleShareScreen() {
    if (!navigator.mediaDevices?.getDisplayMedia) {
        addChatMessage("System", "Screen sharing is not available in this browser.");
        return;
    }

    try {
        localScreenStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                width: {
                    ideal: 1920,
                    max: 3840
                },
                height: {
                    ideal: 1080,
                    max: 2160
                },
                frameRate: {
                    ideal: 30,
                    max: 60
                },
                resizeMode: "none"
            },
            audio: true
        });

        localScreenStream.getVideoTracks()[0]?.addEventListener("ended", stopScreenShare);
        onScreenStreamChange(localScreenStream);
        shareScreenBtn.classList.add("hidden");
        stopShareBtn.classList.remove("hidden");
        addChatMessage("System", "Screen share started.");
    } catch (error) {
        if (error.name !== "NotAllowedError") {
            addChatMessage("System", "Could not start screen share.");
        }
    }
}

function stopScreenShare() {
    if (!localScreenStream) {
        return;
    }

    localScreenStream.getTracks().forEach((track) => {
        track.stop();
    });

    localScreenStream = null;
    onScreenStreamChange(null);
    shareScreenBtn.classList.remove("hidden");
    stopShareBtn.classList.add("hidden");
    addChatMessage("System", "Screen share stopped.");
}

function handleChatSubmit(event) {
    event.preventDefault();

    const message = chatInput.value.trim();

    if (!message) {
        return;
    }

    addChatMessage(guestName, message);
    chatInput.value = "";
}

function handleEmoteClick(event) {
    const button = event.target.closest("[data-emote]");

    if (!button) {
        return;
    }

    const emote = button.dataset.emote;
    const symbol = button.dataset.symbol;
    const label = button.querySelector(".reaction-button-label")?.textContent.trim() || emote;

    showReaction(symbol, emote);
    addChatMessage(guestName, `${symbol} ${label}`);
}

function addChatMessage(author, text) {
    const message = document.createElement("div");
    const authorEl = document.createElement("span");
    const textEl = document.createElement("span");

    message.className = "chat-message";
    authorEl.className = "chat-author";
    textEl.className = "chat-text";

    authorEl.textContent = author;
    textEl.textContent = text;

    message.append(authorEl, textEl);
    chatMessages.append(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showReaction(symbol, emote) {
    const reaction = document.createElement("div");
    const x = 28 + Math.random() * 44;
    const y = 38 + Math.random() * 24;

    reaction.className = "reaction-pop";
    reaction.dataset.emote = emote.toLowerCase();
    reaction.textContent = symbol;
    reaction.style.setProperty("--x", `${x}%`);
    reaction.style.setProperty("--y", `${y}%`);

    reactionLayer.append(reaction);
    reaction.addEventListener("animationend", () => reaction.remove());
}

function createRoomCode() {
    const values = new Uint8Array(6);

    if (window.crypto?.getRandomValues) {
        window.crypto.getRandomValues(values);
    } else {
        values.forEach((_, index) => {
            values[index] = Math.floor(Math.random() * 256);
        });
    }

    return Array.from(values, (value) => {
        return ROOM_ALPHABET[value % ROOM_ALPHABET.length];
    }).join("");
}

function cleanRoomCode(value) {
    return value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 12);
}

function cleanDisplayName(value) {
    const cleanName = value.trim().replace(/\s+/g, " ").slice(0, 24);
    return cleanName || "Guest";
}
