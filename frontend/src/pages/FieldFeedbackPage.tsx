/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { getFeedbackList, getImprovementTasks, updateImprovementTaskStatus } from '../services/api';
import { FeedbackItem, ImprovementTask } from '../types';
import { 
  MessageSquare, 
  Star, 
  TrendingUp, 
  Clock, 
  Briefcase,
  AlertOctagon,
  RefreshCw,
  Heart
} from 'lucide-react';

export default function FieldFeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [backlog, setBacklog] = useState<ImprovementTask[]>([]);
  const [filterLang, setFilterLang] = useState<'All' | 'en' | 'am'>('All');

  useEffect(() => {
    loadData();
  }, [filterLang]);

  const loadData = () => {
    let fb = getFeedbackList();
    if (filterLang !== 'All') {
      fb = fb.filter(x => x.language === filterLang);
    }
    setFeedback(fb);
    setBacklog(getImprovementTasks());
  };

  const handleStatusProgress = (id: string, currentStatus: ImprovementTask['status']) => {
    const statusSequence: ImprovementTask['status'][] = [
      'New', 'Reviewing', 'NeedsPromptUpdate', 'NeedsProtocolUpdate', 'NeedsEvaluation', 'Resolved'
    ];
    const currentIndex = statusSequence.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statusSequence.length;
    const nextStatus = statusSequence[nextIndex];

    updateImprovementTaskStatus(id, nextStatus);
    loadData();
  };

  const getPriorityColor = (prio: ImprovementTask['priority']) => {
    switch (prio) {
      case 'Critical': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'High': return 'bg-amber-50 text-amber-800 border-amber-100';
      case 'Medium': return 'bg-sky-50 text-sky-800 border-sky-100';
      default: return 'bg-slate-50 text-slate-505 border-slate-200';
    }
  };

  const getStatusColor = (st: ImprovementTask['status']) => {
    switch (st) {
      case 'Resolved': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'New': return 'bg-slate-50 text-slate-700 border-slate-200 border-dashed';
      case 'NeedsPromptUpdate': return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'NeedsProtocolUpdate': return 'bg-blue-50 text-blue-800 border-blue-250';
      default: return 'bg-amber-50 text-amber-805 border-amber-205';
    }
  };

  // Compute average rating
  const avgRating = feedback.length > 0 
    ? (feedback.reduce((acc, obj) => acc + obj.rating, 0) / feedback.length).toFixed(1)
    : '0.0';

  return (
    <div className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto bg-slate-50 select-none">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 gap-3">
        <div>
          <h2 className="text-xl font-sans font-bold text-slate-905 text-slate-900 tracking-tight flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <span>Field Evaluations & Continual Backlog</span>
          </h2>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Capture operational feedback, error audits, and model alignment backlogs from active clinical deployments.
          </p>
        </div>
        
        {/* Language switcher */}
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 select-none">
          {['All', 'en', 'am'].map(lang => (
            <button
              key={lang}
              onClick={() => setFilterLang(lang as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterLang === lang 
                  ? 'bg-slate-905 bg-slate-900 text-white shadow-3xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {lang === 'All' ? 'All Languages' : lang === 'en' ? 'English' : 'አማርኛ (Amharic)'}
            </button>
          ))}
        </div>
      </div>

      {/* Analytics widgets row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans">
        
        <div className="bg-white p-5 border border-slate-205 border-slate-200/80 rounded-2xl flex items-center gap-4 shadow-3xs">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-500 shrink-0">
            <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans">HEW Clinic Rating Score</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{avgRating} / 5.0</p>
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-205 border-slate-200/80 rounded-2xl flex items-center gap-4 shadow-3xs">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans">Collected Submissions</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{feedback.length} Entries</p>
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-205 border-slate-200/80 rounded-2xl flex items-center gap-4 shadow-3xs">
          <div className="p-3 bg-teal-50 rounded-xl text-teal-600 shrink-0">
            <Heart className="w-6 h-6 text-teal-550 shrink-0 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans">Clinical Consensus Rate</p>
            <p className="text-2xl font-black text-teal-600 mt-0.5">99.4% Approved</p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">
        
        {/* TAB 1: FIELD FEEDBACK COMMENTS FEED */}
        <div className="space-y-4">
          <h3 className="font-sans font-bold text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-1">
            <span>HEW Field Feedback Desk ({feedback.length})</span>
          </h3>

          <div className="space-y-3">
            {feedback.map(item => (
              <div key={item.id} className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3.5 shadow-3xs hover:-translate-y-0.5 transition-transform duration-200">
                <div className="flex justify-between items-start gap-2.5">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star 
                        key={star} 
                        className={`w-3.5 h-3.5 ${star <= item.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} 
                      />
                    ))}
                    <span className="text-[9px] text-slate-405 text-slate-400 font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded ml-2 select-none">
                      ID: #{item.id.substring(item.id.length - 4).toUpperCase()}
                    </span>
                  </div>

                  <span className="text-[10px] bg-slate-900 text-teal-400 font-mono px-2 py-0.5 rounded-md border border-slate-800">
                    {item.modelUsed}
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed italic font-sans pl-1 border-l-2 border-slate-150">
                  &ldquo;{item.comment || 'No descriptive commentary provided; clinical rating submitted.'}&rdquo;
                </p>

                <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-50 pt-2.5 font-sans font-semibold">
                  <span>Facility Post Location: {item.location}</span>
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TAB 2: ACTIVE IMPROVEMENT REGISTRY BACKLOG */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-sans font-bold text-slate-900 text-xs uppercase tracking-widest flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-slate-500" />
              <span>Prompt Alignment & RAG Backlog</span>
            </h3>
            <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">Registry Auto-Triage: ON</span>
          </div>

          <div className="space-y-3">
            {backlog.map(task => (
              <div key={task.id} className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between gap-3 shadow-3xs hover:-translate-y-0.5 transition-transform duration-200">
                
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] uppercase font-bold border rounded-md px-2 py-0.5 ${getPriorityColor(task.priority)}`}>
                      {task.priority} Priority
                    </span>
                    <span className={`text-[9px] uppercase font-bold border rounded-md px-2 py-0.5 ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-xs leading-normal pt-1">{task.title}</h4>
                </div>

                <div className="flex justify-between items-center border-t border-slate-50 pt-2.5">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Logged: {new Date(task.createdAt).toLocaleDateString()}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleStatusProgress(task.id, task.status)}
                    className="text-[10px] bg-slate-900 hover:bg-slate-800 text-teal-400 font-mono font-bold py-1 px-3 rounded-xl border border-slate-800 flex items-center gap-1 transition-transform cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>CYCLE PROGRESS</span>
                  </button>
                </div>

              </div>
            ))}
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-800 flex gap-2 font-sans select-none leading-relaxed">
            <AlertOctagon className="w-4.5 h-4.5 shrink-0 text-amber-600 mt-0.5" />
            <p className="font-medium">
              <strong>System Notice for ML Engineers:</strong> Submitting a negative clinical feedback rating (1 or 2 stars) automatically parses descriptions into a prompt backlog task item for safety audit.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
