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
  PromptTemplate,
  ModelOpsConfig,
  OfflineSyncItem,
  ImprovementTask
} from '../types';

// Let's seed protocols (clinical advice RAG library grounded in standard Integrated Community Case Management [iCCM] rules)
export const mockProtocols: ProtocolEvidence[] = [
  {
    id: 'p-1',
    title: 'Management of Acute Fast Breathing & Pneumonia in Under-5 Children',
    category: 'Child Health',
    snippet: 'For a child age 2-11 months, respiratory rate (RR) >= 50/min, or age 12-59 months, RR >= 40/min holds diagnostic criteria for Fast Breathing. Initiate first-line Amoxicillin (250mg) dispersible tablets twice daily for 2-5 days. Always ensure no dangerous indrawing or lethargy are present.',
    confidence: 96,
    lastUpdated: '2026-02-15',
    sourceType: 'Ministry of Health iCCM Guidelines'
  },
  {
    id: 'p-2',
    title: 'Severe Maternal Complications: Antepartum Bleeding Rules',
    category: 'Maternal Health',
    snippet: 'Vaginal bleeding at any stage of pregnancy constitutes a critical Emergency. Immediate actions: Establish referral pathways, keep client in left lateral tilt, monitor vitals, do not perform vaginal examination, prepare active transport to nearest Primary Hospital or Health Center.',
    confidence: 99,
    lastUpdated: '2025-11-10',
    sourceType: 'National Maternal Care Protocol'
  },
  {
    id: 'p-3',
    title: 'Neonatal Sepsis & Sick Newborn Management',
    category: 'Newborn',
    snippet: 'Newborn details (under 28 days) exhibiting fever (temp >= 37.5 C) or hypothermia (< 35.5 C) require urgent classification of Possible Serious Bacterial Infection (PSBI). Administer pre-referral Gentamicin intramuscularly and first-dose oral Ampicillin, then secure immediate clinical transfer.',
    confidence: 98,
    lastUpdated: '2026-01-20',
    sourceType: 'Newborn Care & PSBI Guideline'
  },
  {
    id: 'p-4',
    title: 'Standard Pediatric Fever & Malignant Malaria Prevention',
    category: 'Fever',
    snippet: 'Perform rapid diagnostic test (RDT) for Malaria in endemic zones. If positive and child is over 5kg, prescribe Artemether-Lumefantrine (AL) doses according to weight tiers. If RDT negative, investigate for alternate causes of high temperature.',
    confidence: 92,
    lastUpdated: '2026-03-01',
    sourceType: 'National Malaria Clinical Guidelines'
  },
  {
    id: 'p-5',
    title: 'ልጅ ላይ የሚታይ ትኩሳት እና የመተንፈስ ችግር (IMNCI - Amharic)',
    category: 'Child Health (አማርኛ)',
    snippet: 'እድሜያቸው ከ2-11 ወር የሆኑ ህጻናት የትንፋሽ ፍጥነት በደቂቃ 50 ወይም ከዚያ በላይ፣ ከ12-59 ወር ደግሞ 40 ወይም ከዚያ በላይ ከሆነ ፈጣን ትንፋሽ (Fast Breathing) ይባላል። በአስቸኳይ አሞክሳሲሊን መጀመር አለበት። የደረት መጎድጎድ (Chest Indrawing) ወይም ማንቀጥቀጥ ካለ ወዲያውኑ ወደ ሪፈራል መላክ ያስፈልጋል።',
    confidence: 97,
    lastUpdated: '2026-04-12',
    sourceType: 'በጤና ጥበቃ ሚኒስቴር የተቀናጀ የህጻናት በሽታዎች አያያዝ መመሪያ'
  }
];

