import { useEffect, useState } from "react";
import { Table } from "react-bootstrap";
import sendRequest from "../../utility/Api";
/**Page displaying all users highscores in a table */
function LeaderboardPage(props) {
  const [userHighscores, setUserHighscores] = useState([]);

  useEffect(() => {
    sendRequest("/highscores", "GET", "getting highscores", undefined, "JSON")
      .then((res) => setUserHighscores(res.highscores))
      .catch((err) => {
        props.setCurrentToast({
          title: "Error",
          text: `${err.message}`,
          type: "danger",
        });
      });
  }, []);

  return (
    <>
      <h1>The greatest of all time...</h1>
      <Table striped bordered hover variant="light">
        <thead>
          <tr>
            <th>#</th>
            <th>User</th>
            <th>Highscore</th>
          </tr>
        </thead>
        <tbody>
          {userHighscores &&
            userHighscores.map((element, i) => {
              return (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{element.user}</td>
                  <td>{element.highscore}</td>
                </tr>
              );
            })}
        </tbody>
      </Table>
    </>
  );
}

export default LeaderboardPage;
