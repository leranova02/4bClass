/* =====================================================================
   ОБЩАЯ ЛОГИКА САЙТА 4 «Б» КЛАССА
   ---------------------------------------------------------------------
   Один файл подключается на всех страницах. Каждая функция сама
   проверяет, есть ли на текущей странице нужный элемент — если его
   нет, функция просто ничего не делает. Поэтому файл безопасно
   подключать везде одинаково.

   Данные (расписание, ДЗ, новости и т.д.) берутся из js/data.js —
   этот файл должен подключаться в HTML ПЕРЕД script.js.
   ===================================================================== */

// ИСПРАВЛЕНИЕ БАГА: js/data.js объявляет данные через "const classData = {...}".
// В браузере такое объявление доступно во всех подключённых после него скриптах
// как обычная переменная, но НЕ становится свойством объекта window. Ниже мы
// явно кладём classData в window, чтобы все проверки вида "window.classData"
// ниже по файлу отрабатывали корректно и страницы переставали "зависать"
// на надписи «Загрузка…».
if (typeof classData !== "undefined") {
  window.classData = classData;
}

document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  setFooterYear();
  renderTodayNews();       // index.html
  renderQuickLinksExtra();  // на случай доп. логики главной (сейчас не используется)
  renderSchedule();         // schedule.html
  renderHolidays();         // schedule.html
  initHomeworkPage();       // homework.html
  initPhotoGallery();       // photos.html
  renderEvents();           // events.html
  renderNews();             // news.html
  renderContacts();         // contacts.html
});

/* ---------------------------------------------------------------------
   1. МОБИЛЬНОЕ МЕНЮ (гамбургер)
   --------------------------------------------------------------------- */
function initMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  // Закрываем меню при клике на ссылку (удобно на телефоне)
  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* ---------------------------------------------------------------------
   2. ГОД В ПОДВАЛЕ САЙТА (чтобы не менять руками каждый год)
   --------------------------------------------------------------------- */
function setFooterYear() {
  const el = document.getElementById("footer-year");
  if (!el) return;
  el.textContent = new Date().getFullYear();
}

/* ---------------------------------------------------------------------
   3. ГЛАВНАЯ СТРАНИЦА: «НОВОСТЬ ДНЯ»
   Берём первую (самую свежую) новость из classData.news
   --------------------------------------------------------------------- */
function renderTodayNews() {
  const container = document.getElementById("today-news");
  if (!container || !window.classData) return;

  const latest = classData.news[0];
  if (!latest) return;

  container.innerHTML = `
    <span class="note-label">📌 Новость дня — ${latest.date}</span>
    <h3>${latest.title}</h3>
    <p>${latest.text}</p>
  `;
}

// Заглушка на будущее (например, если понадобится динамически считать
// количество новых ДЗ или мероприятий на плитках главной страницы)
function renderQuickLinksExtra() {
  return;
}

/* ---------------------------------------------------------------------
   4. СТРАНИЦА РАСПИСАНИЯ: ТАБЛИЦЫ ПО ДНЯМ НЕДЕЛИ
   --------------------------------------------------------------------- */
