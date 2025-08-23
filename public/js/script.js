if (window.location.pathname.includes("/register")) {
  document
    .getElementById("profilePicture")
    .addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
          const preview = document.getElementById("profilePreview");
          preview.src = event.target.result;
          preview.style.display = "block";
        };
        reader.readAsDataURL(file);
      }
    });
  document
    .getElementById("registerForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      resetErrors();

      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("pass").value.trim();
      const confirmPassword = document
        .getElementById("confirmPass")
        .value.trim();

      let isValid = true;

      if (name === "") {
        showError("nameError", "Name is required");
        document.getElementById("name").classList.add("input-error");
        isValid = false;
      } else if (name.length < 3) {
        showError("nameError", "Name must be at least 3 characters");
        document.getElementById("name").classList.add("input-error");
        isValid = false;
      }

      if (email === "") {
        showError("emailError", "Email is required");
        document.getElementById("email").classList.add("input-error");
        isValid = false;
      } else if (!isValidEmail(email)) {
        showError("emailError", "Please enter a valid email address");
        document.getElementById("email").classList.add("input-error");
        isValid = false;
      }

      if (password === "") {
        showError("passError", "Password is required");
        document.getElementById("pass").classList.add("input-error");
        isValid = false;
      } else if (password.length < 6) {
        showError("passError", "Password must be at least 6 characters");
        document.getElementById("pass").classList.add("input-error");
        isValid = false;
      }

      if (confirmPassword === "") {
        showError("confirmPassError", "Please confirm your password");
        document.getElementById("confirmPass").classList.add("input-error");
        isValid = false;
      } else if (password !== confirmPassword) {
        showError("confirmPassError", "Passwords do not match");
        document.getElementById("confirmPass").classList.add("input-error");
        isValid = false;
      }

      if (isValid) {
        const formData = new FormData(this);
        try {
          const response = await fetch("/api/users/register", {
            method: "POST",
            body: formData,
          });
          const data = await response.json();
          if (response.ok) {
            alert("Account created Successfully");
            window.location.replace("./login.html");
          } else {
            alert(`Error occured : ${JSON.stringify(data)}`);
          }
        } catch (err) {
          alert(err.message);
        }
      }
    });
}
if (window.location.pathname.includes("/login")) {
  document
    .getElementById("loginForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      resetErrors();

      const email = document.getElementById("email");
      const password = document.getElementById("pass");

      let isValid = true;

      if (email === "") {
        showError("emailError", "Email is required");
        document.getElementById("email").classList.add("input-error");
        isValid = false;
      } else if (!isValidEmail(email.value.trim())) {
        showError("emailError", "Please enter a valid email address");
        document.getElementById("email").classList.add("input-error");
        isValid = false;
      }

      if (password === "") {
        showError("passError", "Password is required");
        document.getElementById("pass").classList.add("input-error");
        isValid = false;
      } else if (password.length < 6) {
        showError("passError", "Password must be at least 6 characters");
        document.getElementById("pass").classList.add("input-error");
        isValid = false;
      }
      if (isValid) {
        try {
          const response = await fetch("/api/users/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: email.value.trim(),
              password: password.value,
            }),
          });
          const data = await response.json();

          if (response.ok) {
            alert("Signed in Successfully");
            localStorage.setItem("authToken", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            window.location.replace("./index.html");
          } else {
            alert("Wrong Email or password");
          }
        } catch (err) {
          alert(err.message);
        }
      }
    });
}
function showError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  errorElement.textContent = message;
}

function resetErrors() {
  document.querySelectorAll(".error").forEach((el) => {
    el.textContent = "";
  });

  document.querySelectorAll("input").forEach((el) => {
    el.classList.remove("input-error");
  });
}

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}
if (window.location.pathname.includes("/register")) {
  document.getElementById("name").addEventListener("input", function () {
    if (this.value.trim() !== "") {
      this.classList.remove("input-error");
      document.getElementById("nameError").textContent = "";
    }
  });
}
if (
  window.location.pathname.includes("/register") ||
  window.location.pathname.includes("/login")
) {
  document.getElementById("email").addEventListener("input", function () {
    if (this.value.trim() !== "" && isValidEmail(this.value.trim())) {
      this.classList.remove("input-error");
      document.getElementById("emailError").textContent = "";
    }
  });

  document.getElementById("pass").addEventListener("input", function () {
    if (this.value.trim() !== "" && this.value.trim().length >= 6) {
      this.classList.remove("input-error");
      document.getElementById("passError").textContent = "";
    }
  });
}
window.onscroll = function () {
  scrollFunction();
};

function scrollFunction() {
  if (window.location.pathname.includes("/Artworks")) {
    if (
      document.body.scrollTop > 20 ||
      document.documentElement.scrollTop > 20
    ) {
      document.getElementById("codeBar").style.top = "0";
    } else {
      document.getElementById("codeBar").style.top = "-50px";
    }
  }
}
