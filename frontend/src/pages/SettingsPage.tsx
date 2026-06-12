/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { getAppPrefs, updateAppPrefs, subscribeToStateChanges } from '../services/api';
import { Globe, Sliders, MapPin, User, Check } from 'lucide-react';

const REGIONS = ['Amhara', 'Oromia', 'Tigray', 'Sidama', 'Somali', 'Addis Ababa'];

export default function SettingsPage() {
  const [prefs, setPrefs] = useState(getAppPrefs());
  const [success, setSuccess] = useState(false);

  // Buffer inputs
  const [facility, setFacility] = useState(prefs.defaultFacility || '');
  const [woreda, setWoreda] = useState(prefs.defaultWoreda || '');
  const [region, setRegion] = useState(prefs.defaultRegion || 'Amhara');

  useEffect(() => {
    const unsub = subscribeToStateChanges(() => {
      const p = getAppPrefs();
      setPrefs(p);
    });
    return unsub;
  }, []);

  const handleLangToggle = (lang: 'en' | 'am') => {
    updateAppPrefs({ language: lang });
  };

  const handleSaveParameters = (e: React.FormEvent) => {
    e.preventDefault();
    updateAppPrefs({
      defaultFacility: facility.trim(),
      defaultWoreda: woreda.trim(),
      defaultRegion: region
    });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2500);
  };

  return (
    <div className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto bg-slate-50 select-none">
      
      {/* Title */}
      <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-sans font-bold text-slate-905 text-slate-900 tracking-tight flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600 shrink-0" />
            <span>Regional Profiles & System Customization</span>
          </h2>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Configure local kebele coordinates and default health post associations to accelerate cases logging.
          </p>
        </div>

        {success && (
          <div className="p-2 py-3 bg-teal-50 border border-teal-300 text-teal-800 text-[11px] font-bold rounded-xl flex items-center gap-1.5 animate-pulse shadow-3xs shrink-0 self-start">
            <Check className="w-4 h-4 text-teal-605 text-teal-600" />
            <span>Facility profile coordinates saved.</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans text-xs">
        
        {/* PROFILE SETTINGS FORM */}
        <div className="bg-white border border-slate-205 border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-3xs">
          <h3 className="font-bold text-slate-905 text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
            <User className="w-4.5 h-4.5 text-blue-500 shrink-0" />
            <span>Health Post Registry Profile</span>
          </h3>

          <form onSubmit={handleSaveParameters} className="space-y-4 text-xs font-sans">
            
            <div className="space-y-1.5">
              <label className="font-bold text-slate-600">Default Health Post / Clinic Name</label>
              <input
                type="text"
                value={facility}
                onChange={e => setFacility(e.target.value)}
                placeholder="e.g., Tebase Health Post"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-medium select-all focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-605">Default Woreda (ወረዳ) Zone</label>
              <input
                type="text"
                value={woreda}
                onChange={e => setWoreda(e.target.value)}
                placeholder="e.g., Debre Birhan"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-610 text-slate-600">Default Regional Administration Zone</label>
              <select
                value={region}
                onChange={e => setRegion(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 font-bold focus:outline-none"
              >
                {REGIONS.map(reg => (
                  <option key={reg} value={reg}>{reg}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-slate-905 bg-slate-900 hover:bg-slate-800 text-teal-400 font-mono font-bold border border-slate-800 rounded-xl text-xs transition-transform hover:scale-[1.01] shadow-sm flex items-center justify-center gap-1.5 cursor-pointer mt-1"
            >
              <span>SAVE CODES CONFIGURATION</span>
            </button>

          </form>
        </div>

        {/* SYSTEM OVERRIDES */}
        <div className="space-y-6">
          
          {/* Language selection card */}
          <div className="bg-white border border-slate-205 border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-3xs">
            <h3 className="font-bold text-slate-905 text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
              <Globe className="w-4.5 h-4.5 text-blue-500 shrink-0" />
              <span>Language Preference</span>
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Alter clinical presentation rules across dual-language English and Amharic locales.
            </p>

            <div className="grid grid-cols-2 gap-2.5 text-xs font-bold font-sans">
              <button
                type="button"
                onClick={() => handleLangToggle('en')}
                className={`py-2.5 p-3 rounded-xl border text-center transition-colors cursor-pointer ${
                  prefs.language === 'en'
                    ? 'p-2 bg-slate-905 bg-slate-900 text-white border-slate-950 shadow-3xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200'
                }`}
              >
                English Standard
              </button>

              <button
                type="button"
                onClick={() => handleLangToggle('am')}
                className={`py-2.5 p-3 rounded-xl border text-center transition-colors cursor-pointer ${
                  prefs.language === 'am'
                    ? 'p-2 bg-slate-905 bg-slate-900 text-white border-slate-950 shadow-3xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200'
                }`}
              >
                አማርኛ (Amharic)
              </button>
            </div>
          </div>

          {/* GPS placement */}
          <div className="bg-white border border-slate-205 border-slate-200/85 rounded-2xl p-5 space-y-4 shadow-3xs">
            <h3 className="font-bold text-slate-905 text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
              <MapPin className="w-4.5 h-4.5 text-rose-500 shrink-0 animate-bounce" />
              <span>Frontline Diagnostic GPS coordinates</span>
            </h3>

            <p className="text-xs text-slate-500 leading-normal font-semibold">
              On-post telemetry coordinates registered automatically for diagnostic reporting logs.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono text-slate-700 pt-1">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl select-all shadow-inner">
                <p className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">GEO-LATITUDE</p>
                <p className="font-bold text-slate-950 mt-1">9.6009° N</p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl select-all shadow-inner">
                <p className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">GEO-LONGITUDE</p>
                <p className="font-bold text-slate-955 text-slate-950 mt-1">39.6383° E</p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
