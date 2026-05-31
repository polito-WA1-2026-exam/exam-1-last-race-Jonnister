// imports
import express from "express";
import cors from "cors";
import passport from 'passport';
import LocalStrategy from 'passport-local';
import session from 'express-session';

// init express
const app = new express();
const port = 3001;

// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

//Databases
//Stations: List of Station Names and positions (potentially?)
//Lines-Stations: Contains List of Line Names associated with Stations 
//Users username, email, password, salt, score
//Events: Event ID (maybe not necessary), Event description, event coin modificator (from -4 to +4)

//AUTHENTICATION
//Set-> Login User
//Delete -> Logout User
//Get Session Storage -> Get user if logged in

//Gameplay
// Get All lines
// Get all Stations
// Get Random event (from -4 to +4 coins)
// Get Random Starting and destination station (min distance 3)
// Get List of Station Connections

// Set Player Highscore

