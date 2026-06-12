/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  getAppPrefs, 
  updateAppPrefs, 
  getSyncQueue, 
  forceSyncQueue, 
  subscribeToStateChanges 
} from '../services/api';
import { OfflineSyncItem } from '../types';
import { 
  WifiOff, 
  Wifi, 
  RefreshCw, 
  Database, 
  CheckCircle, 
  Download,
  Loader2,
  HardDrive
} from 'lucide-react';

export default function OfflineCenterPage() {
  const [prefs, setPrefs] = useState(getAppPrefs());
  const [queue, setQueue] = useState<OfflineSyncItem[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  useEffect(() => {
    setQueue(getSyncQueue());
    
    const unsubscribe = subscribeToStateChanges(() => {
      setPrefs(getAppPrefs());
      setQueue(getSyncQueue());
    });

    return unsubscribe;
  }, []);

  const handleOfflineToggle = (simulate: boolean) => {
    updateAppPrefs({ simulateOffline: simulate });
  };

  const handleForceSync = async () => {
    setSpinning(true);
    setSyncDone(false);
    
    // Simulate sync time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    forceSyncQueue();
    updateAppPrefs({ lastSyncTime: new Date().toISOString() });
    
    setQueue(getSyncQueue());
    setSpinning(false);
    setSyncDone(true);
    
    setTimeout(() => {
      setSyncDone(false);
    }, 3000);
  };

  // Human friendly last synced text
  const getSyncedText = () => {
    if (!prefs.lastSyncTime) return 'Never';
    const date = new Date(prefs.lastSyncTime);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (' + date.toLocaleDateString() + ')';
  };

  return (
    <div className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto bg-slate-50 select-none">
      
      {/* Title */}
      <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-sans font-bold text-slate-905 text-slate-900 tracking-tight flex items-center gap-2">
            <WifiOff className="w-5 h-5 text-blue-600 shrink-0 animate-pulse" />
            <span>On-Post Local Storage & Sync Gateway</span>
          </h2>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Orchestrate network cellular simulation states. Buffered patient logs and clinical ratings are preserved locally when offline.
          </p>
        </div>
        
        {syncDone && (
          <div className="p-2 py-3 bg-teal-50 border border-teal-300 text-teal-800 text-[11px] font-bold rounded-xl flex items-center gap-2 animate-pulse shadow-3xs shrink-0 self-start">
            <CheckCircle className="w-4.5 h-4.5 text-teal-600" />
            <span>Local sync buffers uploaded successfully to Ministry cluster.</span>
          </div>
        )}
      </div>

      {/* Grid summarizing offline configurations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans text-xs">
        
        {/* LEFT CARD: OFFLINE SIMULATION CONTROLLER */}
        <div className="bg-white border border-slate-205 border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-3xs">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <Wifi className="w-4.5 h-4.5 text-slate-400" />
            <span>Active Network Node State</span>
          </h3>

          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            Toggle communication states to verify fallback capabilities. Disconnecting forces all client analysis through local medical rule tables.
          </p>

          <div className="space-y-2.5">
            <button
              onClick={() => handleOfflineToggle(false)}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border font-bold text-xs transition-colors cursor-pointer ${
                !prefs.simulateOffline
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Wifi className="w-4.5 h-4.5 text-emerald-500" />
                <span>Simulate Online (Cloud APIs)</span>
              </div>
              {!prefs.simulateOffline && <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />}
            </button>

            <button
              onClick={() => handleOfflineToggle(true)}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border font-bold text-xs transition-colors cursor-pointer ${
                prefs.simulateOffline
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <WifiOff className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
                <span>Simulate Offline (Local buffer)</span>
              </div>
              {prefs.simulateOffline && <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />}
            </button>
          </div>

          <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-[10px]">
            <span className="text-slate-400 font-bold uppercase tracking-wider">Last Synced Timestamp</span>
            <span className="font-bold text-slate-805 font-mono">{getSyncedText()}</span>
          </div>
        </div>

        {/* MIDDLE/RIGHT CARD: SYNC QUEUE BUFFER STATUS */}
        <div className="lg:col-span-2 bg-white border border-slate-205 border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-3xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-105 border-slate-100 pb-2">
            <div>
              <h3 className="font-bold text-slate-905 text-slate-900 text-xs uppercase tracking-widest flex items-center gap-1.5">
                <Database className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Pending Synchronizers queue</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-1 leading-none">Diagnostic consultation data awaiting active upstream connection paths.</p>
            </div>
            
            <button
              onClick={handleForceSync}
              disabled={spinning || queue.length === 0}
              className="px-4 py-2.5 bg-slate-905 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-teal-400 font-mono font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-800 transition-all cursor-pointer"
            >
              {spinning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 text-teal-400" />}
              <span>DISPATCH CLOUD UPLOAD</span>
            </button>
          </div>

          <div className="flex-1 min-h-[200px] overflow-y-auto max-h-[300px]">
            {queue.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-slate-450 text-slate-400 text-xs space-y-2 py-10">
                <CheckCircle className="w-8 h-8 text-emerald-500 animate-pulse" />
                <p className="font-extrabold text-slate-800">Storage buffers are fully synchronized</p>
                <p className="text-[11px] text-slate-400 font-medium">All maternal and child registration packets have reached target registries.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs font-sans">
                {queue.map(item => (
                  <div key={item.id} className="py-3 flex justify-between items-center gap-4 text-slate-650">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-905">BATCH #{item.id.substring(item.id.length - 8).toUpperCase()}</span>
                        <span className="text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded px-1.5 uppercase font-mono">
                          {item.dataType}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 font-semibold">Captured: {new Date(item.timestamp).toLocaleString()}</p>
                    </div>

                    <div className="text-right">
                      {item.syncStatus === 'Pending' ? (
                        <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 rounded-full uppercase">
                          <Loader2 className="w-2.5 h-2.5 text-amber-500 animate-spin" />
                          <span>Buffered</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 rounded-full uppercase">
                          <CheckCircle className="w-2.5 h-2.5 text-teal-600" />
                          <span>Synced</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Visual storage analytics */}
      <div className="bg-white border border-slate-205 border-slate-200/85 rounded-2xl p-5 space-y-4 shadow-3xs text-xs">
        <h3 className="font-bold text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-1.5 select-none">
          <HardDrive className="w-4.5 h-4.5 text-slate-400" />
          <span>Local Storage Cache Footprint</span>
        </h3>
        
        <div className="flex flex-col sm:flex-row items-center gap-6 justify-between">
          <div className="space-y-1 text-center sm:text-left font-sans">
            <h4 className="font-extrabold text-slate-900">Kebele device cache allocation (IndexedDB Storage)</h4>
            <p className="text-slate-450 font-medium text-slate-400 leading-none mt-1">Current offline guidance, queue, and case cache footprint.</p>
          </div>

          <div className="flex items-center gap-3.5 w-full sm:w-80 font-mono font-bold text-slate-450 select-none">
            <span>1.2 MB</span>
            <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: '2.4%' }} />
            </div>
            <span>50 MB Limit</span>
          </div>
        </div>
      </div>

    </div>
  );
}
