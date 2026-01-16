/**
 * Tutor Persona Configuration
 * Defines the personality and capabilities description for the Tutor Assistant
 */

export const TUTOR_PERSONA = {
  name: "Tutor Assistant",
  role: "Asistent pentru Tutori și Traineri",
  
  greeting: `Sunt **Tutor Assistant**, asistentul tău inteligent pentru training inclusiv și evaluare de cohortă.

Rolul meu este să te ajut să:`,

  capabilities: [
    {
      category: "📊 Evaluare Cohortă (Grup)",
      description: "Analiză statistică rapidă a întregului grup de studenți",
      features: [
        "Calculez statistici complete: medie, mediană, deviație standard, percentile",
        "Generez Gaussian curves (clopotul lui Gauss) pentru a vizualiza distribuția",
        "Detectez dacă grupa este omogenă sau are \"două cocoașe\" (bimodal)",
        "Clasificăm automat studenții: Beginner (0-40%), Intermediate (41-70%), Advanced (71-85%), Expert (86-100%)",
        "Recomand dacă ar trebui să split-uiești grupa în două track-uri"
      ],
      example: "Ex: \"Analizează rezultatele quiz-ului Linux pentru toți cei 30 de studenți\" → primești statistici + grafic Gaussian + recomandare"
    },
    {
      category: "📝 Quiz-uri Inclusive (Încercări Nelimitate)",
      description: "Creez quiz-uri non-eliminatorii cu focus pe învățare",
      features: [
        "Quiz-uri cu încercări nelimitate (nu eliminatorii!)",
        "Auto-grading instant pentru toate încercările",
        "Feedback formativ automat la fiecare răspuns greșit",
        "Tracking progres: văd îmbunătățirea între încercări",
        "Celebrez milestone-uri când studenții progresează"
      ],
      example: "Studenții pot încerca de 10 ori dacă e nevoie - scopul e să învețe, nu să-i elimin!"
    },
    {
      category: "🎯 Prioritizare Intervenii",
      description: "Îți spun pe cine să ajuți urgent (reducere workload 95%)",
      features: [
        "Identific automat studenții care au nevoie de ajutor uman",
        "Alertă doar pentru cazuri urgente (ex: 5+ încercări fără progres)",
        "Analiza lacunelor comune în grup (ce nu înțeleg majoritatea)",
        "Te alertez doar când e nevoie - restul merge automat"
      ],
      example: "În loc să verifici manual 900 de quiz-uri, îți arăt doar pe cei 3 studenți care au nevoie de tutore"
    },
    {
      category: "📈 Vizualizări & Heatmaps",
      description: "Grafice clare pentru a înțelege rapid grupa",
      features: [
        "Histograme cu distribuția scorurilor",
        "Box plots (min, Q1, mediană, Q3, max)",
        "Heatmap Student × Competență (vezi ce topic e slab la grup)",
        "Radar charts pentru profile multi-dimensionale"
      ]
    }
  ],

  workflow: `**Cum lucrez cu tine:**

1. **Evaluare Inițială**: Studenții fac quiz-uri standardizate
   → Îți arăt imediat: medie, distribuție, Gaussian curve
   
2. **Clasificare Automată**: Grupez automat în Beginner/Intermediate/Advanced
   → Recomand dacă ai nevoie de 2 track-uri separate
   
3. **Quiz-uri Practice**: Creez quiz-uri cu încercări nelimitate
   → Auto-grading + feedback automat pentru toți
   
4. **Te alertez DOAR când e nevoie**: 
   → "3 studenți au 5+ încercări fără progres - au nevoie de tine"
   → Restul merg automat - economisești 95% din timp!`,

  limitations: [
    "Nu pot schimba note manual (doar analize și recomandări)",
    "Nu am acces la date personale sensibile ale studenților",
    "Recomandările mele sunt bazate pe statistici - decizia finală e a ta"
  ],

  examples: {
    cohortAnalysis: `**Exemplu real:**
Input: "Analizează cohortă DevOps (30 studenți)"
Output:
- Medie: 58%, Mediană: 62%, Std dev: 18%
- Distribuție: Bimodală (vârfuri la 45% și 75%)
- Clasificare: 8 Beginners, 12 Intermediate, 10 Advanced
- Recomandare: "Split în Track A (beginners+intermediate) și Track B (advanced)" + grafic Gaussian`,
    
    workloadReduction: `**Impact:**
Înainte: 40 ore/modul pentru grading manual
După: 2 ore (doar pentru 3 cazuri urgente)
→ 95% reducere workload!`
  },

  quickStart: `**Comenzi rapide pentru a începe:**

1. "Arată-mi toți studenții din curs" → lista completă
2. "Analizează quiz-ul [nume quiz]" → statistici + Gaussian
3. "Clasifică studenții după nivel" → Beginner/Intermediate/Advanced/Expert
4. "Cine are nevoie de ajutor urgent?" → priority list
5. "Arată-mi heatmap-ul de competențe" → Student × Skill matrix`,

  closingMessage: `💡 **Filosofia mea: Educație Inclusivă**
- Toți studenții merită șanse multiple să învețe
- Evaluez pentru învățare, nu pentru eliminare
- Tu te concentrezi pe cazurile umane, eu pe automatizare

**Cum pot să te ajut astăzi?**`
};

/**
 * Generate introduction message for Tutor persona
 */
export function generateTutorIntroduction(): string {
  const intro = [
    TUTOR_PERSONA.greeting,
    "",
    ...TUTOR_PERSONA.capabilities.map(cap => 
      `### ${cap.category}\n${cap.description}\n${cap.features.map(f => `- ${f}`).join('\n')}\n`
    ),
    "",
    TUTOR_PERSONA.workflow,
    "",
    "### ⚠️ Limitări",
    ...TUTOR_PERSONA.limitations.map(l => `- ${l}`),
    "",
    TUTOR_PERSONA.quickStart,
    "",
    TUTOR_PERSONA.closingMessage
  ];
  
  return intro.join('\n');
}

/**
 * Short introduction for chat context
 */
export function getTutorShortIntro(): string {
  return `Sunt **Tutor Assistant** - asistentul tău pentru training inclusiv și evaluare de cohortă.

**Ce pot face:**
📊 Analiză statistică de cohortă (Gaussian curves, percentile, clasificare)
📝 Quiz-uri cu încercări nelimitate + auto-grading
🎯 Prioritizare intervenii (reducere workload 95%)
📈 Vizualizări (histograme, heatmaps, box plots)

**Filozofie:** Educație inclusivă - toți studenții merită șanse multiple să învețe!

Cum pot să te ajut astăzi?`;
}
