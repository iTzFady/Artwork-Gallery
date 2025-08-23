document.addEventListener("DOMContentLoaded", async function () {
  const stars = document.querySelectorAll(".ratingstars i");
  const ratingForm = document.getElementById("ratingForm");
  let selectedRating = 0;
  const urlParams = new URLSearchParams(window.location.search);
  const ratingValue = document.getElementById("selected-rating");
  const artworkId = urlParams.get("artworkId");
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) return;
  updateProfile();
  ratingForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (selectedRating === 0) {
      alert("Please select a rating before submitting");
      return;
    }
    const review = document.getElementById("opinion").value;

    try {
      const response = await fetch(`/api/artwork/${artworkId}/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          rating: selectedRating,
          review: review,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.code === "SELF_VOTE_NOT_ALLOWED") {
          alert("You can't vote on your own artwork!");
        } else {
          alert(data.error || "Vote failed");
        }
        return;
      }
      alert(`Thank you for your ${selectedRating}-star rating!`);
      await loadReviews(artworkId);
      ratingForm.reset();
      selectedRating = 0;
      ratingValue.textContent = "0";
      highlightStars(0);
    } catch (error) {
      alert(error);
    }
  });

  stars.forEach((star) => {
    star.addEventListener("mouseover", function () {
      const rating = parseInt(this.getAttribute("data-rating"));
      highlightStars(rating);
    });

    star.addEventListener("mouseout", function () {
      highlightStars(selectedRating);
    });

    star.addEventListener("click", function () {
      selectedRating = parseInt(this.getAttribute("data-rating"));
      ratingValue.textContent = selectedRating;
      highlightStars(selectedRating);
    });
  });

  function highlightStars(count) {
    stars.forEach((star) => {
      const starRating = parseInt(star.getAttribute("data-rating"));

      star.classList.remove("active", "hover");

      if (starRating <= count) {
        star.classList.add("hover");
      }

      if (starRating <= selectedRating) {
        star.classList.add("active");
      }
    });
  }
  try {
    if (!artworkId) {
      throw new Error("No artwork specified");
    }
    const response = await fetch(`/api/artwork/${artworkId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to load artwork");
    }
    const artwork = await response.json();

    const voteForm = document.getElementById("ratingForm");
    if (artwork.room.status === "ended") {
      if (voteForm) voteForm.style.display = "none";
    }

    document.getElementById("votedImage").src = artwork.imagePath;
    document.getElementById("photoDescription").textContent =
      artwork.description || "";

    await loadReviews(artworkId);
  } catch (err) {
    alert(err.message);
  }
  async function loadReviews(artworkId) {
    try {
      const response = await fetch(`api/artwork/${artworkId}/reviews`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to load reviews");
      }
      const reviews = await response.json();
      displayReviews(reviews);
    } catch (err) {
      alert(err.message);
    }
  }
  function displayReviews(reviews) {
    const reviewsList = document.getElementById("reviewsList");

    if (!reviews || reviews.length === 0) {
      reviewsList.innerHTML =
        '<p class="no-reviews">No reviews yet. Be the first to review!</p>';
      return;
    }

    reviewsList.innerHTML = "";

    reviews.forEach((review) => {
      const reviewItem = document.createElement("div");
      reviewItem.className = "review-item";

      reviewItem.innerHTML = `
        <div class="review-header">
          <span class="review-user"> ${review.user.name || "Anonymous"}</span>
          <span class="review-rating">${"★".repeat(review.rating)}${"☆".repeat(
        5 - review.rating
      )}</span>
        </div>
        <div class="review-date">${new Date(
          review.date
        ).toLocaleDateString()}</div>
        <div class="review-text">${review.review || "No comment provided"}</div>
      `;

      reviewsList.appendChild(reviewItem);
    });
  }
});

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
