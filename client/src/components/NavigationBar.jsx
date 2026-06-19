import { Container, Navbar, Nav, Button } from "react-bootstrap";
import userContext from "../utility/contexts/UserContext.js";
import { useContext } from "react";
import sendRequest from "../utility/Api.js";
import { useNavigate } from "react-router";
//TODO Add User logged in features e.g. username displayed, change login button to logout button
// Navbar, with Title and Login for the User
function NavigationBar(props) {
  const navigate = useNavigate();
  const user = useContext(userContext);
  const LogoutUser = () => {
    sendRequest("/sessions/current", "DELETE", "logging out user").then(() => {
      props.setUser({
        id: undefined,
        username: undefined,
        score: undefined,
        highscore: undefined,
      });
      navigate("/");
    });
  };

  return (
    <Navbar
      sticky="top"
      className="bg-body-tertiary"
      style={{ padding: "0px 4px 0px 4px" }}
    >
      <Navbar.Brand>
        <Nav.Link onClick={() => navigate("/")}>
          <img
            src="/metro-favicon.svg"
            width="30"
            height="30"
            className="d-inline-block align-top"
            alt="Last race icon"
          />
          Last race
        </Nav.Link>
      </Navbar.Brand>
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="me-auto">
          {user.id && (
            <Nav.Link onClick={() => navigate("/Play")}>Play</Nav.Link>
          )}
          {user.id && (
            <Nav.Link onClick={() => navigate("/Leaderboard")}>
              Leaderboard
            </Nav.Link>
          )}
        </Nav>
      </Navbar.Collapse>
      {user.id && <Navbar.Text>{user.username}</Navbar.Text>}
      {user.id ? (
        <Button className="btn btn-alarm" onClick={() => LogoutUser()}>
          Logout
        </Button>
      ) : (
        <Button
          className="btn btn-default"
          onClick={() => navigate("/Login")}
        >
          Login
        </Button>
      )}
    </Navbar>
  );
}

export default NavigationBar;
