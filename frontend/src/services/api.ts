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
} from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

type Listener = () => void;
const stateListeners: Listener[] = [];

function notifyStateChanged() {
  stateListeners.forEach((listener) => listener());
}

export function subscribeToStateChanges(listener: Listener) {
  stateListeners.push(listener);
  return () => {
    const index = stateListeners.indexOf(listener);
    if (index > -1) stateListeners.splice(index, 1);
  };
}

function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

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
  lastSyncTime: new Date(Date.now() - 36 * 60 * 1000).toISOString(),
  defaultFacility: 'Tebase Health Post',
  defaultWoreda: 'Debre Birhan',
  defaultRegion: 'Amhara',
};

let localPrefs: AppPrefs = getStorageItem('hep_prefs', defaultPrefs);
let localCases: CaseIntake[] = getStorageItem('hep_cases', []);
let localResponses: Record<string, AssistantResponse> = getStorageItem('hep_responses', {});
let localReviewQueue: ReviewItem[] = getStorageItem('hep_review_queue', []);
let localFeedbackList: FeedbackItem[] = getStorageItem('hep_feedback', []);
let localImprovementTasks: ImprovementTask[] = getStorageItem('hep_improvement_tasks', []);
let localEvalSummary: EvaluationSummary = getStorageItem('hep_eval_summary', {
  urgencyAccuracy: 0,
  citationCoverage: 0,
  hallucinationRisk: 0,
  faithfulnessScore: 0,
  piiRedactionRate: 0,
  safetyRoutingRate: 0,
  amharicPassRate: 0,
  averageLatencyMs: 0,
  fallbackRate: 0,
});
let localTestCases: EvaluationTestCase[] = getStorageItem('hep_test_cases', []);
let localModelOps: ModelOpsConfig = getStorageItem('hep_model_ops', {
  provider: 'Ollama_Local',
  baseUrl: 'http://127.0.0.1:11434',
  modelName: 'qwen2.5:1.5b',
  temperature: 0.15,
  maxTokens: 700,
  timeoutSeconds: 20,
  fallbackEnabled: true,
  chunkCount: 4,
  embeddingModel: 'local-protocol-index',
  vectorDbStatus: 'ready',
  graphNodes: 0,
  graphEdges: 0,
});
let localSyncQueue: OfflineSyncItem[] = getStorageItem('hep_sync_queue', []);

export interface SystemPrompts {
  childTriage: string;
  maternalTriage: string;
}

let localSystemPrompts: SystemPrompts = getStorageItem('hep_system_prompts', {
  childTriage: '',
  maternalTriage: '',
});

function persistAll() {
  setStorageItem('hep_prefs', localPrefs);
  setStorageItem('hep_cases', localCases);
  setStorageItem('hep_responses', localResponses);
  setStorageItem('hep_review_queue', localReviewQueue);
  setStorageItem('hep_feedback', localFeedbackList);
  setStorageItem('hep_improvement_tasks', localImprovementTasks);
  setStorageItem('hep_eval_summary', localEvalSummary);
  setStorageItem('hep_test_cases', localTestCases);
  setStorageItem('hep_model_ops', localModelOps);
  setStorageItem('hep_sync_queue', localSyncQueue);
  setStorageItem('hep_system_prompts', localSystemPrompts);
}

function mapUrgencyFromBackend(value?: string): UrgencyLevel {
  switch ((value || '').toLowerCase()) {
    case 'emergency': return 'Emergency';
    case 'same_day':
    case 'same-day': return 'Same-day';
    case 'routine': return 'Routine';
    default: return 'Need_Info';
  }
}

