import "bootstrap/dist/css/bootstrap.min.css";

import { useEffect, useState } from "react";
import heroImg from "./assets/hero.png";
import "./App.css";
import { redirect, Route, Routes } from "react-router";
import { Container, Button, Row} from "react-bootstrap";
import NavigationBar from "./components/NavigationBar";
import LoginPage from "./components/Pages/LoginPage";
import GamePage from "./components/Pages/GamePage";
import RulesPage from "./components/Pages/RulesPage";
import UserContext from "./utility/contexts/UserContext.js";
import { useNavigate } from "react-router";
import sendRequest from "./utility/Api.js";
import InfoToast from "./components/InfoToast";

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
  const [currentToast, setCurrentToast] = useState();

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
    ).catch(err => {
      setCurrentToast({ title:"Warning", text:"Could not retrieve user from session, please login to play", type:"danger"})
  });
  }, []);

  const handleLogin = (id, username, highscore) => {
    setUser({ id: id, username: username, score: 0, highscore });
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
              element={<LoginPage handleLogin={handleLogin} setCurrentToast={setCurrentToast} />}
            />
            <Route path="/play" element={<GamePage setCurrentToast={setCurrentToast} /> } />
            <Route path="/leaderboard" element={<>Here Leaderboard</>} />
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
