// src/data/pharmaRouletteData.js
// Each drug has exactly 5 questions in order: mechanism, indication, side effect, contraindication, interaction
// This is the dedicated data source for Pharmacology Roulette

const PHARMA_ROULETTE_DRUGS = {

  // ══════════════════════════════════════════════════════════
  // ANTIBIOTICS (segment colour: #ef4444)
  // ══════════════════════════════════════════════════════════
  antibiotics: {
    label: "Antibiotics",
    colour: "#ef4444",
    glow: "rgba(239,68,68,0.4)",
    icon: "💊",
    drugs: [
      {
        name: "Amoxicillin",
        year: 2,
        difficulty: "easy",
        questions: [
          { type: "mechanism",       q: "What is the mechanism of action of amoxicillin?",                                    a: "Inhibits bacterial cell wall synthesis by binding to penicillin-binding proteins (PBPs), preventing cross-linking of peptidoglycan",  options: ["Inhibits cell wall synthesis via PBPs", "Inhibits DNA gyrase", "Inhibits 50S ribosomal subunit", "Disrupts cell membrane"], correct: 0 },
          { type: "indication",      q: "Which organism does amoxicillin cover that ampicillin does not additionally cover?",  a: "Both have similar spectrum — amoxicillin has better oral bioavailability (90% vs 40%)",                                             options: ["MRSA", "Pseudomonas", "Better oral bioavailability than ampicillin", "Anaerobes"], correct: 2 },
          { type: "side_effect",     q: "A patient on amoxicillin develops a maculopapular rash. What is the most important cause to exclude?", a: "EBV (glandular fever) — amoxicillin causes rash in ~90% of EBV patients",                   options: ["Penicillin allergy", "EBV infection", "SJS", "Viral exanthem"], correct: 1 },
          { type: "contraindication",q: "Amoxicillin is contraindicated in which patient?",                                   a: "Patient with documented penicillin allergy (anaphylaxis)",                                                                         options: ["Renal impairment", "Documented penicillin allergy", "Pregnancy", "Children under 12"], correct: 1 },
          { type: "interaction",     q: "Amoxicillin reduces the efficacy of which medication?",                              a: "Oral contraceptive pill (reduces gut flora involved in enterohepatic recirculation)",                                             options: ["Warfarin — reduces effect", "OCP — reduces efficacy", "Metformin — increases levels", "Digoxin — toxic levels"], correct: 1 },
        ]
      },
      {
        name: "Metronidazole",
        year: 2,
        difficulty: "medium",
        questions: [
          { type: "mechanism",       q: "How does metronidazole kill bacteria?",                                              a: "Reduced to toxic free radicals inside anaerobic organisms that damage DNA",                                                           options: ["Inhibits cell wall synthesis", "Reduced to DNA-damaging free radicals in anaerobes", "Blocks 30S ribosome", "Inhibits dihydrofolate reductase"], correct: 1 },
          { type: "indication",      q: "Which of the following is a key indication for metronidazole?",                     a: "Clostridium difficile infection and anaerobic infections",                                                                          options: ["MRSA bacteraemia", "C. difficile infection", "Atypical pneumonia", "UTI due to E. coli"], correct: 1 },
          { type: "side_effect",     q: "A patient on metronidazole has a metallic taste and peripheral neuropathy. These are recognised side effects?", a: "Yes — metallic taste, peripheral neuropathy, and disulfiram-like reaction with alcohol", options: ["No — these suggest toxicity", "Yes — recognised side effects", "Only metallic taste is recognised", "Peripheral neuropathy only occurs with IV use"], correct: 1 },
          { type: "contraindication",q: "Metronidazole should be avoided in the first trimester of pregnancy because:",      a: "Potential teratogenicity in the first trimester (though evidence is limited)",                                                         options: ["Causes IUGR", "Potential teratogenicity in first trimester", "Crosses placenta causing neonatal jaundice", "Causes premature labour"], correct: 1 },
          { type: "interaction",     q: "Metronidazole has a dangerous interaction with which commonly used drug?",          a: "Warfarin — metronidazole inhibits CYP2C9, markedly increasing warfarin levels and bleeding risk",                                    options: ["Aspirin", "Warfarin — inhibits CYP2C9 increasing INR", "Metformin", "Amlodipine"], correct: 1 },
        ]
      },
      {
        name: "Gentamicin",
        year: 3,
        difficulty: "hard",
        questions: [
          { type: "mechanism",       q: "What is the mechanism of action of gentamicin?",                                    a: "Binds to 30S ribosomal subunit, causing misreading of mRNA and inhibiting protein synthesis",                                         options: ["Inhibits 50S subunit", "Binds 30S subunit causing mRNA misreading", "Inhibits DNA gyrase", "Blocks cell wall synthesis"], correct: 1 },
          { type: "indication",      q: "Gentamicin is the drug of choice for serious infections caused by:",               a: "Gram-negative bacilli (E. coli, Pseudomonas, Klebsiella) — particularly in sepsis",                                                  options: ["MRSA", "Gram-negative bacilli including Pseudomonas", "Streptococcal pneumonia", "Mycobacterium tuberculosis"], correct: 1 },
          { type: "side_effect",     q: "Which two serious toxicities require monitoring in patients receiving gentamicin?", a: "Nephrotoxicity and ototoxicity (vestibular and cochlear) — require drug level monitoring",                                           options: ["Hepatotoxicity and rash", "Nephrotoxicity and ototoxicity", "Bone marrow suppression and neurotoxicity", "Cardiotoxicity and nephrotoxicity"], correct: 1 },
          { type: "contraindication",q: "Gentamicin is relatively contraindicated in which condition?",                     a: "Myasthenia gravis — aminoglycosides impair neuromuscular transmission and worsen weakness",                                           options: ["Diabetes mellitus", "Myasthenia gravis", "Atrial fibrillation", "Hypothyroidism"], correct: 1 },
          { type: "interaction",     q: "Co-administration of gentamicin with which drug increases nephrotoxicity risk?",   a: "Furosemide (loop diuretics) — combination significantly increases risk of renal damage and ototoxicity",                             options: ["Amoxicillin", "Furosemide", "Paracetamol", "Omeprazole"], correct: 1 },
        ]
      },
      {
        name: "Ciprofloxacin",
        year: 3,
        difficulty: "medium",
        questions: [
          { type: "mechanism",       q: "Ciprofloxacin kills bacteria by inhibiting which enzyme?",                          a: "DNA gyrase (topoisomerase II) and topoisomerase IV — prevents DNA supercoiling and replication",                                      options: ["RNA polymerase", "DNA gyrase and topoisomerase IV", "Dihydropteroate synthase", "Transpeptidase"], correct: 1 },
          { type: "indication",      q: "Which is the most appropriate use of ciprofloxacin?",                              a: "Urinary tract infections and gram-negative infections including Pseudomonas",                                                        options: ["First-line for community pneumonia", "Gram-negative UTI and Pseudomonas infections", "MRSA skin infections", "First-line for meningitis"], correct: 1 },
          { type: "side_effect",     q: "Which serious tendon complication is associated with fluoroquinolones?",           a: "Tendon rupture (especially Achilles) — risk increased with corticosteroids and in elderly",                                          options: ["Carpal tunnel syndrome", "Achilles tendon rupture", "Plantar fasciitis", "Compartment syndrome"], correct: 1 },
          { type: "contraindication",q: "Ciprofloxacin should be avoided in children and adolescents primarily because:",  a: "It damages developing cartilage (arthropathy) in animal studies — avoid in those under 18 unless benefits outweigh risks",          options: ["Causes Stevens-Johnson syndrome in children", "Damages developing cartilage", "Causes growth retardation", "Nephrotoxic in children"], correct: 1 },
          { type: "interaction",     q: "Ciprofloxacin significantly increases serum levels of which drug?",               a: "Theophylline — ciprofloxacin inhibits CYP1A2, reducing theophylline clearance and risking toxicity",                                 options: ["Paracetamol", "Theophylline — inhibits CYP1A2", "Atenolol", "Furosemide"], correct: 1 },
        ]
      },
    ]
  },

  // ══════════════════════════════════════════════════════════
  // CARDIOVASCULAR (segment colour: #3b82f6)
  // ══════════════════════════════════════════════════════════
  cardiovascular: {
    label: "Cardiovascular",
    colour: "#3b82f6",
    glow: "rgba(59,130,246,0.4)",
    icon: "❤️",
    drugs: [
      {
        name: "Atenolol",
        year: 2,
        difficulty: "easy",
        questions: [
          { type: "mechanism",       q: "What is the mechanism of action of atenolol?",                                      a: "Selective beta-1 adrenoceptor antagonist — reduces heart rate, contractility, and blood pressure",                                  options: ["Non-selective beta blocker", "Selective beta-1 blocker reducing HR and contractility", "Calcium channel blocker", "ACE inhibitor"], correct: 1 },
          { type: "indication",      q: "Which conditions is atenolol used to treat?",                                       a: "Hypertension, angina, and rate control in atrial fibrillation",                                                                   options: ["Heart failure with acute decompensation", "Hypertension, angina, AF rate control", "Hypotension and shock", "Diabetic nephropathy only"], correct: 1 },
          { type: "side_effect",     q: "A patient on atenolol reports cold extremities and fatigue. These are:",           a: "Recognised side effects — peripheral vasoconstriction (cold extremities) and reduced cardiac output (fatigue)",                   options: ["Signs of toxicity requiring dose reduction", "Recognised side effects of beta-blockade", "Signs of allergy", "Unrelated to atenolol"], correct: 1 },
          { type: "contraindication",q: "Atenolol is contraindicated in which respiratory condition?",                      a: "Asthma — beta-1 selective blockers can still trigger bronchospasm in susceptible patients",                                          options: ["COPD (all grades)", "Asthma", "Pulmonary fibrosis", "Pleural effusion"], correct: 1 },
          { type: "interaction",     q: "Combining atenolol with which drug risks complete heart block?",                   a: "Verapamil (non-dihydropyridine calcium channel blocker) — both slow AV conduction, risking dangerous bradycardia/heart block",     options: ["Amlodipine", "Verapamil or diltiazem", "Nifedipine", "Furosemide"], correct: 1 },
        ]
      },
      {
        name: "Warfarin",
        year: 3,
        difficulty: "hard",
        questions: [
          { type: "mechanism",       q: "Warfarin prevents coagulation by which mechanism?",                                a: "Inhibits vitamin K epoxide reductase, preventing regeneration of vitamin K and synthesis of clotting factors II, VII, IX, X",        options: ["Directly inhibits thrombin", "Inhibits vitamin K epoxide reductase blocking factors II,VII,IX,X", "Activates antithrombin III", "Inhibits platelet aggregation"], correct: 1 },
          { type: "indication",      q: "What is the target INR for a patient on warfarin for atrial fibrillation?",       a: "INR 2.0–3.0 for AF (stroke prophylaxis)",                                                                                         options: ["INR 1.0–1.5", "INR 2.0–3.0", "INR 3.0–4.5", "INR 1.5–2.5"], correct: 1 },
          { type: "side_effect",     q: "The most dangerous adverse effect of warfarin is:",                               a: "Major haemorrhage — intracranial, GI, or retroperitoneal bleeding",                                                                options: ["Alopecia", "Major haemorrhage", "Hepatotoxicity", "Peripheral neuropathy"], correct: 1 },
          { type: "contraindication",q: "Warfarin is absolutely contraindicated in which situation?",                      a: "Pregnancy — particularly first and third trimesters (teratogenic, causes fetal haemorrhage)",                                      options: ["Renal impairment", "Pregnancy", "Elderly patients", "Mild hypertension"], correct: 1 },
          { type: "interaction",     q: "Which common analgesic markedly increases warfarin's anticoagulant effect?",      a: "NSAIDs (e.g. ibuprofen) — inhibit platelet function AND increase GI bleeding risk; some inhibit CYP2C9 increasing warfarin levels", options: ["Paracetamol (safe)", "NSAIDs — platelet inhibition and CYP2C9 inhibition", "Codeine", "Tramadol"], correct: 1 },
        ]
      },
      {
        name: "Digoxin",
        year: 3,
        difficulty: "hard",
        questions: [
          { type: "mechanism",       q: "Digoxin increases myocardial contractility by which mechanism?",                   a: "Inhibits Na+/K+ ATPase pump, raising intracellular Na+ which reduces Ca2+ extrusion via Na+/Ca2+ exchanger, increasing intracellular Ca2+", options: ["Activates beta-1 receptors", "Inhibits Na/K ATPase increasing intracellular calcium", "Blocks calcium channels", "Activates adenylyl cyclase"], correct: 1 },
          { type: "indication",      q: "Digoxin is used for rate control in which arrhythmia?",                           a: "Atrial fibrillation — particularly in sedentary patients or those with heart failure",                                                 options: ["Ventricular tachycardia", "Atrial fibrillation for rate control", "Complete heart block", "SVT"], correct: 1 },
          { type: "side_effect",     q: "Which visual disturbance is classic for digoxin toxicity?",                       a: "Yellow-green visual disturbances (xanthopsia) — described by Van Gogh who may have been on digoxin",                               options: ["Diplopia", "Yellow-green colour vision changes (xanthopsia)", "Tunnel vision", "Painless visual loss"], correct: 1 },
          { type: "contraindication",q: "Digoxin should be used with extreme caution in which electrolyte disturbance?",   a: "Hypokalaemia — low potassium increases digoxin binding to Na+/K+ ATPase, precipitating toxicity at therapeutic levels",            options: ["Hypernatraemia", "Hypokalaemia — increases toxicity risk", "Hypercalcaemia", "Hypermagnesaemia"], correct: 1 },
          { type: "interaction",     q: "Which drug significantly raises plasma digoxin levels requiring dose reduction?",  a: "Amiodarone — inhibits P-glycoprotein and renal digoxin excretion, doubling digoxin levels",                                        options: ["Metformin", "Amiodarone — raises digoxin levels by ~50-100%", "Atenolol", "Aspirin"], correct: 1 },
        ]
      },
      {
        name: "Furosemide",
        year: 2,
        difficulty: "medium",
        questions: [
          { type: "mechanism",       q: "Where does furosemide act in the nephron?",                                        a: "Thick ascending limb of the loop of Henle — inhibits Na+/K+/2Cl- cotransporter (NKCC2)",                                            options: ["Proximal convoluted tubule", "Thick ascending loop of Henle — inhibits NKCC2", "Distal convoluted tubule", "Collecting duct"], correct: 1 },
          { type: "indication",      q: "Furosemide is first-line treatment for:",                                          a: "Acute pulmonary oedema and fluid overload in heart failure",                                                                      options: ["Hypertension in young patients", "Acute pulmonary oedema and heart failure fluid overload", "Atrial fibrillation", "Nephrotic syndrome first-line"], correct: 1 },
          { type: "side_effect",     q: "Which metabolic disturbance is most commonly caused by furosemide?",              a: "Hypokalaemia — loop diuretics cause significant urinary potassium losses",                                                          options: ["Hyperkalaemia", "Hypokalaemia from urinary K+ loss", "Metabolic acidosis", "Hypernatraemia"], correct: 1 },
          { type: "contraindication",q: "Furosemide is contraindicated in which scenario?",                                a: "Anuria — if kidneys are not producing urine, loop diuretics cannot work and may worsen renal failure",                              options: ["Mild hypertension", "Anuria", "Heart failure", "Hypoalbuminaemia"], correct: 1 },
          { type: "interaction",     q: "Furosemide combined with gentamicin increases the risk of which serious toxicity?", a: "Ototoxicity — both are independently ototoxic and together significantly increase cochlear and vestibular damage",               options: ["Hepatotoxicity", "Ototoxicity — synergistic with aminoglycosides", "Rhabdomyolysis", "Bone marrow suppression"], correct: 1 },
        ]
      },
    ]
  },

  // ══════════════════════════════════════════════════════════
  // CNS (segment colour: #8b5cf6)
  // ══════════════════════════════════════════════════════════
  cns: {
    label: "CNS",
    colour: "#8b5cf6",
    glow: "rgba(139,92,246,0.4)",
    icon: "🧠",
    drugs: [
      {
        name: "Phenytoin",
        year: 3,
        difficulty: "hard",
        questions: [
          { type: "mechanism",       q: "Phenytoin prevents seizures by which mechanism?",                                  a: "Blocks voltage-gated sodium channels in their inactive state, stabilising neuronal membranes and reducing repetitive firing",       options: ["Enhances GABA activity", "Blocks inactive voltage-gated Na+ channels", "Blocks NMDA receptors", "Inhibits carbonic anhydrase"], correct: 1 },
          { type: "indication",      q: "Phenytoin is particularly useful for which type of seizure?",                      a: "Focal and generalised tonic-clonic seizures, and status epilepticus (IV)",                                                          options: ["Absence seizures (first-line)", "Tonic-clonic and focal seizures, status epilepticus", "Juvenile myoclonic epilepsy", "Infantile spasms"], correct: 1 },
          { type: "side_effect",     q: "Which cosmetic side effect is associated with long-term phenytoin use?",          a: "Gingival hyperplasia, hirsutism, coarsening of facial features, and acne",                                                         options: ["Alopecia and weight gain", "Gingival hyperplasia and hirsutism", "Purple striae", "Buffalo hump"], correct: 1 },
          { type: "contraindication",q: "Phenytoin should not be given with which cardiac condition?",                     a: "Sinus bradycardia and heart block — phenytoin slows cardiac conduction",                                                           options: ["Atrial fibrillation", "Sinus bradycardia and heart block", "Hypertension", "Mitral valve prolapse"], correct: 1 },
          { type: "interaction",     q: "Phenytoin reduces plasma levels of which important drug?",                        a: "Oral contraceptive pill — phenytoin is a potent CYP enzyme inducer, accelerating OCP metabolism",                                  options: ["Furosemide", "Oral contraceptive pill — CYP enzyme induction", "Metformin", "Digoxin (increases levels)"], correct: 1 },
        ]
      },
      {
        name: "Haloperidol",
        year: 3,
        difficulty: "medium",
        questions: [
          { type: "mechanism",       q: "Haloperidol treats psychosis by blocking which receptor?",                         a: "D2 (dopamine) receptors in the mesolimbic pathway — reduces positive symptoms of psychosis",                                       options: ["Serotonin 5-HT2A receptors", "D2 dopamine receptors", "Muscarinic receptors", "GABA-A receptors"], correct: 1 },
          { type: "indication",      q: "Which condition is haloperidol used to treat acutely?",                           a: "Acute psychosis, delirium, and agitation — IV/IM in emergency settings",                                                           options: ["Depression with psychomotor retardation", "Acute psychosis and delirium", "Generalised anxiety disorder", "Parkinson's disease"], correct: 1 },
          { type: "side_effect",     q: "Acute dystonia as a side effect of haloperidol is treated with:",                a: "Procyclidine or benztropine (anticholinergic agents) — relax the muscle spasm",                                                    options: ["More haloperidol", "Procyclidine (anticholinergic)", "Diazepam IV", "Naloxone"], correct: 1 },
          { type: "contraindication",q: "Haloperidol is contraindicated in which neurodegenerative condition?",           a: "Lewy body dementia — antipsychotics cause severe sensitivity reactions including rigidity, confusion, and death",                    options: ["Alzheimer's dementia", "Lewy body dementia — severe neuroleptic sensitivity", "Vascular dementia", "Frontotemporal dementia"], correct: 1 },
          { type: "interaction",     q: "Haloperidol combined with which drug increases the risk of fatal arrhythmia?",   a: "Any QT-prolonging drug (e.g. amiodarone, erythromycin) — haloperidol prolongs QT and torsades de pointes risk is additive",       options: ["Paracetamol", "QT-prolonging drugs e.g. amiodarone — risk of torsades", "Metformin", "Lisinopril"], correct: 1 },
        ]
      },
      {
        name: "Lithium",
        year: 3,
        difficulty: "hard",
        questions: [
          { type: "mechanism",       q: "The mood-stabilising mechanism of lithium is thought to involve:",               a: "Inhibition of inositol monophosphatase, depleting inositol and reducing IP3 signalling in overactive neurons",                      options: ["Dopamine receptor blockade", "Inhibition of inositol monophosphatase reducing IP3 signalling", "GABA enhancement", "Serotonin reuptake inhibition"], correct: 1 },
          { type: "indication",      q: "Lithium is the gold-standard treatment for:",                                    a: "Bipolar affective disorder — prophylaxis of manic and depressive episodes",                                                         options: ["Major depressive disorder", "Bipolar disorder prophylaxis", "Schizophrenia", "Generalised anxiety disorder"], correct: 1 },
          { type: "side_effect",     q: "The triad of lithium toxicity includes:",                                        a: "Coarse tremor, GI symptoms (nausea, vomiting, diarrhoea), and neurological features (confusion, ataxia)",                        options: ["Fine tremor, weight loss, polyuria", "Coarse tremor, GI symptoms, neurological signs", "Bradycardia, hypotension, hypothermia", "Rash, eosinophilia, hepatitis"], correct: 1 },
          { type: "contraindication",q: "Lithium is particularly dangerous in which clinical situation?",                a: "Dehydration, hyponatraemia, or renal impairment — all reduce lithium excretion causing toxicity at normal doses",                   options: ["Mild hypertension", "Dehydration/renal impairment — reduces excretion", "Hypothyroidism", "First-degree AV block"], correct: 1 },
          { type: "interaction",     q: "Which commonly prescribed drug class raises lithium levels to toxic range?",    a: "NSAIDs — reduce renal prostaglandin synthesis, decreasing lithium clearance and raising serum levels",                             options: ["Paracetamol", "NSAIDs — reduce renal lithium clearance", "Beta blockers", "Proton pump inhibitors"], correct: 1 },
        ]
      },
    ]
  },

  // ══════════════════════════════════════════════════════════
  // ENDOCRINE (segment colour: #f59e0b)
  // ══════════════════════════════════════════════════════════
  endocrine: {
    label: "Endocrine",
    colour: "#f59e0b",
    glow: "rgba(245,158,11,0.4)",
    icon: "⚗️",
    drugs: [
      {
        name: "Metformin",
        year: 2,
        difficulty: "easy",
        questions: [
          { type: "mechanism",       q: "Metformin lowers blood glucose primarily by:",                                    a: "Inhibiting hepatic gluconeogenesis (via AMPK activation) and improving peripheral insulin sensitivity",                           options: ["Stimulating pancreatic insulin secretion", "Inhibiting hepatic gluconeogenesis via AMPK", "Blocking glucose absorption from gut", "Increasing urinary glucose excretion"], correct: 1 },
          { type: "indication",      q: "Metformin is the preferred first-line agent in type 2 diabetes because:",        a: "It does not cause hypoglycaemia, promotes modest weight loss, and has cardiovascular benefit (UKPDS)",                           options: ["It stimulates insulin secretion", "No hypoglycaemia, weight neutral/loss, CV benefit", "It can be used in renal failure", "It lowers HbA1c more than any other agent"], correct: 1 },
          { type: "side_effect",     q: "The most common side effect of metformin is:",                                   a: "GI disturbance — nausea, diarrhoea, abdominal discomfort (minimised by taking with food and dose titration)",                    options: ["Hypoglycaemia", "GI disturbance — nausea and diarrhoea", "Weight gain", "Peripheral oedema"], correct: 1 },
          { type: "contraindication",q: "Metformin is contraindicated when eGFR drops below which level?",              a: "eGFR <30 mL/min — lactic acidosis risk from reduced renal clearance; caution if eGFR 30-45",                                      options: ["eGFR <90", "eGFR <60", "eGFR <30 — lactic acidosis risk", "eGFR <45"], correct: 2 },
          { type: "interaction",     q: "Metformin should be withheld before IV contrast administration because:",        a: "IV contrast can cause acute kidney injury, reducing metformin excretion and precipitating lactic acidosis",                      options: ["Contrast reduces metformin absorption", "Contrast can cause AKI, reducing metformin clearance risking lactic acidosis", "They interact to cause anaphylaxis", "Contrast renders metformin ineffective"], correct: 1 },
        ]
      },
      {
        name: "Levothyroxine",
        year: 2,
        difficulty: "easy",
        questions: [
          { type: "mechanism",       q: "Levothyroxine (T4) exerts its effects by:",                                      a: "Converting to T3 peripherally, which binds nuclear receptors and regulates gene transcription affecting metabolism",               options: ["Directly stimulating TSH receptors", "Converting to T3 which binds nuclear receptors", "Inhibiting TSH secretion", "Activating thyroid peroxidase"], correct: 1 },
          { type: "indication",      q: "The target TSH range when treating hypothyroidism with levothyroxine is:",      a: "0.5–2.5 mU/L (within normal range) — adjust dose every 6–8 weeks based on TSH",                                                 options: ["TSH <0.1 (suppressed)", "TSH 0.5–2.5 mU/L", "TSH 5–10 mU/L", "TSH 2.5–5.0 mU/L"], correct: 1 },
          { type: "side_effect",     q: "Over-replacement with levothyroxine causes which cardiac complication?",        a: "Atrial fibrillation and tachyarrhythmias — exogenous thyrotoxicosis increases cardiac sympathetic tone",                         options: ["Complete heart block", "Atrial fibrillation and tachyarrhythmias", "Pericarditis", "QT prolongation"], correct: 1 },
          { type: "contraindication",q: "Levothyroxine dose must be reduced in which cardiovascular condition?",         a: "Ischaemic heart disease / angina — rapid correction of hypothyroidism increases cardiac demand and can precipitate MI",          options: ["Hypertension", "Ischaemic heart disease — start low, go slow", "Heart failure (stable)", "Peripheral vascular disease"], correct: 1 },
          { type: "interaction",     q: "Which medication reduces levothyroxine absorption when taken simultaneously?",  a: "Calcium carbonate, iron supplements, and antacids — chelate levothyroxine in the gut; take levothyroxine 4h apart",           options: ["Metformin", "Calcium/iron/antacids — chelation reduces absorption", "Atenolol", "Simvastatin"], correct: 1 },
        ]
      },
      {
        name: "Prednisolone",
        year: 3,
        difficulty: "medium",
        questions: [
          { type: "mechanism",       q: "Prednisolone reduces inflammation by which primary mechanism?",                 a: "Binds glucocorticoid receptors, inhibiting NF-κB and AP-1, reducing transcription of pro-inflammatory cytokines",               options: ["Inhibiting COX-1 and COX-2", "Binding glucocorticoid receptors, inhibiting NF-κB and pro-inflammatory genes", "Blocking histamine receptors", "Inhibiting phosphodiesterase"], correct: 1 },
          { type: "indication",      q: "Prednisolone is first-line treatment for which respiratory emergency?",         a: "Acute severe asthma — systemic corticosteroids reduce airway inflammation and prevent deterioration",                             options: ["Acute anaphylaxis (first-line)", "Acute severe asthma", "Pneumothorax", "Pulmonary embolism"], correct: 1 },
          { type: "side_effect",     q: "Long-term prednisolone use causes which metabolic syndrome?",                  a: "Cushing's syndrome — moon face, buffalo hump, central obesity, striae, hyperglycaemia, hypertension, osteoporosis",            options: ["Addison's disease features", "Cushing's syndrome — moon face, obesity, hyperglycaemia, osteoporosis", "Hypothyroidism", "Acromegaly features"], correct: 1 },
          { type: "contraindication",q: "Systemic corticosteroids should be used with extreme caution in:",            a: "Active untreated infections (especially TB, fungal) — steroids suppress immunity and can cause fulminant dissemination",         options: ["Mild asthma", "Active untreated infections — risk of dissemination", "Stable rheumatoid arthritis", "Moderate hypertension"], correct: 1 },
          { type: "interaction",     q: "Prednisolone combined with NSAIDs significantly increases the risk of:",       a: "Peptic ulceration and GI bleeding — both independently damage gastric mucosa; gastroprotection (PPI) should be co-prescribed",  options: ["Anaphylaxis", "Peptic ulceration and GI bleeding", "Hypokalaemia only", "Hepatotoxicity"], correct: 1 },
        ]
      },
    ]
  },

  // ══════════════════════════════════════════════════════════
  // ANTIMALARIALS/ANTIPARASITICS (segment colour: #10b981)
  // ══════════════════════════════════════════════════════════
  antimalarials: {
    label: "Antimalarials",
    colour: "#10b981",
    glow: "rgba(16,185,129,0.4)",
    icon: "🦟",
    drugs: [
      {
        name: "Artemether-Lumefantrine",
        year: 2,
        difficulty: "medium",
        questions: [
          { type: "mechanism",       q: "Artemether kills malaria parasites by:",                                          a: "Artemisinin endoperoxide bridge reacts with haem to generate free radicals that alkylate parasite proteins",                      options: ["Inhibiting dihydrofolate reductase", "Endoperoxide bridge generates haem-derived free radicals", "Blocking protein synthesis at 50S", "Inhibiting mitochondrial electron transport"], correct: 1 },
          { type: "indication",      q: "Artemether-lumefantrine (Coartem) is first-line treatment for:",                a: "Uncomplicated Plasmodium falciparum malaria in Kenya and most of sub-Saharan Africa",                                              options: ["Severe malaria requiring IV treatment", "Uncomplicated P. falciparum malaria", "Malaria prophylaxis", "P. vivax malaria (first line)"], correct: 1 },
          { type: "side_effect",     q: "Which cardiac side effect must be monitored with lumefantrine?",                a: "QT prolongation — lumefantrine blocks cardiac hERG channels extending the QT interval",                                          options: ["Bradycardia", "QT prolongation", "Ventricular hypertrophy", "Pericarditis"], correct: 1 },
          { type: "contraindication",q: "Artemether-lumefantrine should be taken with food because:",                    a: "Lumefantrine is highly lipophilic — food (especially fat) dramatically increases absorption from 16% to 90%",                    options: ["Food reduces GI side effects", "Food increases lumefantrine absorption from 16% to 90%", "Food reduces QT prolongation risk", "Food prevents vomiting"], correct: 1 },
          { type: "interaction",     q: "Artemether-lumefantrine must be used with caution with:",                       a: "Other QT-prolonging drugs (haloperidol, erythromycin, quinine) — additive QT prolongation and torsades de pointes risk",        options: ["Paracetamol", "QT-prolonging drugs — additive torsades risk", "Metformin", "Amoxicillin"], correct: 1 },
        ]
      },
      {
        name: "Quinine",
        year: 3,
        difficulty: "hard",
        questions: [
          { type: "mechanism",       q: "Quinine treats malaria by:",                                                     a: "Interfering with haem detoxification in the parasite's food vacuole — toxic haem accumulates killing the parasite",             options: ["Inhibiting folate synthesis", "Interfering with haem detoxification in the food vacuole", "Blocking ribosomes", "Inhibiting mitochondrial ATP synthesis"], correct: 1 },
          { type: "indication",      q: "Quinine IV is the treatment for:",                                              a: "Severe and complicated malaria (especially P. falciparum with cerebral malaria, severe anaemia, or organ failure)",             options: ["Uncomplicated malaria (first line)", "Severe/complicated falciparum malaria — IV artesunate preferred if available", "Malaria prophylaxis", "All malaria in pregnancy first trimester"], correct: 1 },
          { type: "side_effect",     q: "Cinchonism is a cluster of quinine side effects consisting of:",               a: "Tinnitus, high-frequency hearing loss, headache, nausea, and visual disturbances",                                               options: ["Nausea, vomiting, and diarrhoea", "Tinnitus, hearing loss, headache, visual disturbances", "Severe hypoglycaemia and seizures", "Rash and fever"], correct: 1 },
          { type: "contraindication",q: "Quinine should be used with extreme caution in patients taking:",              a: "Digoxin — quinine inhibits P-glycoprotein, raising digoxin levels and risking toxicity",                                          options: ["Paracetamol", "Digoxin — raises digoxin levels via P-gp inhibition", "Amoxicillin", "Metformin"], correct: 1 },
          { type: "interaction",     q: "Quinine causes severe hypoglycaemia particularly in which situation?",         a: "Stimulates insulin secretion from beta cells — risk highest in pregnant women and children with severe malaria",                 options: ["When taken on an empty stomach", "Stimulates insulin secretion — severe hypoglycaemia in pregnancy/children", "When given with dextrose", "When co-administered with metformin"], correct: 1 },
        ]
      },
    ]
  },

  // ══════════════════════════════════════════════════════════
  // ANALGESICS (segment colour: #f97316)
  // ══════════════════════════════════════════════════════════
  analgesics: {
    label: "Analgesics",
    colour: "#f97316",
    glow: "rgba(249,115,22,0.4)",
    icon: "💉",
    drugs: [
      {
        name: "Morphine",
        year: 2,
        difficulty: "medium",
        questions: [
          { type: "mechanism",       q: "Morphine produces analgesia by binding to which receptors?",                    a: "Mu (μ) opioid receptors primarily — in the brain, spinal cord, and peripheral tissues reducing pain transmission",             options: ["Kappa opioid receptors only", "Mu opioid receptors — brain, spinal cord, periphery", "NMDA receptors", "Serotonin receptors"], correct: 1 },
          { type: "indication",      q: "Morphine is the opioid of choice for pain in which condition?",                a: "Acute myocardial infarction — reduces pain, anxiety, and venodilation reduces preload",                                           options: ["Renal colic (first-line)", "Acute MI — analgesia and venodilation", "Headache", "Post-operative day surgery"], correct: 1 },
          { type: "side_effect",     q: "Which side effect of morphine does NOT develop tolerance?",                    a: "Constipation — tolerance does not develop to this effect; laxatives must always be prescribed with opioids",                   options: ["Nausea (tolerance develops)", "Sedation (tolerance develops)", "Constipation — no tolerance develops", "Euphoria (tolerance develops)"], correct: 2 },
          { type: "contraindication",q: "Morphine must be used with caution in which respiratory condition?",           a: "Acute asthma — morphine causes histamine release causing bronchoconstriction and respiratory depression",                      options: ["Stable COPD", "Acute asthma — histamine release and respiratory depression", "Pleural effusion", "Resolved pneumonia"], correct: 1 },
          { type: "interaction",     q: "Morphine combined with which drugs causes dangerous respiratory depression?",  a: "Benzodiazepines — synergistic CNS and respiratory depression; combination responsible for many overdose deaths",               options: ["Paracetamol", "Benzodiazepines — synergistic respiratory depression", "Metformin", "Amoxicillin"], correct: 1 },
        ]
      },
      {
        name: "Paracetamol",
        year: 1,
        difficulty: "easy",
        questions: [
          { type: "mechanism",       q: "The exact mechanism of paracetamol analgesia is not fully understood, but primarily involves:", a: "Inhibition of COX enzymes centrally (CNS) and possibly modulation of the endocannabinoid system — minimal peripheral anti-inflammatory effect", options: ["Peripheral COX-1 and COX-2 inhibition like NSAIDs", "Central COX inhibition and endocannabinoid modulation", "Opioid receptor agonism", "NMDA receptor blockade"], correct: 1 },
          { type: "indication",      q: "Paracetamol is the analgesic of choice in which patient group?",              a: "Pregnancy — safest analgesic at all stages of pregnancy when used at recommended doses",                                          options: ["Patients with peptic ulcer disease preferring strong analgesia", "Pregnant women — safest analgesic in pregnancy", "Patients with liver disease for maximum effect", "Asthmatics requiring NSAID-strength analgesia"], correct: 1 },
          { type: "side_effect",     q: "Paracetamol overdose causes death primarily through:",                        a: "Hepatocellular necrosis — depletion of glutathione leads to toxic NAPQI accumulation causing centrilobular liver necrosis",     options: ["Renal failure", "Hepatocellular necrosis — toxic NAPQI accumulates when glutathione depleted", "Cardiac arrhythmia", "Respiratory failure"], correct: 1 },
          { type: "contraindication",q: "The standard dose of paracetamol should be reduced in:",                      a: "Patients weighing <50 kg or those with hepatic impairment/chronic alcohol use — at risk of hepatotoxicity at standard doses",    options: ["Renal impairment (no dose change needed)", "Patients <50kg or with liver disease/alcohol", "Elderly patients only", "Patients with asthma"], correct: 1 },
          { type: "interaction",     q: "Which medication when co-ingested with paracetamol increases hepatotoxicity risk?", a: "Chronic alcohol — induces CYP2E1 which generates more NAPQI from paracetamol, depleting glutathione faster",              options: ["NSAIDs", "Chronic alcohol — CYP2E1 induction increases NAPQI generation", "Metformin", "Amoxicillin"], correct: 1 },
        ]
      },
    ]
  },

  // ══════════════════════════════════════════════════════════
  // RESPIRATORY (segment colour: #06b6d4)
  // ══════════════════════════════════════════════════════════
  respiratory: {
    label: "Respiratory",
    colour: "#06b6d4",
    glow: "rgba(6,182,212,0.4)",
    icon: "🫁",
    drugs: [
      {
        name: "Salbutamol",
        year: 2,
        difficulty: "easy",
        questions: [
          { type: "mechanism",       q: "Salbutamol relieves bronchospasm by:",                                          a: "Selective beta-2 adrenoceptor agonism in bronchial smooth muscle, causing relaxation and bronchodilation",                      options: ["Muscarinic receptor blockade", "Beta-2 agonism causing bronchial smooth muscle relaxation", "Mast cell stabilisation", "Leukotriene receptor blockade"], correct: 1 },
          { type: "indication",      q: "Salbutamol is the first-line reliever inhaler for:",                           a: "Acute asthma and bronchospasm — used as needed (SABA = short-acting beta-2 agonist)",                                          options: ["Long-term asthma prevention", "Acute bronchospasm (reliever)", "COPD maintenance (first-line)", "Allergic rhinitis"], correct: 1 },
          { type: "side_effect",     q: "Which metabolic side effect occurs with high-dose nebulised salbutamol?",      a: "Hypokalaemia — beta-2 stimulation drives K+ into cells via Na+/K+ ATPase",                                                    options: ["Hyperkalaemia", "Hypokalaemia — K+ driven intracellularly", "Hyponatraemia", "Hypercalcaemia"], correct: 1 },
          { type: "contraindication",q: "Salbutamol should be used with caution in which cardiac condition?",          a: "Hypertrophic obstructive cardiomyopathy (HOCM) — tachycardia from salbutamol can worsen outflow obstruction",                  options: ["Stable angina", "HOCM — tachycardia worsens outflow obstruction", "Atrial fibrillation only", "Mitral regurgitation"], correct: 1 },
          { type: "interaction",     q: "Non-selective beta-blockers (e.g. propranolol) antagonise salbutamol by:",     a: "Blocking beta-2 receptors in bronchial smooth muscle, preventing bronchodilation and potentially causing fatal bronchospasm",    options: ["Reducing its absorption", "Blocking beta-2 receptors — preventing bronchodilation and causing bronchospasm", "Increasing its renal clearance", "Causing QT prolongation"], correct: 1 },
        ]
      },
      {
        name: "Theophylline",
        year: 3,
        difficulty: "hard",
        questions: [
          { type: "mechanism",       q: "Theophylline causes bronchodilation by:",                                       a: "Inhibiting phosphodiesterase (PDE), raising intracellular cAMP, causing bronchial smooth muscle relaxation",                    options: ["Beta-2 receptor agonism", "Inhibiting phosphodiesterase raising cAMP", "Muscarinic receptor blockade", "Leukotriene synthesis inhibition"], correct: 1 },
          { type: "indication",      q: "Theophylline is now used as which line of treatment in asthma/COPD?",          a: "Third-line add-on therapy in COPD and difficult asthma — largely superseded by inhaled bronchodilators due to narrow therapeutic index", options: ["First-line in asthma", "Third-line add-on in COPD and difficult asthma", "Second-line after LABA", "It is no longer used"], correct: 1 },
          { type: "side_effect",     q: "Theophylline toxicity manifests as:",                                          a: "Nausea, vomiting, tachycardia, arrhythmias, and seizures — narrow therapeutic index (10–20 mg/L)",                             options: ["Bradycardia and hypotension", "Nausea, tachycardia, arrhythmias, seizures", "Peripheral neuropathy", "Visual disturbances only"], correct: 1 },
          { type: "contraindication",q: "Theophylline requires extreme caution in which condition?",                   a: "Epilepsy — theophylline lowers seizure threshold and can precipitate seizures at toxic levels",                                   options: ["Stable COPD", "Epilepsy — lowers seizure threshold", "Hypertension", "Renal impairment (mild)"], correct: 1 },
          { type: "interaction",     q: "Ciprofloxacin raises theophylline levels dangerously because:",               a: "Ciprofloxacin inhibits CYP1A2, the enzyme responsible for theophylline metabolism — levels can double causing toxicity",        options: ["It increases theophylline absorption", "CYP1A2 inhibition reduces theophylline clearance", "It displaces theophylline from protein binding", "It reduces renal excretion"], correct: 1 },
        ]
      },
    ]
  },

  // ══════════════════════════════════════════════════════════
  // GI (segment colour: #84cc16)
  // ══════════════════════════════════════════════════════════
  gi: {
    label: "GI Drugs",
    colour: "#84cc16",
    glow: "rgba(132,204,22,0.4)",
    icon: "🫀",
    drugs: [
      {
        name: "Omeprazole",
        year: 2,
        difficulty: "easy",
        questions: [
          { type: "mechanism",       q: "Omeprazole reduces gastric acid by:",                                           a: "Irreversibly binding and inhibiting H+/K+ ATPase (proton pump) on gastric parietal cells",                                       options: ["Blocking H2 histamine receptors", "Irreversibly inhibiting H+/K+ ATPase proton pump", "Neutralising stomach acid", "Reducing gastrin secretion"], correct: 1 },
          { type: "indication",      q: "Omeprazole is used for gastroprotection when co-prescribing which drug?",     a: "NSAIDs (and aspirin) — PPIs prevent NSAID-induced peptic ulceration",                                                           options: ["Antibiotics", "NSAIDs — reduces risk of peptic ulceration", "Antihypertensives", "Statins"], correct: 1 },
          { type: "side_effect",     q: "Long-term PPI use is associated with deficiency of which minerals/vitamins?", a: "Magnesium, calcium, vitamin B12, and iron — reduced acid impairs absorption",                                                 options: ["Vitamin D and zinc only", "Magnesium, calcium, B12, and iron deficiency", "Potassium and sodium", "Vitamin C only"], correct: 1 },
          { type: "contraindication",q: "PPIs should be used cautiously in patients with which condition?",            a: "Osteoporosis — long-term PPI use associated with increased fracture risk due to reduced calcium absorption",                    options: ["Hypertension", "Osteoporosis — reduced calcium absorption increases fracture risk", "Type 2 diabetes", "Atrial fibrillation"], correct: 1 },
          { type: "interaction",     q: "Omeprazole reduces the antiplatelet efficacy of which drug?",                 a: "Clopidogrel — omeprazole inhibits CYP2C19, reducing conversion of clopidogrel to its active metabolite",                       options: ["Aspirin (no interaction)", "Clopidogrel — CYP2C19 inhibition reduces activation", "Warfarin (increases effect)", "Ticagrelor (no interaction)"], correct: 1 },
        ]
      },
      {
        name: "Ondansetron",
        year: 2,
        difficulty: "medium",
        questions: [
          { type: "mechanism",       q: "Ondansetron prevents nausea and vomiting by blocking:",                        a: "5-HT3 (serotonin) receptors in the gut and chemoreceptor trigger zone (CTZ)",                                                   options: ["Dopamine D2 receptors", "5-HT3 serotonin receptors in gut and CTZ", "Histamine H1 receptors", "Muscarinic receptors"], correct: 1 },
          { type: "indication",      q: "Ondansetron is particularly effective for nausea caused by:",                 a: "Chemotherapy-induced nausea and vomiting (CINV) and post-operative nausea",                                                     options: ["Motion sickness", "Chemotherapy-induced and post-operative nausea", "Labyrinthitis", "Opioid-induced constipation"], correct: 1 },
          { type: "side_effect",     q: "Which serious cardiac side effect is associated with IV ondansetron?",        a: "QT prolongation — particularly at higher doses; risk of torsades de pointes",                                                  options: ["Severe bradycardia", "QT prolongation and torsades de pointes", "Complete heart block", "Ventricular hypertrophy"], correct: 1 },
          { type: "contraindication",q: "Ondansetron should be avoided in patients with:",                             a: "Congenital QT prolongation or those on other QT-prolonging drugs",                                                             options: ["Mild renal impairment", "Congenital QT prolongation or multiple QT-prolonging drugs", "Hypertension", "Diabetes mellitus"], correct: 1 },
          { type: "interaction",     q: "Ondansetron combined with tramadol reduces its efficacy because:",            a: "Tramadol's analgesic effect partly depends on serotonin release — 5-HT3 blockade by ondansetron reduces this component",        options: ["Ondansetron reduces tramadol absorption", "5-HT3 blockade reduces serotonergic component of tramadol's analgesia", "Ondansetron induces tramadol metabolism", "They compete for the same receptor"], correct: 1 },
        ]
      },
    ]
  }
};

// ── Flat list of all drugs for the wheel ──────────────────────────────────────
export const ALL_ROULETTE_DRUGS = Object.entries(PHARMA_ROULETTE_DRUGS).flatMap(
  ([category, data]) => data.drugs.map(drug => ({
    ...drug,
    category,
    categoryLabel: data.label,
    categoryColour: data.colour,
    categoryGlow: data.glow,
    categoryIcon: data.icon,
  }))
);

// ── Wheel segments (one per category) ────────────────────────────────────────
export const WHEEL_SEGMENTS = Object.entries(PHARMA_ROULETTE_DRUGS).map(([key, data]) => ({
  key,
  label: data.label,
  colour: data.colour,
  glow: data.glow,
  icon: data.icon,
  count: data.drugs.length,
}));

export default PHARMA_ROULETTE_DRUGS;