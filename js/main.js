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

// About-блок: кнопка play запускает/ставит на паузу видео, прячет
// оверлей затемнения и саму кнопку на время воспроизведения.
(function () {
  document.querySelectorAll(".about__play").forEach((btn) => {
    const wrap = btn.closest(".about__video");
    const video = wrap && wrap.querySelector(".about__video-media");
    if (!video) return;

    btn.addEventListener("click", () => {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    });

    video.addEventListener("play", () => wrap.classList.add("is-playing"));
    video.addEventListener("pause", () => wrap.classList.remove("is-playing"));
    video.addEventListener("ended", () => wrap.classList.remove("is-playing"));
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
