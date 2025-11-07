// Loader fade-out
window.addEventListener("load", () => {
  const loader = document.querySelector(".loader");
  setTimeout(() => loader.style.opacity = "0", 500);
  setTimeout(() => loader.style.display = "none", 900);
});

// Reveal on scroll
const reveals = document.querySelectorAll(".reveal");
window.addEventListener("scroll", () => {
  const trigger = window.innerHeight * 0.85;
  reveals.forEach(el => {
    const top = el.getBoundingClientRect().top;
    if (top < trigger) el.classList.add("active");
  });
});

// Mobile nav
const menuBtn = document.querySelector(".menu-btn");
const navList = document.querySelector(".nav-list");
menuBtn.addEventListener("click", () => navList.classList.toggle("open"));

// Dynamic year
document.getElementById("year").textContent = new Date().getFullYear();

// Parallax hero
const heroBg = document.querySelector(".hero-bg");
window.addEventListener("scroll", () => {
  if (!heroBg) return;
  const offset = window.scrollY * 0.4;
  heroBg.style.transform = `translateY(${offset}px)`;
});
