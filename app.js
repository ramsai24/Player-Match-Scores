const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
app.use(express.json());

let db = null;
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB error : ${e.message}`);
  }
};

initializeDBAndServer();

//API 1

const convertCamelToSnake = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

app.get("/players/", async (request, response) => {
  const sqlQuery = `
    SELECT * 
    FROM player_details ;`;
  const playerList = await db.all(sqlQuery);
  response.send(
    playerList.map((eachObject) => convertCamelToSnake(eachObject))
  );
});

//API 2

app.get("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;

  const sqlQuery = `
    SELECT * 
    FROM player_details
    WHERE 
        player_id = ${playerId}`;

  const playerList = await db.get(sqlQuery);
  response.send(convertCamelToSnake(playerList));
});

//API 3

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;

  const sqlQuery = `
  UPDATE player_details 
  SET  player_name = "${playerName}" 
  WHERE 
        player_id = ${playerId};`;

  const updatedList = await db.run(sqlQuery);

  //response.send({ playerName: updatedList.player_name });
  response.send("Player Details Updated");
});

//API 4

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;

  const sqlQuery = `
  SELECT * 
  FROM match_details 
  WHERE match_id = ${matchId};`;

  const matchDetailsObject = await db.get(sqlQuery);
  console.log(matchDetailsObject);
  response.send({
    matchId: matchDetailsObject.match_id,
    match: matchDetailsObject.match,
    year: matchDetailsObject.year,
  });
});

//API 5

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;

  const sqlQuery = `
  SELECT player_match_score.match_id, match_details.match, match_details.year 
  FROM player_match_score INNER JOIN match_details ON player_match_score.match_id = match_details.match_id
  WHERE player_id = ${playerId};`;

  const matchDetailsObject = await db.all(sqlQuery);
  console.log(matchDetailsObject);
  //response.send(matchDetailsObject);
  response.send(
    matchDetailsObject.map((object) => {
      return {
        matchId: object.match_id,
        match: object.match,
        year: object.year,
      };
    })
  );
});

//API 6

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;

  const sqlQuery = `
  SELECT player_match_score.player_id, player_name
  FROM player_match_score INNER JOIN match_details ON player_match_score.match_id = match_details.match_id INNER JOIN player_details ON player_details.player_id = player_match_score.player_id
  WHERE player_match_score.match_id  = ${matchId};`;

  const matchDetailsObject = await db.all(sqlQuery);
  console.log(matchDetailsObject);
  //response.send(matchDetailsObject);
  response.send(
    matchDetailsObject.map((object) => {
      return {
        playerId: object.player_id,
        playerName: object.player_name,
      };
    })
  );
});

//API 7

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;

  const sqlQuery = `
  SELECT player_match_score.player_id, player_name , SUM(score), SUM(fours), SUM(sixes)
  FROM player_match_score INNER JOIN match_details ON player_match_score.match_id = match_details.match_id INNER JOIN player_details ON player_details.player_id = player_match_score.player_id
  WHERE player_match_score.player_id  = ${playerId};`;

  const matchDetailsObject = await db.all(sqlQuery);
  console.log(matchDetailsObject);
  //response.send(matchDetailsObject);

  const playerList = matchDetailsObject.map((object) => {
    return {
      playerId: object.player_id,
      playerName: object.player_name,
      totalScore: object["SUM(score)"],
      totalFours: object["SUM(fours)"],
      totalSixes: object["SUM(sixes)"],
    };
  });
  response.send(playerList[0]);
});

module.exports = app;