// Seed the 5 Demo Cases from the instructions
export const demoCases: CaseIntake[] = [
  {
    id: 'case-demo-1',
    basics: {
      age: 3,
      ageUnit: 'years',
      sex: 'Male',
      pregnancyStatus: 'N/A',
      isNewborn: false,
      region: 'Oromia',
      woreda: 'Ada\'a',
      facilityName: 'Denbi Health Post'
    },
    vitals: {
      temperature: 38.4,
      respiratoryRate: 46,
      symptomDurationDays: 3
    },
    symptoms: {
      fever: true,
      cough: true,
      fastBreathing: true,
      chestIndrawing: false,
      convulsions: false,
      lethargy: false,
      unableToDrink: false,
      vomitingEverything: false,
      diarrhea: false,
      dehydrationSigns: false,
      bleedingDuringPregnancy: false,
      severeHeadache: false,
      reducedFetalMovement: false
    },
    dangerSignsDetected: ['Fast Breathing detected for age 3 (RR 46 >= 40/min)', 'Sustained elevation in body temperature (38.4 C)'],
    createdAt: '2026-06-12T01:10:00-07:00'
  },
  {
    id: 'case-demo-2',
    basics: {
      age: 26,
      ageUnit: 'years',
      sex: 'Female',
      pregnancyStatus: 'Yes',
      isNewborn: false,
      region: 'Amhara',
      woreda: 'Debre Birhan',
      facilityName: 'Tebase Health Post'
    },
    vitals: {
      temperature: 36.8,
      respiratoryRate: 18,
      symptomDurationDays: 1
    },
    symptoms: {
      fever: false,
      cough: false,
      fastBreathing: false,
      chestIndrawing: false,
      convulsions: false,
      lethargy: false,
      unableToDrink: false,
      vomitingEverything: false,
      diarrhea: false,
      dehydrationSigns: false,
      bleedingDuringPregnancy: true,
      severeHeadache: true,
      reducedFetalMovement: true
    },
    dangerSignsDetected: ['Active vaginal bleeding during pregnancy', 'Severe gestational headache', 'Reduced fetal movement'],
    createdAt: '2026-06-12T01:35:00-07:00'
  },
  {
    id: 'case-demo-3',
    basics: {
      age: 12,
      ageUnit: 'days',
      sex: 'Female',
      pregnancyStatus: 'N/A',
      isNewborn: true,
      region: 'Afar',
      woreda: 'Asayita',
      facilityName: 'Asayita Rural Post'
    },
    vitals: {
      temperature: 38.9,
      respiratoryRate: 58,
      symptomDurationDays: 1
    },
    symptoms: {
      fever: true,
      cough: false,
      fastBreathing: true,
      chestIndrawing: true,
      convulsions: false,
      lethargy: true,
      unableToDrink: true,
      vomitingEverything: false,
      diarrhea: false,
      dehydrationSigns: false,
      bleedingDuringPregnancy: false,
      severeHeadache: false,
      reducedFetalMovement: false
    },
    dangerSignsDetected: [
      'Newborn fever under 28 days (38.9 C)', 
      'Chest indrawing present', 
      'Lethargy / Unable to drink or breastfeed'
    ],
    createdAt: '2026-06-12T02:00:00-07:00'
  },
  {
    id: 'case-demo-4',
    basics: {
      age: 34,
      ageUnit: 'years',
      sex: 'Male',
      pregnancyStatus: 'N/A',
      isNewborn: false,
      region: 'Southern Ethiopia',
      woreda: 'Arba Minch',
      facilityName: 'Limbo Health Post'
    },
    vitals: {
      temperature: 37.1,
      respiratoryRate: 16,
      symptomDurationDays: 5
    },
    symptoms: {
      fever: false,
      cough: true,
      fastBreathing: false,
      chestIndrawing: false,
      convulsions: false,
      lethargy: false,
      unableToDrink: false,
      vomitingEverything: false,
      diarrhea: false,
      dehydrationSigns: false,
      bleedingDuringPregnancy: false,
      severeHeadache: false,
      reducedFetalMovement: false
    },
    dangerSignsDetected: [],
    createdAt: '2026-06-12T02:15:00-07:00'
  },
  {
    id: 'case-demo-5',
    basics: {
      age: 18,
      ageUnit: 'months',
      sex: 'Female',
      pregnancyStatus: 'N/A',
      isNewborn: false,
      region: 'Oromia',
      woreda: 'Fentale',
      facilityName: 'Metehara Health Post'
    },
    vitals: {
      temperature: 38.1,
      respiratoryRate: 48,
      symptomDurationDays: 2
    },
    symptoms: {
      fever: true,
      cough: true,
      fastBreathing: true,
      chestIndrawing: true,
      convulsions: false,
      lethargy: false,
      unableToDrink: false,
      vomitingEverything: false,
      diarrhea: false,
      dehydrationSigns: false,
      bleedingDuringPregnancy: false,
      severeHeadache: false,
      reducedFetalMovement: false
    },
    dangerSignsDetected: [
      'ትኩሳት እና ሳል ይታያል (RR 48/min)',
      'የደረት መጎድጎድ (Chest indrawing) ምልክት አለ'
    ],
    createdAt: '2026-06-12T02:22:00-07:00'
  }
];