function mapResponseSource(provider?: string): AssistantResponse['responseSource'] {
  const normalized = (provider || '').toLowerCase();
  if (normalized.startsWith('ollama')) return 'LLM_Ollama';
  if (normalized === 'offline_rules') return 'Offline_Rules';
  if (normalized) return 'LLM_Cloud_Grounded';
  return 'Fallback';
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

function normalizeAssistantResponse(data: any): AssistantResponse {
  return {
    id: data.id || `resp-${Date.now()}`,
    urgency: mapUrgencyFromBackend(data.urgency),
    textContent: data.textContent || data.answer || 'No response generated.',
    recommendedActions: data.recommendedActions || data.recommended_actions || [],
    dangerSignsToCheck: data.dangerSignsToCheck || (data.graph_findings || []).map((item: any) => `${item.signal}: ${item.reason}`),
    followUpQuestions: data.followUpQuestions || data.missing_questions || [],
    evidence: data.evidence || [],
    safetyRouteRequired: Boolean(data.safetyRouteRequired ?? data.review_required),
    piiRedacted: Boolean(data.piiRedacted ?? data?.safety?.pii_redacted),
    responseSource: data.responseSource || mapResponseSource(data.model_provider),
    responseLanguage: data.responseLanguage || (data.language === 'am' ? 'am' : 'en'),
    triageSummary: data.triageSummary || data.triage_summary || '',
    caregiverAdvice: data.caregiverAdvice || data.caregiver_advice || '',
    protocolNote: data.protocolNote || data.protocol_note || '',
    protocolVersion: data.protocolVersion || data.protocol_version || 'demo-protocol-v1',
    rulesApplied: data.rulesApplied || data.rules_applied || [],
    llmSummaryUsed: Boolean(data.llmSummaryUsed ?? data.llm_summary_used),
  };
}

function buildTestCasesFromFailures(failures: any[] = []): EvaluationTestCase[] {
  if (!failures.length) {
    return [{
      id: 'eval-pass-1',
      name: 'Safety and urgency checks',
      inputDescription: 'Evaluation run completed with no failing scenarios.',
      language: 'en',
      expectedUrgency: 'Routine',
      actualUrgency: 'Routine',
      citationsPresent: true,
      safetyRouteTriggered: false,
      status: 'Pass',
      lastRunDate: new Date().toISOString().split('T')[0],
    }];
  }
  return failures.map((failure, index) => ({
    id: `eval-${index + 1}`,
    name: failure.id || `Scenario ${index + 1}`,
    inputDescription: failure.message || 'Failure captured during evaluation.',
    language: 'en',
    expectedUrgency: mapUrgencyFromBackend(failure.expected_urgency),
    actualUrgency: mapUrgencyFromBackend(failure.actual_urgency),
    citationsPresent: Boolean(failure.citations_present ?? false),
    safetyRouteTriggered: Boolean(failure.review_required ?? false),
    status: 'Fail',
    lastRunDate: new Date().toISOString().split('T')[0],
  }));
}

async function bootstrapFromBackend() {
  try {
    const response = await fetch(`${API_BASE_URL}/bootstrap`);
    if (!response.ok) return;
    const data = await response.json();
    if (Array.isArray(data.cases)) localCases = data.cases;
    if (Array.isArray(data.reviewQueue)) localReviewQueue = data.reviewQueue;
    if (Array.isArray(data.feedback)) localFeedbackList = data.feedback;
    if (Array.isArray(data.improvementTasks)) localImprovementTasks = data.improvementTasks;
    if (data.evaluationSummary) localEvalSummary = data.evaluationSummary;
    if (data.modelConfig) localModelOps = data.modelConfig;
    if (data.systemPrompts) localSystemPrompts = data.systemPrompts;
    persistAll();
    notifyStateChanged();
  } catch (e) {
    console.warn('Bootstrap failed; using local cache.', e);
  }
}
void bootstrapFromBackend();

export function getAppPrefs(): AppPrefs { return localPrefs; }
export function updateAppPrefs(updates: Partial<AppPrefs>): AppPrefs {
  localPrefs = { ...localPrefs, ...updates };
  persistAll();
  notifyStateChanged();
  return localPrefs;
}

export async function checkBackendHealth(): Promise<boolean> {
  if (localPrefs.simulateOffline) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok && (await res.json()).status === 'ok';
  } catch {
    return false;
  }
}

export async function askAssistant(question: string, caseData?: CaseIntake): Promise<AssistantResponse> {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: question,
      language: localPrefs.language,
      case_context: caseDataToBackendContext(caseData),
      case_snapshot: caseData,
      session_id: caseData?.id || `chat-${Date.now()}`,
      user_role: localPrefs.role,
    })
  });
  if (!response.ok) throw new Error(`Assistant request failed with ${response.status}`);
  const data = normalizeAssistantResponse(await response.json());
  if (caseData) {
    localResponses[caseData.id] = data;
    persistAll();
  }
  void refreshReviewQueue();
  notifyStateChanged();
  return data;
}

