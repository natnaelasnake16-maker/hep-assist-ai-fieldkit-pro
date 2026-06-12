/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  getCases, 
  askAssistant, 
  getResponseForCase, 
  submitFeedback,
  getAppPrefs,
  subscribeToStateChanges
} from '../services/api';
import { CaseIntake, AssistantResponse } from '../types';
import { 
  AlertTriangle, 
  CheckCircle, 
  ShieldAlert, 
  User, 
  Thermometer, 
  Activity, 
  ChevronRight, 
  ThumbsUp, 
  ThumbsDown, 
  Volume2, 
  Plus, 
  Send,
  Loader2,
  FileText,
  HelpCircle,
  Sparkles,
  SearchCheck,
  Languages,
  BookOpen,
  ArrowRight,
  ClipboardCheck,
  CheckCircle2,
  Lock,
  ChevronDown,
  Eye,
  Settings,
  Scale
} from 'lucide-react';

const QUICK_CHIPS = [
  { label: 'Fever (ትኩሳት)', query: 'Child with high fever and chills' },
  { label: 'Fast Breathing (ሳል/ፈጣን ትንፋሽ)', query: 'Under-5 child with fast breathing rate and persistent dry cough' },
  { label: 'Pregnancy concern (እርግዝና)', query: 'Third trimester bleeding and severe headache concerns' },
  { label: 'Newborn danger signs (ጨቅላ ህፃን)', query: '10 day old infant with severe cold lethargy' },
  { label: 'Diarrhea (ተቅማጥ)', query: 'Toddler with active watery diarrhea and sunken eyes' }
];

