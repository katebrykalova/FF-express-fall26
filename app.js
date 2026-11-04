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

