const apiKey = "36aa67b655636ebb8ae7afe88e172e72"; 
function fetchCurrentLocationWeather() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

      try {
        const response = await fetch(url);
        const data = await response.json();
        const city = data.name + " (You)";
        addCityCard(city, data);
      } catch (err) {
        console.error('Failed to load location weather', err);
      }

    }, (error) => {
      console.warn('Geolocation error:', error.message);
    });
  } else {
    console.warn('Geolocation not supported');
  }
}


window.onload = () => {
  const savedCities = localStorage.getItem('cities');
  if (savedCities) {
    cities = JSON.parse(savedCities);
    cities.forEach(city => addCityCard(city));
  }

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light');
    document.getElementById('themeIcon').textContent = '🌞';
  }

  fetchCurrentLocationWeather();
};
document.getElementById('addCityBtn').addEventListener('click', () => {
  const input = document.getElementById('cityInput');
  const city = input.value.trim();
  if (city && !cities.includes(city)) {
    cities.push(city);
    saveCities();
    addCityCard(city);
    input.value = '';
  }
});

function saveCities() {
  localStorage.setItem('cities', JSON.stringify(cities));
}
function addCityCard(city, preloadedData = null) {
  const cardId = `card-${city.replace(/\s+/g, '_')}`;
  const container = document.getElementById('weatherCards');

  const card = document.createElement('div');
  card.className = 'weather-card';
  card.id = cardId;
  card.innerHTML = `
    <h2>${city}</h2>
    <img class="weather-icon" src="images/icons/loading.png" alt="Loading">
    <div class="temp">-- °C</div>
    <div class="description">Loading...</div>
    <div class="wind">-- km/h</div>
    <button class="forecast-toggle">Show Forecast ▼</button>
    <div class="forecast" style="display: none;"></div>
    <canvas class="chart" width="300" height="120"></canvas>
  `;
  const forecastBtn = card.querySelector('.forecast-toggle');
const forecastBox = card.querySelector('.forecast');

forecastBtn.addEventListener('click', async () => {
  const isVisible = forecastBox.style.display === 'block';

  if (!isVisible) {
    const forecastData = await fetchForecast(city);
    forecastBox.innerHTML = forecastData.map(day => `
      <div class="forecast-day">
        <strong>${day.date}</strong> - ${day.temp}°C
        <img src="images/icons/${getIconForWeather(day.temp, "")}" alt="" width="30">
      </div>
    `).join('');
    forecastBox.style.display = 'block';
    forecastBtn.textContent = "Hide Forecast ▲";
  } else {
    forecastBox.style.display = 'none';
    forecastBtn.textContent = "Show Forecast ▼";
  }
});


  card.querySelector('.forecast-toggle').addEventListener('click', async () => {
    const forecastBox = card.querySelector('.forecast');
    const isVisible = forecastBox.style.display === 'block';

    if (!isVisible) {
      const forecastData = await fetchForecast(city);
      forecastBox.innerHTML = forecastData.map(day => `
        <div class="forecast-day">
          <strong>${day.date}</strong> - ${day.temp}°C
          <img src="images/icons/${getIconForTemp(day.temp)}" alt="" width="30">
        </div>
      `).join('');
    }

    forecastBox.style.display = isVisible ? 'none' : 'block';
  });

  container.prepend(card);

  if (preloadedData) {
    updateCardWithData(cardId, preloadedData);
  } else {
    fetchAndUpdateWeather(city, cardId);
  }

  setInterval(() => {
    fetchAndUpdateWeather(city, cardId);
  }, 5000);
}
function fetchAndUpdateWeather(city, cardId) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

  fetch(url)
    .then(res => res.json())
    .then(data => updateCardWithData(cardId, data))
    .catch(err => console.error("Weather fetch error:", err));
}

