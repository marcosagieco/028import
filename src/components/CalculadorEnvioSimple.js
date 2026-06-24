'use client';
import { useState } from 'react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';

const libraries = ['places'];
const centerLocal = { lat: -34.5562, lng: -58.4445 };

export default function CalculadorEnvioSimple({ address, setAddress, setZone, setShippingCost }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [autocomplete, setAutocomplete] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [calculando, setCalculando] = useState(false);

  const onPlaceChanged = () => {
    if (!autocomplete) return;
    const place = autocomplete.getPlace();
    if (!place.geometry || !place.formatted_address) return;

    const destCoords = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    };

    if (setAddress) setAddress(place.formatted_address);

    const components = place.address_components || [];
    const sub = components.find(c => c.types.includes('sublocality_level_1') || c.types.includes('neighborhood'));
    const loc = components.find(c => c.types.includes('locality'));
    if (setZone) setZone(sub?.long_name || loc?.long_name || 'CABA/GBA');

    setCalculando(true);
    setResultado(null);

    const service = new window.google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      {
        origins: ['Miñones y juramento, Belgrano, CABA'],
        destinations: [destCoords],
        travelMode: 'DRIVING',
      },
      (response, status) => {
        setCalculando(false);
        if (status === 'OK' && response.rows[0].elements[0].status === 'OK') {
          const km = response.rows[0].elements[0].distance.value / 1000;
          const pxKm = km >= 11 ? 900 : 1000;
          const precio = Math.ceil((km * pxKm) / 100) * 100;
          setResultado({ km: km.toFixed(1), precio });
          if (setShippingCost) setShippingCost(precio);
        }
      }
    );
  };

  if (!isLoaded) return (
    <div className="w-full py-3 px-4 bg-white border border-gray-200 rounded-xl text-[10px] font-bold text-gray-400 flex items-center gap-2 font-poppins">
      <i className="fas fa-circle-notch fa-spin text-[#fcdb00]"></i> Cargando...
    </div>
  );

  return (
    <div className="flex flex-col gap-2">
      <Autocomplete
        onLoad={setAutocomplete}
        onPlaceChanged={onPlaceChanged}
        options={{ componentRestrictions: { country: 'ar' } }}
      >
        <div className="flex items-end gap-2 border-b border-gray-800 pb-2 focus-within:border-[#fcdb00] transition-colors">
          <i className="fas fa-map-marker-alt text-[#fcdb00] text-sm flex-shrink-0 pointer-events-none mb-0.5"></i>
          <input
            type="text"
            placeholder="Ingresá tu dirección..."
            defaultValue={address}
            onChange={(e) => {
              if (setAddress) setAddress(e.target.value);
              if (!e.target.value && setShippingCost) { setShippingCost(0); setResultado(null); }
            }}
            className="flex-1 bg-transparent border-0 text-sm font-bold text-[#111111] outline-none transition-all placeholder:text-gray-400 font-poppins"
          />
          <span className="font-bebas text-xl uppercase tracking-widest text-[#111111] flex-shrink-0 -mb-1.5">Calcular Envío</span>
        </div>
      </Autocomplete>

      {calculando && (
        <div className="text-[10px] text-gray-400 font-bold font-poppins flex items-center gap-2 px-1">
          <i className="fas fa-circle-notch fa-spin text-[#fcdb00]"></i> Calculando...
        </div>
      )}

      {resultado && (
        <div className="bg-[#fcdb00]/10 border border-[#fcdb00] rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest font-poppins">
              <i className="fas fa-route mr-1"></i> {resultado.km} km
            </p>
            <p className="font-bebas text-xl text-[#111111] leading-none">
              Envío: ${resultado.precio.toLocaleString('es-AR')}
            </p>
          </div>
          <div className="w-7 h-7 bg-[#111111] rounded-full flex items-center justify-center text-[#fcdb00] text-xs">
            <i className="fas fa-check"></i>
          </div>
        </div>
      )}
    </div>
  );
}
