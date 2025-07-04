$(document).ready(function() {
    // IMPORTANT: Replace 'YOUR_OPENWEATHERMAP_API_KEY_HERE' with your actual OpenWeatherMap API Key
    const OPENWEATHER_API_KEY = '7d41c7cc44883d1eaa3525bd42c7e12f';
    const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

    // IMPORTANT: Replace 'YOUR_GEODB_RAPIDAPI_KEY_HERE' with your actual GeoDB Cities RapidAPI Key
    const GEODB_API_KEY = '6620cc13bdmshad5387c206c88dbp1a0d80jsn28250b01d26b';
    const GEODB_BASE_URL = 'https://wft-geo-db.p.rapidapi.com/v1/geo/cities';

    const cityInput = $('#cityInput');
    const weatherForm = $('#weatherForm');
    const weatherDisplay = $('#weatherDisplay');
    const loadingSpinner = $('#loadingSpinner');
    const weatherError = $('#weatherError');
    const citySuggestions = $('#citySuggestions');

    let debounceTimer; // For debouncing input for autocomplete

    // --- UI Feedback Functions ---

    // Function to display error messages
    function showError(message) {
        weatherError.text(message).removeClass('d-none');
        weatherDisplay.addClass('d-none'); // Hide weather display on error
        loadingSpinner.addClass('d-none'); // Hide spinner
        citySuggestions.addClass('d-none').empty(); // Hide suggestions
    }

    // Function to hide error messages
    function hideError() {
        weatherError.addClass('d-none');
    }

    // Function to show loading spinner
    function showLoading() {
        loadingSpinner.removeClass('d-none');
        weatherDisplay.addClass('d-none');
        hideError();
        citySuggestions.addClass('d-none').empty(); // Hide suggestions during loading
    }

    // Function to hide loading spinner
    function hideLoading() {
        loadingSpinner.addClass('d-none');
    }

    // --- Weather Data Functions ---

    // Function to map OpenWeatherMap icon codes to their URLs
    function getWeatherIconUrl(iconCode) {
        return `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
    }

    // Function to fetch weather data
    async function fetchWeatherData(city) {
        showLoading();
        try {
            const response = await fetch(`${OPENWEATHER_BASE_URL}?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric`);
            const data = await response.json();

            if (response.ok) {
                updateWeatherUI(data);
                hideLoading();
                weatherDisplay.removeClass('d-none'); // Show weather display
            } else {
                // Handle API errors (e.g., city not found, invalid key)
                let errorMessage = 'Could not fetch weather data. Please try again.';
                if (data.message) {
                    errorMessage = `Error: ${data.message.charAt(0).toUpperCase() + data.message.slice(1)}.`;
                }
                showError(errorMessage);
                hideLoading();
            }
        } catch (error) {
            console.error('OpenWeatherMap Fetch error:', error);
            showError('Network error or API issue. Please check your internet connection and API key.');
            hideLoading();
        }
    }

    // Function to update the UI with weather data
    function updateWeatherUI(data) {
        $('#cityName').text(`${data.name}, ${data.sys.country}`);
        $('#weatherDescription').text(data.weather[0].description);
        $('#temperature').text(Math.round(data.main.temp));
        $('#feelsLike').text(Math.round(data.main.feels_like));
        $('#humidity').text(data.main.humidity);
        $('#windSpeed').text((data.wind.speed * 3.6).toFixed(1)); // Convert m/s to km/h
        $('#pressure').text(data.main.pressure);

        // Set weather icon
        $('#weatherIcon').attr('src', getWeatherIconUrl(data.weather[0].icon));
        $('#weatherIcon').attr('alt', data.weather[0].main); // Alt text for accessibility
    }

    // --- GeoDB Cities Autocomplete Functions ---

    // Function to fetch city suggestions from GeoDB Cities API
    async function fetchCitySuggestions(prefix) {
        if (prefix.length < 2) { // Start suggesting after 2 characters
            citySuggestions.empty().addClass('d-none');
            return;
        }

        try {
            const response = await fetch(`${GEODB_BASE_URL}?namePrefix=${prefix}&countryIds=IN&limit=10&sort=-population`, {
                method: 'GET',
                headers: {
                    'x-rapidapi-key': GEODB_API_KEY,
                    'x-rapidapi-host': 'wft-geo-db.p.rapidapi.com'
                }
            });
            const data = await response.json();

            if (response.ok && data.data && data.data.length > 0) {
                renderSuggestions(data.data);
            } else {
                citySuggestions.empty().addClass('d-none'); // Hide if no suggestions
            }
        } catch (error) {
            console.error('GeoDB Fetch error:', error);
            citySuggestions.empty().addClass('d-none'); // Hide on error
        }
    }

    // Function to render city suggestions in the dropdown
    function renderSuggestions(cities) {
        citySuggestions.empty().removeClass('d-none'); // Clear and show container
        cities.forEach(city => {
            const suggestionItem = $(`<div class="list-group-item list-group-item-action">${city.name}, ${city.country}</div>`);
            suggestionItem.on('click', function() {
                cityInput.val(city.name); // Set input value to selected city
                citySuggestions.addClass('d-none').empty(); // Hide and clear suggestions
                fetchWeatherData(city.name); // Immediately fetch weather for selected city
            });
            citySuggestions.append(suggestionItem);
        });
    }

    // --- Event Listeners ---

    // Event listener for city input (debounced for autocomplete)
    cityInput.on('keyup', function() {
        clearTimeout(debounceTimer); // Clear previous timer
        const query = $(this).val().trim();
        debounceTimer = setTimeout(() => {
            fetchCitySuggestions(query); // Fetch suggestions after a delay
        }, 300); // 300ms debounce time
    });

    // Event listener for form submission (manual search)
    weatherForm.on('submit', function(e) {
        e.preventDefault(); // Prevent default form submission
        const city = cityInput.val().trim(); // Get city name and trim whitespace

        if (city) {
            fetchWeatherData(city);
            citySuggestions.addClass('d-none').empty(); // Hide and clear suggestions on manual submit
        } else {
            showError('Please enter a city name.');
        }
    });

    // Hide suggestions when clicking outside the form/suggestions
    $(document).on('click', function(e) {
        if (!$(e.target).closest('#weatherForm').length && !$(e.target).closest('#citySuggestions').length) {
            citySuggestions.addClass('d-none').empty();
        }
    });

    // Optional: Fetch weather for a default city on load
    // fetchWeatherData('New Delhi'); // Uncomment to load weather for New Delhi initially
});