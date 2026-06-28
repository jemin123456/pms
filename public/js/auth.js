import { apiFetch, setAccessToken, setActiveTenantId } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const alertContainer = document.getElementById("alert-container");

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("expired") === "true") {
    showAlert("Your session has expired. Please sign in again.", "danger");
  }

  function showAlert(message, type = "danger") {
    if (!alertContainer) return;
    alertContainer.textContent = message;
    alertContainer.className = `alert alert-${type}`;
    alertContainer.style.display = "block";
    alertContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function hideAlert() {
    if (!alertContainer) return;
    alertContainer.style.display = "none";
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // --- Registration Tabs Switcher & UI Toggle ---
  if (registerForm) {
    const tabCompany = document.getElementById("tab-company");
    const tabEmployee = document.getElementById("tab-employee"); // Element ID matches "Register User" tab
    const registrationType = document.getElementById("registrationType");
    const companyNameGroup = document.getElementById("company-name-group");
    const companySlugGroup = document.getElementById("company-slug-group");
    const sectionTitleDetails = document.getElementById(
      "section-title-details",
    );
    const submitBtn = document.getElementById("submit-btn");

    tabCompany.addEventListener("click", () => {
      registrationType.value = "company";

      // Update Tab Styles
      tabCompany.className = "btn btn-primary";
      tabCompany.style.background = "";
      tabEmployee.className = "btn btn-secondary";
      tabEmployee.style.background = "transparent";

      // Show/Hide Fields
      companyNameGroup.style.display = "block";
      companySlugGroup.style.display = "block";
      sectionTitleDetails.style.display = "block";
      sectionTitleDetails.textContent = "Company Details";
      submitBtn.textContent = "Register Workspace";

      hideAlert();
    });

    tabEmployee.addEventListener("click", () => {
      registrationType.value = "user"; // Type user

      // Update Tab Styles
      tabEmployee.className = "btn btn-primary";
      tabEmployee.style.background = "";
      tabCompany.className = "btn btn-secondary";
      tabCompany.style.background = "transparent";

      // Show/Hide Fields
      companyNameGroup.style.display = "none";
      companySlugGroup.style.display = "none";
      sectionTitleDetails.style.display = "none";
      submitBtn.textContent = "Register Account";

      hideAlert();
    });

    // --- Real-time input handling ---
    const tenantNameInput = document.getElementById("tenantName");
    const tenantSlugInput = document.getElementById("tenantSlug");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const strengthBar = document.getElementById("strength-bar");
    const strengthText = document.getElementById("strength-text");

    tenantNameInput.addEventListener("input", (e) => {
      if (registrationType.value !== "company") return;
      const name = e.target.value;
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      tenantSlugInput.value = slug;
      validateField(tenantSlugInput, slug.length > 0);
      validateField(tenantNameInput, name.trim().length > 0);
    });

    tenantSlugInput.addEventListener("input", (e) => {
      let slug = e.target.value;
      slug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
      e.target.value = slug;
      validateField(tenantSlugInput, slug.length > 0);
    });

    const emailInput = document.getElementById("email");
    emailInput.addEventListener("input", (e) => {
      validateField(emailInput, validateEmail(e.target.value));
    });

    const nameInput = document.getElementById("name");
    nameInput.addEventListener("input", (e) => {
      validateField(nameInput, e.target.value.trim().length > 0);
    });

    passwordInput.addEventListener("input", (e) => {
      const password = e.target.value;
      let strength = 0;
      let status = "Weak";
      let color = "var(--danger-color)";

      if (password.length >= 6) strength++;
      if (password.length >= 10) strength++;
      if (/[A-Z]/.test(password)) strength++;
      if (/[0-9]/.test(password)) strength++;
      if (/[^A-Za-z0-9]/.test(password)) strength++;

      const pct = (strength / 5) * 100;
      strengthBar.style.width = `${pct}%`;

      if (strength <= 1) {
        status = "Weak (Needs length/variety)";
        color = "var(--danger-color)";
      } else if (strength <= 3) {
        status = "Medium";
        color = "var(--warning-color)";
      } else {
        status = "Strong";
        color = "var(--success-color)";
      }

      strengthBar.style.backgroundColor = color;
      strengthText.textContent = `Password Strength: ${status}`;
      strengthText.style.color = color;

      validateField(passwordInput, password.length >= 6);

      if (confirmPasswordInput.value) {
        validateField(
          confirmPasswordInput,
          password === confirmPasswordInput.value,
        );
      }
    });

    confirmPasswordInput.addEventListener("input", (e) => {
      validateField(
        confirmPasswordInput,
        passwordInput.value === e.target.value,
      );
    });

    function validateField(inputElement, isValid) {
      if (isValid) {
        inputElement.classList.remove("is-invalid");
        inputElement.classList.add("is-valid");
      } else {
        inputElement.classList.remove("is-valid");
        inputElement.classList.add("is-invalid");
      }
    }
  }

  // --- Registration Form Submit ---
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideAlert();

      const type = document.getElementById("registrationType").value;
      const tenantName = document.getElementById("tenantName").value.trim();
      const tenantSlug = document.getElementById("tenantSlug").value.trim();
      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      let isValid = true;

      if (type === "company") {
        if (!tenantName) {
          document.getElementById("tenantName").classList.add("is-invalid");
          isValid = false;
        }
        if (!tenantSlug) {
          document.getElementById("tenantSlug").classList.add("is-invalid");
          isValid = false;
        }
      }

      if (!name) {
        document.getElementById("name").classList.add("is-invalid");
        isValid = false;
      }
      if (!email || !validateEmail(email)) {
        document.getElementById("email").classList.add("is-invalid");
        isValid = false;
      }
      if (password.length < 6) {
        document.getElementById("password").classList.add("is-invalid");
        isValid = false;
      }
      if (password !== confirmPassword) {
        document.getElementById("confirmPassword").classList.add("is-invalid");
        isValid = false;
      }

      if (!isValid) {
        showAlert("Please correct the validation errors in the form.");
        return;
      }

      const bodyPayload = {
        type,
        name,
        email,
        password,
      };

      if (type === "company") {
        bodyPayload.tenantName = tenantName;
        bodyPayload.tenantSlug = tenantSlug;
      }

      try {
        const response = await apiFetch("/api/auth/register", {
          method: "POST",
          body: bodyPayload,
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setAccessToken(data.accessToken);
          localStorage.setItem("user", JSON.stringify(data.user));

          if (data.user.memberships && data.user.memberships.length > 0) {
            const firstTenant = data.user.memberships[0].tenantId;
            setActiveTenantId(firstTenant._id || firstTenant);
          } else {
            setActiveTenantId(null);
          }

          window.location.href = "/index.html";
        } else {
          showAlert(data.message || "Registration failed. Please try again.");
        }
      } catch (error) {
        console.error("Registration API Error:", error);
        showAlert("Network error. Unable to connect to server.");
      }
    });
  }

  // --- Login Form Submit ---
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideAlert();

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      let isValid = true;
      if (!email || !validateEmail(email)) {
        document.getElementById("email").classList.add("is-invalid");
        isValid = false;
      } else {
        document.getElementById("email").classList.remove("is-invalid");
      }

      if (!password) {
        document.getElementById("password").classList.add("is-invalid");
        isValid = false;
      } else {
        document.getElementById("password").classList.remove("is-invalid");
      }

      if (!isValid) return;

      try {
        const response = await apiFetch("/api/auth/login", {
          method: "POST",
          body: { email, password },
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setAccessToken(data.accessToken);
          localStorage.setItem("user", JSON.stringify(data.user));

          if (data.user.memberships && data.user.memberships.length > 0) {
            const firstTenant = data.user.memberships[0].tenantId;
            setActiveTenantId(firstTenant._id || firstTenant);
          } else {
            setActiveTenantId(null);
          }

          window.location.href = "/index.html";
        } else {
          showAlert(data.message || "Invalid email or password.");
        }
      } catch (error) {
        console.error("Login API Error:", error);
        showAlert("Network error. Unable to connect to server.");
      }
    });
  }
});
