const API_KEY = 'a63b0b94c82bc98f13ae1580075749b4'
const WEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather'
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast'

const cityInput = document.getElementById('cityInput')
const searchBtn = document.getElementById('searchBtn')
const locationBtn = document.getElementById('locationBtn')
const darkToggle = document.getElementById('darkModeToggle')
const toggleIcon = document.getElementById('toggleIcon')
const loader = document.getElementById('loader')
const errorMsg = document.getElementById('errorMessage')
const errorText = document.getElementById('errorText')
const weatherContent = document.getElementById('weatherContent')
const forecastContainer = document.getElementById('forecastContainer')

const cityNameEl = document.getElementById('cityName')
const currentDateEl = document.getElementById('currentDate')
const weatherIconEl = document.getElementById('weatherIcon')
const temperatureEl = document.getElementById('temperature')
const conditionEl = document.getElementById('condition')
const humidityEl = document.getElementById('humidity')
const windSpeedEl = document.getElementById('windSpeed')
const feelsLikeEl = document.getElementById('feelsLike')

const canvas = document.getElementById('particleCanvas')
const ctx = canvas.getContext('2d')

let particles = []
let animId = null
let isDark = true
let currentWeatherId = 800

function resizeCanvas () {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}
window.addEventListener('resize', resizeCanvas)
resizeCanvas()

function createParticles (type) {
  particles = []
  const isRain = type === 'rain'
  const isSun = type === 'sun'

  if (isRain) {
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 5 + Math.random() * 7,
        size: 1 + Math.random() * 2,
        opacity: 0.2 + Math.random() * 0.4,
        wind: (Math.random() - 0.5) * 0.8,
        type: 'rain'
      })
    }
  } else if (isSun) {
    for (let i = 0; i < 50; i++) {
      const size = 20 + Math.random() * 40
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 0.04 + Math.random() * 0.08,
        size: size,
        opacity: 0.5 + Math.random() * 0.5,
        wind: (Math.random() - 0.5) * 0.05,
        type: 'sun',
        angle: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.015,
        pulse: Math.random() * Math.PI * 2,
        phase: Math.random() * Math.PI * 2
      })
    }
  }
}

function drawSun (ctx, x, y, size, opacity, angle, pulse, phase) {
  const glow = 1.4 + Math.sin(pulse + phase) * 0.5
  const radius = size * 0.5 * glow
  const baseOpacity = Math.min(opacity, 1.0)

  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)

  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 3)
  gradient.addColorStop(0, `rgba(255, 248, 200, ${baseOpacity * 1.4})`)
  gradient.addColorStop(0.1, `rgba(255, 240, 180, ${baseOpacity * 1.2})`)
  gradient.addColorStop(0.3, `rgba(255, 225, 150, ${baseOpacity * 0.9})`)
  gradient.addColorStop(0.6, `rgba(255, 210, 120, ${baseOpacity * 0.5})`)
  gradient.addColorStop(0.85, `rgba(255, 190, 90, ${baseOpacity * 0.2})`)
  gradient.addColorStop(1, `rgba(255, 170, 60, 0)`)

  ctx.beginPath()
  ctx.arc(0, 0, radius * 3, 0, Math.PI * 2)
  ctx.fillStyle = gradient
  ctx.fill()

  ctx.beginPath()
  ctx.arc(0, 0, radius * 1.3, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(255, 250, 220, ${baseOpacity * 0.8})`
  ctx.fill()

  ctx.beginPath()
  ctx.arc(0, 0, radius * 0.8, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(255, 255, 240, ${baseOpacity * 0.9})`
  ctx.fill()

  ctx.beginPath()
  ctx.arc(0, 0, radius * 0.4, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(255, 255, 255, ${baseOpacity * 0.95})`
  ctx.fill()

  const rayCount = 12 + Math.floor(Math.sin(pulse * 0.5 + phase) * 4)
  for (let i = 0; i < rayCount; i++) {
    const a = (i / rayCount) * Math.PI * 2 + angle * 0.3 + pulse * 0.08
    const inner = radius * 0.9
    const outer = radius * 2.2 + Math.sin(pulse * 0.5 + i * 1.3 + phase) * 0.8
    ctx.beginPath()
    ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner)
    ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer)
    ctx.strokeStyle = `rgba(255, 240, 180, ${baseOpacity * 0.7})`
    ctx.lineWidth = 1.5 + Math.sin(pulse + i * 0.9 + phase) * 0.8
    ctx.stroke()
  }

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + angle * 0.5 + pulse * 0.12
    const inner = radius * 1.1
    const outer = radius * 3.0 + Math.sin(pulse * 0.3 + i * 1.7 + phase) * 0.6
    ctx.beginPath()
    ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner)
    ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer)
    ctx.strokeStyle = `rgba(255, 220, 140, ${baseOpacity * 0.3})`
    ctx.lineWidth = 0.6
    ctx.stroke()
  }

  const sparkleCount = 6
  for (let i = 0; i < sparkleCount; i++) {
    const a =
      (i / sparkleCount) * Math.PI * 2 + angle + pulse * 0.2 + phase * 0.3
    const dist = radius * 1.8 + Math.sin(pulse * 0.7 + i * 2.1 + phase) * 0.5
    const sx = Math.cos(a) * dist
    const sy = Math.sin(a) * dist
    const ss = 2 + Math.sin(pulse * 0.5 + i + phase) * 1.5
    ctx.beginPath()
    ctx.arc(sx, sy, ss * 0.3, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255, 255, 200, ${
      baseOpacity * 0.4 * (0.5 + Math.sin(pulse + i + phase) * 0.5)
    })`
    ctx.fill()
  }

  ctx.restore()
}

