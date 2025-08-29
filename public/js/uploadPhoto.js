document.addEventListener("DOMContentLoaded", async function () {
  const urlParams = new URLSearchParams(window.location.search);
  const roomCode = urlParams.get("roomCode");
  if (roomCode) {
    document.getElementById(
      "roomCodeDisplay"
    ).textContent = `Room: ${roomCode}`;
  }
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) return;

  const fileInput = document.getElementById("fileInput");
  const uploadBtn = document.getElementById("uploadPhotoBtn");
  const preview = document.getElementById("preview");
  const btnText = document.querySelector(".btn-text");
  const btnIcon = document.querySelector("#uploadPhotoBtn i");

  uploadBtn.addEventListener("click", function () {
    fileInput.click();
  });
  uploadBtn.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadBtn.classList.add("dragover");
  });

  uploadBtn.addEventListener("dragleave", () => {
    uploadBtn.classList.remove("dragover");
  });

  uploadBtn.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadBtn.classList.remove("dragover");
    if (e.dataTransfer.files.length) {
      fileInput.files = e.dataTransfer.files;
      const event = new Event("change");
      fileInput.dispatchEvent(event);
    }
  });
  fileInput.addEventListener("change", function (e) {
    if (this.files && this.files[0]) {
      handleFileSelection(this.files[0]);
    }
  });

  function handleFileSelection(file) {
    const reader = new FileReader();

    reader.onload = function (e) {
      preview.src = e.target.result;
      preview.classList.add("visible");

      btnText.style.display = "none";
      btnIcon.style.display = "none";

      let clearBtn = document.querySelector(".clear-preview");
      if (!clearBtn) {
        clearBtn = document.createElement("button");
        clearBtn.textContent = "×";
        clearBtn.classList.add("clear-preview");
        clearBtn.id = "clear-preview-btn";
        clearBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          resetFileInput();
        });
        uploadBtn.appendChild(clearBtn);
      }
    };

    reader.readAsDataURL(file);
  }

  function resetFileInput() {
    fileInput.value = "";
    preview.src = "";
    preview.classList.remove("visible");

    btnText.style.display = "block";
    btnIcon.style.display = "block";

    const clearBtn = document.querySelector(".clear-preview");
    if (clearBtn) {
      clearBtn.remove();
    }
  }

  document
    .getElementById("submitBtn")
    .addEventListener("click", async function (e) {
      if (!fileInput.files[0]) {
        alert("Please select a photo first");
        return;
      }

      const submitBtn = document.getElementById("submitBtn");
      submitBtn.disabled = true;
      submitBtn.textContent = "Uploading...";

      const formData = new FormData();
      formData.append("image", fileInput.files[0]);
      formData.append(
        "description",
        document.getElementById("description").value
      );
      formData.append("roomId", roomCode);

      try {
        const response = await fetch("/api/artwork/upload", {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          window.location.href = `/Artworks.html?code=${roomCode}`;
          return;
        } else {
          const error = await response.json();
          throw new Error(error.error || "Upload failed");
        }
      } catch (error) {
        console.error("Upload error:", error);
        alert(`Error: ${error.message}`);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Upload Photo";
      }
    });
});

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
