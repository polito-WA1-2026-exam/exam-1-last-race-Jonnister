//Default page: For visitors and rules explanation
import { useContext } from "react";
import userContext from "../../utility/contexts/Usercontext.js";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router";

function RulesPage() {
  const user = useContext(userContext);
  const navigate = useNavigate();
  return (
    <>
      <h1>Welcome to the Last Race!</h1>
      In this single-player experience you will have to memorize and then plan
      your route through a complicated railway network.
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {!user.id && <h3>Please login to play.</h3>}

        {user.id && (
          <Button
            onClick={() => {
              navigate("/play");
            }}
          >
            Play
          </Button>
        )}
      </div>
      In the first part of the game the railway map will be shown, with all
      stations and names as well as the lines connecting the different stations.
      You can always change the line you are travelling with at the interchange
      stations. Make sure to memorize this map! As soon as you press start, the
      90s long planning phase will begin. You will be given a start- and
      end-station and your goal is to plan a route from that starting station to
      the end-station, by choosing station to station connections
      in sequence. But of course, there is a catch: You no longer see the
      lines on the map, you have to rely on your memory and choose the
      station-station connections from the menu on the right hand side of the
      screen. Once you are finished or the time runs out, the game will validate
      wether you planned a valid route (from start to end) and then you will
      travel from one station to another collecting or loosing coins on each
      segment of your journey. So make sure you to plan your route wisely!
    </>
  );
}

export default RulesPage;