function animateParticles () {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (particles.length === 0) {
    animId = requestAnimationFrame(animateParticles)
    return
  }

  const isRainMode = particles[0].type === 'rain'

  for (const p of particles) {
    if (p.type === 'rain') {
      ctx.beginPath()
      ctx.fillStyle = `rgba(180, 210, 255, ${p.opacity * 0.5})`
      ctx.fillRect(p.x, p.y, p.size * 0.6, p.size * 6)
      p.y += p.speed
      p.x += p.wind
      if (p.y > canvas.height) {
        p.y = -10
        p.x = Math.random() * canvas.width
      }
      if (p.x > canvas.width) p.x = 0
      if (p.x < 0) p.x = canvas.width
    } else if (p.type === 'sun') {
      p.angle += p.rotationSpeed
      p.pulse += 0.02
      drawSun(ctx, p.x, p.y, p.size, p.opacity, p.angle, p.pulse, p.phase)
      p.x += p.wind
      p.y += p.speed
      if (p.y > canvas.height + 30) {
        p.y = -30
        p.x = Math.random() * canvas.width
      }
      if (p.y < -30) {
        p.y = canvas.height + 30
        p.x = Math.random() * canvas.width
      }
      if (p.x > canvas.width + 30) p.x = -30
      if (p.x < -30) p.x = canvas.width + 30
    }
  }

  animId = requestAnimationFrame(animateParticles)
}

function updateParticles (weatherId, isDarkMode) {
  if (isDarkMode) {
    createParticles('rain')
  } else {
    createParticles('sun')
  }
}

function getWeatherIcon (weatherId, isDay) {
  if (weatherId >= 200 && weatherId < 300) return 'fa-bolt'
  if (weatherId >= 300 && weatherId < 400) return 'fa-cloud-rain'
  if (weatherId >= 500 && weatherId < 600) return 'fa-cloud-showers-heavy'
  if (weatherId >= 600 && weatherId < 700) return 'fa-snowflake'
  if (weatherId >= 700 && weatherId < 800) return 'fa-smog'
  if (weatherId === 800) return isDay ? 'fa-sun' : 'fa-moon'
  if (weatherId === 801 || weatherId === 802)
    return isDay ? 'fa-cloud-sun' : 'fa-cloud-moon'
  return 'fa-cloud'
}

function isDayTime (dt, offset) {
  const h = new Date((dt + offset) * 1000).getUTCHours()
  return h >= 6 && h < 18
}

function formatDate (dt, offset) {
  const d = new Date((dt + offset) * 1000)
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function formatDay (dt, offset) {
  const d = new Date((dt + offset) * 1000)
  return ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][d.getUTCDay()]
}

function showError (msg) {
  errorText.textContent = msg
  errorMsg.style.display = 'block'
  setTimeout(() => (errorMsg.style.display = 'none'), 4000)
}

function showLoader () {
  loader.classList.add('active')
  weatherContent.style.display = 'none'
}
function hideLoader () {
  loader.classList.remove('active')
}