// Associated assistant responses for the demo cases
export const demoResponses: Record<string, AssistantResponse> = {
  'case-demo-1': {
    id: 'resp-demo-1',
    urgency: 'Same-day',
    textContent: 'Patient presents with diagnostic indicators for Non-Severe Pneumonia under the child health guidelines. Fast breathing RR 46 >= 40 for a 3-year-old is the primary clinical driver. Body temperature is moderately elevated at 38.4 C. Start standard oral Amoxicillin course and educate guardians on danger sign monitoring.',
    recommendedActions: [
      'Prescribe oral Amoxicillin dispersible tablets (250mg) - 2 tablets twice daily for 5 days.',
      'Soothe the throat with safe home remedies (warm fluids, breastfeeds).',
      'Advise return immediately if respiratory rate accelerates, chest indrawing occurs, or feeding worsens.',
      'Schedule routine follow-up recheck in 2 days (48 hours).'
    ],
    dangerSignsToCheck: [
      'Check for chest indrawing (respiratory distress)',
      'Monitor for lethargy or inability to awaken the child',
      'Assess ability to breastfeed, drink, or swallow fluids',
      'Watch for persistent vomiting after feeding'
    ],
    followUpQuestions: [
      'Is there any history of severe breathing rattling or wheezing?',
      'Has the child received PCV (Pneumococcal Conjugate Vaccine) immunizations?'
    ],
    evidence: [mockProtocols[0], mockProtocols[3]],
    safetyRouteRequired: false,
    piiRedacted: true,
    responseSource: 'LLM_Ollama',
    responseLanguage: 'en'
  },
  'case-demo-2': {
    id: 'resp-demo-2',
    urgency: 'Emergency',
    textContent: 'CRITICAL WARNING: Bleeding during pregnancy represents an obstetric emergency that risks fetal and maternal viability. Immediate clinical stabilization and institutional referral is mandatory. Do not proceed with manual cervical exploration.',
    recommendedActions: [
      'DO NOT execute any vaginal or speculum examinations at the health post layer.',
      'Initiate urgent referral procedures to the nearest Secondary Hospital with emergency obstetric capacity.',
      'Position patient in the left lateral tilt position to optimize uterine and placental perfusion.',
      'Establish large-bore venous access with continuous IV Normal Saline if signs of hypovolemic shock emerge.'
    ],
    dangerSignsToCheck: [
      'Check for sudden drop in maternal blood pressure or elevated tachycardia',
      'Assess for visual disturbances, hyperreflexia, or severe epigastric cramping',
      'Monitor volume of active vaginal blood loss (count saturated sanitary pads)'
    ],
    followUpQuestions: [
      'What is the estimated gestational age in weeks?',
      'Is there a history of pre-eclampsia or sudden fainting spells?'
    ],
    evidence: [mockProtocols[1]],
    safetyRouteRequired: true,
    piiRedacted: true,
    responseSource: 'LLM_Cloud_Grounded',
    responseLanguage: 'en'
  },
  'case-demo-3': {
    id: 'resp-demo-3',
    urgency: 'Emergency',
    textContent: 'CRITICAL NEONATAL ALIGNMENT: Newborn fever at 12 days indicates a Possible Serious Bacterial Infection (PSBI). This is a clinical emergency with high risk of systemic rapid decay. Pre-referral intramuscular therapy must be coordinated immediately.',
    recommendedActions: [
      'Administer pre-referral intramuscular Gentamicin dose (calculated appropriately for weight).',
      'Administer initial oral Ampicillin dose under direct observe.',
      'Construct urgent emergency transfer to pediatric referral ward at primary hospital.',
      'Maintain maternal skin-to-skin contact (Kangaroo Mother Care) during transit to prevent hypothermia.'
    ],
    dangerSignsToCheck: [
      'Watch for sudden grunting, nasal flaring, or severe gasping intervals',
      'Assess for convulsions or rhythmic limb twitching',
      'Look for yellowish tint skin/eyes suggesting severe jaundice'
    ],
    followUpQuestions: [
      'Was the labor course prolonged or associated with ruptured membranes > 18 hours?',
      'Is there any customized umbilical cord purulent drainage?'
    ],
    evidence: [mockProtocols[2]],
    safetyRouteRequired: true,
    piiRedacted: true,
    responseSource: 'LLM_Cloud_Grounded',
    responseLanguage: 'en'
  },
  'case-demo-4': {
    id: 'resp-demo-4',
    urgency: 'Routine',
    textContent: 'Patient presents with standard localized cough without respiratory distress, hyperventilation, or active danger flags. Urgency classified as Routine. Focus on symptomatic home relief, vaccine status checks, and patient education on secondary warning indicators.',
    recommendedActions: [
      'Deliver home care guidance using traditional soothing agents (honey, warm water).',
      'Review tuberculosis immunization track and general family screening history.',
      'Check if local seasonal influenza or environmental irritants are present.'
    ],
    dangerSignsToCheck: [
      'Observe if cough extends beyond 14 days (chronic threshold requiring TB evaluation)',
      'Watch for developing temperature spikes, breath gaps, or chest tightening'
    ],
    followUpQuestions: [
      'Is there any active contact with family members who have active TB or persistent cough?',
      'Does the cough worsen during severe cold nights?'
    ],
    evidence: [mockProtocols[0]],
    safetyRouteRequired: false,
    piiRedacted: false,
    responseSource: 'Offline_Rules',
    responseLanguage: 'en'
  },
  'case-demo-5': {
    id: 'resp-demo-5',
    urgency: 'Same-day',
    textContent: 'በቀረበው መረጃ መሰረት ህጻንዋ የሳምባ ምች (Pneumonia) ምልክቶች አሉ። ፈጣን ትንፋሽ በደቂቃ 48 እና የደረት መጎድጎድ ምልክት ይታያል። አፋጣኝ የአሞክሳሲሊን ህክምና መጀመር እና የሪፈራል ዝግጅት ማድረግ ያስፈልጋል።',
    recommendedActions: [
      'የአሞክሳሲሊን ኪኒን (250 ሚ.ግ) በቀን ሁለት ጊዜ ለ 5 ቀናት ይስጡ።',
      'የደረት መጎድጎዱ ከቀጠለ ወይም ህጻኑ መጥባት ካቆመ በአስቸኳይ ወደ ሆስፒታል ይውሰዱ።',
      'በቂ የእናት ጡት ወተት ማግኘቱን ያረጋግጡ።',
      'በ48 ሰአት ውስጥ ለተጨማሪ ምርመራ ይመለሱ።'
    ],
    dangerSignsToCheck: [
      'ህጻኑ ጡት መጥባት ወይም ፈሳሽ መዋጥ መቻሉን ደጋግመው ይመልከቱ።',
      'መንቀጥቀጥ ወይም ድካም ካለ ያረጋግጡ።',
      'የትንፋሽ ፍጥነት እንደገና መጨመሩን ይከታተሉ። flaps'
    ],
    followUpQuestions: [
      'ህጻኑ በተከታታይ ያስመለስባታል?',
      'ተጨማሪ የቆዳ ላይ ሽፍታ ወይም የጆሮ ፈሳሽ አለ?'
    ],
    evidence: [mockProtocols[4]],
    safetyRouteRequired: false,
    piiRedacted: true,
    responseSource: 'LLM_Cloud_Grounded',
    responseLanguage: 'am'
  }
};

