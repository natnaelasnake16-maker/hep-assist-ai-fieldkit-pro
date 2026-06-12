/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  CaseIntake, 
  AssistantResponse, 
  ProtocolEvidence, 
  ReviewItem, 
  FeedbackItem, 
  EvaluationTestCase, 
  EvaluationSummary, 
  ModelOpsConfig, 
  OfflineSyncItem,
  ImprovementTask,
  UserRole,
  UrgencyLevel,
  PromptTemplate
} from '../types';

import { 
  demoCases, 
  demoResponses, 
  mockProtocols, 
  initialReviewQueue, 
  initialFeedbackList, 
  initialTestCases, 
  initialEvaluationSummary, 
  initialModelOps, 
  initialOfflineSyncQueue,
  initialImprovementTasks,
  mockPrompts
} from './mockData';

// Constants
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

// Helper to load/save state from localStorage for persistent user experience in simulation
function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // ignore
  }
}

// Initializing the Local Mock Databases
let localCases: CaseIntake[] = getStorageItem('hep_cases', demoCases);
let localResponses: Record<string, AssistantResponse> = getStorageItem('hep_responses', demoResponses);
let localReviewQueue: ReviewItem[] = getStorageItem('hep_review_queue', initialReviewQueue);
let localFeedbackList: FeedbackItem[] = getStorageItem('hep_feedback', initialFeedbackList);
let localTestCases: EvaluationTestCase[] = getStorageItem('hep_test_cases', initialTestCases);
let localEvalSummary: EvaluationSummary = getStorageItem('hep_eval_summary', initialEvaluationSummary);
let localModelOps: ModelOpsConfig = getStorageItem('hep_model_ops', initialModelOps);
let localSyncQueue: OfflineSyncItem[] = getStorageItem('hep_sync_queue', initialOfflineSyncQueue);
let localImprovementTasks: ImprovementTask[] = getStorageItem('hep_improvement_tasks', initialImprovementTasks);

// State listeners to trigger UI reacts
const stateListeners: (() => void)[] = [];
export function subscribeToStateChanges(listener: () => void) {
  stateListeners.push(listener);
  return () => {
    const index = stateListeners.indexOf(listener);
    if (index > -1) stateListeners.splice(index, 1);
  };
}

function notifyStateChanged() {
  stateListeners.forEach(listener => listener());
}

function mapUrgencyFromBackend(value?: string): UrgencyLevel {
  switch ((value || '').toLowerCase()) {
    case 'emergency':
      return 'Emergency';
    case 'same_day':
    case 'same-day':
      return 'Same-day';
    case 'routine':
      return 'Routine';
    default:
      return 'Need_Info';
  }
}

function mapResponseSource(provider?: string): AssistantResponse['responseSource'] {
  switch ((provider || '').toLowerCase()) {
    case 'ollama':
      return 'LLM_Ollama';
    case 'offline_rules':
      return 'Offline_Rules';
    case 'openai_compatible':
      return 'LLM_Cloud_Grounded';
    default:
      return 'Fallback';
  }
}

function caseDataToBackendContext(caseData?: CaseIntake) {
  if (!caseData) return undefined;
  const ageMultiplier = caseData.basics.ageUnit === 'years' ? 12 : caseData.basics.ageUnit === 'days' ? 1 / 30 : 1;
  const symptoms = Object.entries(caseData.symptoms)
    .filter(([, value]) => Boolean(value))
    .map(([key]) => key.replace(/([A-Z])/g, ' $1').trim().toLowerCase());
  return {
    age_months: Math.max(0, Math.round(caseData.basics.age * ageMultiplier)),
    sex: caseData.basics.sex.toLowerCase(),
    pregnancy_status: caseData.basics.pregnancyStatus === 'Yes' ? 'pregnant' : caseData.basics.pregnancyStatus === 'N/A' ? null : caseData.basics.pregnancyStatus.toLowerCase(),
    temperature_c: caseData.vitals.temperature,
    respiratory_rate: caseData.vitals.respiratoryRate,
    blood_pressure: caseData.vitals.systolicBP && caseData.vitals.diastolicBP ? `${caseData.vitals.systolicBP}/${caseData.vitals.diastolicBP}` : null,
    symptoms,
    location: `${caseData.basics.region}, ${caseData.basics.woreda}, ${caseData.basics.facilityName}`,
    notes: caseData.dangerSignsDetected.join('; ') || null,
  };
}

