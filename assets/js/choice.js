document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".choice-btn");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-target");
      window.location.href = target;
    });
  });
});