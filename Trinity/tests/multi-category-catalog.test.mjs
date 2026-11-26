import test from 'node:test';
import assert from 'node:assert/strict';
import { copilotPluginRegistry } from '../src/copilot-plugins.js';
import { skillRegistry, skills } from '../src/skillRegistry.js';
import { UNIVERSAL_DOMAINS, APPLICATION_TEMPLATES, universalEcosystem } from '../src/universal-ecosystem.js';

test('Catalog Expansion: Všetkých 6 nových kategórií Copilot pluginov je zaregistrovaných', () => {
  const pluginIds = [
    'developer-toolbox',
    'entertainment-arcade',
    'education-academy',
    'lifestyle-wellness',
    'creative-studio-plus',
    'science-explorer'
  ];

  const allPlugins = copilotPluginRegistry.list();
  for (const id of pluginIds) {
    const p = allPlugins.find(item => item.id === id);
    assert.ok(p, `Plugin '${id}' musí byť v registri`);
    assert.equal(p.enabled, true, `Plugin '${id}' musí byť predvolene zapnutý`);
    assert.ok(p.skills.length >= 2, `Plugin '${id}' musí mať aspoň 2 skilly`);
  }
});

test('Developer Toolbox: regexTester, jsonSchemaValidate a codeSnippetAnalyze fungujú spoľahlivo', async () => {
  // 1. regexTester
  const regOk = await skillRegistry.execute('regexTester', {
    pattern: '(\\d{4})-(\\d{2})-(\\d{2})',
    flags: 'g',
    text: 'Dátum vydania je 2026-10-28 a expirácia 2027-01-01.'
  });
  assert.equal(regOk.success, true);
  assert.equal(regOk.match_count, 2);
  assert.equal(regOk.matches[0].match, '2026-10-28');

  // Chybný regex zlyhá bezpečne bez pádu runtime
  const regBad = await skillRegistry.execute('regexTester', { pattern: '[a-z' });
  assert.equal(regBad.success, false);

  // 2. jsonSchemaValidate
  const schema = {
    type: 'object',
    required: ['id', 'name'],
    properties: {
      id: { type: 'number', minimum: 1 },
      name: { type: 'string', minLength: 2 }
    }
  };
  const validData = { id: 42, name: 'Trinity' };
  const valOk = await skillRegistry.execute('jsonSchemaValidate', { schema, data: validData });
  assert.equal(valOk.success, true);
  assert.equal(valOk.valid, true);

  const invalidData = { id: -5 };
  const valBad = await skillRegistry.execute('jsonSchemaValidate', { schema, data: invalidData });
  assert.equal(valBad.success, true);
  assert.equal(valBad.valid, false);
  assert.ok(valBad.errors.length >= 2);

  // 3. codeSnippetAnalyze
  const code = `
function calculateTotal(items) {
  let sum = 0;
  // Spočítaj položky
  for (const item of items) {
    if (item.active) {
      sum += item.price;
    }
  }
  return sum;
}
`;
  const codeRes = await skillRegistry.execute('codeSnippetAnalyze', { code, language: 'javascript' });
  assert.equal(codeRes.success, true);
  assert.equal(codeRes.detected_language, 'javascript');
  assert.ok(codeRes.metrics.code_lines > 5);
  assert.ok(codeRes.metrics.estimated_cyclomatic_complexity >= 2);
});

test('Entertainment & Arcade: rpgQuestMaster, triviaQuizEngine a riddleGenerator fungujú deterministicky', async () => {
  // 1. rpgQuestMaster
  const startQuest = await skillRegistry.execute('rpgQuestMaster', { action: 'start', heroName: 'Saboi Knight' });
  assert.equal(startQuest.success, true);
  assert.ok(startQuest.available_choices.length >= 2);

  const combatQuest = await skillRegistry.execute('rpgQuestMaster', {
    action: 'enter_gate',
    roll: 18,
    state: startQuest.current_state
  });
  assert.equal(combatQuest.success, true);
  assert.ok(combatQuest.current_state.hero.gold >= 20);

  // 2. triviaQuizEngine
  const qItem = await skillRegistry.execute('triviaQuizEngine', { category: 'veda' });
  assert.equal(qItem.success, true);
  assert.ok(qItem.question_id);
  assert.ok(qItem.options.length >= 3);

  const evalCorrect = await skillRegistry.execute('triviaQuizEngine', {
    questionId: 'sci_1',
    answer: 'Rýchlosť svetla vo vákuu'
  });
  assert.equal(evalCorrect.success, true);
  assert.equal(evalCorrect.is_correct, true);

  const evalWrong = await skillRegistry.execute('triviaQuizEngine', {
    questionId: 'sci_1',
    answer: 'Rýchlosť slimáka'
  });
  assert.equal(evalWrong.success, true);
  assert.equal(evalWrong.is_correct, false);

  // 3. riddleGenerator
  const riddle = await skillRegistry.execute('riddleGenerator', {});
  assert.equal(riddle.success, true);
  assert.ok(riddle.riddle);

  const solve = await skillRegistry.execute('riddleGenerator', { riddleId: 'rid_1', guess: 'mapa sveta' });
  assert.equal(solve.success, true);
  assert.equal(solve.is_correct, true);
});

