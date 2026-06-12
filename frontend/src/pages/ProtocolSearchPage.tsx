/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { searchProtocols } from '../services/api';
import { ProtocolEvidence } from '../types';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Building2,
  Calendar, 
  ChevronRight, 
  Check, 
  ExternalLink,
  BookMarked,
  Sparkles,
  ClipboardCheck
} from 'lucide-react';

const CATEGORIES = ['All', 'Child Health', 'Maternal Health', 'Newborn', 'Fever'];

export default function ProtocolSearchPage({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [protocols, setProtocols] = useState<ProtocolEvidence[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<ProtocolEvidence | null>(null);
  const [injectedSuccess, setInjectedSuccess] = useState(false);

  useEffect(() => {
    const list = searchProtocols(query, { category: activeCategory });
    setProtocols(list);
    
    // Auto-select first protocol if available and nothing is selected
    if (list.length > 0 && !selectedProtocol) {
      setSelectedProtocol(list[0]);
    }
  }, [query, activeCategory]);

  const handleInjectProtocol = (title: string) => {
    setInjectedSuccess(true);
    setTimeout(() => {
      setInjectedSuccess(false);
      setActiveTab('assistant');
    }, 1800);
  };

  return (
    <div className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto bg-slate-50 flex flex-col lg:flex-row gap-6 min-h-0 select-none">
      
      {/* LEFT: RESULTS & SEARCH INPUTS */}
      <div className="flex-1 space-y-5 min-h-0 overflow-y-auto">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-sans font-bold text-slate-905 text-slate-905 text-slate-900 tracking-tight flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-blue-600" />
              <span>National Guidelines & Protocol Library</span>
            </h2>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Access clinical directives authorized by the Federal Ministry of Health of Ethiopia.
            </p>
          </div>

          {injectedSuccess && (
            <div className="p-2.5 px-3 bg-teal-50 border border-teal-305 border-teal-200 text-teal-850 text-teal-800 text-[11px] font-bold rounded-xl flex items-center gap-2 animate-pulse shadow-3xs shrink-0 self-start">
              <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Context loaded in AI memory. Launching triage...</span>
            </div>
          )}
        </div>

        {/* Search input controls */}
        <div className="bg-white p-4 border border-slate-200/80 rounded-2xl shadow-3xs space-y-3.5">
          <div className="relative">
            <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Filter guidelines by terms (e.g. 'Amoxicillin', 'Asthma', 'ማላሪያ')..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs sm:text-xs md:text-sm font-sans"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <span>Category Focus:</span>
            </span>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setSelectedProtocol(null);
                }}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeCategory === cat 
                    ? 'bg-slate-905 bg-slate-900 text-white shadow-3xs border border-slate-900' 
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-205'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results count indicator */}
        <div className="flex justify-between items-center text-[11px] text-slate-400 font-bold uppercase tracking-wider">
          <span>Active Registry matches: <strong>{protocols.length}</strong></span>
          <span>Verified Local Copy: MOH v1.5</span>
        </div>

        {/* List of Protocols */}
        {protocols.length === 0 ? (
          <div className="bg-white border rounded-2xl p-12 text-center text-slate-500 font-sans space-y-2 select-none">
            <BookOpen className="w-10 h-10 text-slate-350 mx-auto" />
            <p className="font-bold text-slate-700">No guidelines found matching target query.</p>
            <p className="text-xs">Adjust your search keyword or check other categories.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {protocols.map(p => {
              const remainsSelected = selectedProtocol?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProtocol(p)}
                  className={`p-4 rounded-2xl border bg-white hover:border-blue-400 hover:shadow-2xs transition-all duration-300 flex flex-col justify-between gap-3 cursor-pointer ${
                    remainsSelected ? 'border-2 border-blue-500 ring-2 ring-blue-50/40 scale-[1.01]' : 'border-slate-200/90'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2.5">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        {p.category}
                      </span>
                      <h4 className="font-sans font-extrabold text-slate-905 text-slate-900 text-xs sm:text-xs md:text-sm mt-2">{p.title}</h4>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-emerald-755 text-emerald-800 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5">
                        RAG: {p.confidence}%
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 font-sans leading-relaxed line-clamp-2">
                    {p.snippet}
                  </p>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-[10px] text-slate-400 font-sans font-semibold">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      {p.sourceType}
                    </span>
                    <span className="flex items-center gap-1 font-mono uppercase text-[9px]">
                      <Calendar className="w-3.5 h-3.5" />
                      Synced: {p.lastUpdated}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* RIGHT: DETAILED PROTOCOL PREVIEW */}
      <div className="w-full lg:w-80 shrink-0 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 self-start shadow-3xs text-xs">
        <h3 className="font-sans font-bold text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-1.5 select-none">
          <BookOpen className="w-4.5 h-4.5 text-slate-400" />
          <span>Guideline Context Detail</span>
        </h3>

        {selectedProtocol ? (
          <div className="space-y-4 animate-fade-in font-sans">
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                Grounded Confidence {selectedProtocol.confidence}%
              </span>
              <h4 className="font-extrabold text-slate-900 text-sm mt-1.5 leading-tight">{selectedProtocol.title}</h4>
              <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{selectedProtocol.sourceType}</p>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3">
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocol Snippet Content:</h5>
              <div className="bg-slate-50 p-3.5 rounded-xl text-xs leading-normal font-sans text-slate-700 italic border border-slate-100 whitespace-pre-wrap">
                &ldquo;{selectedProtocol.snippet}&rdquo;
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-2">
              <button
                type="button"
                onClick={() => handleInjectProtocol(selectedProtocol.title)}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-transform hover:scale-[1.02]"
              >
                <Check className="w-4 h-4" />
                <span>Inject as Active Reference</span>
              </button>

              <button
                type="button"
                className="w-full py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-850 rounded-xl text-xs flex items-center justify-center gap-1 font-bold cursor-pointer transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Verify Source Citation</span>
              </button>
            </div>
            
            <p className="text-[10px] text-slate-400 text-center font-mono leading-relaxed select-none">
              Secured under local IMNCI caching database rules.
            </p>
          </div>
        ) : (
          <div className="text-center p-8 text-slate-400 text-xs font-sans space-y-1.5 select-none">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
            <p>Select any guideline card on the left to review the full details and source citations.</p>
          </div>
        )}

      </div>

    </div>
  );
}
