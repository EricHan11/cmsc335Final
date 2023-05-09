const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, 'credentials/.env')});

const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;

const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection: process.env.MONGO_COLLECTION};

const {MongoClient, ServerApiVersion} = require('mongodb');
const uri = `mongodb+srv://${userName}:${password}@cluster0.jiors0z.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

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
process.stdin.setEncoding("utf8");

if (process.argv.length != 3) {
    process.stdout.write(`Usage .\pokemon.js portNumber`);
    process.exit(1);
}

console.log(`Web server started and running at http://localhost:${process.argv[2]}/`);

process.stdout.write("Stop to shutdown the server: ");


process.stdin.on('readable', () => { //Read input of user
    
    let dataInput = process.stdin.read();
    if (dataInput !== null) {
        let command = dataInput.trim();
        if (command === "stop") {
            console.log("Shutting down the server");
            process.exit(0); //exiting
        }else {
            console.log(`Invalid command: ${command}`);
        }
        process.stdout.write(prompt);
        process.stdin.resume();
    }
});

//Index
app.get("/", (req, res) => {
    res.render("index", {});
});

app.get("/create", (req, res) => {
    res.render("create", {notification: ""}); //Keep {} for notification
});

app.get("/found", (req, res) => {
    res.render("found");
});

app.get("/findCustom", (req, res) => {
    res.render("findCustom", {pokemonInformation: ""});
});

//create custom pokemon
app.post("/createPokemon", async (req, res) => {
    try {
        await client.connect();

        //Create pokemon and send to db
        let pokemon = {name: req.body.name, type1: req.body.type1, type2: req.body.type2, description: req.body.description};
        await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(pokemon);

        const notif = {notification: `Pokemon ${req.body.name} created!`};
        res.render("create", notif);
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
});

app.post("/findCustom", async (req, res) => {
    try {
        await client.connect();
        let filter = {name: req.body.name};
        const cursor = await client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .findOne(filter);

        const pokemonInfo = {pokemonInformation: `<fieldset><legend><strong>${cursor.name}</strong></legend>
        <strong>Type: </strong>${cursor.type1} and ${cursor.type2} <br><br>
        <strong>Description: </strong> ${cursor.description}`};
    
        res.render("findCustom", pokemonInfo);
    } catch (e) {
        console.error(e);
        const pokemonInfo = {pokemonInformation: "There is no such Pokemon in the Pokedex. Try again."};
        res.render("findCustom", pokemonInfo);
    } finally {
        await client.close();
    }
});

app.get("/listAll", (req, res) => {
    res.render("listAll", {table: ""});
});

app.post("/listAll", async (req, res) => {
    try {
        await client.connect();
        let filter = {};
        const cursor = client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).find(filter);
        const result = await cursor.toArray();
        let table = `<table><tr><th>Name</th><th>Type 1</th><th>Type 2</th></tr>`
        result.forEach(x => {
            table = table + `<tr><td>${x.name}</td><td>${x.type1.toUpperCase()}</td><td>${x.type2.toUpperCase()}</td></tr>`;
        });
        table = table + `</table>`;
        const variables = {
            table: table
        };
        res.render("listAll", variables);
    } catch (e) {
        console.error(e);
        res.send("<h2>An error occured.</h2>");
    } finally {
        await client.close()
    }
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
app.listen(process.argv[2]);