function renderSchedule() {
  const container = document.getElementById("schedule-container");
  if (!container || !window.classData) return;

  let html = "";

  for (const day in classData.schedule) {
    const lessons = classData.schedule[day];

    let rows = lessons
      .map(
        (lesson) => `
        <tr>
          <td><span class="lesson-number">${lesson.number}</span></td>
          <td>${lesson.subject}</td>
          <td>Кабинет ${lesson.room}</td>
        </tr>`
      )
      .join("");

    html += `
      <div class="table-wrap">
        <table class="schedule-table">
          <caption>${day}</caption>
          <thead>
            <tr>
              <th>Урок</th>
              <th>Предмет</th>
              <th>Кабинет</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  container.innerHTML = html;
}

/* ---------------------------------------------------------------------
   5. СТРАНИЦА РАСПИСАНИЯ: КАНИКУЛЫ / ВАЖНЫЕ ДАТЫ
   --------------------------------------------------------------------- */
function renderHolidays() {
  const container = document.getElementById("holidays-container");
  if (!container || !window.classData) return;

  container.innerHTML = classData.holidays
    .map(
      (h) => `
      <li class="holiday-item">
        <span class="holiday-dates">${h.dates}</span>
        ${h.title}
      </li>`
    )
    .join("");
}

/* ---------------------------------------------------------------------
   6. СТРАНИЦА ДОМАШНЕГО ЗАДАНИЯ: ВКЛАДКИ ПО ДНЯМ + КАРТОЧКИ
   --------------------------------------------------------------------- */
function initHomeworkPage() {
  const tabsContainer = document.getElementById("day-tabs");
  const grid = document.getElementById("homework-grid");
  if (!tabsContainer || !grid || !window.classData) return;

  // Собираем уникальный список дней недели в порядке появления в данных
  const days = ["Все"];
  classData.homework.forEach((item) => {
    if (!days.includes(item.day)) days.push(item.day);
  });

  // Рисуем кнопки-вкладки
  tabsContainer.innerHTML = days
    .map(
      (day, index) =>
        `<button class="day-tab${index === 0 ? " active" : ""}" data-day="${day}">${day}</button>`
    )
    .join("");

  // Функция отрисовки карточек ДЗ по выбранному дню
  function renderHomeworkList(selectedDay) {
    const items =
      selectedDay === "Все"
        ? classData.homework
        : classData.homework.filter((item) => item.day === selectedDay);

    if (items.length === 0) {
      grid.innerHTML = `<div class="empty-state">На этот день заданий пока нет.</div>`;
      return;
    }

    grid.innerHTML = items
      .map(
        (item) => `
        <div class="homework-card">
          <h3>${item.subject}</h3>
          <span class="hw-day">${item.day}</span>
          <p>${item.text}</p>
          <div class="hw-updated">Обновлено: ${item.updated}</div>
        </div>`
      )
      .join("");
  }

  // Клик по вкладке — переключаем активную и перерисовываем список
  tabsContainer.addEventListener("click", (e) => {
    const btn = e.target.closest(".day-tab");
    if (!btn) return;

    tabsContainer
      .querySelectorAll(".day-tab")
      .forEach((t) => t.classList.remove("active"));
    btn.classList.add("active");

    renderHomeworkList(btn.dataset.day);
  });

  // Первая отрисовка — показываем всё
  renderHomeworkList("Все");
}

/* ---------------------------------------------------------------------
   7. СТРАНИЦА ФОТОГАЛЕРЕИ: СЕТКА + ЛАЙТБОКС
   --------------------------------------------------------------------- */
function initPhotoGallery() {
  const grid = document.getElementById("photo-grid");
  const lightbox = document.getElementById("lightbox");
  if (!grid || !lightbox || !window.classData) return;

  const photos = classData.photos;
  let currentIndex = 0;

  // Рисуем миниатюры
  grid.innerHTML = photos
    .map(
      (photo, index) => `
      <button class="photo-thumb" data-index="${index}" aria-label="Открыть фото: ${photo.caption}">
        <img src="${photo.src}" alt="${photo.alt}" loading="lazy">
        <span class="photo-caption">${photo.caption}</span>
      </button>`
    )
    .join("");

  const lightboxImg = lightbox.querySelector(".lightbox-img");
  const lightboxCaption = lightbox.querySelector(".lightbox-caption");

  function openLightbox(index) {
    currentIndex = index;
    updateLightboxImage();
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden"; // не даём странице скроллиться под лайтбоксом
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    document.body.style.overflow = "";
  }

  function updateLightboxImage() {
    const photo = photos[currentIndex];
    lightboxImg.src = photo.src;
    lightboxImg.alt = photo.alt;
    lightboxCaption.textContent = photo.caption;
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % photos.length;
    updateLightboxImage();
  }

  function showPrev() {
    currentIndex = (currentIndex - 1 + photos.length) % photos.length;
    updateLightboxImage();
  }

  // Клик по миниатюре
  grid.addEventListener("click", (e) => {
    const thumb = e.target.closest(".photo-thumb");
    if (!thumb) return;
    openLightbox(Number(thumb.dataset.index));
  });

  // Кнопки управления лайтбоксом
  lightbox.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
  lightbox.querySelector(".lightbox-next").addEventListener("click", showNext);
  lightbox.querySelector(".lightbox-prev").addEventListener("click", showPrev);

  // Клик по тёмному фону закрывает лайтбокс
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Управление с клавиатуры: Esc, стрелки влево/вправо
  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") showNext();
    if (e.key === "ArrowLeft") showPrev();
  });
}

/* ---------------------------------------------------------------------
   8. СТРАНИЦА МЕРОПРИЯТИЙ: ПРЕДСТОЯЩИЕ И ПРОШЕДШИЕ
   --------------------------------------------------------------------- */
function renderEvents() {
  const upcomingContainer = document.getElementById("events-upcoming");
  const pastContainer = document.getElementById("events-past");
  if (!upcomingContainer || !pastContainer || !window.classData) return;

  function eventCardHtml(event, isPast) {
    return `
      <div class="event-card${isPast ? " past" : ""}">
        <div class="event-date">
          <span class="day">${event.day}</span>
          <span class="month">${event.month}</span>
        </div>
        <div>
          <h3>${event.title}</h3>
          <span class="event-place">📍 ${event.place}</span>
          <p>${event.text}</p>
        </div>
      </div>
    `;
  }

  upcomingContainer.innerHTML = classData.events.upcoming
    .map((e) => eventCardHtml(e, false))
    .join("") || `<div class="empty-state">Пока новых мероприятий не запланировано.</div>`;

  pastContainer.innerHTML = classData.events.past
    .map((e) => eventCardHtml(e, true))
    .join("") || `<div class="empty-state">Прошедших мероприятий пока нет.</div>`;
}

/* ---------------------------------------------------------------------
   9. СТРАНИЦА НОВОСТЕЙ: ЛЕНТА
   --------------------------------------------------------------------- */
function renderNews() {
  const container = document.getElementById("news-feed");
  if (!container || !window.classData) return;

  container.innerHTML = classData.news
    .map(
      (item) => `
      <article class="news-card">
        <span class="news-date">${item.date}</span>
        <h3>${item.title}</h3>
        <p>${item.text}</p>
      </article>`
    )
    .join("");
}

/* ---------------------------------------------------------------------
   10. СТРАНИЦА КОНТАКТОВ
   --------------------------------------------------------------------- */
function renderContacts() {
  const container = document.getElementById("contacts-grid");
  if (!container || !window.classData) return;

  container.innerHTML = classData.contacts
    .map(
      (c) => `
      <div class="contact-card">
        <div class="contact-avatar">${c.icon}</div>
        <div class="role">${c.role}</div>
        <div class="via">${c.via}</div>
      </div>`
    )
    .join("");
}