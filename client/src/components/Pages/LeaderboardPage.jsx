import { useState } from "react";
import { Table } from "react-bootstrap";

function LeaderboardPage() {

    const [userHighscores, setUserHighscores] = useState([{name:"Jonas",highscore:10},{name:"Kevin",highscore:10}]);



    return <>
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
        {userHighscores.map((element,i) =>{
        return <tr key = {i}>
          <td>{i +1}</td>
          <td>{element.name}</td>
          <td>{element.highscore}</td>
        </tr>
        })}
        
        </tbody>
    </Table>
    </>
}

export default LeaderboardPage;