export function getCases(): CaseIntake[] { return localCases; }
export async function saveCase(newCase: CaseIntake): Promise<void> {
  localCases = [newCase, ...localCases.filter((c) => c.id !== newCase.id)];
  persistAll();
  notifyStateChanged();
  await fetch(`${API_BASE_URL}/cases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newCase),
  });
}
export function clearCases(): void {
  localCases = [];
  localResponses = {};
  persistAll();
  notifyStateChanged();
}
export function getResponseForCase(caseId: string): AssistantResponse | undefined { return localResponses[caseId]; }

export async function searchProtocols(query: string, filters: Record<string, any> = {}): Promise<ProtocolEvidence[]> {
  const qs = new URLSearchParams({ q: query, top_k: '8' });
  const response = await fetch(`${API_BASE_URL}/protocols/search?${qs.toString()}`);
  if (!response.ok) return [];
  const data = await response.json();
  let results = (data.results || []).map((item: any) => ({
    id: item.id,
    title: item.title,
    category: item.source,
    snippet: item.text,
    confidence: Math.max(1, Math.min(100, Math.round(Number(item.score || 0.5) * 100))),
    lastUpdated: new Date().toISOString().split('T')[0],
    sourceType: item.source,
  }));
  if (filters.category && filters.category !== 'All') {
    results = results.filter((p: ProtocolEvidence) => p.category === filters.category);
  }
  return results;
}

async function refreshReviewQueue() {
  try {
    const response = await fetch(`${API_BASE_URL}/review-queue`);
    if (!response.ok) return;
    localReviewQueue = (await response.json()).items || [];
    persistAll();
    notifyStateChanged();
  } catch {}
}
export function getReviewQueue(): ReviewItem[] { return localReviewQueue; }
export async function updateReviewItem(id: string, updates: Partial<ReviewItem>): Promise<void> {
  localReviewQueue = localReviewQueue.map((item) => item.id === id ? { ...item, ...updates } : item);
  persistAll();
  notifyStateChanged();
  await fetch(`${API_BASE_URL}/review-queue/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  void refreshReviewQueue();
}

async function refreshFeedback() {
  try {
    const response = await fetch(`${API_BASE_URL}/feedback`);
    if (!response.ok) return;
    localFeedbackList = (await response.json()).items || [];
  } catch {}
  try {
    const response = await fetch(`${API_BASE_URL}/improvement-tasks`);
    if (response.ok) localImprovementTasks = (await response.json()).items || [];
  } catch {}
  persistAll();
  notifyStateChanged();
}
export function getFeedbackList(): FeedbackItem[] { return localFeedbackList; }
export function getImprovementTasks(): ImprovementTask[] { return localImprovementTasks; }
export async function updateImprovementTaskStatus(taskId: string, status: ImprovementTask['status']): Promise<void> {
  localImprovementTasks = localImprovementTasks.map((t) => t.id === taskId ? { ...t, status } : t);
  persistAll();
  notifyStateChanged();
  await fetch(`${API_BASE_URL}/improvement-tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}
export function submitFeedback(feedback: Omit<FeedbackItem, 'id' | 'createdAt' | 'isReviewed'>): FeedbackItem {
  const newItem: FeedbackItem = {
    id: `fb-${Date.now()}`,
    createdAt: new Date().toISOString(),
    isReviewed: false,
    ...feedback,
  };
  localFeedbackList = [newItem, ...localFeedbackList];
  if (feedback.rating <= 2) {
    localImprovementTasks = [{
      id: `imp-${Date.now()}`,
      title: `Review low-rated field feedback: ${(feedback.comment || feedback.category).slice(0, 72)}`,
      status: 'New',
      priority: feedback.rating === 1 ? 'Critical' : 'High',
      sourceFeedbackId: newItem.id,
      createdAt: new Date().toISOString(),
    }, ...localImprovementTasks];
  }
  if (localPrefs.simulateOffline) addOfflineSyncItem('Feedback', newItem);
  persistAll();
  notifyStateChanged();
  void fetch(`${API_BASE_URL}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: feedback.caseId,
      rating: feedback.rating,
      message: feedback.comment || `${feedback.category} feedback`,
      note: `${feedback.location} · ${feedback.modelUsed}`,
    }),
  }).then(refreshFeedback).catch(() => undefined);
  return newItem;
}

