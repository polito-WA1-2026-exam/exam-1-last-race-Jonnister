import sqlite3 from "sqlite3";

//Opens the respective database
const db = (dbtitle) =>
  new sqlite3.Database(`./db/${dbtitle}.db`, (err) => {
    if (err) throw err;
  });

export default db;
