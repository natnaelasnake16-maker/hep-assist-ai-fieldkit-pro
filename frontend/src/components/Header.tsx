/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { 
  getAppPrefs, 
  updateAppPrefs, 
  checkBackendHealth, 
  subscribeToStateChanges 
} from '../services/api';
import { 
  Activity, 
  Globe, 
  RefreshCw, 
  User, 
  Wifi, 
  WifiOff, 
  Sparkles,
  UserRound,
  ShieldAlert,
  BarChart3,
  Cpu
} from 'lucide-react';
import { UserRole } from '../types';

export default function Header() {
  const [prefs, setPrefs] = useState(getAppPrefs());
  const [isOnline, setIsOnline] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Initial fetch
    testConnection();

    // Subscribe to preference updates
    const unsubscribe = subscribeToStateChanges(() => {
      setPrefs(getAppPrefs());
    });

    // Periodic connection checking
    const interval = setInterval(() => {
      testConnection();
    }, 15000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const testConnection = async () => {
    setChecking(true);
    const health = await checkBackendHealth();
    setIsOnline(health);
    setChecking(false);
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateAppPrefs({ role: e.target.value as UserRole });
  };

  const handleLangToggle = () => {
    updateAppPrefs({ language: prefs.language === 'en' ? 'am' : 'en' });
  };

  const handleSyncClick = async () => {
    testConnection();
  };

  // Switch role icon
  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'HEW':
        return <UserRound className="w-4 h-4 text-emerald-600" />;
      case 'Supervisor':
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      case 'MERL':
        return <BarChart3 className="w-4 h-4 text-blue-650 text-blue-600" />;
      case 'AI_Engineer':
        return <Cpu className="w-4 h-4 text-slate-700" />;
      default:
        return <User className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <header className="bg-white border-b border-slate-300 px-6 py-3.5 shrink-0 flex items-center justify-between gap-4 sticky top-0 z-40">
      {/* Platform Title */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#0F2A43] text-teal-405 text-emerald-400 rounded-lg shrink-0 flex items-center justify-center">
          <Activity className="w-4.5 h-4.5 text-emerald-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-sans font-bold text-base md:text-[17px] tracking-tight text-[#0F172A] leading-none">
              HEP Assist <span className="text-blue-700 font-extrabold">AI</span>
            </h1>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
              Clinical FieldKit
            </span>
          </div>
          <p className="text-[11px] text-[#475569] font-sans mt-1 leading-none hidden sm:block font-medium">
            {prefs.language === 'en' 
              ? 'Evidence-Based Decision Support System' 
              : 'በማስረጃ ላይ የተመሰረተ የሕክምና ውሳኔ ረዳት የ front-line ድጋፍ'}
          </p>
        </div>
      </div>

      {/* Control Widgets */}
      <div className="flex items-center gap-3 ml-auto">
        
        {/* Connection status badge */}
        <div className="flex items-center">
          {prefs.simulateOffline ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              <WifiOff className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Offline Mode</span>
            </span>
          ) : isOnline ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-250">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Clinical API Connected</span>
              <span className="sm:hidden">Connected</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-205">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
              <WifiOff className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Local Clinical Cache</span>
              <span className="sm:hidden">Local</span>
            </span>
          )}
        </div>

        {/* Sync Indicator */}
        <button 
          onClick={handleSyncClick}
          disabled={checking}
          title="Force health check & sync state"
          className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${checking ? 'animate-spin text-blue-700' : ''}`} />
        </button>

        {/* Model Engine Status */}
        {prefs.role !== 'HEW' && (
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 font-mono">
            <span className="w-1 h-1 bg-blue-500 rounded-full" />
            <span className="text-[10px] text-slate-400 font-sans uppercase font-bold">Model Engine:</span>
            <span className="font-bold text-slate-800 text-[10px]">
              {prefs.simulateOffline 
                ? 'Local Rules Engine' 
                : isOnline 
                  ? 'Hosted Clinical Inference' 
                  : 'Ollama: qwen2.5:1.5b'
              }
            </span>
          </div>
        )}

        {/* Language Toggle */}
        <button
          onClick={handleLangToggle}
          className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <Globe className="w-3.5 h-3.5 text-[#64748B]" />
          <span className="hidden sm:inline">{prefs.language === 'en' ? 'አማርኛ (AM)' : 'English (EN)'}</span>
          <span className="sm:hidden">{prefs.language === 'en' ? 'አማ' : 'EN'}</span>
        </button>

        {/* Role Selector Trigger */}
        <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-slate-50 rounded-lg border border-slate-200 h-9 shrink-0">
          <div className="shrink-0">
            {getRoleIcon(prefs.role)}
          </div>
          <select
            value={prefs.role}
            onChange={handleRoleChange}
            className="text-xs bg-transparent border-none text-[#0F172A] rounded-md font-sans font-semibold focus:outline-none cursor-pointer pr-1"
          >
            <option value="HEW">HEW Portal</option>
            <option value="Supervisor">Supervisor Desk</option>
            <option value="MERL">MERL Analytics</option>
            <option value="AI_Engineer">AI Eng Console</option>
          </select>
        </div>

      </div>
    </header>
  );
}
