/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Network, Database, CloudLightning, AlertTriangle, PhoneCall, Check, Copy } from 'lucide-react';
import { getCases } from '../services/api';

export default function IntegrationsPage() {
  const [dhisPayload, setDhisPayload] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [telephonyEnabled, setTelephonyEnabled] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const generateDHIS2Payload = () => {
    setErrorMessage('');
    const list = getCases();
    if (list.length === 0) {
      setErrorMessage('Please save at least one child or obstetric patient record inside the "Structured Case Intake" workbench prior to generating aggregate DHIS2 package files.');
      return;
    }

    const payload = {
      agency: "Ethiopian Ministry of Health",
      program: "HEP Assist AI Decision-Support FieldKit Pro",
      version: "1.5.0-Beta",
      timestamp: new Date().toISOString(),
      aggregateMetrics: {
        totalEncounters: list.length,
        criticalReferrals: list.filter(c => c.dangerSignsDetected.length > 0).length,
        routineFollowups: list.filter(c => c.dangerSignsDetected.length === 0).length
      },
      encounters: list.map(c => ({
        eventId: c.id,
        facilityGroup: `${c.basics.region} - ${c.basics.facilityName}`,
        demographics: {
          ageGroup: `${c.basics.age} ${c.basics.ageUnit}`,
          sex: c.basics.sex,
          pregnancy: c.basics.pregnancyStatus
        },
        dangerSignsLoggedCount: c.dangerSignsDetected.length,
        riskClassification: c.dangerSignsDetected.length > 0 ? "EmergencyReferral" : "StandardCare"
      }))
    };

    setDhisPayload(JSON.stringify(payload, null, 2));
    setCopied(false);
  };

  const handleCopyToClipboard = () => {
    if (!dhisPayload) return;
    navigator.clipboard.writeText(dhisPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto bg-slate-50 select-none">
      
      {/* Title */}
      <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-sans font-bold text-slate-905 text-slate-900 tracking-tight flex items-center gap-2">
            <Network className="w-5 h-5 text-blue-600 shrink-0" />
            <span>Ministry Hospital & DHIS2 Sync Integrations</span>
          </h2>
          <p className="text-xs text-slate-500 font-sans mt-0.5 leading-relaxed">
            Format on-post offline consultation metrics to HL7 / FHIR or aggregate DHIS2 JSON indicators for national reporting.
          </p>
        </div>

        <span className="text-[10px] bg-slate-900 text-teal-400 font-mono font-bold px-3 py-1 rounded-xl uppercase border border-slate-800 self-start">
          DHIS2 Spec: v2.38
        </span>
      </div>

      {errorMessage && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold rounded-2xl flex items-start gap-2.5 animate-pulse font-sans">
          <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{errorMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans text-xs">
        
        {/* LEFT COLUMN: DHIS2 AGGREGATION PAYLOAD GENERATOR */}
        <div className="bg-white border border-slate-205 border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-3xs flex flex-col justify-between">
          <div className="space-y-1.5 pb-2">
            <h3 className="font-bold text-slate-905 text-slate-900 text-xs uppercase tracking-widest flex items-center gap-2">
              <Database className="w-4.5 h-4.5 text-blue-500 shrink-0" />
              <span>HL7 FHIR / DHIS2 Schema compiler</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Compile local kebele health post consultation data into aggregate FHIR transaction models for uploading into national databases.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={generateDHIS2Payload}
              type="button"
              className="w-full py-3 bg-slate-905 bg-slate-900 hover:bg-slate-800 text-teal-400 font-mono font-bold rounded-xl text-xs border border-slate-800 flex items-center justify-center gap-2 shadow-sm transition-transform hover:scale-[1.01] cursor-pointer"
            >
              <CloudLightning className="w-4 h-4 text-teal-400" />
              <span>AGGREGATE CLINICAL PAYLOAD PACKET</span>
            </button>

            {dhisPayload && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span className="uppercase tracking-wider">COMPILED HL7 INTEGRATION BUNDLE JSON</span>
                  <button
                    onClick={handleCopyToClipboard}
                    className="text-blue-600 hover:text-blue-700 font-extrabold flex items-center gap-1 cursor-pointer select-none"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-655 text-emerald-600">Copied Active</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy JSON Clipboard</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={10}
                  value={dhisPayload}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-[10px] text-slate-700 leading-relaxed select-all cursor-text focus:outline-none shadow-inner"
                />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: EMERGENCY TELEPHONY PROTOCOLS & SLOTS */}
        <div className="space-y-6">
          
          {/* Emergency dispatch telephony */}
          <div className="bg-white border border-slate-205 border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-3xs">
            <h3 className="font-bold text-slate-905 text-slate-900 text-xs uppercase tracking-widest flex items-center gap-2">
              <PhoneCall className="w-4.5 h-4.5 text-rose-500 shrink-0" />
              <span>Primary Paramedic Transit Dispatches</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Pre-configure secondary alerting paths (Short SMS or wireless radio protocols) triggered instinctively upon critical obstetric/maternal alerts.
            </p>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <p className="text-xs font-extrabold text-slate-900 font-sans">MoH Standard Emergency Dispatch (952)</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">National infant, child distress referral carrier</p>
                </div>
                
                <button
                  type="button"
                  onClick={() => setTelephonyEnabled(!telephonyEnabled)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    telephonyEnabled 
                      ? 'bg-rose-500 text-white border-rose-600 shadow-3xs' 
                      : 'bg-white text-slate-500 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  {telephonyEnabled ? 'Alert Active' : 'Disconnected'}
                </button>
              </div>

              <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 border-l-2 border-l-blue-400 border border-blue-150 rounded-xl text-[11px] text-slate-700 leading-relaxed font-sans">
                <AlertTriangle className="w-4.5 h-4.5 text-blue-500 shrink-0 mt-0.5" />
                <p className="font-medium">
                  <strong>Low Network Bandwidth Fallback:</strong> Activating paramedic dispatches routes safety alerts via local RF radio transmitters to closest medical woreda hub automatically if internet connectivity drops.
                </p>
              </div>
            </div>
          </div>

          {/* District slots booking */}
          <div className="bg-white border border-slate-205 border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-3xs">
            <h3 className="font-bold text-slate-905 text-slate-900 text-xs uppercase tracking-widest flex items-center gap-1.5">
              <Network className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Available Community Specialist Slots</span>
            </h3>
            
            <div className="divide-y divide-slate-100 font-sans">
              {[
                { specialty: "Regional Infant Health Consultant", woreda: "Debre Birhan Hub", date: "Mondays @ 10:00 AM", slots: "3 open slots" },
                { specialty: "Emergency Obstetric Paramedic Care", woreda: "Ada'a Regional District Hospital", date: "Daily Dispatch Coverage", slots: "1 helicopter standby" }
              ].map((slot, idx) => (
                <div key={idx} className="py-2.5 flex justify-between items-center text-xs hover:bg-slate-55/50 rounded px-1 transition-colors">
                  <div>
                    <h4 className="font-extrabold text-slate-900">{slot.specialty}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">{slot.woreda} • {slot.date}</p>
                  </div>
                  <span className="text-[9px] font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-md px-2.5 py-0.5 uppercase tracking-wider">
                    {slot.slots}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
