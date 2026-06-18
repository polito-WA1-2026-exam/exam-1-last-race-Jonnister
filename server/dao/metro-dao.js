import db from "./db.js";

function MetroDAO() {

    /**
     * Converts database rows containing metro line information to the following format:
     * [{
     *  line: line_name,
     *  station_pairs: [{station_1: x, station_2: y}, ...]
     *  },
     *  ...]
     */
  const formatMetroData = (rows) => {
    var metroLines = [];
    var linesToVisit = [];
    for (var i = 0; i < rows.length; i++) {
      if (!linesToVisit.includes(rows[i].line)) {
        linesToVisit = [...linesToVisit, rows[i].line];
      }
    }
    while (linesToVisit.length > 0) {
      const lineToVisit = linesToVisit.shift();
      var stationPairs = [];
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].line === lineToVisit) {
          stationPairs = [
            ...stationPairs,
            {
              station_1: rows[i].station_1,
              station_2: rows[i].station_2,
            },
          ];
        }
      }
      metroLines = [
        ...metroLines,
        { line: lineToVisit, station_pairs: stationPairs },
      ];
    }
    return metroLines;
  };

  /**
   * Selects randomly a starting station and an end station with a gap of at least three from the list of all stations.
   * @param {*} stationPairs in the form of {station_1: "NAME1", station_2: "NAME2"}
   * @returns either a randomly selected starting and destination station {starting_station: "NAME1", destination_station: "NAME2"} or an error message if the network is not large enough.
   */
  const selectRandomStartAndDestination = (stationPairs) => {
    var stations = []
    var potentialStartStations = [];
    stationPairs.forEach(stationPair => {
        if(!stations.includes(stationPair.station_1)){
            stations = [...stations, stationPair.station_1];
            potentialStartStations = [...potentialStartStations, stationPair.station_1];
        }
        if(!stations.includes(stationPair.station_2)){
            stations = [...stations, stationPair.station_2];
            potentialStartStations = [...potentialStartStations, stationPair.station_2];
        }
    });
    var potentialEndStations = [...potentialStartStations];
    var startStation = "";
    var endStation = "";

    while(true){
    //If there are not potential starting stations that meet the criteria
    if(potentialStartStations.length === 0){
        return {error: "The network provided does not have any 3-gap station connections."}
    }
    startStation = potentialStartStations[Math.floor(Math.random() * potentialStartStations.length)];
    potentialEndStations = [...potentialStartStations];
    potentialEndStations = getPotentialEndStations(startStation, stationPairs, potentialEndStations);
    // If there are no potential end stations, this is no longer considered a potential starting station
    if(potentialEndStations.length === 0){
        potentialStartStations = potentialStartStations.filter(element => element != startStation);
    }
    //Otherwise select one of the potential end stations and finish
    else{
        endStation = potentialEndStations[Math.floor(Math.random() * potentialEndStations.length)];
        return {startStation: startStation, endStation: endStation}
    }
    }
  }

  /**
   * Excludes the nearby stations from the starting station from the potential end stations.
   * @param {*} startStation the station from which the route starts
   * @param {*} stationPairs station to station connections in the form of {station_1: "NAME1", station_2: "NAME2"}
   * @param {*} potentialEndStations the stations that were available as end stations at the start of computing.
   * @returns the potential Endstations.
   */
  const getPotentialEndStations = (startStation, stationPairs, potentialEndStations) =>{
    var stationsToCheck = [startStation];
    var excludedStations = [startStation];
    var queuedStationsToCheck = [];
    //If station 1 (2) is to Check get station 2 (1)
    for(var depth = 0; depth < 3; depth++){
        stationPairs.filter(stationPair => {
            if(stationsToCheck.includes(stationPair.station_1)){
                queuedStationsToCheck = [...queuedStationsToCheck, stationPair.station_2];
                excludedStations =  [...excludedStations, stationPair.station_2];
            }
            if(stationsToCheck.includes(stationPair.station_2)){
                queuedStationsToCheck = [...queuedStationsToCheck, stationPair.station_1];
                excludedStations =  [...excludedStations, stationPair.station_1];
            }
        }
    )
    stationsToCheck = [...queuedStationsToCheck];
    queuedStationsToCheck = [];
    }
    
    return potentialEndStations = potentialEndStations.filter(station => !excludedStations.includes(station));
  }

  /**
   * Gets all lines (name) and the respective station-station connections (also names) the line covers.
   */
  this.getLines = () => {
    return new Promise((resolve, reject) =>
      db("lines").all("SELECT * FROM lines", (err, rows) => {
        if (err) {
          reject(err);
        }
        //is this even a thing?
        else if (rows === undefined) {
          resolve({ error: "No lines found" });
        } else {
          const lines = formatMetroData(rows);
          resolve(lines);
        }
      }),
    );
  };

  /**
   * Gets all stations (names) and their positions (x,y). Does NOT get the stations connections to one-another.
   */
  this.getStations = () => {
    return new Promise((resolve, reject) =>
      db("stations").all("SELECT * FROM stations", (err, rows) => {
        if (err) {
          reject(err);
        } else if (rows === undefined) {
          resolve({ error: "No stations found" });
        } else {
          resolve(rows);
        }
      }),
    );
  };

  /**
   * Get a random starting and destination station, by first retrieving all distinct station pairs from the "lines" database.
   */
  this.getStartAndDest = () => {
    return new Promise((resolve, reject) =>
      db("lines").all(
        "SELECT DISTINCT station_1, station_2 FROM lines",
        (err, rows) => {
          if (err) {
            reject(err);
          } else if (rows === undefined) {
            resolve({ error: "No stations found" });
          } else {
            resolve(selectRandomStartAndDestination(rows));
          }
        },
      ),
    );
  };
}

export default MetroDAO;
