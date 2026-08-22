const panelControls = document.getElementById("panel-controls");

export function initPanelUI() {
    panelControls.addEventListener("click", handlePanelToggle);

    return {
        cleanup() {
            panelControls.removeEventListener("click", handlePanelToggle);
        }
    };
}

function handlePanelToggle(event) {
    const button = event.target.closest("[data-panel-target]");

    if (!button || !panelControls.contains(button)) {
        return;
    }

    const panel = document.getElementById(button.dataset.panelTarget);

    if (!panel) {
        return;
    }

    const isVisible = button.getAttribute("aria-expanded") === "true";
    setPanelVisible(button, panel, !isVisible);
}

function setPanelVisible(button, panel, isVisible) {
    const panelName = button.dataset.panelName;
    const nextAction = isVisible ? "Hide" : "Show";

    panel.classList.toggle("hidden", !isVisible);
    button.setAttribute("aria-expanded", String(isVisible));
    button.setAttribute("aria-label", `${nextAction} ${panelName}`);
    button.title = `${nextAction} ${panelName}`;
}
