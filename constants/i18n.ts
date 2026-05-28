// ─────────────────────────────────────────────────────────────────────────────
//  i18n.ts — Tracksy multilingual translation system
//  Languages: English | Tanglish (Tamil in Latin) | Tamil (தமிழ்) | Hindi (हिंदी)
// ─────────────────────────────────────────────────────────────────────────────

export type Language = 'en' | 'tanglish' | 'ta' | 'hi';

export interface LanguageMeta {
  code: Language;
  label: string;
  nativeLabel: string;
  flag: string;
}

export const LANGUAGES: LanguageMeta[] = [
  { code: 'en',       label: 'English',  nativeLabel: 'English',    flag: '🇬🇧' },
  { code: 'tanglish', label: 'Tanglish', nativeLabel: 'தமிழ்-EN',  flag: '🇮🇳' },
  { code: 'ta',       label: 'Tamil',    nativeLabel: 'தமிழ்',      flag: '🇮🇳' },
  { code: 'hi',       label: 'Hindi',    nativeLabel: 'हिंदी',      flag: '🇮🇳' },
];

export interface Translations {
  // App
  appName: string;
  eliteProductivity: string;
  // Dashboard
  recentTransactions: string;
  viewAll: string;
  noRecords: string;
  savingsRate: string;
  reminders: string;
  bills: string;
  aiAdvisor: string;
  askAdvice: string;
  // Productivity hub
  evolutionStage: string;
  avgTicks: string;
  seedling: string;
  sprouter: string;
  grower: string;
  master: string;
  legend: string;
  started: string;
  flowering: string;
  flourishing: string;
  exceptional: string;
  elite: string;
  // Transactions
  income: string;
  expense: string;
  balance: string;
  untitled: string;
  // Actions
  add: string;
  edit: string;
  delete: string;
  cancel: string;
  save: string;
  ok: string;
  // Alert modals
  options: string;
  manageTransaction: string;
  deleteRecord: string;
  cannotUndo: string;
  keep: string;
  // Settings screen
  settings: string;
  preferences: string;
  dataLock: string;
  portability: string;
  exportBackup: string;
  importJson: string;
  factoryReset: string;
  security: string;
  privacyPolicy: string;
  checkUpdates: string;
  eliteMember: string;
  language: string;
  selectLanguage: string;
  // Todo / Productivity tabs
  todos: string;
  notes: string;
  habits: string;
  voice: string;
  // Update modal
  newUpdate: string;
  updateNow: string;
  later: string;
  // Reset
  resetApp: string;
  wipeData: string;
  wipeAll: string;
  // PIN setup
  setNewPin: string;
  confirmPin: string;
  enter4Digit: string;
  reenterPin: string;
  pinsNoMatch: string;
  // Chat / AI
  chat: string;
  // Currency section
  currency: string;
  // Months (for month selector)
  months: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
//  ENGLISH
// ─────────────────────────────────────────────────────────────────────────────
const en: Translations = {
  appName: 'Tracksy',
  eliteProductivity: 'ELITE PRODUCTIVITY',
  recentTransactions: 'Recent Transactions',
  viewAll: 'VIEW ALL',
  noRecords: 'No records this month',
  savingsRate: 'Savings Rate',
  reminders: 'Reminders',
  bills: 'Bills',
  aiAdvisor: 'Tracksy AI Financial Advisor',
  askAdvice: 'ASK ME FOR STRATEGIC BUDGET ADVICE',
  evolutionStage: 'EVOLUTION STAGE',
  avgTicks: 'AVG TICKS',
  seedling: 'Seedling',
  sprouter: 'Sprouter',
  grower: 'Grower',
  master: 'Master',
  legend: 'Legend',
  started: 'Started',
  flowering: 'Flowering',
  flourishing: 'Flourishing',
  exceptional: 'Exceptional',
  elite: 'Elite',
  income: 'Income',
  expense: 'Expense',
  balance: 'Balance',
  untitled: 'Untitled',
  add: 'Add',
  edit: 'Edit',
  delete: 'Delete',
  cancel: 'Cancel',
  save: 'Save',
  ok: 'OK',
  options: 'Options',
  manageTransaction: 'Manage this transaction',
  deleteRecord: 'Delete Record?',
  cannotUndo: 'This action cannot be undone.',
  keep: 'Keep',
  settings: 'Settings',
  preferences: 'PREFERENCES',
  dataLock: 'Data Lock',
  portability: 'PORTABILITY',
  exportBackup: 'Export Backup',
  importJson: 'Import JSON',
  factoryReset: 'Factory Reset',
  security: 'SECURITY',
  privacyPolicy: 'Privacy Policy',
  checkUpdates: 'Check for Updates',
  eliteMember: 'Elite Member',
  language: 'Language',
  selectLanguage: 'Select Language',
  todos: 'Todos',
  notes: 'Notes',
  habits: 'Habits',
  voice: 'Voice',
  newUpdate: 'NEW UPDATE AVAILABLE!',
  updateNow: 'UPDATE NOW',
  later: 'LATER',
  resetApp: 'Reset App',
  wipeData: 'This will wipe all data. Continue?',
  wipeAll: 'WIPE ALL',
  setNewPin: 'Set New PIN',
  confirmPin: 'Confirm PIN',
  enter4Digit: 'Enter a 4-digit PIN',
  reenterPin: 'Re-enter your PIN to confirm',
  pinsNoMatch: 'PINs do not match. Try again.',
  chat: 'Chat',
  currency: 'Currency',
  months: [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
//  TANGLISH  (Tamil words spelled in English / Latin script)
// ─────────────────────────────────────────────────────────────────────────────
const tanglish: Translations = {
  appName: 'Tracksy',
  eliteProductivity: 'ELITE UZHAIPU',
  recentTransactions: 'Kadaisi Nirpandangal',
  viewAll: 'ELLAM PAR',
  noRecords: 'Indha maathathil record illai',
  savingsRate: 'Sema Vilaiya Vilakkam',
  reminders: 'Ninaivootal',
  bills: 'Bill',
  aiAdvisor: 'Tracksy AI Nidhi Aalosagar',
  askAdvice: 'BUDGET PATHI KETTUNGAL',
  evolutionStage: 'VALARCHCHI NILAI',
  avgTicks: 'SARAT ALAVU',
  seedling: 'Thottram',
  sprouter: 'Mudikkiravan',
  grower: 'Valgirar',
  master: 'Thirappar',
  legend: 'Arivaalar',
  started: 'Thottangu',
  flowering: 'Pookkirathu',
  flourishing: 'Vazhgirathu',
  exceptional: 'Thalaimai',
  elite: 'Uchikkattu',
  income: 'Varumanam',
  expense: 'Selvavu',
  balance: 'Migudhi',
  untitled: 'Peyarillai',
  add: 'Serkka',
  edit: 'Thirutthu',
  delete: 'Neekku',
  cancel: 'Vittu Vidu',
  save: 'Semiyal',
  ok: 'Sari',
  options: 'Therthukal',
  manageTransaction: 'Nirpandatthai kaiyaalu',
  deleteRecord: 'Record Neekka?',
  cannotUndo: 'Indha seyal thirumba mudiyathu.',
  keep: 'Vaikka',
  settings: 'Amaippukal',
  preferences: 'VIRUPPANGAL',
  dataLock: 'Thagaval Poottu',
  portability: 'MAARIYAL',
  exportBackup: 'Backup Eduthu Vidu',
  importJson: 'JSON Uyirippu',
  factoryReset: 'Moolam Maari',
  security: 'PAATHUKAPPU',
  privacyPolicy: 'Thanniyurimai Kolgai',
  checkUpdates: 'Pudhukku Paaru',
  eliteMember: 'Uchikkattu Uyavar',
  language: 'Mozhi',
  selectLanguage: 'Mozhi Therthu',
  todos: 'Seyvaikal',
  notes: 'Kutrippadugal',
  habits: 'Pazhakkangal',
  voice: 'Kural',
  newUpdate: 'PUDHU PUTHUKKAM IRUKKU!',
  updateNow: 'IPPAVE PUTHUKKU',
  later: 'PINNAAR',
  resetApp: 'App Maari',
  wipeData: 'Ellaa thagavalum pochu. Thodaravaa?',
  wipeAll: 'ELLAM NEEKKU',
  setNewPin: 'Pudhu PIN Vaikka',
  confirmPin: 'PIN Uruthi Sei',
  enter4Digit: '4 Ilamam PIN Podungal',
  reenterPin: 'PIN-ai Maaruvadharkku Uruthi Seiyungal',
  pinsNoMatch: 'PIN-gal Porunthavilla. Maari Try Sei.',
  chat: 'Pesungal',
  currency: 'Naanayam',
  months: [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
//  TAMIL  (தமிழ் எழுத்து — Native Tamil script)
// ─────────────────────────────────────────────────────────────────────────────
const ta: Translations = {
  appName: 'Tracksy',
  eliteProductivity: 'சிறந்த உற்பத்தித்திறன்',
  recentTransactions: 'சமீபத்திய பரிவர்த்தனைகள்',
  viewAll: 'அனைத்தும் காண்க',
  noRecords: 'இந்த மாதம் பதிவுகள் இல்லை',
  savingsRate: 'சேமிப்பு விகிதம்',
  reminders: 'நினைவூட்டல்கள்',
  bills: 'பில்கள்',
  aiAdvisor: 'Tracksy AI நிதி ஆலோசகர்',
  askAdvice: 'பட்ஜெட் ஆலோசனை கேளுங்கள்',
  evolutionStage: 'வளர்ச்சி நிலை',
  avgTicks: 'சராசரி எண்ணிக்கை',
  seedling: 'தளிர்',
  sprouter: 'முளைக்கிறவன்',
  grower: 'வளர்கிறவன்',
  master: 'தேர்ந்தவன்',
  legend: 'புகழ்மிக்கவன்',
  started: 'தொடங்கியது',
  flowering: 'மலர்கிறது',
  flourishing: 'செழிக்கிறது',
  exceptional: 'அசாதாரணம்',
  elite: 'உயரிய நிலை',
  income: 'வருமானம்',
  expense: 'செலவு',
  balance: 'மீதி',
  untitled: 'தலைப்பில்லை',
  add: 'சேர்க்கவும்',
  edit: 'திருத்தவும்',
  delete: 'நீக்கவும்',
  cancel: 'ரத்து செய்',
  save: 'சேமிக்கவும்',
  ok: 'சரி',
  options: 'தேர்வுகள்',
  manageTransaction: 'பரிவர்த்தனையை நிர்வகிக்கவும்',
  deleteRecord: 'பதிவை நீக்கவுமா?',
  cannotUndo: 'இந்த செயலை திரும்பப் பெற முடியாது.',
  keep: 'வைத்திருக்கவும்',
  settings: 'அமைப்புகள்',
  preferences: 'விருப்பங்கள்',
  dataLock: 'தரவு பூட்டு',
  portability: 'மாற்றும் திறன்',
  exportBackup: 'காப்புப்பிரதி எடுக்கவும்',
  importJson: 'JSON இறக்கவும்',
  factoryReset: 'தொழிற்சாலை மீட்டமைப்பு',
  security: 'பாதுகாப்பு',
  privacyPolicy: 'தனியுரிமை கொள்கை',
  checkUpdates: 'புதுப்பிப்பு சரிபார்க்கவும்',
  eliteMember: 'உயரிய உறுப்பினர்',
  language: 'மொழி',
  selectLanguage: 'மொழியை தேர்வுசெய்க',
  todos: 'செய்யவேண்டியவை',
  notes: 'குறிப்புகள்',
  habits: 'பழக்கங்கள்',
  voice: 'குரல்',
  newUpdate: 'புதிய புதுப்பிப்பு உள்ளது!',
  updateNow: 'இப்போதே புதுப்பிக்கவும்',
  later: 'பிறகு',
  resetApp: 'ஆப் மீட்டமைக்கவும்',
  wipeData: 'அனைத்து தரவும் நீக்கப்படும். தொடரவுமா?',
  wipeAll: 'அனைத்தும் நீக்கவும்',
  setNewPin: 'புதிய PIN அமைக்கவும்',
  confirmPin: 'PIN உறுதிப்படுத்தவும்',
  enter4Digit: '4 இலக்க PIN உள்ளிடவும்',
  reenterPin: 'உறுதிப்படுத்த PIN மீண்டும் உள்ளிடவும்',
  pinsNoMatch: 'PIN பொருந்தவில்லை. மீண்டும் முயற்சிக்கவும்.',
  chat: 'உரையாடல்',
  currency: 'நாணயம்',
  months: [
    'ஜனவரி','பிப்ரவரி','மார்ச்','ஏப்ரல்','மே','ஜூன்',
    'ஜூலை','ஆகஸ்ட்','செப்டம்பர்','அக்டோபர்','நவம்பர்','டிசம்பர்',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
//  HINDI  (Devanagari)
// ─────────────────────────────────────────────────────────────────────────────
const hi: Translations = {
  appName: 'Tracksy',
  eliteProductivity: 'उत्कृष्ट उत्पादकता',
  recentTransactions: 'हाल के लेनदेन',
  viewAll: 'सभी देखें',
  noRecords: 'इस महीने कोई रिकॉर्ड नहीं',
  savingsRate: 'बचत दर',
  reminders: 'अनुस्मारक',
  bills: 'बिल',
  aiAdvisor: 'Tracksy AI वित्तीय सलाहकार',
  askAdvice: 'रणनीतिक बजट सलाह लें',
  evolutionStage: 'विकास चरण',
  avgTicks: 'औसत टिक',
  seedling: 'अंकुर',
  sprouter: 'पौधा',
  grower: 'वृद्धिकर्ता',
  master: 'महारथी',
  legend: 'किंवदंती',
  started: 'शुरुआत',
  flowering: 'प्रस्फुटन',
  flourishing: 'फलना-फूलना',
  exceptional: 'असाधारण',
  elite: 'उत्कृष्ट',
  income: 'आय',
  expense: 'व्यय',
  balance: 'शेष',
  untitled: 'अशीर्षक',
  add: 'जोड़ें',
  edit: 'संपादित',
  delete: 'हटाएं',
  cancel: 'रद्द करें',
  save: 'सहेजें',
  ok: 'ठीक है',
  options: 'विकल्प',
  manageTransaction: 'इस लेनदेन को प्रबंधित करें',
  deleteRecord: 'रिकॉर्ड हटाएं?',
  cannotUndo: 'यह क्रिया पूर्ववत नहीं की जा सकती।',
  keep: 'रखें',
  settings: 'सेटिंग्स',
  preferences: 'प्राथमिकताएं',
  dataLock: 'डेटा लॉक',
  portability: 'पोर्टेबिलिटी',
  exportBackup: 'बैकअप निर्यात',
  importJson: 'JSON आयात',
  factoryReset: 'फ़ैक्टरी रीसेट',
  security: 'सुरक्षा',
  privacyPolicy: 'गोपनीयता नीति',
  checkUpdates: 'अपडेट जांचें',
  eliteMember: 'उत्कृष्ट सदस्य',
  language: 'भाषा',
  selectLanguage: 'भाषा चुनें',
  todos: 'कार्य',
  notes: 'नोट्स',
  habits: 'आदतें',
  voice: 'आवाज़',
  newUpdate: 'नया अपडेट उपलब्ध!',
  updateNow: 'अभी अपडेट करें',
  later: 'बाद में',
  resetApp: 'ऐप रीसेट',
  wipeData: 'यह सभी डेटा मिटा देगा। जारी रखें?',
  wipeAll: 'सब मिटाएं',
  setNewPin: 'नया PIN सेट करें',
  confirmPin: 'PIN की पुष्टि करें',
  enter4Digit: '4 अंकों का PIN दर्ज करें',
  reenterPin: 'पुष्टि के लिए PIN दोबारा दर्ज करें',
  pinsNoMatch: 'PIN मेल नहीं खाते। फिर से प्रयास करें।',
  chat: 'चैट',
  currency: 'मुद्रा',
  months: [
    'जनवरी','फरवरी','मार्च','अप्रैल','मई','जून',
    'जुलाई','अगस्त','सितंबर','अक्टूबर','नवंबर','दिसंबर',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
//  Export
// ─────────────────────────────────────────────────────────────────────────────
export const translations: Record<Language, Translations> = { en, tanglish, ta, hi };

/** Convenience helper — returns the translation object for a given language code */
export function getT(lang: Language): Translations {
  return translations[lang] ?? translations.en;
}

// ─────────────────────────────────────────────────────────────────────────────
//  AI Insight templates — language-aware
//  These build the AI insight string in the user's chosen language
// ─────────────────────────────────────────────────────────────────────────────
export interface AIInsightInput {
  totalSpent: number;
  highestCat: string;
  percentage: string;
  expenseCount: number;
  currency?: string;
}

export function buildAIInsight(lang: Language, input: AIInsightInput): string {
  const { totalSpent, highestCat, percentage, expenseCount, currency = '₹' } = input;
  const amt = `${currency}${totalSpent.toLocaleString('en-IN')}`;

  if (expenseCount === 0) {
    switch (lang) {
      case 'ta':
        return 'வணக்கம்! நான் உங்கள் AI நிதி காவலன். செலவுகளை சேர்த்தால் பகுப்பாய்வு செய்வேன்.';
      case 'tanglish':
        return 'Vanakkam! Naan unga AI Guard. Selvugalai serkum pothu pagupaayivu seiven!';
      case 'hi':
        return 'नमस्ते! मैं आपका AI वित्त रक्षक हूँ। खर्च जोड़ने पर विश्लेषण करूंगा।';
      default:
        return "Hi! I'm your AI Guard. I'll analyze your spending once you add transactions.";
    }
  }

  if (expenseCount < 3) {
    switch (lang) {
      case 'ta':
        return `பகுப்பாய்வு தொடங்குகிறது... இதுவரை ${amt} செலவழித்துள்ளீர்கள்.`;
      case 'tanglish':
        return `Pagupaayivu thottangu... Indha varai ${amt} selvazhhitteeergal.`;
      case 'hi':
        return `विश्लेषण शुरू... अब तक ${amt} खर्च किए हैं।`;
      default:
        return `Starting analysis... You've spent ${amt} so far.`;
    }
  }

  switch (lang) {
    case 'ta':
      return `AI பகுப்பாய்வு: ${highestCat} உங்கள் மிகப்பெரிய செலவு (மொத்தத்தில் ${percentage}%). இந்த மாதம் அதிக சேமிக்க இதை கவனியுங்கள்!`;
    case 'tanglish':
      return `AI Insight: ${highestCat} unga top selvavu (${percentage}% of total). Indha maathathil adhiga semia ithai kavaniyungal!`;
    case 'hi':
      return `AI विश्लेषण: ${highestCat} आपका सबसे बड़ा खर्च है (कुल का ${percentage}%)। इस महीने बचत बढ़ाने के लिए इसे नियंत्रित करें!`;
    default:
      return `AI Insight: ${highestCat} is your top expense (${percentage}% of total). Monitor this to save more this month!`;
  }
}
