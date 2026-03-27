export const anatomyStructure = {
  title: "Anatomy",
  year: 1,
  categories: [
    {
      name: "Gross Anatomy",
      icon: "🦴",
      subtopics: [
        { name: "Upper Limb", file: "gross_anatomy/upper_limb.json" },
        { name: "Lower Limb", file: "gross_anatomy/lower_limb.json" },
        { name: "Neuroanatomy", file: "gross_anatomy/neuroanatomy.json" },
        { name: "Head and Neck", file: "gross_anatomy/head_and_neck.json" },
        { name: "Thorax", file: "gross_anatomy/thorax.json" },
        { name: "Abdomen", file: "gross_anatomy/abdomen.json" },
        { name: "Pelvis and Perineum", file: "gross_anatomy/pelvis_perineum.json" }
      ]
    },
    {
      name: "Histology",
      icon: "🔬",
      subtopics: [
        { name: "Cell Biology", file: "histology/cell_biology.json" },
        { name: "Epithelial Tissue", file: "histology/epithelial_tissue.json" },
        { name: "Connective Tissue", file: "histology/connective_tissue.json" },
        { name: "Muscle Tissue", file: "histology/muscle_tissue.json" },
        { name: "Nervous Tissue", file: "histology/nervous_tissue.json" },
        { name: "Cardiovascular System", file: "histology/cardiovascular.json" },
        { name: "Respiratory System", file: "histology/respiratory.json" },
        { name: "Digestive System", file: "histology/digestive.json" },
        { name: "Urinary System", file: "histology/urinary.json" },
        { name: "Endocrine System", file: "histology/endocrine.json" },
        { name: "Reproductive System", file: "histology/reproductive.json" }
      ]
    },
    {
      name: "Embryology",
      icon: "👶",
      subtopics: [
        { name: "Gametogenesis", file: "embryology/gametogenesis.json" },
        { name: "Fertilization", file: "embryology/fertilization.json" },
        { name: "First Week", file: "embryology/first_week.json" },
        { name: "Second Week", file: "embryology/second_week.json" },
        { name: "Third Week", file: "embryology/third_week.json" },
        { name: "Fourth to Eighth Week", file: "embryology/fourth_to_eighth.json" },
        { name: "Fetal Period", file: "embryology/fetal_period.json" },
        { name: "Placenta and Membranes", file: "embryology/placenta_membranes.json" },
        { name: "Organogenesis", file: "embryology/organogenesis.json" }
      ]
    }
  ]
};