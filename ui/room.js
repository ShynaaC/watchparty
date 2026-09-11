import socket, {
    joinRoom,
    onChatMessage,
    onReaction,
    onRoomState,
    onRoomJoinError,
    onSeatError,
    onSeatTaken,
    sendChatMessage,
    sendReaction
} from "../net/socketClient.js";
import { initScreenShare } from "../net/screenShare.js";

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
const shareCountdownControl = document.getElementById("share-countdown-control");
const shareCountdownSelect = document.getElementById("share-countdown-select");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatMessages = document.getElementById("chat-messages");
const emoteBar = document.getElementById("emote-bar");
const reactionLayer = document.getElementById("reaction-layer");
const notificationLayer = document.getElementById("notification-layer");
const screenCountdown = document.getElementById("screen-countdown");
const screenCountdownNumber = document.getElementById("screen-countdown-number");

const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

let guestName = "Guest";
let roomCode = "";
let localScreenStream = null;
let onScreenStreamChange = () => {};
let unsubscribeChatMessages = null;
let unsubscribeRoomJoinErrors = null;
let unsubscribeSeatErrors = null;
let unsubscribeSeatTaken = null;
let unsubscribeReactions = null;
let unsubscribeRoomStates = null;
let screenShare = null;
let isHost = false;
let screenShareStarting = false;
let screenShareLive = false;
let countdownTimer = null;

export function initRoomUI({ onScreenStream }) {
    onScreenStreamChange = onScreenStream;
    screenShare = initScreenShare({
        onRemoteStart: () => {
            addChatMessage("System", "The host started screen sharing.");
        },
        onRemoteStream: (stream) => {
            onScreenStreamChange(stream, { muted: false });
        },
        onRemoteStop: () => {
            onScreenStreamChange(null);
            addChatMessage("System", "Screen share stopped.");
        },
        onCountdown: (countdown) => {
            showScreenCountdown(countdown);
            showNotification(
                `${countdown.hostName} starts sharing in ${countdown.seconds} seconds.`
            );
        },
        onError: (message) => {
            addChatMessage("System", message);
        }
    });

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
    roomCodeInput.addEventListener("input", clearRoomError);
    unsubscribeChatMessages = onChatMessage(handleRemoteChatMessage);
    unsubscribeRoomJoinErrors = onRoomJoinError(handleRoomJoinError);
    unsubscribeSeatErrors = onSeatError(handleSeatError);
    unsubscribeSeatTaken = onSeatTaken(handleSeatTaken);
    unsubscribeReactions = onReaction(handleRemoteReaction);
    unsubscribeRoomStates = onRoomState(handleRoomState);
    updateShareControls();

    return {
        cleanup() {
            joinForm.removeEventListener("submit", handleJoin);
            enterTheatreBtn.removeEventListener("click", enterRoom);
            copyRoomBtn.removeEventListener("click", handleCopyRoom);
            shareScreenBtn.removeEventListener("click", handleShareScreen);
            stopShareBtn.removeEventListener("click", stopScreenShare);
            chatForm.removeEventListener("submit", handleChatSubmit);
            emoteBar.removeEventListener("click", handleEmoteClick);
            roomCodeInput.removeEventListener("input", clearRoomError);
            unsubscribeChatMessages?.();
            unsubscribeRoomJoinErrors?.();
            unsubscribeSeatErrors?.();
            unsubscribeSeatTaken?.();
            unsubscribeReactions?.();
            unsubscribeRoomStates?.();
            unsubscribeChatMessages = null;
            unsubscribeRoomJoinErrors = null;
            unsubscribeSeatErrors = null;
            unsubscribeSeatTaken = null;
            unsubscribeReactions = null;
            unsubscribeRoomStates = null;
            stopScreenShare();
            screenShare?.cleanup();
            screenShare = null;
            clearScreenCountdown();
            onScreenStreamChange(null);
        }
    };
}

function handleJoin(event) {
    event.preventDefault();
    enterRoom();
}

function enterRoom() {
    clearRoomError();
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
    joinRoom(roomCode, guestName);
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
    if (screenShareStarting || localScreenStream) {
        return;
    }

    if (!isHost) {
        addChatMessage("System", "Only the host can share the screen.");
        return;
    }

    if (!navigator.mediaDevices?.getDisplayMedia) {
        addChatMessage("System", "Screen sharing is not available in this browser.");
        return;
    }

    screenShareStarting = true;
    updateShareControls();

    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
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

        localScreenStream = stream;
        updateShareControls();
        const videoTrack = stream.getVideoTracks()[0];
        videoTrack?.addEventListener("ended", stopScreenShare, { once: true });

        const countdownSeconds = Number(shareCountdownSelect.value);

        if (countdownSeconds > 0) {
            const countdown = await screenShare.startCountdown(countdownSeconds);
            await waitUntil(countdown.endsAt);
        }

        if (localScreenStream !== stream || videoTrack?.readyState === "ended") {
            return;
        }

        await screenShare.startSharing(stream);

        if (localScreenStream !== stream) {
            screenShare.stopSharing();
            return;
        }

        screenShareLive = true;
        onScreenStreamChange(stream, { muted: true });
        addChatMessage("System", "Screen share started.");
    } catch (error) {
        localScreenStream?.getTracks().forEach((track) => track.stop());
        localScreenStream = null;

        if (error.name !== "NotAllowedError") {
            addChatMessage(
                "System",
                error.message || "Could not start screen share."
            );
            showNotification(
                error.message || "Could not start screen share.",
                "warning"
            );
        }
    } finally {
        screenShareStarting = false;
        updateShareControls();
    }
}

