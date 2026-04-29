// src/data/diagnoseIn3Clues.js
// Question bank for "Diagnose in 3 Clues" game mode.
// Each case has 3 clues ordered from hardest → easiest.
// Clue 1 = most XP (fewest clues), Clue 3 = least XP.

const DIAGNOSE_CASES = [
  // ── INFECTIOUS DISEASE ────────────────────────────────────────────────────
  {
    id: "d3c_001",
    diagnosis: "Malaria",
    subject: "Infectious Disease",
    difficulty: "medium",
    year: 3,
    clues: [
      "A 28-year-old returned from rural Kenya 10 days ago with cyclical high fevers peaking every 48 hours.",
      "Blood smear shows ring-form trophozoites inside red blood cells with a banana-shaped gametocyte.",
      "He has severe headache, rigors, and splenomegaly. Rapid diagnostic test is positive for Plasmodium."
    ],
    options: ["Malaria", "Typhoid fever", "Dengue fever", "Viral hepatitis"],
    explanation: "The cyclical fever pattern, travel to endemic area, ring-form trophozoites on blood smear, and banana-shaped gametocytes (Plasmodium falciparum) confirm malaria. First-line treatment is artemether-lumefantrine."
  },
  {
    id: "d3c_002",
    diagnosis: "Pulmonary Tuberculosis",
    subject: "Infectious Disease",
    difficulty: "easy",
    year: 3,
    clues: [
      "A 34-year-old has had a productive cough for 3 months with drenching night sweats and 8 kg weight loss.",
      "Chest X-ray shows upper lobe cavitation with hilar lymphadenopathy.",
      "Sputum AFB smear is positive. He is HIV-positive with a CD4 count of 180."
    ],
    options: ["Pulmonary Tuberculosis", "Lung abscess", "Bronchiectasis", "Pneumocystis pneumonia"],
    explanation: "Classic TB presentation: chronic cough, constitutional symptoms (night sweats, weight loss), upper lobe cavitation, and positive AFB smear. HIV co-infection is common. Treatment: 2HRZE/4HR (DOTS regimen)."
  },
  {
    id: "d3c_003",
    diagnosis: "Meningococcal Meningitis",
    subject: "Infectious Disease",
    difficulty: "medium",
    year: 3,
    clues: [
      "A 19-year-old university student develops sudden severe headache and photophobia within hours of feeling unwell.",
      "He has neck stiffness and a non-blanching petechial rash spreading across his trunk and legs.",
      "Temperature is 39.8°C. Kernig's sign is positive. CT head is normal."
    ],
    options: ["Meningococcal Meningitis", "Viral encephalitis", "Subarachnoid haemorrhage", "Migraine with aura"],
    explanation: "The classic triad (headache, neck stiffness, fever) plus the non-blanching petechial/purpuric rash is pathognomonic for meningococcal disease (Neisseria meningitidis). Immediate IV benzylpenicillin before LP. Medical emergency."
  },
  {
    id: "d3c_004",
    diagnosis: "Typhoid Fever",
    subject: "Infectious Disease",
    difficulty: "hard",
    year: 3,
    clues: [
      "A 22-year-old returning from India has had a stepwise rising fever for 10 days reaching 40°C, with relative bradycardia.",
      "She has rose spots on her abdomen and mild splenomegaly.",
      "Blood culture grows a gram-negative rod sensitive to ciprofloxacin. Widal test is positive."
    ],
    options: ["Typhoid Fever", "Malaria", "Brucellosis", "Dengue fever"],
    explanation: "Stepwise fever, relative bradycardia (Faget's sign), rose spots, splenomegaly, and positive blood culture for Salmonella typhi confirm typhoid. Relative bradycardia (pulse lower than expected for temperature) is a classic clue. Treatment: ciprofloxacin or azithromycin."
  },
  {
    id: "d3c_005",
    diagnosis: "HIV/AIDS",
    subject: "Infectious Disease",
    difficulty: "easy",
    year: 3,
    clues: [
      "A 31-year-old presents with oral candidiasis, weight loss of 12 kg over 4 months, and recurrent chest infections.",
      "He has generalised lymphadenopathy and a CD4 count of 85 cells/μL.",
      "ELISA and Western blot are both positive for HIV antibodies."
    ],
    options: ["HIV/AIDS", "Lymphoma", "Sarcoidosis", "Systemic lupus erythematosus"],
    explanation: "CD4 <200 cells/μL with AIDS-defining illness (oral candidiasis, weight loss) confirms AIDS. Opportunistic infections like PCP, CMV retinitis, and cryptococcal meningitis occur at this stage. Start ART immediately."
  },

  // ── PHARMACOLOGY ──────────────────────────────────────────────────────────
  {
    id: "d3c_006",
    diagnosis: "Digoxin Toxicity",
    subject: "Pharmacology",
    difficulty: "medium",
    year: 3,
    clues: [
      "An 80-year-old on heart failure medications presents with nausea, vomiting, and seeing yellow-green halos around lights.",
      "ECG shows frequent premature ventricular contractions and a short PR interval.",
      "His renal function has deteriorated with a creatinine of 280 μmol/L. He takes furosemide, spironolactone, and a cardiac glycoside."
    ],
    options: ["Digoxin Toxicity", "Beta-blocker overdose", "Hyperkalaemia", "Amiodarone toxicity"],
    explanation: "Visual disturbances (yellow-green halos = xanthopsia), nausea/vomiting, and cardiac arrhythmias in a patient on digoxin with renal impairment (reduces digoxin clearance) = digoxin toxicity. Treat with digoxin-specific antibody fragments (Digibind)."
  },
  {
    id: "d3c_007",
    diagnosis: "Serotonin Syndrome",
    subject: "Pharmacology",
    difficulty: "hard",
    year: 3,
    clues: [
      "A 26-year-old on fluoxetine for depression was started on tramadol for back pain 2 days ago and now presents confused and agitated.",
      "Examination shows hyperthermia (38.9°C), diaphoresis, and tremor.",
      "She has clonus at the ankle, hyperreflexia, and dilated pupils."
    ],
    options: ["Serotonin Syndrome", "Neuroleptic malignant syndrome", "Anticholinergic toxicity", "Malignant hyperthermia"],
    explanation: "The Hunter Criteria triad: clonus + agitation + diaphoresis after adding a serotonergic drug (tramadol is a weak SNRI). Fluoxetine + tramadol = serotonin excess. Unlike NMS, onset is rapid (<24h) and clonus/hyperreflexia is key. Treat with cyproheptadine and benzodiazepines."
  },
  {
    id: "d3c_008",
    diagnosis: "Warfarin Overdose",
    subject: "Pharmacology",
    difficulty: "easy",
    year: 3,
    clues: [
      "A 65-year-old on anticoagulation therapy for atrial fibrillation presents with spontaneous bruising and prolonged bleeding after a minor cut.",
      "INR is 8.2 (target range 2–3). She recently completed a course of ciprofloxacin.",
      "She takes a vitamin K antagonist that requires regular INR monitoring."
    ],
    options: ["Warfarin Overdose", "Haemophilia A", "Disseminated intravascular coagulation", "Thrombocytopaenia"],
    explanation: "Supratherapeutic INR (8.2) on warfarin after ciprofloxacin (inhibits CYP2C9, reducing warfarin metabolism → increased warfarin levels). Treat with vitamin K (phytomenadione) and consider fresh frozen plasma for active bleeding."
  },
  {
    id: "d3c_009",
    diagnosis: "Neuroleptic Malignant Syndrome",
    subject: "Pharmacology",
    difficulty: "hard",
    year: 3,
    clues: [
      "A 42-year-old with schizophrenia started on haloperidol 2 weeks ago develops high fever (40.2°C) and severe muscle rigidity.",
      "CK is markedly elevated at 12,000 U/L. He is confused and diaphoretic.",
      "His blood pressure fluctuates wildly between 80/50 and 160/100 mmHg."
    ],
    options: ["Neuroleptic Malignant Syndrome", "Serotonin Syndrome", "Malignant hyperthermia", "Anticholinergic toxicity"],
    explanation: "NMS = hyperthermia + lead-pipe rigidity + autonomic instability + elevated CK after antipsychotic initiation. Unlike serotonin syndrome, onset is slower (days to weeks), rigidity is more severe ('lead pipe'), and clonus is absent. Stop antipsychotic. Treat with dantrolene and bromocriptine."
  },
  {
    id: "d3c_010",
    diagnosis: "Paracetamol Overdose",
    subject: "Pharmacology",
    difficulty: "easy",
    year: 3,
    clues: [
      "A 17-year-old is brought in 6 hours after ingesting an unknown number of tablets following an argument with her parents.",
      "She is currently well with no symptoms but her paracetamol level is above the treatment line on the nomogram.",
      "LFTs show rising ALT at 380 U/L. INR is 1.4."
    ],
    options: ["Paracetamol Overdose", "Aspirin overdose", "Tricyclic antidepressant overdose", "Opioid overdose"],
    explanation: "Paracetamol overdose: initial period of minimal symptoms, followed by hepatotoxicity (elevated ALT, coagulopathy) 24–72 hours later due to NAPQI accumulation depleting glutathione. Treatment: N-acetylcysteine (NAC) — highly effective if given within 8–10 hours."
  },

  // ── CARDIOLOGY ────────────────────────────────────────────────────────────
  {
    id: "d3c_011",
    diagnosis: "STEMI",
    subject: "Cardiology",
    difficulty: "easy",
    year: 3,
    clues: [
      "A 58-year-old diabetic smoker develops crushing central chest pain radiating to his left arm while climbing stairs.",
      "ECG shows ST elevation >2mm in leads II, III, and aVF with reciprocal depression in I and aVL.",
      "Troponin I is markedly elevated. He is diaphoretic and his BP is 90/60 mmHg."
    ],
    options: ["STEMI", "Unstable angina", "Aortic dissection", "Pulmonary embolism"],
    explanation: "Inferior STEMI (ST elevation in II, III, aVF with reciprocal changes). Diabetics may have atypical presentations. Cardiogenic shock (hypotension, diaphoresis). Immediate reperfusion: primary PCI within 90 minutes. Give aspirin + heparin."
  },
  {
    id: "d3c_012",
    diagnosis: "Cardiac Tamponade",
    subject: "Cardiology",
    difficulty: "hard",
    year: 3,
    clues: [
      "A 45-year-old with known lung cancer presents with progressive dyspnoea, low BP, and muffled heart sounds.",
      "JVP is markedly elevated and rises further on inspiration (Kussmaul's sign).",
      "ECG shows electrical alternans. CXR shows a globular 'water bottle' heart shadow."
    ],
    options: ["Cardiac Tamponade", "Tension pneumothorax", "Heart failure", "Constrictive pericarditis"],
    explanation: "Beck's triad: hypotension + muffled heart sounds + elevated JVP. Electrical alternans on ECG (alternating QRS amplitude) is pathognomonic for tamponade. Malignant pericardial effusion from lung cancer. Emergency: pericardiocentesis."
  },
  {
    id: "d3c_013",
    diagnosis: "Infective Endocarditis",
    subject: "Cardiology",
    difficulty: "medium",
    year: 3,
    clues: [
      "A 30-year-old IV drug user has had 3 weeks of fever, night sweats, and a new pansystolic murmur at the tricuspid area.",
      "He has splinter haemorrhages under his fingernails and small painful nodules on his finger pads.",
      "Blood cultures grow Staphylococcus aureus. Echo shows vegetations on the tricuspid valve."
    ],
    options: ["Infective Endocarditis", "Rheumatic fever", "SLE", "Septic arthritis"],
    explanation: "IV drug use → right-sided endocarditis (tricuspid). Duke criteria: blood cultures + echo vegetations (major) + Osler's nodes (painful finger nodules) + splinter haemorrhages (minor). Treatment: 6 weeks IV flucloxacillin (or vancomycin if MRSA)."
  },

  // ── RESPIRATORY ───────────────────────────────────────────────────────────
  {
    id: "d3c_014",
    diagnosis: "Pulmonary Embolism",
    subject: "Respiratory",
    difficulty: "medium",
    year: 3,
    clues: [
      "A 52-year-old woman 5 days post-hip replacement suddenly develops pleuritic chest pain and haemoptysis.",
      "Her right calf is swollen, erythematous, and tender. SpO2 is 88% on room air.",
      "CTPA shows a saddle embolus at the pulmonary trunk. ECG shows S1Q3T3 pattern."
    ],
    options: ["Pulmonary Embolism", "Pneumonia", "Pneumothorax", "Myocardial infarction"],
    explanation: "Post-operative DVT → PE: Virchow's triad (stasis, hypercoagulability, endothelial injury). Pleuritic pain + haemoptysis + hypoxia. S1Q3T3 on ECG (right heart strain). CTPA is gold standard. Treatment: anticoagulation (LMWH → warfarin or DOAC)."
  },
  {
    id: "d3c_015",
    diagnosis: "Tension Pneumothorax",
    subject: "Respiratory",
    difficulty: "medium",
    year: 3,
    clues: [
      "A 23-year-old tall thin male is brought in by ambulance after sudden onset severe left-sided chest pain and breathlessness.",
      "Trachea is deviated to the right. Breath sounds are absent on the left. HR is 130 and BP 80/50.",
      "He is on a ventilator in ICU following trauma. SpO2 is 78% despite 15L O2."
    ],
    options: ["Tension Pneumothorax", "Massive haemothorax", "Cardiac Tamponade", "Aortic dissection"],
    explanation: "Tension pneumothorax: tracheal deviation AWAY from affected side, absent breath sounds, haemodynamic compromise. Life-threatening emergency — do NOT wait for CXR. Immediate needle decompression (2nd intercostal space, midclavicular line), then chest drain."
  },

  // ── GASTROENTEROLOGY ─────────────────────────────────────────────────────
  {
    id: "d3c_016",
    diagnosis: "Acute Pancreatitis",
    subject: "Gastroenterology",
    difficulty: "easy",
    year: 3,
    clues: [
      "A 45-year-old heavy drinker presents with severe epigastric pain radiating to the back, relieved by leaning forward.",
      "Serum amylase is 1,200 U/L (normal <100). He has vomiting and abdominal guarding.",
      "Ultrasound shows gallstones and a swollen oedematous pancreas. Grey-Turner's sign is present."
    ],
    options: ["Acute Pancreatitis", "Peptic ulcer perforation", "Mesenteric ischaemia", "Aortic aneurysm rupture"],
    explanation: "Epigastric pain radiating to back + raised amylase (>3× normal) = acute pancreatitis. Two main causes: Gallstones and Alcohol (GET SMASHED mnemonic). Grey-Turner's sign (flank bruising) indicates haemorrhagic pancreatitis. Ranson's criteria for severity."
  },
  {
    id: "d3c_017",
    diagnosis: "Hepatic Encephalopathy",
    subject: "Gastroenterology",
    difficulty: "medium",
    year: 3,
    clues: [
      "A 55-year-old with alcoholic cirrhosis presents confused and drowsy after a recent GI bleed.",
      "He has asterixis (flapping tremor) on examination and smells of ammonia.",
      "Serum ammonia is elevated. EEG shows triphasic waves."
    ],
    options: ["Hepatic Encephalopathy", "Wernicke's Encephalopathy", "Subdural haematoma", "Meningitis"],
    explanation: "Hepatic encephalopathy precipitated by GI bleed (protein load → ammonia). Asterixis (liver flap) is classic. Elevated ammonia, triphasic EEG waves. Treat precipitant, lactulose (reduces ammonia absorption), rifaximin."
  },

  // ── ENDOCRINOLOGY ─────────────────────────────────────────────────────────
  {
    id: "d3c_018",
    diagnosis: "Diabetic Ketoacidosis",
    subject: "Endocrinology",
    difficulty: "easy",
    year: 3,
    clues: [
      "A 19-year-old Type 1 diabetic presents with polyuria, polydipsia, and vomiting for 2 days after missing insulin doses.",
      "He is Kussmaul breathing (deep, rapid respirations) with a fruity breath odour.",
      "Blood glucose is 28 mmol/L, pH 7.1, bicarbonate 10, ketones 4+ on urine dipstick."
    ],
    options: ["Diabetic Ketoacidosis", "Hyperosmolar hyperglycaemic state", "Lactic acidosis", "Salicylate poisoning"],
    explanation: "DKA: hyperglycaemia + ketosis + metabolic acidosis (pH <7.3, bicarbonate <15). Kussmaul breathing compensates for acidosis. Precipitant: missed insulin. Treatment: IV fluids, fixed-rate insulin infusion, potassium replacement (DKA causes total body K+ depletion)."
  },
  {
    id: "d3c_019",
    diagnosis: "Addisonian Crisis",
    subject: "Endocrinology",
    difficulty: "hard",
    year: 3,
    clues: [
      "A 38-year-old known to have Addison's disease collapses after a gastroenteritis illness. BP is 70/40.",
      "She is profoundly hyponatraemic (Na 118) and hyperkalaemic (K 6.2). Blood glucose is 2.8 mmol/L.",
      "She forgot to increase her steroid dose during her illness. Serum cortisol is undetectable."
    ],
    options: ["Addisonian Crisis", "Septic shock", "Hypopituitary coma", "SIADH"],
    explanation: "Addisonian crisis precipitated by illness (failure to sick-day dose steroids). Classic: hypotension + hyponatraemia + hyperkalaemia + hypoglycaemia. Undetectable cortisol. Immediate IV hydrocortisone 100mg + IV saline + dextrose. Life-threatening."
  },
  {
    id: "d3c_020",
    diagnosis: "Thyroid Storm",
    subject: "Endocrinology",
    difficulty: "hard",
    year: 3,
    clues: [
      "A 29-year-old with known Graves' disease undergoes emergency appendicectomy and develops fever of 41°C and heart rate of 160 bpm.",
      "She is agitated, tremulous, and profusely sweating. She ran out of carbimazole 2 weeks ago.",
      "Burch-Wartofsky score is 65. TSH is undetectable. Free T4 is critically elevated."
    ],
    options: ["Thyroid Storm", "Septic shock", "Neuroleptic malignant syndrome", "Phaeochromocytoma crisis"],
    explanation: "Thyroid storm (Burch-Wartofsky score ≥45): precipitated by surgery/illness in undertreated hyperthyroidism. Hyperpyrexia + tachycardia + agitation. Treatment: propylthiouracil (blocks synthesis and T4→T3 conversion), Lugol's iodine (given 1h after PTU), propranolol, hydrocortisone, cooling."
  },

  // ── NEUROLOGY ─────────────────────────────────────────────────────────────
  {
    id: "d3c_021",
    diagnosis: "Guillain-Barré Syndrome",
    subject: "Neurology",
    difficulty: "medium",
    year: 3,
    clues: [
      "A 35-year-old presents with ascending weakness starting in his feet 2 weeks after a Campylobacter gastroenteritis.",
      "Deep tendon reflexes are absent throughout. He has bilateral facial nerve palsy.",
      "CSF shows albuminocytological dissociation (protein 2.8 g/L, white cells 2/mm³). NCS confirms demyelination."
    ],
    options: ["Guillain-Barré Syndrome", "Myasthenia Gravis", "Transverse Myelitis", "Multiple Sclerosis"],
    explanation: "GBS: ascending flaccid paralysis + areflexia after infection (Campylobacter most common). Albuminocytological dissociation (high protein, normal WBC) in CSF is classic. Respiratory failure risk — monitor FVC. Treatment: IV immunoglobulin or plasmapheresis."
  },
  {
    id: "d3c_022",
    diagnosis: "Subarachnoid Haemorrhage",
    subject: "Neurology",
    difficulty: "medium",
    year: 3,
    clues: [
      "A 48-year-old describes the 'worst headache of her life' that came on suddenly like a thunderclap while straining.",
      "She has neck stiffness and photophobia. BP is 210/120 mmHg.",
      "CT head shows blood in the basal cisterns. LP shows xanthochromia."
    ],
    options: ["Subarachnoid Haemorrhage", "Meningitis", "Hypertensive encephalopathy", "Migraine"],
    explanation: "Thunderclap headache (sudden onset, maximum severity instantly) + neck stiffness = SAH until proven otherwise. CT head is first-line (90% sensitive in first 12h). LP xanthochromia (bilirubin) confirms if CT negative. Caused by ruptured Berry aneurysm. Nimodipine prevents vasospasm."
  },

  // ── RHEUMATOLOGY ─────────────────────────────────────────────────────────
  {
    id: "d3c_023",
    diagnosis: "Systemic Lupus Erythematosus",
    subject: "Rheumatology",
    difficulty: "medium",
    year: 3,
    clues: [
      "A 24-year-old woman of African descent presents with joint pain, a butterfly rash across both cheeks, and hair loss.",
      "She has proteinuria 3+ and haematuria on dipstick. Complement C3 and C4 are low.",
      "ANA is positive at 1:640. Anti-dsDNA antibodies are strongly positive."
    ],
    options: ["Systemic Lupus Erythematosus", "Rheumatoid Arthritis", "Drug-induced lupus", "Dermatomyositis"],
    explanation: "SLE: young African woman, malar rash + arthritis + renal involvement + low complement + positive ANA/anti-dsDNA. SLICC criteria. Anti-dsDNA is specific for SLE and correlates with disease activity. Lupus nephritis requires hydroxychloroquine + immunosuppression."
  },
  {
    id: "d3c_024",
    diagnosis: "Gout",
    subject: "Rheumatology",
    difficulty: "easy",
    year: 3,
    clues: [
      "A 52-year-old obese man who drinks 30 units of alcohol per week presents with an acutely swollen, red, exquisitely tender right big toe at 3am.",
      "He takes furosemide for hypertension. Serum uric acid is 580 μmol/L.",
      "Joint aspiration shows negatively birefringent needle-shaped crystals under polarised light microscopy."
    ],
    options: ["Gout", "Septic Arthritis", "Pseudogout", "Reactive Arthritis"],
    explanation: "Gout: podagra (first MTP joint) is classic. Negatively birefringent (yellow when parallel to polariser) needle-shaped monosodium urate crystals. Furosemide + alcohol increase uric acid. Treat acute attack with NSAIDs/colchicine. Long-term: allopurinol."
  },

  // ── HAEMATOLOGY ──────────────────────────────────────────────────────────
  {
    id: "d3c_025",
    diagnosis: "Sickle Cell Crisis",
    subject: "Haematology",
    difficulty: "easy",
    year: 3,
    clues: [
      "A 16-year-old West African boy with known haemoglobinopathy presents with severe bilateral leg pain after a long flight.",
      "He is febrile and has a haemoglobin of 6.2 g/dL. His hands and feet are swollen (dactylitis).",
      "Blood film shows sickle-shaped red blood cells. Haemoglobin electrophoresis shows HbSS pattern."
    ],
    options: ["Sickle Cell Crisis", "Thalassaemia", "G6PD deficiency crisis", "Leukaemia"],
    explanation: "Sickle cell vaso-occlusive crisis precipitated by hypoxia (long flight). Severe bone pain + dactylitis + anaemia + sickle cells on film. HbSS = homozygous. Treat with analgesia (opioids), IV fluids, oxygen, exchange transfusion if severe. Hydroxyurea for prevention."
  },
];

export default DIAGNOSE_CASES;