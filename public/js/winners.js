document.addEventListener("DOMContentLoaded", async function () {
  try {
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) return;

    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get("roomCode");

    if (!roomCode) {
      throw new Error("Room code not provided in URL");
    }

    const winnersContainer = document.getElementById("winnersContainer");
    const otherWinnersSection = document.querySelector(".other-winners");
    const winnersHeader = document.querySelector(".winners-header h1");
    const winnersSubtitle = document.querySelector(".winners-header .subtitle");

    if (!winnersContainer || !otherWinnersSection) {
      throw new Error("Required DOM elements not found");
    }

    const roomResponse = await fetch(`/api/rooms/${roomCode}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    if (!roomResponse.ok) {
      throw new Error(`Failed to fetch room: ${roomResponse.statusText}`);
    }

    const room = await roomResponse.json();

    winnersContainer.innerHTML = "";
    otherWinnersSection.querySelector(".winner-grid").innerHTML = "";

    if (room.winners && room.winners.length > 0) {
      winnersHeader.textContent = `🏆 Room Winners 🏆`;
      winnersSubtitle.textContent = `Celebrating the top ${room.winners.length} artworks`;

      const podiumWinners = room.winners.slice(0, 3);
      const podiumPlaces = ["first-place", "second-place", "third-place"];
      const medalImages = [
        "gold-medal.svg",
        "silver-medal.svg",
        "bronze-medal.svg",
      ];
      const placeNames = ["First Place", "Second Place", "Third Place"];

      podiumWinners.forEach((winner, index) => {
        const podiumPlace = document.createElement("div");
        podiumPlace.className = `podium-place ${podiumPlaces[index]}`;

        podiumPlace.innerHTML = `
          <div class="podium-badge">
            <img src="/assets/imgs/Medals/${medalImages[index]}" alt="${
          placeNames[index]
        } Medal">
            <h2>${placeNames[index]}</h2>
          </div>
          <div class="winner-photo" data-artwork-id="${winner._id}">
            <img src="${winner.imagePath}" alt="${
          winner.createdBy.name
        }'s Artwork">
            <div class="winner-info">
              <h3>${winner.createdBy.name}</h3>
              <p class="winner-score">Score: ${winner.voteCount}</p>
              ${
                winner.description
                  ? `<p class="winner-description">"${winner.description}"</p>`
                  : ""
              }
            </div>
          </div>
          <div class="podium-stand"></div>
        `;
        winnersContainer.appendChild(podiumPlace);
      });

      document.querySelectorAll(".winner-photo").forEach((element) => {
        element.addEventListener("click", (e) => {
          const artworkId = element.getAttribute("data-artwork-id");
          window.location.href = `/voting.html?artworkId=${artworkId}`;
        });
      });

      if (room.winners.length > 3) {
        const honorableMentions = room.winners.slice(3);
        const winnerGrid = otherWinnersSection.querySelector(".winner-grid");

        honorableMentions.forEach((winner, index) => {
          const position = index + 4;
          const winnerCard = document.createElement("div");
          winnerCard.className = "winner-card";

          winnerCard.innerHTML = `
            <div class="winner-position">${position}${getOrdinalSuffix(
            position
          )}</div>
            <img src="${winner.imagePath}" alt="Artist artwork">
            <div class="winner-details">
              <h3>${winner.createdBy.name}</h3>
              <p>Votes: ${winner.voteCount}</p>
              ${
                winner.description
                  ? `<p class="artwork-description">"${winner.description}"</p>`
                  : ""
              }
            </div>
          `;

          winnerGrid.appendChild(winnerCard);
        });
      } else {
        otherWinnersSection.style.display = "none";
      }
    } else {
      winnersContainer.innerHTML = `
        <div class="no-winners">
          <i class="fas fa-trophy"></i>
          <p>No winners declared yet</p>
          <p>Check back later when the competition ends!</p>
        </div>
      `;
      otherWinnersSection.style.display = "none";
    }
  } catch (error) {
    showError(error.message);
  }
});

function getOrdinalSuffix(num) {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
}

function showError(message) {
  const errorMessage = document.createElement("div");
  errorMessage.className = "error-message";
  errorMessage.innerHTML = `
    <i class="fas fa-exclamation-triangle"></i>
    <p>${message}</p>
    <button onclick="window.location.reload()">Try Again</button>
    <button onclick="window.location.href='/rooms.html'">Back to Rooms</button>
  `;

  const winnersContainer =
    document.getElementById("winnersContainer") ||
    document.querySelector(".winners-container");
  if (winnersContainer) {
    winnersContainer.innerHTML = "";
    winnersContainer.appendChild(errorMessage);
  } else {
    document.body.innerHTML = `
      <div class="full-page-error">
        <h2>Error Loading Page</h2>
        <p>${message}</p>
        <button onclick="window.location.href='/rooms.html'">Back to Rooms</button>
      </div>
    `;
  }
}

async function checkAuth() {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) {
      window.location.href = "/login.html";
      return false;
    }

    const response = await fetch("/api/users/verify", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      window.location.href = "/login.html";
      return false;
    }

    return true;
  } catch (error) {
    console.error("Auth check failed:", error);
    window.location.href = "/login.html";
    return false;
  }
}
