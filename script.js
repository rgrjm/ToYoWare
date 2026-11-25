// ---- Contact form (Netlify Forms) ----
const contactForm = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");

function setStatus(text, kind) {
  formStatus.textContent = text;
  formStatus.classList.remove("form-status--ok", "form-status--error");
  if (kind) formStatus.classList.add(`form-status--${kind}`);
}

if (contactForm && formStatus) {
  contactForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const data = new FormData(contactForm);
    const name = String(data.get("name") || "").trim();

    if (!name || !String(data.get("email") || "").trim() || !String(data.get("message") || "").trim()) {
      setStatus("Please fill in every field.", "error");
      return;
    }

    const button = contactForm.querySelector("button[type='submit']");
    if (button) button.disabled = true;
    setStatus("Sending…", null);

    try {
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(data).toString(),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      setStatus(`Thanks, ${name}! Your message was sent.`, "ok");
      contactForm.reset();
    } catch (err) {
      setStatus("Sorry, something went wrong. Please try again in a moment.", "error");
    } finally {
      if (button) button.disabled = false;
    }
  });
}

// ---- Highlight the nav link of the section currently in view ----
const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".navbar__links a");

if ("IntersectionObserver" in window && sections.length) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.getAttribute("id");
        navLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
        });
      });
    },
    { rootMargin: "-50% 0px -50% 0px" }
  );

  sections.forEach((section) => sectionObserver.observe(section));
}
