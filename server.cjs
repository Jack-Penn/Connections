const express = require("express");
const path = require("path");
let { getGame, getRandomGameString, getGameData, getRandomGame } = {};
import("./connections-api.js").then((res) => {
  ({ getGame, getRandomGameString, getGameData, getRandomGame } = res);
});

const app = express();
const port = 3000;

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, "public")));

// Define your updated API endpoint
app.get("/api/game", (req, res) => {
  let gameData;
  try {
    const id = req.query.id;

    // Check if the id parameter is defined
    if (id !== undefined) {
      switch (id) {
        case "random":
          const difficulty = req.query.difficulty ? parseInt(req.query.difficulty) : undefined;
          const str = getRandomGameString(difficulty);
          res.json({ string: str, api: `http://localhost:3000/api/game?id=${str}` });
          // res.send(str);
          break;
        case "experimental":
          break;
        default:
          gameData = getGameData(id);
          break;
      }
    } else {
      // Extract the date parameter from the query string
      const dateString = req.query.date?.toLowerCase();
      let date;

      switch (dateString) {
        case "today":
        case undefined:
          date = new Date();
          break;
        default:
          date = new Date(dateString);
          date.setDate(date.getDate() + 1);
          if (isNaN(date.getTime())) {
            throw new Error('Invalid date parameter. Please provide a valid date or use "today".');
          }
      }

      // Call getGame with the specified date
      gameData = getGame(date);
    }

    res.json(gameData);
  } catch (error) {
    console.error("Error fetching game data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// New function based on the id parameter
function processId(id) {
  // Implement logic based on the id
  // Example: Return a string indicating the id value
  return `Processing id: ${id}`;
}

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