function updateCardWithData(cardId, data) {
  const temp = Math.round(data.main.temp);
  const desc = data.weather[0].description;
  const wind = data.wind.speed;
  const iconName = getIconForWeather(temp, desc);


  const card = document.getElementById(cardId);
  if (card) {
    card.querySelector('.temp').textContent = `${temp} °C`;
    card.querySelector('.description').textContent = desc;
    card.querySelector('.wind').textContent = `Wind: ${wind} km/h`;
    card.querySelector('.weather-icon').src = `images/icons/${iconName}`;
    card.querySelector('.weather-icon').alt = desc;

    // Smart weather alerts
    let alertMessage = '';
    if (temp >= 35) alertMessage = '🔥 Heatwave Alert!';
    else if (temp <= 0) alertMessage = '❄️ Freezing Alert!';
    else if (wind >= 30) alertMessage = '🌬️ High Wind Warning!';

    let alertDiv = card.querySelector('.alert');
    if (!alertDiv) {
      alertDiv = document.createElement('div');
      alertDiv.className = 'alert';
      card.appendChild(alertDiv);
    }
    alertDiv.textContent = alertMessage;
    alertDiv.style.display = alertMessage ? 'block' : 'none';
  }
}
async function fetchForecast(city) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

  const response = await fetch(url);
  const data = await response.json();

  const forecastMap = {};

  data.list.forEach(entry => {
    const date = new Date(entry.dt_txt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    if (!forecastMap[date]) forecastMap[date] = [];
    forecastMap[date].push(entry.main.temp);
  });

  const result = Object.entries(forecastMap)
    .slice(1, 4)
    .map(([date, temps]) => ({
      date,
      temp: Math.round(temps.reduce((a, b) => a + b, 0) / temps.length)
    }));

  drawForecastChart(city, data.list.slice(0, 8));
  return result;
}
function drawForecastChart(city, forecastList) {
  const cardId = `card-${city.replace(/\s+/g, '_')}`;
  const card = document.getElementById(cardId);
  const canvas = card.querySelector('.chart');
  const ctx = canvas.getContext('2d');

  const labels = forecastList.map(entry =>
    new Date(entry.dt_txt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
  const temps = forecastList.map(entry => Math.round(entry.main.temp));

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Temp (°C)',
        data: temps,
        fill: false,
        borderColor: '#4bc0c0',
        tension: 0.4,
        pointBackgroundColor: '#fff'
      }]
    },
    options: {
      plugins: { legend: { display: false }},
      scales: {
        y: { ticks: { color: '#ccc' }, grid: { color: '#333' }},
        x: { ticks: { color: '#ccc' }, grid: { color: '#333' }}
      }
    }
  });
}

const themeIcon = document.getElementById('themeIcon');

themeIcon.addEventListener('click', () => {
  document.body.classList.toggle('light');
  themeIcon.textContent = document.body.classList.contains('light') ? '🌞' : '🌙';
  localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
});


function getIconForWeather(temp, desc) {
  desc = desc.toLowerCase();

  if (desc.includes("snow")) return "snow.png";
  if (desc.includes("fog") || desc.includes("mist")) return "fog.png";
  if (desc.includes("wind")) return "wind.png";
  if (desc.includes("cloud")) return "cloudy.png";
  if (desc.includes("rain") || desc.includes("drizzle")) return "mild.png";
  if (desc.includes("storm") || desc.includes("thunder")) return "heatwave.png";
  if (desc.includes("clear") && temp >= 30) return "bright.png";
  if (desc.includes("clear") && temp < 30) return "sunny.png";

  if (temp <= 0) return "snow.png";
  if (temp <= 5) return "fog.png";
  if (temp <= 10) return "wind.png";
  if (temp <= 15) return "cloudy.png";
  if (temp <= 20) return "mild.png";
  if (temp <= 25) return "sunny.png";
  if (temp <= 30) return "bright.png";
  if (temp <= 35) return "hot.png";
  return "heatwave.png";
}
particlesJS("particles-js", {
  particles: {
    number: { value: 60 },
    color: { value: "#00ffff" },
    shape: { type: "circle" },
    opacity: { value: 0.3 },
    size: { value: 3 },
    line_linked: {
      enable: true,
      distance: 120,
      color: "#00ffff",
      opacity: 0.2,
      width: 1
    },
    move: {
      enable: true,
      speed: 1.5
    }
  },
  interactivity: {
    detect_on: "canvas",
    events: {
      onhover: { enable: true, mode: "grab" },
      onclick: { enable: true, mode: "push" }
    },
    modes: {
      grab: { distance: 140, line_linked: { opacity: 0.4 } },
      push: { particles_nb: 4 }
    }
  },
  retina_detect: true
});


