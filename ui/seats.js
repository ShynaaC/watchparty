const seatPrompt = document.getElementById("seat-prompt");
const standUpBtn = document.getElementById("stand-up-btn");

let hoveredSeat = null;
let seatedSeat = null;
let handleWindowMouseMove = null;
let handleStandUpClick = null;

export function initSeatUI({ onSit, onStandUp }) {
    handleWindowMouseMove = (event) => {
        if (!hoveredSeat) {
            return;
        }

        seatPrompt.style.left = `${event.clientX}px`;
        seatPrompt.style.top = `${event.clientY}px`;
    };

    handleStandUpClick = () => {
        seatedSeat = null;
        standUpBtn.classList.add("hidden");
        onStandUp();
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
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
            hoveredSeat = null;
            seatPrompt.classList.add("hidden");
            standUpBtn.classList.remove("hidden");
            onSit(seat);
        },

        cleanup() {
            window.removeEventListener("mousemove", handleWindowMouseMove);
            standUpBtn.removeEventListener("click", handleStandUpClick);
            hoveredSeat = null;
            seatedSeat = null;
            seatPrompt.classList.add("hidden");
            standUpBtn.classList.add("hidden");
        }
    };
}
