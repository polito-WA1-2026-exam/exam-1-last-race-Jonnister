//Main Page (Shows Game Screen -> first network, then remove network links only stations)
import { useContext, useEffect, useState, useRef } from "react";
import userContext from "../../utility/contexts/UserContext";
import { useNavigate } from "react-router";
import Paper, { PointText, Group } from "paper";
import sendRequest from "../../utility/Api";
import {
  Button,
  ListGroupItem,
  ListGroup,
  Offcanvas,
  Badge,
} from "react-bootstrap";

function GamePage() {
  const navigate = useNavigate();
  const user = useContext(userContext);
  //Network
  const [lines, setLines] = useState(undefined); //Format [{line:"name", station_pairs:[{station_1:"name",station_2:"name"}]}]
  const [stationPairs, setStationPairs] = useState([]); //Format [{station_1:"name",station_2:"name"},{name:"T",station_1:"name",station_2:"name"}]
  const [stations, setStations] = useState(undefined); //Format [{name:"H",position_x:1,position_y:2},{name:"T",position_x:1,position_y:2}]
  const [stationPoints, setStationPoints] = useState([]);
  const [linePaths, setLinePaths] = useState([]);
  const colors = ["red", "green", "blue", "purple", "yellow", "orange", "pink"];
  //Gameplay
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [gameActive, setGameActive] = useState(false);
  const [selectedStationPairs, setSelectedStationPairs] = useState([]);
  const [coins, setCoins] = useState(20);
  const [isPlanning, setIsPlanning] = useState(false);
  const [showStartGame, setShowStartGame] = useState(true);
  const [showEvent, setShowEvent] = useState(false);
  const [eventText, setEventText] = useState("");
  const [eventCoins, setEventCoins] = useState(0);

  //Redirect unauthorized user
  useEffect(() => {
    if (!user.id) {
      navigate("/");
    } else {
      sendRequest("/stations", "GET", "getting stations", undefined, "JSON")
        .then((body) => setStations(body))
        .catch((err) => {
          props.setCurrentToast({
            title: "Error",
            text: `${err.message}`,
            type: "danger",
          });
        });
      sendRequest("/lines", "GET", "getting lines", undefined, "JSON")
        .then((body) => {
          setLines(body);
          var tempStationPairs = [];
          for (var i = 0; i < body.length; i++) {
            tempStationPairs = tempStationPairs.concat(body[i].station_pairs);
          }
          setStationPairs(tempStationPairs);
        })
        .catch((err) => {
          props.setCurrentToast({
            title: "Error",
            text: `${err.message}`,
            type: "danger",
          });
        });
    }
  }, []);

  //TODO when game is started, ...
  const getRandStartAndDest = async () => {
    sendRequest("/randstartdest", "GET", "getting lines", undefined, "JSON")
      .then((body) => {
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
      })
      .catch((err) => {
        props.setCurrentToast({
          title: "Error",
          text: `${err.message}`,
          type: "danger",
        });
      });
  };

  const startGame = async () => {
    setGameActive(true);
    getRandStartAndDest();
    console.log("You now have 90s to plan a fitting route!");
    setIsPlanning(true);
    linePaths.opacity = 0;
    setTimeout(() => console.log("Times up!"), 90000);
  };

  const pathSelection = (stationPair) => {
    const selectedPair = selectedStationPairs.find((item) =>
      stationPair.station_1 === item.station_1 &&
        stationPair.station_2 === item.station_2);
    if (!selectedPair) {
      setSelectedStationPairs([...selectedStationPairs, stationPair]);
    } else {
      setSelectedStationPairs(
        selectedStationPairs.filter((stationPair) => stationPair !== selectedPair),
      );
    }
  };

  const executeSelectedRoute = () => {
    if (!checkPathValidity()) {
      return false;
    }
    //Pass through each segment one at a time highlighting on the map
    // Then get the random event for that section
  };

  const getRandomEvent = () => {
    sendRequest(
      "/event",
      "GET",
      "getting random event",
      undefined,
      "JSON",
    ).then((event) => {
      setEventText(event.text);
      setEventCoins(event.coinModificator);
      setShowEvent(true);
    });
  };

  const checkPathValidity = () => {
    //Check if end can be reached, by going in sequence from one station to another
    if (!selectedStationPairs || selectedStationPairs.length === 0) {
      return false;
    }
    var lastStation = "initial";
    for (var i = 0; i < selectedStationPairs.length; i++) {
      console.log(lastStation);
      const station1 = selectedStationPairs[i].station_1;
      const station2 = selectedStationPairs[i].station_2;
      {
        if (i === 0 && station1 !== start && station2 !== start) {
          console.log("Does not start from start");
          return false; //Does not start from start
        }
        if (
          i === selectedStationPairs.length - 1 &&
          station1 !== end &&
          station2 !== end
        ) {
          console.log("Does not end at end");
          return false; // Does not end at end
        }
        if (
          i < selectedStationPairs.length - 1 &&
          (station1 === end || station2 === end)
        ) {
          console.log("Route does not end with end");
          return false; // Route does not end with end
        }

        if (lastStation !== "initial") {
          if (lastStation !== station1 && lastStation !== station2) {
            console.log("Segment not connected to the last segment");
            return false; //Segment not connected to the last segment
          } else {
            lastStation = station1 === lastStation ? station2 : station1;
          }
        } else {
          lastStation = station1 === start ? station2 : station1;
        }
      }
    }
    return true;
  };

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
          const outerPath = new Paper.Path(
            stationPointsGroup.children[station1].position,
            stationPointsGroup.children[station2].position,
          );
          outerPath.strokeColor = "black";
          outerPath.strokeWidth = 8;
          const path = new Paper.Path(
            stationPointsGroup.children[`${station1}`].position,
            stationPointsGroup.children[`${station2}`].position,
          );
          path.strokeColor = colors[i % colors.length];
          path.strokeWidth = 4;
          path.name = `${lines[i].line} from ${station1} to ${station2}`;
          linePathsGroup.addChild(outerPath);
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
    if (stations && lines) {
      const canvas = canvasRef.current;
      const project = Paper.setup(canvas);
      drawNetwork();
      Paper.view.draw();
    }
  }, [stations]);
  //TODO maybe imrpove station selection further
  return (
    <>
      <Offcanvas
        show={isPlanning}
        placement="end"
        backdrop={false}
        style={{ margintop: "100px" }}
      >
        <Offcanvas.Body style={{ margintop: "100px" }}>
          <>{`From: ${start} to ${end}`}</>
          {gameActive && stationPairs && (
            <ListGroup>
              {stationPairs.map((stationPair) => {
                const identifier =
                  stationPair.station_1 + "-" + stationPair.station_2;
                const stationPairInSelected =
                    selectedStationPairs.find(item => {
                        return (
                          stationPair.station_1 === item.station_1 &&
                          stationPair.station_2 === item.station_2
                        );
                      });
                const index =
                  selectedStationPairs.indexOf(stationPairInSelected) >= 0
                    ? selectedStationPairs.indexOf(stationPairInSelected) + 1
                    : false;
                return (
                  <ListGroup.Item
                    key={"LGI" + identifier}
                    active={index}
                    onClick={() =>  pathSelection(stationPair)}
                  >
                    {index && (
                      <Badge bg="primary" pill>
                        {index}
                      </Badge>
                    )}
                    {identifier}
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
          )}
        </Offcanvas.Body>
      </Offcanvas>
      <div
        style={{
          position: "absolute",
          width: "25%",
          height: "10%",
          marginLeft: "-7.5%",
          padding: "5px",
        }}
      >
        {!gameActive && (
          <Button
            onClick={() => {
              startGame();
            }}
          >
            Start Game
          </Button>
        )}
        <Button
          onClick={() => {
            console.log(checkPathValidity());
          }}
        >
          val
        </Button>
      </div>
      <canvas ref={canvasRef} id="canvas" resize="true" />
    </>
  );
}
export default GamePage;
