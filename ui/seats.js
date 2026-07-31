// ==========================================
// SEAT UI — hover prompt, click-to-sit, stand up
// ==========================================

const seatPrompt   = document.getElementById('seat-prompt');
const standUpBtn    = document.getElementById('stand-up-btn');

let hoveredSeat = null;
let seatedSeat  = null;


export function initSeatUI({ onSit, onStandUp }) {

    // ==========================================
    // MOUSE MOVE — position tooltip
    // ==========================================

    window.addEventListener('mousemove', (event) => {

        if (hoveredSeat) {

            seatPrompt.style.left = `${event.clientX}px`;
            seatPrompt.style.top  = `${event.clientY}px`;

        }

    });


    // ==========================================
    // STAND UP BUTTON
    // ==========================================

    standUpBtn.addEventListener('click', () => {

        seatedSeat = null;
        standUpBtn.classList.add('hidden');

        onStandUp();

    });


    // ==========================================
    // EXPOSE HOVER/SIT HANDLERS FOR THE RAYCASTER
    // ==========================================

    return {

        setHoveredSeat(seat) {

            if (seatedSeat) return; // no prompt while already seated

            hoveredSeat = seat;

            if (seat) {
                seatPrompt.classList.remove('hidden');
            } else {
                seatPrompt.classList.add('hidden');
            }

        },

        sitInSeat(seat) {

            seatedSeat = seat;

            seatPrompt.classList.add('hidden');
            standUpBtn.classList.remove('hidden');

            onSit(seat);

        }

    };

}