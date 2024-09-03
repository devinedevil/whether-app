const inputValue = document.querySelector('#cityInput');
const btn = document.querySelector('#add');
const city = document.querySelector('#cityoutput');
const description = document.querySelector('#description');
const temp = document.querySelector('#temp');
const wind = document.querySelector('#wind');


const apiKey = "36aa67b655636ebb8ae7afe88e172e72";

function convertTemperature(val) {
  return (val - 273.15).toFixed(2);
}

function updateBackground(description) {
  const body = document.body;

  body.style.backgroundImage = '';
  body.style.backgroundColor = '';

  if (description.includes('clear')) {
    body.style.backgroundImage = "url('images/clear-sky.jpg')";
  } else if (description.includes('clouds')) {
    body.style.backgroundImage = "url('images/cloudy-sky.jpg')";
  } else if (description.includes('rain')) {
    body.style.backgroundImage = "url('images/rainy-sky.jpg')";
  } else if (description.includes('snow')) {
    body.style.backgroundImage = "url('images/snowy-sky.jpg')";
  } else if (description.includes('storm')) {
    body.style.backgroundImage = "url('images/stormy-sky.jpg')";
  } else {
    body.style.backgroundColor = '#d3d3d3'; 
  }
}

btn.addEventListener('click', function() {
  const cityName = inputValue.value.trim();

  if (!cityName) {
    alert('Please enter a city name.');
    return;
  }

  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('City not found');
      }
      return response.json();
    })
    .then(data => {
      const nameVal = data.name || 'N/A';
      const descrip = data.weather[0]?.description || 'No description available';
      const temperature = data.main?.temp || 'N/A';
      const wndSpeed = data.wind?.speed || 'N/A';

      city.innerHTML = `Weather of <span>${nameVal}</span>`;
      temp.innerHTML = `Temperature: <span>${convertTemperature(temperature)}°C</span>`;
      description.innerHTML = `Sky Condition: <span>${descrip}</span>`;
      wind.innerHTML = `Wind Speed: <span>${wndSpeed} m/s</span>`;

      updateBackground(descrip);
    })
    .catch(error => {
      alert(error.message);
    });
});