function stopScreenShare() {
    if (!localScreenStream) {
        return;
    }

    const stream = localScreenStream;
    const wasLive = screenShareLive;
    localScreenStream = null;
    screenShareStarting = false;
    screenShareLive = false;
    screenShare?.stopSharing();

    stream.getTracks().forEach((track) => {
        track.stop();
    });

    onScreenStreamChange(null);
    clearScreenCountdown();
    updateShareControls();
    addChatMessage(
        "System",
        wasLive ? "Screen share stopped." : "Screen share cancelled."
    );
}

function handleChatSubmit(event) {
    event.preventDefault();

    const message = chatInput.value.trim();

    if (!message) {
        return;
    }

    sendChatMessage(message);
    chatInput.value = "";
}

function handleRemoteChatMessage(message) {
    addChatMessage(message.author, message.text);
}

function handleRoomState(room) {
    isHost = room?.members?.[socket.id]?.role === "host";
    updateShareControls();
}

function updateShareControls() {
    const shareIsBusy = screenShareStarting || Boolean(localScreenStream);

    shareCountdownControl.classList.toggle("hidden", !isHost || shareIsBusy);
    shareScreenBtn.classList.toggle("hidden", !isHost || shareIsBusy);
    stopShareBtn.classList.toggle("hidden", !isHost || !localScreenStream);
}

function handleRoomJoinError({ message }) {
    landingScreen.classList.remove("hidden");
    roomCodeInput.setCustomValidity(message);
    roomCodeInput.reportValidity();
}

function handleSeatError({ message }) {
    addChatMessage("System", message);
    showNotification(message, "warning");
}

function handleSeatTaken({ memberName, seatId }) {
    showNotification(`${memberName} took seat ${seatId}.`);
}

function clearRoomError() {
    roomCodeInput.setCustomValidity("");
}

function handleEmoteClick(event) {
    const button = event.target.closest("[data-emote]");

    if (!button) {
        return;
    }

    const symbol = button.dataset.symbol;

    sendReaction(symbol);
}

function handleRemoteReaction(reaction) {
    showReaction(reaction.symbol, reaction.label, reaction.author);
    addChatMessage(reaction.author, `${reaction.symbol} ${reaction.label}`);
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

function showReaction(symbol, label, author) {
    const reaction = document.createElement("div");
    const symbolEl = document.createElement("span");
    const authorEl = document.createElement("span");
    const x = 28 + Math.random() * 44;
    const y = 38 + Math.random() * 24;

    reaction.className = "reaction-pop";
    reaction.dataset.emote = label.toLowerCase();
    symbolEl.className = "reaction-pop-symbol";
    authorEl.className = "reaction-pop-author";
    symbolEl.textContent = symbol;
    authorEl.textContent = author;
    reaction.style.setProperty("--x", `${x}%`);
    reaction.style.setProperty("--y", `${y}%`);

    reaction.append(symbolEl, authorEl);
    reactionLayer.append(reaction);
    reaction.addEventListener("animationend", () => reaction.remove());
}

function showNotification(message, tone = "info") {
    const notification = document.createElement("div");

    notification.className = "room-notification";
    notification.dataset.tone = tone;
    notification.textContent = message;
    notificationLayer.append(notification);

    window.setTimeout(() => notification.remove(), 3200);
}

function showScreenCountdown({ seconds, startsAt, endsAt }) {
    clearScreenCountdown();
    screenCountdownNumber.textContent = seconds;
    screenCountdown.classList.remove("hidden");

    let previousNumber = null;

    const updateCountdown = () => {
        const now = Date.now();
        const remaining = Math.ceil((endsAt - now) / 1000);

        if (remaining <= 0) {
            clearScreenCountdown();
            return;
        }

        if (remaining !== previousNumber && now >= startsAt) {
            previousNumber = Math.min(remaining, seconds);
            screenCountdownNumber.textContent = previousNumber;
            screenCountdownNumber.classList.remove("is-ticking");
            void screenCountdownNumber.offsetWidth;
            screenCountdownNumber.classList.add("is-ticking");
        }

        countdownTimer = window.setTimeout(updateCountdown, 80);
    };

    updateCountdown();
}

function clearScreenCountdown() {
    window.clearTimeout(countdownTimer);
    countdownTimer = null;
    screenCountdown.classList.add("hidden");
    screenCountdownNumber.classList.remove("is-ticking");
}

function waitUntil(timestamp) {
    return new Promise((resolve) => {
        window.setTimeout(resolve, Math.max(0, timestamp - Date.now()));
    });
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
