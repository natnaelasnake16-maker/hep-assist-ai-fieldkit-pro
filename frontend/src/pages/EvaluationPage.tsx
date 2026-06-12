/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { getEvaluationTestCases, getEvaluationSummary, runMockEvaluation } from '../services/api';
import { EvaluationTestCase, EvaluationSummary } from '../types';
import { 
  FileCheck, 
  Play, 
  Cpu, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Lock,
  ChevronRight,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';

export default function EvaluationPage() {
  const [testCases, setTestCases] = useState<EvaluationTestCase[]>([]);
  const [summary, setSummary] = useState<EvaluationSummary | null>(null);
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    loadEvalData();
  }, []);

  const loadEvalData = () => {
    setTestCases(getEvaluationTestCases());
    setSummary(getEvaluationSummary());
  };

  const executeEvaluationRun = async () => {
    setEvaluating(true);
    await runMockEvaluation();
    loadEvalData();
    setEvaluating(false);
  };

  return (
    <div className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto bg-slate-50 select-none">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 gap-3">
        <div>
          <h2 className="text-xl font-sans font-bold text-slate-905 text-slate-900 tracking-tight flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-600" />
            <span>LLM-as-a-Judge Clinical Safety Auditing</span>
          </h2>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Audit triage accuracy, hallucination risks, PII redaction rates, and MOH compliance across simulated field protocols.
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            type="button"
            disabled={evaluating}
            onClick={executeEvaluationRun}
            className="px-4 py-2.5 bg-slate-905 bg-slate-900 text-teal-400 font-mono text-xs font-bold rounded-xl border border-slate-800 hover:scale-[1.01] transition-transform flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {evaluating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
                <span>EVALUATING TEST MATRIX (N=50)...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current text-teal-450 text-teal-400" />
                <span>RUN RE Rubric SIMULATION</span>
              </>
            )}
          </button>
        </div>
      </div>

      {evaluating && (
        <div className="p-4 bg-teal-50 border border-teal-205 border-teal-200 text-teal-850 text-teal-800 rounded-2xl flex items-center gap-3 text-xs font-bold animate-pulse font-sans">
          <Loader2 className="w-4 h-4 text-teal-655 text-teal-605 animate-spin shrink-0" />
          <span>Analyzing diagnostic metrics. Verification of Amharic / English ground truths is in progress...</span>
        </div>
      )}

      {/* Grid summarizing benchmarks */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-3 font-sans">
          {[
            { label: 'Triage Accuracy', val: `${summary.urgencyAccuracy.toFixed(1)}%`, color: 'text-blue-700 bg-blue-50/50 border-blue-100' },
            { label: 'Citation Coverage', val: `${summary.citationCoverage.toFixed(1)}%`, color: 'text-teal-700 bg-teal-50/50 border-teal-100' },
            { label: 'Hallucination Risk', val: `${summary.hallucinationRisk.toFixed(2)}%`, color: 'text-rose-700 bg-rose-50/50 border-rose-100' },
            { label: 'Faithfulness Score', val: `${summary.faithfulnessScore.toFixed(2)}`, color: 'text-emerald-700 bg-emerald-50/50 border-emerald-105' },
            { label: 'PII Redact Rate', val: `${summary.piiRedactionRate.toFixed(1)}%`, color: 'text-purple-705 text-purple-700 bg-purple-50/50 border-purple-100' },
            { label: 'Safety Route Rate', val: `${summary.safetyRoutingRate.toFixed(1)}%`, color: 'text-sky-700 bg-sky-50/50 border-sky-100' },
            { label: 'Amharic Pass Rate', val: `${summary.amharicPassRate.toFixed(1)}%`, color: 'text-amber-700 bg-amber-50/50 border-amber-100' },
            { label: 'Judge Latency', val: `${summary.averageLatencyMs}ms`, color: 'text-slate-705 text-slate-700 bg-slate-100/60 border-slate-200' },
            { label: 'Fallback Rate', val: `${summary.fallbackRate.toFixed(1)}%`, color: 'text-slate-800 bg-slate-200/50 border-slate-300' },
          ].map((item, idx) => (
            <div key={idx} className={`p-4 rounded-xl border flex flex-col justify-between ${item.color} shadow-3xs`}>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none block min-h-[14px]">
                {item.label}
              </span>
              <span className="text-sm sm:text-sm md:text-md font-black mt-2 block tracking-tight">
                {item.val}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Main evaluation table list */}
      <div className="bg-white border border-slate-205 border-slate-200 rounded-2xl shadow-3xs overflow-hidden font-sans">
        
        <div className="bg-slate-50 border-b border-slate-150 p-4 flex justify-between items-center select-none">
          <h3 className="font-extrabold text-slate-905 text-slate-900 text-xs uppercase tracking-widest flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Structured Verification Test Suite</span>
          </h3>
          <span className="text-[10px] text-slate-405 text-slate-400 font-mono font-bold">MOH-v1.5-COMPLIANCE</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/55 border-b border-slate-200 font-bold text-slate-500 uppercase text-[9px] tracking-wider select-none">
                <th className="px-5 py-3">Ground Truth Scenario Name</th>
                <th className="px-5 py-3">Language</th>
                <th className="px-5 py-3">Diagnostic Input parameters</th>
                <th className="px-5 py-3">Expected Triage</th>
                <th className="px-5 py-3">Judge Evaluation</th>
                <th className="px-5 py-3 text-center">Citation</th>
                <th className="px-5 py-3 text-center">PII Redacted</th>
                <th className="px-5 py-3">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {testCases.map((tc) => (
                <tr key={tc.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-extrabold text-slate-900 max-w-[200px]">{tc.name}</td>
                  <td className="px-5 py-3.5 uppercase font-mono font-semibold text-slate-500">{tc.language}</td>
                  <td className="px-5 py-3.5 text-slate-550 text-slate-500 italic max-w-xs truncate" title={tc.inputDescription}>
                    &ldquo;{tc.inputDescription}&rdquo;
                  </td>
                  <td className="px-5 py-3.5 font-bold text-slate-600">{tc.expectedUrgency}</td>
                  <td className="px-5 py-3.5 font-bold text-slate-800">{tc.actualUrgency}</td>
                  <td className="px-5 py-3.5 text-center font-bold">
                    {tc.citationsPresent ? (
                      <span className="text-teal-600 text-[10px] bg-teal-50 px-2 py-0.5 rounded border border-teal-100 font-bold">✓ Grounded</span>
                    ) : (
                      <span className="text-slate-400">- None</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center font-bold">
                    {tc.piiRedacted !== false ? (
                      <span className="text-purple-650 text-[10px] bg-purple-50 px-2 py-0.5 rounded border border-purple-100 font-bold flex items-center justify-center gap-1 w-fit mx-auto">
                        <Lock className="w-3 h-3 text-purple-600" />
                        <span>Secure</span>
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 pr-6">
                    {tc.status === 'Pass' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>PASSED</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>FAILED</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Model testing details */}
      <div className="bg-white border border-slate-205 border-slate-200 rounded-2xl p-5 space-y-4 shadow-3xs">
        <h3 className="font-sans font-bold text-slate-900 text-xs uppercase tracking-widest border-b border-slate-150 pb-2 select-none">
          Continuous AI Evaluator Methodology
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-650 leading-relaxed font-sans">
          
          <div className="space-y-1.5 border-l-2 border-slate-200 pl-4">
            <h4 className="font-sans font-bold text-slate-850 text-slate-900">1. Grounded Faithfulness (0-5)</h4>
            <p className="text-slate-500">
              Measures whether claims in the generated medicine summary can be directly inferred from the retrieved RAG protocol text passages without hallucinating extraneous instructions.
            </p>
          </div>

          <div className="space-y-1.5 border-l-2 border-slate-200 pl-4">
            <h4 className="font-sans font-bold text-slate-850 text-slate-900">2. Safety Triage Calibration</h4>
            <p className="text-slate-500">
              Verifies whether same-day, routine, and obstetric emergency categories adhere exactly to WHO IMNCI thresholds, ensuring extreme pediatric danger indicators instantly divert to supervisor desks.
            </p>
          </div>

          <div className="space-y-1.5 border-l-2 border-slate-200 pl-4">
            <h4 className="font-sans font-bold text-slate-850 text-slate-900">3. Active de-identification Rates</h4>
            <p className="text-slate-500">
              Ensures raw patient identifiers (names, kebele structures, exact age parameters) are completely obfuscated into compliant synthetic tokens prior to cloud model interaction.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
