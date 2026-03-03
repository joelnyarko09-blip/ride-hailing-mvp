
import React, { useState, useEffect } from 'react';
import { Trip, TripMode, VehicleType, Stop, TripStatus } from '../types';
import { Button } from '../components/Button';
import { Header } from '../components/Header';
import { COLORS, PRICING, ACCRA_STOPS } from '../constants';

const PassengerHome: React.FC<{ onPlanTrip: () => void }> = ({ onPlanTrip }) => {
  return (
    <div className="p-4 space-y-6">
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <h2 className="text-2xl font-bold mb-2">Hello, welcome to Drop!</h2>
        <p className="text-orange-100 mb-6 text-sm">Save up to 40% on your daily runs across Accra.</p>
        <Button 
          label="Plan a New Trip" 
          onClick={onPlanTrip}
          variant="outline"
          className="bg-white border-none text-orange-600 w-full shadow-lg"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
           <p className="text-[10px] text-gray-400 font-bold uppercase">Total Saved</p>
           <p className="text-lg font-bold text-orange-600">GHS 450</p>
        </div>
        <div className="flex-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
           <p className="text-[10px] text-gray-400 font-bold uppercase">Carbon Footprint</p>
           <p className="text-lg font-bold text-green-600">-12kg CO2</p>
        </div>
      </div>

      <section>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          Recent Activity
          <span className="bg-gray-100 text-[10px] px-2 py-0.5 rounded-full text-gray-400">Past 7 days</span>
        </h3>
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gray-50 p-2 rounded-xl text-xl">
                   {i === 1 ? '🛍️' : '🚶'}
                </div>
                <div>
                  <p className="font-semibold text-sm">{i === 1 ? 'Market Run' : 'Office Commute'}</p>
                  <p className="text-[10px] text-gray-500">Oct 12 • 3 stops • 12.5km</p>
                </div>
              </div>
              <p className="font-bold text-gray-800">GHS {20 + i * 4}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-4 items-start">
        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.536 14.95a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 011.414-1.414l.707.707zM16 18a1 1 0 100-2h-1a1 1 0 100 2h1z" /></svg>
        </div>
        <div>
          <h4 className="font-bold text-blue-800 text-sm">Route Guard</h4>
          <p className="text-[11px] text-blue-700">Traffic is building up near Tema Station. Plan your commute before 4 PM to save 20 minutes.</p>
        </div>
      </div>
    </div>
  );
};

