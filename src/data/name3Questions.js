// src/data/name3Questions.js
// "Name 3 in 10" question bank
// Each question has a prompt + an `answers` array (accepted answers)
// `aliases` = alternative phrasings that should be accepted for each answer

export const NAME3_QUESTIONS = [

  // ── ANATOMY ──────────────────────────────────────────────────────────────
  {
    id: "n3_001", subject: "Anatomy", year: [1,2,3,4,5,6],
    prompt: "Name 3 bones of the upper limb",
    answers: ["humerus","radius","ulna","scaphoid","lunate","triquetrum","pisiform","trapezium","trapezoid","capitate","hamate","metacarpal","phalanx","clavicle","scapula"],
    required: 3,
  },
  {
    id: "n3_002", subject: "Anatomy", year: [1,2,3,4,5,6],
    prompt: "Name 3 muscles of the rotator cuff",
    answers: ["supraspinatus","infraspinatus","teres minor","subscapularis"],
    required: 3,
  },
  {
    id: "n3_003", subject: "Anatomy", year: [1,2,3,4,5,6],
    prompt: "Name 3 branches of the facial nerve (CN VII)",
    answers: ["temporal","zygomatic","buccal","marginal mandibular","cervical","posterior auricular"],
    required: 3,
  },
  {
    id: "n3_004", subject: "Anatomy", year: [1,2,3,4,5,6],
    prompt: "Name 3 contents of the femoral triangle",
    answers: ["femoral nerve","femoral artery","femoral vein","femoral canal","lymphatics","deep inguinal lymph nodes"],
    required: 3,
  },
  {
    id: "n3_005", subject: "Anatomy", year: [1,2,3,4,5,6],
    prompt: "Name 3 layers of the scalp",
    answers: ["skin","connective tissue","aponeurosis","loose areolar tissue","pericranium","galea aponeurotica"],
    required: 3,
  },

  // ── PHYSIOLOGY ────────────────────────────────────────────────────────────
  {
    id: "n3_010", subject: "Physiology", year: [1,2,3,4,5,6],
    prompt: "Name 3 functions of the liver",
    answers: ["bile production","detoxification","protein synthesis","glycogen storage","gluconeogenesis","lipid metabolism","clotting factor synthesis","urea synthesis","albumin production","drug metabolism","hormone degradation"],
    required: 3,
  },
  {
    id: "n3_011", subject: "Physiology", year: [1,2,3,4,5,6],
    prompt: "Name 3 hormones released by the anterior pituitary",
    answers: ["FSH","LH","ACTH","TSH","GH","growth hormone","prolactin","follicle stimulating hormone","luteinizing hormone","adrenocorticotropic hormone","thyroid stimulating hormone"],
    required: 3,
  },
  {
    id: "n3_012", subject: "Physiology", year: [1,2,3,4,5,6],
    prompt: "Name 3 electrolytes regulated by the kidney",
    answers: ["sodium","potassium","calcium","phosphate","bicarbonate","magnesium","chloride","hydrogen"],
    required: 3,
  },
  {
    id: "n3_013", subject: "Physiology", year: [2,3,4,5,6],
    prompt: "Name 3 actions of insulin",
    answers: ["glucose uptake","glycogen synthesis","glycogenesis","lipogenesis","protein synthesis","inhibits gluconeogenesis","inhibits lipolysis","inhibits glycogenolysis","lowers blood glucose","potassium uptake"],
    required: 3,
  },
  {
    id: "n3_014", subject: "Physiology", year: [1,2,3,4,5,6],
    prompt: "Name 3 components of the cardiac conduction system",
    answers: ["SA node","sinoatrial node","AV node","atrioventricular node","bundle of his","left bundle branch","right bundle branch","purkinje fibres","purkinje fibers"],
    required: 3,
  },

  // ── PHARMACOLOGY ──────────────────────────────────────────────────────────
  {
    id: "n3_020", subject: "Pharmacology", year: [2,3,4,5,6],
    prompt: "Name 3 side effects of ACE inhibitors",
    answers: ["dry cough","hypotension","hyperkalemia","hyperkalaemia","angioedema","renal impairment","renal failure","dizziness","headache","fatigue","rash","taste disturbance","first dose hypotension"],
    required: 3,
  },
  {
    id: "n3_021", subject: "Pharmacology", year: [2,3,4,5,6],
    prompt: "Name 3 classes of antibiotics",
    answers: ["penicillins","cephalosporins","aminoglycosides","macrolides","fluoroquinolones","tetracyclines","carbapenems","monobactams","lincosamides","glycopeptides","sulfonamides","nitroimidazoles","oxazolidinones","polymyxins"],
    required: 3,
  },
  {
    id: "n3_022", subject: "Pharmacology", year: [3,4,5,6],
    prompt: "Name 3 drugs used in hypertension",
    answers: ["amlodipine","lisinopril","ramipril","atenolol","bisoprolol","losartan","valsartan","furosemide","bendroflumethiazide","indapamide","spironolactone","doxazosin","hydralazine","nifedipine","felodipine"],
    required: 3,
  },
  {
    id: "n3_023", subject: "Pharmacology", year: [3,4,5,6],
    prompt: "Name 3 opioid analgesics",
    answers: ["morphine","codeine","fentanyl","tramadol","oxycodone","hydromorphone","pethidine","methadone","buprenorphine","diamorphine","heroin","nalbuphine"],
    required: 3,
  },
  {
    id: "n3_024", subject: "Pharmacology", year: [2,3,4,5,6],
    prompt: "Name 3 beta-blocker drugs",
    answers: ["atenolol","bisoprolol","metoprolol","propranolol","carvedilol","labetalol","nadolol","sotalol","timolol","nebivolol"],
    required: 3,
  },

  // ── PATHOLOGY ─────────────────────────────────────────────────────────────
  {
    id: "n3_030", subject: "Pathology", year: [3,4,5,6],
    prompt: "Name 3 features of malignancy",
    answers: ["invasion","metastasis","anaplasia","pleomorphism","increased mitosis","nuclear hyperchromatism","abnormal mitoses","loss of differentiation","necrosis","vascular invasion","lymphatic invasion","perineural invasion"],
    required: 3,
  },
  {
    id: "n3_031", subject: "Pathology", year: [3,4,5,6],
    prompt: "Name 3 causes of hepatomegaly",
    answers: ["hepatitis","cirrhosis","fatty liver","NAFLD","cardiac failure","right heart failure","malaria","amyloidosis","haematological malignancy","lymphoma","leukaemia","leukemia","hepatocellular carcinoma","metastatic disease","storage disorders","glycogen storage disease"],
    required: 3,
  },
  {
    id: "n3_032", subject: "Pathology", year: [3,4,5,6],
    prompt: "Name 3 types of necrosis",
    answers: ["coagulative","liquefactive","caseous","fat necrosis","fibrinoid","gangrenous","dry gangrene","wet gangrene"],
    required: 3,
  },

  // ── MICROBIOLOGY ──────────────────────────────────────────────────────────
  {
    id: "n3_040", subject: "Microbiology", year: [2,3,4,5,6],
    prompt: "Name 3 gram-positive bacteria",
    answers: ["staphylococcus aureus","streptococcus pneumoniae","streptococcus pyogenes","enterococcus","listeria","bacillus","clostridium","corynebacterium","staphylococcus","streptococcus","MRSA","lactobacillus"],
    required: 3,
  },
  {
    id: "n3_041", subject: "Microbiology", year: [2,3,4,5,6],
    prompt: "Name 3 modes of disease transmission",
    answers: ["airborne","droplet","contact","fomite","vector-borne","faecal-oral","fecal-oral","sexual","vertical","transplacental","bloodborne","waterborne"],
    required: 3,
  },
  {
    id: "n3_042", subject: "Microbiology", year: [3,4,5,6],
    prompt: "Name 3 causes of meningitis",
    answers: ["neisseria meningitidis","streptococcus pneumoniae","listeria","haemophilus influenzae","escherichia coli","group B strep","cryptococcus","TB","tuberculosis","viral","enterovirus","herpes simplex","HSV"],
    required: 3,
  },

  // ── HAEMATOLOGY ───────────────────────────────────────────────────────────
  {
    id: "n3_050", subject: "Haematology", year: [3,4,5,6],
    prompt: "Name 3 causes of anaemia",
    answers: ["iron deficiency","vitamin B12 deficiency","folate deficiency","haemolysis","chronic disease","aplastic anaemia","blood loss","thalassaemia","sickle cell","renal failure","anaemia of chronic disease","bone marrow failure","pernicious anaemia"],
    required: 3,
  },
  {
    id: "n3_051", subject: "Haematology", year: [3,4,5,6],
    prompt: "Name 3 clotting factors",
    answers: ["factor I","factor II","fibrinogen","prothrombin","factor V","factor VII","factor VIII","factor IX","factor X","factor XI","factor XII","von willebrand factor","tissue factor","factor III","factor IV","calcium"],
    required: 3,
  },
  {
    id: "n3_052", subject: "Haematology", year: [3,4,5,6],
    prompt: "Name 3 features of sickle cell crisis",
    answers: ["pain","bone pain","vaso-occlusion","acute chest syndrome","stroke","splenic sequestration","aplastic crisis","priapism","hand-foot syndrome","dactylitis","fever","anaemia","jaundice"],
    required: 3,
  },

  // ── IMMUNOLOGY ────────────────────────────────────────────────────────────
  {
    id: "n3_060", subject: "Immunology", year: [2,3,4,5,6],
    prompt: "Name 3 types of hypersensitivity reactions",
    answers: ["type I","type II","type III","type IV","IgE mediated","cytotoxic","immune complex","delayed","anaphylactic","antibody dependent","T cell mediated","cell mediated"],
    required: 3,
  },
  {
    id: "n3_061", subject: "Immunology", year: [2,3,4,5,6],
    prompt: "Name 3 cytokines and their roles",
    answers: ["IL-1","IL-2","IL-4","IL-6","IL-10","IL-12","TNF","interferon gamma","TGF-beta","IL-17","IL-23","interleukin 1","interleukin 2","tumour necrosis factor","tumor necrosis factor"],
    required: 3,
  },

  // ── CLINICAL ──────────────────────────────────────────────────────────────
  {
    id: "n3_070", subject: "Clinical", year: [4,5,6],
    prompt: "Name 3 causes of chest pain",
    answers: ["MI","myocardial infarction","angina","pericarditis","pulmonary embolism","PE","aortic dissection","pneumothorax","oesophageal spasm","esophageal spasm","pleurisy","costochondritis","GERD","musculoskeletal","panic attack","herpes zoster"],
    required: 3,
  },
  {
    id: "n3_071", subject: "Clinical", year: [4,5,6],
    prompt: "Name 3 signs of dehydration",
    answers: ["dry mucous membranes","reduced skin turgor","tachycardia","hypotension","sunken eyes","reduced urine output","oliguria","dark urine","thirst","dizziness","confusion","dry tongue","capillary refill time","postural hypotension"],
    required: 3,
  },
  {
    id: "n3_072", subject: "Clinical", year: [4,5,6],
    prompt: "Name 3 causes of clubbing",
    answers: ["lung cancer","bronchiectasis","cystic fibrosis","lung abscess","empyema","infective endocarditis","congenital heart disease","inflammatory bowel disease","crohn's disease","ulcerative colitis","cirrhosis","mesothelioma","idiopathic"],
    required: 3,
  },
];

// Pull questions appropriate for a given year
export function getQuestionsForYear(year = 1) {
  const y = parseInt(year) || 1;
  return NAME3_QUESTIONS.filter(q => q.year.includes(y));
}

// Seeded shuffle so each session feels different
export function shuffleForSession(arr) {
  const seed = Date.now();
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}