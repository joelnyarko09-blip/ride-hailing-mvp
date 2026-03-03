import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { Trip, TripStatus, VehicleType, TripMode } from '../types';
import { COLORS } from '../constants';

const MOCK_TRIPS: Trip[] = [
  {
    id: 't1',
    // Correcting the property name to match the Trip interface and adding missing isTradeTrip property
    passengerId: 'trader_1',
    isTradeTrip: true,
    stops: [
      { id: 's1', name: 'Makola Market', lat: 5.5, lng: -0.2, waitTime: 30, isCompleted: false },
      { id: 's2', name: 'Kaneshie', lat: 5.6, lng: -0.3, waitTime: 15, isCompleted: false },
    ],
    vehicleType: VehicleType.MINIVAN,
    mode: TripMode.SHARE_SAVE,
    status: TripStatus.PENDING,
    fare: 45.00,
    distanceKm: 18.2,
    createdAt: new Date().toISOString()
  }
];

export const DriverView: React.FC = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [view, setView] = useState<'DASHBOARD' | 'TRIP_DETAILS' | 'NAVIGATING'>('DASHBOARD');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [earnings, setEarnings] = useState(145.50);

  const handleAccept = () => setView('NAVIGATING');

  return (
    <div className="h-screen max-w-md mx-auto bg-gray-50 shadow-2xl overflow-hidden flex flex-col">
      <Header 
        title="Driver Dashboard" 
        rightAction={
          <button 
            onClick={() => setIsOnline(!isOnline)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${isOnline ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}
          >
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </button>
        } 
      />

      {view === 'DASHBOARD' && (
        <div className="p-4 space-y-6 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-400">Today's Earnings</p>
              <p className="text-xl font-bold">GHS {earnings}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-400">Trips Today</p>
              <p className="text-xl font-bold">4</p>
            </div>
          </div>

          {!isOnline ? (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-2xl">💤</div>
              <h3 className="font-bold text-lg text-gray-700">You're Offline</h3>
              <p className="text-sm text-gray-500">Go online to see available trips near you.</p>
            </div>
          ) : (
            <section>
              <h3 className="text-lg font-bold mb-4">Nearby Trips</h3>
              <div className="space-y-4">
                {MOCK_TRIPS.map(trip => (
                  <div key={trip.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-gray-800">{trip.stops.length} Stops • {trip.distanceKm} km</p>
                        <p className="text-xs text-gray-400">Pickup: {trip.stops[0].name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-orange-600">GHS {(trip.fare * 0.85).toFixed(2)}</p>
                        <p className="text-[10px] text-gray-400">Your Share (85%)</p>
                      </div>
                    </div>
                    <Button 
                      label="View Details" 
                      onClick={() => { setSelectedTrip(trip); setView('TRIP_DETAILS'); }} 
                      className="w-full py-2.5 rounded-2xl" 
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {view === 'TRIP_DETAILS' && selectedTrip && (
        <div className="p-4 space-y-6 flex-1 bg-white">
          <div className="bg-gray-50 p-6 rounded-3xl space-y-4">
             <div className="flex justify-between">
                <h3 className="text-xl font-bold">Trip Details</h3>
                <p className="text-green-600 font-bold">GHS {(selectedTrip.fare * 0.85).toFixed(2)}</p>
             </div>
             <div className="space-y-4">
                {selectedTrip.stops.map((s, idx) => (
                  <div key={s.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                       <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                       {idx < selectedTrip.stops.length - 1 && <div className="w-0.5 h-full bg-orange-200"></div>}
                    </div>
                    <div>
                       <p className="text-sm font-bold">{s.name}</p>
                       <p className="text-xs text-gray-500">{idx === 0 ? 'Pickup' : `Stop ${idx + 1}`} • {s.waitTime} min wait</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
          <div className="flex gap-3">
             <Button label="Back" onClick={() => setView('DASHBOARD')} variant="outline" className="flex-1" />
             <Button label="Accept Trip" onClick={handleAccept} className="flex-[2]" />
          </div>
        </div>
      )}

      {view === 'NAVIGATING' && selectedTrip && (
        <div className="flex-1 flex flex-col relative">
          <div className="flex-1 bg-gray-800 relative">
             <img src="https://picsum.photos/1000/1000?blur=5" alt="map" className="w-full h-full object-cover opacity-60" />
             <div className="absolute top-4 left-4 right-4 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-4">
                <div className="bg-orange-600 p-3 rounded-xl text-white">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
                <div>
                   <p className="text-xs text-gray-400 uppercase font-bold">Next Turn: 200m</p>
                   <p className="text-lg font-bold">Turn Right on Independence Ave</p>
                </div>
             </div>
          </div>
          <div className="bg-white p-6 rounded-t-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.1)] space-y-4">
             <div className="flex justify-between items-center">
                <div>
                   <p className="text-xs text-gray-400">Next Destination</p>
                   <h3 className="text-xl font-bold">{selectedTrip.stops[0].name}</h3>
                </div>
                <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-2xl font-bold">
                   4.2 km
                </div>
             </div>
             <Button 
                label="Arrived at Stop" 
                onClick={() => {
                  setEarnings(e => e + (selectedTrip.fare * 0.85));
                  setView('DASHBOARD');
                  alert("Trip Completed! GHS " + (selectedTrip.fare * 0.85).toFixed(2) + " added to wallet.");
                }} 
                className="w-full" 
              />
          </div>
        </div>
      )}

      <nav className="bg-white border-t border-gray-100 px-6 py-4 flex justify-between items-center text-gray-400">
        <button className="text-orange-600"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg></button>
        <button><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg></button>
        <button><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" /></svg></button>
      </nav>
    </div>
  );
};