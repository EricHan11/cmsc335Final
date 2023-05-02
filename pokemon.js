const path = require("path");
//credentials folder and .env file ommitted, don't want to push existing credentials to a public repository.
//Will find a solution to this later
require("dotenv").config({ path: path.resolve(__dirname, 'credentials/.env')});

const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;

const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection: process.env.MONGO_COLLECTION};

const {MongoClient, ServerApiVersion} = require('mongodb');
const http = require("http");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
//Setting portNumber as 5000, may want to change later
const portNumber = 5000;

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended:false}));

//Do we need a command line parser? Don't think so, but we may need a way to close the server?

//Index
app.get("/", (req, res) => {
    res.render("index", {});
});
//Look up existing pokemon using the API
app.get("/findPokemon", (req, res) => {
    res.render("find", {});
});

app.post("/findPokemon", (req, res) => {
    const result = findPokemon(req.body.name.toLowerCase()).then(result => {
        let types = ``;
        let name = result.name;
        name = name.charAt(0).toUpperCase() + name.slice(1);
        if (result.types.length > 1) {
            types = `${result.types[0].type.name.toUpperCase()}, ${result.types[1].type.name.toUpperCase()}`
        }else {
            types = `${result.types[0].type.name.toUpperCase()}`
        }
        let sprite = `<img src="${result.sprites.front_default}" alt="Image not Found">`
        const variables = {
            name: name,
            id: result.id,
            types: types,
            sprite: sprite
        };
        res.render("found", variables);
    }).catch(() => res.send("<h2>Pokemon Not Found</h2>"));
});
//API functionality
async function findPokemon(name) {
    let url = `https://pokeapi.co/api/v2/pokemon/${name}`;
    const result = await fetch(url);
    const json = await result.json();
    return json;
}


//Create and save custom pokemon in MongoDB

//Search for and retrieve a custom pokemon that was saved in MongoDB

//Listener
app.listen(portNumber);