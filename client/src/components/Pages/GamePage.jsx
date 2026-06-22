import { useContext, useEffect, useState, useRef } from "react";
import userContext from "../../utility/contexts/Usercontext";
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

/**Main Page (Shows Game Screen -> first network, then remove network links only stations)*/
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
    "gold",
    "DeepSkyBlue",
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
  const [startEndGroup, setStartEndGroup] = useState(undefined);
  const [selectedStationPairs, setSelectedStationPairs] = useState([]);
  const [coins, setCoins] = useState(20);
  const [endText, setEndText] = useState("");

  //Timer
  const [timeIntervalID, setTimeIntervalId] = useState(0);
  const planningTime = 90;
  const [currentTime, setCurrentTime] = useState(planningTime);
  const [isTimeUp, setIsTimeUp] = useState(false);

  //Basicly game state machine
  const [gameActive, setGameActive] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [showEndScreen, setShowEndScreen] = useState(false);

  //Paper
  const canvasRef = useRef(null);

  //------------------------ Functions -----------------------------------/

  /** Draws stations and lines using paper on the canvas, adds them to the group states stationPoints and linePaths.*/
  const drawNetwork = () => {
    if (stations && lines) {
      var stationPointsGroup = new Group();
      var linePathsGroup = new Group();
      for (var i = 0; i < stations.length; i++) {
        //somewhere between 1 to 1200 for x and 10 and 500
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
        //Adds visual identifrier to interchange stations, makes game easier
        /**if (stations[i].interchange === 1) {
          const circleText = new PointText({
            point: new Paper.Point(circle.position.x, circle.position.y + 5),
            content: `IC`,
            justification: "center",
            color: "black",
            size: "100px",
            font: "Arial",
            fontWeight: "bold",
          });
        }*/
        stationPointsGroup.addChild(circle);
      }
      for (var i = 0; i < lines.length; i++) {
        for (var j = 0; j < lines[i].station_pairs.length; j++) {
          const station1 = lines[i].station_pairs[j].station_1;
          const station2 = lines[i].station_pairs[j].station_2;
          const path = new Paper.Path(
            stationPointsGroup.children[`${station1}`].position,
            stationPointsGroup.children[`${station2}`].position,
          );
          path.strokeColor = colors[i % colors.length];
          path.strokeWidth = 7;
          path.name = `${lines[i].line} from ${station1} to ${station2}`;
          linePathsGroup.addChild(path);
        }
      }
      setStationPoints(stationPointsGroup);
      linePathsGroup.sendToBack();
      setLinePaths(linePathsGroup);
    }
  };

  /**
   * Sets both the start and end state to a random station name.
   */
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
        const group = new Paper.Group([startCircle, endCircle]);
        setStartEndGroup(group);
      })
      .catch((err) => {
        props.setCurrentToast({
          title: "Error",
          text: `${err.message}`,
          type: "danger",
        });
      });
  };

  /**
   * Commences the planning phase, meaning that for 90s the lines between stations are no longer displayed and
   * the player can choose the stations one after another; If the time is up or the user submits his route early,
   * the execution phase begins.
   */
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
    var time = planningTime;
    //Start game after 90s
    setTimeIntervalId(
      setInterval(() => {
        time = time - 0.1;
        setCurrentTime(time);
        if (time <= 0) {
          setIsTimeUp(true);
          props.setCurrentToast({
            title: "Times Up!",
            text: `Your time ran out!`,
            type: "warning",
          });
          return;
        }
      }, 100),
    );
  };

  /** Provides the logic for the in-sequence selection (and removal) of station pairs to (from) the route. */
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

  /** Once the planning phase is finished, the route of the user is executed step-by-step, with events adding/removing coins and being displayed
   * as toasts in the bottom of the screen. If the path is invalid immdetialey shows the end game modal; Otherwise waits until events have been shown
   * one after another.
   */
  const executeSelectedRoute = () => {
    setIsTimeUp(false);
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
        },
        3000 * (i + 0.5),
      );
      if (station === end) {
        setEndText("You successfully reached the endstation!");
        setTimeout(
          () => {
            setShowEndScreen(true);
            playerMarker.remove();
          },
          3000 * (i + 1.5),
        );
      }
    }
  };

  /**
   * Gets a random event and modifies the players coins according to that events coin modificator.
   */
  const getRandomEvent = () => {
    sendRequest("/event", "GET", "getting random event", undefined, "JSON")
      .then((body) => {
        const text = body.event.text;
        const coinMod = body.event.coinModificator;
        const gainText =
          coinMod > 0 ? "You gained " + coinMod : "You lost " + -coinMod;
        const coinText = Math.abs(coinMod) === 1 ? " coin!" : " coins!";
        props.setCurrentToast({
          title: "Something happenend...",
          text: `${text} ${gainText} ${coinText}`,
          type: "Light",
        });
        setCoins((coins) => (coins + coinMod < 0 ? 0 : coins + coinMod));
      })
      .catch((err) => {
        props.setCurrentToast({
          title: "Error",
          text: `${err.message}`,
          type: "danger",
        });
      });
  };

   /**
   * Checks the path validity, that is the controlling the station-to-station connections in selectedStationPairs.
   * Depending on the result sets the end message displayed in a modal after the game ends.
   * @returns true/false depending on wether the path is valid.
   */
  const checkPathValidity = () => {
    //Check if end can be reached, by going in sequence from one station to another
    const failMessage =
      "Since you did not successfully reach your goal by train, you had to spent all your money on a taxi.";
    if (!selectedStationPairs || selectedStationPairs.length === 0) {
      setEndText("You did not plan any route! " + failMessage);
      return false;
    }
    var lastStation = "initial";
    var lastLine = "initial"
    for (var i = 0; i < selectedStationPairs.length; i++) {
      const station1 = selectedStationPairs[i].station_1;
      const station2 = selectedStationPairs[i].station_2; 
    
    var line = undefined;
    for ( var j= 0; j < lines.length; j++){
     line = lines[j].station_pairs.includes(selectedStationPairs[i]) ? lines[j].line : undefined;
     if(line){
      break;
     }
    }
    if(lastLine === "initial"){
      lastLine = line;
    }
    else if(lastLine !== line && !(stations.find((station) =>station1 === station.name).interchange || stations.find((station) =>station2 === station.name).interchange)){
      setEndText(
          "You tried to change the line at a non interchange station! " + failMessage,
        );
        return false;
    }
    else{
      lastLine = line;
    }
      if (i === 0 && station1 !== start && station2 !== start) {
        setEndText(
          "Your route did not start from the starting station! " + failMessage,
        );
        return false; //Does not start from start
      }
      if (
        i === selectedStationPairs.length - 1 &&
        station1 !== end &&
        station2 !== end
      ) {
        setEndText("Your route did not end at the end station! " + failMessage);
        return false; // Does not end at end
      }
      if (
        i < selectedStationPairs.length - 1 &&
        (station1 === end || station2 === end)
      ) {
        setEndText("Your route did not end at the end station! " + failMessage);
        return false; // Route does not end with end
      }

      if (lastStation !== "initial") {
        if (lastStation !== station1 && lastStation !== station2) {
          setEndText(
            `Neither ${station1} nor ${station2} are connected to ${lastStation}. ` +
              failMessage,
          );
          return false; //Segment not connected to the last segment
        } else {
          lastStation = station1 === lastStation ? station2 : station1;
        }
      } else {
        lastStation = station1 === start ? station2 : station1;
      }
    }
    return true;
  };

  /**Updates the users highscore in the database, should it be a new highscore.*/
  const submitNewUserScore = () => {
    if (user.highscore >= coins) {
      return;
    }
    sendRequest(
      "/highscore",
      "POST",
      "submitting new user highscore",
      { highscore: coins },
      "JSON",
    )
      .then((body) => {
        props.setUser({
          id: user.id,
          username: user.username,
          highscore: body.newHighscore,
        });
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

  //** Resets states and canvas visually, allows player to play another game.*/
  const playAgain = () => {
    startEndGroup.remove();
    setGameActive(false);
    setShowEndScreen(false);
    setSelectedStationPairs([]);
    linePaths.opacity = 1;
    setCoins(20);
  };

  //------------------------ useEffects -----------------------------------/
  //Redirect unauthorized user; Get network
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

  //Setup paper
  useEffect(() => {
    if (stations && lines) {
      const canvas = canvasRef.current;
      const project = Paper.setup(canvas);
      drawNetwork();
      Paper.view.draw();
    }
  }, [stations]);

  //Unsubscribe interval
  useEffect(() => {
    return () => {
      clearInterval(timeIntervalID);
    };
  }, [timeIntervalID]);

  //Execute the selected route once the time for the planning phase has run out
  useEffect(() => {
    if (isTimeUp) executeSelectedRoute();
  }, [isTimeUp]);

  //Submit highscore if endscreen is shown
  useEffect(() => {
    if (showEndScreen) {
      submitNewUserScore();
    }
  }, [showEndScreen]);

  return (
    <>
      {
        //------------------Offcanvas for planning the game------------------------//
      }
      <Offcanvas show={isPlanning} placement="end" backdrop={false}>
        <Offcanvas.Body>
          <b>{`From: ${start} to ${end}`}</b>
          {gameActive && stationPairs && (
            <ListGroup as="ul" style={{marginTop: "1vh"}}>
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
                    as="li"
                    variant="info"
                    style={{ userSelect: "none" }}
                  >
                    {index && (
                      <Badge bg="primary" style={{marginRight: "1vw"}}>
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
          <br />
          You finished your journey with {coins} coins in your pocket. Your
          Highscore is now {user.highscore} coins.
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
              navigate("/");
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
          maxWidth: "300px",
        }}
      >
        <b>
          You have: {coins}
          {"      "}
        </b>
        <img
          src="/cash-coin.svg"
          width="35"
          height="35"
          alt="Coin Icon"
          style={{ color: "green" }}
        ></img>
        {gameActive && (
          <div>
            <div style={{ color: "green" }}>
              <b>Start station: {start} </b>
            </div>
            <div style={{ color: "red" }}>
              <b> End station: {end} </b>
            </div>
          </div>
        )}
          <ListGroup as="ul" >
            {!isPlanning && lines &&
              linePaths &&
              lines.sort((line1, line2) => (""+line1.line).localeCompare(""+line2.line)).map((line) => 
              { 
                return <ListGroup.Item as="li" style=
                  {{
                    color: colors[lines.indexOf(line)],
                    width: "7vw",
                  }}
                  variant="light"
                  data-bs-theme="light"
                  > 
                  <b>Line {line.line}</b>
                </ListGroup.Item>;}
              )}
          </ListGroup>
      </div>
      <canvas ref={canvasRef} id="canvas" width={"1160px"} height={"568px"} style={{alignContent:"center", alignItems:"center", alignSelf:"center"}} />
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
                if (selectedStationPairs.length <= 0) {
                  props.setCurrentToast({
                    title: "Info",
                    text: "Make sure you have selected at least one pair of stations",
                    type: "warning",
                  });
                } else {
                  executeSelectedRoute();
                }
              }}
            >
              Submit Route
            </Button>
          )}
        </Row>
        {gameActive && isPlanning && (
          <Row className="justify-content-md-center" md="10">
            <ProgressBar
              animated
              variant={currentTime / planningTime > 0.2 ? "warning" : "danger"}
              now={(currentTime / planningTime) * 100}
              style={{ maxWidth: "40vw", padding: "0 0 0 0" }}
            />
          </Row>
        )}
      </Container>
    </>
  );
}
export default GamePage;