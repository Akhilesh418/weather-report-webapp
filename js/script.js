const apiKey = '7d41c7cc44883d1eaa3525bd42c7e12f'; // Replace with your OpenWeatherMap API key

$(document).ready(function () {
  $('#weatherForm').on('submit', function (e) {
    e.preventDefault();
    const city = $('#cityInput').val().trim();
    if (!city) {
      $('#weatherError').text('Please enter a city name.').removeClass('d-none');
      return;
    }
    $('#weatherError').addClass('d-none');
    getWeather(city);
  });
});

function getWeather(city) {
  $('#loadingSpinner').removeClass('d-none');
  $('#weatherDisplay').addClass('d-none');

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

  $.get(url)
    .done(function (data) {
      $('#loadingSpinner').addClass('d-none');
      $('#weatherDisplay').removeClass('d-none');

      $('#cityName').text(data.name + ', ' + data.sys.country);
      $('#weatherDescription').text(data.weather[0].description);
      $('#weatherIcon').attr('src', `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`);
      $('#temperature').text(Math.round(data.main.temp));
      $('#feelsLike').text(Math.round(data.main.feels_like));
      $('#humidity').text(data.main.humidity);
      $('#pressure').text(data.main.pressure);
      $('#windSpeed').text(data.wind.speed);
    })
    .fail(function () {
      $('#loadingSpinner').addClass('d-none');
      $('#weatherError').text('City not found or API error!').removeClass('d-none');
    });
}
