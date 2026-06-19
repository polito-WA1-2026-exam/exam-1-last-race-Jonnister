import { useContext, useEffect, useState, useRef } from "react";
import userContext from "../../utility/contexts/UserContext";
import { useNavigate } from "react-router";
import Paper, { PointText, Group } from "paper";
import sendRequest from "../../utility/Api";
import {Button} from "react-bootstrap"

//Main Page (Shows Game Screen -> first network, then remove network links only stations)
function GamePage() {
  const navigate = useNavigate();
  const user = useContext(userContext);
  const [lines, setLines] = useState(undefined); //[{name:"H",position_x:1,position_y:2},{name:"T",position_x:1,position_y:2}]
  const [stations, setStations] = useState(undefined);
  const [stationPoints, setStationPoints] = useState([]);
  const [linePaths, setLinePaths] = useState([]);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const colors = ["red", "green", "blue", "pink", "yellow", "orange", "purple"];
  const [gameActive, setGameActive] = useState(false);
  const [coins, setCoins] = useState(20);

  //Redirect unauthorized user
  useEffect(() => {
    if (!user.id) {
      navigate("/");
    } else {
      sendRequest(
        "/stations",
        "GET",
        "getting stations",
        undefined,
        "JSON",
      ).then((body) => setStations(body));
      sendRequest("/lines", "GET", "getting lines", undefined, "JSON").then(
        (body) => setLines(body),
      );
    }
  }, []);

  //TODO when game is started, ...
  const getRandStartAndDest = async () => {
    sendRequest(
      "/randstartdest",
      "GET",
      "getting lines",
      undefined,
      "JSON",
    ).then((body) => {
      setStart(body.startStation);
      setEnd(body.endStation);
          //Mark start and end
    const startCircle = new Paper.Path.Circle(
          stationPoints.children[body.startStation].position,
          17,
        );
      startCircle.strokeColor = "green";
      startCircle.strokeWidth = 3;
      startCircle.dashArray = [10, 2];
    const endCircle = new Paper.Path.Circle(
           stationPoints.children[body.endStation].position,
          17,
        );
      endCircle.strokeColor = "red";
      endCircle.strokeWidth = 3;
      endCircle.dashArray = [10, 2];
    });
  };

  const startGame = async () => {
    getRandStartAndDest();
    console.log("You now have 30s to plan a fitting route!");
    linePaths.opacity = 0;
    setTimeout(()=>console.log("Times up!"),30000)
  }

  //somewhere between 1 to 1200 for x and 10 and 500
  const drawNetwork = () => {
    if (stations && lines) {
      var stationPointsGroup = new Group();
      var linePathsGroup = new Group();
      for (var i = 0; i < stations.length; i++) {
        const circle = new Paper.Path.Circle(
          new Paper.Point(
            stations[i].position_x * 15 + 30,
            stations[i].position_y * 10 + 20,
          ),
          10,
        );
        circle.strokeWidth = 5;
        circle.name = `${stations[i].name}`;
        circle.fillColor = "white";
        circle.strokeColor = colors[i % colors.length];
        const circleText = new PointText({
          point: new Paper.Point(
            circle.position.x + 25,
            circle.position.y + 25,
          ),
          content: `${stations[i].name}`,
          justification: "center",
          color: "black",
          size: "100px",
          font: "Arial",
          fontWeight: "bold",
        });
        stationPointsGroup.addChild(circle);
      }
      for (var i = 0; i < lines.length; i++) {
        //Theoretically i could add all station-to-stations to one long path, but that might be impractical since i might still need the segments
        for (var j = 0; j < lines[i].station_pairs.length; j++) {
          const station1 = lines[i].station_pairs[j].station_1;
          const station2 = lines[i].station_pairs[j].station_2;
          //const outerPath = new Paper.Path(stationPointsGroup.children[`${lines[i].station_pairs[j].station_1}`].position,stationPointsGroup.children[`${lines[i].station_pairs[j].station_2}`].position);
          //outerPath.strokeColor = "black";
          //Path.strokeWidth = 7; //Maybe add this because it looks nice
          const path = new Paper.Path(
            stationPointsGroup.children[`${station1}`].position,
            stationPointsGroup.children[`${station2}`].position,
          );
          path.strokeColor = colors[i % colors.length];
          path.strokeWidth = 4;
          path.name = `${lines[i].line} from ${station1} to ${station2}`;
          linePathsGroup.addChild(path);
        }
      }
      setStationPoints(stationPointsGroup);
      linePathsGroup.sendToBack();
      setLinePaths(linePathsGroup);
    }
  };

  const canvasRef = useRef(null);
  useEffect(() => {
    if(stations && lines){
    const canvas = canvasRef.current;
    const project =  Paper.setup(canvas);
    drawNetwork();
    Paper.view.draw();
    }
  }, [stations]);
  //Network is rendered in the background. In the front there is a popup showing to start the game

  //TODO Highlight starting and destination stations
  //TODO Show starting destination station in a small window on the top left
  //TODO Show list of stations to choose from on the right hand side
  return (
    <>
    <div style={{
	position: "absolute",
   	backgroundColor: "grey",
    width: "25%",
    height: "95%",
    marginLeft: "65%",
    padding: "5px"
}}>
<Button onClick={() => {startGame()}}>Start Game</Button>
      <>{`From: ${start} to ${end}`}</>
      </div>
  <canvas ref={canvasRef} id="canvas" resize="true"/>
    </>
  );
}

export default GamePage;
