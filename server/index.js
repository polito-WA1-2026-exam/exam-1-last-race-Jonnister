// imports
import express from "express";
import cors from "cors";
import passport from "passport";
import LocalStrategy from "passport-local";
import session from "express-session";
import UserDAO from "./dao/user-dao.js";
import EventDAO from "./dao/event-dao.js";

// init express
const app = new express();
const port = 3001;
const prefix = "/api";

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
const eventDao = new EventDAO();

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
app.post(
  `${prefix}/sessions`,
  passport.authenticate("local"),
  function (req, res) {
    return res.status(201).json(req.user);
  },
);

/**
 * Get the currently logged in user from the session storage.
 */
app.get(`${prefix}/sessions/current`, (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: "Not authenticated." });
  }
});

/**
 * Logout the currently logged in user.
 */
app.delete(`${prefix}/sessions/current`, (req, res) => {
  req.logOut(() => {
    res.end();
  });
});

/**
 * Serialize user for session storage.
 */
passport.serializeUser(function (user, cb) {
  return cb(null, {
    id: user.id,
    username: user.username,
    highscore: user.highscore,
  });
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

//________During_Game________//
/**
 * Gets Random event with text (description) and a coin modificator that adds or subtracts up to 4 coins from the player.
 */
app.get(`${prefix}/event`, async (req, res) => {
  try {
    const result = await eventDao.getRandomEvent();
    if (result.error) {
      res.status(404).json(result);
    } else {
      res.status(200).json({ event: result });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//GET Random Starting and destination station (min distance 3 (4 stops))

//________Game_Ended________//
/**
 * Sets the currently logged in users highscore.
 */
app.post(`${prefix}/highscore`, isLoggedIn, async (req, res) => {
  try {
    const result = await userDao.setHighscore(
      req.user.username,
      req.body.highscore,
    );
    if (result.error) {
      res.status(404).json(result);
    } else {
      res.status(200).json({ "new highscore": result });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
