const seatPrompt = document.getElementById("seat-prompt");
const seatActions = document.getElementById("seat-actions");
const focusScreenBtn = document.getElementById("focus-screen-btn");
const standUpBtn = document.getElementById("stand-up-btn");

let hoveredSeat = null;
let seatedSeat = null;
let screenFocused = false;
let handleWindowMouseMove = null;
let handleFocusScreenClick = null;
let handleStandUpClick = null;

export function initSeatUI({ onSit, onStandUp, onFocusScreen }) {
    handleWindowMouseMove = (event) => {
        if (!hoveredSeat) {
            return;
        }

        seatPrompt.style.left = `${event.clientX}px`;
        seatPrompt.style.top = `${event.clientY}px`;
    };

    handleFocusScreenClick = () => {
        if (!seatedSeat) {
            return;
        }

        screenFocused = !screenFocused;
        updateFocusButton();
        onFocusScreen(screenFocused, seatedSeat);
    };

    handleStandUpClick = () => {
        seatedSeat = null;
        screenFocused = false;
        seatActions.classList.add("hidden");
        updateFocusButton();
        onStandUp();
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    focusScreenBtn.addEventListener("click", handleFocusScreenClick);
    standUpBtn.addEventListener("click", handleStandUpClick);

    return {
        setHoveredSeat(seat) {
            if (seatedSeat) {
                return;
            }

            hoveredSeat = seat;
            seatPrompt.classList.toggle("hidden", !seat);
        },

        sitInSeat(seat) {
            seatedSeat = seat;
            screenFocused = false;
            hoveredSeat = null;
            seatPrompt.classList.add("hidden");
            seatActions.classList.remove("hidden");
            updateFocusButton();
            onSit(seat);
        },

        cleanup() {
            window.removeEventListener("mousemove", handleWindowMouseMove);
            focusScreenBtn.removeEventListener("click", handleFocusScreenClick);
            standUpBtn.removeEventListener("click", handleStandUpClick);
            hoveredSeat = null;
            seatedSeat = null;
            screenFocused = false;
            seatPrompt.classList.add("hidden");
            seatActions.classList.add("hidden");
            updateFocusButton();
        }
    };
}

function updateFocusButton() {
    focusScreenBtn.textContent = screenFocused
        ? "Seat View"
        : "Focus Screen";
}
