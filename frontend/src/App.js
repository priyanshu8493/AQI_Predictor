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
  const [loading, setLoading] = useState(false); // For showing loading spinner
  const [bothLocationsSelected, setBothLocationsSelected] = useState(false); // Flag for checking if both locations are selected

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
    const apiKey = '578de5eadf084b499371a820e962ace9'; // Replace with your OpenCage API key
    setLoading(true);
    fetch(`https://api.opencagedata.com/geocode/v1/json?q=${query}&key=${apiKey}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.results) {
          setSuggestions(data.results);
        }
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => setLoading(false));
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
    // Set the flag to true once both locations are selected
    if (positionA && positionB) setBothLocationsSelected(true);
  };

  // Handle the search logic for setting location
  const handleSearch = () => {
    if (suggestions.length > 0) {
      const { lat, lng } = suggestions[0].geometry;
      handleSuggestionClick(lat, lng);
    } else {
      alert('No suggestions found for this location');
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
    <div className="App">
      {/* Search Box for both Point A and Point B */}
      <div className="search-box">
        <input
          type="text"
          placeholder={`Search for ${isPointA ? 'Start' : 'Destination'} Location`}
          value={searchQuery}
          onChange={handleSearchChange}
          style={{
            padding: '10px',
            margin: '20px',
            width: '300px',
            fontSize: '16px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            zIndex: 10, // Ensure search box stays above the map
          }}
        />
        <button
          onClick={() => setIsPointA(!isPointA)}
          style={{
            padding: '10px 15px',
            fontSize: '16px',
            borderRadius: '4px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            marginLeft: '10px',
            zIndex: 10, // Ensure button stays above the map
          }}
        >
          {isPointA ? 'Set Start Location' : 'Set Destination'}
        </button>
      </div>

      {/* Suggestions List */}
      {suggestions.length > 0 && (
        <div className="suggestions-list" style={{ padding: '10px', maxHeight: '200px', overflowY: 'auto' }}>
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="suggestion-item"
              onClick={() => handleSuggestionClick(suggestion.geometry.lat, suggestion.geometry.lng)}
              style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #ccc' }}
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
        {/* Marker for Point A */}
        <Marker position={positionA}>
          <Popup>Starting Location (Point A)</Popup>
        </Marker>

        {/* Marker for Point B */}
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
          style={{
            padding: '15px 20px',
            fontSize: '16px',
            borderRadius: '4px',
            backgroundColor: '#007BFF',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            margin: '20px',
            zIndex: 9999, // Ensure the button stays on top
            position: 'fixed', // Fixed positioning to keep it on the screen
            bottom: '20px', // Positioned at the bottom
            left: '50%',
            transform: 'translateX(-50%)', // Center it horizontally
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', // Add shadow for visibility
          }}
        >
          Get Safest Path
        </button>
      )}
    </div>
  );
}

export default App;
