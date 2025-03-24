const apiKey = "36aa67b655636ebb8ae7afe88e172e72";
let cities = [];

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

function fetchCurrentLocationWeather() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

      try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data || !data.name) return;

        const displayName = data.name + " (You)";
        const actualCity = data.name;

        if (!cities.includes(actualCity)) {
          cities.push(actualCity);
          saveCities();
        }

        addCityCard(displayName, data, actualCity);
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

function addCityCard(displayName, preloadedData = null, realCityName = null) {
  const fetchCity = realCityName || displayName;
  const cardId = `card-${displayName.replace(/\s+/g, '_')}`;
  const container = document.getElementById('weatherCards');

  const card = document.createElement('div');
  card.className = 'weather-card';
  card.id = cardId;
  card.innerHTML = `
    <h2>${displayName}</h2>
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
      const forecastData = await fetchForecast(fetchCity);
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

  container.prepend(card);

  if (preloadedData) {
    updateCardWithData(cardId, preloadedData);
  } else {
    fetchAndUpdateWeather(fetchCity, cardId);
  }

  setInterval(() => {
    fetchAndUpdateWeather(fetchCity, cardId);
  }, 5000);
}
