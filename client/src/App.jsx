import "bootstrap/dist/css/bootstrap.min.css";

import { useEffect, useState } from "react";
import heroImg from "./assets/hero.png";
import "./App.css";
import { redirect, Route, Routes } from "react-router";
import { Container, Button, Row } from "react-bootstrap";
import NavigationBar from "./components/NavigationBar";
import LoginPage from "./components/Pages/LoginPage";
import GamePage from "./components/Pages/GamePage";
import RulesPage from "./components/Pages/RulesPage";
import UserContext from "./utility/contexts/Usercontext.js";
import { useNavigate } from "react-router";
import sendRequest from "./utility/Api.js";
import InfoToast from "./components/InfoToast";
import LeaderboardPage from "./components/Pages/LeaderboardPage.jsx";

function App() {
  const [user, setUser] = useState({
    id: undefined,
    username: undefined,
    score: undefined,
    highscore: undefined,
  });
  const navigate = useNavigate();
  const [currentToast, setCurrentToast] = useState();

  //Retrieve user from session storage
  useEffect(() => {
    sendRequest(
      "/sessions/current",
      "GET",
      "getting user from session",
      undefined,
      "JSON",
    )
      .then((content) =>
        setUser({
          id: content.id,
          username: content.username,
          highscore: content.highscore,
        }),
      )
      .catch((err) => {
        setCurrentToast({
          title: "Warning",
          text: "Could not retrieve user from session, please login to play",
          type: "warning",
        });
      });
  }, []);

  const handleLogin = (id, username, highscore) => {
    setUser({ id: id, username: username, highscore: highscore });
    navigate("/");
  };
  return (
    <UserContext.Provider value={user}>
      <NavigationBar setUser={setUser} />
      <Container
        fluid
        className="bg-body-primary"
        data-bs-theme="dark"
        style={{ padding: "0 200px 0 200px" }}
      >
        <Row>
          <Routes>
            <Route index element={<RulesPage />}></Route>
            <Route
              path="/login"
              element={
                <LoginPage
                  handleLogin={handleLogin}
                  setCurrentToast={setCurrentToast}
                />
              }
            />
            <Route
              path="/play"
              element={
                <GamePage setCurrentToast={setCurrentToast} setUser={setUser} />
              }
            />
            <Route
              path="/leaderboard"
              element={<LeaderboardPage setCurrentToast={setCurrentToast} />}
            />
            <Route
              path="*"
              element={
                <>This is not a valid page. Please navigate to a valid page.</>
              }
            />
          </Routes>
        </Row>
      </Container>
      <InfoToast toast={currentToast} />
    </UserContext.Provider>
  );
}

export default App;