export default function AssistantPage() {
  const [cases, setCases] = useState<CaseIntake[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseIntake | null>(null);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<AssistantResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [simulatingVoice, setSimulatingVoice] = useState(false);
  const [userPrefs, setUserPrefs] = useState(getAppPrefs());
  
  // Local state for toggling citation details
  const [isCitationsExpanded, setIsCitationsExpanded] = useState(false);

  useEffect(() => {
    const list = getCases();
    setCases(list);
    // Auto-select first case
    if (list.length > 0) {
      handleSelectCase(list[0]);
    }

    const unsubscribe = subscribeToStateChanges(() => {
      setUserPrefs(getAppPrefs());
    });
    return unsubscribe;
  }, []);

  const handleSelectCase = async (c: CaseIntake) => {
    setSelectedCase(c);
    setFeedbackSubmitted(false);
    setRating(null);
    setComment('');
    
    // Check if we already have response, otherwise generate
    const existing = getResponseForCase(c.id);
    if (existing) {
      setResponse(existing);
    } else {
      setLoading(true);
      const resp = await askAssistant(`Clinical triage of symptom log for patient ${c.id}`, c);
      setResponse(resp);
      setLoading(false);
    }
  };

  const handleCustomQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setFeedbackSubmitted(false);
    setRating(null);
    setComment('');

    const text = query;
    setQuery('');

    // Ask with selected case context if available
    const resp = await askAssistant(text, selectedCase || undefined);
    setResponse(resp);
    setLoading(false);
  };

  const handleVoiceSimulate = () => {
    setSimulatingVoice(true);
    setQuery(userPrefs.language === 'en' 
      ? 'Listening... "3 year old baby with rapid breathing and vomiting everything"' 
      : 'በማዳመጥ ላይ... "ባለ 3 አመት ህጻን ፈጣን ትንፋሽ እና ተደጋጋሚ ትውከት ይታይበታል"'
    );
    setTimeout(() => {
      setQuery(userPrefs.language === 'en' 
        ? '3 year old baby with rapid breathing and vomiting everything' 
        : 'ባለ 3 አመት ህጻን ፈጣን ትንፋሽ እና ተደጋጋሚ ትውከት ይታይበታል'
      );
      setSimulatingVoice(false);
    }, 2000);
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !response) return;

    submitFeedback({
      caseId: selectedCase?.id,
      rating,
      comment: comment.trim() || undefined,
      category: rating <= 2 ? 'accuracy' : 'clarity',
      language: userPrefs.language,
      location: selectedCase 
        ? `${selectedCase.basics.region} (${selectedCase.basics.facilityName})` 
        : 'Unassigned/Direct Chat',
      modelUsed: response.responseSource
    });

    setFeedbackSubmitted(true);
  };

  const getUrgencyClasses = (urgency?: string) => {
    switch (urgency) {
      case 'Emergency':
        return {
          bg: 'bg-rose-50/70 border-rose-200 text-rose-900',
          badge: 'bg-rose-600 text-white',
          border: 'border-rose-300',
          indicator: 'bg-rose-600',
          title: 'Critical Emergency / አስቸኳይ ሪፈራል'
        };
      case 'Same-day':
        return {
          bg: 'bg-amber-50/70 border-amber-200 text-amber-900',
          badge: 'bg-amber-500 text-white',
          border: 'border-amber-300',
          indicator: 'bg-amber-500',
          title: 'Same-Day Clinical Review / በተመሳሳይ ቀን መታየት ያለበት'
        };
      case 'Routine':
        return {
          bg: 'bg-teal-50/70 border-teal-200 text-teal-900',
          badge: 'bg-teal-600 text-white',
          border: 'border-teal-300',
          indicator: 'bg-teal-500',
          title: 'Routine Home Care Support / ቀላል ክትትል'
        };
      default:
        return {
          bg: 'bg-slate-50 border-slate-200 text-slate-800',
          badge: 'bg-slate-500 text-white',
          border: 'border-slate-300',
          indicator: 'bg-slate-400',
          title: 'Additional Information Required / ተጨማሪ መረጃ ያስፈልጋል'
        };
    }
  };

  const currentUrgency = getUrgencyClasses(response?.urgency);

  return (
    <div className="flex-1 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-300 min-h-0 bg-slate-50">
      
      {/* LEFT AREA: CASE LOGS SELECTOR & AI CHAT WORKSPACE */}
      <div className="flex-1 flex flex-col min-h-0 p-4 lg:p-6 space-y-6 overflow-y-auto">
        
        {/* Active Patients Horizontal Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center select-none">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <ClipboardCheck className="w-4 h-4 text-slate-400" />
              <span>Active Frontline Cases</span>
            </h2>
            <span className="text-[10px] bg-slate-200 text-slate-800 font-bold px-2 py-0.5 rounded-full font-mono">
              Count: {cases.length}
            </span>
          </div>

          {cases.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-xs font-sans shadow-xs">
              No clinical cases entered yet. Please complete a <strong className="text-blue-600 font-bold cursor-pointer">Structured Patient Intake</strong> to generate a draft.
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin select-none">
              {cases.map(c => {
                const isSelected = selectedCase?.id === c.id;
                const hasDanger = c.dangerSignsDetected.length > 0;
                
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCase(c)}
                    className={`shrink-0 p-3.5 rounded-2xl text-left transition-all duration-300 font-sans min-w-[210px] cursor-pointer relative shadow-2xs ${
                      isSelected 
                        ? 'bg-[#ecf3fa] border-2 border-blue-600 text-[#1e293b] scale-[1.01]' 
                        : 'bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-xs text-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-[#d0e1f0] text-[#1e3a5f]' : 'bg-slate-100 text-slate-505 text-slate-500'}`}>
                        ID: {c.id.substring(c.id.length - 6).toUpperCase()}
                      </span>
                      {hasDanger && (
                        <span className={`absolute right-3.5 top-3.5 w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-rose-600' : 'bg-rose-500'}`} />
                      )}
                    </div>
                    
                    <p className={`font-sans font-bold text-sm mt-2 ${isSelected ? 'text-[#1e293b]' : 'text-slate-900'}`}>
                      {c.basics.age} {c.basics.ageUnit} • {c.basics.sex}
                    </p>
                    
                    <div className={`flex items-center justify-between text-[11px] mt-2.5 border-t pt-2 ${isSelected ? 'border-[#d0e1f0] text-[#475569]' : 'border-slate-100 text-slate-500'}`}>
                      <span className="truncate">{c.basics.facilityName}</span>
                      <span className="font-mono font-bold">RR: {c.vitals.respiratoryRate}/min</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Triage Chips */}
        <div className="space-y-2 select-none">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Common Clinical Reference Scenarios</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_CHIPS.map((chip, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setQuery(chip.query)}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200/85 hover:border-slate-300 text-xs rounded-xl text-slate-700 transition-all font-medium font-sans cursor-pointer active:scale-95 text-left"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* AI response Workspace (Clinical guidance card) */}
        <div className="flex-1 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          
          {/* Workspace Top Header */}
          <div className="bg-slate-50 border-b border-slate-100 p-4 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
              <h3 className="font-bold text-slate-800 text-[13px] uppercase tracking-wider">Clinical Advisor Evidence Workspace</h3>
            </div>
            
            {/* Display model names only to AI Engineers / Admins */}
            {(response && userPrefs.role === 'AI_Engineer') && (
              <span className="font-mono text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-100 rounded-md px-2 py-0.5">
                Engine: {response.responseSource}
              </span>
            )}
          </div>

          {/* Core display */}
          <div className="flex-1 p-5 md:p-6 overflow-y-auto space-y-6">
            {loading ? (
              <div className="h-full flex flex-col justify-center items-center text-slate-500 space-y-4 py-16">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <div className="text-center space-y-1">
                  <p className="font-sans font-bold text-sm text-slate-700">HEP Triage Advisor Running Diagnosis</p>
                  <p className="text-xs text-slate-400 max-w-xs leading-relaxed font-sans">
                    Consulting local IMNCI and ANC national criteria catalogs.
                  </p>
                </div>
              </div>
            ) : response ? (
              <div className="space-y-6 animate-fade-in">
                
                {/* 1. Urgency card banner styled like medical checklist sheet */}
                <div className={`p-5 rounded-2xl border-l-4 border shadow-2xs ${currentUrgency.bg} ${currentUrgency.border}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Triage Category
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${currentUrgency.badge}`}>
                      {response.urgency}
                    </span>
                  </div>
                  <h4 className="font-sans font-bold text-base md:text-lg text-slate-900 mt-2">{currentUrgency.title}</h4>
                  <p className="text-xs md:text-sm mt-3 leading-relaxed text-slate-850 font-sans font-medium whitespace-pre-wrap">
                    {response.textContent}
                  </p>
                </div>

                {/* 2. Recommended Action Items (Clinical Interventions list) */}
                {response.recommendedActions.length > 0 && (
                  <div className="space-y-2.5">
                    <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <CheckCircle2 className="w-4.5 h-4.5 text-teal-605 text-teal-600 shrink-0" />
                      <span>Clinical Action Protocol / መደረግ የሚገባቸው ወሳኝ እርምጃዎች</span>
                    </h5>
                    <ul className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl bg-slate-50/50 overflow-hidden shadow-2xs">
                      {response.recommendedActions.map((act, idx) => (
                        <li key={idx} className="p-4 text-xs md:text-sm flex gap-3 text-slate-800 leading-normal font-sans">
                          <span className="font-sans font-bold text-blue-600 shrink-0">{idx + 1}.</span>
                          <span className="font-medium text-slate-705 text-slate-700">{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 3. Danger Signs Checklist (Medical triage verification) */}
                {response.dangerSignsToCheck.length > 0 && (
                  <div className="space-y-2.5">
                    <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <AlertTriangle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                      <span>Triage Danger Sign Checklist / የአደጋ መኖሩን የማረጋገጫ ምልክቶች</span>
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {response.dangerSignsToCheck.map((itm, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50/60 transition-colors cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            id={`ai-danger-${idx}`} 
                            className="w-4 h-4 accent-rose-600 border-slate-300 rounded-md mt-0.5 shrink-0 cursor-pointer" 
                          />
                          <label htmlFor={`ai-danger-${idx}`} className="text-xs font-bold text-slate-700 leading-snug cursor-pointer flex-1">
                            {itm}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Missing Questions (Diagnostic follow-up cues) */}
                {response.followUpQuestions.length > 0 && (
                  <div className="space-y-2.5 p-4 bg-sky-50/65 border border-sky-100 rounded-2xl shadow-3xs">
                    <h5 className="text-[11px] font-bold text-blue-800 uppercase tracking-widest flex items-center gap-1.5">
                      <HelpCircle className="w-4.5 h-4.5 text-blue-500 shrink-0" />
                      <span>Missing Diagnostic Parameters / ጠቃሚ ቀጣይ ጥያቄዎች</span>
                    </h5>
                    <ul className="list-disc pl-5 text-slate-700 text-xs md:text-sm space-y-1.5 font-sans leading-relaxed">
                      {response.followUpQuestions.map((q, idx) => (
                        <li key={idx} className="font-semibold text-slate-750 text-slate-700">{q}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 5. Ground Citation (Progressive disclosure - hide details from HEWs, show full text to AI Engineers) */}
                {response.evidence.length > 0 && (
                  <div className="space-y-2.5 border-t border-slate-100 pt-5">
                    <button
                      onClick={() => setIsCitationsExpanded(!isCitationsExpanded)}
                      className="flex items-center justify-between w-full text-left font-sans select-none"
                    >
                      <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <BookOpen className="w-4.5 h-4.5 text-slate-500" />
                        <span>MOH Regulation Guideline Citations / የማመሳከሪያ ማስረጃዎች</span>
                      </h5>
                      <span className="text-xs text-blue-600 font-bold flex items-center gap-1">
                        {isCitationsExpanded ? 'Collapse' : 'Expand'}
                        <ChevronDown className={`w-4 h-4 transition-transform ${isCitationsExpanded ? 'rotate-180' : ''}`} />
                      </span>
                    </button>

                    {isCitationsExpanded && (
                      <div className="space-y-3 pt-1 animate-fade-in">
                        {response.evidence.map((ev, idx) => {
                          const isAiEngineer = userPrefs.role === 'AI_Engineer';
                          return (
                            <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 shadow-3xs">
                              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                                <span>Source: {ev.sourceType} • Class: {ev.category}</span>
                                {isAiEngineer && (
                                  <span className="text-teal-600 font-mono">
                                    Cosine Similarity: {ev.confidence}%
                                  </span>
                                )}
                              </div>
                              <h6 className="font-bold text-xs text-slate-900">{ev.title}</h6>
                              <blockquote className="text-xs leading-relaxed text-slate-650 font-sans italic pl-3 border-l-2 border-slate-300">
                                &ldquo;{ev.snippet}&rdquo;
                              </blockquote>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 6. Feedback module */}
                {!feedbackSubmitted ? (
                  <form onSubmit={handleFeedbackSubmit} className="mt-8 border-t border-slate-150 pt-5 space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-xs font-bold text-slate-600 font-sans">Rate the clincal accuracy in active field use:</p>
                      
                      {/* Rating selection */}
                      <div className="flex items-center gap-1.5 select-none">
                        {[1, 2, 3, 4, 5].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setRating(val)}
                            className={`w-9 h-9 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-90 ${
                              rating === val 
                                ? 'bg-slate-900 border-slate-900 text-teal-400 shadow-sm font-mono' 
                                : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2.5">
                      <input 
                        type="text" 
                        placeholder="Add a field comment (e.g., translation error in respiratory rate labels)..." 
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        className="flex-1 text-xs px-4 py-2.5 border border-slate-200/90 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans shadow-3xs"
                      />
                      <button 
                        type="submit" 
                        disabled={!rating}
                        className="bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl disabled:opacity-45 h-fit shrink-0 cursor-pointer shadow-sm transition-all"
                      >
                        Submit Feedback
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="mt-8 border-t border-slate-100 pt-4 text-center p-4 bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold rounded-xl animate-fade-in shadow-3xs">
                    Feedback saved locally. System packet will merge automatically into supervisor queue.
                  </div>
                )}

              </div>
            ) : (
              <div className="h-full flex flex-col justify-center items-center text-slate-400 space-y-3 py-16 text-center select-none">
                <div className="p-4 bg-slate-100 text-slate-400 rounded-full shrink-0">
                  <Activity className="w-8 h-8 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-sans font-bold text-slate-700">No Patient Session Loaded</p>
                  <p className="text-xs text-slate-400 max-w-sm mt-1 leading-normal font-sans">
                    Please pick an active patient folder from the bar above, or formulate clinical questions directly below.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Form input bar */}
          <div className="p-4 bg-slate-50 border-t border-slate-200/70 shrink-0">
            <form onSubmit={handleCustomQuerySubmit} className="flex gap-2">
              <button
                type="button"
                onClick={handleVoiceSimulate}
                disabled={simulatingVoice || loading}
                title="Record patient voice details"
                className={`p-3.5 border rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                  simulatingVoice 
                    ? 'bg-rose-100 text-rose-600 border-rose-300 animate-pulse'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800 shadow-3xs'
                }`}
              >
                <Volume2 className="w-4.5 h-4.5 text-slate-500" />
              </button>
              
              <input
                type="text"
                placeholder={userPrefs.language === 'en' 
                  ? "Formulate medical queries, or ask a protocol check here..." 
                  : "የታካሚውን ምልክቶች ይግለጹ ወይም ጥያቄዎን እዚህ ይጻፉ..."
                }
                value={query}
                onChange={e => setQuery(e.target.value)}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans shadow-3xs font-medium text-slate-800"
              />
              
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="p-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl shadow-md shrink-0 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </form>
          </div>

        </div>

      </div>

      {/* RIGHT SIDEBAR PANEL: LIVE STRUCTURED CASE INDICATOR */}
      <div className="w-full lg:w-80 p-5 lg:p-6 shrink-0 bg-[#f8fafc] border-t lg:border-t-0 lg:border-l border-slate-300 space-y-6 overflow-y-auto shadow-xs">
        <h3 className="font-sans font-bold text-slate-855 text-slate-900 text-xs uppercase tracking-widest border-b border-slate-300 pb-2">
          Patient Demographics
        </h3>

        {selectedCase ? (
          <div className="space-y-6 text-xs font-sans">
            
            {/* Demographic card details */}
            <div className="space-y-3.5">
              <div className="flex gap-3 items-center">
                <div className="p-2.5 bg-blue-50/70 rounded-xl text-blue-600 shrink-0">
                  <User className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 leading-tight">Patient File Info</h4>
                  <p className="text-[10px] text-slate-400 font-mono uppercase mt-0.5">
                    #{selectedCase.id.substring(selectedCase.id.length - 8).toUpperCase()}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-slate-400 font-bold block text-[9px] uppercase tracking-wider">Age / Sex</p>
                  <p className="font-bold text-slate-800 mt-1">
                    {selectedCase.basics.age} {selectedCase.basics.ageUnit} • {selectedCase.basics.sex}
                  </p>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-slate-400 font-bold block text-[9px] uppercase tracking-wider">Pregnancy</p>
                  <p className="font-bold text-slate-800 mt-1">
                    {selectedCase.basics.pregnancyStatus}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-slate-400 font-bold block text-[9px] uppercase tracking-wider">Location Jurisdiction</p>
                  <p className="font-bold text-slate-800 mt-1 truncate" title={selectedCase.basics.woreda}>
                    {selectedCase.basics.woreda}, {selectedCase.basics.region}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-slate-400 font-bold block text-[9px] uppercase tracking-wider">Health Post Facility</p>
                  <p className="font-bold text-slate-800 mt-1 truncate" title={selectedCase.basics.facilityName}>
                    {selectedCase.basics.facilityName}
                  </p>
                </div>
              </div>
            </div>

            {/* Vitals summary block */}
            <div className="space-y-3.5 border-t border-slate-100 pt-5">
              <div className="flex gap-3 items-center">
                <div className="p-2.5 bg-rose-50/70 rounded-xl text-rose-600 shrink-0">
                  <Thermometer className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 leading-tight">Patient Vital Signs</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Physical metric measurements</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                  <div>
                    <p className="text-slate-400 text-[9px] uppercase tracking-wider font-bold">Temperature</p>
                    <p className={`font-mono font-bold mt-1 text-sm ${selectedCase.vitals.temperature >= 38.0 ? 'text-rose-600' : 'text-slate-800'}`}>
                      {selectedCase.vitals.temperature} &deg;C
                    </p>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${selectedCase.vitals.temperature >= 38.0 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                  <div>
                    <p className="text-slate-400 text-[9px] uppercase tracking-wider font-bold">Respiratory Rate</p>
                    <p className="font-mono font-bold mt-1 text-sm text-slate-800">
                      {selectedCase.vitals.respiratoryRate}/min
                    </p>
                  </div>
                  <span className="w-2 h-2 bg-blue-500 rounded-full" />
                </div>
              </div>
              
              <div className="bg-slate-50 p-2.5 rounded-xl text-slate-500 text-[10px] text-center border border-slate-100 font-mono font-bold uppercase">
                Duration of Illness: {selectedCase.vitals.symptomDurationDays} {selectedCase.vitals.symptomDurationDays === 1 ? 'day' : 'days'}
              </div>
            </div>

            {/* Safety Hazards list */}
            <div className="space-y-3.5 border-t border-slate-100 pt-5">
              <h4 className="font-bold text-slate-900 leading-tight">Integrated Safety Alarms</h4>
              
              {selectedCase.dangerSignsDetected.length === 0 ? (
                <div className="p-3.5 bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-bold rounded-xl flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-teal-600" />
                  <span>No triage danger signs detected.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedCase.dangerSignsDetected.map((text, idx) => (
                    <div key={idx} className="p-3 bg-rose-50/70 text-rose-900 border border-rose-200 rounded-xl text-xs leading-normal flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-500 mt-0.5" />
                      <span className="font-medium text-slate-750 text-slate-700 leading-snug">{text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Supervisor Routing alert */}
            {(selectedCase.vitals.temperature >= 38.5 || selectedCase.dangerSignsDetected.length > 0) && (
              <div className="p-3.5 bg-sky-50 border border-sky-200 text-sky-800 text-[11px] font-bold rounded-xl flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Requires formal supervisor review routing.</span>
              </div>
            )}

          </div>
        ) : (
          <div className="text-center p-8 bg-slate-50 border border-slate-200/60 rounded-2xl text-slate-400 text-xs font-sans">
            No dynamic case workspace has been loaded.
          </div>
        )}

      </div>

    </div>
  );
}
