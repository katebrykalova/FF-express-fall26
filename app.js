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
