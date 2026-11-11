# Prompt Script v2

## Test log for v1

| What I tested | What happened | What I want instead |
|---|---|---|
| Refreshed dashboard | Data stayed | Keep as is |
| Left problems blank | Browser said "Please fill out this field" | Keep, but show my own clear message instead of the browser default |
| Entered 0 | Saved a 0-problem session | Minimum of 1 problem |
| Entered 999 | Saved it | Maximum of 100 problems, with a clear message when out of range |
| Entered -5 and 2.5 | Rejected | Keep, but show my own clear message |
| Typed letters | Field blocked them | Keep as is |
| Two sessions on the same date | Both saved and combined into one bar, but you can't tell which topics made up that bar | Same-day sessions combine into one bar, split into colored sections by topic |
| Small totals in the sketch (5 problems) | Tower is a thin sliver at the bottom of a huge empty gray box | Scale the tower so small days are still clearly visible |
| Clear all data | Charts emptied and the sketch disappeared completely | Sketch shows an empty base with "Log a session to start your tower" |
| Narrow window | Layout stacked into one column | Keep as is |
| Bar chart (visual) | Every bar is the same indigo, so the topic data is wasted | Stack each day's bar by topic, using the doughnut's colors |
| p5 sketch (visual) | One plain column in a mostly empty gray box, with no labels or legend | One tower per day side by side like a skyline, date labels, a legend, a daily goal line, and new blocks drop in with a short animation |
| Date labels | Shown as 2026-11-04 | Readable format like "Nov 4" |

---

## Goal
Build version 2 of my "Calc Practice Tracker." A calculus student logs each practice session (how many problems they solved and which topic) and sees their progress on a dashboard that shows daily effort, topic balance, and progress toward a daily goal. It's for a student preparing for a Calculus I final exam.

## Where it lives
- It's part of an existing Express.js app that already uses cookie-parser, Handlebars, express.static("public"), express.urlencoded, and express.json
- Version 1 of this tracker already exists in public/tracker/v1/ with routes under /tracker/v1/. Do NOT change any v1 files or v1 routes
- v2 pages go in public/tracker/v2/
- v2 routes go in my main Express file (app.js), directly below the v1 routes, under a comment: // ----- Tracker v2 routes -----
- Every v2 route URL starts with /tracker/v2/
- Do NOT change my other routes or add new npm packages
- My current app.js is pasted at the bottom of this prompt
- app.js already declares TRACKER_TOPICS, TRACKER_COOKIE_OPTIONS, and readTrackerLog for v1. Reuse TRACKER_TOPICS and TRACKER_COOKIE_OPTIONS, and give any new v2 helper functions different names (e.g. readTrackerLogV2) so nothing is declared twice

## Data
- One entry looks like:
  { date: "2026-11-08", problems: 12, topic: "Derivatives" }
  - date: string, YYYY-MM-DD, defaults to today's LOCAL date (not the UTC date from toISOString)
  - problems: whole number from 1 to 100
  - topic: one of "Limits", "Derivatives", "Applications of Derivatives", "Integrals"
