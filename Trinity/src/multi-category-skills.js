/**
 * @module TRINITY_OMNI_CORE
 * @subsystem CORE_RUNTIME
 * @author Basterix (Root Architect)
 * @license Sovereign Irrevocable Covenant
 * @description Modul multi-category-skills.js (Trinity/src/multi-category-skills.js) v ekosystéme TRINITY OMNI-CORE.
 */
/**
 * Trinity Multi-Category Skills & Tool Suite
 * Poskytuje skutočné, overiteľné a vysoko kvalitné nástroje pre:
 * - Vývojárov (Regex tester, JSON Schema validácia, Analýza kódu)
 * - Zábavu & Hry (RPG quest master, Trivia quiz engine, Generátor hádaniek)
 * - Vzdelávanie & Učenie (Jazykový lektor, Matematický rozbor, Leitner kartičky)
 * - Životný štýl & Zdravie (Sledovanie návykov, Výpočet makroživín, Dychové cvičenia)
 * - Kreatívnu tvorbu (Rýmy a poézia, Formátovač scenárov)
 * - Vedu & Prieskum (Periodická tabuľka prvkov, Fyzikálne konštanty a kalkulácie)
 */

function stripDiacritics(str) {
  return String(str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// ==========================================
// 1. VÝVOJÁRSKE NÁSTROJE (DEVELOPER TOOLBOX)
// ==========================================

export const developerSkills = {
  regexTester: (params) => {
    const pattern = typeof params === 'string' ? params : params?.pattern;
    const flags = typeof params === 'object' && params?.flags ? String(params.flags) : 'g';
    const text = typeof params === 'object' && params?.text !== undefined ? String(params.text) : '';

    if (!pattern || typeof pattern !== 'string') {
      return { success: false, error: 'Chýba regulárny výraz (pattern).' };
    }
    if (pattern.length > 500) {
      return { success: false, error: 'Regulárny výraz presahuje maximálnu dĺžku 500 znakov.' };
    }
    const cleanFlags = flags.replace(/[^gimsuy]/g, '');

    try {
      const start = Date.now();
      const regex = new RegExp(pattern, cleanFlags);
      const matches = [];
      let match;

      if (cleanFlags.includes('g')) {
        let iterations = 0;
        while ((match = regex.exec(text)) !== null && iterations < 500) {
          matches.push({
            match: match[0],
            index: match.index,
            groups: match.slice(1)
          });
          if (regex.lastIndex === match.index) {
            regex.lastIndex++;
          }
          iterations++;
        }
      } else {
        match = regex.exec(text);
        if (match) {
          matches.push({
            match: match[0],
            index: match.index,
            groups: match.slice(1)
          });
        }
      }

      return {
        success: true,
        pattern,
        flags: cleanFlags,
        is_match: matches.length > 0,
        match_count: matches.length,
        matches: matches.slice(0, 100),
        duration_ms: Date.now() - start
      };
    } catch (err) {
      return { success: false, error: `Chyba syntaxe regulárneho výrazu: ${err.message}` };
    }
  },

  jsonSchemaValidate: (params) => {
    if (!params || typeof params !== 'object') {
      return { success: false, error: 'Očakáva sa objekt s poliami { schema, data }.' };
    }
    const { schema, data } = params;
    if (!schema || typeof schema !== 'object') {
      return { success: false, error: 'Chýba schéma alebo nie je platný objekt.' };
    }
    if (data === undefined) {
      return { success: false, error: 'Chýbajú dáta na validáciu.' };
    }

    const errors = [];

    function validateNode(expected, value, path = '$') {
      if (expected.type) {
        const actualType = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;
        if (expected.type === 'integer') {
          if (typeof value !== 'number' || !Number.isInteger(value)) {
            errors.push(`${path}: očakávaný typ 'integer', prijaté '${actualType}'`);
          }
        } else if (expected.type !== actualType) {
          errors.push(`${path}: očakávaný typ '${expected.type}', prijaté '${actualType}'`);
          return;
        }
      }

      if (expected.required && Array.isArray(expected.required) && typeof value === 'object' && value !== null) {
        for (const req of expected.required) {
          if (!(req in value)) {
            errors.push(`${path}: chýba povinné pole '${req}'`);
          }
        }
      }

      if (expected.properties && typeof value === 'object' && value !== null) {
        for (const [key, propSchema] of Object.entries(expected.properties)) {
          if (key in value) {
            validateNode(propSchema, value[key], `${path}.${key}`);
          }
        }
      }

      if (typeof value === 'string') {
        if (typeof expected.minLength === 'number' && value.length < expected.minLength) {
          errors.push(`${path}: dĺžka reťazca (${value.length}) je menšia ako minLength (${expected.minLength})`);
        }
        if (typeof expected.maxLength === 'number' && value.length > expected.maxLength) {
          errors.push(`${path}: dĺžka reťazca (${value.length}) je väčšia ako maxLength (${expected.maxLength})`);
        }
      }

      if (typeof value === 'number') {
        if (typeof expected.minimum === 'number' && value < expected.minimum) {
          errors.push(`${path}: hodnota (${value}) je menšia ako minimum (${expected.minimum})`);
        }
        if (typeof expected.maximum === 'number' && value > expected.maximum) {
          errors.push(`${path}: hodnota (${value}) je väčšia ako maximum (${expected.maximum})`);
        }
      }
    }

    validateNode(schema, data);

    return {
      success: true,
      valid: errors.length === 0,
      errors_count: errors.length,
      errors
    };
  },

  codeSnippetAnalyze: (params) => {
    const code = typeof params === 'string' ? params : params?.code;
    const language = typeof params === 'object' && params?.language ? String(params.language).toLowerCase() : 'auto';

    if (typeof code !== 'string' || !code.trim()) {
      return { success: false, error: 'Chýba kód na analýzu.' };
    }

    const lines = code.split(/\r?\n/);
    const totalLines = lines.length;
    let commentLines = 0;
    let blankLines = 0;
    let codeLines = 0;
    let branchComplexity = 1;

    const branchPatterns = /\b(if|else\s+if|for|while|switch|case|catch|&&|\|\||\?)\b/g;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        blankLines++;
      } else if (line.startsWith('//') || line.startsWith('#') || line.startsWith('/*') || line.startsWith('*')) {
        commentLines++;
      } else {
        codeLines++;
        const matches = line.match(branchPatterns);
        if (matches) {
          branchComplexity += matches.length;
        }
      }
    }

    let detectedLang = language !== 'auto' ? language : 'unknown';
    if (detectedLang === 'unknown') {
      if (code.includes('def ') || code.includes('import numpy') || code.includes('print(')) detectedLang = 'python';
      else if (code.includes('function') || code.includes('const ') || code.includes('console.log')) detectedLang = 'javascript';
      else if (code.includes('public class') || code.includes('System.out.println')) detectedLang = 'java';
      else if (code.includes('#include <') || code.includes('std::')) detectedLang = 'cpp';
      else if (code.includes('SELECT ') && code.includes('FROM ')) detectedLang = 'sql';
      else if (code.includes('<html>') || code.includes('<div')) detectedLang = 'html';
    }

    return {
      success: true,
      detected_language: detectedLang,
      metrics: {
        total_lines: totalLines,
        code_lines: codeLines,
        comment_lines: commentLines,
        blank_lines: blankLines,
        comment_ratio_pct: totalLines ? Math.round((commentLines / totalLines) * 100) : 0,
        estimated_cyclomatic_complexity: branchComplexity
      },
      evaluation: branchComplexity > 15 ? 'Vysoká zložitosť – odporúčaný refaktoring.' : branchComplexity > 8 ? 'Stredná zložitosť.' : 'Čistý a jednoduchý kód.'
    };
  }
};

