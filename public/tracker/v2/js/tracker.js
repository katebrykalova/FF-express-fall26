/* =========================================================
   Calc Practice Tracker v2 — form logic and validation
   ========================================================= */

/**
 * Returns today's date as YYYY-MM-DD using the LOCAL clock
 * (toISOString would give the UTC date, which can be tomorrow in the evening).
 */
function getLocalDateString() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
}

/**
 * Shows (or clears, when message is "") the red error under one field
 * and toggles the red border on its input.
 */
function setFieldError(input, errorEl, message) {
    errorEl.textContent = message;
    input.classList.toggle("input-invalid", message !== "");
}

/**
 * Shows a message below the form. type is "success" (green) or "error" (red).
 */
function showFormMessage(text, type) {
    const el = document.getElementById("formMessage");
    el.textContent = text;
    el.className = "form-message " + (type === "success" ? "msg-success" : "msg-error");
}

/**
 * Checks the date and problems fields. Shows a message under each invalid
 * field and returns true only if everything is valid.
 */
function validateForm() {
    const dateInput = document.getElementById("date");
    const problemsInput = document.getElementById("problems");
    let valid = true;

    // Date: must not be empty
    if (dateInput.value === "") {
        setFieldError(dateInput, document.getElementById("dateError"), "Pick a date.");
        valid = false;
    } else {
        setFieldError(dateInput, document.getElementById("dateError"), "");
    }

    // Problems: whole number from 1 to 100.
    // A number input reports "" for both empty and unparseable text, so one check covers both.
    const raw = problemsInput.value.trim();
    const num = Number(raw);
    if (raw === "" || !Number.isInteger(num) || num < 1 || num > 100) {
        setFieldError(problemsInput, document.getElementById("problemsError"), "Enter a whole number from 1 to 100.");
        valid = false;
    } else {
        setFieldError(problemsInput, document.getElementById("problemsError"), "");
    }

    return valid;
}

/**
 * Handles the form submit: validates, POSTs the entry as JSON to /tracker/v2/save,
 * and shows the success or error message.
 */
async function handleSubmit(event) {
    event.preventDefault();
    document.getElementById("formMessage").textContent = "";

    if (!validateForm()) {
        return;
    }

    const saveBtn = document.getElementById("saveBtn");
    const problemsInput = document.getElementById("problems");
    const entry = {
        date: document.getElementById("date").value,
        problems: Number(problemsInput.value),
        topic: document.getElementById("topic").value
    };

    saveBtn.disabled = true; // prevent double-saves from fast clicking
    try {
        const response = await fetch("/tracker/v2/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(entry)
        });
        const result = await response.json();

        if (response.ok && result.success) {
            const word = result.count === 1 ? "session" : "sessions";
            showFormMessage("Saved! You've logged " + result.count + " " + word + ".", "success");
            problemsInput.value = ""; // reset only the problems field
            problemsInput.focus();
        } else {
            showFormMessage(result.error || "Something went wrong. Please try again.", "error");
        }
    } catch (err) {
        showFormMessage("Couldn't reach the server. Is it running?", "error");
    } finally {
        saveBtn.disabled = false;
    }
}

/**
 * Clears a field's error as soon as the user edits it, so stale red text doesn't linger.
 */
function clearErrorOnInput(inputId, errorId) {
    const input = document.getElementById(inputId);
    input.addEventListener("input", function () {
        setFieldError(input, document.getElementById(errorId), "");
    });
}

/**
 * Sets up the page: default date = today (local), wires the submit and input handlers.
 */
function initForm() {
    document.getElementById("date").value = getLocalDateString();
    document.getElementById("sessionForm").addEventListener("submit", handleSubmit);
    clearErrorOnInput("date", "dateError");
    clearErrorOnInput("problems", "problemsError");
}

document.addEventListener("DOMContentLoaded", initForm);
