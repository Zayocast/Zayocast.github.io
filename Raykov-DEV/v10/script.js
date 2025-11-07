// Loader hide
window.addEventListener('load', () => {
  const loader = document.querySelector('.loader');
  if (!loader) return;

  setTimeout(() => {
    loader.classList.add('loader--hidden');
  }, 800);
});

// Dynamic year
document.addEventListener('DOMContentLoaded', () => {
  const yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
});

// Cube navigation
document.addEventListener('DOMContentLoaded', () => {
  const cube = document.querySelector('.cube');
  const dockItems = document.querySelectorAll('.dock-item');

  if (!cube || !dockItems.length) return;

  const faceRotation = {
    about: { x: 0, y: 0 },
    projects: { x: 0, y: -90 },
    stack: { x: 0, y: 180 },
    lab: { x: 0, y: 90 },
    contact: { x: -90, y: 0 }
  };

  const isMobile = () => window.matchMedia('(max-width: 900px)').matches;

  const setActiveFace = (face) => {
    if (!faceRotation[face]) return;

    // UI state
    dockItems.forEach(btn =>
      btn.classList.toggle('dock-item--active', btn.dataset.face === face)
    );

    if (isMobile()) {
      // На мобилe не въртим куба, просто скролваме до съответната секция
      const target = document.getElementById(face);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    const { x, y } = faceRotation[face];
    cube.style.transform = `rotateX(${x}deg) rotateY(${y}deg)`;
    cube.dataset.activeFace = face;
  };

  dockItems.forEach(btn => {
    btn.addEventListener('click', () => {
      const face = btn.dataset.face;
      setActiveFace(face);
    });
  });

  // При resize – ако излизаме от мобилен към десктоп, върни куба към активното лице
  window.addEventListener('resize', () => {
    const activeFace = cube.dataset.activeFace || 'about';
    if (!isMobile()) {
      const { x, y } = faceRotation[activeFace];
      cube.style.transform = `rotateX(${x}deg) rotateY(${y}deg)`;
    }
  });

  // Init
  setActiveFace('about');
});