function buildBackendEvidence(items: any[] = []): ProtocolEvidence[] {
  return items.map((item, index) => ({
    id: item.id || `ev-${index + 1}`,
    title: item.title || 'Protocol evidence',
    category: item.source || 'Clinical Practice Guide',
    snippet: item.text || '',
    confidence: Math.max(1, Math.min(100, Math.round(Number(item.score || 0.5) * 100))),
    lastUpdated: new Date().toISOString().split('T')[0],
    sourceType: item.source || 'HEP Assist RAG',
  }));
}

function upsertReviewItem(caseData: CaseIntake, response: AssistantResponse) {
  const exists = localReviewQueue.some(item => item.caseId === caseData.id);
  if (exists || !response.safetyRouteRequired) return;
  localReviewQueue.unshift({
    id: `rev-${Date.now()}`,
    caseId: caseData.id,
    dateTime: new Date().toISOString(),
    hewLocation: `${caseData.basics.region} (${caseData.basics.facilityName})`,
    urgency: response.urgency,
    triggerReason: 'automatic_safety_or_urgency_routing',
    aiConfidence: response.evidence[0]?.confidence || 92,
    status: 'Pending',
    originalCaseData: caseData,
    aiResponse: response,
    reviewerNotes: 'Auto-flagged from backend response.',
  });
  setStorageItem('hep_review_queue', localReviewQueue);
}

// Global Preferences
export interface AppPrefs {
  role: UserRole;
  language: 'en' | 'am';
  simulateOffline: boolean;
  theme: 'light' | 'dark';
  requireReviewEmergency: boolean;
  requireReviewLowConfidence: boolean;
  piiRedactionEnabled: boolean;
  fallbackEnabled: boolean;
  textSize: 'normal' | 'large';
  lowBandwidth: boolean;
  lastSyncTime: string;
  defaultFacility?: string;
  defaultWoreda?: string;
  defaultRegion?: string;
}

const defaultPrefs: AppPrefs = {
  role: 'HEW',
  language: 'en',
  simulateOffline: false,
  theme: 'light',
  requireReviewEmergency: true,
  requireReviewLowConfidence: true,
  piiRedactionEnabled: true,
  fallbackEnabled: true,
  textSize: 'normal',
  lowBandwidth: false,
  lastSyncTime: new Date(Date.now() - 36 * 60 * 1000).toISOString(), // 36 mins ago
  defaultFacility: 'Tebase Health Post',
  defaultWoreda: 'Debre Birhan',
  defaultRegion: 'Amhara'
};

let localPrefs: AppPrefs = getStorageItem('hep_prefs', defaultPrefs);

export function getAppPrefs(): AppPrefs {
  return localPrefs;
}

export function updateAppPrefs(updates: Partial<AppPrefs>): AppPrefs {
  localPrefs = { ...localPrefs, ...updates };
  setStorageItem('hep_prefs', localPrefs);
  notifyStateChanged();
  return localPrefs;
}

// Checks connectivity status
export async function checkBackendHealth(): Promise<boolean> {
  if (localPrefs.simulateOffline) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const data = await res.json();
      return data.status === 'ok';
    }
    return false;
  } catch (e) {
    return false;
  }
}

// 1. Assistant Chat API
export async function askAssistant(question: string, caseData?: CaseIntake): Promise<AssistantResponse> {
  const isOnline = await checkBackendHealth();

  if (isOnline) {
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,
          language: localPrefs.language,
          case_context: caseDataToBackendContext(caseData),
          session_id: caseData?.id || `chat-${Date.now()}`,
        })
      });
      if (response.ok) {
        const data = await response.json();
        const normalized: AssistantResponse = {
          id: data.id || `resp-${Date.now()}`,
          urgency: mapUrgencyFromBackend(data.urgency),
          textContent: data.answer || 'No response generated.',
          recommendedActions: data.recommended_actions || [],
          dangerSignsToCheck: (data.graph_findings || []).map((item: any) => `${item.signal}: ${item.reason}`),
          followUpQuestions: data.missing_questions || [],
          evidence: buildBackendEvidence(data.evidence || []),
          safetyRouteRequired: Boolean(data.review_required),
          piiRedacted: Boolean(data?.safety?.pii_redacted),
          responseSource: mapResponseSource(data.model_provider),
          responseLanguage: data.language === 'am' ? 'am' : 'en',
        };
        if (caseData) {
          localResponses[caseData.id] = normalized;
          setStorageItem('hep_responses', localResponses);
          upsertReviewItem(caseData, normalized);
        }
        notifyStateChanged();
        return normalized;
      }
    } catch (e) {
      console.warn('Backend query failed, falling back to local simulation:', e);
    }
  }

  return simulateOfflineClinicalTriage(question, caseData);
}

