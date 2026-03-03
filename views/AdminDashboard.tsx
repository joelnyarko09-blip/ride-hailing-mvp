
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { COLORS } from '../constants';

const DATA = [
  { name: 'Mon', trips: 400, rev: 2400 },
  { name: 'Tue', trips: 300, rev: 1398 },
  { name: 'Wed', trips: 200, rev: 9800 },
  { name: 'Thu', trips: 278, rev: 3908 },
  { name: 'Fri', trips: 189, rev: 4800 },
  { name: 'Sat', trips: 239, rev: 3800 },
  { name: 'Sun', trips: 349, rev: 4300 },
];

export const AdminDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Platform Overview</h1>
            <p className="text-gray-500">Real-time metrics for Accra, Ghana</p>
          </div>
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold">Download Report</button>
            <button className="px-4 py-2 bg-[#FF6B00] text-white rounded-lg text-sm font-semibold">System Health: Good</button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Active Trips', val: '128', sub: '+12% from last hour', color: 'blue' },
            { label: 'Total Revenue', val: 'GHS 42.5k', sub: 'Last 24 hours', color: 'orange' },
            { label: 'CO2 Saved', val: '14.2 Tons', sub: 'Since launch', color: 'green' },
            { label: 'Trader Savings', val: '32%', sub: 'Avg per trip', color: 'indigo' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mb-1">{stat.val}</p>
              <p className="text-xs text-green-600 font-semibold">{stat.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold mb-6">Daily Trip Volume</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="trips" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold mb-6">Platform Revenue (GHS)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="rev" stroke={COLORS.secondary} strokeWidth={3} dot={{ r: 4, fill: COLORS.secondary }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold">Recent Driver Activity</h3>
            <button className="text-sm text-blue-600 font-semibold">View All</button>
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-400 text-xs font-bold uppercase">
              <tr>
                <th className="px-6 py-3">Driver</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Vehicle</th>
                <th className="px-6 py-3">Today Earnings</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { name: 'Kwame Mensah', status: 'Online', vehicle: 'Minivan', earnings: 'GHS 142' },
                { name: 'John Appiah', status: 'In Trip', vehicle: 'Motorcycle', earnings: 'GHS 98' },
                { name: 'Ebenezer Lartey', status: 'Offline', vehicle: 'Truck', earnings: 'GHS 550' },
              ].map((row, i) => (
                <tr key={i} className="text-sm">
                  <td className="px-6 py-4 font-medium">{row.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.status === 'Online' ? 'bg-green-100 text-green-600' : row.status === 'In Trip' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{row.vehicle}</td>
                  <td className="px-6 py-4 font-bold">{row.earnings}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-gray-400 hover:text-gray-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
