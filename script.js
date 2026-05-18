// ========== KONFIGURASI ==========
const API_KEY = "a63b0b94c82bc98f13ae1580075749b4";
const BASE_URL = "https://api.openweathermap.org/data/2.5";
const FORECAST_URL = `${BASE_URL}/forecast`;
const WEATHER_URL = `${BASE_URL}/weather`;

// ========== DOM ELEMENTS ==========
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const darkModeToggle = document.getElementById("darkModeToggle");
const toggleIcon = document.getElementById("toggleIcon");
const loader = document.getElementById("loader");
const errorMessage = document.getElementById("errorMessage");
const errorText = document.getElementById("errorText");
const weatherContent = document.getElementById("weatherContent");
const forecastContainer = document.getElementById("forecastContainer");
const particleCanvas = document.getElementById("particleCanvas");
const ctx = particleCanvas.getContext("2d");

// Display elements
const cityNameEl = document.getElementById("cityName");
const currentDateEl = document.getElementById("currentDate");
const weatherIconEl = document.getElementById("weatherIcon");
const temperatureEl = document.getElementById("temperature");
const conditionEl = document.getElementById("condition");
const humidityEl = document.getElementById("humidity");
const windSpeedEl = document.getElementById("windSpeed");
const feelsLikeEl = document.getElementById("feelsLike");

// ========== STATE ==========
let isDarkMode = true;
let currentWeatherData = null;
let particles = [];
let animationId = null;

// ========== PARTICLE SYSTEM (HUJAN/SALJU) ==========
function resizeCanvas() {
  particleCanvas.width = window.innerWidth;
  particleCanvas.height = window.innerHeight;
}

function createParticles(weatherType) {
  particles = [];
  const count = weatherType === "rain" ? 120 : weatherType === "snow" ? 60 : 0;

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * particleCanvas.width,
      y: Math.random() * particleCanvas.height,
      speed:
        weatherType === "rain"
          ? Math.random() * 8 + 6
          : Math.random() * 2 + 0.8,
      size:
        weatherType === "rain" ? Math.random() * 2 + 1 : Math.random() * 4 + 2,
      opacity: Math.random() * 0.6 + 0.2,
      wind: Math.random() * 1.5 - 0.75,
    });
  }
}

function animateParticles() {
  ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

  if (particles.length === 0) {
    animationId = requestAnimationFrame(animateParticles);
    return;
  }

  particles.forEach((p) => {
    ctx.beginPath();
    ctx.fillStyle =
      p.size > 3
        ? `rgba(255, 255, 255, ${p.opacity})`
        : `rgba(180, 210, 255, ${p.opacity})`;

    if (p.size > 3) {
      // Snow
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Rain
      ctx.fillRect(p.x, p.y, p.size, p.size * 7);
    }

    p.y += p.speed;
    p.x += p.wind;

    if (p.y > particleCanvas.height) {
      p.y = -10;
      p.x = Math.random() * particleCanvas.width;
    }
    if (p.x > particleCanvas.width) p.x = 0;
    if (p.x < 0) p.x = particleCanvas.width;
  });

  animationId = requestAnimationFrame(animateParticles);
}

function updateParticles(weatherId) {
  let type = "";
  if (weatherId >= 200 && weatherId < 600) type = "rain";
  else if (weatherId >= 600 && weatherId < 700) type = "snow";
  else type = "";

  createParticles(type);
}

// ========== DARK/LIGHT MODE ==========
function applyDarkMode() {
  if (isDarkMode) {
    document.body.classList.remove("light-mode");
    toggleIcon.className = "fas fa-moon";
  } else {
    document.body.classList.add("light-mode");
    toggleIcon.className = "fas fa-sun";
  }

  // Update background gradient setelah mode berubah
  if (currentWeatherData) {
    const weatherInfo = currentWeatherData.weather[0];
    const dayStatus = isDayTime(
      currentWeatherData.dt,
      currentWeatherData.timezone,
    );
    updateBackgroundGradient(weatherInfo.id, dayStatus);
  } else {
    // Default gradient jika belum ada data cuaca
    updateBackgroundGradient(800, true);
  }
}

function toggleDarkMode() {
  isDarkMode = !isDarkMode;
  applyDarkMode();
  localStorage.setItem("darkMode", isDarkMode);
}