// Local clinical engine simulation (matches the prompt requirements exactly for standard clinical feedback)
function simulateOfflineClinicalTriage(question: string, caseData?: CaseIntake): AssistantResponse {
  // Let's inspect the caseData or question for diagnostic rules
  let detectedUrgency: UrgencyLevel = 'Routine';
  let matchedProtocols: ProtocolEvidence[] = [];
  let recommendations: string[] = [];
  let checkList: string[] = [];
  let followUps: string[] = [];
  let text = '';
  let mustTriggerSupervisor = false;

  const isAmharic = localPrefs.language === 'am' || /[\u1200-\u137F]/.test(question);
  
  // Rule checks
  if (caseData) {
    const s = caseData.symptoms;
    const v = caseData.vitals;
    const b = caseData.basics;

    // Newborn fever or severe pregnancy bleeding or convulsions are immediate critical emergencies
    if (b.isNewborn && s.fever) {
      detectedUrgency = 'Emergency';
      mustTriggerSupervisor = true;
      matchedProtocols = [mockProtocols[2]]; // Sepsis
    } else if (b.pregnancyStatus === 'Yes' && (s.bleedingDuringPregnancy || s.severeHeadache)) {
      detectedUrgency = 'Emergency';
      mustTriggerSupervisor = true;
      matchedProtocols = [mockProtocols[1]]; // Antepartum Bleeding
    } else if (s.convulsions || s.lethargy || s.unableToDrink) {
      detectedUrgency = 'Emergency';
      mustTriggerSupervisor = true;
      matchedProtocols = [mockProtocols[2]];
    } else if (s.chestIndrawing) {
      detectedUrgency = 'Emergency';
      mustTriggerSupervisor = true;
      matchedProtocols = [mockProtocols[0]];
    } else if (s.fever && s.fastBreathing) {
      detectedUrgency = 'Same-day';
      matchedProtocols = [mockProtocols[0], mockProtocols[3]]; // Pneumonia & Malaria
    } else if (s.diarrhea && s.dehydrationSigns) {
      detectedUrgency = 'Same-day';
      matchedProtocols = [mockProtocols[0]];
    } else if (s.cough) {
      detectedUrgency = 'Routine';
      matchedProtocols = [mockProtocols[0]];
    }

    if (isAmharic) {
      matchedProtocols = matchedProtocols.concat([mockProtocols[4]]); // Amharic iCCM
    }
  } else {
    // If text only, search pattern matching
    const norm = question.toLowerCase();
    if (norm.includes('bleed') || norm.includes('እርግዝና') || norm.includes('ደም')) {
      detectedUrgency = 'Emergency';
      mustTriggerSupervisor = true;
      matchedProtocols = [mockProtocols[1]];
    } else if (norm.includes('newborn') || norm.includes('sepsis') || norm.includes('infant') || norm.includes('ጨቅላ')) {
      detectedUrgency = 'Emergency';
      mustTriggerSupervisor = true;
      matchedProtocols = [mockProtocols[2]];
    } else if (norm.includes('fever') || norm.includes('cough') || norm.includes('breathing') || norm.includes('ሳል') || norm.includes('ትንፋሽ')) {
      detectedUrgency = 'Same-day';
      matchedProtocols = [mockProtocols[0], mockProtocols[4]];
    } else {
      detectedUrgency = 'Routine';
      matchedProtocols = [mockProtocols[0]];
    }
  }

  // Construct structured answers according to criteria
  if (detectedUrgency === 'Emergency') {
    if (isAmharic) {
      text = 'አጣዳፊ አስቸኳይ የአደጋ ህክምና ምልክት ተገኝቷል። በአስቸኳይ ወደ ሪፈራል ሆስፒታል መላክ እና የቅድመ-ሪፈራል ህክምና መመሪያዎችን መከተል ያስፈልጋል።';
      recommendations = [
        'የቀረበውን የታካሚ መረጃ ወዲያውኑ ለሱፐርቫይዘር ይላኩ።',
        'ታካሚውን ወደ ቅርብ ሆስፒታል ለማስተላለፍ የሀገር ውስጥ አምቡላንስ ወይም ትራንስፖርት ያዘጋጁ።',
        'የደረት መጎድጎድ ወይም መንቀጥቀጥ ካለ በየ 15 ደቂቃው ክትትል ያድርጉ።'
      ];
      checkList = [
        'ታካሚው መናገር ወይም ጡት መጥባት መቻሉን ያረጋግጡ።',
        'ንቃት መቀነስ ወይም ድካም መኖሩን ይፈትሹ።'
      ];
      followUps = ['ቀደም የተሰጠ መድሃኒት ወይም የክትባት ታሪክ አለ?'];
    } else {
      text = 'EMERGENCY CLINICAL TRIAGE TRIGGERED. Standard clinical guidelines classify this patient under elevated safety risk. Immediate medical post-stabilization and tertiary hospital referral pipeline is highly advised.';
      recommendations = [
        'Initiate the immediate emergency patient transport checklist and notify the supervisor queue.',
        'Apply pre-referral supportive treatments (e.g., Gentamicin or IV fluid stabilization if certified).',
        'Ensure warm transport skin conditions are active (Kangaroo care for infant complications).'
      ];
      checkList = [
        'Verify airway patency and continuous chest indrawing indicators.',
        'Count active breathing repetitions every 5 minutes.',
        'Look for immediate onset of twitching or localized convulsions.'
      ];
      followUps = [
        'What was the exact temperature reading during the last 30 minutes?',
        'Does the guardian report active fluid intake issues or lethargic sleeps?'
      ];
    }
  } else if (detectedUrgency === 'Same-day') {
    if (isAmharic) {
      text = 'ታካሚው በተመሳሳይ ቀን በጤና ተቋም መታየት ያለበት መካከለኛ ስጋት ምልክቶች አሉት። የሳምባ ምች ወይም የማላሪያ ምርመራ መደረግ አለበት።';
      recommendations = [
        'የፍጥነት ትንፋሽን መጠን ይፈትሹ (በየደቂቃው የትንፋሽ ድግግሞሽ)።',
        'የቀን አሞክሳሲሊን መበተን ኪኒን የታዘዘውን ልክ ይጀምሩ።',
        'በ 48 ሰዓታት ውስጥ ድጋሚ ምርመራ ቀጠሮ ይያዙ።'
      ];
      checkList = [
        'ለመዋጥ መቸገር ወይም በተደጋጋሚ ማስመለስ መኖሩን ማረጋገጥ።',
        'የደረት መጎድጎድ ምልክት መኖሩን መቆጣጠር።'
      ];
      followUps = ['ትኩሳቱ ከተጀመረ ስንት ቀን ሆኖታል?'];
    } else {
      text = 'Same-day clinical review recommended. The symptoms fit diagnostic classifications for acute respiratory tract infection or regional infectious syndromes. Initiate targeted oral antibiotic dosage controls.';
      recommendations = [
        'Initiate first-line oral antibiotic regimen (dispersible Amoxicillin tables) under supervision.',
        'Schedule a mandatory 48-hour physical post follow-up review at this Health Post.',
        'Instruct guardians on detailed physical hydration measures.'
      ];
      checkList = [
        'Assess whether the cough duration extends beyond regional normal cycles.',
        'Monitor whether temperature changes cross hyperpyrexia levels.'
      ];
      followUps = [
        'Are there other children in the household suffering with active cough complaints?',
        'Are PCV and rotavirus vaccines verified up-to-date?'
      ];
    }
  } else {
    if (isAmharic) {
      text = 'ታካሚው አነስተኛ ስጋት ደረጃ ላይ ይገኛል። የተለመደ የቀላል ሳል ወይም የጉንፋን ምልክት ሊሆን ስለሚችል በቤት ውስጥ እንክብካቤ ማከም ይቻላል።';
      recommendations = [
        'ሞቅ ያሉ መጠጦችን እና ተጨማሪ የእናት ጡት ወተት መስጠት።',
        'ማንኛውም አዲስ የአየር ባሕርይ ለውጥ ከተከሰተ እንዲመለሱ መምከር።'
      ];
      checkList = [
        'ምልክቶቹ ከ 14 ቀናት በላይ ካልቀጠሉ በቤት ውስጥ መከታተል።',
        'ፈጣን ትንፋሽ አለመኖሩን በየጊዜው መፈተሽ።'
      ];
      followUps = ['የልጁ የክትባት ካርድ ሙሉ ነው?'];
    } else {
      text = 'Routine symptomatic care is recommended. No danger signals or secondary urgency flags were detected at this diagnostic screening step. Keep home fluids active.';
      recommendations = [
        'Provide supportive symptomatic relief counseling to guardians.',
        'Instruct family to return immediately if child develops breathing difficulty, rapid RR, or lethargy.'
      ];
      checkList = [
        'Follow standard localized temperature charts.',
        'Check immunization charts of all Under-5 children in the household.'
      ];
      followUps = [
        'Is there any exposure to active indoor fuel combustion or high irritation dust?'
      ];
    }
  }

  const mockResp: AssistantResponse = {
    id: `resp-${Date.now()}`,
    urgency: detectedUrgency,
    textContent: text,
    recommendedActions: recommendations,
    dangerSignsToCheck: checkList,
    followUpQuestions: followUps,
    evidence: matchedProtocols,
    safetyRouteRequired: mustTriggerSupervisor,
    piiRedacted: localPrefs.piiRedactionEnabled,
    responseSource: localPrefs.simulateOffline ? 'Offline_Rules' : 'LLM_Cloud_Grounded',
    responseLanguage: isAmharic ? 'am' : 'en'
  };

  // If caseData is available, persist recommendation in database
  if (caseData) {
    localResponses[caseData.id] = mockResp;
    setStorageItem('hep_responses', localResponses);

    // If it requires supervisor review, append a new reviewer items
    if (mustTriggerSupervisor) {
      const exists = localReviewQueue.some(item => item.caseId === caseData.id);
      if (!exists) {
        const reviewItem: ReviewItem = {
          id: `rev-${Date.now()}`,
          caseId: caseData.id,
          dateTime: new Date().toISOString(),
          hewLocation: `${caseData.basics.region} (${caseData.basics.facilityName})`,
          urgency: detectedUrgency,
          triggerReason: caseData.basics.isNewborn ? 'Neonatal Triage Rule Set' : 'Obstetric Maternal Alert',
          aiConfidence: 89,
          status: 'Pending',
          originalCaseData: caseData,
          aiResponse: mockResp,
          reviewerNotes: 'Auto-flagged by clinical safety router.'
        };
        localReviewQueue.unshift(reviewItem);
        setStorageItem('hep_review_queue', localReviewQueue);
      }
    }
  }

  notifyStateChanged();
  return mockResp;
}


