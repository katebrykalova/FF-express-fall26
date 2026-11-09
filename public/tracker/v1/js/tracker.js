// Form logic for index.html: sends a new session to the server

const form = document.getElementById("session-form");
const dateInput = document.getElementById("date");
const problemsInput = document.getElementById("problems");
const topicInput = document.getElementById("topic");
const message = document.getElementById("message");

/**
 * Returns today's date as YYYY-MM-DD in the user's LOCAL time zone.
 * (toISOString() uses UTC, which gives tomorrow's date in the evening in Miami.)
 */
function todayString() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

/**
 * Shows a message under the form. isError turns the text red.
 */
function showMessage(text, isError) {
    message.textContent = text;
    message.classList.toggle("error", Boolean(isError));
}

/**
 * Handles the form submit: POSTs the entry as JSON, then shows the saved count
 * and resets the problems field.
 */
async function saveSession(event) {
    event.preventDefault();

    const entry = {
        date: dateInput.value || todayString(),
        problems: Number(problemsInput.value),
        topic: topicInput.value
    };

    try {
        const response = await fetch("/tracker/v1/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(entry)
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
            showMessage("Couldn't save: " + (result.error || "unknown error"), true);
            return;
        }

        const word = result.count === 1 ? "session" : "sessions";
        showMessage(`Saved! You've logged ${result.count} ${word}.`, false);
        problemsInput.value = "";
        problemsInput.focus();
    } catch (err) {
        showMessage("Couldn't reach the server.", true);
    }
}

dateInput.value = todayString();
form.addEventListener("submit", saveSession);
