import db from "./db.js";

function EventDAO() {
  /** Gets a random event by id.
   */
  this.getRandomEvent = () => {
    //Add plus one to also be able to select the element with max id
    const randomIDQuery = "(abs(random()) % (SELECT max(id) FROM events) +1)";
    return new Promise((resolve, reject) =>
      db("events").get(
        "SELECT * FROM events WHERE id >=" + randomIDQuery,
        (err, row) => {
          if (err) {
            reject(err);
          } else if (row === undefined) {
            resolve({ err: "Could not find event." });
          } else {
            const event = {
              text: row.description,
              coinModificator: row.coinModificator,
            };
            resolve(event);
          }
        },
      ),
    );
  };
}

export default EventDAO;