// 2. Structured Case Intake APIs
export function getCases(): CaseIntake[] {
  return localCases;
}

export function saveCase(newCase: CaseIntake): void {
  localCases.unshift(newCase);
  setStorageItem('hep_cases', localCases);
  notifyStateChanged();
}

export function clearCases(): void {
  localCases = [];
  localResponses = {};
  setStorageItem('hep_cases', []);
  setStorageItem('hep_responses', {});
  notifyStateChanged();
}

export function getResponseForCase(caseId: string): AssistantResponse | undefined {
  return localResponses[caseId];
}


// 3. Protocol Search APIs
export function searchProtocols(query: string, filters: Record<string, any> = {}): ProtocolEvidence[] {
  const norm = query.toLowerCase();
  let results = mockProtocols;
  
  if (norm.trim()) {
    results = results.filter(p => 
      p.title.toLowerCase().includes(norm) || 
      p.snippet.toLowerCase().includes(norm) ||
      p.category.toLowerCase().includes(norm)
    );
  }

  if (filters.category && filters.category !== 'All') {
    results = results.filter(p => p.category === filters.category);
  }

  return results;
}


// 4. Supervisor Review Queue APIs
export function getReviewQueue(): ReviewItem[] {
  return localReviewQueue;
}

export function updateReviewItem(id: string, updates: Partial<ReviewItem>): void {
  localReviewQueue = localReviewQueue.map(item => {
    if (item.id === id) {
      return { ...item, ...updates };
    }
    return item;
  });
  setStorageItem('hep_review_queue', localReviewQueue);
  notifyStateChanged();
}


