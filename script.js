const textToType = "echo 'let's build something great'";

const typedTextEl = document.getElementById("typed-text");

let charIndex = 0;

function typeNextChar() {
  if (charIndex < textToType.length) {
    typedTextEl.textContent += textToType.charAt(charIndex);
    charIndex++;

    const delay = 40 + Math.random() * 50;
    setTimeout(typeNextChar, delay);
  }
}

typeNextChar();

const contactForm = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");

contactForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const message = document.getElementById("message").value.trim();

  if (!name || !email || !message) {
    formStatus.textContent = "Please fill in every field.";
    formStatus.style.color = "#ff7b72";
    return;
  }

  formStatus.textContent = `Thanks, ${name}! Your message has been noted (demo only — not actually sent).`;
  formStatus.style.color = "#7ee787";

  contactForm.reset();
});

const sections = document.querySelectorAll("section[id]");

const navLinks = document.querySelectorAll(".navbar__links a");

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute("id");
        navLinks.forEach((link) => {
          link.style.color = link.getAttribute("href") === `#${id}` ? "#7ee787" : "";
        });
      }
    });
  },
  { rootMargin: "-50% 0px -50% 0px" }
);

sections.forEach((section) => sectionObserver.observe(section));
