/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { getAppPrefs, updateAppPrefs, getSystemPrompts, saveSystemPrompt, restoreDefaultPrompts } from '../services/api';
import { Cpu, AlertTriangle, Save, Layers, CheckCircle, RefreshCw, Sliders, Settings } from 'lucide-react';

export default function ModelOpsPage() {
  const [prefs, setPrefs] = useState(getAppPrefs());
  const [prompts, setPrompts] = useState(getSystemPrompts());
  const [activeTabPrompt, setActiveTabPrompt] = useState<'child' | 'maternal'>('child');
  const [editedPrompt, setEditedPrompt] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const [confirmRestore, setConfirmRestore] = useState(false);

  useEffect(() => {
    setEditedPrompt(activeTabPrompt === 'child' ? prompts.childTriage : prompts.maternalTriage);
  }, [activeTabPrompt, prompts]);

  const handleApplyPrefs = (fields: Partial<typeof prefs>) => {
    const updated = updateAppPrefs(fields);
    setPrefs(updated);
  };

  const handleSavePrompt = () => {
    saveSystemPrompt(activeTabPrompt === 'child' ? 'childTriage' : 'maternalTriage', editedPrompt);
    setPrompts(getSystemPrompts());
    setSavedMessage('SUCCESS: System prompt template updated in active memory logs.');
    setTimeout(() => setSavedMessage(''), 2500);
  };

  const handleRestoreDefaults = () => {
    if (!confirmRestore) {
      setConfirmRestore(true);
      setTimeout(() => setConfirmRestore(false), 4000);
      return;
    }
    restoreDefaultPrompts();
    setPrompts(getSystemPrompts());
    setConfirmRestore(false);
    setSavedMessage('SUCCESS: Reverted templates to MOH factory standards.');
    setTimeout(() => setSavedMessage(''), 2500);
  };

  return (
    <div className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto bg-slate-50 select-none">
      
      {/* Title */}
      <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-sans font-bold text-slate-905 text-slate-900 tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-600 animate-pulse shrink-0" />
            <span>Local Model Operations (Model Ops)</span>
          </h2>
          <p className="text-xs text-slate-500 font-sans mt-0.5 font-sans leading-relaxed">
            Customize core inference templates, temperature coordinates, and local vector database RAG parameters.
          </p>
        </div>
        
        {savedMessage && (
          <div className="p-2 px-3 bg-teal-50 border border-teal-300 text-teal-800 text-[11px] font-bold rounded-xl flex items-center gap-1.5 animate-pulse shadow-3xs shrink-0 self-start">
            <CheckCircle className="w-4 h-4 text-teal-605 text-teal-600" />
            <span>{savedMessage}</span>
          </div>
        )}
      </div>

      {/* Primary configuration columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans text-xs">
        
        {/* LEFT COLUMN: ACTIVE MODEL ENGINE & DEPLOYMENT PARAMETERS */}
        <div className="bg-white border border-slate-205 border-slate-200/80 rounded-2xl p-5 space-y-5 shadow-3xs">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
            <Layers className="w-4.5 h-4.5 text-blue-500 shrink-0" />
            <span>Core Model Profile</span>
          </h3>

          {/* Local vs Cloud Active selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600">Model Deployment Architecture</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              
              <button
                type="button"
                onClick={() => handleApplyPrefs({ simulateOffline: false })}
                className={`py-2.5 px-3 rounded-xl border text-center font-bold font-sans transition-colors cursor-pointer ${
                  !prefs.simulateOffline
                    ? 'bg-slate-905 bg-slate-900 text-white border-slate-950 shadow-3xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200'
                }`}
              >
                Gemini Cloud API
              </button>

              <button
                type="button"
                onClick={() => handleApplyPrefs({ simulateOffline: true })}
                className={`py-2.5 px-3 rounded-xl border text-center font-bold font-sans transition-colors cursor-pointer ${
                  prefs.simulateOffline
                    ? 'bg-blue-600 text-white border-blue-600 shadow-3xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200'
                }`}
              >
                Ollama Local LLM
              </button>

            </div>
          </div>

          {/* Model selection list */}
          <div className="space-y-1.5 pt-1 select-none">
            <label className="text-xs font-bold text-slate-650">Active Model Profile</label>
            <select
              value={prefs.simulateOffline ? 'qwen2.5:1.5b' : 'gemini-3.5-flash'}
              disabled
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 font-bold font-mono focus:outline-none"
            >
              {prefs.simulateOffline ? (
                <option value="qwen2.5:1.5b">Ollama: qwen2.5:1.5b-instruct-q4</option>
              ) : (
                <option value="gemini-3.5-flash">Google: gemini-3.5-flash (Grounded RAG)</option>
              )}
            </select>
          </div>

          {/* Sliders parameters */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            
            <div className="space-y-2">
              <div className="flex justify-between items-center select-none">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-slate-400" />
                  <span>LLM Generation Temperature</span>
                </label>
                <span className="text-[10px] font-mono font-bold bg-slate-150 bg-slate-100 border border-slate-200 px-2 rounded">0.15</span>
              </div>
              <input 
                type="range" 
                min="0.0" 
                max="1.0" 
                step="0.05" 
                defaultValue="0.15" 
                className="w-full h-1 bg-slate-200 accent-blue-600 rounded-lg cursor-pointer" 
              />
              <p className="text-[10px] text-slate-450 leading-normal font-medium text-slate-400">Low temperature values force highly deterministic grounding outcomes.</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center select-none">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>RAG Chunk Size (Context Length)</span>
                </label>
                <span className="text-[10px] font-mono font-bold bg-slate-100 border border-slate-200 px-2 rounded">512 Tokens</span>
              </div>
              <input 
                type="range" 
                min="128" 
                max="1024" 
                step="64" 
                defaultValue="512" 
                className="w-full h-1 bg-slate-200 accent-blue-600 rounded-lg cursor-pointer" 
              />
              <p className="text-[10px] text-slate-450 leading-normal font-medium text-slate-400">Context bounds aligned to hardware RAM constraints.</p>
            </div>

          </div>

        </div>

        {/* MIDDLE/RIGHT COLUMN: MODEL SYSTEM PROMPT TEMPLATING DESK */}
        <div className="lg:col-span-2 bg-white border border-slate-205 border-slate-200 rounded-2xl p-5 space-y-4 shadow-3xs">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-2">
            <div>
              <h3 className="font-bold text-slate-905 text-slate-900 text-xs uppercase tracking-widest">
                Active System Instruction Prompts
              </h3>
              <p className="text-[10px] text-slate-400 leading-none mt-1">Configure structural instructions appended on every model execution.</p>
            </div>

            {/* Prompt category switch */}
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 shrink-0 select-none">
              <button
                type="button"
                onClick={() => setActiveTabPrompt('child')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTabPrompt === 'child' ? 'bg-white text-slate-900 shadow-3xs' : 'text-slate-500 hover:text-slate-750'
                }`}
              >
                Child iCCM Regimen
              </button>
              <button
                type="button"
                onClick={() => setActiveTabPrompt('maternal')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTabPrompt === 'maternal' ? 'bg-white text-slate-900 shadow-3xs' : 'text-slate-500 hover:text-slate-755'
                }`}
              >
                Maternal ANC Regimen
              </button>
            </div>
          </div>

          {/* Text editor box */}
          <div className="space-y-4">
            <textarea
              rows={13}
              value={editedPrompt}
              onChange={e => setEditedPrompt(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs leading-relaxed text-slate-700 select-all focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-inner"
            />

            <div className="flex flex-col sm:flex-row gap-2.5 justify-end pt-1 select-none">
              <button
                onClick={handleRestoreDefaults}
                type="button"
                className={`px-4 py-2.5 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  confirmRestore 
                    ? 'bg-rose-50 text-rose-700 border-rose-350 border-rose-300 animate-pulse' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-550 hover:text-slate-900'
                }`}
              >
                {confirmRestore ? 'Click again to confirm revert' : 'Revert to MOH Defaults'}
              </button>

              <button
                onClick={handleSavePrompt}
                type="button"
                className="px-5 py-2.5 bg-slate-905 bg-slate-900 text-teal-400 font-mono font-bold rounded-xl text-xs border border-slate-800 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-transform hover:scale-[1.01]"
              >
                <Save className="w-4 h-4 text-teal-400" />
                <span>SAVE PROMPT CONFIG</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Model monitoring latency widgets */}
      <div className="bg-slate-900 text-slate-400 p-5 rounded-2xl space-y-4 border border-slate-850 shadow-sm relative select-none">
        <h4 className="text-white font-sans font-bold text-xs uppercase tracking-widest flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Local Ollama Embedded Instance Telemetry Stats</span>
        </h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850/60 shadow-3xs">
            <p className="text-slate-500 text-[10px]">DAEMON STATUS:</p>
            <p className="text-emerald-450 text-emerald-400 font-bold mt-1 text-[11px]">● ACTIVE / ON-PREMISE</p>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850/60 shadow-3xs">
            <p className="text-slate-500 text-[10px]">DAEMON SOCKET:</p>
            <p className="text-teal-400 font-bold mt-1 text-[11px]">127.0.0.1:11434</p>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850/60 shadow-3xs">
            <p className="text-slate-500 text-[10px]">AVG TOKEN VOL:</p>
            <p className="text-amber-500 font-bold mt-1 text-[11px]">1,024 Tokens/s</p>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850/60 shadow-3xs">
            <p className="text-slate-500 text-[10px]">RAG VECTOR DECOUPLINGS:</p>
            <p className="text-blue-400 font-bold mt-1 text-[11px]">99.1% Fidelity</p>
          </div>
        </div>
      </div>

    </div>
  );
}
