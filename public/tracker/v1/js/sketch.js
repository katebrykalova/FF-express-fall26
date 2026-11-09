// p5.js "study tower": one block per session, oldest at the bottom.
// Uses instance mode so it can't clash with Chart.js or other globals.

// Same colors as the doughnut chart
const TOWER_COLORS = {
    "Limits": "#F59E0B",
    "Derivatives": "#10B981",
    "Applications of Derivatives": "#3B82F6",
    "Integrals": "#EC4899"
};

let towerEntries = []; // current data the tower draws from
let towerSketch = null; // the p5 instance

/**
 * Called by dashboard.js whenever the data changes (load or clear).
 * Stores the new entries and redraws the canvas once.
 */
function updateTower(entries) {
    towerEntries = entries;
    if (towerSketch) {
        towerSketch.redraw();
    }
}

/**
 * Defines the p5 sketch.
 */
function towerSketchDefinition(p) {
    const WIDTH = 600;
    const HEIGHT = 400;
    const BOTTOM_MARGIN = 20;
    const TOP_SPACE = 50; // room for the "Total" text
    const BLOCK_WIDTH = 160;

    /**
     * Creates the canvas inside the sketch card and turns off the draw loop
     * (we only redraw when data changes).
     */
    p.setup = function () {
        const canvas = p.createCanvas(WIDTH, HEIGHT);
        canvas.parent("sketch-holder");
        p.noLoop();
    };

    /**
     * Draws the tower and the total.
     */
    p.draw = function () {
        p.background("#E5E7EB"); // light gray

        const total = towerEntries.reduce((sum, e) => sum + Number(e.problems), 0);
        const available = HEIGHT - BOTTOM_MARGIN - TOP_SPACE;

        // Scale so the whole tower fits; don't stretch tiny towers past 4px per problem
        const scale = total > 0 ? Math.min(available / total, 4) : 0;
        const towerHeight = total * scale;
        const x = (WIDTH - BLOCK_WIDTH) / 2;

        // Ground line
        p.stroke("#9CA3AF");
        p.strokeWeight(2);
        p.line(40, HEIGHT - BOTTOM_MARGIN, WIDTH - 40, HEIGHT - BOTTOM_MARGIN);

        // Blocks, oldest at the bottom
        let y = HEIGHT - BOTTOM_MARGIN;
        p.stroke("#ffffff");
        p.strokeWeight(1);
        for (const entry of towerEntries) {
            const h = Number(entry.problems) * scale;
            p.fill(TOWER_COLORS[entry.topic] || "#9CA3AF");
            p.rect(x, y - h, BLOCK_WIDTH, h);
            y -= h;
        }

        // Total text just above the top of the tower
        p.noStroke();
        p.fill("#111827");
        p.textAlign(p.CENTER, p.BOTTOM);
        p.textSize(18);
        p.text(`Total: ${total} problems`, WIDTH / 2, HEIGHT - BOTTOM_MARGIN - towerHeight - 10);
    };
}

towerSketch = new p5(towerSketchDefinition);
