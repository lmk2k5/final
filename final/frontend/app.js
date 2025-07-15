import api from './api.js';

const tripList = document.getElementById("trip-list");
const addTripBtn = document.getElementById("add-trip");
const addCustomTripBtn = document.getElementById("add-custom-trip");
const logoutBtn = document.querySelector(".logout-btn");

let trips = [];

// Check authentication on page load
async function checkAuth() {
  if (!api.isAuthenticated()) {
    window.location.href = '/Verify.html';
    return;
  }
  await loadTrips();
}

// Load trips from API
async function loadTrips() {
  try {
    const response = await api.getAllTrips();
    trips = response.trips.map(trip => ({
      id: trip._id,
      title: trip.tripName,
      desc: trip.description,
      img: trip.img || "assets/placeholder-banner.jpg",
      date: trip.days && trip.days.length > 0 ? trip.days[0].date : "",
      days: trip.days || []
    }));
    renderTrips();
  } catch (error) {
    console.error('Error loading trips:', error);
    alert('Failed to load trips. Please try again.');
  }
}

function renderTrips() {
  tripList.innerHTML = "";

  trips.forEach((trip) => {
    const card = document.createElement("div");
    card.className = "card trip-card";
    card.innerHTML = `
      <img src="${trip.img}" alt="${trip.title}" />
      <button class="delete-btn" title="Delete trip">🗑️</button>
      <div class="card-overlay">
        <h3>${trip.title}</h3>
        <p>${trip.desc}</p>
      </div>
    `;

    card.querySelector(".delete-btn").addEventListener("click", async (e) => {
      e.stopPropagation();
      await deleteTrip(trip.id);
    });

    card.addEventListener("click", () => {
      openTripModal(trip);
    });

    tripList.appendChild(card);
  });
}

async function deleteTrip(id) {
  try {
    await api.deleteTrip(id);
    trips = trips.filter((t) => t.id !== id);
    renderTrips();
  } catch (error) {
    console.error('Error deleting trip:', error);
    alert('Failed to delete trip. Please try again.');
  }
}

async function createEmptyTrip() {
  try {
    const tripData = {
      tripName: "Untitled Trip",
      description: "Add a short description...",
    };

    const response = await api.createTrip(tripData);
    const newTrip = {
      id: response.trip._id,
      title: response.trip.tripName,
      desc: response.trip.description,
      img: "assets/placeholder-banner.jpg",
      date: "",
      days: []
    };

    trips.push(newTrip);
    renderTrips();
    openTripModal(newTrip);
  } catch (error) {
    console.error('Error creating trip:', error);
    alert('Failed to create trip. Please try again.');
  }
}

if (addTripBtn) addTripBtn.addEventListener("click", createEmptyTrip);
if (addCustomTripBtn) addCustomTripBtn.addEventListener("click", createEmptyTrip);
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    api.logout();
    window.location.href = '/Verify.html';
  });
}

