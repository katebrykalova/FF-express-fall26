// Dashboard logic: fetches the data, builds both charts, feeds the sketch, handles clear

const TOPICS = ["Limits", "Derivatives", "Applications of Derivatives", "Integrals"];
const TOPIC_COLORS = ["#F59E0B", "#10B981", "#3B82F6", "#EC4899"];

let dailyChart = null;
let topicChart = null;

/**
 * Adds up problems per date and returns { labels, values } sorted oldest to newest.
 */
function totalsByDate(entries) {
    const totals = {};
    for (const e of entries) {
        totals[e.date] = (totals[e.date] || 0) + Number(e.problems);
    }
    const labels = Object.keys(totals).sort(); // YYYY-MM-DD sorts correctly as text
    return { labels: labels, values: labels.map((d) => totals[d]) };
}

/**
 * Adds up problems per topic, in the fixed TOPICS order.
 */
function totalsByTopic(entries) {
    return TOPICS.map((topic) =>
        entries
            .filter((e) => e.topic === topic)
            .reduce((sum, e) => sum + Number(e.problems), 0)
    );
}

/**
 * Builds (or rebuilds) the bar chart of problems per day.
 */
function buildDailyChart(entries) {
    const data = totalsByDate(entries);
    if (dailyChart) {
        dailyChart.destroy();
    }
    dailyChart = new Chart(document.getElementById("dailyChart"), {
        type: "bar",
        data: {
            labels: data.labels,
            datasets: [{
                label: "Problems",
                data: data.values,
                backgroundColor: "#4F46E5",
                borderRadius: 4,
                maxBarThickness: 60 // stops a single date from filling the whole chart
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: "Problems Solved per Day", font: { size: 16 } },
                legend: { display: false }
            },
            scales: {
                x: { title: { display: true, text: "Date" } },
                y: { beginAtZero: true, title: { display: true, text: "Problems" }, ticks: { precision: 0 } }
            }
        }
    });
}

/**
 * Builds (or rebuilds) the doughnut chart of problems per topic.
 */
function buildTopicChart(entries) {
    if (topicChart) {
        topicChart.destroy();
    }
    topicChart = new Chart(document.getElementById("topicChart"), {
        type: "doughnut",
        data: {
            labels: TOPICS,
            datasets: [{
                data: totalsByTopic(entries),
                backgroundColor: TOPIC_COLORS
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: "Problems by Topic", font: { size: 16 } },
                legend: { position: "bottom" }
            }
        }
    });
}

/**
 * Removes both charts from the page.
 */
function destroyCharts() {
    if (dailyChart) { dailyChart.destroy(); dailyChart = null; }
    if (topicChart) { topicChart.destroy(); topicChart = null; }
}

/**
 * Shows either the charts or the empty message, depending on the data,
 * and updates the p5 tower to match.
 */
function render(entries) {
    const empty = entries.length === 0;
    document.getElementById("empty-message").hidden = !empty;
    document.getElementById("dashboard-grid").hidden = empty;

    if (empty) {
        destroyCharts();
    } else {
        buildDailyChart(entries);
        buildTopicChart(entries);
    }
    updateTower(entries); // defined in sketch.js
}

/**
 * Fetches the saved entries from the server and renders everything.
 */
async function loadData() {
    try {
        const response = await fetch("/tracker/v1/data");
        const entries = await response.json();
        render(Array.isArray(entries) ? entries : []);
    } catch (err) {
        render([]);
    }
}

/**
 * Deletes the cookie on the server, then empties the charts and the tower
 * without reloading the page.
 */
async function clearData() {
    if (!confirm("Delete all logged sessions?")) {
        return;
    }
    try {
        const response = await fetch("/tracker/v1/clear", { method: "DELETE" });
        const result = await response.json();
        if (result.success) {
            render([]);
        }
    } catch (err) {
        alert("Couldn't reach the server.");
    }
}

document.getElementById("clear-btn").addEventListener("click", clearData);
loadData();