// Initial supervisor review queue items
export const initialReviewQueue: ReviewItem[] = [
  {
    id: 'rev-001',
    caseId: 'case-demo-2',
    dateTime: '2026-06-12T01:35:00-07:00',
    hewLocation: 'Debre Birhan (Tebase HP)',
    urgency: 'Emergency',
    triggerReason: 'High-risk Pregnancy Bleeding Indicator',
    aiConfidence: 94,
    feedbackRating: 2,
    status: 'Pending',
    assignedReviewer: 'Dr. Alula Kebede',
    originalCaseData: demoCases[1],
    aiResponse: demoResponses['case-demo-2'],
    reviewerNotes: 'Urgent case. Waiting for clinical transport callback.'
  },
  {
    id: 'rev-002',
    caseId: 'case-demo-3',
    dateTime: '2026-06-12T02:00:00-07:00',
    hewLocation: 'Asayita Rural Post',
    urgency: 'Emergency',
    triggerReason: 'Severe Neonatal Sepsis Alert (Under 28 Days)',
    aiConfidence: 91,
    feedbackRating: 5,
    status: 'Approved',
    assignedReviewer: 'Sr. Aster Tolossa',
    originalCaseData: demoCases[2],
    aiResponse: demoResponses['case-demo-3'],
    reviewerNotes: 'Kangaroo mother care initiated. Gentamicin dose verified by supervisor.'
  },
  {
    id: 'rev-003',
    caseId: 'case-demo-1',
    dateTime: '2026-06-11T18:45:00-07:00',
    hewLocation: 'Denbi Health Post',
    urgency: 'Same-day',
    triggerReason: 'Low Confidence RAG Score (< 60%)',
    aiConfidence: 58,
    feedbackRating: 1,
    status: 'Escalated',
    assignedReviewer: 'Dr. Alula Kebede',
    originalCaseData: demoCases[0],
    aiResponse: demoResponses['case-demo-1'],
    reviewerNotes: 'HEW complained that translation was awkward. Escalated to prompt engineering team.'
  }
];