export function getEvaluationTestCases(): EvaluationTestCase[] { return localTestCases; }
export function getEvaluationSummary(): EvaluationSummary { return localEvalSummary; }
export async function runMockEvaluation(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/evaluate`, { method: 'POST' });
  if (!response.ok) throw new Error('Evaluation failed');
  const data = await response.json();
  localEvalSummary = {
    urgencyAccuracy: Number(data.urgency_accuracy || 0) * 100,
    citationCoverage: Number(data.citation_coverage || 0) * 100,
    hallucinationRisk: Math.max(0, 100 - Number(data.citation_coverage || 0) * 100),
    faithfulnessScore: Math.max(1, Math.min(5, 5 - (data.failures?.length || 0) * 0.25)),
    piiRedactionRate: Number(data.pii_redaction_rate || 0) * 100,
    safetyRoutingRate: Number(data.safety_routing_rate || 0) * 100,
    amharicPassRate: data.failures?.some((f: any) => String(f.id || '').toLowerCase().includes('amharic')) ? 0 : 100,
    averageLatencyMs: 850,
    fallbackRate: 0,
  };
  localTestCases = buildTestCasesFromFailures(data.failures || []);
  persistAll();
  notifyStateChanged();
}

export function getModelConfig(): ModelOpsConfig { return localModelOps; }
export function updateModelConfig(config: Partial<ModelOpsConfig>): ModelOpsConfig {
  localModelOps = { ...localModelOps, ...config };
  persistAll();
  notifyStateChanged();
  void fetch(`${API_BASE_URL}/model-config`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  return localModelOps;
}
export const activePrompts: any[] = [];
export function getSystemPrompts(): SystemPrompts { return localSystemPrompts; }
export function saveSystemPrompt(key: 'childTriage' | 'maternalTriage', prompt: string): void {
  localSystemPrompts = { ...localSystemPrompts, [key]: prompt };
  persistAll();
  notifyStateChanged();
  void fetch(`${API_BASE_URL}/system-prompts/${key}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: prompt }),
  });
}
export function restoreDefaultPrompts(): void {
  localSystemPrompts = { childTriage: '', maternalTriage: '' };
  persistAll();
  notifyStateChanged();
  void fetch(`${API_BASE_URL}/system-prompts/reset`, { method: 'POST' }).then(async (res) => {
    if (!res.ok) return;
    localSystemPrompts = await res.json();
    persistAll();
    notifyStateChanged();
  });
}

export function getOfflineSyncQueue(): OfflineSyncItem[] { return localSyncQueue; }
export function getSyncQueue(): OfflineSyncItem[] { return getOfflineSyncQueue(); }
export function addOfflineSyncItem(type: OfflineSyncItem['type'], payload: any): void {
  localSyncQueue = [{
    id: `syn-${Date.now()}`,
    type,
    createdAt: new Date().toISOString(),
    status: 'Pending',
    retryCount: 0,
    payload,
  }, ...localSyncQueue];
  persistAll();
  notifyStateChanged();
}
export async function processSyncQueue(): Promise<void> {
  if (!localSyncQueue.length) return;
  localSyncQueue = localSyncQueue.map((item) => ({ ...item, status: 'Syncing' }));
  notifyStateChanged();
  await Promise.all(localSyncQueue.map(async (item) => {
    if (item.type === 'Feedback') {
      const payload = item.payload as FeedbackItem;
      await fetch(`${API_BASE_URL}/feedback`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: payload.caseId,
          rating: payload.rating,
          message: payload.comment || payload.category,
          note: `${payload.location} · ${payload.modelUsed}`,
        })
      });
    }
  }));
  localSyncQueue = localSyncQueue.map((item) => ({ ...item, status: 'Synced', retryCount: item.retryCount + 1 }));
  localPrefs = { ...localPrefs, lastSyncTime: new Date().toISOString() };
  persistAll();
  notifyStateChanged();
  void refreshFeedback();
}
export function forceSyncQueue(): Promise<void> { return processSyncQueue(); }
export function clearSyncQueue(): void {
  localSyncQueue = [];
  persistAll();
  notifyStateChanged();
}
