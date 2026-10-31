/**
 * Teleological Memory Engine
 * Bezpečné a robustné vyhľadávanie teleologických invariantov a existenčných cieľov Trinity.
 */

export class TeleologicalMemoryEngine {
  /**
   * @param {D1Database} [db]
   * @param {any} [vectorize]
   * @param {any} [ai]
   */
  constructor(db, vectorize, ai) {
    this.db = db;
    this.vectorize = vectorize;
    this.ai = ai;
  }

  /**
   * Vypočíta aktuálnu koherenciu záznamu s ohľadom na časový rozpad (entropiu) a harmonickú rezonanciu.
   * @param {{gravitationalWeight?: number, entropyRate?: number, createdAt?: number, lastManifestedAt?: number}} rec
   * @param {number} now
   * @returns {number}
   */
  calculateCurrentCoherence(rec, now = Date.now()) {
    const weight = Math.max(0, Math.min(Number(rec?.gravitationalWeight ?? 0.5), 1.0));
    const entropy = Math.max(0, Math.min(Number(rec?.entropyRate ?? 0.05), 1.0));
    const lastTime = Number(rec?.lastManifestedAt || rec?.createdAt || now);
    const elapsedDays = Math.max(0, (now - lastTime) / (1000 * 60 * 60 * 24));
    // Exponenciálny rozpad vážený harmonickou rezonanciou
    const decay = Math.exp(-entropy * elapsedDays);
    return Number((weight * decay).toFixed(4));
  }

  /**
   * Posilní záznam v pamäti aktualizáciou času posledného prejavenia.
   * @param {string} id
   * @param {number} now
   */
  async touchRecord(id, now = Date.now()) {
    if (!this.db || !id) return;
    try {
      await this.db
        .prepare("UPDATE ontological_memory SET last_manifested_at = ? WHERE id = ?")
        .bind(now, id)
        .run();
    } catch (_) {
      // Ignorovať ak tabuľka neexistuje
    }
  }

  /**
   * Vyvolá relevantné teleologické stavy na základe dopytu a koherenčného prahu.
   * @param {string} currentIntent
   * @param {string} [sessionId]
   * @param {number} [coherenceThreshold]
   * @returns {Promise<string[]>}
   */
  async recallTeleologicalState(currentIntent, sessionId = "default", coherenceThreshold = 0.15) {
    const relevant = [];

    // Základné invarianty systému Trinity (garantovaný základ)
    const baseInvariants = [
      'Invariant 1 (Identita): Trinity je zjednotená AI asistentka, ktorej hlavným architektom je Sabo Ivan (Basterix).',
      'Invariant 2 (Pravdivosť): Dôkazy predchádzajú domnienkam, faktická overiteľnosť má prednosť pred konfabuláciou.',
      'Invariant 3 (Telos): Účelom Trinity je praktická realizácia zámeru, bezpečnosť systému a zmysluplná tvorivosť.'
    ];

    // 1️⃣ Pokus o vektorové vyhľadanie cez Vectorize a AI embeddings (ak sú nakonfigurované)
    if (this.vectorize && this.ai?.run && typeof currentIntent === 'string' && currentIntent.trim()) {
      try {
        const embeddingRes = await this.ai.run("@cf/baai/bge-base-en-v1.5", {
          text: [currentIntent],
        });
        const intentVector = embeddingRes?.data?.[0];

        if (Array.isArray(intentVector) && intentVector.length > 0) {
          const matches = await this.vectorize.query(intentVector, {
            topK: 5,
            filter: { sessionId },
          });

          if (matches?.matches?.length && this.db) {
            const ids = matches.matches.map(m => m.id).filter(Boolean);
            if (ids.length > 0) {
              const placeholders = ids.map(() => "?").join(",");
              const sql = `
                SELECT
                  id,
                  teleological_purpose,
                  content,
                  harmonic_resonance,
                  entropy_rate,
                  created_at,
                  last_manifested_at
                FROM ontological_memory
                WHERE id IN (${placeholders})
              `;
              const stmt = this.db.prepare(sql).bind(...ids);
              const queryRes = await stmt.all();
              const results = queryRes?.results;

              if (Array.isArray(results) && results.length > 0) {
                const now = Date.now();
                for (const row of results) {
                  const rec = {
                    id: row.id,
                    purpose: row.teleological_purpose,
                    content: row.content ?? row.teleological_purpose,
                    gravitationalWeight: row.harmonic_resonance,
                    entropyRate: row.entropy_rate,
                    createdAt: row.created_at ?? now,
                    lastManifestedAt: row.last_manifested_at,
                  };
                  const coherence = this.calculateCurrentCoherence(rec, now);
                  if (coherence >= coherenceThreshold && rec.content) {
                    relevant.push(rec.content);
                    await this.touchRecord(rec.id, now);
                  }
                }
              }
            }
          }
        }
      } catch (_) {
        // Plynulý fallback na relačnú pamäť
      }
    }

    // 2️⃣ Doplňujúce vyhľadanie v existujúcej relačnej pamäti Trinity (ops_memory)
    if (this.db) {
      try {
        const query = "SELECT key, value FROM ops_memory WHERE key LIKE 'profil/%' OR key LIKE 'invariant/%' OR key LIKE 'telos/%' ORDER BY updated_at DESC LIMIT 5";
        const rows = await this.db.prepare(query).all();
        if (rows?.results && Array.isArray(rows.results)) {
          for (const row of rows.results) {
            if (row.value && typeof row.value === 'string') {
              relevant.push(`${row.key}: ${row.value.slice(0, 300)}`);
            }
          }
        }
      } catch (_) {}
    }

    // Spojenie invariantov a deduplikácia
    const finalSet = new Set([...baseInvariants, ...relevant]);
    return Array.from(finalSet);
  }

