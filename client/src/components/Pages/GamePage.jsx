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
  Modal,
  Container,
  Row,
  ProgressBar,
} from "react-bootstrap";

function GamePage(props) {
  const navigate = useNavigate();
  const user = useContext(userContext);
  //Network
  const [lines, setLines] = useState(undefined); //Format [{line:"name", station_pairs:[{station_1:"name",station_2:"name"}]}]
  const [stationPairs, setStationPairs] = useState([]); //Format [{station_1:"name",station_2:"name"},{name:"T",station_1:"name",station_2:"name"}]
  const [stations, setStations] = useState(undefined); //Format [{name:"H",position_x:1,position_y:2},{name:"T",position_x:1,position_y:2}]
  //Network graphics
  const [stationPoints, setStationPoints] = useState(undefined);
  const [linePaths, setLinePaths] = useState(undefined);
  const colors = [
    "red",
    "lime",
    "DeepSkyBlue",
    "yellow",
    "orange",
    "purple",
    "pink",
    "green",
    "blue",
    "indigo",
    "DarkCyan",
  ];
  //Gameplay
  const [start, setStart] = useState(""); //starting station name
  const [end, setEnd] = useState(""); //end station name
  const [startEndGroup, setStartEndGroup] = useState(undefined)
  const [selectedStationPairs, setSelectedStationPairs] = useState([]);
  const [coins, setCoins] = useState(20);
  const [endText, setEndText] = useState("");

  const [timeIntervalID, setTimeIntervalId] = useState(0);
  const planningTime = 90;
  const [currentTime, setCurrentTime] = useState(planningTime)

  //Basicly game state machine
  const [gameActive, setGameActive] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [showEndScreen, setShowEndScreen] = useState(false);

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
        const group = new Paper.Group([startCircle,endCircle])
        setStartEndGroup(group);
      }
    )
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
    props.setCurrentToast({
      title: "",
      text: "You now have 90s to plan a fitting route!",
      type: "light",
    });
    setIsPlanning(true);
    linePaths.opacity = 0;
    var time= planningTime;
    //Start game after 90s
    setTimeIntervalId(setInterval(() => {
      time = time - 0.1;
      setCurrentTime(time);
      if(time <=0){
        executeSelectedRoute();
        props.setCurrentToast({
          title: "Times Up!",
          text: `Your time ran out!`,
          type: "warning",
        });
        return;
      }},100))
  };

  //Unsubscribe interval
  useEffect(() => {
    return () => {clearInterval(timeIntervalID)}
  }, [timeIntervalID])

  const pathSelection = (stationPair) => {
    const selectedPair = selectedStationPairs.find(
      (item) =>
        stationPair.station_1 === item.station_1 &&
        stationPair.station_2 === item.station_2,
    );
    if (!selectedPair) {
      setSelectedStationPairs([...selectedStationPairs, stationPair]);
    } else {
      setSelectedStationPairs(
        selectedStationPairs.filter(
          (stationPair) => stationPair !== selectedPair,
        ),
      );
    }
  };

  const executeSelectedRoute = () => {
    clearInterval(timeIntervalID);
    setIsPlanning(false);
    if (!checkPathValidity()) {
      setCoins(0);
      setShowEndScreen(true);
      return;
    }
    linePaths.opacity = 1;
    //Pass through each segment one at a time highlighting on the map
    const playerMarker = new Paper.Path.Circle(
      stationPoints.children[start].position,
      17,
    );
    playerMarker.strokeColor = "black";
    playerMarker.strokeWidth = 5;
    var lastStation = start;
    for (var i = 0; i < selectedStationPairs.length; i++) {
      //Has to be renamed else does not work with set timeout
      const station =
        selectedStationPairs[i].station_2 === lastStation
          ? selectedStationPairs[i].station_1
          : selectedStationPairs[i].station_2;
      lastStation = station;
      setTimeout(
        () => {
          playerMarker.position = stationPoints.children[station].position;  
          const event = getRandomEvent();
          if (station === end) {
            setEndText("You successfully reached the endstation!");
            setTimeout(() =>{
            submitNewUserScore();
            setShowEndScreen(true);
            playerMarker.remove()}, 3000);
          }
        },
        3000 * (i + 0.5),
      );
    }
  };

  /**
   *
   */
  const getRandomEvent = () => {
    sendRequest("/event", "GET", "getting random event", undefined, "JSON")
      .then((body) => {
        const text = body.event.text;
        const coinMod = body.event.coinModificator;
        const gainText = coinMod > 0 ? ("You gained " + coinMod) : ("You lost " + -coinMod);
        const coinText =  Math.abs(coinMod) === 1 ? " coin!" : " coins!";
        props.setCurrentToast({
          title: "Something happenend...",
          text: `${text} ${gainText} ${coinText}`,
          type: "Light",
        });
        setCoins((coins) => coins+coinMod);
      })
      .catch((err) => {
        props.setCurrentToast({
          title: "Error",
          text: `${err.message}`,
          type: "danger",
        });
      });
  };

  const submitNewUserScore = () => {
    if(user.highscore >= coins){
      return;
    }
    sendRequest(
      "/highscore",
      "POST",
      "submitting new user highscore",
      {highscore: coins},
      "JSON",
    )
      .then((body) => {
        props.setUser({ id: user.id, username: user.username, highscore: body.newHighscore})
        return body.newHighscore;
      })
      .catch((err) => {
        props.setCurrentToast({
          title: "Error",
          text: `${err.message}`,
          type: "danger",
        });
      });
  };

  const playAgain = () => {
    startEndGroup.remove();
    setGameActive(false);
    setShowEndScreen(false);
    setCoins(20);
    setSelectedStationPairs([])
    linePaths.opacity = 1;
  };

  const checkPathValidity = () => {
    //Check if end can be reached, by going in sequence from one station to another
    if (!selectedStationPairs || selectedStationPairs.length === 0) {
      return false;
    }
    var lastStation = "initial";
    const failMessage = "Since you did not successfully reach your goal by train, you had to spent all your money on a taxi.";
    for (var i = 0; i < selectedStationPairs.length; i++) {
      const station1 = selectedStationPairs[i].station_1;
      const station2 = selectedStationPairs[i].station_2;
      {
        if (i === 0 && station1 !== start && station2 !== start) {
          setEndText("Your route did not start from the starting station! " + failMessage);
          return false; //Does not start from start
        }
        if (
          i === selectedStationPairs.length - 1 &&
          station1 !== end &&
          station2 !== end
        ) {
          setEndText("Your route did not end at the end station! "+ failMessage);
          return false; // Does not end at end
        }
        if (
          i < selectedStationPairs.length - 1 &&
          (station1 === end || station2 === end)
        ) {
          setEndText("Your route did not end at the end station! "+ failMessage);
          return false; // Route does not end with end
        }

        if (lastStation !== "initial") {
          if (lastStation !== station1 && lastStation !== station2) {
            setEndText(`Neither ${station1} nor ${station2} are connected to ${lastStation}`+ failMessage);
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
            stations[i].position_x * 15 + 150,
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
          //  const outerPath = new Paper.Path(
          //    stationPointsGroup.children[station1].position,
          //    stationPointsGroup.children[station2].position,
          //  );
          //outerPath.strokeColor = "grey";
          //outerPath.strokeWidth = 8;
          const path = new Paper.Path(
            stationPointsGroup.children[`${station1}`].position,
            stationPointsGroup.children[`${station2}`].position,
          );
          path.strokeColor = colors[i % colors.length];
          path.strokeWidth = 7;
          path.name = `${lines[i].line} from ${station1} to ${station2}`;
          // linePathsGroup.addChild(outerPath);
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

  return (
    <>
      {
        //------------------Offcanvas for planning the game------------------------//
      }
      <Offcanvas
        show={isPlanning}
        placement="end"
        backdrop={false}
      >
        <Offcanvas.Body>
          <>{`From: ${start} to ${end}`}</>
          {gameActive && stationPairs && (
            <ListGroup>
              {stationPairs.map((stationPair) => {
                const identifier =
                  stationPair.station_1 + "-" + stationPair.station_2;
                const stationPairInSelected = selectedStationPairs.find(
                  (item) => {
                    return (
                      stationPair.station_1 === item.station_1 &&
                      stationPair.station_2 === item.station_2
                    );
                  },
                );
                const index =
                  selectedStationPairs.indexOf(stationPairInSelected) >= 0
                    ? selectedStationPairs.indexOf(stationPairInSelected) + 1
                    : false;
                return (
                  <ListGroup.Item
                    key={"LGI" + identifier}
                    active={index}
                    onClick={() => pathSelection(stationPair)}
                    style={{userSelect:"none"}}
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
      {
        //------------------Modal for Game End------------------------//
      }
      <Modal show={showEndScreen}>
        <Modal.Header>
          <Modal.Title>Game end</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {endText}
          <br/>
          You finished your journey with {coins} coins in your pocket. Your Highscore
          is now {user.highscore} coins.
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            onClick={() => {
              playAgain();
            }}
          >
            Play again
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              navigate("/")
              setShowEndScreen(false);
            }}
          >
            Quit
          </Button>
        </Modal.Footer>
      </Modal>
      {
        //------------------Permanent Parts of the Page here------------------------//
      }
       <div
        style={{
          position: "absolute",
          marginLeft: "-150px",
          padding: "5px",
          fontSize: "40",
          maxWidth: "300px"
        }}
      >
      <b>Your have: {coins}{"      "}</b>
      <img src="/cash-coin.svg"
            width="35"
            height="35"
            alt="Coin Icon"
            style={{color: "green"}}
            >
      </img>
      </div>
      <canvas ref={canvasRef} id="canvas" width={"1160px"} height={"568px"}/>
      <Container fluid="xs">
        <Row className="justify-content-md-center">
          {!gameActive &&
            "If you are ready to start the planning phase, press start game!"}
          {isPlanning &&
            "If you are finished early, you can press submit to execute the validation early!"}
        </Row>
        <Row className="justify-content-md-center" md="auto">
          {!gameActive && (
            <Button
              onClick={() => {
                startGame();
              }}
            >
              Start Game
            </Button>
          )}
          {isPlanning && (
            <Button
              onClick={() => {
                if(selectedStationPairs.length <= 0){
                  props.setCurrentToast({title:"Info",text:"Make sure you have selected at least one pair of stations",type:"warning"})
                }
                else{
                executeSelectedRoute();
                }
              }}
            >
              Submit Route
            </Button>
          )}
        </Row>
        {gameActive && isPlanning &&
        <Row className="justify-content-md-center" md="10">
          {
            //TODO:Fix bar not going to the end
          }
            <ProgressBar animated variant={currentTime/planningTime>0.2?"warning":"danger"} now={(currentTime/planningTime) * 100} style={{maxWidth:"500px"}}/>
        </Row>
        }
      </Container>
    </>
  );
}
export default GamePage;