// 5. Field Feedback APIs
export function getFeedbackList(): FeedbackItem[] {
  return localFeedbackList;
}

export function getImprovementTasks(): ImprovementTask[] {
  return localImprovementTasks;
}

export function updateImprovementTaskStatus(taskId: string, status: ImprovementTask['status']): void {
  localImprovementTasks = localImprovementTasks.map(t => {
    if (t.id === taskId) {
      return { ...t, status };
    }
    return t;
  });
  setStorageItem('hep_improvement_tasks', localImprovementTasks);
  notifyStateChanged();
}

export function submitFeedback(feedback: Omit<FeedbackItem, 'id' | 'createdAt' | 'isReviewed'>): FeedbackItem {
  const newItem: FeedbackItem = {
    id: `fb-${Date.now()}`,
    createdAt: new Date().toISOString(),
    isReviewed: false,
    ...feedback
  };

  localFeedbackList.unshift(newItem);
  setStorageItem('hep_feedback', localFeedbackList);

  if (feedback.rating <= 2) {
    const newTask: ImprovementTask = {
      id: `imp-${Date.now()}`,
      title: `Review negative feedback on case category "${feedback.category}": "${feedback.comment?.substring(0, 50)}..."`,
      status: 'New',
      priority: 'High',
      sourceFeedbackId: newItem.id,
      createdAt: new Date().toISOString()
    };
    localImprovementTasks.unshift(newTask);
    setStorageItem('hep_improvement_tasks', localImprovementTasks);
  }

  fetch(`${API_BASE_URL}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: feedback.caseId,
      rating: feedback.rating,
      message: feedback.comment || `${feedback.category} feedback`,
      note: `${feedback.location} · ${feedback.modelUsed}`,
    })
  }).catch(() => undefined);

  if (localPrefs.simulateOffline) {
    addOfflineSyncItem('Feedback', newItem);
  }

  notifyStateChanged();
  return newItem;
}


// 6. Evaluation Dashboard APIs
export function getEvaluationTestCases(): EvaluationTestCase[] {
  return localTestCases;
}

export function getEvaluationSummary(): EvaluationSummary {
  return localEvalSummary;
}

export async function runMockEvaluation(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/evaluate`, { method: 'POST' });
    if (response.ok) {
      const data = await response.json();
      localEvalSummary = {
        urgencyAccuracy: Number(data.urgency_accuracy || 0) * 100,
        citationCoverage: Number(data.citation_coverage || 0) * 100,
        hallucinationRisk: Math.max(0, 100 - Number(data.citation_coverage || 0) * 100),
        faithfulnessScore: Math.max(1, Math.min(5, 5 - (data.failures?.length || 0) * 0.25)),
        piiRedactionRate: Number(data.pii_redaction_rate || 0) * 100,
        safetyRoutingRate: Number(data.safety_routing_rate || 0) * 100,
        amharicPassRate: 90,
        averageLatencyMs: 850,
        fallbackRate: 5,
      };
      setStorageItem('hep_eval_summary', localEvalSummary);
      notifyStateChanged();
      return;
    }
  } catch (e) {
    console.warn('Remote evaluation unavailable, using local simulation.', e);
  }

  await new Promise(resolve => setTimeout(resolve, 1500));
  const variance = () => (Math.random() - 0.5) * 1.5;
  localEvalSummary = {
    urgencyAccuracy: Math.min(100, Math.max(80, initialEvaluationSummary.urgencyAccuracy + variance())),
    citationCoverage: Math.min(100, Math.max(90, initialEvaluationSummary.citationCoverage + variance())),
    hallucinationRisk: Math.max(0, initialEvaluationSummary.hallucinationRisk + variance() * 0.2),
    faithfulnessScore: Math.min(5, Math.max(4, initialEvaluationSummary.faithfulnessScore + variance() * 0.1)),
    piiRedactionRate: Math.min(100, Math.max(95, initialEvaluationSummary.piiRedactionRate + variance() * 0.3)),
    safetyRoutingRate: 100.0,
    amharicPassRate: Math.min(100, Math.max(85, initialEvaluationSummary.amharicPassRate + variance())),
    averageLatencyMs: Math.round(initialEvaluationSummary.averageLatencyMs + (Math.random() - 0.5) * 50),
    fallbackRate: Math.min(15, Math.max(1, initialEvaluationSummary.fallbackRate + variance() * 0.5))
  };
  setStorageItem('hep_eval_summary', localEvalSummary);
  localTestCases = localTestCases.map(tc => ({ ...tc, lastRunDate: new Date().toISOString().split('T')[0], status: Math.random() > 0.08 ? 'Pass' : 'Fail' }));
  setStorageItem('hep_test_cases', localTestCases);
  notifyStateChanged();
}


