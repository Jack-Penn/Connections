import axios from "axios";
import cheerio from "cheerio";

const url = "https://www.nytimes.com/games/connections";

let gameData = await fetchAllAnswers();
console.log("data fetched!");

function fetchAllAnswers() {
  return axios
    .get(url)
    .then((response) => {
      const html = response.data;

      // Load the HTML content into Cheerio
      const $ = cheerio.load(html);

      // Extract the value of window.gameData
      const scriptContent = $("script")
        .filter((index, element) => {
          // You may need to adjust this based on the actual script containing window.gameData
          return $(element).html().includes("window.gameData");
        })
        .html();

      // Extract the window.gameData object from the script content
      const startIndex = scriptContent.indexOf("[");
      const endIndex = scriptContent.lastIndexOf("]");
      const gameDataString = scriptContent.slice(startIndex, endIndex + 1);

      // Parse the string as JSON
      return JSON.parse(gameDataString);
    })
    .catch((error) => {
      console.error("Error fetching the HTML:", error);
    });
}

export function getGame(date) {
  if (!(date instanceof Date) || isNaN(date)) {
    throw new Error("Invalid date. Please provide a valid date within the allowed range.");
  }

  // Calculate the index based on the provided information
  const startDate = new Date(2023, 10, 16);
  const startDateIndex = 157;
  const millisecondsInADay = 24 * 60 * 60 * 1000; // Number of milliseconds in a day

  const daysDifference = Math.floor((date - startDate) / millisecondsInADay);
  const correspondingIndex = startDateIndex + daysDifference;

  // Check if the calculated index is within the array bounds
  if (correspondingIndex < 0 || correspondingIndex >= gameData.length) {
    throw new Error("Date is outside the valid range for gameData.");
  }

  // Return the element at the calculated index
  return gameData[correspondingIndex];
}

export function getRandomGame() {
  const id = getRandomInt(gameData.length);
  return gameData[id];
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

export function getRandomGameString(difficulty) {
  const groups = getRandomGroups(difficulty);
  const str = encodeGameString(groups);
  return str;
}

function getRandomGroups(difficulty = 3) {
  const selectedGroups = [];

  let levels;
  switch (difficulty) {
    case 1:
      levels = [0, 1];
      break;
    case 2:
      levels = [1, 2];
      break;
    case 3:
      levels = [0, 1, 2, 3];
      break;
    case 4:
      levels = [2, 3];
      break;
    case 5:
      levels = [3];
  }

  while (selectedGroups.length < 4) {
    const randomDay = getRandomInt(gameData.length);
    // const randomGroup = getRandomInt(4);
    const groupNum = levels[selectedGroups.length % levels.length];

    const group = { day: randomDay, group: groupNum };

    // Ensure the group is not already selected for the same day
    if (!selectedGroups.includes(group)) {
      selectedGroups.push(group);
    }
  }

  return selectedGroups.sort((a, b) => a.day - b.day);
}

function encodeGameString(groups) {
  return groups.map((group) => `${group.day}:${group.group}`).join(";");
}

export function getGameData(encodedString) {
  const categories = encodedString.split(";").map((pair) => {
    const [day, groupNum] = pair.split(":").map(Number);

    const [category, data] = Object.entries(gameData[day].groups)
      .filter(([_, { level }]) => level == groupNum)
      .flat();

    return { [category]: data };
  });

  return {
    id: encodedString,
    groups: categories.reduce((a, b) => Object.assign(a, b), {}),
  };
}

getRepeatedWords();
function getRepeatedWords() {
  const data = [
    {
      id: 0,
      groups: {
        "WET WEATHER": {
          level: 0,
          members: ["HAIL", "RAIN", "SLEET", "SNOW"],
        },
        "NBA TEAMS": {
          level: 1,
          members: ["BUCKS", "HEAT", "JAZZ", "NETS"],
        },
        "KEYBOARD KEYS": {
          level: 2,
          members: ["OPTION", "RETURN", "SHIFT", "TAB"],
        },
        PALINDROMES: {
          level: 3,
          members: ["KAYAK", "LEVEL", "MOM", "RACE CAR"],
        },
      },
      startingGroups: [
        ["SNOW", "LEVEL", "SHIFT", "KAYAK"],
        ["HEAT", "TAB", "BUCKS", "RETURN"],
        ["JAZZ", "HAIL", "OPTION", "RAIN"],
        ["SLEET", "RACE CAR", "MOM", "NETS"],
      ],
    },
    {
      id: 1,
      groups: {
        FOOTWEAR: {
          level: 0,
          members: ["BUCKS", "LOAFER", "PUMP", "SNEAKER"],
        },
        "UNITS OF LENGTH": {
          level: 1,
          members: ["FOOT", "LEAGUE", "MILE", "YARD"],
        },
        MAGAZINES: {
          level: 2,
          members: ["ESSENCE", "PEOPLE", "TIME", "US"],
        },
        "LETTER HOMOPHONES": {
          level: 3,
          members: ["ARE", "QUEUE", "SEA", "WHY"],
        },
      },
      startingGroups: [
        ["PUMP", "FOOT", "TIME", "SEA"],
        ["LEAGUE", "LOAFER", "WHY", "US"],
        ["BUCKS", "YARD", "PEOPLE", "ARE"],
        ["MILE", "SNEAKER", "QUEUE", "ESSENCE"],
      ],
    },
  ];

  // Create an object to store repeated words and their categories
  let repeatedWords = {};

  // Iterate through each group
  gameData.forEach(({ id, groups }) => {
    Object.entries(groups).forEach(([category, { level, members }]) =>
      members.forEach((word) => {
        if (!repeatedWords.hasOwnProperty(word)) {
          repeatedWords[word] = {};
        }
        repeatedWords[word][category] = {
          id: `${id}:${level}`,
          members,
        };
      })
    );
  });

  console.log(repeatedWords);

  repeatedWords = Object.entries(repeatedWords)
    .filter(([word, categories]) => Object.values(categories).length > 1)
    .sort((w1, w2) => Object.values(w2[1]).length - Object.values(w1[1]).length);

  let repeatedCategories = {};
  repeatedWords.forEach(([word, categories]) => {
    Object.keys(categories).forEach((category) => {
      if (!repeatedCategories.hasOwnProperty(category)) {
        repeatedCategories[category] = {};
      }
      repeatedCategories[category][word] = categories;
    });
  });

  //Categories with most words in other categories
  repeatedCategories = Object.entries(repeatedCategories).sort(
    (a, b) => Object.keys(b[1]).length - Object.keys(a[1]).length
  );
}
