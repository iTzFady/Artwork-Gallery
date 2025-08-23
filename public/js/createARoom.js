document.addEventListener("DOMContentLoaded", async function () {
  const token = localStorage.getItem("authToken");
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) return;
  updateProfile();
  document
    .getElementById("createRoomBtn")
    .addEventListener("click", async function (e) {
      e.preventDefault();
      this.disabled = true;
      try {
        const response = await fetch("/api/rooms/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          alert("Room created Successfully");
          window.location.href = `/Artworks.html?code=${data.roomId}`;
        } else {
          alert("Error occured");
        }
      } catch (err) {
        alert(err.message);
      } finally {
        this.disabled = false;
      }
    });
  document
    .getElementById("roomForm")
    .addEventListener("submit", async function (e) {
      const roomcodeInput = document.getElementById("codeInput");
      const roomcode = roomcodeInput.value.trim();
      e.preventDefault();

      try {
        if (!roomcode || roomcode.value === "") {
          alert("Please enter room code");
          roomcodeInput.focus();
          return;
        }
        window.history.pushState({}, "", `?code=${roomcode.value}`);
        const response = await fetch(`/api/rooms/join/${roomcode}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error(await response.text());

        const data = await response.json();
        window.location.href = `/Artworks.html?code=${data.roomId}`;
      } catch (err) {
        alert(err.message);
        window.history.replaceState({}, "", window.location.pathname);
      }
    });
  const logout = document.getElementById("logout");
  logout.addEventListener("click", () => {
    if (!confirm("Are you sure you want to Sign out??")) return;
    localStorage.removeItem("authToken");
    this.location.reload();
  });
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
      profile.profilePicture || "/uploads/profile-pics/default-profile.png";
    profilePic.alt = `${profile.name || "User"}`;
    username.textContent = `Hello, ${profile.name || "User"}`;
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
