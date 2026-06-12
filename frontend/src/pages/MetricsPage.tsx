/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Users, 
  Building,
  Heart,
  Globe,
  Sparkles
} from 'lucide-react';

const symptomFrequencyData = [
  { name: 'Cough (ሳል)', count: 485, color: '#2563eb' },
  { name: 'Fever (ትኩሳት)', count: 395, color: '#eab308' },
  { name: 'Fast Breath (ፈጣን ትንፋሽ)', count: 312, color: '#f43f5e' },
  { name: 'Diarrhea (ተቅማጥ)', count: 184, color: '#0d9488' },
  { name: 'Newborn Complications', count: 96, color: '#dc2626' },
  { name: 'Antepartum Bleeding', count: 54, color: '#991b1b' }
];

const consultationTrendsData = [
  { month: 'Jan', total: 110, offline: 40 },
  { month: 'Feb', total: 154, offline: 65 },
  { month: 'Mar', total: 245, offline: 110 },
  { month: 'Apr', total: 310, offline: 180 },
  { month: 'May', total: 420, offline: 250 },
  { month: 'Jun', total: 680, offline: 395 }
];

const urgencyDistributionData = [
  { name: 'Critical Emergency', value: 150, color: '#dc2626' },
  { name: 'Same-day Treatment', value: 430, color: '#eab308' },
  { name: 'Routine Home Care', value: 940, color: '#10b981' }
];

export default function MetricsPage() {
  return (
    <div className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto bg-slate-50 select-none">
      
      {/* Title */}
      <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-sans font-bold text-slate-905 text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Operational MERL Analytics & Epidemiological Caseloads</span>
          </h2>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            MOH real-time program monitoring dashboard illustrating clinical workflows, symptom trends, and caching utility rates.
          </p>
        </div>
        
        <span className="text-[10px] bg-slate-900 text-teal-400 font-mono font-bold px-3 py-1 rounded-xl uppercase border border-slate-800 self-start">
          Dataset version: 2026.Q2
        </span>
      </div>

      {/* Numerical Metrics Summary widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-sans">
        
        <div className="bg-white p-5 border border-slate-205 border-slate-200/80 rounded-2xl flex items-center gap-4 shadow-3xs hover:-translate-y-0.5 transition-transform">
          <div className="p-3 bg-blue-50 text-blue-650 text-blue-600 rounded-xl shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans">Active Clients Served</p>
            <p className="text-lg font-black text-slate-900 font-sans mt-0.5">1,520 Cases</p>
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-205 border-slate-200/80 rounded-2xl flex items-center gap-4 shadow-3xs hover:-translate-y-0.5 transition-transform">
          <div className="p-3 bg-teal-50 text-teal-605 text-teal-600 rounded-xl shrink-0">
            <TrendingUp className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans">MoM Volume growth</p>
            <p className="text-lg font-black text-slate-900 font-sans mt-0.5">+43.5% MoM</p>
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-205 border-slate-200/80 rounded-2xl flex items-center gap-4 shadow-3xs hover:-translate-y-0.5 transition-transform">
          <div className="p-3 bg-amber-50 text-amber-555 text-amber-500 rounded-xl shrink-0">
            <Activity className="w-5 h-5 shrink-0" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans">Reporting Posts</p>
            <p className="text-lg font-black text-slate-900 font-sans mt-0.5">142 Frontlines</p>
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-205 border-slate-200/80 rounded-2xl flex items-center gap-4 shadow-3xs hover:-translate-y-0.5 transition-transform">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans">Active Woreda nodes</p>
            <p className="text-lg font-black text-slate-900 font-sans mt-0.5">18 Districts</p>
          </div>
        </div>

      </div>

      {/* Grid containing charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">
        
        {/* Chart A: Case consultation trends */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-3xs">
          <div>
            <h3 className="font-sans font-extrabold text-slate-900 text-sm leading-tight">Patient consultation trends</h3>
            <p className="text-[11px] text-slate-400 font-sans">Cumulative consultation curves contrasted against local cached field synchronizations</p>
          </div>
          
          <div className="h-64 text-[10px] font-semibold">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={consultationTrendsData}>
                <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Legend />
                <Line type="monotone" name="Total Live Consultations" dataKey="total" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" name="Offline Caching Packets" dataKey="offline" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart B: Common clinical symptom prevalence */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-3xs">
          <div>
            <h3 className="font-sans font-extrabold text-slate-900 text-sm leading-tight">Prevalent clinical symptoms</h3>
            <p className="text-[11px] text-slate-400 font-sans">Aggregate statistics of symptom parameters flagged during intake sessions</p>
          </div>

          <div className="h-64 text-[10px] font-semibold">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={symptomFrequencyData} layout="vertical">
                <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" width={130} />
                <Tooltip />
                <Bar dataKey="count" name="Case Frequency" radius={[0, 4, 4, 0]}>
                  {symptomFrequencyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart C: Triage Urgency Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-3xs flex flex-col justify-between">
          <div>
            <h3 className="font-sans font-extrabold text-slate-900 text-sm leading-tight">Triage safety distribution</h3>
            <p className="text-[11px] text-slate-400 font-sans">Consultations mapped dynamically to standard IMNCI classification indices</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 justify-center py-4">
            <div className="w-48 h-48 text-[10px] shrink-0 font-semibold">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={urgencyDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {urgencyDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2.5 text-xs">
              {urgencyDistributionData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5 uppercase font-sans font-bold">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 min-w-[150px]">{item.name}:</span>
                  <span className="font-mono text-slate-405 text-slate-400">{item.value} Cases</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Table summary of districts */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3.5 shadow-3xs">
          <div>
            <h3 className="font-sans font-extrabold text-slate-900 text-sm leading-tight">Woreda coverage reports</h3>
            <p className="text-[11px] text-slate-400 font-sans">Active caseload coverage stats reported from regional supervising clusters</p>
          </div>

          <div className="divide-y divide-slate-100 text-xs font-sans">
            {[
              { woreda: "Debre Birhan (Amhara)", posts: 24, syncCode: "99.4% Sync", caseload: 345 },
              { woreda: "Ada'a (Oromia)", posts: 18, syncCode: "98.1% Sync", caseload: 284 },
              { woreda: "Arba Minch (Southern)", posts: 15, syncCode: "97.5% Sync", caseload: 195 },
              { woreda: "Konteb (Sidama)", posts: 12, syncCode: "100.0% Sync", caseload: 154 }
            ].map((row, idx) => (
              <div key={idx} className="py-3 flex justify-between items-center text-slate-600 hover:bg-slate-50/55 rounded px-1 transition-colors">
                <div>
                  <p className="font-extrabold text-slate-950 font-sans">{row.woreda}</p>
                  <p className="text-[10px] text-slate-450 text-slate-400 font-semibold mt-0.5">Active health stations: {row.posts}</p>
                </div>

                <div className="text-right">
                  <p className="font-black text-slate-900">{row.caseload} patients</p>
                  <p className="text-[10px] text-teal-600 font-extrabold uppercase mt-0.5">{row.syncCode}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
 
      </div>

    </div>
  );
}