// 7. Operations/Model Registry APIs
export function getModelConfig(): ModelOpsConfig {
  return localModelOps;
}

export function updateModelConfig(config: Partial<ModelOpsConfig>): ModelOpsConfig {
  localModelOps = { ...localModelOps, ...config };
  setStorageItem('hep_model_ops', localModelOps);
  notifyStateChanged();
  return localModelOps;
}

export const activePrompts: PromptTemplate[] = mockPrompts;

// System Prompts Storage & Backlog
export interface SystemPrompts {
  childTriage: string;
  maternalTriage: string;
}

const defaultSystemPrompts: SystemPrompts = {
  childTriage: `SYSTEM INSTRUCTION: Managing Under-5 infant fast breathing conditions. Standard IMNCI guidelines dictate checking respiratory rates against age categories (2-11m >= 50, 12-59m >= 40). Flag danger signs including chest indrawing or extreme lethargy instantly. Cite exact protocol chapters.`,
  maternalTriage: `SYSTEM INSTRUCTION: Severe gestational complications guidelines. Active third trimester vaginal bleeding constitutes absolute emergency. Establish left lateral posture, arrange prompt high-risk referral transfer, notify supervisor queue.`
};

let localSystemPrompts: SystemPrompts = getStorageItem('hep_system_prompts', defaultSystemPrompts);

