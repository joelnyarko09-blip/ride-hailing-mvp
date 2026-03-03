import React, { useState } from 'react';
import { UserRole } from './types';
import UserView from './Userview';
import DriverView from './Driverview';
import { AdminDashboard } from './views/AdminDashboard';
import { Button } from './components/Button';
import { COLORS } from './constants';
import { Signup } from './signup';
import { isSupabaseConfigured } from './supabase';

const Splash: React.FC<{ onSelect: (role: UserRole) => void }> = ({ onSelect }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 space-y-12 text-center max-w-md mx-auto shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

      <div className="space-y-4 z-10">
        <div className="w-20 h-20 bg-[#FF6B00] rounded-[2.5rem] mx-auto flex items-center justify-center shadow-2xl rotate-12 mb-6">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
        <h1 className="text-6xl font-black italic tracking-tighter" style={{ color: COLORS.primary }}>DROP</h1>
        <div className="space-y-1">
          <p className="text-gray-900 font-bold text-lg">Multi-Stop Optimization</p>
          <p className="text-gray-400 text-sm">For People, Traders, Commuters & Everyone else.</p>
        </div>
      </div>

      <div className="w-full space-y-4 z-10">
        <Button
          label="I am a Passenger"
          onClick={() => onSelect(UserRole.PASSENGER)}
          className="w-full h-16 text-lg shadow-xl"
          icon={<span className="text-2xl">Passenger</span>}
        />
        <Button
          label="I am a Driver"
          onClick={() => onSelect(UserRole.DRIVER)}
          variant="secondary"
          className="w-full h-16 text-lg shadow-xl bg-blue-700"
          icon={<span className="text-2xl">Driver</span>}
        />
        <button
          onClick={() => onSelect(UserRole.ADMIN)}
          className="text-gray-400 text-xs font-bold hover:text-gray-600 transition-colors pt-4 tracking-widest uppercase"
        >
          Administrator Portal
        </button>
      </div>

      <div className="absolute bottom-8 text-[10px] text-gray-300 uppercase tracking-[4px] font-bold">
        Accra - Ghana
      </div>
    </div>
  );
};

type AppScreen = 'SPLASH' | 'SIGNUP' | 'PASSENGER' | 'DRIVER' | 'ADMIN'

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>('SPLASH');
  const isMapboxConfigured = Boolean(import.meta.env.VITE_MAPBOX_TOKEN);

  const handleRoleSelect = (role: UserRole) => {
    if (role === UserRole.PASSENGER) {
      setScreen('SIGNUP')
      return
    }
    if (role === UserRole.DRIVER) {
      setScreen('DRIVER')
      return
    }
    setScreen('ADMIN')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {(!isSupabaseConfigured || !isMapboxConfigured) && (
        <div className="bg-yellow-100 text-yellow-900 border-b border-yellow-300 px-4 py-3 text-sm">
          Missing environment setup.
          {!isSupabaseConfigured && ' Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'}
          {!isMapboxConfigured && ' Add VITE_MAPBOX_TOKEN.'}
        </div>
      )}
      {screen === 'SPLASH' && <Splash onSelect={handleRoleSelect} />}
      {screen === 'SIGNUP' && (
        <Signup
          defaultRole="passenger"
          onBack={() => setScreen('SPLASH')}
          onContinue={() => setScreen('PASSENGER')}
        />
      )}
      {screen === 'PASSENGER' && <UserView />}
      {screen === 'DRIVER' && <DriverView />}
      {screen === 'ADMIN' && <AdminDashboard />}

      {screen !== 'SPLASH' && (
        <div className="fixed bottom-2 right-2 flex gap-2 opacity-10 hover:opacity-100 transition-opacity z-[1000]">
          <button className="bg-white px-2 py-1 text-[8px] rounded border" onClick={() => setScreen('SPLASH')}>Reset</button>
        </div>
      )}
    </div>
  );
};

export default App;
