# Prompt Script v1

## Goal
Build a "Calc Practice Tracker" that lets a calculus student log each practice session (how many problems they solved and which topic) and see their progress on a dashboard. It's for a student preparing for a Calculus I final exam.

## Where it lives
- It's part of an existing Express.js app that already uses cookie-parser and Handlebars
- Pages go in public/tracker/v1/ and are served as static files with express.static
- Cookie routes go in my main Express file (app.js) with my other routes, under a comment: // ----- Tracker v1 routes -----
- Every route URL starts with /tracker/v1/
- Do NOT change my other routes or add new npm packages
- If app.js doesn't already have app.use(express.json()), add it (it's built into Express, not a new package)
- My current app.js is pasted at the bottom of this prompt

## Data
- One entry looks like:
  { date: "2026-11-08", problems: 12, topic: "Derivatives" }
  - date: string, YYYY-MM-DD, defaults to today
  - problems: whole number
  - topic: string, one of "Limits", "Derivatives", "Applications of Derivatives", "Integrals"
- All entries are stored as one array in a single cookie named "calcLog_v1"
- The array is saved as a JSON string with JSON.stringify and read back with JSON.parse
- Cookie lasts 30 days (maxAge: 30 * 24 * 60 * 60 * 1000), httpOnly: true
- Keep only the 30 most recent entries so the cookie stays under 4 KB

## Routes (Express + cookie-parser)
- Save route: POST /tracker/v1/save
  - Reads the current cookie with req.cookies.calcLog_v1 (if it doesn't exist, start with an empty array)
  - Takes the new entry from req.body, pushes it onto the array, trims to the last 30
  - Saves the array back with res.cookie("calcLog_v1", ...)
  - Responds with JSON: { success: true, count: <number of entries> }
- Data route: GET /tracker/v1/data
  - Reads req.cookies.calcLog_v1 and sends the array back as JSON (empty array if no cookie)
- Clear route: DELETE /tracker/v1/clear
  - Deletes the cookie with res.clearCookie("calcLog_v1")
  - Responds with JSON: { success: true }

## Pages
- index.html (the entry form):
  - Title: "Log a Calc Session"
  - Fields: date (date input, defaults to today), problems solved (number input), topic (dropdown with the 4 topics above)
  - "Save session" button: sends the entry to /tracker/v1/save with fetch() (POST, JSON body), then shows "Saved! You've logged X sessions." below the form and resets the problems field
  - A link to dashboard.html
- dashboard.html:
  - Title: "Calc Practice Dashboard"
  - On load, gets the data from /tracker/v1/data with fetch(), then builds both charts and the sketch from it
  - Layout uses CSS grid: Chart 1 and Chart 2 side by side in the top row, the p5 sketch in a card below spanning the full width. On screens under 700px everything stacks into one column
  - Each chart and the sketch sit in a white card with rounded corners and a soft shadow
  - "Clear all data" button that calls DELETE /tracker/v1/clear, then empties both charts and the sketch without a page reload
  - A link back to index.html
  - If there are no entries, show "No sessions yet — log one first!" instead of empty charts

## Chart 1 (Chart.js)
- Type: bar chart
- Title: "Problems Solved per Day"
- x-axis: date (label "Date"), one bar per date, sorted oldest to newest; if there are multiple entries on the same date, add their problems together
- y-axis: total problems solved (label "Problems"), starts at 0
- Bar color: #4F46E5 (indigo)

## Chart 2 (Chart.js)
- Type: doughnut chart (different from Chart 1)
- Title: "Problems by Topic"
- One slice per topic, size = total problems solved for that topic
- Legend at the bottom showing topic names
- Topic colors (use the same colors in the sketch):
  - Limits: #F59E0B (amber)
  - Derivatives: #10B981 (green)
  - Applications of Derivatives: #3B82F6 (blue)
  - Integrals: #EC4899 (pink)

## p5.js sketch
- A "study tower": each logged session is one block stacked on top of the previous one, building a tower from the bottom of the canvas upward
- Block height = number of problems in that session (scaled so the full tower fits on the canvas)
- Block color = the session's topic, using the same colors as Chart 2
- Blocks are drawn oldest at the bottom, newest on top
- Above the tower, show the text "Total: X problems"
- Canvas is 600 x 400 with a light gray background, placed inside the sketch card on the dashboard (use the p5 parent() function so it's not floating at the bottom of the page)
- When the data changes (new entry or clear), the tower redraws to match

## Rules / constraints
- Plain HTML, CSS, and JavaScript only (no React, no frameworks)
- Store data in cookies using cookie-parser on the server (NOT localStorage, NOT document.cookie)
- Load Chart.js and p5.js from a CDN
- Comment every function
- Include a "Clear all data" button
- File structure:
  - public/tracker/v1/index.html
  - public/tracker/v1/dashboard.html
  - public/tracker/v1/css/style.css
  - public/tracker/v1/js/tracker.js (form logic)
  - public/tracker/v1/js/dashboard.js (fetch + both charts + clear button)
  - public/tracker/v1/js/sketch.js (p5 sketch)
- Give me every file complete, with its file path above it, plus the exact code to add to app.js

## My current app.js
```
const express = require("express");
const app = express();
const port = 3000;
const cookieParser = require("cookie-parser");

app.set("view engine", "hbs");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true}));

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

app.get("/:name", (req,res)=>{
    res.send("My name is: " + req.params.name);
});


//end of code 
app.listen(port, ()=>{
    console.log(`Server running at http://localhost:${port}`);
});
```