  /**
   * Bezpečne pridá teleologický záznam s validáciou parametrov.
   * @param {string} purpose
   * @param {string} content
   * @param {string} [sessionId]
   * @param {number} [weight]
   * @param {number} [entropy]
   * @returns {Promise<string>} ID záznamu
   */
  async addMemory(
    purpose,
    content,
    sessionId = "default",
    weight = 0.5,
    entropy = 0.05
  ) {
    // Validácia rozsahov
    if (typeof weight !== 'number' || weight < 0 || weight > 1) {
      throw new Error("weight must be in [0,1]");
    }
    if (typeof entropy !== 'number' || entropy < 0 || entropy > 1) {
      throw new Error("entropy must be in [0,1]");
    }

    const recordId = crypto.randomUUID();
    const now = Date.now();

    // 1️⃣ Vectorize upsert (ak je dostupný)
    if (this.vectorize && this.ai?.run) {
      try {
        const embeddingRes = await this.ai.run("@cf/baai/bge-base-en-v1.5", {
          text: [content || purpose],
        });
        const embedding = embeddingRes?.data?.[0];
        if (Array.isArray(embedding)) {
          await this.vectorize.upsert([
            { id: recordId, values: embedding, metadata: { sessionId } },
          ]);
        }
      } catch (_) {}
    }

    // 2️⃣ D1 INSERT s plnou parametrizáciou
    if (this.db) {
      const sql = `
        INSERT INTO ontological_memory (
          id,
          teleological_purpose,
          content,
          harmonic_resonance,
          entropy_rate,
          created_at,
          last_manifested_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      try {
        await this.db
          .prepare(sql)
          .bind(recordId, purpose, content, weight, entropy, now, now)
          .run();
      } catch (err) {
        // Fallback do ops_memory ak schéma ešte neobsahuje tabuľku ontological_memory
        try {
          await this.db
            .prepare("INSERT INTO ops_memory (key, value) VALUES (?, ?)")
            .bind(`telos/${recordId}`, JSON.stringify({ purpose, content, weight, entropy }))
            .run();
        } catch (_) {}
      }
    }

    return recordId;
  }
}