async function openTripModal(trip) {
  let modalOverlay = document.getElementById("trip-modal");

  if (!modalOverlay) {
    const res = await fetch("Modal.html");
    const html = await res.text();
    document.body.insertAdjacentHTML("beforeend", html);
  }

  setTimeout(() => {
    modalOverlay = document.getElementById("trip-modal");
    if (!modalOverlay) return;

    modalOverlay.classList.add("show");

    const titleEl = document.getElementById("modal-title");
    const descEl = document.getElementById("modal-description");
    const dateEl = document.getElementById("modal-date");
    const bannerEl = document.getElementById("modal-banner");
    const dayPlansContainer = document.getElementById("day-plans-container");

    titleEl.textContent = trip.title;
    descEl.textContent = trip.desc;
    dateEl.value = trip.date || "";
    dateEl.placeholder = "Click to set date";
    bannerEl.src = trip.img;

    // Render existing days
    if (trip.days && trip.days.length > 0) {
      dayPlansContainer.innerHTML = '';
      trip.days.forEach(day => {
        renderDay(day, trip.id);
      });
    }

    let updateTimeout;
    titleEl.oninput = () => {
      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(async () => {
        try {
          await api.updateTrip(trip.id, {
            tripName: titleEl.textContent,
            description: trip.desc
          });
          trip.title = titleEl.textContent;
          renderTrips();
        } catch (error) {
          console.error('Error updating trip:', error);
          alert('Failed to update trip. Please try again.');
        }
      }, 500);
    };

    descEl.oninput = () => {
      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(async () => {
        try {
          await api.updateTrip(trip.id, {
            tripName: trip.title,
            description: descEl.textContent
          });
          trip.desc = descEl.textContent;
          renderTrips();
        } catch (error) {
          console.error('Error updating trip:', error);
          alert('Failed to update trip. Please try again.');
        }
      }, 500);
    };

    titleEl.addEventListener("click", selectAllText);
    descEl.addEventListener("click", selectAllText);

    dateEl.onclick = () => showDatePicker(trip);

    document.getElementById("close-modal-btn").onclick = closeModal;
    document.getElementById("add-day-btn").onclick = () => addNewDay(trip.id);

    const bannerUpload = document.getElementById("banner-upload");
    if (bannerUpload) {
      bannerUpload.onchange = (e) => handleBannerUpload(e, trip);
    }

    attachDeleteHandlers();
    attachDayIconSelector();
  }, 50);
}

function closeModal() {
  const modal = document.querySelector(".modal-content");
  if (!modal) return;
  modal.classList.add("fade-out");
  setTimeout(() => {
    document.getElementById("trip-modal").classList.remove("show");
    modal.classList.remove("fade-out");
  }, 300);
}

async function addNewDay(tripId) {
  const container = document.getElementById("day-plans-container");
  const dayCount = container.querySelectorAll('.day-plan').length + 1;

  try {
    const dayData = {
      dayNumber: dayCount,
      date: new Date().toISOString().split('T')[0],
      places: []
    };

    await api.addDay(tripId, dayData);

    const newDay = document.createElement("details");
    newDay.className = "day-plan";
    newDay.open = true;
    newDay.innerHTML = `
      <summary>
        <div class="day-header">
          <div class="day-info">
            <div class="day-icon-wrapper">
              <i class="fa-solid fa-circle-plus day-icon"></i>
              <div class="day-icon-dropdown hidden">
                <div class="icon-option"><i class="fa-solid fa-plane"></i></div>
                <div class="icon-option"><i class="fa-solid fa-hotel"></i></div>
                <div class="icon-option"><i class="fa-solid fa-utensils"></i></div>
                <div class="icon-option"><i class="fa-solid fa-tree"></i></div>
                <div class="icon-option"><i class="fa-solid fa-ship"></i></div>
              </div>
            </div>
            <div>
              <div contenteditable="true" class="day-title">Day ${dayCount}</div>
              <div contenteditable="true" class="day-subtitle">Plan your day</div>
            </div>
          </div>
          <button class="delete-day" data-trip-id="${tripId}" data-day-number="${dayCount}">🗑️</button>
        </div>
      </summary>
      <ul class="activity-list">
        <li class="activity-item">
          <input type="time" class="activity-time" />
          <input type="checkbox" class="activity-check" />
          <span contenteditable="true" class="activity-desc">New activity</span>
        </li>
      </ul>
    `;
    container.appendChild(newDay);
    attachDeleteHandlers();
    attachDayIconSelector();
  } catch (error) {
    console.error('Error adding day:', error);
    alert('Failed to add day. Please try again.');
  }
}

