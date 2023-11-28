let items;
let itemElms = [];
let selected = [];
let correctOverlays = [];

let tries = 0;

// Get the URL parameters
const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get("id");
let date = urlParams.get("date");

if (id) {
  createItems(`/api/game?id=${id}`);
  document.getElementById("difficulty-selector").value = urlParams.get("difficulty");
} else if (date) {
  createItems(`/api/game?date=${date}`);
  document.getElementById("datepicker").value = date;
} else {
  createItems("/api/game");
  date = formatDate(new Date());

  // Format the date as "yyyy-mm-dd"
  document.getElementById("datepicker").value = date;
}

function formatDate(date) {
  // Extract year, month, and day
  const yyyy = date.getFullYear();
  const mm = (date.getMonth() + 1).toString().padStart(2, "0"); // Months are zero-indexed
  const dd = date.getDate().toString().padStart(2, "0");

  return yyyy + "-" + mm + "-" + dd;
}

function getRandomGame() {
  const difficulty = document.getElementById("difficulty-selector").value;
  fetch(`/api/game?id=random&difficulty=${difficulty}`)
    .then((res) => res.json())
    .then(({ string }) => (window.location.href = `/?difficulty=${difficulty}&id=${string}`));

  return false;
}

function getDateGame() {
  const date = document.getElementById("datepicker").value;
  if (date) {
    window.location.href = `/?date=${date}`;
  }
}

async function createItems(endpoint) {
  items = fetch(endpoint)
    .then((res) => res.json())
    .then((data) =>
      Object.entries(data.groups)
        .map(([category, { members }]) =>
          members.map((item) => ({
            category,
            text: item,
            selected: false,
            correct: false,
            elm: null,
            i: null,
          }))
        )
        .flat()
    );
  items = await items;
}

window.addEventListener("load", async function () {
  items = await items;
  itemElms = Array.from(document.querySelectorAll(".item"));
  correctOverlays = Array.from(document.querySelectorAll(".correct-overlay"));
  shuffleItems();
});

function itemClicked(element) {
  const item = items.find(({ text }) => text == element.innerHTML);
  if (selected.length != 4 || item.selected) toggleSelected();

  function toggleSelected() {
    item.selected = !item.selected;
    element.classList.toggle("selected");
    updateSelected();
    document.getElementById("submit-button").disabled = selected.length != 4;
  }
}

function shuffleItems() {
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  shuffleArray(items).forEach((item, i) => {
    setItemElm(item, i);
  });
}

function setItemElm(item, i) {
  item.elm = itemElms[i];
  item.i = i;
  itemElms[i].innerHTML = item.text;
  if (itemElms[i].classList.contains("selected") != item.selected) itemElms[i].classList.toggle("selected");
  if (itemElms[i].classList.contains("correct") != item.correct) itemElms[i].classList.toggle("correct");
}

function deselectAll() {
  selected.forEach((item) => {
    item.selected = false;
    item.elm.classList.toggle("selected");
  });
  selected = [];
  document.getElementById("submit-button").disabled = true;
}

function updateSelected() {
  selected = items.filter(({ selected: s }) => s);
}

function submitItems() {
  tries++;
  document.getElementById("tries-readout").innerHTML = tries;

  const counts = Object.values(
    selected
      .map(({ category }) => category)
      .reduce((counts, category) => {
        if (counts.hasOwnProperty(category)) {
          counts[category]++;
        } else {
          counts[category] = 1;
        }
        return counts;
      }, {})
  );
  const maxCount = Math.max(...counts);

  if (maxCount == 4) {
    document.getElementById("submit-button").disabled = true;
    console.log("correct: " + selected[0].category);

    selected.forEach((item, i) => {
      item.correct = true;
      item.elm.classList.toggle("correct");

      itemElms[i].onclick = null;
    });

    let animatingItems = [...selected];

    const spaces = [0, 1, 2, 3].filter((space) => {
      for (let i = 0; i < animatingItems.length; i++) {
        const item = animatingItems[i];
        if (item.i == space) {
          animatingItems.splice(i, 1);
          return false;
        }
      }
      return true;
    });

    animatingItems
      .sort((a, b) => {
        const rowA = Math.floor(a.i / 4);
        const rowB = Math.floor(b.i / 4);
        if (rowA == rowB) {
          return (a.i % 4) - (b.i % 4);
        }
        return rowA - rowB;
      })
      .forEach((item, i) => {
        const swapSpace = items[spaces[i]];

        const { x, y } = item.elm.getBoundingClientRect();
        const { x: nx, y: ny } = swapSpace.elm.getBoundingClientRect();

        setTimeout(() => {
          item.elm.style.transform = `translate(${nx - x}px, ${ny - y}px)`;
        }, i * 200);

        setTimeout(() => {
          swapSpace.elm.style.transform = `translate(${x - nx}px, ${y - ny}px)`;
        }, i * 200);

        setTimeout(() => {
          item.elm.style.transition = "none";
          swapSpace.elm.style.transition = "none";
          item.elm.style.transform = "";
          swapSpace.elm.style.transform = "";

          items[item.i] = swapSpace;
          items[swapSpace.i] = item;
          const itemi = item.i;
          setItemElm(item, swapSpace.i);
          setItemElm(swapSpace, itemi);

          setTimeout(() => (swapSpace.elm.style.transition = ""), 10);
        }, i * 200 + 500);
      });

    setTimeout(() => {
      correctOverlays[0].style.display = "";
      correctOverlays[0].style.opacity = "1";

      const [titleElm, listElm] = correctOverlays[0].children;
      titleElm.innerHTML = selected[0].category;
      listElm.innerHTML = selected
        .map(({ text }) => text)
        .sort()
        .join(", ");
      correctOverlays = correctOverlays.slice(1);
      items = items.slice(4);
      if (items.length == 0) setTimeout(renderConfetti, 1000);

      itemElms = itemElms.slice(4);
      items.forEach((item, i) => {
        setItemElm(item, i);
      });

      setTimeout(deselectAll, 500);
    }, (animatingItems.length + 1) * 200 + 500);
  } else {
    console.log("Incorrect!");
    if (!isUnlimited) removeMistakeDot();

    const submitButton = document.getElementById("submit-button");
    submitButton.classList.add("shake");
    setTimeout(() => submitButton.classList.remove("shake"), 820);
    if (maxCount == 3) {
      console.log("One away...");
      const overlay = document.getElementById("overlay-text");
      overlay.style.opacity = 1;
      setTimeout(() => (overlay.style.opacity = 0), 1000);
    }
  }
}

function revealAnswer() {
  tries = Infinity;
  deselectAll();
  timeoutCallback();

  function timeoutCallback() {
    const catItems = items.filter(({ category }) => category == items[0].category);
    catItems.forEach((item) => itemClicked(item.elm));
    if (items.length > 0) {
      submitItems();
      setTimeout(timeoutCallback, 2000);
    } else {
      console.log("finished");
    }
  }
}

function incrementGame(event, rel) {
  const curDate = new Date(date);
  curDate.setDate(curDate.getDate() + rel + 1);
  window.location.href = `/?date=${formatDate(curDate)}`;
  event.stopPropagation();
}