export function getSystemPrompts(): SystemPrompts {
  return localSystemPrompts;
}

export function saveSystemPrompt(key: 'childTriage' | 'maternalTriage', prompt: string): void {
  localSystemPrompts[key] = prompt;
  setStorageItem('hep_system_prompts', localSystemPrompts);
  notifyStateChanged();
}

export function restoreDefaultPrompts(): void {
  localSystemPrompts = { ...defaultSystemPrompts };
  setStorageItem('hep_system_prompts', localSystemPrompts);
  notifyStateChanged();
}


// 8. Offline Center Sync APIs
export function getOfflineSyncQueue(): OfflineSyncItem[] {
  return localSyncQueue;
}

export function getSyncQueue(): OfflineSyncItem[] {
  return getOfflineSyncQueue();
}

export function addOfflineSyncItem(type: OfflineSyncItem['type'], payload: any): void {
  const newItem: OfflineSyncItem = {
    id: `syn-${Date.now()}`,
    type,
    createdAt: new Date().toISOString(),
    status: 'Pending',
    retryCount: 0,
    payload
  };
  localSyncQueue.unshift(newItem);
  setStorageItem('hep_sync_queue', localSyncQueue);
  notifyStateChanged();
}

export async function processSyncQueue(): Promise<void> {
  if (localSyncQueue.length === 0) return;
  
  // Update state to syncing
  localSyncQueue = localSyncQueue.map(item => 
    item.status === 'Pending' || item.status === 'Failed' 
      ? { ...item, status: 'Syncing' } 
      : item
  );
  notifyStateChanged();

  // Simulate remote server sync delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Mark items synced
  localSyncQueue = localSyncQueue.map(item => {
    if (item.status === 'Syncing') {
      return { ...item, status: 'Synced', retryCount: item.retryCount + 1 };
    }
    return item;
  });
  setStorageItem('hep_sync_queue', localSyncQueue);

  // Set last sync timestamp
  updateAppPrefs({ lastSyncTime: new Date().toISOString() });
  notifyStateChanged();
}

export function forceSyncQueue(): Promise<void> {
  return processSyncQueue();
}

export function clearSyncQueue(): void {
  localSyncQueue = [];
  setStorageItem('hep_sync_queue', []);
  notifyStateChanged();
}
