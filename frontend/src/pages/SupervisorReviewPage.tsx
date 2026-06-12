/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  getReviewQueue, 
  updateReviewItem, 
  subscribeToStateChanges,
  getAppPrefs
} from '../services/api';
import { ReviewItem, UrgencyLevel } from '../types';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle, 
  Search, 
  Clipboard, 
  User, 
  Thermometer, 
  TrendingUp, 
  Clock, 
  ArrowUpRight,
  UserCheck,
  Zap,
  CheckCircle2,
  AlertOctagon,
  CornerDownRight,
  Filter
} from 'lucide-react';

export default function SupervisorReviewPage() {
  const [queue, setQueue] = useState<ReviewItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Pending' | 'Approved' | 'Escalated'>('Pending');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [prefs, setPrefs] = useState(getAppPrefs());

  useEffect(() => {
    loadQueue();
    const unsub = subscribeToStateChanges(() => {
      loadQueue();
      setPrefs(getAppPrefs());
    });
    return unsub;
  }, [activeFilter, searchQuery]);

  const loadQueue = () => {
    let items = getReviewQueue();
    // Filter by clinical reviewer status
    if (activeFilter !== 'All') {
      items = items.filter(item => item.status === activeFilter);
    }
    // Search query matches
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.id.toLowerCase().includes(q) ||
        item.originalCaseData.basics.facilityName.toLowerCase().includes(q) ||
        item.originalCaseData.basics.region.toLowerCase().includes(q) ||
        item.originalCaseData.basics.woreda.toLowerCase().includes(q)
      );
    }
    setQueue(items);

    // Auto-select first item if possible and not already selected
    if (items.length > 0 && (!selectedItem || !items.find(i => i.id === selectedItem.id))) {
      handleSelectItem(items[0]);
    } else if (items.length === 0) {
      setSelectedItem(null);
    }
  };

  const handleSelectItem = (item: ReviewItem) => {
    setSelectedItem(item);
    setNote(item.reviewerNotes || '');
  };

  const handleStatusChange = async (newStatus: 'Approved' | 'Escalated') => {
    if (!selectedItem) return;
    setSaving(true);
    
    // Simulate latency
    await new Promise(resolve => setTimeout(resolve, 800));
    updateReviewItem(selectedItem.id, { status: newStatus, reviewerNotes: note.trim() || undefined });
    
    setSaving(false);
    // Reload active queue
    loadQueue();
  };

  const getUrgencyBadge = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case 'Emergency':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
            Emergency
          </span>
        );
      case 'Same-day':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Same-day
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Routine
          </span>
        );
    }
  };

  const getStatusBadge = (status: 'Pending' | 'Approved' | 'Escalated') => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-3xs uppercase">
            Approved
          </span>
        );
      case 'Escalated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-3xs uppercase animate-pulse">
            Escalated
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-905 bg-slate-900 text-teal-400 font-mono shadow-3xs uppercase border border-slate-850">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80 min-h-0 bg-slate-50">
      
      {/* LEFT PANEL: CASE QUEUE WORKLIST */}
      <div className="flex-1 flex flex-col min-h-0 p-4 lg:p-6 space-y-4">
        
        {/* Workspace Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
          <div>
            <h2 className="text-lg font-sans font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span>Supervisor Clinical Auditing Workbench</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-sans leading-none">
              Sign off on HEW field cases and RAG decision-support outputs.
            </p>
          </div>
          
          <span className="text-[10px] bg-slate-900 text-teal-400 px-3 p-1 rounded-xl font-mono font-bold uppercase shadow-2xs border border-slate-850 h-fit w-fit">
            Region: {prefs.defaultRegion || 'Amhara'}
          </span>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1 select-none">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Case ID, woreda, or active facility..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans shadow-3xs"
            />
          </div>

          <div className="flex gap-1.5 p-1 bg-slate-200/80 rounded-xl text-xs font-bold leading-normal">
            {(['Pending', 'Approved', 'Escalated', 'All'] as const).map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 rounded-lg transition-all focus:outline-none cursor-pointer text-xs ${
                  activeFilter === f 
                    ? 'bg-slate-900 text-white shadow-3xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Worklist Scroll Queue */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1.5 select-none scrollbar-thin">
          {queue.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-slate-400 py-16 text-center space-y-2 select-none border border-dashed border-slate-200 rounded-2xl bg-white/50">
              <Clipboard className="w-10 h-10 text-slate-350" />
              <div>
                <p className="text-xs font-bold text-slate-700">Audit Desk is Clear</p>
                <p className="text-[11px] text-slate-400 max-w-xs mt-1">No pending referral cases in the selected category require validation.</p>
              </div>
            </div>
          ) : (
            queue.map(item => {
              const worksSelected = selectedItem?.id === item.id;
              const basics = item.originalCaseData.basics;
              const vitals = item.originalCaseData.vitals;
              const hasAlerts = item.originalCaseData.dangerSignsDetected.length > 0;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex justify-between items-start gap-4 cursor-pointer relative shadow-3xs hover:-translate-y-0.5 ${
                    worksSelected 
                      ? 'bg-white border-blue-500 ring-2 ring-blue-500/20' 
                      : 'bg-white border-slate-205 border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        FOLDER: {item.id.substring(item.id.length - 8).toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(item.dateTime).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="font-sans font-bold text-sm text-slate-900">
                      {basics.age} {basics.ageUnit} • {basics.sex} • <span className="text-slate-500 text-xs font-semibold">{basics.facilityName}</span>
                    </p>

                    <div className="flex gap-2 flex-wrap text-[11px] font-semibold text-slate-500 mt-2">
                      <span className="bg-slate-50 border border-slate-100 px-2.5 py-0.5 rounded-lg font-mono">
                        Temp: {vitals.temperature}°C
                      </span>
                      <span className="bg-slate-50 border border-slate-100 px-2.5 py-0.5 rounded-lg font-mono">
                        RR: {vitals.respiratoryRate}/m
                      </span>
                    </div>

                    {hasAlerts && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600 mt-2.5 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-lg w-fit">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                        <span>Danger Signs Active ({item.originalCaseData.dangerSignsDetected.length})</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0 select-none">
                    {getStatusBadge(item.status)}
                    {getUrgencyBadge(item.originalCaseData.dangerSignsDetected.length > 0 ? 'Emergency' : 'Same-day')}
                  </div>
                </button>
              );
            })
          )}
        </div>

      </div>

      {/* RIGHT PANEL: CASE DETAIL VIEW & REVIEWS FORM */}
      <div className="w-full lg:w-96 shrink-0 bg-white border-t lg:border-t-0 p-4 lg:p-6 space-y-6 overflow-y-auto">
        <h3 className="font-sans font-bold text-slate-900 text-xs uppercase tracking-widest border-b border-slate-105 border-slate-100 pb-2">
          Clinical Audit Inspector
        </h3>

        {selectedItem ? (
          <div className="space-y-6 text-xs text-slate-600 leading-relaxed font-sans">
            
            {/* Header profile details */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3.5 shadow-3xs relative select-none">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 rounded-xl text-blue-600 shrink-0">
                  <User className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="font-sans font-bold text-slate-900">Demographics & Origin</h4>
                  <p className="text-[10px] text-slate-400 font-mono">
                    ID: #{selectedItem.id.substring(selectedItem.id.length - 12).toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-sans">
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[9px] tracking-wide">Age & Gender</p>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {selectedItem.originalCaseData.basics.age} {selectedItem.originalCaseData.basics.ageUnit} • {selectedItem.originalCaseData.basics.sex}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[9px] tracking-wide">Pregnancy</p>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {selectedItem.originalCaseData.basics.pregnancyStatus}
                  </p>
                </div>
                <div className="col-span-2 border-t border-slate-200/50 pt-2 font-medium">
                  <p className="text-slate-400 font-semibold uppercase text-[9px] tracking-wide">Submitting Facility Post</p>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {selectedItem.originalCaseData.basics.facilityName} ({selectedItem.originalCaseData.basics.region}, {selectedItem.originalCaseData.basics.woreda})
                  </p>
                </div>
              </div>
            </div>

            {/* Danger alarms checklist details */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <h4 className="font-sans font-bold text-slate-900 text-sm">Alarms Reported by Field LLM</h4>
              
              {selectedItem.originalCaseData.dangerSignsDetected.length === 0 ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>No primary clinical alarms active.</span>
                </div>
              ) : (
                <div className="space-y-1.5 select-none">
                  {selectedItem.originalCaseData.dangerSignsDetected.map((text, idx) => (
                    <div key={idx} className="p-2.5 bg-rose-50 text-rose-900 border border-rose-200 rounded-xl leading-normal flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-500 mt-0.5 animate-pulse" />
                      <span className="font-bold leading-tight">{text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Checkbox log of reported health parameters */}
            <div className="bg-slate-50/50 border border-slate-205 border-slate-200/80 rounded-2xl p-4 space-y-3 select-none">
              <h5 className="font-bold text-slate-800 uppercase text-[9px] tracking-wider">Reported Symptoms Log</h5>
              
              <div className="grid grid-cols-2 gap-2 text-[11px] font-sans">
                {Object.entries(selectedItem.originalCaseData.symptoms).map(([symptom, value]) => (
                  <div key={symptom} className="flex items-center gap-1.5 py-1">
                    <span className={`w-2 h-2 rounded-full ${value ? 'bg-rose-500 animate-pulse' : 'bg-slate-305 bg-slate-300'}`} />
                    <span className={`capitalize font-semibold ${value ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium'}`}>
                      {symptom.replace(/([A-Z])/g, ' $1')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Supervisor feedback decision details */}
            <div className="space-y-3 border-t border-slate-100 pt-5">
              <div className="flex items-center gap-1.5">
                <Clipboard className="w-4 h-4 text-slate-500" />
                <h4 className="font-sans font-bold text-slate-900 text-xs uppercase tracking-wider">MOH Sign-Off Directive Instructions</h4>
              </div>

              {selectedItem.status === 'Pending' ? (
                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-650 block">Supervisor Note / Clinical Directives</label>
                    <textarea
                      placeholder="Input clinical instructions. e.g. Dispatch ambulance to Tebase HP immediately, double-check chest indrawing, or call on-duty clinician..."
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      rows={4}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pb-1 select-none">
                    <button
                      onClick={() => handleStatusChange('Escalated')}
                      disabled={saving}
                      className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-transform hover:scale-101 flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{saving ? 'Saving...' : 'Escalate Referral'}</span>
                    </button>

                    <button
                      onClick={() => handleStatusChange('Approved')}
                      disabled={saving}
                      className="py-2.5 bg-slate-900 text-teal-400 font-mono font-bold rounded-xl text-xs transition-transform hover:scale-101 flex items-center justify-center gap-1 cursor-pointer border border-slate-800 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                      <span>{saving ? 'Saving...' : 'Approve & Release'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
                  <div className="flex justify-between items-center select-none">
                    <span className="font-bold text-slate-500 text-[10px]">CURRENT STATUS:</span>
                    {getStatusBadge(selectedItem.status)}
                  </div>

                  <div className="space-y-1 mt-2.5">
                    <p className="font-bold text-slate-400 text-[9px] uppercase tracking-wide">Archived Directive Notes</p>
                    <p className="bg-white border border-slate-100 p-3 rounded-xl text-xs text-slate-700 italic font-medium leading-relaxed">
                      &ldquo;{selectedItem.reviewerNotes || 'No custom notes provided.'}&rdquo;
                    </p>
                  </div>
                  
                  <div className="text-[10px] text-slate-450 text-slate-400 font-mono text-center pt-1.5 border-t border-slate-200/50 select-none">
                    Sync completed with MOH medical registry index.
                  </div>
                </div>
              )}

            </div>

          </div>
        ) : (
          <div className="text-center p-8 bg-slate-50 border border-slate-250 border-slate-200 rounded-2xl text-slate-450 text-slate-400 text-xs font-sans">
            No active supervisor auditing sheet loaded.
          </div>
        )}

      </div>

    </div>
  );
}