// Initial field feedback entries
export const initialFeedbackList: FeedbackItem[] = [
  {
    id: 'fb-001',
    caseId: 'case-demo-1',
    rating: 2,
    comment: 'The child health dose recommendation is perfect, but the terminology of chest indrawing translated poorly in the local brief summary widget.',
    category: 'translation',
    language: 'en',
    location: 'Ada\'a Woreda (Denbi HP)',
    createdAt: '2026-06-11T19:00:00-07:00',
    modelUsed: 'Ollama: qwen2.5:1.5b',
    isReviewed: false
  },
  {
    id: 'fb-002',
    caseId: 'case-demo-3',
    rating: 5,
    comment: 'Life-saving sepsis prompt context guided me directly to double check Kangaroo Mother Care transit safety. Excellent speed!',
    category: 'accuracy',
    language: 'en',
    location: 'Asayita Rural Post',
    createdAt: '2026-06-12T02:15:00-07:00',
    modelUsed: 'Gemini 3.5 Flash Grounded',
    isReviewed: true
  },
  {
    id: 'fb-003',
    caseId: 'case-demo-5',
    rating: 4,
    comment: 'በእጅጉ ጠቃሚ ነው። የአማርኛ መመሪያዎቹ በገጠር ስራችን ላይ ፍጥነትን ጨምረውልናል።',
    category: 'clarity',
    language: 'am',
    location: 'Metehara Health Post',
    createdAt: '2026-06-12T02:25:00-07:00',
    modelUsed: 'Gemini 3.1 Pro (Thinking Mode)',
    isReviewed: false
  }
];

// Seed initial Improvement backlog
export const initialImprovementTasks: ImprovementTask[] = [
  {
    id: 'imp-101',
    title: 'Align Amharic localization for IMNCI chest indrawing definitions',
    status: 'Reviewing',
    priority: 'High',
    sourceFeedbackId: 'fb-001',
    createdAt: '2026-06-11T19:30:00-07:00'
  },
  {
    id: 'imp-102',
    title: 'Tune local rules engine fallback thresholds for low-bandwidth vector search',
    status: 'New',
    priority: 'Medium',
    sourceFeedbackId: 'fb-003',
    createdAt: '2026-06-12T02:30:00-07:00'
  },
  {
    id: 'imp-103',
    title: 'Validate maternal RAG guidelines with state obstetrician panels',
    status: 'NeedsProtocolUpdate',
    priority: 'Critical',
    sourceFeedbackId: 'fb-002',
    createdAt: '2026-06-10T14:00:00-07:00'
  }
];

