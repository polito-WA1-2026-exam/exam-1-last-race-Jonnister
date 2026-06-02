// imports
import express from "express";
import cors from "cors";
import passport from "passport";
import LocalStrategy from "passport-local";
import session from "express-session";
import UserDAO from "./dao/user-dao.js";

// init express
const app = new express();
const port = 3001;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(
  session({
    secret: "KDASJDHEDOEUEWTOYSDOZISODUELSXYPOE",
    resave: false,
    saveUninitialized: false,
  }),
);

app.use(express.json());

app.use(passport.authenticate("session"));

//Setup dataobjects
const userDao = new UserDAO();

//__________AUTHENTICATION___________//
passport.use(
  new LocalStrategy(async function verify(username, password, cb) {
    const user = await userDao.getUser(username, password);
    if (!user) return cb(null, false, "Incorrect username or password.");
    return cb(null, user);
  }),
);

/**
 * Execute passports local strategy to authenticate the user and save his log-in in the session storage.
 */
app.post("/api/sessions", passport.authenticate("local"), function (req, res) {
  return res.status(201).json(req.user);
});

/**
 * Get the currently logged in user from the session storage.
 */
app.get("/api/sessions/current", (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: "Not authenticated." });
  }
});

/**
 * Logout the currently logged in user.
 */
app.delete("/api/sessions/current", (req, res) => {
  req.logOut(() => {
    res.end();
  });
});

/**
 * Serialize user for session storage. 
 */
passport.serializeUser(function (user, cb) {
  return cb(null, { id: user.id, username: user.username, highscore: user.highscore });
});

passport.deserializeUser(function (user, cb) {
  return cb(null, user);
});

/**
 * Authentication middleware, which checks if the request is authenticated
 */
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  return res.status(400).json({ message: "Request is not authenticated." });
};
//Databases
//Stations: List of Station Names and positions (potentially?)
//Lines-Stations: Contains List of Line Names associated with Stations
//Users username, email, password, salt, score
//Events: Event ID (maybe not necessary), Event description, event coin modificator (from -4 to +4)

//________Gameplay________//
//________Setup__________//
//GET All lines
//GET all Stations
//GET List of Station Connections
//GET Random Starting and destination station (min distance 3)

//________During_Game________//
//GET Random event (from -4 to +4 coins)

//________Game_Ended________//
//POST Player Highscore

//activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
