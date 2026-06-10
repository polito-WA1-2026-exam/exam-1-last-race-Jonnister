// imports
import express from "express";
import cors from "cors";
import passport from "passport";
import LocalStrategy from "passport-local";
import session from "express-session";
import UserDAO from "./dao/user-dao.js";
import EventDAO from "./dao/event-dao.js";
import MetroDAO from "./dao/metro-dao.js";

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

//Databases
//Stations: List of Station Names and positions
//Lines-Stations: Contains List of Line Names associated with two stations each (e.g. Line 1, Palace, Center)
//Users username, email, password, salt, score
//Events: Event ID (maybe not necessary), Event description, event coin modificator (from -4 to +4)

//Setup dataobjects
const userDao = new UserDAO();
const eventDao = new EventDAO();
const metroDAO = new MetroDAO();

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

//________Gameplay________//
//________Setup__________//
/**
 * Gets all lines and the station pairs associated with each line. 
*/
app.get(`${prefix}/lines/`, isLoggedIn, async (req,res) => {
  try{
  const result = await metroDAO.getLines();
  res.status(200).json(result);
  }
  catch(err){
    res.status(500).json({error: err.message})
  }
})

/**
 * Gets all stations (names) and their positions (x,y).
 */
app.get(`${prefix}/stations/`, isLoggedIn, async (req,res) => {
  try{
  const result = await metroDAO.getStations();
  res.status(200).json(result);
  }
  catch(err){
    res.status(500).json({error: err.message})
  }
})

//________During_Game________//
/**
 * Gets Random event with text (description) and a coin modificator that adds or subtracts up to 4 coins from the player.
 */
app.get(`${prefix}/event`, isLoggedIn, async (req, res) => {
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

/**
 * Get random starting and destination stations (min distance 3 (4 stops))
 */
app.get(`${prefix}/randstartdest`, isLoggedIn, async (req, res) => {
  try {
    const result = await metroDAO.getStartAndDest();
    if (result.error) {
      res.status(404).json(result);
    } else {
      res.status(200).json(result);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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