function renderDay(day, tripId) {
  const container = document.getElementById("day-plans-container");
  const newDay = document.createElement("details");
  newDay.className = "day-plan";
  newDay.open = true;

  const activities = day.places.map(place => `
    <li class="activity-item">
      <input type="time" class="activity-time" value="${place.time}" />
      <input type="checkbox" class="activity-check" />
      <span contenteditable="true" class="activity-desc">${place.name}</span>
    </li>
  `).join('');

  newDay.innerHTML = `
    <summary>
      <div class="day-header">
        <div class="day-info">
          <div class="day-icon-wrapper">
            <i class="fa-solid fa-circle-plus day-icon"></i>
            <div class="day-icon-dropdown hidden">
              <div class="icon-option"><i class="fa-solid fa-plane"></i></div>
              <div class="icon-option"><i class="fa-solid fa-hotel"></i></div>
              <div class="icon-option"><i class="fa-solid fa-utensils"></i></div>
              <div class="icon-option"><i class="fa-solid fa-tree"></i></div>
              <div class="icon-option"><i class="fa-solid fa-ship"></i></div>
            </div>
          </div>
          <div>
            <div contenteditable="true" class="day-title">Day ${day.dayNumber}</div>
            <div contenteditable="true" class="day-subtitle">${day.date}</div>
          </div>
        </div>
        <button class="delete-day" data-trip-id="${tripId}" data-day-number="${day.dayNumber}">🗑️</button>
      </div>
    </summary>
    <ul class="activity-list">
      ${activities}
    </ul>
  `;
  container.appendChild(newDay);
}

function attachDeleteHandlers() {
  document.querySelectorAll(".delete-day").forEach((btn) => {
    const tripId = btn.dataset.tripId;
    const dayNumber = btn.dataset.dayNumber;

    btn.onclick = async () => {
      try {
        if (tripId && dayNumber) {
          await api.deleteDay(tripId, dayNumber);
        }
        btn.closest(".day-plan").remove();
      } catch (error) {
        console.error('Error deleting day:', error);
        alert('Failed to delete day. Please try again.');
      }
    };
  });
}

function attachDayIconSelector() {
  document.querySelectorAll(".day-icon-wrapper").forEach((wrapper) => {
    wrapper.onclick = (e) => {
      toggleDayIconDropdown(e, wrapper);
    };
  });

  document.querySelectorAll(".icon-option").forEach((iconOption) => {
    iconOption.onclick = (e) => {
      e.stopPropagation();
      setDayIcon(iconOption);
    };
  });
}

function toggleDayIconDropdown(event, wrapper) {
  event.stopPropagation();
  const dropdown = wrapper.querySelector(".day-icon-dropdown");
  document.querySelectorAll(".day-icon-dropdown").forEach((d) => {
    if (d !== dropdown) d.classList.add("hidden");
  });
  dropdown.classList.toggle("hidden");
}

function setDayIcon(element) {
  const iconClass = element.querySelector("i").className;
  const wrapper = element.closest(".day-icon-wrapper");
  const icon = wrapper.querySelector(".day-icon");
  icon.className = iconClass + " day-icon";
  wrapper.querySelector(".day-icon-dropdown").classList.add("hidden");
}

function handleBannerUpload(e, trip) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    const banner = document.getElementById("modal-banner");
    if (banner) banner.src = event.target.result;
    trip.img = event.target.result;
    renderTrips();
  };
  reader.readAsDataURL(file);
}

function showDatePicker(trip) {
  const input = document.createElement("input");
  input.type = "date";
  input.style.position = "fixed";
  input.style.opacity = 0;
  input.style.pointerEvents = "none";

  document.body.appendChild(input);
  input.addEventListener("change", () => {
    trip.date = input.value;
    const dateEl = document.getElementById("modal-date");
    if (dateEl) dateEl.value = trip.date;
    renderTrips();
  });
  input.click();
  setTimeout(() => document.body.removeChild(input), 300);
}

function selectAllText(e) {
  const el = e.target;
  if (el.contentEditable === "true") {
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

function toggleForm(mode) {
  const isLogin = mode === 'login';
  document.getElementById('form-title').textContent = isLogin ? 'Login' : 'Create Account';
  document.getElementById('toggle-btn').textContent = isLogin ? 'Create Account' : 'Login';
  document.getElementById('submit-btn').textContent = isLogin ? 'Login' : 'Create Account';
  document.getElementById('remember-me').style.display = isLogin ? 'block' : 'none';
}

// Initialize the app
checkAuth();
