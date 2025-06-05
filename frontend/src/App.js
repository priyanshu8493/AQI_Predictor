import logo from './logo.svg';
import './App.css';
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet';

function App() {
  return (
    <MapContainer center={[48.8566,2.3522]} zoom={13}>

      <TileLayer
      attribution= '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      url='https://tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      <Marker
        position={[48.8566,2.3522]}>
        <Popup>A testing marker</Popup>
      </Marker>


    </MapContainer>
    
  );
}

export default App;