// ==========================================
// 2. ZÁBAVA, HRY & VOĽNÝ ČAS (ENTERTAINMENT & ARCADE)
// ==========================================

export const entertainmentSkills = {
  rpgQuestMaster: (params = {}) => {
    const action = params.action || 'start';
    let state = params.state || {
      hero: { name: params.heroName || 'Aura Knight', class: params.heroClass || 'Warrior', hp: 100, maxHp: 100, mana: 50, gold: 20, level: 1, xp: 0 },
      inventory: ['Liečivý elixír', 'Bronzový meč'],
      location: 'Brána do Tieňovej veže',
      turn: 1
    };

    const roll = typeof params.roll === 'number' ? params.roll : Math.floor(Math.random() * 20) + 1;
    let storyBeat = '';
    let choices = [];

    if (action === 'start') {
      storyBeat = `Stojíš pred masívnymi kamennými dverami Tieňovej veže. Vzduchom sa nesie chlad a ozvena starodávnych kúzel. Tvoja zbraň (${state.inventory[1] || 'Zbraň'}) sa mierne leskne.`;
      choices = [
        'Vstúpiť cez hlavnú bránu (akcia: enter_gate)',
        'Preskúmať tajnú chodbu pod klenbami (akcia: explore_tunnel)',
        'Otvoriť batoh a použiť predmet (akcia: use_item)'
      ];
    } else if (action === 'enter_gate') {
      state.turn++;
      if (roll >= 10) {
        state.hero.xp += 25;
        state.hero.gold += 15;
        storyBeat = `Hod d20: ${roll} (Úspech!). Prekĺzol si okolo spiaceho kamenného chrliča. Získal si 15 zlatých mincí z opustenej truhlice.`;
        state.location = 'Veľká sieň s runovým oltárom';
      } else {
        const dmg = 15;
        state.hero.hp = Math.max(0, state.hero.hp - dmg);
        storyBeat = `Hod d20: ${roll} (Neúspech!). Kamenný chrlič sa prebudil a zasiahol ťa pazúrom za ${dmg} HP.`;
        state.location = 'Brána do Tieňovej veže (po boji)';
      }
      choices = ['Preskúmať runový oltár', 'Pokračovať po točitom schodisku nahor', 'Použiť liečivý elixír'];
    } else if (action === 'explore_tunnel') {
      state.turn++;
      state.hero.xp += 30;
      if (!state.inventory.includes('Kľúč z temného kryštálu')) {
        state.inventory.push('Kľúč z temného kryštálu');
      }
      storyBeat = `V úzkej vlhkej chodbe si našiel starobylý artefakt: Kľúč z temného kryštálu! Cítiš z neho prúdenie tajomnej energie.`;
      choices = ['Vrátiť sa k hlavnej sieni', 'Vložiť kľúč do tajnej niky v stene'];
    } else {
      storyBeat = `Vykonal si akciu '${action}'. Svet okolo teba reaguje na tvoje rozhodnutie.`;
      choices = ['Pokračovať v bádaní', 'Oddýchnuť si pri ohnisku'];
    }

    return {
      success: true,
      story: storyBeat,
      roll,
      current_state: state,
      available_choices: choices
    };
  },

  triviaQuizEngine: (params = {}) => {
    const TRIVIA_DATABASE = [
      { id: 'geo_1', category: 'Geografia', q: 'Aké je hlavné mesto Austrálie?', options: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'], correct: 'Canberra', explanation: 'Canberra bola vybraná v roku 1908 ako kompromis medzi Sydney a Melbourne.' },
      { id: 'sci_1', category: 'Veda', q: 'Aká je najrýchlejšia známa rýchlosť vo vesmíre?', options: ['Rýchlosť zvuku', 'Rýchlosť svetla vo vákuu', 'Rýchlosť slnečného vetra', 'Rýchlosť neutrín'], correct: 'Rýchlosť svetla vo vákuu', explanation: 'Rýchlosť svetla vo vákuu c je presne 299 792 458 m/s.' },
      { id: 'hist_1', category: 'História', q: 'V ktorom roku vznikla Slovenská republika?', options: ['1989', '1992', '1993', '2004'], correct: '1993', explanation: 'Slovenská republika vznikla 1. januára 1993 po pokojnom rozdelení ČSFR.' },
      { id: 'tech_1', category: 'Technológie', q: 'Ktorá spoločnosť vytvorila programovací jazyk JavaScript?', options: ['Microsoft', 'Netscape', 'Sun Microsystems', 'Google'], correct: 'Netscape', explanation: 'Brendan Eich vytvoril JavaScript v roku 1995 pre spoločnosť Netscape Communications.' },
      { id: 'nature_1', category: 'Biológia', q: 'Ktorý orgán ľudského tela spotrebúva najviac energie v pokoji?', options: ['Srdce', 'Pečeň', 'Mozog', 'Pľúca'], correct: 'Mozog', explanation: 'Mozog dospelého človeka tvorí cca 2 % hmotnosti tela, no spotrebúva približne 20 % celkového kyslíka a glukózy.' }
    ];

    const category = params.category ? stripDiacritics(params.category) : null;
    const userQuestionId = params.questionId;
    const userAnswer = params.answer;

    if (userQuestionId && userAnswer !== undefined) {
      const qItem = TRIVIA_DATABASE.find(item => item.id === userQuestionId);
      if (!qItem) {
        return { success: false, error: `Otázka s ID '${userQuestionId}' nebola nájdená.` };
      }
      const isCorrect = stripDiacritics(userAnswer).trim() === stripDiacritics(qItem.correct).trim();
      return {
        success: true,
        evaluation: isCorrect ? 'Správne!' : 'Nesprávne.',
        is_correct: isCorrect,
        correct_answer: qItem.correct,
        explanation: qItem.explanation
      };
    }

    const filtered = category 
      ? TRIVIA_DATABASE.filter(item => stripDiacritics(item.category).includes(category))
      : TRIVIA_DATABASE;
    
    const picked = filtered.length ? filtered[Math.floor(Math.random() * filtered.length)] : TRIVIA_DATABASE[0];

    return {
      success: true,
      question_id: picked.id,
      category: picked.category,
      question: picked.q,
      options: picked.options
    };
  },

  riddleGenerator: (params = {}) => {
    const RIDDLES = [
      { id: 'rid_1', riddle: 'Mám mestá, ale žiadne domy. Mám hory, ale žiadne stromy. Mám vodu, ale žiadne ryby. Čo som?', answer: 'Mapa', hint: 'Nájdete ma na papieri alebo v GPS navigácii.' },
      { id: 'rid_2', riddle: 'Čím viac z neho odoberiete, tým je väčší. Čo to je?', answer: 'Diera (jama)', hint: 'Vykopete ju v zemi.' },
      { id: 'rid_3', riddle: 'Bežím stále bez nôh, hučím bez úst, nikdy nespím a nikdy sa nevraciam späť. Čo som?', answer: 'Rieka (alebo čas)', hint: 'Tečie z hôr do mora.' },
      { id: 'rid_4', riddle: 'Patrí to tebe, ale iní ľudia to používajú častejšie ako ty sám. Čo je to?', answer: 'Tvoje meno', hint: 'Používajú to, keď ťa oslovujú.' }
    ];

    if (params.riddleId && params.guess !== undefined) {
      const target = RIDDLES.find(r => r.id === params.riddleId);
      if (!target) return { success: false, error: 'Hádanka neexistuje.' };
      const ok = stripDiacritics(params.guess).includes(stripDiacritics(target.answer).split(' ')[0]);
      return {
        success: true,
        is_correct: ok,
        answer: target.answer,
        evaluation: ok ? 'Výborne, uhádol si!' : 'Tentoraz to nevyšlo.'
      };
    }

    const picked = RIDDLES[Math.floor(Math.random() * RIDDLES.length)];
    return {
      success: true,
      riddle_id: picked.id,
      riddle: picked.riddle,
      hint: picked.hint
    };
  }
};

// ==========================================
// 3. VZDELÁVANIE & UČENIE (EDUCATION ACADEMY)
// ==========================================

export const educationSkills = {
  languageTutor: (params = {}) => {
    const phrase = params.phrase || params.text;
    const targetLang = params.targetLang || 'en';

    if (!phrase || typeof phrase !== 'string') {
      return { success: false, error: 'Zadaj text alebo frázu na precvičenie / preklad.' };
    }

    const words = phrase.trim().split(/\s+/);
    const notes = [];

    if (phrase.includes('som išiel') || phrase.includes('som bol')) {
      notes.push('Slovenský minulý čas: tvorí sa pomocným slovesom byť + l-ovým príčastím.');
    }
    if (phrase.toLowerCase().includes('actual') && targetLang === 'sk') {
      notes.push("Pozor na 'false friend': Anglické 'actual' neznamená 'aktuálny', ale 'skutočný'/'reálny'. Pre aktuálny použite 'current'.");
    }

    return {
      success: true,
      original_phrase: phrase,
      word_count: words.length,
      target_language: targetLang,
      grammatical_notes: notes.length ? notes : ['Veta je syntakticky zrozumiteľná. Odporúča sa dbať na správnu interpunkciu.'],
      learning_tip: 'Pri osvojovaní nového jazyka pomáha tvoriť si z každej novej frázy aspoň 2 alternatívne obmeny.'
    };
  },

  mathConceptExplainer: (params = {}) => {
    const concept = typeof params === 'string' ? params : params?.concept || params?.topic;
    if (!concept || typeof concept !== 'string') {
      return { success: false, error: 'Zadaj matematický koncept (napr. derivácia, integrál, pytagorova veta, matica, percentá).' };
    }

    const c = stripDiacritics(concept);
    let explanation = '';
    let formula = '';
    let stepExample = [];

    if (c.includes('deriva') || c.includes('derivative')) {
      explanation = 'Derivácia funkcie v danom bode vyjadruje okamžitú mieru zmeny (smernicu dotyčnice ku grafu funkcie).';
      formula = "f'(x) = lim_{h -> 0} (f(x+h) - f(x)) / h";
      stepExample = [
        'Zadanie: zderivuj f(x) = 3x^2 + 5x - 7',
        "Krok 1: Pravidlo mocniny (x^n)' = n * x^(n-1)",
        "Krok 2: Derivácia 3x^2 je 3 * 2x = 6x",
        "Krok 3: Derivácia 5x je 5 * 1 = 5, derivácia konštanty -7 je 0",
        "Výsledok: f'(x) = 6x + 5"
      ];
    } else if (c.includes('integ') || c.includes('integral')) {
      explanation = 'Neurčitý integrál predstavuje antideriváciu, zatiaľ čo určitý integrál počíta orientovaný obsah plochy pod krivkou funkcie.';
      formula = '∫ f(x) dx = F(x) + C, kde F\'(x) = f(x)';
      stepExample = [
        'Zadanie: vypočítaj ∫ (4x^3 + 2) dx',
        'Krok 1: Pravidlo mocniny ∫ x^n dx = (x^(n+1))/(n+1) pre n ≠ -1',
        'Krok 2: 4 * (x^4)/4 + 2x + C',
        'Výsledok: x^4 + 2x + C'
      ];
    } else if (c.includes('pytagor') || c.includes('pythagor')) {
      explanation = 'Pytagorova veta platí pre pravouhlý trojuholník: obsah štvorca nad preponou sa rovná súčtu obsahov štvorcov nad oboma odvesnami.';
      formula = 'a² + b² = c² (kde c je prepona)';
      stepExample = [
        'Zadanie: odvesny a = 3 cm, b = 4 cm. Určte preponu c.',
        'Krok 1: c² = 3² + 4² = 9 + 16 = 25',
        'Krok 2: c = √25 = 5 cm',
        'Výsledok: c = 5 cm'
      ];
    } else {
      explanation = `Prehľad konceptu '${concept}': V matematike sa koncept opiera o axiomatický základ, formálnu definíciu a overiteľné odvodenie.`;
      formula = 'f(x) = y';
      stepExample = [
        'Krok 1: Identifikuj vstupné premenné a definičný obor',
        'Krok 2: Aplikuj príslušné algebrické alebo analytické pravidlo',
        'Krok 3: Skontroluj výsledok skúškou správnosti'
      ];
    }

    return {
      success: true,
      concept,
      explanation,
      formula,
      steps: stepExample
    };
  },

  flashcardStudyDeck: (params = {}) => {
    const action = params.action || 'review';
    const box = Math.min(Math.max(Number(params.box) || 1, 1), 5);
    const rating = params.rating;

    const intervals = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 };

    if (action === 'rate' && rating) {
      let nextBox = box;
      if (rating === 'again') nextBox = 1;
      else if (rating === 'easy') nextBox = Math.min(5, box + 2);
      else nextBox = Math.min(5, box + 1);

      const nextIntervalDays = intervals[nextBox];
      const nextReviewDate = new Date(Date.now() + nextIntervalDays * 86400000).toISOString().slice(0, 10);

      return {
        success: true,
        previous_box: box,
        new_box: nextBox,
        interval_days: nextIntervalDays,
        next_review_date: nextReviewDate,
        message: nextBox > box ? 'Skvelé! Karta postupuje do vyššieho boxu.' : 'Karta bola vrátená do Boxu 1 na upevnenie.'
      };
    }

    return {
      success: true,
      current_box: box,
      leitner_schedule: intervals,
      status: 'pripravené na hodnotenie (použi rating: again | good | easy)'
    };
  }
};

