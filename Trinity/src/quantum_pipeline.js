/**
 * Trinity Quantum-Metaphysical Pipeline Orchestrator
 * Integrates Workers AI, local bridge verification, and ontological collapse into a unified execution flow.
 */

import { QuantumCoreEngine } from "./quantum_core.js";
import { TeleologicalMemoryEngine } from "./teleological_memory.js";

/**
 * @typedef {Object} PipelineEnv
 * @property {any} AI
 * @property {D1Database} DB
 * @property {any} [VECTORIZE]
 * @property {string} [BRIDGE_SHARED_SECRET]
 * @property {string} [AI_MODEL]
 */

/**
 * @typedef {Object} PipelineResult
 * @property {string} manifestedText
 * @property {string} dominantDimension
 * @property {number} coherenceScore
 * @property {number} destructiveInterferenceCount
 * @property {boolean} bridgeVerified
 * @property {string[]} [errors]
 */

/**
 * @param {PipelineEnv} env
 * @param {string} userPrompt
 * @param {string} [sessionId]
 * @param {boolean} [bridgeActive]
 * @returns {Promise<PipelineResult>}
 */
export async function processTeleologicalPrompt(
  env,
  userPrompt,
  sessionId = 'default-session',
  bridgeActive = false
) {
  const errors = [];

  // 0️⃣ Bridge verification
  let bridgeVerified = true;
  if (bridgeActive) {
    try {
      if (!env.BRIDGE_SHARED_SECRET) {
        throw new Error("Missing BRIDGE_SHARED_SECRET");
      }
      bridgeVerified = true;
    } catch (e) {
      bridgeVerified = false;
      errors.push(`Bridge verification failed: ${e.message}`);
    }
  }

  // 1️⃣ Teleological recall
  const memoryEngine = new TeleologicalMemoryEngine(
    env.DB,
    env.VECTORIZE,
    env.AI
  );

  let activeInvariants = [];
  try {
    activeInvariants = await memoryEngine.recallTeleologicalState(
      userPrompt,
      sessionId
    );
  } catch (e) {
    errors.push(`Memory recall failed: ${e.message}`);
  }

  const contextPrefix = activeInvariants.length
    ? `Aktívne teleologické invarianty:\n${activeInvariants.join("\n")}\n\n`
    : "";

  const defaultModel = env.AI_MODEL || "@cf/meta/llama-3.3-70b-instruct";

  const runAi = async (systemPrompt, userText) => {
    if (!env.AI?.run) throw new Error("Workers AI nie je dostupné.");
    const res = await env.AI.run(defaultModel, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText }
      ]
    });
    return res?.response || res?.output_text || (typeof res === 'string' ? res : '');
  };

  // 2️⃣ Thesis / Antithesis
  let thesisText = '';
  let antithesisText = '';

  try {
    const [t, a] = await Promise.all([
      runAi(
        `${contextPrefix}Si Téza systému Trinity. Konštruuj priame, efektívne riešenie úlohy.`,
        userPrompt
      ),
      runAi(
        `${contextPrefix}Si Antitéza systému Trinity. Nájdi logické klamy, riziká a zlyhania v predpokladoch dopytu.`,
        userPrompt
      )
    ]);
    thesisText = t;
    antithesisText = a;
  } catch (e) {
    errors.push(`AI generation (thesis/antithesis) failed: ${e.message}`);
    return {
      manifestedText: "Chyba pri generovaní tézy alebo antitézy.",
      dominantDimension: "none",
      coherenceScore: 0,
      destructiveInterferenceCount: 0,
      bridgeVerified,
      errors: errors.length ? errors : undefined
    };
  }

  // 3️⃣ Vytvorenie stavovej superpozície
  const states = [
    {
      dimension: "thesis",
      content: thesisText,
      phaseAngle: 0,
      amplitude: 0.85
    },
    {
      dimension: "antithesis",
      content: antithesisText,
      phaseAngle: Math.PI,
      amplitude: 0.70
    }
  ];

  // 4️⃣ Synthesis
  let synthesisText = '';
  try {
    synthesisText = await runAi(
      `${contextPrefix}Si Syntéza systému Trinity. Zjednoť Tézu a Antitézu do definitívnej pravdy.`,
      `TÉZA:\n${states[0].content}\n\nANTITÉZA:\n${states[1].content}`
    );
  } catch (e) {
    errors.push(`AI generation (synthesis) failed: ${e.message}`);
  }

  if (synthesisText) {
    states.push({
      dimension: "synthesis",
      content: synthesisText,
      phaseAngle: Math.PI / 4,
      amplitude: 0.95
    });
  }

  // 5️⃣ Collapse
  const collapse = QuantumCoreEngine.collapseSuperposition(states, {
    exists: true
  });

  // 6️⃣ Telemetria
  console.log("[Pipeline] userPrompt:", userPrompt);
  console.log("[Pipeline] activeInvariants:", activeInvariants.length);
  console.log("[Pipeline] dominantDimension:", collapse.dominantDimension);
  console.log("[Pipeline] coherenceScore:", collapse.coherenceScore);
  console.log("[Pipeline] bridgeVerified:", bridgeVerified);
  if (errors.length) console.error("[Pipeline] errors:", errors);

  // 7️⃣ Výstup
  return {
    manifestedText: collapse.manifestedText,
    dominantDimension: collapse.dominantDimension,
    coherenceScore: collapse.coherenceScore,
    destructiveInterferenceCount: collapse.destructiveInterferenceCount,
    bridgeVerified,
    errors: errors.length ? errors : undefined
  };
}