function updateUI (data) {
  const { name, weather, main, wind, dt, timezone } = data
  const w = weather[0]
  const day = isDayTime(dt, timezone)
  currentWeatherId = w.id

  cityNameEl.textContent = name
  currentDateEl.textContent = formatDate(dt, timezone)
  weatherIconEl.className = `fas weather-icon-main ${getWeatherIcon(w.id, day)}`
  temperatureEl.textContent = `${Math.round(main.temp)}°C`
  conditionEl.textContent = w.description
  humidityEl.textContent = `${main.humidity}%`
  windSpeedEl.textContent = `${wind.speed} m/s`
  feelsLikeEl.textContent = `${Math.round(main.feels_like)}°C`

  weatherContent.style.display = 'flex'
  updateParticles(w.id, isDark)
}

function updateForecast (data) {
  forecastContainer.innerHTML = ''
  const daily = {}
  for (const item of data.list) {
    const d = new Date((item.dt + data.city.timezone) * 1000)
    const key = d.toDateString()
    const hour = d.getUTCHours()
    if (!daily[key] || Math.abs(hour - 12) < Math.abs(daily[key].hour - 12)) {
      daily[key] = { ...item, hour }
    }
  }
  const days = Object.values(daily).slice(0, 5)
  for (const [idx, day] of days.entries()) {
    const d = isDayTime(day.dt, data.city.timezone)
    const el = document.createElement('div')
    el.className = 'forecast-item'
    el.innerHTML = `
          <div class="forecast-day">${
            idx === 0 ? 'Besok' : formatDay(day.dt, data.city.timezone)
          }</div>
          <i class="fas forecast-icon ${getWeatherIcon(
            day.weather[0].id,
            d
          )}"></i>
          <div class="forecast-temp">${Math.round(day.main.temp)}°C</div>
        `
    forecastContainer.appendChild(el)
  }
}

async function fetchWeather (city) {
  showLoader()
  try {
    const res = await fetch(
      `${WEATHER_URL}?q=${encodeURIComponent(
        city
      )}&appid=${API_KEY}&units=metric&lang=id`
    )
    if (!res.ok)
      throw new Error(
        res.status === 404 ? 'Kota tidak ditemukan' : 'Gagal mengambil data'
      )
    const data = await res.json()
    hideLoader()
    updateUI(data)
    fetchForecast(data.coord.lat, data.coord.lon)
  } catch (err) {
    hideLoader()
    showError(err.message)
  }
}

async function fetchWeatherByCoords (lat, lon) {
  showLoader()
  try {
    const res = await fetch(
      `${WEATHER_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=id`
    )
    if (!res.ok) throw new Error('Gagal lokasi')
    const data = await res.json()
    hideLoader()
    updateUI(data)
    fetchForecast(lat, lon)
  } catch (err) {
    hideLoader()
    showError(err.message)
  }
}

async function fetchForecast (lat, lon) {
  try {
    const res = await fetch(
      `${FORECAST_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=id`
    )
    if (!res.ok) return
    const data = await res.json()
    updateForecast(data)
  } catch (_) {}
}

function detectLocation () {
  if (!navigator.geolocation) {
    showError('Geolokasi tidak didukung')
    return
  }
  locationBtn.style.animation = 'spin 1s linear infinite'
  navigator.geolocation.getCurrentPosition(
    pos => {
      fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude)
      locationBtn.style.animation = ''
    },
    () => {
      showError('Izin lokasi dibutuhkan')
      locationBtn.style.animation = ''
    },
    { enableHighAccuracy: true, timeout: 8000 }
  )
}

function applyTheme (dark) {
  isDark = dark
  if (dark) {
    document.body.classList.remove('light-mode')
    toggleIcon.className = 'fas fa-moon'
  } else {
    document.body.classList.add('light-mode')
    toggleIcon.className = 'fas fa-sun'
  }
  localStorage.setItem('weatherTheme', dark ? 'dark' : 'light')
  updateParticles(currentWeatherId, dark)
}

function toggleTheme () {
  applyTheme(!isDark)
}

searchBtn.addEventListener('click', () => {
  const c = cityInput.value.trim()
  if (!c) return showError('Masukkan nama kota')
  fetchWeather(c)
})
cityInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') searchBtn.click()
})
locationBtn.addEventListener('click', detectLocation)
darkToggle.addEventListener('click', toggleTheme)

function init () {
  const saved = localStorage.getItem('weatherTheme')
  if (saved === 'light') applyTheme(false)
  else applyTheme(true)

  animateParticles()
  setTimeout(() => fetchWeather('Jakarta'), 300)
}
init()

if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document
    .querySelectorAll('*')
    .forEach(el => (el.style.animationDuration = '0.01ms'))
}