// ==========================================
// 4. ŽIVOTNÝ ŠTÝL & ZDRAVIE (LIFESTYLE & WELLNESS)
// ==========================================

export const lifestyleSkills = {
  habitForge: (params = {}) => {
    const habitName = params.habitName || 'Denné čítanie & kódovanie';
    const history = Array.isArray(params.history) ? params.history : [1, 1, 1, 0, 1, 1, 1];

    let streak = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i] === 1) streak++;
      else break;
    }

    const totalDays = history.length;
    const completedDays = history.filter(h => h === 1).length;
    const completionRatePct = totalDays ? Math.round((completedDays / totalDays) * 100) : 0;

    return {
      success: true,
      habit: habitName,
      current_streak_days: streak,
      total_days: totalDays,
      completed_days: completedDays,
      completion_rate_pct: completionRatePct,
      habit_strength: completionRatePct >= 80 ? 'Vynikajúci návyk (silné upevnenie)' : completionRatePct >= 50 ? 'Budujúci sa návyk' : 'Vyžaduje vyššiu konzistenciu',
      advice: streak > 0 ? `Výborne! Tvoj streak je ${streak} dní. Udržuj reťaz neprerušenú.` : 'Dnes je ideálny deň začať nový streak.'
    };
  },

  nutritionMacroCalc: (params = {}) => {
    const weightKg = Number(params.weightKg) || 75;
    const heightCm = Number(params.heightCm) || 178;
    const age = Number(params.age) || 30;
    const gender = params.gender === 'female' ? 'female' : 'male';
    const goal = params.goal || 'maintain';

    let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
    bmr += gender === 'male' ? 5 : -161;

    let tdee = Math.round(bmr * 1.375);
    let targetCalories = tdee;

    if (goal === 'cut') targetCalories = Math.round(tdee * 0.82);
    else if (goal === 'bulk') targetCalories = Math.round(tdee * 1.12);

    const proteinG = Math.round(weightKg * 2.0);
    const fatG = Math.round(weightKg * 0.9);
    const carbCalories = Math.max(0, targetCalories - (proteinG * 4) - (fatG * 9));
    const carbG = Math.round(carbCalories / 4);

    return {
      success: true,
      bmr_kcal: Math.round(bmr),
      tdee_maintenance_kcal: tdee,
      target_daily_calories_kcal: targetCalories,
      goal,
      macros: {
        protein_grams: proteinG,
        protein_kcal: proteinG * 4,
        fat_grams: fatG,
        fat_kcal: fatG * 9,
        carbs_grams: carbG,
        carbs_kcal: carbCalories
      },
      hydration_target_liters: Math.round((weightKg * 0.035) * 10) / 10
    };
  },

  breathFocusCoach: (params = {}) => {
    const technique = params.technique || 'box_breathing';
    
    if (technique === '4_7_8') {
      return {
        success: true,
        technique: '4-7-8 Relaxačné dýchanie Dr. Weila',
        purpose: 'Rýchle zníženie stresu a podpora zaspávania aktiváciou parasympatika.',
        cycle: { inhale_seconds: 4, hold_seconds: 7, exhale_seconds: 8 },
        recommended_rounds: 4,
        instructions: 'Nádych nosom 4s, zadržanie dychu 7s, pomalý výdych ústami 8s so zvukom šumenia.'
      };
    }
    if (technique === 'pomodoro') {
      return {
        success: true,
        technique: 'Klasický Pomodoro interval',
        purpose: 'Vysoké sústredenie a prevencia mentálnej únavy.',
        intervals: { focus_minutes: 25, short_break_minutes: 5, long_break_minutes: 15, cycles_before_long_break: 4 },
        guidance: 'Počas 25 minút sa venuj výlučne jedinej úlohe bez sociálnych sietí a notifikácií.'
      };
    }

    return {
      success: true,
      technique: 'Box Breathing (Štvorcové dýchanie Navy SEALs)',
      purpose: 'Okamžité upokojenie mysle, zlepšenie koncentrácie a regulácia tepu.',
      cycle: { inhale_seconds: 4, hold_seconds: 4, exhale_seconds: 4, empty_hold_seconds: 4 },
      recommended_duration_minutes: 5,
      instructions: '4 sekundy nádych, 4 sekundy zadržať dych, 4 sekundy výdych, 4 sekundy zadržať prázdne pľúca.'
    };
  }
};