// ========== FORMAT FUNCTIONS ==========
function getWeatherIcon(weatherId, isDay = true) {
  if (weatherId >= 200 && weatherId < 300) return "fa-bolt";
  if (weatherId >= 300 && weatherId < 400) return "fa-cloud-rain";
  if (weatherId >= 500 && weatherId < 600) return "fa-cloud-showers-heavy";
  if (weatherId >= 600 && weatherId < 700) return "fa-snowflake";
  if (weatherId >= 700 && weatherId < 800) return "fa-smog";
  if (weatherId === 800) return isDay ? "fa-sun" : "fa-moon";
  if (weatherId === 801 || weatherId === 802)
    return isDay ? "fa-cloud-sun" : "fa-cloud-moon";
  return "fa-cloud";
}

function isDayTime(dt, timezoneOffset) {
  const localTime = new Date((dt + timezoneOffset) * 1000);
  return localTime.getUTCHours() >= 6 && localTime.getUTCHours() < 18;
}

function formatDate(dt, timezoneOffset) {
  const localDate = new Date((dt + timezoneOffset) * 1000);
  return localDate.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDay(dt, timezoneOffset) {
  const localDate = new Date((dt + timezoneOffset) * 1000);
  const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  return days[localDate.getUTCDay()];
}

// ========== ERROR & LOADER ==========
function showError(msg) {
  errorText.textContent = msg;
  errorMessage.style.display = "block";
  setTimeout(() => {
    errorMessage.style.display = "none";
  }, 4000);
}

function showLoader() {
  loader.classList.add("active");
  weatherContent.style.display = "none";
  errorMessage.style.display = "none";
}

function hideLoader() {
  loader.classList.remove("active");
}

// ========== UPDATE UI ==========
function updateUI(weatherData) {
  const { name, weather, main, wind, dt, timezone } = weatherData;
  const weatherInfo = weather[0];
  const dayStatus = isDayTime(dt, timezone);

  cityNameEl.textContent = name;
  currentDateEl.textContent = formatDate(dt, timezone);
  weatherIconEl.className = `fas weather-icon-main ${getWeatherIcon(weatherInfo.id, dayStatus)}`;
  temperatureEl.textContent = `${Math.round(main.temp)}°C`;
  conditionEl.textContent = weatherInfo.description;
  humidityEl.textContent = `${main.humidity}%`;
  windSpeedEl.textContent = `${wind.speed} m/s`;
  feelsLikeEl.textContent = `${Math.round(main.feels_like)}°C`;

  weatherContent.style.display = "block";
  weatherContent.style.animation = "none";
  weatherContent.offsetHeight;
  weatherContent.style.animation = "slideUp 0.6s ease";

  // Update particles
  updateParticles(weatherInfo.id);

  // Update gradient background berdasarkan cuaca
  updateBackgroundGradient(weatherInfo.id, dayStatus);

  currentWeatherData = weatherData;
}

function updateForecast(forecastData) {
  forecastContainer.innerHTML = "";

  const dailyData = {};
  forecastData.list.forEach((item) => {
    const date = new Date((item.dt + forecastData.city.timezone) * 1000);
    const dayKey = date.toDateString();
    const hour = date.getUTCHours();

    if (
      !dailyData[dayKey] ||
      Math.abs(hour - 12) < Math.abs(dailyData[dayKey].hour - 12)
    ) {
      dailyData[dayKey] = { ...item, hour };
    }
  });

  const days = Object.values(dailyData).slice(0, 5);

  days.forEach((day, index) => {
    const dayStatus = isDayTime(day.dt, forecastData.city.timezone);
    const forecastItem = document.createElement("div");
    forecastItem.className = "forecast-item";
    forecastItem.style.animationDelay = `${index * 0.08}s`;

    forecastItem.innerHTML = `
      <div class="forecast-day">${index === 0 ? "Besok" : formatDay(day.dt, forecastData.city.timezone)}</div>
      <i class="fas forecast-icon ${getWeatherIcon(day.weather[0].id, dayStatus)}"></i>
      <div class="forecast-temp">${Math.round(day.main.temp)}°C</div>
    `;

    forecastContainer.appendChild(forecastItem);
  });
}

function updateBackgroundGradient(weatherId, isDay) {
  const body = document.body;
  let gradient = "";

  // Gunakan isDarkMode untuk menentukan mode
  if (weatherId >= 200 && weatherId < 300) {
    // Thunderstorm
    gradient = isDarkMode
      ? "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
      : "linear-gradient(135deg, #8a95a5 0%, #a0aab8 100%)";
  } else if (weatherId >= 300 && weatherId < 600) {
    // Rain / Drizzle
    gradient = isDarkMode
      ? "linear-gradient(135deg, #1e2a3a 0%, #2c3e50 100%)"
      : "linear-gradient(135deg, #9aaab8 0%, #b0bec5 100%)";
  } else if (weatherId >= 600 && weatherId < 700) {
    // Snow
    gradient = isDarkMode
      ? "linear-gradient(135deg, #e0e5ec 0%, #c7d0d8 50%, #a0aab4 100%)"
      : "linear-gradient(135deg, #e8edf5 0%, #d0d8e3 100%)";
  } else if (weatherId === 800) {
    // Clear sky
    if (isDay) {
      gradient = isDarkMode
        ? "linear-gradient(135deg, #1b3a5c 0%, #2980b9 100%)"
        : "linear-gradient(135deg, #87CEEB 0%, #f0e68c 100%)";
    } else {
      gradient = isDarkMode
        ? "linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 100%)"
        : "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)";
    }
  } else if (weatherId >= 801 && weatherId <= 802) {
    // Few clouds
    gradient = isDarkMode
      ? "linear-gradient(135deg, #1e2d3d 0%, #2a3a4f 100%)"
      : "linear-gradient(135deg, #bcc9d5 0%, #d5dde5 100%)";
  } else {
    // Cloudy default
    gradient = isDarkMode
      ? "linear-gradient(135deg, #1b2235 0%, #2a314b 100%)"
      : "linear-gradient(135deg, #dce3f0 0%, #c7d0d8 100%)";
  }

  body.style.background = gradient;
}

// ========== FETCH DATA ==========
async function fetchWeather(city) {
  showLoader();
  try {
    const response = await fetch(
      `${WEATHER_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=id`,
    );
    if (!response.ok) {
      if (response.status === 404) throw new Error("Kota tidak ditemukan");
      throw new Error("Gagal mengambil data");
    }
    const data = await response.json();
    hideLoader();
    updateUI(data);
    fetchForecast(data.coord.lat, data.coord.lon);
  } catch (error) {
    hideLoader();
    showError(error.message);
  }
}

async function fetchWeatherByCoords(lat, lon) {
  showLoader();
  try {
    const response = await fetch(
      `${WEATHER_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=id`,
    );
    if (!response.ok) throw new Error("Gagal mengambil data lokasi");
    const data = await response.json();
    hideLoader();
    updateUI(data);
    fetchForecast(lat, lon);
  } catch (error) {
    hideLoader();
    showError(error.message);
  }
}

async function fetchForecast(lat, lon) {
  try {
    const response = await fetch(
      `${FORECAST_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=id`,
    );
    if (!response.ok) return;
    const data = await response.json();
    updateForecast(data);
  } catch (error) {
    console.log("Forecast fetch failed:", error);
  }
}

// ========== GEOLOCATION ==========
function detectLocation() {
  if (!navigator.geolocation) {
    showError("Geolokasi tidak didukung browser ini");
    return;
  }

  locationBtn.style.animation = "spin 1s linear infinite";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      fetchWeatherByCoords(latitude, longitude);
      locationBtn.style.animation = "";
    },
    (error) => {
      showError("Tidak dapat mengakses lokasi. Izinkan akses lokasi.");
      locationBtn.style.animation = "";
    },
    { enableHighAccuracy: true, timeout: 10000 },
  );
}

// ========== EVENT LISTENERS ==========
searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (!city) {
    showError("Masukkan nama kota");
    return;
  }
  fetchWeather(city);
});

cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const city = cityInput.value.trim();
    if (!city) {
      showError("Masukkan nama kota");
      return;
    }
    fetchWeather(city);
  }
});

locationBtn.addEventListener("click", detectLocation);
darkModeToggle.addEventListener("click", toggleDarkMode);

// Animasi klik pada detail items
document.querySelectorAll(".detail-item").forEach((item) => {
  item.addEventListener("click", function () {
    this.style.transform = "scale(0.9)";
    setTimeout(() => {
      this.style.transform = "";
    }, 200);
  });
});

// ========== INITIALIZATION ==========
function init() {
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // Load dark mode preference
  const savedMode = localStorage.getItem("darkMode");
  if (savedMode === "false") {
    isDarkMode = false;
  }

  // Apply mode awal
  applyDarkMode();

  // Start particle animation
  animateParticles();

  // Load default city
  setTimeout(() => {
    fetchWeather("Jakarta");
  }, 400);

  cityInput.focus();
}

init();
