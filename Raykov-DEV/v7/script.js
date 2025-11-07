// Loader fade out
window.addEventListener("load", () => {
  const loader = document.querySelector(".loader");
  setTimeout(() => loader.style.opacity = "0", 2000);
  setTimeout(() => loader.style.display = "none", 2500);
});

// Scroll reveal
const reveals = document.querySelectorAll(".reveal");
window.addEventListener("scroll", () => {
  const trigger = window.innerHeight * 0.85;
  reveals.forEach(el => {
    const top = el.getBoundingClientRect().top;
    if (top < trigger) el.classList.add("active");
  });
});

// Mobile nav toggle
const menuBtn = document.querySelector(".menu-btn");
const navLinks = document.querySelector(".nav-links");
menuBtn.addEventListener("click", () => navLinks.classList.toggle("open"));

// Dynamic year
document.getElementById("year").textContent = new Date().getFullYear();