// ==========================================
// 5. KREATÍVNA TVORBA (CREATIVE STUDIO PLUS)
// ==========================================

export const creativeSkills = {
  rhymePoemCraft: (params = {}) => {
    const word = params.word || 'svetlo';
    const RHYME_DICTIONARY = {
      'svetlo': ['teplo', 'peklo', 'rieklo', 'utieklo', 'zmäklo'],
      'kod': ['mod', 'bod', 'rod', 'pochod', 'schod', 'plod'],
      'cas': ['hlas', 'jas', 'pas', 'vlas', 'klas', 'zas'],
      'noc': ['moc', 'pomoc', 'nemoc', 'polnoc'],
      'hviezda': ['hniezda', 'brzda', 'jazda']
    };

    const cleanWord = stripDiacritics(word).trim();
    const rhymes = RHYME_DICTIONARY[cleanWord] || ['podobne znejúce koncovky: -' + cleanWord.slice(-3)];

    return {
      success: true,
      word: cleanWord,
      rhymes,
      meter_hint: 'Pri písaní viazaného verša dodržiavaj rovnaký počet slabík na riadok (napr. 8- alebo 10-slabičný jamb).'
    };
  },

  screenplayFormatter: (params = {}) => {
    const { sceneHeading, action, character, dialogue, parenthetical } = params;
    if (!sceneHeading && !dialogue && !action) {
      return { success: false, error: 'Zadaj aspoň sceneHeading, action alebo dialogue.' };
    }

    const lines = [];
    if (sceneHeading) {
      lines.push(sceneHeading.toUpperCase());
      lines.push('');
    }
    if (action) {
      lines.push(action);
      lines.push('');
    }
    if (character) {
      lines.push('                  ' + character.toUpperCase());
    }
    if (parenthetical) {
      lines.push('               (' + parenthetical + ')');
    }
    if (dialogue) {
      lines.push('        ' + dialogue);
      lines.push('');
    }

    return {
      success: true,
      formatted_script: lines.join('\n')
    };
  }
};

