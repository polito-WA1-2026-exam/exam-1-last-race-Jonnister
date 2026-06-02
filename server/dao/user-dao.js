import db from "./db.js";
import crypto from "crypto";

function UserDAO() {
  /**
   * Returns Username (and ID?), Highscore, if password is correct and user with that username exists.
   */
  this.getUser = (username, password) => {
    return new Promise((resolve, reject) => {
      db("users").get(
        "SELECT * FROM users WHERE username=?",
        [username],
        (err, row) => {
          if (err) {
            reject(err);
          } else if (row === undefined) {
            resolve({ error: `No user with username: ${username}` });
          } else {
            const user = {
              id: row.id,
              username: row.username,
              highscore: row.highscore,
            };
            crypto.scrypt(password, row.salt, 64, (err, hashedPassword) => {
              if (err) {
                reject(err);
              } else if (
                !crypto.timingSafeEqual(
                  Buffer.from(row.password, "hex"),
                  hashedPassword,
                )
              ) {
                resolve(false);
              } else {
                resolve(user);
              }
            });
          }
        },
      );
    });
  };

  /**
   * Sets Highscore for a user.
   */
  this.setHighscore = (username, score) => {
    //Sets the users highscore
  };
}

export default UserDAO;
