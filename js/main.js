// Death Knight landing — общий скрипт.

// 100vw в CSS включает ширину вертикального скроллбара, из-за чего
// расчёты вида calc(32px - ...vw...) съезжают от реального края экрана
// на ширину скроллбара (~15-17px). Меряем реальную ширину через JS и
// прокидываем в CSS-переменную — используется вместо 100vw там, где
// нужен точный отступ от края (см. --vw100 в style.css).
(function () {
  function setRealVw() {
    document.documentElement.style.setProperty("--vw100", `${document.documentElement.clientWidth}px`);
  }
  setRealVw();
  window.addEventListener("resize", setRealVw);
})();

// Redline-группа (красная линия + бейдж даты) и персонаж слегка следуют
// за курсором по горизонтали — небольшой параллакс, персонаж двигается
// в противоположную сторону от redline. Диапазон движения ограничен.
(function () {
  const group = document.getElementById("redlineGroup");
  const artwork = document.getElementById("heroArtwork");
  if (!group && !artwork) return;

  const MAX_OFFSET = 12; // px, насколько далеко может сдвинуться группа

  window.addEventListener("mousemove", (e) => {
    const ratio = e.clientX / window.innerWidth; // 0..1
    const offset = (ratio - 0.5) * 2 * MAX_OFFSET; // -MAX_OFFSET..MAX_OFFSET
    if (group) group.style.setProperty("--parallax-x", `${offset.toFixed(1)}px`);
    if (artwork) artwork.style.setProperty("--parallax-x-char", `${(-offset).toFixed(1)}px`);
  });
})();

// Film-grain шум на весь сайт: раз в 100мс дёргаем background-position
// зерно-тайла на случайную позицию — дёшево (просто смена одного CSS-
// свойства, без canvas/перерисовки), даёт эффект "живого" зерна/VHS без
// резких прыжков всего экрана. Плавно проявляется после загрузки.
// При prefers-reduced-motion — просто статичное зерно, без мерцания.
(function () {
  const noise = document.getElementById("noiseOverlay");
  if (!noise) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  window.addEventListener("load", () => {
    noise.classList.add("noise-overlay--visible");
  });

  if (!reduceMotion) {
    setInterval(() => {
      const x = Math.floor(Math.random() * 100);
      const y = Math.floor(Math.random() * 100);
      noise.style.backgroundPosition = `${x}% ${y}%`;
    }, 100);
  }
})();

// Айтем-грид: на тач-устройствах (Mobile/Tablet) нет :hover — тултип по
// тапу вместо этого (класс .is-active, та же CSS-стилизация, что у
// :hover). Повторный тап по той же ячейке или тап вне грида — закрывает.
(function () {
  const cells = document.querySelectorAll(".start__cell--filled");
  if (!cells.length) return;

  cells.forEach((cell) => {
    cell.addEventListener("click", (e) => {
      const wasActive = cell.classList.contains("is-active");
      cells.forEach((c) => c.classList.remove("is-active"));
      if (!wasActive) {
        cell.classList.add("is-active");
        e.stopPropagation();
      }
    });
  });

  document.addEventListener("click", () => {
    cells.forEach((c) => c.classList.remove("is-active"));
  });
})();

// Форма регистрации: глазик переключает type инпута password/text у
// соседнего поля, чекбоксы — нативные (appearance:none, стилизация в CSS).
// Красная обводка (--error) вешается по месту, на конкретный невалидный
// инпут, при попытке сабмита, и снимается, как только начали печатать —
// бэкенда нет, поэтому дальше сабмита форма никуда не уходит.
(function () {
  document.querySelectorAll(".registration__eye").forEach((btn) => {
    const input = btn.closest(".registration__password").querySelector(".registration__input");
    btn.addEventListener("click", () => {
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      btn.classList.toggle("registration__eye--active", isPassword);
      btn.setAttribute("aria-label", isPassword ? "Скрыть пароль" : "Показать пароль");
    });
  });

  document.querySelectorAll(".registration__form").forEach((form) => {
    const inputs = form.querySelectorAll(".registration__input");

    inputs.forEach((input) => {
      input.addEventListener("input", () => {
        input.classList.remove("registration__input--error");
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      inputs.forEach((input) => {
        input.classList.toggle("registration__input--error", !input.checkValidity());
      });
    });
  });
})();
