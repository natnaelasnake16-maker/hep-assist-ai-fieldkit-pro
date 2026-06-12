/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { saveCase, getAppPrefs, subscribeToStateChanges } from '../services/api';
import { UrgencyLevel, CaseIntake } from '../types';
import { 
  UserPlus, 
  Activity, 
  Thermometer, 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  RefreshCw, 
  ClipboardCheck, 
  Info,
  Sliders,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface CaseIntakePageProps {
  setActiveTab: (tab: string) => void;
}

const REGIONS = ['Amhara', 'Oromia', 'Tigray', 'Sidama', 'Somali', 'Addis Ababa'];

export default function CaseIntakePage({ setActiveTab }: CaseIntakePageProps) {
  const [prefs, setPrefs] = useState(getAppPrefs());
  
  // Basc Demographics
  const [age, setAge] = useState<number>(3);
  const [ageUnit, setAgeUnit] = useState<'Years' | 'Months' | 'Days'>('Years');
  const [sex, setSex] = useState<'Male' | 'Female'>('Male');
  const [pregnancyStatus, setPregnancyStatus] = useState<'Not Pregnant' | 'Pregnant' | 'N/A'>('N/A');
  const [region, setRegion] = useState<string>(prefs.defaultRegion || 'Amhara');
  const [woreda, setWoreda] = useState<string>(prefs.defaultWoreda || 'Debre Birhan');
  const [facilityName, setFacilityName] = useState<string>(prefs.defaultFacility || 'Tebase Health Post');

  // Vitals
  const [temperature, setTemperature] = useState<number>(37.0);
  const [respiratoryRate, setRespiratoryRate] = useState<number>(24);
  const [symptomDurationDays, setSymptomDurationDays] = useState<number>(3);

  // Core symptoms check
  const [vomits, setVomits] = useState(false);
  const [convulsions, setConvulsions] = useState(false);
  const [lethargic, setLethargic] = useState(false);
  const [unableToFeed, setUnableToFeed] = useState(false);
  const [cough, setCough] = useState(false);
  const [diarrhea, setDiarrhea] = useState(false);
  const [chestIndrawing, setChestIndrawing] = useState(false);
  const [dehydrationSigns, setDehydrationSigns] = useState(false);
  const [bleedingDuringPregnancy, setBleedingDuringPregnancy] = useState(false);
  const [severeHeadache, setSevereHeadache] = useState(false);
  const [reducedFetalMovement, setReducedFetalMovement] = useState(false);

  // Live calculated warning list
  const [warnings, setWarnings] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    const unsub = subscribeToStateChanges(() => {
      setPrefs(getAppPrefs());
    });
    return unsub;
  }, []);

  // Sync preferences defaults if they change
  useEffect(() => {
    if (prefs.defaultRegion) setRegion(prefs.defaultRegion);
    if (prefs.defaultWoreda) setWoreda(prefs.defaultWoreda);
    if (prefs.defaultFacility) setFacilityName(prefs.defaultFacility);
  }, [prefs]);

  // Real-time clinical logic trigger (simulating local rules engine checks)
  useEffect(() => {
    const arr: string[] = [];
    
    if (temperature >= 38.5) {
      arr.push('High Fever (ትኩሳት ≥ 38.5°C) • Danger of sepsis or severe malaria');
    } else if (temperature < 35.5) {
      arr.push('Hypothermia (ቅዝቃዜ < 35.5°C) • Danger of shock or severe infection');
    }

    if (ageUnit === 'Years' && age < 5) {
      if (respiratoryRate >= 40 && age >= 1) {
        arr.push(`Fast Breathing (ፈጣን ትንፋሽ ≥ 40/m) • Immediate risk of Pneumonia`);
      }
    } else if (ageUnit === 'Months' && age < 12) {
      if (respiratoryRate >= 50) {
        arr.push(`Fast Breathing (ፈጣን ትንፋሽ ≥ 50/m) • Immediate risk of Pneumonia`);
      }
    }

    if (chestIndrawing) {
      arr.push('Chest Indrawing (የደረት መጎዝጎዝ) • Emergency sign of severe respiratory distress');
    }
    if (unableToFeed) {
      arr.push('Inability to feed/drink (ጡት አለመጥባት) • Critical newborn danger sign');
    }
    if (convulsions) {
      arr.push('Active history of convulsions (የንቅጥቅጥ ታሪክ) • Requires direct emergency referral');
    }
    if (lethargic) {
      arr.push('Lethargy / Unconsciousness (ንቃት ማጣት) • Immediate resuscitation pathway indication');
    }
    if (diarrhea && dehydrationSigns) {
      arr.push('Dehydration Signs (የውሃ እጥረት ምልክቶች) • Imminent hypovolemic complications');
    }

    // Pregnancy danger signs checks
    if (pregnancyStatus === 'Pregnant') {
      if (bleedingDuringPregnancy) {
        arr.push('Obstetric Bleeding (በእርግዝና ወቅት ደም መፍሰስ) • Critical emergency maternal risk');
      }
      if (severeHeadache) {
        arr.push('Severe Gestational Headache (ಪ್ರင်းထን ራስ ምታት) • Active risk of pre-eclampsia');
      }
      if (reducedFetalMovement) {
        arr.push('Reduced Fetal Movement (የፅንስ እንቅስቃሴ መቀነስ) • Instant child fetal distress warning');
      }
    }

    setWarnings(arr);
  }, [
    age, ageUnit, temperature, respiratoryRate, vomits, convulsions, lethargic, 
    unableToFeed, cough, diarrhea, chestIndrawing, dehydrationSigns, 
    bleedingDuringPregnancy, severeHeadache, reducedFetalMovement, pregnancyStatus
  ]);

  const handleClear = () => {
    setAge(3);
    setAgeUnit('Years');
    setSex('Male');
    setPregnancyStatus('N/A');
    setTemperature(37.0);
    setRespiratoryRate(24);
    setSymptomDurationDays(3);
    setVomits(false);
    setConvulsions(false);
    setLethargic(false);
    setUnableToFeed(false);
    setCough(false);
    setDiarrhea(false);
    setChestIndrawing(false);
    setDehydrationSigns(false);
    setBleedingDuringPregnancy(false);
    setSevereHeadache(false);
    setReducedFetalMovement(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Determine default triage urgency locally prior to AI execution
    let urgency: UrgencyLevel = 'Routine';
    if (convulsions || lethargic || unableToFeed || chestIndrawing || temperature >= 39.0 || (pregnancyStatus === 'Pregnant' && bleedingDuringPregnancy)) {
      urgency = 'Emergency';
    } else if (vomits || temperature >= 38.0 || respiratoryRate >= 40 || (pregnancyStatus === 'Pregnant' && severeHeadache)) {
      urgency = 'Same-day';
    }

    const isNewborn = ageUnit.toLowerCase() === 'days' || (ageUnit.toLowerCase() === 'months' && age <= 1);
    
    // Map pregnancyStatus from UI option to types.ts values
    let cleanPregnancyStatus: 'No' | 'Yes' | 'Unknown' | 'N/A' = 'N/A';
    if (pregnancyStatus === 'Pregnant') cleanPregnancyStatus = 'Yes';
    else if (pregnancyStatus === 'Not Pregnant') cleanPregnancyStatus = 'No';

    const createdRecord: CaseIntake = {
      id: `case-${Date.now()}`,
      basics: {
        age,
        ageUnit: ageUnit.toLowerCase() as 'years' | 'months' | 'days',
        sex: sex as 'Male' | 'Female',
        pregnancyStatus: cleanPregnancyStatus,
        isNewborn,
        region,
        woreda,
        facilityName
      },
      vitals: {
        temperature,
        respiratoryRate,
        symptomDurationDays
      },
      symptoms: {
        fever: temperature >= 37.5,
        cough,
        fastBreathing: (ageUnit.toLowerCase() === 'years' && age < 5 && respiratoryRate >= 40) || (ageUnit.toLowerCase() === 'months' && respiratoryRate >= 50),
        chestIndrawing,
        convulsions,
        lethargy: lethargic,
        unableToDrink: unableToFeed,
        vomitingEverything: vomits,
        diarrhea,
        dehydrationSigns,
        bleedingDuringPregnancy,
        severeHeadache,
        reducedFetalMovement
      },
      dangerSignsDetected: warnings,
      createdAt: new Date().toISOString()
    };

    saveCase(createdRecord);
    setSuccessMsg(true);
    handleClear();
    
    setTimeout(() => {
      setSuccessMsg(false);
      setActiveTab('assistant');
    }, 1800);
  };

  // Determine diagnostic box urgency styling
  const isEmergencyActive = warnings.some(w => w.includes('Emergency') || w.includes('Critical') || w.includes('convulsions') || w.includes('Lethargy') || w.includes('Chest Indrawing'));
  
  return (
    <div className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto bg-slate-50">
      
      {/* Title */}
      <div className="border-b border-slate-200/80 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-sans font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <span>Structured Client Intake Workbook</span>
          </h2>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Register diagnostic coordinates to unlock immediate localized RAG validation.
          </p>
        </div>
        
        {successMsg && (
          <div className="p-2.5 px-4 bg-teal-50 border border-teal-300 text-teal-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-pulse shadow-sm">
            <CheckCircle className="w-4 h-4 text-teal-600" />
            <span>Intake Draft Registered. Routing to Triage Board...</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
        
        {/* LEFT & CENTER: INPUT WORKBOOK SHIELD (2 Columns space) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Demographics */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 space-y-4 shadow-2xs">
            <h3 className="font-sans font-bold text-slate-900 text-xs uppercase tracking-widest border-b border-slate-150 pb-2 flex items-center gap-1.5">
              <ClipboardCheck className="w-4 h-4 text-slate-400" />
              <span>1. Demographics & Jurisdiction Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Patient Age</label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={age}
                    onChange={e => setAge(Number(e.target.value))}
                    required
                    className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-slate-850 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs sm:text-xs md:text-sm"
                  />
                  <select
                    value={ageUnit}
                    onChange={e => setAgeUnit(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200/90 rounded-xl px-2 text-xs font-bold focus:outline-none"
                  >
                    <option value="Years">Years</option>
                    <option value="Months">Months</option>
                    <option value="Days">Days</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Patient Sex</label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-50 border border-slate-200/95 p-1 rounded-xl">
                  {(['Male', 'Female'] as const).map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setSex(option);
                        if (option === 'Male') setPregnancyStatus('N/A');
                        else setPregnancyStatus('Not Pregnant');
                      }}
                      className={`py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        sex === option 
                          ? 'bg-white text-slate-905 border border-slate-200/80 shadow-3xs' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Gestational Status</label>
                <select
                  value={pregnancyStatus}
                  onChange={e => setPregnancyStatus(e.target.value as any)}
                  disabled={sex === 'Male'}
                  className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none disabled:opacity-45"
                >
                  <option value="N/A">N/A (Male)</option>
                  <option value="Not Pregnant">Not Pregnant</option>
                  <option value="Pregnant">Pregnant</option>
                </select>
              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Administrative Region</label>
                <select
                  value={region}
                  onChange={e => setRegion(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                >
                  {REGIONS.map(reg => (
                    <option key={reg} value={reg}>{reg}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Woreda / Kebele</label>
                <input
                  type="text"
                  value={woreda}
                  onChange={e => setWoreda(e.target.value)}
                  required
                  placeholder="e.g. Debre Birhan"
                  className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Active Health Post Post Name</label>
                <input
                  type="text"
                  value={facilityName}
                  onChange={e => setFacilityName(e.target.value)}
                  required
                  placeholder="e.g. Tebase HP"
                  className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none text-slate-800"
                />
              </div>

            </div>
          </div>

          {/* Card 2: Physical Vitals Coordinates */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 space-y-4 shadow-2xs">
            <h3 className="font-sans font-bold text-slate-900 text-xs uppercase tracking-widest border-b border-slate-150 pb-2 flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-rose-500 shrink-0" />
              <span>2. Objective Metric Vital Signs</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Body Temperature (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  min={33}
                  max={43}
                  value={temperature}
                  onChange={e => setTemperature(Number(e.target.value))}
                  required
                  className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-slate-850 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs sm:text-xs md:text-sm font-mono"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Hypo: &lt;35.5</span>
                  <span>Hyper: &ge;38.5</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 flex items-center justify-between">
                  <span>Respiratory Rate (/m)</span>
                </label>
                <input
                  type="number"
                  min={10}
                  max={90}
                  value={respiratoryRate}
                  onChange={e => setRespiratoryRate(Number(e.target.value))}
                  required
                  className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-slate-855 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs sm:text-xs md:text-sm font-mono"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Normal: 18-30</span>
                  <span>Fast: &ge;40</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Symptom Duration (Days)</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={symptomDurationDays}
                  onChange={e => setSymptomDurationDays(Number(e.target.value))}
                  required
                  className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-slate-850 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs sm:text-xs md:text-sm font-mono"
                />
                <div className="text-[10px] text-slate-400">Total clinical illness timeframe</div>
              </div>

            </div>
          </div>

          {/* Card 3: Priority Symptom Checkbox Panels */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 space-y-5 shadow-2xs">
            <h3 className="font-sans font-bold text-slate-900 text-xs uppercase tracking-widest border-b border-slate-150 pb-2 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>3. Clinical Decision-Support Checklists & Safety Markers</span>
            </h3>

            {/* Sub-section A: Pediatric Markers */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 tracking-wider uppercase">Pediatric Status (WHO IMNCI Rules)</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-start gap-3 p-3 border border-slate-200 bg-slate-50/20 hover:bg-slate-50 transition-colors rounded-2xl cursor-pointer">
                  <input
                    type="checkbox"
                    id="feed-check"
                    checked={unableToFeed}
                    onChange={e => setUnableToFeed(e.target.checked)}
                    className="w-5 h-5 accent-rose-600 border-slate-305 rounded-xl mt-0.5 shrink-0"
                  />
                  <label htmlFor="feed-check" className="text-xs cursor-pointer select-none">
                    <span className="block font-bold text-slate-800">Cannot drink or feed (ለመመገብ / ለመጠጣት መቸገር)</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Unable to swallow, vomits everything, or refuses nursing entirely.</span>
                  </label>
                </div>

                <div className="flex items-start gap-3 p-3 border border-slate-200 bg-slate-50/20 hover:bg-slate-50 transition-colors rounded-2xl cursor-pointer">
                  <input
                    type="checkbox"
                    id="vomit-check"
                    checked={vomits}
                    onChange={e => setVomits(e.target.checked)}
                    className="w-5 h-5 accent-blue-600 border-slate-305 rounded-xl mt-0.5 shrink-0"
                  />
                  <label htmlFor="vomit-check" className="text-xs cursor-pointer select-none">
                    <span className="block font-bold text-slate-800">Persistent Vomiting (በትውከት መቸገር)</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Inability to hold down any fluids or oral medication doses.</span>
                  </label>
                </div>

                <div className="flex items-start gap-3 p-3 border border-slate-200 bg-slate-50/20 hover:bg-slate-50 transition-colors rounded-2xl cursor-pointer">
                  <input
                    type="checkbox"
                    id="convulse-check"
                    checked={convulsions}
                    onChange={e => setConvulsions(e.target.checked)}
                    className="w-5 h-5 accent-rose-600 border-slate-305 rounded-xl mt-0.5 shrink-0"
                  />
                  <label htmlFor="convulse-check" className="text-xs cursor-pointer select-none">
                    <span className="block font-bold text-slate-800">History of Convulsions (የንቅጥቅጥ ታሪክ)</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Fits, spasms or involuntary shaking observed during the illness.</span>
                  </label>
                </div>

                <div className="flex items-start gap-3 p-3 border border-slate-200 bg-slate-50/20 hover:bg-slate-50 transition-colors rounded-2xl cursor-pointer">
                  <input
                    type="checkbox"
                    id="indrawl-check"
                    checked={chestIndrawing}
                    onChange={e => setChestIndrawing(e.target.checked)}
                    className="w-5 h-5 accent-rose-600 border-slate-305 rounded-xl mt-0.5 shrink-0"
                  />
                  <label htmlFor="indrawl-check" className="text-xs cursor-pointer select-none">
                    <span className="block font-bold text-slate-800">Chest Indrawing (የደረት መጎዝጎዝ)</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Rib margin slips deep underneath during normal inspirations.</span>
                  </label>
                </div>

                <div className="flex items-start gap-3 p-3 border border-slate-200 bg-slate-50/20 hover:bg-slate-50 transition-colors rounded-2xl cursor-pointer">
                  <input
                    type="checkbox"
                    id="lethargy-check"
                    checked={lethargic}
                    onChange={e => setLethargic(e.target.checked)}
                    className="w-5 h-5 accent-rose-600 border-slate-305 rounded-xl mt-0.5 shrink-0"
                  />
                  <label htmlFor="lethargy-check" className="text-xs cursor-pointer select-none">
                    <span className="block font-bold text-slate-800">Lethargic / Unconscious (ንቃት ማጣት / መፍዘዝ)</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Abnormally drowsy, sleepy, or completely unresponsive to voice check.</span>
                  </label>
                </div>

                <div className="flex items-start gap-3 p-3 border border-slate-200 bg-slate-50/20 hover:bg-slate-50 transition-colors rounded-2xl cursor-pointer">
                  <input
                    type="checkbox"
                    id="cough-check"
                    checked={cough}
                    onChange={e => setCough(e.target.checked)}
                    className="w-5 h-5 accent-blue-600 border-slate-305 rounded-xl mt-0.5 shrink-0"
                  />
                  <label htmlFor="cough-check" className="text-xs cursor-pointer select-none">
                    <span className="block font-bold text-slate-800">Cough (ሳል)</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Present persistent background dry or productive pediatric cough.</span>
                  </label>
                </div>

                <div className="flex items-start gap-3 p-3 border border-slate-200 bg-slate-50/20 hover:bg-slate-50 transition-colors rounded-2xl cursor-pointer">
                  <input
                    type="checkbox"
                    id="diarrheal-check"
                    checked={diarrhea}
                    onChange={e => setDiarrhea(e.target.checked)}
                    className="w-5 h-5 accent-blue-600 border-slate-305 rounded-xl mt-0.5 shrink-0"
                  />
                  <label htmlFor="diarrheal-check" className="text-xs cursor-pointer select-none">
                    <span className="block font-bold text-slate-800">Diarrhea (ተቅማጥ / ፈሳሽ ሰገራ)</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Active passage of loose watery frequent bowel movements.</span>
                  </label>
                </div>

                <div className={`flex items-start gap-3 p-3 border transition-colors rounded-2xl cursor-pointer ${diarrhea ? 'border-amber-200 bg-amber-50/10 hover:bg-amber-50/40' : 'border-slate-100 bg-slate-50/10 opacity-50'}`}>
                  <input
                    type="checkbox"
                    id="dehydration-check"
                    disabled={!diarrhea}
                    checked={dehydrationSigns}
                    onChange={e => setDehydrationSigns(e.target.checked)}
                    className="w-5 h-5 accent-amber-600 border-slate-200 rounded-xl mt-0.5 shrink-0 disabled:opacity-50"
                  />
                  <label htmlFor="dehydration-check" className="text-xs cursor-pointer select-none">
                    <span className="block font-bold text-slate-800">Dehydration Signs (የውሃ እጥረት ምልክቶች)</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Sunken eyes, very slow skin pinch return, restlessness or extreme lethargy.</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Sub-section B: Maternal Danger Signs */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-500 tracking-wider uppercase">Maternal Pregnancy Status (Maternal Guide)</h4>
                {pregnancyStatus !== 'Pregnant' && (
                  <span className="text-[10px] text-slate-500 italic bg-slate-100 px-2 py-0.5 rounded-full select-none border border-slate-205">Locked: Patient is not marked as Pregnant</span>
                )}
              </div>
              
              <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 ${pregnancyStatus !== 'Pregnant' ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="flex items-start gap-3 p-3 border border-slate-200 bg-slate-50/20 hover:bg-slate-50 transition-colors rounded-2xl cursor-pointer">
                  <input
                    type="checkbox"
                    id="bleed-preg-check"
                    disabled={pregnancyStatus !== 'Pregnant'}
                    checked={bleedingDuringPregnancy}
                    onChange={e => setBleedingDuringPregnancy(e.target.checked)}
                    className="w-5 h-5 accent-rose-600 border-slate-305 rounded-xl mt-0.5 shrink-0"
                  />
                  <label htmlFor="bleed-preg-check" className="text-xs cursor-pointer select-none">
                    <span className="block font-bold text-slate-800">Pregnancy Bleeding (ደም መፍሰስ)</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Any active third trimester vaginal bleeding, spotting, or discharge.</span>
                  </label>
                </div>

                <div className="flex items-start gap-3 p-3 border border-slate-200 bg-slate-50/20 hover:bg-slate-50 transition-colors rounded-2xl cursor-pointer">
                  <input
                    type="checkbox"
                    id="headache-preg-check"
                    disabled={pregnancyStatus !== 'Pregnant'}
                    checked={severeHeadache}
                    onChange={e => setSevereHeadache(e.target.checked)}
                    className="w-5 h-5 accent-blue-600 border-slate-305 rounded-xl mt-0.5 shrink-0"
                  />
                  <label htmlFor="headache-preg-check" className="text-xs cursor-pointer select-none">
                    <span className="block font-bold text-slate-800">Severe Headache (ပြင်းထን ራስ ምታት)</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Persistent, worsening frontal throbbing headache (pre-eclampsia flag).</span>
                  </label>
                </div>

                <div className="flex items-start gap-3 p-3 border border-slate-200 bg-slate-50/20 hover:bg-slate-50 transition-colors rounded-2xl cursor-pointer">
                  <input
                    type="checkbox"
                    id="fetal-preg-check"
                    disabled={pregnancyStatus !== 'Pregnant'}
                    checked={reducedFetalMovement}
                    onChange={e => setReducedFetalMovement(e.target.checked)}
                    className="w-5 h-5 accent-amber-600 border-slate-305 rounded-xl mt-0.5 shrink-0"
                  />
                  <label htmlFor="fetal-preg-check" className="text-xs cursor-pointer select-none">
                    <span className="block font-bold text-slate-800">Reduced Fetal Movement (እንቅስቃሴ መቀነስ)</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Noticeable drop in standard maternal fetal kicks or responses.</span>
                  </label>
                </div>
              </div>
            </div>

          </div>

          {/* Intake Submission Controls */}
          <div className="flex justify-end gap-3 pt-2 select-none">
            <button
              type="button"
              onClick={handleClear}
              className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-650 transition-colors cursor-pointer"
            >
              Reset Entry fields
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-slate-900 border-slate-900 text-teal-400 text-xs font-bold font-mono transition-transform hover:scale-[1.02] shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-teal-400" />
              <span>Register Patient Draft</span>
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: STICKY LIVE AI CLINICAL RISK classification PORTAL */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 space-y-4 shadow-sm relative lg:sticky lg:top-24">
            
            <div className="flex items-center gap-2 border-b border-slate-150 pb-2.5">
              <Activity className="w-5 h-5 text-blue-605 text-blue-600 animate-pulse shrink-0" />
              <h4 className="font-bold text-slate-850 text-slate-900 text-xs uppercase tracking-wider leading-none">
                Live Protocol Safety Guard
              </h4>
            </div>

            <p className="text-xs text-slate-500 font-sans leading-relaxed">
              Calculates priority clinical flags automatically in the background using on-device medical logic checks.
            </p>

            {warnings.length === 0 ? (
              <div className="p-5 bg-emerald-50/65 border border-emerald-200 rounded-2xl text-emerald-800 text-xs text-center space-y-2 animate-fade-in">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                <h5 className="font-bold text-emerald-900 leading-tight">Vitals Stable & Clear</h5>
                <p className="font-medium text-slate-650 font-sans text-emerald-700">No priority safety flags active for current selections.</p>
              </div>
            ) : (
              <div className={`p-4 rounded-2xl border animate-fade-in ${isEmergencyActive ? 'bg-rose-50/70 border-rose-250 border-rose-300' : 'bg-amber-50/70 border-amber-250 border-amber-300'}`}>
                <div className="flex gap-2 text-[10px] font-bold uppercase tracking-widest items-center">
                  <ShieldAlert className={`w-4 h-4 shrink-0 ${isEmergencyActive ? 'text-rose-600' : 'text-amber-550'}`} />
                  <span className={isEmergencyActive ? 'text-rose-905 text-rose-800' : 'text-amber-900Item text-amber-805 text-amber-850'}>
                    {isEmergencyActive ? 'Critical Health Alarms' : 'Guideline Discrepancies'}
                  </span>
                </div>

                <div className="space-y-2 mt-3 select-none">
                  {warnings.map((text, idx) => (
                    <div key={idx} className="p-2.5 bg-white border border-slate-100 rounded-xl text-xs flex gap-2 items-start shadow-3xs">
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${isEmergencyActive ? 'bg-rose-500 animate-ping' : 'bg-amber-500'}`} />
                      <span className="font-bold text-slate-700 leading-tight">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Helper guidelines Info */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs font-sans text-slate-600 line-clamp-4">
              <div className="flex gap-1.5 font-bold text-slate-800 tracking-tight items-center">
                <Info className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Standard MOH Referral guidelines Info</span>
              </div>
              <p className="leading-relaxed text-[11px] text-slate-500">
                Children presenting convulsive episodes, chest retraction, or lethargic symptoms are IMNCI referral category 1. These require supportive pediatric therapy and immediate hospital dispatch.
              </p>
            </div>

          </div>
        </div>

      </form>

    </div>
  );
}
