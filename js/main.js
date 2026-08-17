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

// Айтем-грид: общий поповер (.start__popover) на все занятые ячейки.
// position:absolute + координаты с поправкой на скролл (а не position:fixed)
// — если длинная карточка не помещается в экран, она просто уходит за его
// пределы, к ней докручивают страницей, а не крутят скролл внутри самого
// поповера. Сторона (сверху/снизу от ячейки) выбирается по тому, где
// целиком помещается поповер; если не помещается целиком ни там, ни там —
// берётся сторона с большим запасом места. На устройствах с ховером —
// курсор может перейти с ячейки на сам поповер (выделить текст, нажать
// "Подробнее") без того, чтобы поповер спрятался: скрытие откладывается на
// 150мс и отменяется, если курсор зашёл на ячейку/поповер за это время.
// Между ячейкой и поповером сознательно есть зазор (EDGE_GAP) — курсор по
// пути к поповеру часто задевает соседнюю ячейку в сетке. Чтобы это не
// перещёлкивало поповер на соседа, показ тоже отложен (SHOW_DELAY): если
// курсор ушёл с ячейки раньше, чем показ успел сработать, ячейка просто
// не успевает "перехватить" поповер, и он спокойно долетает до цели. На
// тач — тап по ячейке (повторный тап по той же ячейке или тап вне грида
// закрывает).
(function () {
  const cells = document.querySelectorAll(".start__cell--filled");
  const popover = document.getElementById("startPopover");
  if (!cells.length || !popover) return;

  const EDGE_GAP = 8;
  const SHOW_DELAY = 120;
  const HIDE_DELAY = 150;
  let hideTimer = null;
  let showTimer = null;

  function positionPopover(cell) {
    const cellRect = cell.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();

    const spaceAbove = cellRect.top;
    const spaceBelow = window.innerHeight - cellRect.bottom;
    const fitsAbove = spaceAbove >= popoverRect.height + EDGE_GAP;
    const fitsBelow = spaceBelow >= popoverRect.height + EDGE_GAP;
    const placeBelow = fitsBelow || (!fitsAbove && spaceBelow > spaceAbove);

    let left = cellRect.left + cellRect.width / 2 - popoverRect.width / 2;
    left = Math.max(EDGE_GAP, Math.min(left, window.innerWidth - popoverRect.width - EDGE_GAP));

    const top = placeBelow
      ? cellRect.bottom + EDGE_GAP
      : Math.max(EDGE_GAP, cellRect.top - EDGE_GAP - popoverRect.height);

    popover.style.left = `${left + window.scrollX}px`;
    popover.style.top = `${top + window.scrollY}px`;
  }

  function showPopover(cell) {
    positionPopover(cell);
    popover.classList.add("start__popover--visible");
  }

  function hidePopover() {
    popover.classList.remove("start__popover--visible");
  }

  function cancelHide() {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  }

  function scheduleHide() {
    cancelHide();
    hideTimer = setTimeout(hidePopover, HIDE_DELAY);
  }

  function cancelShow() {
    if (showTimer) {
      clearTimeout(showTimer);
      showTimer = null;
    }
  }

  function scheduleShow(cell) {
    cancelShow();
    showTimer = setTimeout(() => showPopover(cell), SHOW_DELAY);
  }

  if (window.matchMedia("(hover: hover)").matches) {
    cells.forEach((cell) => {
      cell.addEventListener("mouseenter", () => {
        cancelHide();
        scheduleShow(cell);
      });
      cell.addEventListener("mouseleave", () => {
        cancelShow();
        scheduleHide();
      });
    });

    popover.addEventListener("mouseenter", cancelHide);
    popover.addEventListener("mouseleave", scheduleHide);
  } else {
    cells.forEach((cell) => {
      cell.addEventListener("click", (e) => {
        const wasActive = cell.classList.contains("is-active");
        cells.forEach((c) => c.classList.remove("is-active"));
        hidePopover();
        if (!wasActive) {
          cell.classList.add("is-active");
          showPopover(cell);
          e.stopPropagation();
        }
      });
    });

    popover.addEventListener("click", (e) => e.stopPropagation());

    document.addEventListener("click", () => {
      cells.forEach((c) => c.classList.remove("is-active"));
      hidePopover();
    });
  }
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

// Футер: 4-я колонка ("Ignis chat", .footer__item--default) активна по
// умолчанию. На устройствах с ховером — ховер над любой колонкой делает
// активной её, снимая подсветку с остальных; при уходе курсора со всего
// списка активность возвращается на 4-ю. На тач-устройствах (нет hover)
// слушатели не вешаем — 4-я остаётся активной всегда, стили для этого уже
// в CSS (.footer__item--default на Mobile).
(function () {
  const list = document.querySelector(".footer__list");
  if (!list) return;

  const items = list.querySelectorAll(".footer__item");
  const defaultItem = list.querySelector(".footer__item--default");
  if (!defaultItem) return;

  defaultItem.classList.add("footer__item--active");

  if (!window.matchMedia("(hover: hover)").matches) return;

  items.forEach((item) => {
    item.addEventListener("mouseenter", () => {
      items.forEach((i) => i.classList.remove("footer__item--active"));
      item.classList.add("footer__item--active");
    });
  });

  list.addEventListener("mouseleave", () => {
    items.forEach((i) => i.classList.remove("footer__item--active"));
    defaultItem.classList.add("footer__item--active");
  });
})();
