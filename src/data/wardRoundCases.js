// src/data/wardRoundCases.js
// Each case has: presentation, vitals, history sections, exam sections,
// investigations, diagnosis options, management steps, and consequence messages.

export const WARD_CASES = [

  // ─────────────────────────────────────────────────────────────────
  // CASE 1 — Pulmonary Embolism
  // ─────────────────────────────────────────────────────────────────
  {
    id: "wc_001",
    specialty: "Medicine",
    difficulty: "medium",
    patient: {
      name: "Mr. Kofi Osei",
      age: 67,
      gender: "Male",
      ward: "Medical Ward, Bed 4",
      presenting: "Sudden onset shortness of breath and right-sided pleuritic chest pain since this morning",
      vitals: {
        HR: "112 bpm", BP: "104/70 mmHg", RR: "24/min",
        O2: "91% on air", Temp: "37.4°C", GCS: "15/15",
      },
      avatar: "👨‍🦳",
    },
    history: [
      {
        id: "hpc", label: "History of presenting complaint",
        icon: "🗣️",
        content: "Pain is sharp, worse on inspiration. Onset was sudden while resting. Denies cough, haemoptysis, or recent illness. Left leg has been swollen and tender for 3 days — noticed after a long-haul flight from London last week.",
      },
      {
        id: "pmhx", label: "Past medical history",
        icon: "📋",
        content: "Hypertension. Total hip replacement 6 weeks ago. No previous VTE. Non-smoker.",
      },
      {
        id: "dhx", label: "Drug history",
        icon: "💊",
        content: "Amlodipine 5mg OD. Aspirin 75mg OD post-op. No known drug allergies.",
      },
      {
        id: "shx", label: "Social history",
        icon: "🏠",
        content: "Retired teacher. Lives with wife. Independent. Non-smoker. Occasional alcohol.",
      },
      {
        id: "fhx", label: "Family history",
        icon: "👨‍👩‍👦",
        content: "Father had a DVT at age 70. No other relevant family history.",
      },
    ],
    examination: [
      {
        id: "resp", label: "Respiratory exam",
        icon: "🫁",
        content: "Reduced air entry right base. Pleural rub heard right lower zone. Trachea central. No dullness to percussion.",
      },
      {
        id: "cvs", label: "Cardiovascular exam",
        icon: "🫀",
        content: "Tachycardic, regular rhythm. Loud P2. JVP raised 4cm. No peripheral oedema. Left calf — normal.",
      },
      {
        id: "legs", label: "Lower limb exam",
        icon: "🦵",
        content: "Right calf: warm, tender, erythematous, swollen compared to left. Homan's sign positive (unreliable but noted). Right leg circumference 4cm greater than left.",
      },
      {
        id: "abdo", label: "Abdominal exam",
        icon: "🤲",
        content: "Soft, non-tender, no organomegaly. Well-healed right hip replacement scar.",
      },
    ],
    investigations: [
      {
        id: "ecg", label: "ECG",
        icon: "📈", keyInvestigation: true,
        result: "Sinus tachycardia. S1Q3T3 pattern. Right axis deviation. T-wave inversions V1-V4.",
      },
      {
        id: "cxr", label: "Chest X-ray",
        icon: "🩻", keyInvestigation: true,
        result: "Wedge-shaped opacity right lower zone (Hampton's hump). Oligaemia right lower lobe (Westermark sign). No pneumothorax.",
      },
      {
        id: "bloods", label: "FBC, U&E, CRP, Clotting",
        icon: "🩸",
        result: "FBC: Hb 131, WCC 11.2, Plt 290. U&E: Na 138, K 4.1, Cr 94. CRP 78. PT/APTT normal.",
      },
      {
        id: "ddimer", label: "D-dimer",
        icon: "🔬", keyInvestigation: true,
        result: "D-dimer: 4,820 ng/mL (markedly elevated, normal <500). Strongly supports thrombotic process.",
      },
      {
        id: "ctpa", label: "CT Pulmonary Angiogram",
        icon: "🖥️", keyInvestigation: true,
        result: "Large filling defect in right main pulmonary artery extending into right lower lobe branches. Consistent with massive PE. No evidence of aortic dissection.",
      },
      {
        id: "abg", label: "Arterial Blood Gas",
        icon: "💨",
        result: "pH 7.47, pO2 7.8 kPa, pCO2 3.4 kPa, HCO3 22. Type 1 respiratory failure. Respiratory alkalosis.",
      },
    ],
    diagnosis: {
      correct: "Pulmonary Embolism",
      options: ["Pulmonary Embolism", "Pneumonia", "Aortic Dissection", "Spontaneous Pneumothorax"],
      explanation: "Classic presentation: post-op immobility + long-haul flight (risk factors), acute pleuritic chest pain + DVT symptoms, S1Q3T3 on ECG, Hampton's hump on CXR, elevated D-dimer, and confirmed on CTPA.",
    },
    management: [
      {
        id: "mg1",
        step: "Immediate anticoagulation",
        options: [
          { text: "Low molecular weight heparin (LMWH) — e.g. enoxaparin 1.5mg/kg SC", correct: true, consequence: null },
          { text: "Aspirin 300mg and observe", correct: false, consequence: "Aspirin has no role in PE management. The clot is not lysing — patient's O2 drops to 87% and HR rises to 130. Patient deteriorating." },
          { text: "Warfarin 10mg loading dose alone", correct: false, consequence: "Warfarin alone is inappropriate for acute PE — it takes days to work. Patient's right heart strain worsens. BP drops to 90/60." },
        ],
        xp: 15,
        explanation: "LMWH is first-line for haemodynamically stable PE. Alternatives include unfractionated heparin (UFH) IV for massive PE or if thrombolysis planned.",
      },
      {
        id: "mg2",
        step: "Oxygen therapy",
        options: [
          { text: "High-flow O2 15L via non-rebreather mask", correct: true, consequence: null },
          { text: "No oxygen — SpO2 is only mildly low", correct: false, consequence: "SpO2 falls further to 86%. Patient becomes increasingly distressed and confused. Urgent escalation needed." },
          { text: "Intubate immediately", correct: false, consequence: "Intubation is not yet indicated — patient is conscious and protecting airway. Premature intubation causes cardiovascular collapse in PE. Anaesthetist called urgently." },
        ],
        xp: 10,
        explanation: "Target SpO2 >94% in PE. High-flow O2 while initiating anticoagulation is appropriate. Intubation only if failing to maintain airway.",
      },
      {
        id: "mg3",
        step: "Escalation decision",
        options: [
          { text: "Refer to haematology + discuss thrombolysis given haemodynamic compromise", correct: true, consequence: null },
          { text: "Discharge with oral anticoagulants and outpatient follow-up", correct: false, consequence: "Discharging a haemodynamically compromised PE is dangerous. Patient collapses in the car park. Emergency readmission." },
          { text: "Urgent cardiothoracic surgical embolectomy without medical management", correct: false, consequence: "Surgery without attempting medical management first is inappropriate at this stage. Surgeon declines." },
        ],
        xp: 15,
        explanation: "Massive PE with haemodynamic instability warrants consideration of thrombolysis (alteplase) or catheter-directed therapy. Always discuss with senior and haematology.",
      },
    ],
    debrief: {
      diagnosis: "Pulmonary Embolism (massive)",
      keyLearning: [
        "Virchow's triad: stasis (post-op + long flight), endothelial injury (surgery), hypercoagulability",
        "S1Q3T3 is classic but only present in ~20% of PE cases — don't rely on it alone",
        "D-dimer is sensitive but not specific — use Wells score to decide if you even need it",
        "CTPA is gold standard investigation for PE",
        "LMWH is first-line; consider thrombolysis for massive PE with cardiovascular compromise",
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // CASE 2 — STEMI
  // ─────────────────────────────────────────────────────────────────
  {
    id: "wc_002",
    specialty: "Medicine",
    difficulty: "medium",
    patient: {
      name: "Mrs. Amina Kamau",
      age: 54,
      gender: "Female",
      ward: "A&E Resus, Bay 2",
      presenting: "Central crushing chest pain radiating to left arm, onset 45 minutes ago",
      vitals: {
        HR: "98 bpm", BP: "148/90 mmHg", RR: "18/min",
        O2: "96% on air", Temp: "36.8°C", GCS: "15/15",
      },
      avatar: "👩",
    },
    history: [
      {
        id: "hpc", label: "History of presenting complaint",
        icon: "🗣️",
        content: "Sudden onset central chest pain, 9/10 severity, crushing in character, radiating to left arm and jaw. Associated with sweating, nausea and vomiting. No pleuritic component. No relief with sitting forward.",
      },
      {
        id: "pmhx", label: "Past medical history",
        icon: "📋",
        content: "Type 2 diabetes (10 years). Hypertension. Hypercholesterolaemia. Smoker — 20 pack-year history.",
      },
      {
        id: "dhx", label: "Drug history",
        icon: "💊",
        content: "Metformin 1g BD. Amlodipine 10mg OD. Atorvastatin 40mg ON. NKDA.",
      },
      {
        id: "shx", label: "Social history",
        icon: "🏠",
        content: "Works as a nurse. Smoker 15 cigarettes/day. Occasional alcohol. Lives with husband.",
      },
      {
        id: "fhx", label: "Family history",
        icon: "👨‍👩‍👦",
        content: "Father died of MI age 58. Brother had CABG at 60.",
      },
    ],
    examination: [
      {
        id: "cvs", label: "Cardiovascular exam",
        icon: "🫀",
        content: "Pale and diaphoretic. HR 98 regular. BP 148/90 both arms equal. HS I+II+0. No murmurs. Mild JVP elevation 3cm. No peripheral oedema.",
      },
      {
        id: "resp", label: "Respiratory exam",
        icon: "🫁",
        content: "Fine bibasal crackles. No wheeze. RR 18. SpO2 96% on air.",
      },
      {
        id: "abdo", label: "Abdominal exam",
        icon: "🤲",
        content: "Soft, non-tender. No pulsatile mass. No hepatomegaly.",
      },
      {
        id: "neuro", label: "Neurological exam",
        icon: "🧠",
        content: "Alert and orientated. No focal neurological deficit. GCS 15/15.",
      },
    ],
    investigations: [
      {
        id: "ecg", label: "ECG",
        icon: "📈", keyInvestigation: true,
        result: "ST elevation >2mm in leads II, III, aVF. Reciprocal ST depression in I, aVL. Q waves forming in III. Rate 98. Sinus rhythm. Consistent with inferior STEMI.",
      },
      {
        id: "troponin", label: "Troponin I (high-sensitivity)",
        icon: "🔬", keyInvestigation: true,
        result: "Troponin I: 2,840 ng/L (markedly elevated, normal <52). Repeat in 3 hours requested.",
      },
      {
        id: "bloods", label: "FBC, U&E, LFTs, Glucose, Clotting",
        icon: "🩸",
        result: "FBC normal. Na 138, K 4.0, Cr 88, eGFR 76. Glucose 12.4 (elevated). LFTs normal. Clotting normal. Cholesterol 6.8.",
      },
      {
        id: "cxr", label: "Chest X-ray",
        icon: "🩻",
        result: "Cardiomegaly. Upper lobe venous diversion. No pneumothorax. Subtle perihilar haziness — early pulmonary oedema.",
      },
      {
        id: "echo", label: "Bedside echocardiogram",
        icon: "🖥️",
        result: "Regional wall motion abnormality — inferior wall hypokinesis. EF estimated 45%. No pericardial effusion.",
      },
    ],
    diagnosis: {
      correct: "ST-Elevation Myocardial Infarction (Inferior STEMI)",
      options: [
        "ST-Elevation Myocardial Infarction (Inferior STEMI)",
        "Unstable Angina",
        "Aortic Dissection",
        "Pericarditis",
      ],
      explanation: "Inferior STEMI: ST elevation in II, III, aVF with reciprocal changes in I/aVL, markedly elevated troponin, classic risk factors, and wall motion abnormality on echo. Aortic dissection excluded by equal BP both arms.",
    },
    management: [
      {
        id: "mg1",
        step: "Immediate pharmacological treatment (MONA + dual antiplatelet)",
        options: [
          { text: "Aspirin 300mg + Ticagrelor 180mg + IV morphine + GTN (if BP allows)", correct: true, consequence: null },
          { text: "Aspirin alone and wait for cardiology review", correct: false, consequence: "Delayed dual antiplatelet therapy significantly increases infarct size. Door-to-balloon time extended unnecessarily. ST elevation worsens." },
          { text: "Thrombolysis (alteplase) immediately", correct: false, consequence: "Thrombolysis is second-line where PCI is available within 120 minutes. Using it here delays PCI and increases bleeding risk without benefit." },
        ],
        xp: 15,
        explanation: "Dual antiplatelet (aspirin + P2Y12 inhibitor) is essential pre-PCI. Morphine for pain, GTN if BP >90 systolic. Avoid GTN in inferior STEMI if suspecting RV involvement.",
      },
      {
        id: "mg2",
        step: "Reperfusion strategy",
        options: [
          { text: "Activate primary PCI pathway — call catheter lab, target door-to-balloon <90 mins", correct: true, consequence: null },
          { text: "Medical management only, no reperfusion needed", correct: false, consequence: "Without reperfusion the infarct extends. EF drops to 30%. Patient develops cardiogenic shock — BP 78/50, confused." },
          { text: "Refer to cardiothoracic surgery for emergency CABG", correct: false, consequence: "Emergency CABG is not first-line for STEMI. PCI is faster and equally effective. Precious time is lost." },
        ],
        xp: 20,
        explanation: "Primary PCI is gold standard for STEMI if available within 120 mins. Door-to-balloon <90 mins is the target. Thrombolysis if PCI not available in time.",
      },
      {
        id: "mg3",
        step: "Adjunct therapy post-PCI",
        options: [
          { text: "Beta-blocker + ACE inhibitor + statin + continue dual antiplatelet x12 months", correct: true, consequence: null },
          { text: "Stop all medications and reassess in 1 week", correct: false, consequence: "Secondary prevention is critical post-MI. Without it, 30-day mortality doubles. Patient re-presents with reinfarction 2 weeks later." },
          { text: "Anticoagulate with warfarin long-term instead of dual antiplatelet", correct: false, consequence: "Warfarin does not replace dual antiplatelet post-PCI with stent insertion. Stent thrombosis risk increases significantly." },
        ],
        xp: 15,
        explanation: "Post-MI secondary prevention: beta-blocker (reduces remodelling), ACE-I (reduces mortality), statin (plaque stabilisation), dual antiplatelet x12 months (prevents stent thrombosis).",
      },
    ],
    debrief: {
      diagnosis: "Inferior STEMI — RCA territory",
      keyLearning: [
        "Inferior STEMI: ST elevation in II, III, aVF — usually RCA occlusion",
        "Always check right-sided leads (V4R) in inferior STEMI to exclude RV infarction",
        "RV infarction: avoid nitrates and diuretics — preload dependent",
        "Primary PCI > thrombolysis if available within 120 minutes",
        "MONA: Morphine, Oxygen (if SpO2 <94%), Nitrates, Aspirin",
        "Dual antiplatelet for minimum 12 months post-PCI with drug-eluting stent",
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // CASE 3 — Meningitis (Paeds)
  // ─────────────────────────────────────────────────────────────────
  {
    id: "wc_003",
    specialty: "Paediatrics",
    difficulty: "hard",
    patient: {
      name: "Aisha Mensah",
      age: 8,
      gender: "Female",
      ward: "Paediatric A&E",
      presenting: "Fever, severe headache, neck stiffness and vomiting for 12 hours. Non-blanching rash noted by mother.",
      vitals: {
        HR: "134 bpm", BP: "88/54 mmHg", RR: "28/min",
        O2: "97% on air", Temp: "39.8°C", GCS: "13/15 (E3V4M6)",
      },
      avatar: "👧",
    },
    history: [
      {
        id: "hpc", label: "History of presenting complaint",
        icon: "🗣️",
        content: "Gradual onset headache worsening over 12 hours. Photophobia and phonophobia. Three episodes of vomiting. Mother noticed a rash on trunk and legs that does not disappear with glass tumbler pressed against it. Was at school yesterday, appeared well.",
      },
      {
        id: "pmhx", label: "Past medical history",
        icon: "📋",
        content: "No significant past medical history. Up to date with immunisations including MenB and MenACWY.",
      },
      {
        id: "dhx", label: "Drug history",
        icon: "💊",
        content: "No regular medications. Paracetamol given at home 4 hours ago. NKDA.",
      },
      {
        id: "shx", label: "Social history",
        icon: "🏠",
        content: "Lives with parents and younger sibling. Attends primary school. No recent travel. No known sick contacts — though classmate was unwell last week.",
      },
      {
        id: "fhx", label: "Family history",
        icon: "👨‍👩‍👦",
        content: "No family history of meningitis or immune deficiency.",
      },
    ],
    examination: [
      {
        id: "neuro", label: "Neurological exam",
        icon: "🧠",
        content: "GCS 13/15 — confused, opens eyes to voice. Kernig's sign positive. Brudzinski's sign positive. Neck stiffness +++. Photophobia. Pupils equal and reactive 4mm bilaterally. No papilloedema on fundoscopy.",
      },
      {
        id: "skin", label: "Skin exam",
        icon: "🔍",
        content: "Non-blanching petechial and purpuric rash over trunk, lower limbs and buttocks. Some lesions are stellate (star-shaped). No mucous membrane involvement.",
      },
      {
        id: "cvs", label: "Cardiovascular exam",
        icon: "🫀",
        content: "Tachycardic 134. BP 88/54 — hypotensive. Capillary refill time 4 seconds centrally. Peripherally cool and mottled. Signs of septic shock.",
      },
      {
        id: "resp", label: "Respiratory exam",
        icon: "🫁",
        content: "Tachypnoeic 28/min. Clear lung fields bilaterally. No added sounds.",
      },
    ],
    investigations: [
      {
        id: "bloods", label: "FBC, U&E, CRP, Blood cultures, Clotting",
        icon: "🩸", keyInvestigation: true,
        result: "WCC 22.4 (neutrophilia). CRP 318. Lactate 4.2 (elevated). Platelets 68 (low — DIC concern). PT prolonged. Blood cultures taken x2 before antibiotics.",
      },
      {
        id: "lp", label: "Lumbar Puncture",
        icon: "🔬", keyInvestigation: true,
        result: "CONTRAINDICATED at this stage — GCS <15, signs of raised ICP, haemodynamic instability. Do not delay antibiotics for LP. LP can be performed later when stabilised.",
      },
      {
        id: "ct", label: "CT Head",
        icon: "🖥️",
        result: "No space-occupying lesion. No midline shift. No hydrocephalus. Normal for age.",
      },
      {
        id: "pcr", label: "Meningococcal PCR (throat swab + blood)",
        icon: "🧬", keyInvestigation: true,
        result: "Neisseria meningitidis serogroup B detected on blood PCR. Confirms meningococcal septicaemia.",
      },
    ],
    diagnosis: {
      correct: "Bacterial Meningitis with Meningococcal Septicaemia",
      options: [
        "Bacterial Meningitis with Meningococcal Septicaemia",
        "Viral Meningitis",
        "Idiopathic Thrombocytopaenic Purpura (ITP)",
        "Henoch-Schönlein Purpura",
      ],
      explanation: "Non-blanching rash + meningism + septic shock = meningococcal disease until proven otherwise. ITP and HSP cause rashes but without fever and meningism. Viral meningitis does not cause non-blanching purpura or septic shock.",
    },
    management: [
      {
        id: "mg1",
        step: "Immediate antibiotic therapy",
        options: [
          { text: "IV Ceftriaxone 80mg/kg immediately — do NOT wait for LP or CT", correct: true, consequence: null },
          { text: "Wait for LP result before starting antibiotics", correct: false, consequence: "Every hour of delay in meningococcal disease increases mortality by 10%. Patient deteriorates rapidly — GCS drops to 8, BP 70/40. Paediatric ITU emergency call." },
          { text: "Oral amoxicillin and observe for 24 hours", correct: false, consequence: "Oral antibiotics have no role in meningococcal septicaemia. Patient deteriorates into septic shock with multi-organ failure." },
        ],
        xp: 20,
        explanation: "Ceftriaxone is first-line for bacterial meningitis in the UK. DO NOT delay for investigations — time to antibiotics is the most critical factor in outcome. Give within 1 hour of presentation.",
      },
      {
        id: "mg2",
        step: "Fluid resuscitation for septic shock",
        options: [
          { text: "IV 0.9% NaCl 20ml/kg bolus — reassess after, repeat if needed, target MAP >65", correct: true, consequence: null },
          { text: "Restrict fluids to avoid cerebral oedema", correct: false, consequence: "Fluid restriction in septic shock causes inadequate tissue perfusion. Lactate rises to 7.8. Renal failure developing." },
          { text: "Start vasopressors (noradrenaline) before fluid resuscitation", correct: false, consequence: "Vasopressors before adequate fluid resuscitation cause vasoconstriction on an empty tank. Cardiac output drops further." },
        ],
        xp: 15,
        explanation: "Septic shock management follows the Surviving Sepsis bundle: early fluids, antibiotics, lactate monitoring, blood cultures. In children, 20ml/kg boluses — reassess after each.",
      },
      {
        id: "mg3",
        step: "Adjunct therapy and escalation",
        options: [
          { text: "IV Dexamethasone + PICU referral + notify public health + prophylaxis for close contacts", correct: true, consequence: null },
          { text: "No steroids — evidence doesn't support it", correct: false, consequence: "Dexamethasone reduces neurological sequelae in bacterial meningitis (evidence strongest for pneumococcal). Omitting it increases risk of deafness and cognitive impairment." },
          { text: "Discharge home once antibiotics started — no need for PICU", correct: false, consequence: "This child has septic shock and DIC. Discharging her is dangerous. Severity is being critically underestimated." },
        ],
        xp: 15,
        explanation: "Dexamethasone 0.15mg/kg QDS x4 days reduces neurological complications. PICU for haemodynamic support. Public health notification mandatory — contacts need ciprofloxacin prophylaxis.",
      },
    ],
    debrief: {
      diagnosis: "Meningococcal disease — meningitis + septicaemia",
      keyLearning: [
        "Non-blanching rash = meningococcal disease until proven otherwise — this is a medical emergency",
        "Never delay antibiotics for investigations — 'treat then investigate'",
        "Ceftriaxone 80mg/kg IV is first-line in children",
        "LP is contraindicated if: GCS <15, focal neurology, papilloedema, haemodynamic instability",
        "Dexamethasone reduces deafness and neurological complications",
        "Public health notification required — rifampicin/ciprofloxacin for household contacts",
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // CASE 4 — Pre-eclampsia
  // ─────────────────────────────────────────────────────────────────
  {
    id: "wc_004",
    specialty: "Obstetrics",
    difficulty: "hard",
    patient: {
      name: "Grace Asante",
      age: 28,
      gender: "Female",
      ward: "Obstetric Assessment Unit",
      presenting: "32 weeks pregnant, severe epigastric pain, headache and visual disturbance",
      vitals: {
        HR: "92 bpm", BP: "168/110 mmHg", RR: "16/min",
        O2: "98% on air", Temp: "36.9°C", GCS: "15/15",
      },
      avatar: "🤰",
    },
    history: [
      {
        id: "hpc", label: "History of presenting complaint",
        icon: "🗣️",
        content: "Severe epigastric pain — described as 'under the ribs', right-sided, constant. Associated frontal headache 8/10. Seeing flashing lights (scotomata) since this morning. Noted significant ankle swelling over past 2 weeks. No vaginal bleeding. Fetal movements reduced today.",
      },
      {
        id: "pmhx", label: "Past medical history",
        icon: "📋",
        content: "G1P0 — first pregnancy. Nulliparous. No previous hypertension. No diabetes. Normal booking bloods and 20-week anomaly scan.",
      },
      {
        id: "dhx", label: "Drug history",
        icon: "💊",
        content: "Folic acid 400mcg OD. Iron supplements. No antihypertensives. NKDA.",
      },
      {
        id: "shx", label: "Social history",
        icon: "🏠",
        content: "Works as a teacher. Lives with partner. Non-smoker. No alcohol during pregnancy.",
      },
      {
        id: "fhx", label: "Family history",
        icon: "👨‍👩‍👦",
        content: "Mother had pre-eclampsia with her first pregnancy. Sister had gestational hypertension.",
      },
    ],
    examination: [
      {
        id: "abdo", label: "Abdominal exam + fetal assessment",
        icon: "🤲",
        content: "Uterus 32-week size. Tender in right upper quadrant and epigastrium. Fetal heart rate 148 — reassuring. CTG: reduced variability, late decelerations noted — non-reassuring. Fetal movements reduced.",
      },
      {
        id: "neuro", label: "Neurological exam",
        icon: "🧠",
        content: "Brisk reflexes +++ bilaterally. Clonus: 3 beats left ankle. No focal neurological deficit. Reporting visual scotomata. GCS 15.",
      },
      {
        id: "cvs", label: "Cardiovascular exam",
        icon: "🫀",
        content: "BP 168/110 (repeated x2, 5 mins apart — both elevated). HR 92 regular. Significant pitting oedema ankles to knees. JVP not elevated.",
      },
      {
        id: "urine", label: "Urinalysis",
        icon: "🔍",
        content: "Dipstick: protein +++ (3+). No blood. No nitrites. Protein:creatinine ratio sent — result 78mg/mmol (significant proteinuria, >30 diagnostic of pre-eclampsia).",
      },
    ],
    investigations: [
      {
        id: "bloods", label: "FBC, U&E, LFTs, Clotting, Uric acid",
        icon: "🩸", keyInvestigation: true,
        result: "Platelets 88 (low). ALT 320 (raised). AST 410 (raised). Bilirubin 42 (raised). LDH elevated. Hb 110. Cr 124 (raised for pregnancy). Uric acid elevated. Clotting: PT 16, APTT 44 — borderline.",
      },
      {
        id: "urine24", label: "24-hour urine protein",
        icon: "🧪",
        result: "24-hour urine protein: 4.2g (>0.3g diagnostic of pre-eclampsia — this is severe).",
      },
      {
        id: "ctg", label: "Continuous CTG",
        icon: "📈", keyInvestigation: true,
        result: "Non-reassuring CTG: reduced baseline variability <5 bpm, late decelerations with contractions. Suggests fetal compromise. Urgent obstetric review needed.",
      },
      {
        id: "usgrowth", label: "Urgent USS — fetal growth + Dopplers",
        icon: "🖥️", keyInvestigation: true,
        result: "Fetal weight on 5th centile (growth restricted). Umbilical artery Dopplers: absent end-diastolic flow — significant fetal compromise. Delivery should be considered.",
      },
    ],
    diagnosis: {
      correct: "Severe Pre-eclampsia with HELLP syndrome",
      options: [
        "Severe Pre-eclampsia with HELLP syndrome",
        "Gestational Hypertension",
        "Acute Fatty Liver of Pregnancy",
        "Obstetric Cholestasis",
      ],
      explanation: "HELLP = Haemolysis (elevated LDH/bilirubin), Elevated Liver enzymes (ALT/AST), Low Platelets. Combined with severe hypertension >160/110, proteinuria, symptoms (headache, visual disturbance, epigastric pain) = severe pre-eclampsia + HELLP.",
    },
    management: [
      {
        id: "mg1",
        step: "Antihypertensive therapy for severe hypertension",
        options: [
          { text: "IV Labetalol (or oral nifedipine) — target BP <150/100", correct: true, consequence: null },
          { text: "Observe and recheck BP in 4 hours", correct: false, consequence: "BP 168/110 is a hypertensive emergency in pregnancy. Delay risks maternal stroke. Patient develops thunderclap headache — intracerebral haemorrhage." },
          { text: "ACE inhibitor (ramipril) immediately", correct: false, consequence: "ACE inhibitors are absolutely contraindicated in pregnancy — they cause fetal renal agenesis and oligohydramnios. Teratogenic." },
        ],
        xp: 15,
        explanation: "Severe hypertension in pregnancy (≥160/110) needs urgent treatment. Labetalol IV or oral nifedipine are first-line. ACE inhibitors and ARBs are teratogenic — absolutely contraindicated.",
      },
      {
        id: "mg2",
        step: "Seizure prophylaxis",
        options: [
          { text: "IV Magnesium sulphate loading dose 4g over 5-10 minutes, then infusion", correct: true, consequence: null },
          { text: "No seizure prophylaxis needed unless seizure occurs", correct: false, consequence: "With clonus and brisk reflexes, eclampsia risk is high. Patient has a tonic-clonic seizure. Magnesium should have been given." },
          { text: "Oral phenytoin for seizure prevention", correct: false, consequence: "Phenytoin is NOT recommended for eclampsia prevention or treatment in the UK. Magnesium sulphate is the evidence-based choice." },
        ],
        xp: 20,
        explanation: "Magnesium sulphate reduces eclampsia risk by 50% in severe pre-eclampsia. Signs warranting prophylaxis: clonus, brisk reflexes, severe headache, visual disturbance. Monitor for toxicity — loss of patellar reflexes precedes respiratory depression.",
      },
      {
        id: "mg3",
        step: "Definitive management",
        options: [
          { text: "Steroids for fetal lung maturity + urgent multidisciplinary team decision re: timing of delivery", correct: true, consequence: null },
          { text: "Continue pregnancy and aim for 37 weeks with close monitoring", correct: false, consequence: "With HELLP, severe disease and compromised fetus, continuing pregnancy puts both mother and baby at risk. Maternal coagulopathy worsens — DIC developing." },
          { text: "Immediate emergency C-section without steroids", correct: false, consequence: "At 32 weeks, steroids (betamethasone) should be given before delivery to mature fetal lungs, unless immediate delivery is unavoidable. Without them, neonatal respiratory distress syndrome is highly likely." },
        ],
        xp: 15,
        explanation: "Betamethasone 12mg IM x2 doses (24h apart) promotes fetal lung maturity at <34 weeks. Definitive treatment of pre-eclampsia/HELLP is delivery. Decision on timing requires MDT (obstetrician, neonatologist, anaesthetist).",
      },
    ],
    debrief: {
      diagnosis: "Severe Pre-eclampsia + HELLP syndrome at 32 weeks",
      keyLearning: [
        "HELLP: Haemolysis + Elevated Liver enzymes + Low Platelets — life-threatening",
        "Severe pre-eclampsia: BP ≥160/110 + proteinuria + symptoms",
        "ACE inhibitors are teratogenic — NEVER in pregnancy",
        "Magnesium sulphate is the only evidence-based treatment for eclampsia prevention/treatment",
        "Definitive treatment is delivery — timing depends on severity and gestation",
        "Steroids (betamethasone) for fetal lung maturity at <34 weeks before delivery",
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // CASE 5 — Post-op Complication (Anastomotic Leak)
  // ─────────────────────────────────────────────────────────────────
  {
    id: "wc_005",
    specialty: "Surgery",
    difficulty: "hard",
    patient: {
      name: "Mr. Raj Patel",
      age: 45,
      gender: "Male",
      ward: "Surgical Ward, Bed 9",
      presenting: "Post-op day 2 following anterior resection for colorectal cancer. Increasing abdominal pain, fever and tachycardia",
      vitals: {
        HR: "118 bpm", BP: "96/60 mmHg", RR: "22/min",
        O2: "95% on air", Temp: "38.9°C", GCS: "15/15",
      },
      avatar: "👨",
    },
    history: [
      {
        id: "hpc", label: "History of presenting complaint",
        icon: "🗣️",
        content: "Underwent laparoscopic anterior resection 2 days ago for T3N1 sigmoid adenocarcinoma. Yesterday appeared to be recovering well. Today: severe generalised abdominal pain (worse than expected post-op), fever, rigors, and feeling extremely unwell. Drain output has become turbid/faeculent.",
      },
      {
        id: "pmhx", label: "Past medical history",
        icon: "📋",
        content: "Colorectal carcinoma (diagnosed 3 months ago). Hypertension. No previous abdominal surgery. Non-smoker. No diabetes.",
      },
      {
        id: "dhx", label: "Drug history",
        icon: "💊",
        content: "Ramipril 5mg OD (held peri-operatively). Post-op: Paracetamol, Tramadol, LMWH (enoxaparin), PPI. Cefuroxime and metronidazole given peri-operatively.",
      },
      {
        id: "shx", label: "Social history",
        icon: "🏠",
        content: "Software engineer. Married with two children. Non-smoker. Moderate alcohol (15 units/week pre-diagnosis, now abstinent).",
      },
      {
        id: "fhx", label: "Family history",
        icon: "👨‍👩‍👦",
        content: "Father had colon cancer at 62. No other relevant history.",
      },
    ],
    examination: [
      {
        id: "abdo", label: "Abdominal exam",
        icon: "🤲",
        content: "Generalised abdominal tenderness — worse in lower abdomen. Guarding and rigidity present (peritonism). Bowel sounds absent. Surgical drain: turbid, brown, faeculent fluid. Wound: intact, no dehiscence.",
      },
      {
        id: "cvs", label: "Cardiovascular exam",
        icon: "🫀",
        content: "Tachycardia 118. BP 96/60 — hypotensive. Cool peripheries. CRT 3.5 seconds. JVP flat. Signs of distributive shock.",
      },
      {
        id: "resp", label: "Respiratory exam",
        icon: "🫁",
        content: "Tachypnoeic 22/min. Shallow breathing (splinting due to pain). Clear lung fields. SpO2 95% on air.",
      },
      {
        id: "neuro", label: "General assessment",
        icon: "🧠",
        content: "Alert but distressed and pale. GCS 15. Appears significantly more unwell than expected for post-op day 2. Rigors noted.",
      },
    ],
    investigations: [
      {
        id: "bloods", label: "FBC, U&E, CRP, LFTs, Lactate, Blood cultures",
        icon: "🩸", keyInvestigation: true,
        result: "WCC 22.8 (neutrophilia). CRP 412. Lactate 3.8 (elevated). Cr 168 (AKI — baseline 82). Na 132. K 5.2. LFTs mildly deranged. Blood cultures x2 taken.",
      },
      {
        id: "ctabdo", label: "CT Abdomen + Pelvis with contrast",
        icon: "🖥️", keyInvestigation: true,
        result: "Free air and fluid in the pelvis and paracolic gutters. Defect at anastomotic site with extraluminal contrast leak. Consistent with anastomotic dehiscence. No distant collections identified.",
      },
      {
        id: "cxr", label: "Erect Chest X-ray",
        icon: "🩻",
        result: "Free subdiaphragmatic air bilaterally — consistent with bowel perforation/anastomotic leak. No pneumothorax. No consolidation.",
      },
      {
        id: "vbg", label: "Venous Blood Gas",
        icon: "💨",
        result: "pH 7.32, BE -6, Lactate 3.8, HCO3 18. Metabolic acidosis — septic shock physiology.",
      },
    ],
    diagnosis: {
      correct: "Anastomotic Leak with Faecal Peritonitis",
      options: [
        "Anastomotic Leak with Faecal Peritonitis",
        "Post-operative Ileus",
        "Surgical Site Infection",
        "Pulmonary Embolism",
      ],
      explanation: "Faeculent drain output + peritonism + free air on CXR + contrast leak on CT = anastomotic leak until proven otherwise. Post-op ileus doesn't cause peritonism or fever. PE wouldn't cause abdominal signs.",
    },
    management: [
      {
        id: "mg1",
        step: "Immediate resuscitation (Sepsis 6)",
        options: [
          { text: "Sepsis 6: high-flow O2, IV access x2, blood cultures, IV broad-spectrum antibiotics, IV fluids, urine output monitoring", correct: true, consequence: null },
          { text: "Increase analgesia and observe — may be expected post-op pain", correct: false, consequence: "This is septic shock, not expected post-op pain. Delaying treatment allows sepsis to worsen — lactate rises to 6.2, urine output stops — anuric AKI." },
          { text: "Oral antibiotics and encourage oral fluids", correct: false, consequence: "Oral medications are inappropriate in someone with peritonitis and septic shock. Inadequate treatment — multi-organ failure developing." },
        ],
        xp: 15,
        explanation: "Sepsis 6 within 1 hour: Give O2, take blood cultures, give IV antibiotics, give IV fluids, check lactate, monitor urine output. Anastomotic leak is a surgical emergency.",
      },
      {
        id: "mg2",
        step: "Antibiotic therapy",
        options: [
          { text: "IV Piperacillin-tazobactam + metronidazole (broad spectrum covering gut organisms + anaerobes)", correct: true, consequence: null },
          { text: "Continue peri-operative cefuroxime dose only", correct: false, consequence: "Cefuroxime alone is inadequate for faecal peritonitis. Anaerobic coverage is essential. Inadequate antibiotics — patient deteriorates, blood cultures grow mixed bowel flora." },
          { text: "No antibiotics until sensitivity results available", correct: false, consequence: "Waiting for sensitivities in septic shock is dangerous. Empirical broad-spectrum antibiotics are mandatory and should not be delayed." },
        ],
        xp: 15,
        explanation: "Faecal peritonitis requires broad-spectrum cover for aerobic gram-negatives, gram-positives, and anaerobes. Pip-tazo + metronidazole or meropenem are appropriate. Modify when sensitivities available.",
      },
      {
        id: "mg3",
        step: "Definitive surgical management",
        options: [
          { text: "Emergency return to theatre — likely Hartmann's procedure (resect anastomosis, end colostomy)", correct: true, consequence: null },
          { text: "CT-guided drain insertion and conservative management", correct: false, consequence: "CT drainage is suitable for small pelvic collections but not for frank faecal peritonitis with haemodynamic compromise. Source control requires surgery." },
          { text: "Parenteral nutrition and NPO for 2 weeks to allow anastomosis to heal", correct: false, consequence: "A leaking anastomosis with faecal contamination will not heal conservatively. Patient develops multi-organ failure — ICU admission required." },
        ],
        xp: 20,
        explanation: "Frank anastomotic leak with peritonitis requires emergency laparotomy. Hartmann's procedure: resect the anastomosis, bring out an end colostomy, oversew the rectal stump. Mortality 15-30% — early surgery is key.",
      },
    ],
    debrief: {
      diagnosis: "Anastomotic leak — faecal peritonitis — septic shock",
      keyLearning: [
        "Faeculent drain fluid after colorectal surgery = anastomotic leak until proven otherwise",
        "Free subdiaphragmatic air on erect CXR = bowel perforation (or post-op residual air <72h)",
        "Sepsis 6 bundle must be initiated within 1 hour",
        "Anastomotic leak risk factors: low anastomosis, bowel prep, malnutrition, steroids, male sex",
        "Hartmann's procedure: removes the anastomosis without attempting primary re-anastomosis",
        "CT is gold standard for diagnosis — shows free fluid, free air, contrast leak",
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // CASE 6 — Acute Stroke
  // ─────────────────────────────────────────────────────────────────
  {
    id: "wc_006",
    specialty: "Medicine",
    difficulty: "expert",
    patient: {
      name: "Mr. James Mwangi",
      age: 72,
      gender: "Male",
      ward: "A&E Majors",
      presenting: "Sudden onset confusion, right-sided weakness and slurred speech — onset approximately 90 minutes ago",
      vitals: {
        HR: "88 bpm (irregular)", BP: "182/96 mmHg", RR: "16/min",
        O2: "97% on air", Temp: "37.1°C", GCS: "12/15 (E3V4M5)",
      },
      avatar: "👴",
    },
    history: [
      {
        id: "hpc", label: "History of presenting complaint",
        icon: "🗣️",
        content: "Wife reports husband suddenly became confused while watching TV at 10am — now 11:30am. Noticed right arm weakness — dropped his tea. Speech became slurred. No headache, no vomiting. No preceding TIA symptoms. Last seen well at 10am — this is the 'last known well' time.",
      },
      {
        id: "pmhx", label: "Past medical history",
        icon: "📋",
        content: "Atrial fibrillation (paroxysmal — not on anticoagulation, 'refused warfarin'). Hypertension. Type 2 diabetes. Previous TIA 18 months ago (aspirin started).",
      },
      {
        id: "dhx", label: "Drug history",
        icon: "💊",
        content: "Aspirin 75mg OD. Metformin 1g BD. Amlodipine 10mg OD. Not on anticoagulation.",
      },
      {
        id: "shx", label: "Social history",
        icon: "🏠",
        content: "Retired farmer. Lives with wife. Independent prior to this. Smoker — 40 pack-year history (stopped 5 years ago). Occasional alcohol.",
      },
      {
        id: "fhx", label: "Family history",
        icon: "👨‍👩‍👦",
        content: "Brother had a stroke at 68. No other relevant history.",
      },
    ],
    examination: [
      {
        id: "neuro", label: "Neurological exam (FAST + full)",
        icon: "🧠",
        content: "NIHSS: 14 (moderate-severe stroke). Facial droop left. Right arm power 1/5, right leg 2/5. Dysarthria. Left gaze preference. Right homonymous hemianopia. No sensory deficit detected. Plantar: upgoing right. GCS 12.",
      },
      {
        id: "cvs", label: "Cardiovascular exam",
        icon: "🫀",
        content: "Irregularly irregular pulse — consistent with AF. BP 182/96. HS I+II. No carotid bruits. No peripheral oedema.",
      },
      {
        id: "resp", label: "Respiratory exam",
        icon: "🫁",
        content: "Clear lung fields. Trachea central. SpO2 97% on air.",
      },
      {
        id: "abdo", label: "Abdominal exam",
        icon: "🤲",
        content: "Soft, non-tender, no organomegaly. No pulsatile mass.",
      },
    ],
    investigations: [
      {
        id: "ct", label: "Urgent CT Head (non-contrast)",
        icon: "🖥️", keyInvestigation: true,
        result: "No haemorrhage. No space-occupying lesion. Early ischaemic changes in left MCA territory — loss of grey-white differentiation. Hyperdense left MCA sign visible.",
      },
      {
        id: "ecg", label: "ECG",
        icon: "📈", keyInvestigation: true,
        result: "Atrial fibrillation — rate 88, irregularly irregular. No ST changes. QTc normal. Confirms AF as likely cardioembolic source.",
      },
      {
        id: "bloods", label: "FBC, U&E, Glucose, Clotting, Lipids",
        icon: "🩸",
        result: "Hb 134, WCC 8.2, Plt 210. Na 138, K 4.1, Cr 102. Glucose 9.4. INR 1.0 (not anticoagulated). Cholesterol 5.9. CRP 8.",
      },
      {
        id: "cta", label: "CT Angiography (head + neck)",
        icon: "🖥️", keyInvestigation: true,
        result: "Occlusion of left M1 segment of middle cerebral artery. No carotid stenosis. Suitable for mechanical thrombectomy assessment.",
      },
    ],
    diagnosis: {
      correct: "Acute Ischaemic Stroke — Left MCA Territory (Cardioembolic from AF)",
      options: [
        "Acute Ischaemic Stroke — Left MCA Territory (Cardioembolic from AF)",
        "Haemorrhagic Stroke",
        "Todd's Paresis post seizure",
        "Hypertensive Encephalopathy",
      ],
      explanation: "CT excludes haemorrhage. Left MCA territory signs (right hemiplegia, left gaze preference, dysarthria, hemianopia). Paroxysmal AF is the cardioembolic source. INR 1.0 confirms not anticoagulated. CTA confirms M1 occlusion.",
    },
    management: [
      {
        id: "mg1",
        step: "Thrombolysis decision",
        options: [
          { text: "IV Alteplase 0.9mg/kg (max 90mg) — within 4.5h of onset, haemorrhage excluded, no contraindications", correct: true, consequence: null },
          { text: "Aspirin 300mg and admit to stroke unit — no thrombolysis", correct: false, consequence: "Aspirin alone is inadequate for large vessel occlusion stroke. Without reperfusion, 1.9 million neurons die per minute. NIHSS worsens to 20." },
          { text: "Wait for MRI before any treatment decision", correct: false, consequence: "Time is brain. Waiting for MRI when CT has excluded haemorrhage wastes critical minutes. Window for thrombolysis is closing — patient no longer eligible." },
        ],
        xp: 20,
        explanation: "IV alteplase within 4.5 hours if: ischaemic stroke confirmed, no haemorrhage on CT, BP <185/110 (treat if higher), no recent surgery/bleeding. NNT ~10 for good outcome.",
      },
      {
        id: "mg2",
        step: "Mechanical thrombectomy",
        options: [
          { text: "Immediate referral for mechanical thrombectomy — CTA confirms M1 occlusion, within 6h window", correct: true, consequence: null },
          { text: "Thrombolysis alone is sufficient — no need for thrombectomy", correct: false, consequence: "For large vessel occlusion (M1/M2, basilar), thrombectomy is superior to thrombolysis alone. Without it, recanalization rates are much lower — patient left with significant disability." },
          { text: "Antihypertensives to reduce BP to 120/80 immediately", correct: false, consequence: "Aggressive BP lowering in acute ischaemic stroke reduces perfusion to the ischaemic penumbra. BP should only be treated if >185/110 (for thrombolysis) or >220/120 (otherwise). Patient's deficit worsens." },
        ],
        xp: 20,
        explanation: "Mechanical thrombectomy is recommended for large vessel occlusion within 6 hours (extended to 24h in selected patients with penumbral imaging). Combines with IV alteplase ('bridging thrombolysis').",
      },
      {
        id: "mg3",
        step: "Secondary prevention",
        options: [
          { text: "Anticoagulate with DOAC (apixaban/rivaroxaban) for AF — start 2 weeks post-stroke if no haemorrhagic transformation", correct: true, consequence: null },
          { text: "Continue aspirin only — anticoagulation too risky after stroke", correct: false, consequence: "Aspirin is inferior to anticoagulation for AF-related stroke prevention. Without anticoagulation, annual stroke recurrence risk is 10-12%. Patient has a further embolic stroke 3 weeks later." },
          { text: "Start warfarin immediately (same day as stroke)", correct: false, consequence: "Anticoagulation immediately post-stroke increases haemorrhagic transformation risk. Current guidance: start DOAC 2 weeks after moderate-large stroke (HAEMO rule or '1-3-6-12 day rule')." },
        ],
        xp: 15,
        explanation: "AF + ischaemic stroke = high recurrence risk without anticoagulation. DOACs (apixaban, rivaroxaban, dabigatran) are preferred over warfarin. Timing depends on stroke severity — usually 2 weeks for moderate stroke.",
      },
    ],
    debrief: {
      diagnosis: "Acute ischaemic stroke — left MCA occlusion — cardioembolic AF",
      keyLearning: [
        "'Time is brain' — 1.9 million neurons die every minute of untreated stroke",
        "CT head first to exclude haemorrhage before thrombolysis",
        "IV alteplase within 4.5h + mechanical thrombectomy for large vessel occlusion",
        "Do NOT aggressively lower BP in acute ischaemic stroke (penumbra at risk)",
        "AF is the most common cause of cardioembolic stroke — anticoagulate",
        "DOACs preferred over warfarin for non-valvular AF stroke prevention",
        "DOAC timing after stroke: 1-3-6-12 day rule depending on stroke size",
      ],
    },
  },
];

export function getCaseById(id) {
  return WARD_CASES.find(c => c.id === id) || null;
}

export function getRandomCase() {
  return WARD_CASES[Math.floor(Math.random() * WARD_CASES.length)];
}

export function shuffleCases() {
  const arr = [...WARD_CASES];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}