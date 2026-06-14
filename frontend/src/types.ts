/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'HEW' | 'Supervisor' | 'MERL' | 'AI_Engineer';

export type UrgencyLevel = 'Emergency' | 'Same-day' | 'Routine' | 'Need_Info';

export interface PatientBasics {
  age: number;
  ageUnit: 'years' | 'months' | 'days';
  sex: 'Male' | 'Female';
  pregnancyStatus: 'No' | 'Yes' | 'Unknown' | 'N/A';
  isNewborn: boolean;
  region: string;
  woreda: string;
  facilityName: string;
}

export interface VitalSigns {
  temperature: number; // in C
  respiratoryRate: number; // per min
  systolicBP?: number;
  diastolicBP?: number;
  weight?: number; // in kg
  symptomDurationDays: number;
}

export interface Symptoms {
  fever: boolean;
  cough: boolean;
  fastBreathing: boolean;
  chestIndrawing: boolean;
  convulsions: boolean;
  lethargy: boolean;
  unableToDrink: boolean;
  vomitingEverything: boolean;
  diarrhea: boolean;
  dehydrationSigns: boolean;
  bleedingDuringPregnancy: boolean;
  severeHeadache: boolean;
  reducedFetalMovement: boolean;
}

export interface CaseIntake {
  id: string;
  basics: PatientBasics;
  vitals: VitalSigns;
  symptoms: Symptoms;
  dangerSignsDetected: string[];
  createdAt: string;
}

export interface ProtocolEvidence {
  id: string;
  title: string;
  category: string;
  snippet: string;
  confidence: number; // 0 to 100
  lastUpdated: string;
  sourceType: string;
}

export interface AssistantResponse {
  id: string;
  urgency: UrgencyLevel;
  recommendedActions: string[];
  dangerSignsToCheck: string[];
  followUpQuestions: string[];
  evidence: ProtocolEvidence[];
  safetyRouteRequired: boolean;
  piiRedacted: boolean;
  responseSource: 'LLM_Ollama' | 'LLM_Cloud_Grounded' | 'Offline_Rules' | 'Fallback';
  responseLanguage: string;
  textContent: string;
  triageSummary: string;
  caregiverAdvice: string;
  protocolNote: string;
  protocolVersion: string;
  rulesApplied: string[];
  llmSummaryUsed: boolean;
}

export interface ReviewItem {
  id: string;
  caseId: string;
  dateTime: string;
  hewLocation: string;
  urgency: UrgencyLevel;
  triggerReason: string;
  aiConfidence: number;
  feedbackRating?: number;
  status: 'Pending' | 'Approved' | 'Unsafe' | 'Escalated' | 'Closed';
  assignedReviewer?: string;
  originalCaseData: CaseIntake;
  aiResponse: AssistantResponse;
  reviewerNotes?: string;
}

export interface FeedbackItem {
  id: string;
  caseId?: string;
  rating: number; // 1 to 5
  comment?: string;
  category: 'accuracy' | 'translation' | 'speed' | 'clarity' | 'other';
  language: 'en' | 'am';
  location: string;
  createdAt: string;
  modelUsed: string;
  isReviewed: boolean;
}

export interface ImprovementTask {
  id: string;
  title: string;
  status: 'New' | 'Reviewing' | 'NeedsPromptUpdate' | 'NeedsProtocolUpdate' | 'NeedsEvaluation' | 'Resolved';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  sourceFeedbackId: string;
  createdAt: string;
}

export interface EvaluationTestCase {
  id: string;
  name: string;
  inputDescription: string;
  language: 'en' | 'am';
  expectedUrgency: UrgencyLevel;
  actualUrgency: UrgencyLevel;
  citationsPresent: boolean;
  safetyRouteTriggered: boolean;
  status: 'Pass' | 'Fail';
  lastRunDate: string;
}

export interface EvaluationSummary {
  urgencyAccuracy: number; // percentage
  citationCoverage: number; // percentage
  hallucinationRisk: number; // percentage
  faithfulnessScore: number; // 0-5
  piiRedactionRate: number; // percentage
  safetyRoutingRate: number; // percentage
  amharicPassRate: number; // percentage
  averageLatencyMs: number;
  fallbackRate: number; // percentage
}

export interface PromptTemplate {
  id: string;
  name: string;
  version: string;
  systemInstruction: string;
  isActive: boolean;
  updatedAt: string;
}

export interface ModelOpsConfig {
  provider: 'Offline_Rules' | 'Ollama_Local' | 'OpenAI_Compatible_API';
  baseUrl: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
  timeoutSeconds: number;
  fallbackEnabled: boolean;
  chunkCount: number;
  embeddingModel: string;
  vectorDbStatus: string;
  graphNodes: number;
  graphEdges: number;
}

export interface OfflineSyncItem {
  id: string;
  type: 'Feedback' | 'ReviewNote' | 'CaseDraft' | 'EvaluationResult';
  createdAt: string;
  status: 'Pending' | 'Syncing' | 'Synced' | 'Failed';
  retryCount: number;
  lastError?: string;
  payload: any;
}
