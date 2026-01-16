/**
 * Persona Information Tool
 * Returns Tutor Assistant introduction and capabilities
 */

import { getTutorShortIntro, TUTOR_PERSONA } from '../persona-config.js';

/**
 * Get Tutor Persona Introduction
 * Use this tool when user asks "Who are you?" or "What can you do?"
 */
export function getTutorPersonaInfo(): {
  shortIntro: string;
  fullIntro: string;
  capabilities: typeof TUTOR_PERSONA.capabilities;
  quickStart: string;
} {
  return {
    shortIntro: getTutorShortIntro(),
    fullIntro: TUTOR_PERSONA.greeting + '\n\n' + 
               TUTOR_PERSONA.capabilities.map(cap => 
                 `### ${cap.category}\n${cap.description}\n${cap.features.map(f => `- ${f}`).join('\n')}`
               ).join('\n\n'),
    capabilities: TUTOR_PERSONA.capabilities,
    quickStart: TUTOR_PERSONA.quickStart
  };
}

/**
 * Get role-specific help based on user type
 */
export function getTutorHelpForRole(role: 'tutor' | 'trainer' | 'mentor' | 'teacher'): string {
  return `
Perfect! Ca **${role}**, iată exact cum te pot ajuta:

## 📊 Evaluare Cohortă (prima ta prioritate!)

**De ce:** Îți arată instant "peisajul" clasei - cine e unde, dacă ai nevoie de 2 track-uri separate.

**Cum funcționează:**
1. Studenții fac un quiz standardizat (Linux, Networking, CI/CD etc.)
2. Eu calculez instant:
   - Medie: 58%, Mediană: 62%, Std dev: 18%
   - Gaussian curve (clopotul lui Gauss) - vezi distribuția
   - Detectez dacă ai "două cocoașe" (bimodal) = două grupuri distincte
3. Clasificare automată:
   - 8 studenți = Beginner (0-40%)
   - 12 studenți = Intermediate (41-70%)
   - 10 studenți = Advanced (71-85%)
4. Recomandare: "Split în Track A și Track B pentru rezultate optime"

**Timp necesar:** 2 ore (vs 1 săptămână manual!)

---

## 📝 Quiz-uri Inclusive (economisești 95% timp!)

**Problema clasică:** 
- 50 studenți × 10 quiz-uri × 3 încercări = 1,500 de grading-uri manual
- Tu petreci 40 ore/modul verificând și dând feedback

**Soluția mea:**
1. Creez quiz-uri cu **încercări nelimitate** (nu eliminatorii!)
2. Auto-grading instant pentru toate încercările
3. Feedback personalizat automat: "Greșeală la permissions: revizualizează chmod"
4. Tracking îmbunătățire: Încercarea 1: 45% → Încercarea 3: 82%
5. Te alertez DOAR pentru 3 studenți cu 5+ încercări fără progres

**Rezultat:** Tu petreci doar 2 ore (vs 40 ore) → **95% reducere workload**!

---

## 🎯 Cine Are Nevoie de Tine?

**Problema:** Nu poți să ajuți manual pe toți 50 de studenți.

**Soluția:**
- Analizez automat toate încercările
- Identific: "Maria - 6 încercări la Linux, încă la 40%, blocat la permissions"
- Priority list: Top 5 studenți care au URGENT nevoie de tutore
- Restul de 45 studenți merg singuri cu auto-grading + feedback

**Efect:** Tu ajuți doar pe cei care au nevoie, restul merg automat!

---

## 📈 Vizualizări Clare

- **Heatmap Student × Competență**: Vezi că majoritatea au lacune la Networking
- **Box plot**: Vezi outliers (foarte slabi / foarte buni)
- **Histograme**: Distribuție clară a scorurilor

---

## 💡 Cum să începi ACUM

**Comandă 1:** "Arată-mi toți studenții din curs"
→ Vezi lista completă

**Comandă 2:** "Analizează quiz-ul [nume]"
→ Primești statistici + Gaussian + clasificare

**Comandă 3:** "Cine are nevoie urgent de ajutor?"
→ Priority list cu top studenți

**Comandă 4:** "Creează quiz Linux cu încercări nelimitate"
→ Setup automat pentru training inclusiv

---

**Ce vrei să facem primul: evaluare cohortă sau setup quiz-uri inclusive?**
`;
}