test('Education Academy: languageTutor, mathConceptExplainer a flashcardStudyDeck fungujú presne', async () => {
  // 1. languageTutor
  const langRes = await skillRegistry.execute('languageTutor', {
    phrase: 'The actual plan is ready.',
    targetLang: 'sk'
  });
  assert.equal(langRes.success, true);
  assert.ok(langRes.grammatical_notes.length >= 1);

  // 2. mathConceptExplainer
  const mathRes = await skillRegistry.execute('mathConceptExplainer', { concept: 'derivácia' });
  assert.equal(mathRes.success, true);
  assert.ok(mathRes.formula.includes('lim'));
  assert.ok(mathRes.steps.length >= 3);

  const pythRes = await skillRegistry.execute('mathConceptExplainer', { concept: 'pytagorova veta' });
  assert.equal(pythRes.success, true);
  assert.ok(pythRes.formula.includes('a² + b² = c²'));

  // 3. flashcardStudyDeck
  const deckStart = await skillRegistry.execute('flashcardStudyDeck', { box: 1 });
  assert.equal(deckStart.success, true);
  assert.equal(deckStart.current_box, 1);

  const deckPromote = await skillRegistry.execute('flashcardStudyDeck', { box: 1, action: 'rate', rating: 'good' });
  assert.equal(deckPromote.success, true);
  assert.equal(deckPromote.new_box, 2);
  assert.equal(deckPromote.interval_days, 3);
});

test('Lifestyle & Wellness: habitForge, nutritionMacroCalc a breathFocusCoach', async () => {
  // 1. habitForge
  const habitRes = await skillRegistry.execute('habitForge', {
    habitName: 'Tréning a meditácia',
    history: [1, 1, 1, 1, 1]
  });
  assert.equal(habitRes.success, true);
  assert.equal(habitRes.current_streak_days, 5);
  assert.equal(habitRes.completion_rate_pct, 100);

  // 2. nutritionMacroCalc
  const macroRes = await skillRegistry.execute('nutritionMacroCalc', {
    weightKg: 80,
    heightCm: 182,
    age: 28,
    gender: 'male',
    goal: 'cut'
  });
  assert.equal(macroRes.success, true);
  assert.ok(macroRes.bmr_kcal > 1600);
  assert.ok(macroRes.target_daily_calories_kcal < macroRes.tdee_maintenance_kcal);
  assert.equal(macroRes.macros.protein_grams, 160); // 80kg * 2.0

  // 3. breathFocusCoach
  const breathRes = await skillRegistry.execute('breathFocusCoach', { technique: 'box_breathing' });
  assert.equal(breathRes.success, true);
  assert.equal(breathRes.cycle.inhale_seconds, 4);

  const pomodoroRes = await skillRegistry.execute('breathFocusCoach', { technique: 'pomodoro' });
  assert.equal(pomodoroRes.success, true);
  assert.equal(pomodoroRes.intervals.focus_minutes, 25);
});

test('Creative Studio & Science: rhymePoemCraft, screenplayFormatter, periodicTableLookup a physicsConstants', async () => {
  // 1. rhymePoemCraft
  const poem = await skillRegistry.execute('rhymePoemCraft', { word: 'svetlo' });
  assert.equal(poem.success, true);
  assert.ok(poem.rhymes.includes('teplo'));

  // 2. screenplayFormatter
  const script = await skillRegistry.execute('screenplayFormatter', {
    sceneHeading: 'INT. VELÍN TRINITY - NOC',
    character: 'SABO IVAN',
    dialogue: 'Všetky systémy sú pripravené.'
  });
  assert.equal(script.success, true);
  assert.ok(script.formatted_script.includes('INT. VELÍN TRINITY - NOC'));
  assert.ok(script.formatted_script.includes('SABO IVAN'));

  // 3. periodicTableLookup
  const gold = await skillRegistry.execute('periodicTableLookup', { element: 'Au' });
  assert.equal(gold.success, true);
  assert.equal(gold.atomic_number, 79);
  assert.equal(gold.name_sk, 'Zlato');

  const iron = await skillRegistry.execute('periodicTableLookup', { element: 'Železo' });
  assert.equal(iron.success, true);
  assert.equal(iron.symbol, 'Fe');

  // 4. physicsConstants
  const cConst = await skillRegistry.execute('physicsConstants', { symbol: 'c' });
  assert.equal(cConst.success, true);
  assert.equal(cConst.value, 299792458);
  assert.equal(cConst.unit, 'm/s');
});

test('Universal Ecosystem: Rozšírené domény a šablóny aplikácií sú správne integrované', () => {
  // Overenie domén
  const domainIds = UNIVERSAL_DOMAINS.map(d => d.id);
  assert.ok(domainIds.includes('entertainment-gaming'), 'Doména entertainment-gaming musí existovať');
  assert.ok(domainIds.includes('lifestyle-wellness'), 'Doména lifestyle-wellness musí existovať');
  assert.ok(domainIds.includes('creative-arts'), 'Doména creative-arts musí existovať');
  assert.ok(domainIds.includes('science-discovery'), 'Doména science-discovery musí existovať');

  // Overenie šablón aplikácií
  const templateIds = APPLICATION_TEMPLATES.map(t => t.templateId);
  assert.ok(templateIds.includes('rpg-quest'), 'Šablóna rpg-quest musí existovať');
  assert.ok(templateIds.includes('trivia-battle'), 'Šablóna trivia-battle musí existovať');
  assert.ok(templateIds.includes('language-lab'), 'Šablóna language-lab musí existovať');
  assert.ok(templateIds.includes('math-olympiad'), 'Šablóna math-olympiad musí existovať');
  assert.ok(templateIds.includes('habit-forge'), 'Šablóna habit-forge musí existovať');
  assert.ok(templateIds.includes('science-lab'), 'Šablóna science-lab musí existovať');

  // Overenie vyhľadávania
  const searchGaming = universalEcosystem.searchCatalog('', { domain: 'entertainment-gaming' });
  assert.ok(searchGaming.total >= 1);
});