// ==========================================
// 6. VEDA & PRIESKUM (SCIENCE EXPLORER)
// ==========================================

export const scienceSkills = {
  periodicTableLookup: (params = {}) => {
    const query = typeof params === 'string' ? params : params?.element;
    if (!query || typeof query !== 'string') {
      return { success: false, error: 'Zadaj názov prvku, chemickú značku alebo protónové číslo (napr. H, Kyslík, 6, Fe, Au).' };
    }

    const ELEMENTS = [
      { z: 1, sym: 'H', name: 'Vodík', mass: 1.008, group: 1, period: 1, category: 'nekov', en: 2.20 },
      { z: 2, sym: 'He', name: 'Hélium', mass: 4.0026, group: 18, period: 1, category: 'vznešený plyn', en: null },
      { z: 6, sym: 'C', name: 'Uhlík', mass: 12.011, group: 14, period: 2, category: 'nekov', en: 2.55 },
      { z: 7, sym: 'N', name: 'Dusík', mass: 14.007, group: 15, period: 2, category: 'nekov', en: 3.04 },
      { z: 8, sym: 'O', name: 'Kyslík', mass: 15.999, group: 16, period: 2, category: 'nekov', en: 3.44 },
      { z: 11, sym: 'Na', name: 'Sodík', mass: 22.990, group: 1, period: 3, category: 'alkalický kov', en: 0.93 },
      { z: 14, sym: 'Si', name: 'Kremík', mass: 28.085, group: 14, period: 3, category: 'polokov', en: 1.90 },
      { z: 26, sym: 'Fe', name: 'Železo', mass: 55.845, group: 8, period: 4, category: 'prechodný kov', en: 1.83 },
      { z: 29, sym: 'Cu', name: 'Meď', mass: 63.546, group: 11, period: 4, category: 'prechodný kov', en: 1.90 },
      { z: 79, sym: 'Au', name: 'Zlato', mass: 196.97, group: 11, period: 6, category: 'prechodný kov', en: 2.54 }
    ];

    const q = stripDiacritics(query).trim();
    const match = ELEMENTS.find(e => 
      stripDiacritics(e.sym) === q || 
      stripDiacritics(e.name) === q || 
      String(e.z) === q
    );

    if (!match) {
      return {
        success: false,
        error: `Prvok '${query}' nebol nájdený v základnej databáze prvkov.`,
        available_samples: ELEMENTS.map(e => `${e.sym} (${e.name})`)
      };
    }

    return {
      success: true,
      atomic_number: match.z,
      symbol: match.sym,
      name_sk: match.name,
      atomic_mass_u: match.mass,
      group: match.group,
      period: match.period,
      category: match.category,
      electronegativity_pauling: match.en
    };
  },

  physicsConstants: (params = {}) => {
    const CONSTANTS = {
      c: { name: 'Rýchlosť svetla vo vákuu', value: 299792458, unit: 'm/s', exact: true },
      h: { name: 'Planckova konštanta', value: 6.62607015e-34, unit: 'J·s', exact: true },
      G: { name: 'Gravitačná konštanta', value: 6.67430e-11, unit: 'm³/(kg·s²)', exact: false },
      k_B: { name: 'Boltzmannova konštanta', value: 1.380649e-23, unit: 'J/K', exact: true },
      e: { name: 'Elementárny elektrický náboj', value: 1.602176634e-19, unit: 'C', exact: true },
      N_A: { name: 'Avogadrova konštanta', value: 6.02214076e23, unit: 'mol⁻¹', exact: true }
    };

    const symbol = params.symbol ? String(params.symbol) : null;
    if (symbol && CONSTANTS[symbol]) {
      return {
        success: true,
        symbol,
        ...CONSTANTS[symbol]
      };
    }

    return {
      success: true,
      constants: CONSTANTS
    };
  }
};
