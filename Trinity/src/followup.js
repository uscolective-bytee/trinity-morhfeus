/**
 * Trinity Follow-Up Generator v1.0
 * Bezpečné ohraničené generovanie nadväzujúcich krokov bez rizika zacyklenia.
 */
import {createJob} from './jobs.js';

export async function createFollowupJob(env, sourceJob, resultText) {
  if (!env || !sourceJob || !resultText) return null;

  // Ochrana pred rekurziou a zacyklením
  const plan = typeof sourceJob.plan_json === 'string'
    ? JSON.parse(sourceJob.plan_json || '{}')
    : (sourceJob.plan_json || {});

  // Zreťazenie je povolené iba ak je v pláne allow_followup a nepresiahla sa hĺbka 1
  if (!plan.allow_followup || plan.is_followup || (plan.followup_depth || 0) >= 1) {
    return null;
  }

  const followTask = `Nadväzujúci krok k úlohe [${sourceJob.id}]: "${sourceJob.task}". Zhrnutie predošlého výstupu: ${resultText.slice(0, 400)}. Over a vykonaj ďalší logický krok.`;

  try {
    return await createJob(env, {
      task: followTask,
      session_id: sourceJob.session_id,
      agent: 'auto',
      mode: 'team',
      provider: sourceJob.provider || 'workers-ai',
      language: sourceJob.language || 'sk',
      owner_mode: sourceJob.owner_mode === 1
    });
  } catch (err) {
    console.error('Follow-up generation skipped due to error:', err.message);
    return null;
  }
}
