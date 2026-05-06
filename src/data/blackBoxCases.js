// src/data/blackBoxCases.js
// Clinical Black Box — 6 cases with deliberately incomplete information
// Each panel has a cost in tokens and a "key" flag (was this essential to diagnose?)

export const BLACK_BOX_CASES = [

  // ─────────────────────────────────────────────────────────────────
  // CASE 1 — Iron Deficiency Anaemia
  // ─────────────────────────────────────────────────────────────────
  {
    id: "bb_001",
    title: "The Silent Anaemia",
    specialty: "Haematology",
    difficulty: "medium",
    firstClue: { icon: "🩸", label: "Haemoglobin", value: "Hb 6.2 g/dL" },
    redHerring: null,

    panels: [
      { id: "age",      cost: 5,  icon: "👤", label: "Patient info",      key: false, value: "Female, 28 years old. Referred from GP." },
      { id: "symptoms", cost: 10, icon: "🗣️", label: "Presenting symptoms", key: true,  value: "3-month history of progressive fatigue, shortness of breath on exertion, palpitations. Noticed her hair thinning. Craves ice cubes (pagophagia)." },
      { id: "vitals",   cost: 5,  icon: "📊", label: "Vitals",             key: false, value: "HR 102 bpm, BP 108/68, RR 16, Temp 36.8°C, SpO2 98% on air. Pale conjunctivae." },
      { id: "pmhx",     cost: 10, icon: "📋", label: "Past history",       key: true,  value: "Menorrhagia — heavy periods since age 15. No previous investigations. Vegetarian diet for 5 years. No GI symptoms." },
      { id: "bloods",   cost: 15, icon: "🔬", label: "Full blood count + iron studies", key: true, value: "MCV 68 fL (low — microcytic). MCH 20 pg (low). Serum iron 4 μmol/L (low). Ferritin 4 ng/mL (critically low). TIBC elevated. Reticulocytes 1.8%." },
      { id: "film",     cost: 20, icon: "🔭", label: "Blood film",         key: false, value: "Microcytic hypochromic red cells. Pencil cells (elliptocytes). Anisocytosis and poikilocytosis. No blast cells." },
      { id: "b12",      cost: 15, icon: "💉", label: "B12 / Folate",       key: false, value: "B12 380 pmol/L (normal). Folate 8.2 nmol/L (normal). — RED HERRING: these are normal, do not be misled into B12 deficiency." },
      { id: "scope",    cost: 20, icon: "🩻", label: "Endoscopy / imaging", key: false, value: "Given her age and no GI symptoms, upper GI endoscopy deferred. Pelvic USS: bulky uterus, possible fibroids." },
    ],

    diagnoses: [
      "Iron Deficiency Anaemia",
      "Vitamin B12 Deficiency Anaemia",
      "Anaemia of Chronic Disease",
      "Thalassaemia Trait",
    ],
    correctDiagnosis: "Iron Deficiency Anaemia",

    minTokensToSolve: 25, // symptoms + bloods alone
    idealPanels: ["symptoms", "pmhx", "bloods"],

    explanation: "Microcytic hypochromic anaemia + low ferritin + menorrhagia + vegetarian = iron deficiency. The low MCV and ferritin are diagnostic. B12 is normal — that's a deliberate red herring.",
    keyLearning: [
      "Ferritin is the most sensitive marker of iron stores — low ferritin = iron deficiency until proven otherwise",
      "Pagophagia (craving ice) is a classic pica symptom of iron deficiency",
      "Always ask about menstrual history and diet in young women with anaemia",
      "MCV <80 = microcytic — differentials: iron deficiency, thalassaemia, anaemia of chronic disease",
    ],
    badges: {
      sherlock:  { threshold: 2, label: "Sherlock", icon: "🔍", desc: "Diagnosed with ≤2 unlocks" },
      efficient: { threshold: 3, label: "Efficient", icon: "⚡", desc: "Used only key panels" },
      thorough:  { threshold: 8, label: "Thorough",  icon: "📚", desc: "Unlocked everything" },
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // CASE 2 — Paracetamol Overdose
  // ─────────────────────────────────────────────────────────────────
  {
    id: "bb_002",
    title: "The Overdose",
    specialty: "Medicine",
    difficulty: "hard",
    firstClue: { icon: "🧠", label: "GCS on arrival", value: "GCS 9/15 — E2V3M4" },
    redHerring: "normal",

    panels: [
      { id: "age",      cost: 5,  icon: "👤", label: "Patient info",       key: false, value: "Male, 19 years old. Brought in by ambulance. Found by housemate." },
      { id: "hx",       cost: 10, icon: "🗣️", label: "History from witness", key: true, value: "Housemate found empty paracetamol boxes — at least 30 tablets. Patient last seen well 8 hours ago. History of depression. Alcohol smell noted." },
      { id: "vitals",   cost: 5,  icon: "📊", label: "Vitals",              key: false, value: "HR 88, BP 122/76, RR 14, Temp 36.9°C. Pupils equal and reactive 4mm. No cyanosis." },
      { id: "bloods",   cost: 15, icon: "🔬", label: "FBC / U&E / LFTs",   key: true,  value: "WCC 9.2, Hb 138 (normal). Na 138, K 3.9, Cr 88 (normal). ALT 28 (normal at 8h — will rise later). INR 1.1 (normal now — will rise). Glucose 4.8." },
      { id: "paracetamol", cost: 15, icon: "💊", label: "Paracetamol level", key: true, value: "Paracetamol level: 142 mg/L at 8 hours post-ingestion. This is ABOVE the treatment line — N-acetylcysteine (NAC) is indicated." },
      { id: "salicylate", cost: 15, icon: "🧪", label: "Salicylate level",  key: false, value: "Salicylate level: <30 mg/L (normal/undetectable). — RED HERRING: Not a salicylate overdose despite GCS depression." },
      { id: "ecg",      cost: 10, icon: "📈", label: "ECG",                 key: false, value: "Sinus rhythm. QTc 420ms (normal). No conduction abnormalities. Not diagnostic here." },
      { id: "abg",      cost: 15, icon: "💨", label: "ABG",                 key: false, value: "pH 7.42, pO2 12.1, pCO2 4.8, HCO3 23. Normal — no metabolic acidosis yet (early presentation)." },
    ],

    diagnoses: [
      "Paracetamol Overdose",
      "Salicylate Overdose",
      "Opiate Overdose",
      "Alcohol Intoxication with Metabolic Acidosis",
    ],
    correctDiagnosis: "Paracetamol Overdose",

    minTokensToSolve: 30,
    idealPanels: ["hx", "bloods", "paracetamol"],

    explanation: "Normal LFTs and INR at 8 hours is classic — paracetamol hepatotoxicity peaks at 72 hours. Paracetamol level above the treatment line mandates NAC. Salicylate level is a red herring — normal.",
    keyLearning: [
      "Normal LFTs early in paracetamol overdose does NOT exclude toxicity — damage peaks at 48–72h",
      "Paracetamol level must be taken ≥4h post-ingestion and plotted on the Rumack-Matthew nomogram",
      "N-acetylcysteine (NAC) is the antidote — replenishes glutathione",
      "Always check paracetamol AND salicylate levels in any suspected overdose",
      "GCS depression in paracetamol OD may be due to co-ingested alcohol — not the paracetamol itself",
    ],
    badges: {
      sherlock:  { threshold: 2, label: "Sherlock", icon: "🔍", desc: "Diagnosed with ≤2 unlocks" },
      efficient: { threshold: 3, label: "Efficient", icon: "⚡", desc: "Used only key panels" },
      thorough:  { threshold: 8, label: "Thorough",  icon: "📚", desc: "Unlocked everything" },
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // CASE 3 — Atrial Fibrillation
  // ─────────────────────────────────────────────────────────────────
  {
    id: "bb_003",
    title: "The Irregular Pulse",
    specialty: "Medicine",
    difficulty: "easy",
    firstClue: { icon: "📈", label: "ECG strip", value: "Irregularly irregular rhythm. No discernible P waves. Ventricular rate ~110 bpm." },
    redHerring: null,

    panels: [
      { id: "age",      cost: 5,  icon: "👤", label: "Patient info",        key: false, value: "Male, 71 years old. Walked in to A&E." },
      { id: "symptoms", cost: 10, icon: "🗣️", label: "Symptoms",            key: true,  value: "3-day history of palpitations, mild breathlessness on exertion, and reduced exercise tolerance. No chest pain, no syncope. Denies fever." },
      { id: "vitals",   cost: 5,  icon: "📊", label: "Vitals",              key: true,  value: "HR 112 (irregular), BP 138/84, RR 18, SpO2 96% on air, Temp 37.1°C." },
      { id: "pmhx",     cost: 10, icon: "📋", label: "Past history",        key: false, value: "Hypertension (on amlodipine). Hyperthyroidism treated 10 years ago. Social drinker." },
      { id: "bloods",   cost: 15, icon: "🔬", label: "FBC / TFTs / U&E",   key: true,  value: "FBC normal. TSH <0.01 (suppressed), fT4 elevated — HYPERTHYROIDISM. Na/K/Cr normal. CRP 8." },
      { id: "echo",     cost: 20, icon: "🫀", label: "Echocardiogram",      key: false, value: "Left atrial dilatation. EF 55% (preserved). Mild mitral regurgitation. No thrombus seen (TOE recommended if cardioversion planned)." },
      { id: "cxr",      cost: 10, icon: "🩻", label: "Chest X-ray",         key: false, value: "Mild cardiomegaly. No pulmonary oedema. No consolidation." },
      { id: "clotting", cost: 15, icon: "💉", label: "Clotting / CHA2DS2",  key: false, value: "INR 1.1. CHA₂DS₂-VASc score: 2 (age + hypertension) — anticoagulation recommended." },
    ],

    diagnoses: [
      "Atrial Fibrillation secondary to Hyperthyroidism",
      "Atrial Flutter",
      "Ventricular Tachycardia",
      "Sinus Tachycardia with Ectopics",
    ],
    correctDiagnosis: "Atrial Fibrillation secondary to Hyperthyroidism",

    minTokensToSolve: 20,
    idealPanels: ["vitals", "bloods"],

    explanation: "Irregularly irregular + no P waves = AF. Suppressed TSH + elevated fT4 = hyperthyroidism — a classic precipitant of AF. Previous thyroid history is a clue. Rate control + anticoagulation + treat the underlying thyrotoxicosis.",
    keyLearning: [
      "Irregularly irregular pulse with no P waves = AF until proven otherwise",
      "Always check TFTs in new AF — hyperthyroidism is a treatable cause",
      "CHA₂DS₂-VASc score determines anticoagulation need",
      "Rate control (beta-blocker or digoxin) before considering rhythm control",
      "Cardioversion requires 3 weeks of anticoagulation or TOE to exclude LA thrombus",
    ],
    badges: {
      sherlock:  { threshold: 2, label: "Sherlock", icon: "🔍", desc: "Diagnosed with ≤2 unlocks" },
      efficient: { threshold: 3, label: "Efficient", icon: "⚡", desc: "Used only key panels" },
      thorough:  { threshold: 8, label: "Thorough",  icon: "📚", desc: "Unlocked everything" },
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // CASE 4 — Acute Confusion / Delirium (UTI + Hyponatraemia)
  // ─────────────────────────────────────────────────────────────────
  {
    id: "bb_004",
    title: "The Confused Elder",
    specialty: "Medicine",
    difficulty: "medium",
    firstClue: { icon: "🧠", label: "Nursing note", value: '"Found on floor. Confused. Not her normal self." — No other details provided.' },
    redHerring: "misleading",

    panels: [
      { id: "age",      cost: 5,  icon: "👤", label: "Patient info",        key: true,  value: "Female, 84 years old. Lives alone. Normally independent. Brought in by neighbour." },
      { id: "symptoms", cost: 10, icon: "🗣️", label: "Collateral history",  key: true,  value: "3 days of confusion, not eating or drinking, 'going to the toilet more than usual'. No fever reported at home. No obvious fall injury." },
      { id: "vitals",   cost: 5,  icon: "📊", label: "Vitals",              key: true,  value: "HR 98, BP 100/62 (postural drop 20mmHg), Temp 37.9°C, RR 18, SpO2 97%. Dry mucous membranes. Reduced skin turgor." },
      { id: "urine",    cost: 10, icon: "🧪", label: "Urinalysis",          key: true,  value: "Dipstick: nitrites ++ , leucocytes +++, blood +. Cloudy, offensive odour. MSU sent." },
      { id: "bloods",   cost: 15, icon: "🔬", label: "FBC / U&E / CRP",    key: true,  value: "WCC 14.2 (elevated). CRP 88 (elevated). Na 126 (hyponatraemia). K 3.6. Cr 142 (AKI on CKD). Urea 14.2 (elevated). Glucose 5.4." },
      { id: "ct",       cost: 20, icon: "🖥️", label: "CT Head",             key: false, value: "No intracranial haemorrhage. No infarct. No midline shift. Generalised cortical atrophy consistent with age. — RED HERRING: CT is normal — this is not a stroke." },
      { id: "echo",     cost: 20, icon: "🫀", label: "Echocardiogram",      key: false, value: "Technically not indicated here. EF 60%, no wall motion abnormality. This was an unnecessary investigation." },
      { id: "culture",  cost: 15, icon: "🔭", label: "Blood cultures + MSU", key: false, value: "Blood cultures: pending. MSU: E. coli grown, sensitive to trimethoprim and nitrofurantoin." },
    ],

    diagnoses: [
      "Delirium secondary to UTI and Hyponatraemia",
      "Acute Ischaemic Stroke",
      "Dementia with Acute Behavioural Disturbance",
      "Subdural Haematoma",
    ],
    correctDiagnosis: "Delirium secondary to UTI and Hyponatraemia",

    minTokensToSolve: 30,
    idealPanels: ["age", "symptoms", "vitals", "urine", "bloods"],

    explanation: "Acute confusion in an elderly patient = DELIRIUM until proven otherwise. UTI + hyponatraemia + dehydration are the classic precipitants. CT head is a red herring — normal. Stroke unlikely given no focal neurology.",
    keyLearning: [
      "Delirium in the elderly is a medical emergency — always find and treat the cause",
      "UTI is the commonest cause of delirium in elderly women — always dip the urine",
      "Hyponatraemia (Na <130) itself causes confusion — correct slowly to avoid central pontine myelinolysis",
      "CT head in confusion: only if focal neurology, head injury, or first episode",
      "PINCH ME mnemonic: Pain, Infection, Nutrition, Constipation, Hydration, Medication, Environment",
    ],
    badges: {
      sherlock:  { threshold: 2, label: "Sherlock", icon: "🔍", desc: "Diagnosed with ≤2 unlocks" },
      efficient: { threshold: 4, label: "Efficient", icon: "⚡", desc: "Used only key panels" },
      thorough:  { threshold: 8, label: "Thorough",  icon: "📚", desc: "Unlocked everything" },
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // CASE 5 — Malaria (red herring: normal CXR)
  // ─────────────────────────────────────────────────────────────────
  {
    id: "bb_005",
    title: "The Fever",
    specialty: "Microbiology",
    difficulty: "hard",
    firstClue: { icon: "🌡️", label: "Temperature", value: "Temp 40.2°C. Rigors. HR 118 bpm." },
    redHerring: "misleading",

    panels: [
      { id: "age",      cost: 5,  icon: "👤", label: "Patient info",         key: false, value: "Male, 32 years old. University student." },
      { id: "history",  cost: 10, icon: "🗣️", label: "History",              key: true,  value: "Returned from Ghana 10 days ago. Fever started 5 days ago — cyclical pattern, peaks every 48 hours. Headache, myalgia, nausea. Did NOT take malaria prophylaxis." },
      { id: "vitals",   cost: 5,  icon: "📊", label: "Vitals",               key: false, value: "HR 118, BP 104/68, RR 20, Temp 40.2°C, SpO2 97%. Jaundiced. Splenomegaly on exam." },
      { id: "bloods",   cost: 15, icon: "🔬", label: "FBC / LFTs / U&E",    key: true,  value: "Hb 96 (low — haemolytic anaemia). WCC 3.8 (low — leucopaenia). Platelets 68 (low — thrombocytopaenia). Bilirubin 68 (elevated). LDH elevated. Cr normal." },
      { id: "film",     cost: 20, icon: "🔭", label: "Blood film",           key: true,  value: "THICK AND THIN BLOOD FILM: Ring-form trophozoites within red blood cells. >2% parasitaemia. Consistent with Plasmodium falciparum malaria." },
      { id: "cxr",      cost: 10, icon: "🩻", label: "Chest X-ray",          key: false, value: "Clear lung fields. No consolidation. — RED HERRING: CXR normal, this is NOT pneumonia causing the fever." },
      { id: "culture",  cost: 15, icon: "🧪", label: "Blood cultures",       key: false, value: "Blood cultures: no growth at 48h. — RED HERRING: not bacterial sepsis." },
      { id: "rdt",      cost: 15, icon: "💉", label: "Malaria RDT + PCR",    key: true,  value: "Rapid Diagnostic Test (RDT): POSITIVE for P. falciparum HRP2 antigen. PCR confirms P. falciparum. Artemisinin-based combination therapy (ACT) indicated." },
    ],

    diagnoses: [
      "Plasmodium falciparum Malaria",
      "Typhoid Fever",
      "Bacterial Sepsis",
      "Viral Haemorrhagic Fever",
    ],
    correctDiagnosis: "Plasmodium falciparum Malaria",

    minTokensToSolve: 25,
    idealPanels: ["history", "bloods", "film"],

    explanation: "Travel to sub-Saharan Africa + no prophylaxis + cyclical fever + haemolytic anaemia + thrombocytopaenia + splenomegaly = malaria until proven otherwise. P. falciparum is the most dangerous species. Blood film is gold standard.",
    keyLearning: [
      "Any fever within 3 months of travel to a malaria-endemic area = malaria until proven otherwise",
      "P. falciparum: most deadly, causes cerebral malaria, >2% parasitaemia = severe",
      "Thick + thin blood film is gold standard — RDT is rapid but less sensitive",
      "Triad: haemolytic anaemia + thrombocytopaenia + fever in returning traveller",
      "Treatment: artemisinin-based combination therapy (ACT) for uncomplicated; IV artesunate for severe",
    ],
    badges: {
      sherlock:  { threshold: 2, label: "Sherlock", icon: "🔍", desc: "Diagnosed with ≤2 unlocks" },
      efficient: { threshold: 3, label: "Efficient", icon: "⚡", desc: "Used only key panels" },
      thorough:  { threshold: 8, label: "Thorough",  icon: "📚", desc: "Unlocked everything" },
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // CASE 6 — Ectopic Pregnancy
  // ─────────────────────────────────────────────────────────────────
  {
    id: "bb_006",
    title: "The Abdo Pain",
    specialty: "Surgery/Obstetrics",
    difficulty: "hard",
    firstClue: { icon: "😣", label: "Triage note", value: "Severe right iliac fossa pain, 9/10. Gender: HIDDEN. Age: HIDDEN." },
    redHerring: "misleading",

    panels: [
      { id: "age",      cost: 5,  icon: "👤", label: "Patient info",          key: true,  value: "Female, 24 years old. Sexually active. LMP 7 weeks ago (usually regular)." },
      { id: "symptoms", cost: 10, icon: "🗣️", label: "Symptoms",              key: true,  value: "Sudden onset severe right iliac fossa pain. Associated vaginal spotting. Feeling dizzy and faint. One previous episode of PID 2 years ago." },
      { id: "vitals",   cost: 5,  icon: "📊", label: "Vitals",                key: true,  value: "HR 124 (tachycardic), BP 88/54 (hypotensive — shocked!), RR 22, Temp 36.9°C. Pale, diaphoretic, hands cold." },
      { id: "exam",     cost: 10, icon: "🤲", label: "Abdominal exam",        key: true,  value: "Rigid abdomen. Severe tenderness RIF + generalised guarding. Cervical excitation on bimanual exam. No bowel sounds. Signs of peritonism." },
      { id: "bHCG",     cost: 15, icon: "🧪", label: "βhCG",                  key: true,  value: "βhCG: 4,200 IU/L — POSITIVE. Patient is pregnant. Urine pregnancy test also positive." },
      { id: "usg",      cost: 20, icon: "🖥️", label: "Pelvic USS",            key: true,  value: "Empty uterus — no intrauterine pregnancy. Right adnexal mass 3.2cm with complex echogenicity. Free fluid in Pouch of Douglas — HAEMOPERITONEUM. Highly suspicious of right-sided ectopic pregnancy." },
      { id: "bloods",   cost: 15, icon: "🔬", label: "FBC / clotting / G&S",  key: true,  value: "Hb 82 (dropping — active bleeding). Platelets 188. INR 1.1. GROUP AND SAVE sent urgently — O-negative blood available." },
      { id: "appendix", cost: 20, icon: "🩻", label: "CT Abdomen",            key: false, value: "— RED HERRING: CT is NOT the right investigation here — USS and βhCG are sufficient. Delay for CT in an unstable patient is dangerous. Ectopic confirmed on USS." },
    ],

    diagnoses: [
      "Ruptured Ectopic Pregnancy",
      "Appendicitis",
      "Ovarian Torsion",
      "Pelvic Inflammatory Disease",
    ],
    correctDiagnosis: "Ruptured Ectopic Pregnancy",

    minTokensToSolve: 35,
    idealPanels: ["age", "symptoms", "vitals", "bHCG", "usg"],

    explanation: "Young woman + missed period + positive βhCG + empty uterus on USS + haemoperitoneum + haemodynamic instability = ruptured ectopic pregnancy. This is a surgical emergency. The CT scan is a red herring — it wastes time in an unstable patient.",
    keyLearning: [
      "Any woman of reproductive age with abdo pain: check βhCG — it's mandatory",
      "Ectopic triad: amenorrhoea + pelvic pain + vaginal bleeding",
      "Risk factors: PID, previous ectopic, IUD, tubal surgery",
      "Empty uterus + positive βhCG = ectopic until proven otherwise",
      "Haemodynamic instability → immediate surgical intervention (salpingectomy)",
      "CT in an unstable patient wastes critical time — don't do it",
    ],
    badges: {
      sherlock:  { threshold: 2, label: "Sherlock", icon: "🔍", desc: "Diagnosed with ≤2 unlocks" },
      efficient: { threshold: 4, label: "Efficient", icon: "⚡", desc: "Used only key panels" },
      thorough:  { threshold: 8, label: "Thorough",  icon: "📚", desc: "Unlocked everything" },
    },
  },
];

export function getRandomCase() {
  return BLACK_BOX_CASES[Math.floor(Math.random() * BLACK_BOX_CASES.length)];
}

export function shuffleCases() {
  const arr = [...BLACK_BOX_CASES];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}