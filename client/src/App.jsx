import "bootstrap/dist/css/bootstrap.min.css";

import { useEffect, useState } from "react";
import heroImg from "./assets/hero.png";
import "./App.css";
import { redirect, Route, Routes } from "react-router";
import { Container, Button } from "react-bootstrap";
import NavigationBar from "./components/NavigationBar";
import LoginPage from "./components/Pages/LoginPage";
import GamePage from "./components/Pages/GamePage";
import RulesPage from "./components/Pages/RulesPage";
import UserContext from "./utility/contexts/UserContext.js";
import { useNavigate } from "react-router";
import sendRequest from "./utility/Api.js";

//Pages
//Visitor Page/ Rules Explanation
//Main Page (Shows Game Screen -> first network, then remove network links only stations)
//Login Page (Shows Username, Password form, Login Button)
//LeaderBoard

//Components
// Header, with Title and Login for the User
// PopUp Component
// List of Stations collapsible on the right hand side, submit button on the bottom
// Toasts for coin Events or PopUps?
// From/To Box in the Top left corner

function App() {
  const [user, setUser] = useState({
    id: undefined,
    username: undefined,
    score: undefined,
    highscore: undefined,
  });
  const navigate = useNavigate();

  const retrieveUserFromSession = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/sessions/current", {
        method: "GET",
        credentials: "include",
      });
      if (res.ok) {
        return res.json();
      } else {
        throw new Error(
          "Some HTTP ERROR in logging in user, code=" + res.status,
        );
      }
    } catch (exception) {
      throw new Error("Network error" + exception);
    }
  };

  useEffect(() => {
    sendRequest(
      "/sessions/current",
      "GET",
      "getting user from session",
      undefined,
      "JSON",
    ).then((content) =>
      setUser({
        id: content.id,
        username: content.username,
        score: 0,
        highscore: content.highscore,
      }),
    );
  }, []);

  const handleLogin = (id, username, highscore) => {
    setUser({ id: id, username: username, score: 0, highscore });
    navigate("/");
  };

  return (
    <UserContext.Provider value={user}>
      <NavigationBar navigate={navigate} setUser={setUser} />
      <Container style={{ backgroundColor: "red" }}>
        <Routes>
          <Route index element={<RulesPage />}></Route>
          <Route
            path="/login"
            element={<LoginPage handleLogin={handleLogin} />}
          />
          <Route path="/play" element={<GamePage />} />
          <Route path="/leaderboard" element={<>Here Leaderboard</>} />
          <Route
            path="*"
            element={
              <>This is not a valid page. Please navigate to a valid page.</>
            }
          />
        </Routes>
      </Container>
    </UserContext.Provider>
  );
}

export default App;
