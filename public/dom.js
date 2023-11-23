document.addEventListener("keydown", function (event) {
  switch (event.key) {
    case "Enter":
      if (selected.length == 4) submitItems();
      break;
    case " ":
      shuffleItems();
      break;
  }
});
