/* =========================================================
   Calc Practice Tracker v2 — dashboard (fetch, charts, clear)
   Uses TOPIC_ORDER, TOPIC_COLORS and formatShortDate from sketch.js
   ========================================================= */

let barChart = null;
let doughnutChart = null;

/**
 * Gets the saved entries from the server. Returns [] if anything goes wrong.
 */
async function fetchEntries() {
    try {
        const response = await fetch("/tracker/v2/data");
        if (!response.ok) {
            return [];
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (err) {
        return [];
    }
}

/**
 * Builds the stacked-bar data: sorted dates and, for each topic,
 * the problems per date (same date + same topic are added together).
 */
function buildBarData(entries) {
    const dates = Array.from(new Set(entries.map(function (e) { return e.date; }))).sort();
    const datasets = TOPIC_ORDER.map(function (topic) {
        const values = dates.map(function (date) {
            return entries
                .filter(function (e) { return e.date === date && e.topic === topic; })
                .reduce(function (sum, e) { return sum + e.problems; }, 0);
        });
        return {
            label: topic,
            data: values,
            backgroundColor: TOPIC_COLORS[topic],
            borderColor: "#FFFFFF",
            borderWidth: 1
        };
    });
    return { labels: dates.map(formatShortDate), datasets: datasets };
}

/**
 * Returns total problems per topic, in TOPIC_ORDER.
 */
function buildTopicTotals(entries) {
    return TOPIC_ORDER.map(function (topic) {
        return entries
            .filter(function (e) { return e.topic === topic; })
            .reduce(function (sum, e) { return sum + e.problems; }, 0);
    });
}

/**
 * Creates Chart 1: problems per day, each bar stacked by topic.
 */
function createBarChart(entries) {
    const data = buildBarData(entries);
    return new Chart(document.getElementById("barChart"), {
        type: "bar",
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: "Problems Solved per Day (by Topic)", font: { size: 15 } },
                legend: { position: "bottom" },
                tooltip: {
                    // Skip empty (0) sections so the tooltip only lists what's really in the bar
                    filter: function (item) { return item.parsed.y > 0; },
                    callbacks: {
                        label: function (ctx) {
                            const n = ctx.parsed.y;
                            return ctx.dataset.label + ": " + n + " problem" + (n === 1 ? "" : "s");
                        }
                    }
                }
            },
            scales: {
                x: { stacked: true, title: { display: true, text: "Date" } },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    title: { display: true, text: "Problems" },
                    ticks: { precision: 0 }
                }
            }
        }
    });
}

/**
 * Creates Chart 2: total problems per topic as a doughnut.
 */
function createDoughnutChart(entries) {
    return new Chart(document.getElementById("doughnutChart"), {
        type: "doughnut",
        data: {
            labels: TOPIC_ORDER,
            datasets: [{
                data: buildTopicTotals(entries),
                backgroundColor: TOPIC_ORDER.map(function (t) { return TOPIC_COLORS[t]; }),
                borderColor: "#FFFFFF",
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: "Problems by Topic", font: { size: 15 } },
                legend: { position: "bottom" },
                tooltip: {
                    callbacks: {
                        label: function (ctx) {
                            const values = ctx.dataset.data;
                            const total = values.reduce(function (a, b) { return a + b; }, 0);
                            const pct = total === 0 ? 0 : Math.round((ctx.parsed / total) * 100);
                            return ctx.label + ": " + ctx.parsed + " (" + pct + "%)";
                        }
                    }
                }
            }
        }
    });
}

/**
 * Shows either a chart's canvas or its "No sessions yet" message.
 */
function toggleChartEmpty(canvasId, emptyId, isEmpty) {
    document.getElementById(canvasId).parentElement.hidden = isEmpty;
    document.getElementById(emptyId).hidden = !isEmpty;
}

/**
 * Removes the existing charts so they can be rebuilt (or left empty).
 */
function destroyCharts() {
    if (barChart) { barChart.destroy(); barChart = null; }
    if (doughnutChart) { doughnutChart.destroy(); doughnutChart = null; }
}

/**
 * Rebuilds both charts and the sketch from an entries array.
 * An empty array shows the empty states everywhere.
 */
function renderDashboard(entries) {
    destroyCharts();
    const isEmpty = entries.length === 0;

    toggleChartEmpty("barChart", "barEmpty", isEmpty);
    toggleChartEmpty("doughnutChart", "doughnutEmpty", isEmpty);

    if (!isEmpty) {
        barChart = createBarChart(entries);
        doughnutChart = createDoughnutChart(entries);
    }

    if (typeof window.updateSkyline === "function") {
        window.updateSkyline(entries);
    }
}

/**
 * Asks for confirmation, deletes the cookie on the server,
 * then resets everything to empty without reloading.
 */
async function handleClear() {
    if (!window.confirm("Delete all logged sessions? This can't be undone.")) {
        return;
    }
    try {
        const response = await fetch("/tracker/v2/clear", { method: "DELETE" });
        const result = await response.json();
        if (response.ok && result.success) {
            renderDashboard([]);
        } else {
            window.alert("Couldn't clear the data. Please try again.");
        }
    } catch (err) {
        window.alert("Couldn't reach the server. Is it running?");
    }
}

/**
 * Page start: wire the clear button, fetch data, draw everything.
 */
async function initDashboard() {
    document.getElementById("clearBtn").addEventListener("click", handleClear);
    const entries = await fetchEntries();
    renderDashboard(entries);
}

document.addEventListener("DOMContentLoaded", initDashboard);