// Initial evaluation test cases
export const initialTestCases: EvaluationTestCase[] = [
  {
    id: 't-01',
    name: 'Under-5 Pneumonia Respiratory Classification Test',
    inputDescription: 'Male 2yo presenting with RR 44 and Fever 38.6 C.',
    language: 'en',
    expectedUrgency: 'Same-day',
    actualUrgency: 'Same-day',
    citationsPresent: true,
    safetyRouteTriggered: false,
    status: 'Pass',
    lastRunDate: '2026-06-11'
  },
  {
    id: 't-02',
    name: 'Maternal Placenta Abruptio Safety Trigger',
    inputDescription: 'Female 22yo, pregnant, reports heavy red blood loss, lower abdominal cramping.',
    language: 'en',
    expectedUrgency: 'Emergency',
    actualUrgency: 'Emergency',
    citationsPresent: true,
    safetyRouteTriggered: true,
    status: 'Pass',
    lastRunDate: '2026-06-11'
  },
  {
    id: 't-03',
    name: 'Newborn Neonatal Sepsis Diagnostic Catch',
    inputDescription: '7-day-old newborn, persistent vomiting and cold temperature (35.1 C).',
    language: 'en',
    expectedUrgency: 'Emergency',
    actualUrgency: 'Emergency',
    citationsPresent: true,
    safetyRouteTriggered: true,
    status: 'Pass',
    lastRunDate: '2026-06-11'
  },
  {
    id: 't-04',
    name: 'Amharic Pneumonia Classification Test (የልጅ የሳምባ ምች ፈጣን ትንፋሽ)',
    inputDescription: 'ህጻን እድሜ 1 ዓመት፣ ትንፋሽ በደቂቃ 48፣ ሳል እና የደረት መጎድጎድ።',
    language: 'am',
    expectedUrgency: 'Same-day',
    actualUrgency: 'Same-day',
    citationsPresent: true,
    safetyRouteTriggered: false,
    status: 'Pass',
    lastRunDate: '2026-06-11'
  },
  {
    id: 't-05',
    name: 'Asymptomatic Routine Case (Adult mild cough)',
    inputDescription: 'Adult 45yo, mild cough for 2 days, no headache, no breathing rate increase.',
    language: 'en',
    expectedUrgency: 'Routine',
    actualUrgency: 'Need_Info',
    citationsPresent: false,
    safetyRouteTriggered: false,
    status: 'Fail',
    lastRunDate: '2026-06-11'
  }
];

// Initial Evaluation Summary
export const initialEvaluationSummary: EvaluationSummary = {
  urgencyAccuracy: 95.8,
  citationCoverage: 100.0,
  hallucinationRisk: 1.2,
  faithfulnessScore: 4.85,
  piiRedactionRate: 99.4,
  safetyRoutingRate: 100.0,
  amharicPassRate: 92.5,
  averageLatencyMs: 420,
  fallbackRate: 4.5
};

// Seed prompt registries
export const mockPrompts: PromptTemplate[] = [
  {
    id: 'pr-001',
    name: 'Clinical ICCM General Assistant Prompt',
    version: 'v2.8.4',
    systemInstruction: `You are HEP Assist FieldKit Pro, an advanced medical decision support engine. Your function is to read input case data from health workers and provide strict, grounded recommendations following Ministry of Health rules. Highlight urgency (Emergency, Same-day, Routine), emergency action steps, and diagnostic checkboxes. Redact any patient identifiers automatically. ALWAYS cite retrieved protocol sections.`,
    isActive: true,
    updatedAt: '2026-05-20'
  },
  {
    id: 'pr-002',
    name: 'Amharic Triage Translator Prompt',
    version: 'v1.4.2',
    systemInstruction: `ከጤና ኤክስቴንሽን ሰራተኞች ለሚመጡ ጥያቄዎች በሀገር በቀል የህክምና መመሪያዎች (Integrated Community Case Management - iCCM) ላይ ተመስርተህ ግልጽና ቀጥተኛ ምላሽ ስጥ። የአደጋ ምልክቶችን (Danger Signs) በግልጽ አስምር። ሪፈራል ካስፈለገ ወዲያውኑ አሳይ።`,
    isActive: true,
    updatedAt: '2026-06-02'
  }
];

export const initialModelOps: ModelOpsConfig = {
  provider: 'Ollama_Local',
  baseUrl: 'http://127.0.0.1:11434',
  modelName: 'qwen2.5:1.5b-instruct',
  temperature: 0.15,
  maxTokens: 1024,
  timeoutSeconds: 8,
  fallbackEnabled: true,
  chunkCount: 1542,
  embeddingModel: 'local:nomic-embed-text-v1.5',
  vectorDbStatus: 'Green',
  graphNodes: 284,
  graphEdges: 395
};

export const initialOfflineSyncQueue: OfflineSyncItem[] = [
  {
    id: 'syn-1',
    type: 'Feedback',
    createdAt: '2026-06-12T02:10:00-07:00',
    status: 'Pending',
    retryCount: 0,
    payload: {
      caseId: 'case-demo-1',
      rating: 4,
      comment: 'Sync queue test during field deployment.'
    }
  },
  {
    id: 'syn-2',
    type: 'ReviewNote',
    createdAt: '2026-06-12T02:12:00-07:00',
    status: 'Failed',
    retryCount: 3,
    lastError: 'HTTP 503 Service Unavailable (MOH proxy down)',
    payload: {
      caseId: 'case-demo-2',
      note: 'Supervisor completed high risk routing and referral transport dispatch.'
    }
  }
];