- All entries are stored as one array in a single cookie named "calcLog_v2" (separate from v1's "calcLog_v1")
- The array is saved with JSON.stringify and read back with JSON.parse; if the cookie is missing or can't be parsed, use an empty array
- Cookie lasts 30 days (maxAge: 30 * 24 * 60 * 60 * 1000), httpOnly: true
- Keep only the 30 most recently logged entries so the cookie stays under 4 KB

## Routes (Express + cookie-parser)
- Save route: POST /tracker/v2/save
  - Validates req.body: problems must be a whole number from 1 to 100, topic must be one of the 4 topics, date must be a valid YYYY-MM-DD date
  - If invalid: respond with status 400 and JSON { success: false, error: "<clear message explaining what's wrong>" }
  - If valid: read the current array from req.cookies.calcLog_v2, push the new entry, trim to the last 30, save it with res.cookie("calcLog_v2", ...), and respond with JSON { success: true, count: <number of entries> }
- Data route: GET /tracker/v2/data
  - Reads req.cookies.calcLog_v2 and sends the array back as JSON (empty array if none)
- Clear route: DELETE /tracker/v2/clear
  - Deletes the cookie with res.clearCookie("calcLog_v2") and responds with JSON { success: true }

## Pages
- index.html (the entry form):
  - Title: "Log a Calc Session"
  - Fields: date (date input, defaults to today's local date), problems solved (number input, min 1, max 100, step 1), topic (dropdown with the 4 topics)
  - Turn off the browser's default validation popups (novalidate) and validate in JavaScript instead. If a field is invalid, show a red message directly under that field:
    - Problems empty or not a whole number from 1 to 100: "Enter a whole number from 1 to 100."
    - Date empty: "Pick a date."
  - "Save session" button: sends the entry to /tracker/v2/save with fetch() (POST, JSON body)
    - On success: show a green message "Saved! You've logged X sessions." below the form and reset only the problems field
    - On a 400 response: show the server's error message in red below the form
  - A link to dashboard.html
- dashboard.html:
  - Title: "Calc Practice Dashboard"
  - On load, gets the data from /tracker/v2/data with fetch(), then builds both charts and the sketch from it
  - Layout uses CSS grid: Chart 1 and Chart 2 side by side in the top row, the p5 sketch in a card below spanning the full width. Under 700px wide, everything stacks into one column
  - Each chart and the sketch sit in a white card with rounded corners and a soft shadow
  - "Clear all data" button: asks for confirmation, calls DELETE /tracker/v2/clear, then resets both charts and the sketch to their empty states without reloading the page
  - A link back to index.html
  - If there are no entries, show "No sessions yet — log one first!" in place of each chart

## Shared details
- Topic colors, used everywhere (both charts, sketch legend, sketch blocks):
  - Limits: #F59E0B (amber)
  - Derivatives: #10B981 (green)
  - Applications of Derivatives: #3B82F6 (blue)
  - Integrals: #EC4899 (pink)
- All dates shown to the user (chart labels, sketch labels) use a short readable format like "Nov 4". Parse YYYY-MM-DD as a local date so the day doesn't shift by one

## Chart 1 (Chart.js)
- Type: stacked bar chart
- Title: "Problems Solved per Day (by Topic)"
- x-axis: date (label "Date"), one bar per date, sorted oldest to newest, shown as "Nov 4"
- y-axis: problems solved (label "Problems"), starts at 0
- One dataset per topic, using the topic colors, with stacked: true on both axes, so each day's bar is split into colored sections by topic. Sessions on the same date and topic are added together
- Legend at the bottom
- Tooltip shows the topic and number of problems for that section

## Chart 2 (Chart.js)
- Type: doughnut chart (different from Chart 1)
- Title: "Problems by Topic"
- One slice per topic, size = total problems for that topic, using the topic colors
- Legend at the bottom
- Tooltip shows the topic, total problems, and percent of all problems (e.g. "Derivatives: 27 (42%)")

## p5.js sketch
- A "study skyline": one tower per date, standing side by side on a ground line, sorted oldest (left) to newest (right). If there are more than 10 dates, show only the 10 most recent
- Each tower is made of blocks, one block per session on that date, stacked from the ground up in the order they were logged
- Block height = problems in that session; block color = the session's topic color; each block has a thin white outline so sessions are distinguishable
- A dashed horizontal "goal line" at 20 problems, labeled "Daily goal: 20" at its left end. Towers that reach or pass 20 problems get a small yellow star drawn on top
- The vertical scale fits whichever is larger, the tallest tower or the goal line, with some headroom at the top, so nothing gets cut off
- Under each tower, its date in the "Nov 4" format
- Top-left: a legend with a small colored square and the name for each of the 4 topics
- Top-right: "Total: X problems"
- Animation: when the dashboard loads or the data changes, the newest block drops from the top of the canvas into its place over about half a second. The sketch only loops while animating, then stops (noLoop) until the data changes again
- Empty state (no entries or after clearing): draw the ground line and the centered text "Log a session to start your tower"
- Canvas is 400px tall and as wide as the sketch card, resizing when the window resizes; light gray background (#F3F4F6)
- Use p5 instance mode (new p5(...)) so it doesn't conflict with Chart.js, and put the canvas inside the sketch card with parent()
- Expose a function the dashboard can call with new data so the sketch redraws when data changes

## Rules / constraints
- Plain HTML, CSS, and JavaScript only (no React, no frameworks)
- Store data in cookies using cookie-parser on the server (NOT localStorage, NOT document.cookie)
- Load Chart.js and p5.js from a CDN
- Comment every function
- Include a "Clear all data" button
- No errors in the browser console
- File structure:
  - public/tracker/v2/index.html
  - public/tracker/v2/dashboard.html
  - public/tracker/v2/css/style.css
  - public/tracker/v2/js/tracker.js (form logic and validation)
  - public/tracker/v2/js/dashboard.js (fetch, both charts, clear button)
  - public/tracker/v2/js/sketch.js (p5 sketch)
- Give me every file complete, with its file path above it, plus the exact code to add to app.js

## My current app.js
```js
const express = require("express");
const app = express();
const port = 3000;
const cookieParser = require("cookie-parser");

app.set("view engine", "hbs");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true}));
app.use(express.json());

app.use(cookieParser());

app.get("/", (req, res) => {
    res.send("Hello from express");
});

app.get("/hello", (req,res)=>{
    res.send("hello world");
});

app.get("/home", (req,res)=>{
    res.render("home", {title:"My home page"});
});

app.get("/form", (req,res)=>{
    res.render("survey", {title:"survey"});
});

app.post("/form", (req,res)=>{
   //res.send("form processed");
   const coffee = req.body.coffee;
   const cups = req.body.cups;

   let coffeeVotes = {
    hot:0,
    iced:0,
    neither:0
   };

    let cupsVotes = {
        zero:0,
        one:0,
        two:0,
        more:0
    };

   if (req.cookies.coffeeVotes !== undefined){
        coffeeVotes = req.cookies.coffeeVotes;
    }

    if (req.cookies.cupsVotes !== undefined){
        cupsVotes = req.cookies.cupsVotes;
    }

   if (coffeeVotes[coffee] === undefined){
        coffeeVotes[coffee] = 0;
    }

    coffeeVotes[coffee] = coffeeVotes[coffee]+1;

    if (cupsVotes[cups] === undefined){
        cupsVotes[cups] = 0;
    }
    cupsVotes[cups] = cupsVotes[cups]+1;

   res.cookie("coffeeVotes", coffeeVotes, {maxAge:  7 * 24 * 60 * 60 * 1000}); //expiration of a cookie in ms
   res.cookie("cupsVotes", cupsVotes, {maxAge:  7 * 24 * 60 * 60 * 1000});

   res.render("response", {
        coffeeVotes: coffeeVotes,
        cupsVotes: cupsVotes
    });
});


app.delete("/clear", (req,res)=>{
    res.clearCookie("coffeeVotes");
    res.clearCookie("cupsVotes");
    res.send("Votes cleared" + "<a href='/form'>Back to form</a>");
})

// ----- Tracker v1 routes -----

// The four allowed topics, used to validate incoming entries
const TRACKER_TOPICS = ["Limits", "Derivatives", "Applications of Derivatives", "Integrals"];

// Cookie settings: 30 days, not readable from browser JavaScript
const TRACKER_COOKIE_OPTIONS = { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true };

/**
 * Reads the calcLog_v1 cookie and returns it as an array.
 * Returns an empty array if the cookie is missing or not valid JSON.
 */
function readTrackerLog(req) {
    const raw = req.cookies.calcLog_v1;
    if (raw === undefined) {
        return [];
    }
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
        return [];
    }
}

/**
 * POST /tracker/v1/save
 * Adds one entry to the cookie, keeps only the 30 most recent, and returns the count.
 */
app.post("/tracker/v1/save", (req, res) => {
    const body = req.body || {};
    const problems = Number(body.problems);
    const topic = body.topic;
    const date = body.date;

    // Reject bad input instead of saving garbage into the cookie
    if (!Number.isInteger(problems) || problems < 0) {
        return res.status(400).json({ success: false, error: "problems must be a whole number" });
    }
    if (!TRACKER_TOPICS.includes(topic)) {
        return res.status(400).json({ success: false, error: "invalid topic" });
    }
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ success: false, error: "date must be YYYY-MM-DD" });
    }

    let log = readTrackerLog(req);
    log.push({ date: date, problems: problems, topic: topic });
    log = log.slice(-30); // keep the last 30 entries so the cookie stays under 4 KB

    res.cookie("calcLog_v1", JSON.stringify(log), TRACKER_COOKIE_OPTIONS);
    res.json({ success: true, count: log.length });
});

/**
 * GET /tracker/v1/data
 * Sends back the saved entries as a JSON array (empty array if there is no cookie).
 */
app.get("/tracker/v1/data", (req, res) => {
    res.json(readTrackerLog(req));
});

/**
 * DELETE /tracker/v1/clear
 * Deletes the cookie.
 */
app.delete("/tracker/v1/clear", (req, res) => {
    res.clearCookie("calcLog_v1", { httpOnly: true });
    res.json({ success: true });
});

// ----- end Tracker v1 routes -----


app.get("/:name", (req,res)=>{
    res.send("My name is: " + req.params.name);
});


//end of code 
app.listen(port, ()=>{
    console.log(`Server running at http://localhost:${port}`);
});
```
