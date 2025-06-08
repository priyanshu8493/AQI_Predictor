import React, { useState, useEffect } from 'react';
import './App.css';
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

function App() {
  const [positionA, setPositionA] = useState([48.8566, 2.3522]); // Default to Paris for Point A
  const [positionB, setPositionB] = useState([48.8566, 2.3522]); // Default to Paris for Point B
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isPointA, setIsPointA] = useState(true); // Flag to toggle between Point A and Point B
  const [bothLocationsSelected, setBothLocationsSelected] = useState(false); // Flag for checking if both locations are selected
  const [showConfirmation, setShowConfirmation] = useState(false); // Flag to show confirmation button for each location

  // Handle search query change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value.trim()) {
      getSuggestions(e.target.value); // Fetch location suggestions as user types
    } else {
      setSuggestions([]); // Clear suggestions if input is empty
    }
  };

  // Fetch location suggestions
  const getSuggestions = (query) => {
    const apiKey = process.env.REACT_APP_OPENCAGE_API_KEY; // Replace with your OpenCage API key // api_key: 578de5eadf084b499371a820e962ace9
    fetch(`https://api.opencagedata.com/geocode/v1/json?q=${query}&key=${apiKey}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.results) {
          setSuggestions(data.results);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };

  // Handle search selection
  const handleSuggestionClick = (lat, lng) => {
    if (isPointA) {
      setPositionA([lat, lng]); // Set Point A (starting location)
    } else {
      setPositionB([lat, lng]); // Set Point B (destination)
    }
    setSearchQuery('');
    setSuggestions([]);
    setShowConfirmation(true); // Show confirmation button after selecting location
  };

  // Confirm the location (either start or destination)
  const handleConfirmation = () => {
    setShowConfirmation(false); // Hide confirmation button after confirming
    if (isPointA) {
      setIsPointA(false); // Move to destination point after confirming start location
    } else {
      setBothLocationsSelected(true); // Both points are selected, enable button
    }
  };

  // Zoom out to show both markers on the screen after locations are selected
  function FitBounds() {
    const map = useMap();
    useEffect(() => {
      if (positionA && positionB) {
        const bounds = L.latLngBounds([positionA, positionB]); // Create bounds with both points
        map.fitBounds(bounds); // Fit the map to these bounds
      }
    }, [positionA, positionB, map]);

    return null;
  }

  // Send the selected points to Django for AQI processing
  const handleGetSafestPath = async () => {
    // Prepare data to send to backend
    const data = {
      pointA: positionA,
      pointB: positionB,
    };

    try {
      const response = await fetch('http://your-django-backend-url/api/safest-path/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      console.log('Safest path result:', result);
      // Handle the result (e.g., update the route on the map or show the result)
    } catch (error) {
      console.error('Error fetching safest path:', error);
    }
  };

  return (
    <div className="App bg-gray-50 min-h-screen flex flex-col justify-between">
      {/* Container for Search Box */}
      <div className="flex justify-center p-8">
        {/* Search Box for both Point A and Point B */}
        <div className="w-96 bg-white shadow-xl rounded-lg p-4 border border-gray-300">
          <input
            type="text"
            placeholder={`Enter ${isPointA ? 'Start' : 'Destination'} Location`}
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full p-4 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition ease-in-out"
          />
          {/* Confirmation Button */}
          {showConfirmation && (
            <button
              onClick={handleConfirmation}
              className="mt-4 w-full p-3 bg-green-500 text-white rounded-md hover:bg-green-400 transition"
            >
              Confirm {isPointA ? 'Start' : 'Destination'} Location
            </button>
          )}
        </div>
      </div>

      {/* Suggestions List */}
      {suggestions.length > 0 && (
        <div className="w-96 mx-auto mt-2 bg-white shadow-lg rounded-md">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => handleSuggestionClick(suggestion.geometry.lat, suggestion.geometry.lng)}
              className="p-3 cursor-pointer hover:bg-gray-200"
            >
              {suggestion.formatted}
            </div>
          ))}
        </div>
      )}

      {/* Map Container */}
      <MapContainer
        center={positionA} // Dynamically set center to positionA or positionB
        zoom={13}
        style={{ height: "calc(100vh - 120px)", width: "100%" }}
        whenCreated={(map) => map.invalidateSize()} // Ensures map size is recalculated
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url='https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        />
        <Marker position={positionA}>
          <Popup>Starting Location (Point A)</Popup>
        </Marker>
        <Marker position={positionB}>
          <Popup>Destination (Point B)</Popup>
        </Marker>

        {/* Fit bounds to show both markers on the screen */}
        <FitBounds />
      </MapContainer>

      {/* "Get Safest Path" Button */}
      {bothLocationsSelected && (
        <button
          onClick={handleGetSafestPath}
          className="fixed bottom-10 left-1/2 transform -translate-x-1/2 px-8 py-4 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-500 focus:outline-none transition"
        >
          Get Safest Path
        </button>
      )}
    </div>
  );
}

export default App;
