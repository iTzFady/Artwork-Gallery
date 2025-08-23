document.addEventListener("DOMContentLoaded", async function () {
  try {
    //Check for logged in user
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) return;
    //Render username and profile picture
    await updateProfile();
    //Get the room code from the url
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get("code");
    if (!roomCode) {
      throw new Error("Room code not provided");
    }
    //Update the code bar to show the code of the room
    setupCopyCode();
    //Renders the artwork of the joined room
    await loadArtworks(roomCode);
    //Make the upload buttom clickable to upload photos
    const uploadBtn = document.getElementById("uploadBtn");
    if (uploadBtn) {
      uploadBtn.addEventListener("click", () => {
        window.location.href = `/upload.html?roomCode=${roomCode}`;
      });
    }
    //Ending competition
    document.getElementById("code").value = roomCode;
    document
      .querySelector(".end-competition-btn")
      .addEventListener("click", async function () {
        if (
          !confirm(
            "Are you sure you want to close this room? This action cannot be undone."
          )
        )
          return;
        try {
          this.disabled = true;
          this.textContent = "Ending...";

          const response = await fetch(`/api/rooms/end/${roomCode}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          });

          if (response.ok) {
            alert("Room ended successfully");
            window.location.reload();
          } else {
            const error = await response.json();
            throw new Error(error.error);
          }
        } catch (err) {
          alert("Failed to close the room: " + err.message);
          this.disabled = false;
          this.textContent = "End Competition";
        }
      });
    const logout = document.getElementById("logout");
    logout.addEventListener("click", () => {
      if (!confirm("Are you sure you want to Sign out??")) return;
      localStorage.removeItem("authToken");
      this.location.reload();
    });
    //Checking if room ended or not
    const roomResponse = await fetch(`/api/rooms/${roomCode}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    });
    const room = await roomResponse.json();

    // Update UI based on room status
    if (room.status === "ended") {
      const uploadCard = document.getElementById("uploadCard");
      if (uploadCard) {
        uploadCard.querySelector(".upload-icon").innerHTML =
          '<i class="fa-solid fa-trophy"></i>';
        uploadCard.querySelector(".upload-text").textContent = "View Winners";
        uploadCard.addEventListener("click", () => {
          window.location.href = `/winners.html?roomCode=${roomCode}`;
        });
      }

      // Disable end competition button
      const endBtn = document.querySelector(".end-competition-btn");
      if (endBtn) {
        endBtn.disabled = true;
        endBtn.textContent = "Competition Ended";
        endBtn.style.background = "#95a5a6";
      }

      // Add ended badge to navbar
      const nav = document.getElementById("codeBar");
      if (nav) {
        const endedBadge = document.createElement("div");
        endedBadge.className = "ended-badge";
        endedBadge.textContent = "ENDED";
        nav.appendChild(endedBadge);
      }
    } else {
      // Set up upload button for active room
      const uploadCard = document.getElementById("uploadCard");
      if (uploadCard) {
        uploadCard.addEventListener("click", () => {
          window.location.href = `/upload.html?roomCode=${roomCode}`;
        });
      }
    }
  } catch (error) {
    //Show Error when error happens
    document.getElementById("artworksContainer").innerHTML = `
      <div class="error">
        <p>${error.message}</p>
        <a href="/">Return to home page</a>
      </div>
    `;
  }
});
async function loadArtworks(roomCode) {
  try {
    //Gets the artwork from the Server
    const response = await fetch(`/api/artwork/room/${roomCode}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch artworks");
    }
    //Saves the artwork from the server
    const artworks = await response.json();
    const profile = await loadProfile();
    if (profile) {
      localStorage.setItem("userId", profile._id);
    }
    //Render the artwork on the page
    displayArtworks(artworks);
  } catch (err) {
    alert("Failed to load artworks:", err);
    throw err;
  }
}
function displayArtworks(artworks) {
  const container = document.getElementById("artworksContainer");
  // Clear existing content but keep the upload card
  const uploadCard = document.getElementById("uploadCard");
  container.innerHTML = "";
  container.appendChild(uploadCard);

  if (artworks.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.innerHTML = `
      <p>No artworks yet. Be the first to upload!</p>
    `;
    container.appendChild(emptyState);
    return;
  }

  artworks.forEach((artwork) => {
    const card = document.createElement("div");
    card.className = "artwork-card";
    const user = JSON.parse(localStorage.getItem("user"));
    const isOwner = artwork.createdBy._id === user.id;

    card.innerHTML = `
      <img src="${artwork.imagePath}" alt="${
      artwork.description || "Artwork"
    }" class="artwork-image" />
      <div class="artwork-overlay">
              <p class="artwork-description">${
                artwork.description || "No description"
              }</p>
        <div class="artwork-author">
          <img src="${
            artwork.createdBy.profilePicture ||
            "/assets/imgs/default-profile.png"
          }" 
               alt="${artwork.createdBy.name}" class="author-avatar" />
          <span class="author-name">${artwork.createdBy.name}</span>
        </div>

        ${
          isOwner && artwork.room.status === "active"
            ? `
          <button class="delete-artwork-btn" data-id="${artwork._id}">
            <i class="fas fa-trash"></i>
          </button>
        `
            : ""
        }
      </div>
    `;

    card.addEventListener("click", (e) => {
      if (!e.target.closest(".delete-artwork-btn")) {
        window.location.href = `/voting.html?artworkId=${artwork._id}`;
      }
    });

    const deleteBtn = card.querySelector(".delete-artwork-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteArtwork(artwork._id);
      });
    }

    container.appendChild(card);
  });
}
async function deleteArtwork(artworkId) {
  if (!confirm("Are you sure you want to delete this artwork?")) return;

  try {
    const response = await fetch(`/api/artwork/${artworkId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    if (response.ok) {
      location.reload();
    }
  } catch (err) {
    console.error("Delete error:", err);
    alert("Failed to delete artwork");
  }
}
function setupCopyCode() {
  const copyBtn = document.querySelector(".copy-btn");
  const codeInput = document.getElementById("code");

  if (copyBtn && codeInput) {
    copyBtn.addEventListener("click", () => {
      codeInput.select();
      navigator.clipboard
        .writeText(codeInput.value)
        .then(() => {
          const originalText = copyBtn.innerHTML;
          copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';

          setTimeout(() => {
            copyBtn.innerHTML = originalText;
          }, 2000);
        })
        .catch((err) => {
          console.error("Failed to copy: ", err);
          alert("Failed to copy room code");
        });
    });
  }
}
async function loadProfile() {
  try {
    const response = await fetch("/api/users/profile", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    });
    if (!response.ok) throw new Error("Failed to load profile");
    return await response.json();
  } catch (error) {
    console.error("Profile load error:", error);
    return null;
  }
}
async function updateProfile() {
  const profile = await loadProfile();
  if (profile) {
    const profilePic = document.getElementById("profilePic");
    const username = document.getElementById("username");

    profilePic.src =
      profile.profilePicture || "/assets/imgs/default-profile.png";
    profilePic.alt = `${profile.name || "User"}`;
    username.textContent = `${profile.name || "User"}`;
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
