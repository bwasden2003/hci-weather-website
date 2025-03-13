import React, { useState, useEffect } from 'react';
import './WeatherApp.css';

const WeatherApp = () => {
  // Initial states for city, weather data, loading status, error message, unit, forecast type, and temp units
  const [city, setCity] = useState('Austin');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unit, setUnit] = useState('fahrenheit');
  // State for our 3 buttons, either temperature, windspeed, or precipitation
  const [forecastType, setForecastType] = useState('temperature');

  // returns the current forecastType state
  const getParameter = () => {
    if (forecastType === 'temperature') return 'temperature_2m';
    if (forecastType === 'windspeed') return 'windspeed_10m';
    if (forecastType === 'precipitation') return 'precipitation';
    return '';
  };

  // helper to convert temperature to fahrenheit
  const displayTemperature = (temp) => {
    if (unit === 'fahrenheit') {
      return Math.round((temp * 9) / 5 + 32);
    }
    return temp;
  };

  // helper to format time in 12-hour format
  const formatTime = (timeString) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // main api function to fetch weather data
  const fetchWeatherData = async () => {
    // make sure city field isn't empty
    if (!city.trim()) {
      setError('Please enter a valid city.');
      return;
    }
    setLoading(true);
    setError(null);
    setWeatherData(null);

    try {
      // Get coordinates for the given city.
      const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`;
      const geoResponse = await fetch(geocodingUrl);
      const geoData = await geoResponse.json();

      if (!geoData.results || geoData.results.length === 0) {
        throw new Error('City not found');
      }

      // grab the latitude and longitude from the first api request
      const { latitude, longitude } = geoData.results[0];
      
      // grab current forecastType state
      const parameter = getParameter();
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=${parameter}&forecast_days=2&timezone=auto`;
      const weatherResponse = await fetch(weatherUrl);
      const data = await weatherResponse.json();

      // make sure we got the data we need
      if (!data.hourly || !data.hourly.time || !data.hourly[parameter]) {
        throw new Error('Weather data unavailable');
      }

      // only get data points from after the current time
      const now = new Date();
      const filteredTimes = [];
      const filteredValues = [];
      for (let i = 0; i < data.hourly.time.length; i++) {
        const forecastTime = new Date(data.hourly.time[i]);
        if (forecastTime >= now) {
          filteredTimes.push(data.hourly.time[i]);
          filteredValues.push(data.hourly[parameter][i]);
        }
      }

      // take the first 10 future data points
      setWeatherData({ times: filteredTimes.slice(0, 10), values: filteredValues.slice(0, 10) });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // fetch data upon webpage load and when the city or forecastType changes.
  useEffect(() => {
    fetchWeatherData();
  }, [city, forecastType]);

  return (
    <div className="weather-container">
      <h2>Weather App</h2>
      {/* Text input for city */}
      <div>
        <input
          type="text"
          value={city}
          className="weather-input"
          onChange={(e) => setCity(e.target.value)}
          placeholder="Enter city"
        />
        <button className="weather-button" onClick={fetchWeatherData}>
          Update City
        </button>
      </div>

      {/* Button-based options for forecast type */}
      <div className="mt-1">
        <button
          className={`weather-button ${forecastType === 'temperature' ? 'active' : ''}`}
          onClick={() => setForecastType('temperature')}
        >
          Hourly Temperature
        </button>
        <button
          className={`weather-button ${forecastType === 'windspeed' ? 'active' : ''}`}
          onClick={() => setForecastType('windspeed')}
        >
          Hourly Wind Speed
        </button>
        <button
          className={`weather-button ${forecastType === 'precipitation' ? 'active' : ''}`}
          onClick={() => setForecastType('precipitation')}
        >
          Hourly Precipitation
        </button>
      </div>

      {/* Unit toggle button is shown only for temperature data */}
      {forecastType === 'temperature' && (
        <div className="mt-1">
          <button
            className="weather-button"
            onClick={() => setUnit(unit === 'celsius' ? 'fahrenheit' : 'celsius')}
          >
            Switch to {unit === 'celsius' ? 'Fahrenheit' : 'Celsius'}
          </button>
        </div>
      )}

      {/* Display the data or any messages */}
      <div className="mt-1">
        {loading && <p>Loading data...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {weatherData && !loading && !error && (
          <table className="weather-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>
                  {forecastType === 'temperature'
                    ? `Temperature (°${unit === 'celsius' ? 'C' : 'F'})`
                    : forecastType === 'windspeed'
                    ? 'Wind Speed (km/h)'
                    : 'Precipitation (mm)'}
                </th>
              </tr>
            </thead>
            <tbody>
              {weatherData.times.map((time, index) => (
                <tr key={index}>
                  <td>{formatTime(time)}</td>
                  <td>
                    {forecastType === 'temperature'
                      ? displayTemperature(weatherData.values[index])
                      : weatherData.values[index]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default WeatherApp;