const TripPlanner: React.FC<{ onTripConfirmed: (trip: Trip) => void; onBack: () => void }> = ({ onTripConfirmed, onBack }) => {
  const [isTradeTrip, setIsTradeTrip] = useState(true);
  const [stops, setStops] = useState<Stop[]>([
    { id: '1', name: 'Starting Point', lat: 5.6037, lng: -0.1870, waitTime: 0, isCompleted: false },
  ]);
  const [vehicleType, setVehicleType] = useState<VehicleType>(VehicleType.CAR);
  const [mode, setMode] = useState<TripMode>(TripMode.SHARE_SAVE);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationData, setOptimizationData] = useState<any>(null);

  const optimizeRouteLocally = (currentStops: Stop[], tradeTrip: boolean) => {
    const sortedStopNames = [...currentStops].map(stop => stop.name).sort();
    const travelLegs = Math.max(currentStops.length - 1, 1);
    const totalDistanceKm = Number((travelLegs * (tradeTrip ? 4.8 : 3.6)).toFixed(1));
    const waitMins = currentStops.reduce((sum, stop) => sum + (stop.waitTime || 0), 0);
    const totalDurationMins = Math.round(totalDistanceKm * (tradeTrip ? 6.5 : 5.5) + waitMins);

    return {
      optimizedStopNames: sortedStopNames,
      totalDistanceKm,
      totalDurationMins,
      traderTip: tradeTrip
        ? "Group nearby market drops first to reduce loading delays."
        : "Leave 10 minutes earlier during peak school and office traffic."
    };
  };

  const addStop = () => {
    if (stops.length >= 6) return;
    const randomStop = ACCRA_STOPS[Math.floor(Math.random() * ACCRA_STOPS.length)];
    setStops([...stops, { 
      id: Math.random().toString(), 
      name: randomStop.name, 
      lat: randomStop.lat, 
      lng: randomStop.lng, 
      waitTime: isTradeTrip ? 20 : 5, 
      isCompleted: false 
    }]);
  };

  const removeStop = (id: string) => {
    if (stops.length <= 1) return;
    setStops(stops.filter(s => s.id !== id));
  };

  const calculateFare = () => {
    const dist = optimizationData?.totalDistanceKm || (stops.length * 4);
    let fare = PRICING.BASE_FARE + (dist * PRICING.PER_KM) + (stops.length * PRICING.PER_STOP);
    if (mode === TripMode.SHARE_SAVE) fare *= (1 - PRICING.SHARE_SAVE_DISCOUNT);
    return Math.round(fare * 100) / 100;
  };

  const runOptimization = async () => {
    setIsOptimizing(true);
    const data = optimizeRouteLocally(stops, isTradeTrip);
    setOptimizationData(data);
    setIsOptimizing(false);
  };

  useEffect(() => {
    if (stops.length > 1) {
      runOptimization();
    }
  }, [stops, isTradeTrip]);

  return (
    <div className="flex flex-col h-full bg-white">
      <Header title="New Trip" onBack={onBack} />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
        {/* Genius Adaptation Toggle */}
        <div className="bg-gray-100 p-1 rounded-2xl flex">
          <button 
            onClick={() => setIsTradeTrip(true)}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${isTradeTrip ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500'}`}
          >
            📦 Trade Trip
          </button>
          <button 
            onClick={() => setIsTradeTrip(false)}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${!isTradeTrip ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
          >
            🚶 Commute
          </button>
        </div>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-700 text-sm">{isTradeTrip ? 'Delivery Stops' : 'Destinations'}</h3>
            <button 
              onClick={addStop}
              className="text-orange-600 font-semibold text-xs flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              Add Stop
            </button>
          </div>
          <div className="space-y-3">
            {stops.map((stop, idx) => (
              <div key={stop.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isTradeTrip ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{stop.name}</p>
                  {idx > 0 && <p className="text-[10px] text-gray-400">{stop.waitTime} min {isTradeTrip ? 'loading' : 'wait'}</p>}
                </div>
                {idx > 0 && (
                  <button onClick={() => removeStop(stop.id)} className="text-gray-300 hover:text-red-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="font-bold text-gray-700 mb-3 text-sm">Vehicle Class</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { type: VehicleType.MOTORCYCLE, label: 'Express', icon: '🏍️', cap: isTradeTrip ? '1-2 Bags' : '1 Seat' },
              { type: VehicleType.CAR, label: 'Comfort', icon: '🚗', cap: isTradeTrip ? '3-5 Bags' : '4 Seats' },
              { type: VehicleType.MINIVAN, label: 'Trotro', icon: '🚐', cap: isTradeTrip ? '6-15 Bags' : 'Eco-Shared' },
              { type: VehicleType.TRUCK, label: 'Heavy', icon: '🚚', cap: isTradeTrip ? '16+ Bags' : 'Large Group' },
            ].map(v => (
              <button
                key={v.type}
                onClick={() => setVehicleType(v.type)}
                className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${vehicleType === v.type ? 'border-orange-500 bg-orange-50' : 'border-gray-100 bg-white'}`}
              >
                <span className="text-xl">{v.icon}</span>
                <span className="font-bold text-sm">{v.label}</span>
                <span className="text-[10px] text-gray-500">{v.cap}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="font-bold text-gray-700 mb-3 text-sm">Mode</h3>
          <div className="flex gap-3">
            <button 
              onClick={() => setMode(TripMode.SHARE_SAVE)}
              className={`flex-1 p-4 rounded-2xl border-2 transition-all text-left ${mode === TripMode.SHARE_SAVE ? 'border-orange-500 bg-orange-50' : 'border-gray-100'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-sm">{isTradeTrip ? 'Share & Save' : 'Carpool'}</span>
                <span className="bg-green-100 text-green-600 text-[10px] px-2 py-0.5 rounded-full font-bold">-30%</span>
              </div>
              <p className="text-[10px] text-gray-500">Shared with others</p>
            </button>
            <button 
              onClick={() => setMode(TripMode.PRIVATE)}
              className={`flex-1 p-4 rounded-2xl border-2 transition-all text-left ${mode === TripMode.PRIVATE ? 'border-orange-500 bg-orange-50' : 'border-gray-100'}`}
            >
              <span className="font-bold text-sm block mb-1">Private</span>
              <p className="text-[10px] text-gray-500">Direct & Exclusive</p>
            </button>
          </div>
        </section>

        {optimizationData && (
          <div className={`rounded-2xl p-4 border ${isTradeTrip ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'}`}>
            <h4 className={`font-bold text-sm mb-1 flex items-center gap-1 ${isTradeTrip ? 'text-orange-800' : 'text-blue-800'}`}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.4503-.103c-.328.311-.645.641-.947.987a11.517 11.517 0 00-1.997 2.912c-.52.986-.852 2.05-.852 3.151 0 .285.016.568.048.847l-1.344.908a1 1 0 00-.332 1.353l.5 1.05a1 1 0 001.353.332l1.344-.908c.28.032.563.048.848.048.435 0 .864-.041 1.282-.12l.656 1.344a1 1 0 001.352.332l1.05-.5a1 1 0 00.332-1.353l-.656-1.344c.482-.418.887-.923 1.196-1.503.498-.946.815-1.967.815-3.023 0-1.056-.317-2.077-.815-3.023a11.517 11.517 0 00-1.997-2.912 11.524 11.524 0 00-.947-.987z" clipRule="evenodd" /></svg>
              Route Summary
            </h4>
            <p className={`text-xs italic ${isTradeTrip ? 'text-orange-700' : 'text-blue-700'}`}>"{optimizationData.traderTip}"</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-gray-100 flex flex-col gap-3">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[10px] text-gray-400">Total Estimate</p>
            <p className="text-2xl font-bold text-gray-800">GHS {calculateFare()}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400">Est. Distance</p>
            <p className="font-semibold text-gray-600 text-sm">{optimizationData?.totalDistanceKm || (stops.length * 4)} km</p>
          </div>
        </div>
        <Button 
          label={isOptimizing ? "Calculating..." : "Book Now"} 
          onClick={() => onTripConfirmed({
            id: 'trip_' + Math.random().toString(36).substr(2, 9),
            passengerId: 'p_123',
            stops,
            vehicleType,
            mode,
            status: TripStatus.PENDING,
            fare: calculateFare(),
            distanceKm: optimizationData?.totalDistanceKm || stops.length * 4,
            createdAt: new Date().toISOString(),
            isTradeTrip
          })}
          disabled={isOptimizing || stops.length < 2}
        />
      </div>
    </div>
  );
};

const ActiveTripView: React.FC<{ trip: Trip; onComplete: () => void }> = ({ trip, onComplete }) => {
  const [progress, setProgress] = useState(0); 
  
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(p => (p < 100 ? p + 5 : 100));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  if (progress === 100) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-2xl font-bold">Arrived Safe!</h2>
        <p className="text-gray-500">GHS {trip.fare} payment successful.</p>
        <div className="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2 text-sm">
          <div className="flex justify-between font-bold text-lg"><span>Total Fare</span><span>GHS {trip.fare}</span></div>
          <p className="text-[10px] text-gray-400 text-left pt-2">Detailed receipt sent to your phone via SMS.</p>
        </div>
        <Button label="Back to Home" onClick={onComplete} className="w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      <Header title="On the Move" rightAction={<Button label="SOS" onClick={() => alert("SOS Triggered!")} variant="danger" className="py-1 px-4 text-xs" />} />
      
      <div className="flex-1 bg-gray-200 relative overflow-hidden">
         <img src="https://picsum.photos/800/800?grayscale" alt="map" className="w-full h-full object-cover opacity-50" />
         <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center border-4 border-white shadow-xl animate-pulse">
                 <span className="text-xl">🚐</span>
              </div>
            </div>
         </div>
      </div>

      <div className="bg-white p-6 rounded-t-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.1)] space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-orange-600 font-bold uppercase tracking-wider">Next Stop</p>
            <h3 className="text-xl font-bold">{trip.stops[1]?.name || 'Final Destination'}</h3>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400">ETA</p>
            <p className="text-lg font-bold text-gray-800">12 mins</p>
          </div>
        </div>

        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
          <div className="bg-orange-500 h-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-2xl">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-100 text-xl shadow-sm">
            👨🏾‍🦱
          </div>
          <div className="flex-1">
            <p className="font-bold text-xs">Kwame Mensah</p>
            <p className="text-[10px] text-gray-500">Minivan (GT-884-21) • 4.9★</p>
          </div>
          <button className="p-3 bg-white rounded-full shadow-sm text-blue-600"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg></button>
        </div>
      </div>
    </div>
  );
};

export const TraderView: React.FC = () => {
  const [view, setView] = useState<'HOME' | 'PLANNER' | 'ACTIVE'>('HOME');
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);

  const handleTripConfirmed = (trip: Trip) => {
    setActiveTrip(trip);
    setView('ACTIVE');
  };

  return (
    <div className="h-screen max-w-md mx-auto bg-gray-50 shadow-2xl overflow-hidden flex flex-col">
      {view === 'HOME' && <PassengerHome onPlanTrip={() => setView('PLANNER')} />}
      {view === 'PLANNER' && <TripPlanner onBack={() => setView('HOME')} onTripConfirmed={handleTripConfirmed} />}
      {view === 'ACTIVE' && activeTrip && <ActiveTripView trip={activeTrip} onComplete={() => setView('HOME')} />}
    </div>
  );
};
