/* =========================================================
   Calc Practice Tracker v2 — p5.js "study skyline" sketch
   Also defines the shared topic colors and date helpers
   that dashboard.js uses (this file loads first).
   ========================================================= */

// Topic order and colors, shared by both charts and the sketch
const TOPIC_ORDER = ["Limits", "Derivatives", "Applications of Derivatives", "Integrals"];
const TOPIC_COLORS = {
    "Limits": "#F59E0B",
    "Derivatives": "#10B981",
    "Applications of Derivatives": "#3B82F6",
    "Integrals": "#EC4899"
};

/**
 * Turns "2026-11-04" into a Date at LOCAL midnight.
 * (new Date("2026-11-04") would be UTC midnight, which shows as Nov 3 in Miami.)
 */
function parseLocalDate(dateStr) {
    const parts = dateStr.split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
}

/**
 * Formats "2026-11-04" as "Nov 4".
 */
function formatShortDate(dateStr) {
    return parseLocalDate(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ---------- sketch ---------- */

(function () {
    const DAILY_GOAL = 20;
    const MAX_TOWERS = 10;
    const CANVAS_HEIGHT = 400;
    const DROP_MS = 500;
    const BG = "#F3F4F6";

    let entries = [];     // raw entries from the server, in logged order
    let p5Instance = null;
    let anim = null;      // { start, towerIndex, blockIndex } while the newest block is falling

    /**
     * Groups entries into towers: one per date, sorted oldest to newest,
     * keeping only the 10 most recent dates. Each tower's blocks stay in logged order.
     * The very last entry in the log is marked as the "newest" block.
     */
    function buildTowers(list) {
        const byDate = {};
        list.forEach(function (entry, i) {
            if (!byDate[entry.date]) {
                byDate[entry.date] = [];
            }
            byDate[entry.date].push({
                problems: entry.problems,
                topic: entry.topic,
                isNewest: i === list.length - 1
            });
        });

        const dates = Object.keys(byDate).sort().slice(-MAX_TOWERS);
        return dates.map(function (date) {
            const blocks = byDate[date];
            const total = blocks.reduce(function (sum, b) { return sum + b.problems; }, 0);
            return { date: date, blocks: blocks, total: total };
        });
    }

    /**
     * Finds where the newest block sits (tower index and block index),
     * or returns null if it isn't among the displayed towers.
     */
    function findNewestBlock(towers) {
        for (let t = 0; t < towers.length; t++) {
            for (let b = 0; b < towers[t].blocks.length; b++) {
                if (towers[t].blocks[b].isNewest) {
                    return { towerIndex: t, blockIndex: b };
                }
            }
        }
        return null;
    }

    /**
     * The p5 sketch in instance mode. All p5 functions are called on "p"
     * so nothing leaks into the global scope or clashes with Chart.js.
     */
    function skyline(p) {
        const holder = document.getElementById("sketchHolder");

        /**
         * Creates the canvas at the card's width, places it in the card, and draws once.
         */
        p.setup = function () {
            const canvas = p.createCanvas(Math.max(holder.clientWidth, 200), CANVAS_HEIGHT);
            canvas.parent(holder);
            p.textFont("sans-serif"); // p5 takes a single family name, not a CSS font stack
            p.noLoop();
            p5Instance = p;
            startAnimation(); // in case data arrived before setup ran
        };

        /**
         * Keeps the canvas as wide as the card when the window is resized.
         */
        p.windowResized = function () {
            p.resizeCanvas(Math.max(holder.clientWidth, 200), CANVAS_HEIGHT);
            p.redraw();
        };

        /**
         * Draws one frame: background, legend, total, goal line, towers, labels.
         * Stops looping once the drop animation has finished.
         */
        p.draw = function () {
            p.background(BG);
            const towers = buildTowers(entries);

            // Layout: legend band on top, date labels under the ground line
            const groundY = p.height - 36;
            const plotTop = 104;
            const plotLeft = 16;
            const plotRight = p.width - 16;

            drawLegend(p);
            drawTotal(p, entries);

            if (towers.length === 0) {
                drawGround(p, groundY);
                p.noStroke();
                p.fill("#6B7280");
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(16);
                p.text("Log a session to start your tower", p.width / 2, (plotTop + groundY) / 2);
                anim = null;
                p.noLoop();
                return;
            }

            // Vertical scale: fit the tallest tower or the goal, with ~15% headroom
            const tallest = Math.max.apply(null, towers.map(function (t) { return t.total; }));
            const scaleMax = Math.max(tallest, DAILY_GOAL) * 1.15;
            const pxPerProblem = (groundY - plotTop) / scaleMax;

            // Horizontal layout: equal slots, tower width capped so 1-2 towers don't look like walls
            const slotW = (plotRight - plotLeft) / towers.length;
            const towerW = Math.min(slotW * 0.6, 72);

            // Animation progress (0..1), eased so the block slows as it lands
            let progress = 1;
            if (anim) {
                progress = Math.min((p.millis() - anim.start) / DROP_MS, 1);
            }
            const eased = 1 - Math.pow(1 - progress, 3);

            // Goal line goes behind the towers
            const goalY = groundY - DAILY_GOAL * pxPerProblem;
            drawGoalLine(p, goalY, plotLeft, plotRight);

            towers.forEach(function (tower, t) {
                const x = plotLeft + slotW * t + (slotW - towerW) / 2;
                let stackY = groundY;

                tower.blocks.forEach(function (block, b) {
                    const h = block.problems * pxPerProblem;
                    const targetY = stackY - h;
                    let y = targetY;

                    // The newest block falls from above the canvas into its spot
                    if (anim && anim.towerIndex === t && anim.blockIndex === b) {
                        y = p.lerp(-h, targetY, eased);
                    }

                    p.stroke(255);
                    p.strokeWeight(1.5);
                    p.fill(TOPIC_COLORS[block.topic] || "#9CA3AF");
                    p.rect(x, y, towerW, h, 2);
                    stackY = targetY;
                });

                // Star on towers that hit the goal (wait until the falling block lands)
                const landed = !anim || anim.towerIndex !== t || progress >= 1;
                if (tower.total >= DAILY_GOAL && landed) {
                    drawStar(p, x + towerW / 2, stackY - 12, 5, 11);
                }

                // Date label under the tower; shrink text when slots get narrow
                p.noStroke();
                p.fill("#374151");
                p.textAlign(p.CENTER, p.TOP);
                p.textSize(Math.max(9, Math.min(12, slotW / 3.4)));
                p.text(formatShortDate(tower.date), x + towerW / 2, groundY + 8);
            });

            drawGround(p, groundY);

            if (progress >= 1) {
                anim = null;
                p.noLoop();
            }
        };
    }

    /**
     * Draws the ground line the towers stand on.
     */
    function drawGround(p, groundY) {
        p.stroke("#9CA3AF");
        p.strokeWeight(2);
        p.line(0, groundY, p.width, groundY);
    }

    /**
     * Draws the dashed goal line with its "Daily goal: 20" label at the left end.
     */
    function drawGoalLine(p, y, left, right) {
        const ctx = p.drawingContext;
        p.stroke("#6B7280");
        p.strokeWeight(1.5);
        ctx.setLineDash([6, 5]);
        p.line(left, y, right, y);
        ctx.setLineDash([]);

        const label = "Daily goal: " + DAILY_GOAL;
        p.textSize(11);
        const w = p.textWidth(label) + 8;
        p.noStroke();
        p.fill(243, 244, 246, 220); // translucent background so the label stays readable over towers
        p.rect(left, y - 18, w, 15, 3);
        p.fill("#374151");
        p.textAlign(p.LEFT, p.CENTER);
        p.text(label, left + 4, y - 10);
    }

    /**
     * Draws the top-left legend: a colored square and name for each topic.
     */
    function drawLegend(p) {
        p.textSize(12);
        p.textAlign(p.LEFT, p.CENTER);
        TOPIC_ORDER.forEach(function (topic, i) {
            const y = 20 + i * 19;
            p.noStroke();
            p.fill(TOPIC_COLORS[topic]);
            p.rect(16, y - 6, 12, 12, 2);
            p.fill("#374151");
            p.text(topic, 34, y);
        });
    }

    /**
     * Draws "Total: X problems" in the top-right corner.
     */
    function drawTotal(p, list) {
        const total = list.reduce(function (sum, e) { return sum + e.problems; }, 0);
        p.noStroke();
        p.fill("#111827");
        p.textAlign(p.RIGHT, p.CENTER);
        p.textSize(14);
        p.textStyle(p.BOLD);
        p.text("Total: " + total + " problem" + (total === 1 ? "" : "s"), p.width - 16, 20);
        p.textStyle(p.NORMAL);
    }

    /**
     * Draws a small 5-point yellow star centered at (cx, cy).
     */
    function drawStar(p, cx, cy, innerR, outerR) {
        p.fill("#FACC15");
        p.stroke("#CA8A04");
        p.strokeWeight(1);
        p.beginShape();
        for (let i = 0; i < 10; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const angle = -Math.PI / 2 + (i * Math.PI) / 5;
            p.vertex(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
        }
        p.endShape(p.CLOSE);
    }

    /**
     * Starts the newest-block drop animation (if that block is on screen),
     * otherwise just redraws once. Does nothing until p5 has finished setup.
     */
    function startAnimation() {
        if (!p5Instance) {
            return;
        }
        const newest = findNewestBlock(buildTowers(entries));
        if (newest) {
            anim = { start: p5Instance.millis(), towerIndex: newest.towerIndex, blockIndex: newest.blockIndex };
            p5Instance.loop();
        } else {
            anim = null;
            p5Instance.redraw();
        }
    }

    /**
     * Public: the dashboard calls this with the latest entries array
     * (or [] after clearing) to redraw the skyline.
     */
    window.updateSkyline = function (newEntries) {
        entries = Array.isArray(newEntries) ? newEntries : [];
        startAnimation();
    };

    // Create the sketch once the page has loaded, so #sketchHolder exists
    window.addEventListener("load", function () {
        new p5(skyline);
    });
})();
