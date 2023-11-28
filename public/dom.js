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

let isUnlimited = false;
{
  const unlimited = urlParams.get("unlimited");
  const toggle = document.getElementById("unlimited-toggle");
  if (unlimited === "true") {
    document.getElementById("mistakes-container").style.display = "none";
    isUnlimited = true;
    toggle.firstElementChild.style.transition = "transform ease 0.3s";
    setTimeout(() => toggle.classList.toggle("active"), 5);
  } else if (unlimited === "false") {
    toggle.classList.toggle("active");
    setTimeout(() => {
      toggle.firstElementChild.style.transition = "transform ease 0.3s";
      toggle.classList.toggle("active");
    }, 5);
  }
}

function toggleSwitch() {
  // Get the current URL
  const currentUrl = window.location.href;

  // Create a URL object to easily manipulate the search parameters
  const url = new URL(currentUrl);

  // Get the value of the 'unlimited' parameter (if it exists)
  const unlimitedValue = url.searchParams.get("unlimited");

  // Toggle the 'unlimited' parameter
  if (unlimitedValue === "true") {
    url.searchParams.set("unlimited", "false");
  } else {
    url.searchParams.set("unlimited", "true");
  }

  // Navigate to the new URL
  window.location.href = url.toString();
}

const mistakeDots = document.querySelectorAll(".mistake-dot");

function removeMistakeDot() {
  const remainingDots = Array.from(document.querySelectorAll(".mistake-dot:not(.hidden)"));
  if (remainingDots.length > 0) {
    const firstVisibleDot = remainingDots.at(-1);
    firstVisibleDot.classList.add("hidden");
    setTimeout(checkMistakes, 1000);
  }
}

function checkMistakes() {
  const remainingDots = document.querySelectorAll(".mistake-dot:not(.hidden)");
  if (remainingDots.length === 0) {
    alert("No more mistakes remaining!"); // Replace with your desired action
    setTimeout(revealAnswer, 1000);
  }
}
