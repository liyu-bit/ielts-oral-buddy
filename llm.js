/* IELTS Oral Buddy · 大模型接入层（自带 API Key）
   ------------------------------------------------------------------
   为什么是"自带 Key"而不是内置 Key：
     纯静态网页没有服务器，任何内置的密钥都会在浏览器里被任何人看到。
     所以这里采用"自带 Key"模式：Key 只存在你自己浏览器的 localStorage 里，
     不经过任何第三方服务器，直接由你的浏览器发往你选择的大模型服务商。
   未配置 Key 时，自动回退到 engine.js 的本地智能考官引擎（完全离线可用）。
   ------------------------------------------------------------------ */

window.IELTS_LLM = (function () {

  const KEY = "im_llm";

  /* localStorage 可能在隐私模式 / file:// 下被禁用，做一次安全封装 */
  const MEM = {};
  const LS = (function () {
    try {
      window.localStorage.setItem("__im_probe__", "1");
      window.localStorage.removeItem("__im_probe__");
      return window.localStorage;
    } catch (e) {
      return {
        getItem: k => (k in MEM ? MEM[k] : null),
        setItem: (k, v) => { MEM[k] = String(v); },
        removeItem: k => { delete MEM[k]; }
      };
    }
  })();

  /* 常见服务商预设（均为 OpenAI 兼容接口） */
  const PRESETS = [
    { id: "local",    label: "本地智能引擎（无需 Key，离线可用）", baseUrl: "", model: "" },
    { id: "deepseek", label: "DeepSeek",   baseUrl: "https://api.deepseek.com/v1",                        model: "deepseek-chat" },
    { id: "qwen",     label: "通义千问",    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",   model: "qwen-plus" },
    { id: "kimi",     label: "Kimi (月之暗面)", baseUrl: "https://api.moonshot.cn/v1",                     model: "moonshot-v1-8k" },
    { id: "zhipu",    label: "智谱 GLM",    baseUrl: "https://open.bigmodel.cn/api/paas/v4",               model: "glm-4-flash" },
    { id: "openai",   label: "OpenAI",      baseUrl: "https://api.openai.com/v1",                          model: "gpt-4o-mini" },
    { id: "custom",   label: "自定义（任意 OpenAI 兼容接口）", baseUrl: "", model: "" }
  ];

  let cfg = load();

  function load() {
    try {
      const raw = JSON.parse(LS.getItem(KEY) || "{}");
      return Object.assign({ provider: "local", baseUrl: "", apiKey: "", model: "", temperature: 0.8 }, raw);
    } catch (e) {
      return { provider: "local", baseUrl: "", apiKey: "", model: "", temperature: 0.8 };
    }
  }
  function save(next) {
    cfg = Object.assign({}, cfg, next || {});
    LS.setItem(KEY, JSON.stringify(cfg));
    return cfg;
  }
  function get() { return Object.assign({}, cfg); }
  function preset(id) { return PRESETS.find(p => p.id === id) || PRESETS[0]; }

  /* 是否已配置可用的云端模型 */
  function isReady() {
    return cfg.provider !== "local" && !!cfg.baseUrl && !!cfg.model;
  }
  function status() {
    if (cfg.provider === "local") return "本地智能引擎";
    if (!cfg.apiKey) return "已选 " + preset(cfg.provider).label + "，缺少 API Key";
    if (!cfg.baseUrl || !cfg.model) return "配置不完整";
    return preset(cfg.provider).label + " · " + cfg.model;
  }

  /* ------------------------------------------------------------------
     底层调用：SSE 流式；把增量文本交给 onDelta，最后返回完整文本
     ------------------------------------------------------------------ */
  async function chat(messages, opts) {
    opts = opts || {};
    if (!isReady()) throw new Error("LLM_NOT_CONFIGURED");
    if (!cfg.apiKey) throw new Error("LLM_NO_KEY");

    const body = {
      model: cfg.model,
      messages,
      stream: true,
      temperature: opts.temperature != null ? opts.temperature : cfg.temperature
    };
    if (opts.json) body.response_format = { type: "json_object" };

    const url = cfg.baseUrl.replace(/\/+$/, "") + "/chat/completions";
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + cfg.apiKey
      },
      body: JSON.stringify(body),
      signal: opts.signal
    });

    if (!res.ok) {
      let detail = "";
      try { detail = (await res.text()).slice(0, 300); } catch (e) {}
      if (res.status === 401 || res.status === 403) throw new Error("API Key 无效或没有权限（HTTP " + res.status + "）");
      if (res.status === 429) throw new Error("请求过于频繁或额度不足（HTTP 429）");
      throw new Error("模型服务返回 HTTP " + res.status + (detail ? "：" + detail : ""));
    }
    if (!res.body) throw new Error("当前浏览器不支持流式响应");

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buf = "", full = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop();
      for (const line of lines) {
        const s = line.trim();
        if (!s || !s.startsWith("data:")) continue;
        const payload = s.slice(5).trim();
        if (payload === "[DONE]") continue;
        try {
          const j = JSON.parse(payload);
          const delta = j.choices && j.choices[0] && j.choices[0].delta;
          const piece = delta && delta.content;
          if (piece) { full += piece; if (opts.onDelta) opts.onDelta(piece, full); }
        } catch (e) { /* 忽略不完整分片 */ }
      }
    }
    return full;
  }

  /* 从模型输出里稳妥地取出 JSON */
  function parseJSON(text) {
    if (!text) return null;
    let t = text.trim();
    t = t.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    const i = t.indexOf("{"), j = t.lastIndexOf("}");
    if (i >= 0 && j > i) t = t.slice(i, j + 1);
    try { return JSON.parse(t); } catch (e) { return null; }
  }

  /* ==================================================================
     考官（Part 1 / Part 2 / Part 3）：按官方脚本推进 + 动态追问
     关键约束：真实考官**不评价**回答。夸奖、纠错、给分、解释词义
     都不是考官会做的事，这些一律交给 UI 上的"教练点评"通道。
     ================================================================== */
  const EXAMINER_RULES = [
    "You are a certified IELTS Speaking examiner conducting a real test. Your language is plain, fixed and procedural.",
    "Absolute rules:",
    "(1) Speak only English.",
    "(2) Never praise, never criticise, never congratulate, never comment on the quality of the answer.",
    "(3) Never give, hint at or mention a band score, and never refer to band descriptors out loud.",
    "(4) Never correct grammar, word choice or pronunciation.",
    "(5) Never explain the meaning of a word. If asked, reply exactly: I'm afraid I can't explain the words. Could you try to answer the question?",
    "(6) Never chat, never share your own views, never ask about anything outside the test topics.",
    "(7) Ask exactly ONE question per turn and keep your spoken reply under 35 words.",
    "(8) Build the next question on what the candidate actually said; if they mention a specific detail, dig into that detail.",
    "(9) 'Mm-hmm.' or 'Right.' is your only acknowledgement, and it signals listening, not approval.",
    "(10) If the answer is under about 12 words, do not move on: ask one short neutral probe (Why is that? / Could you explain that a bit more?).",
    "(11) If the answer is off-topic, say: OK. Let's go back to the question about ... and repeat your previous question once. If they drift a second time, move on.",
    "(12) If the candidate asks you to repeat, repeat once, opening with: Sure. I asked you ..."
  ].join(" ");

  function examinerSystem(topic, part) {
    const byPart = part === 3
      ? " This is Part 3: every question must be abstract, societal or general — causes, change over time, generational differences, advantages and disadvantages, the role of government, and predictions. When an answer stays vague, ask for the reasoning behind it rather than accepting it."
      : part === 2
        ? " This is Part 2: the candidate speaks alone for up to two minutes. Do not interrupt or ask anything until they stop; then ask at most one question drawn from the last bullet of the task card."
        : " This is Part 1: keep questions short, personal and everyday — habits, preferences, likes, changes, descriptions and simple opinions about the candidate's own life.";
    return EXAMINER_RULES + byPart + " Current topic: " + JSON.stringify(topicTitle(topic)) + ".";
  }

  function topicTitle(topic) {
    if (!topic) return "";
    return topic.part === 2 ? (topic.cue || topic.zh) : (topic.zh + " / " + (topic.en || ""));
  }

  /* history: [{role:'assistant'|'user', content}] */
  async function examinerTurn(topic, part, history, opts) {
    const messages = [{ role: "system", content: examinerSystem(topic, part) }];
    messages.push({
      role: "user",
      content:
        "Here is the conversation so far. Produce your next turn as strict JSON with exactly these keys: " +
        '{"feedback": "...", "question": "...", "flag": "ok|short|offtopic|escalated", "coach": "..."}. ' +
        "feedback = what you say out loud in English before the next question. It must never evaluate the answer: " +
        "use only a listening signal (Mm-hmm. / Right. / I see.), a procedural pull-back line, or an empty string. " +
        "question = the single next question you ask. " +
        "coach = a note in Chinese for the candidate's study log. You do NOT say this out loud. In it, estimate the last answer " +
        "against the four official criteria (FC 流利与连贯、LR 词汇资源、GRA 语法多样性与准确性、PR 发音), quote the exact words or phrases " +
        "that justify each judgement, state plainly that PR cannot be judged from text, and give at most two concrete fixes. " +
        "Keep it under 160 Chinese characters. For the opening turn, coach is an empty string. " +
        "Do not add any text outside the JSON."
    });
    const convo = history.length
      ? history.map(h => (h.role === "assistant" ? "EXAMINER: " : "CANDIDATE: ") + h.content).join("\n")
      : "(This is the opening turn — start the interview with your first question.)";
    messages.push({ role: "user", content: convo });

    const out = await chat(messages, { json: true, temperature: 0.85, signal: opts && opts.signal });
    const j = parseJSON(out);
    if (!j || !j.question) return null;
    return {
      feedback: typeof j.feedback === "string" ? j.feedback : "",
      question: String(j.question).trim(),
      coach: typeof j.coach === "string" ? j.coach : "",
      flag: ["ok", "short", "offtopic", "escalated"].includes(j.flag) ? j.flag : "ok"
    };
  }

  /* ==================================================================
     三档升级：6 / 7 / 8 分并列改写 + 差异说明
     ================================================================== */
  async function upgradeAnswer(topic, question, answer, opts) {
    const messages = [{
      role: "system",
      content:
        "You are an IELTS Speaking coach working from the official band descriptors " +
        "(Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy). " +
        "You rewrite one candidate answer into three parallel versions.\n" +
        "Hard constraints:\n" +
        "· Keep the SAME facts, the SAME length range and the SAME speaker's voice. Improve the language; never invent new content or turn it into an essay.\n" +
        "· Every version must remain speakable aloud: contractions, natural rhythm, no written-only constructions.\n" +
        "· Avoid clichés (Last but not least, With the development of society, Every coin has two sides) and avoid stacking adjectives.\n" +
        "· Band 6: keep the candidate's own wording; fix errors, add only the simplest linking (and / so / also / but) and make sure every idea is complete.\n" +
        "· Band 7: upgrade to natural collocations and discourse markers (I'd say, to be honest, that said, which is why), vary sentence openings, include at least one subordinate clause.\n" +
        "· Band 8: precise and idiomatic lexis, flexible grammar (concessive or cleft structures), and a closing move that steps back to a wider point — while still sounding like spontaneous speech, not a memorised answer.\n" +
        "Reply in strict JSON only."
    }];
    messages.push({
      role: "user",
      content:
        "Topic: " + topicTitle(topic) + "\n" +
        "Question: " + (question || "(not available)") + "\n" +
        "Candidate's answer:\n" + answer + "\n\n" +
        "Return strict JSON with exactly these keys:\n" +
        '{"band6":"...","band7":"...","band8":"...",' +
        '"notes":[{"kind":"词汇|连接词|结构|语法","from":"...","to":"...","note":"..."}]}\n' +
        "notes must describe the changes that take a reader from the ORIGINAL answer to the Band 8 version (max 8 items). " +
        "In the \"note\" field, write Chinese and name the criterion it serves (FC / LR / GRA), for example: " +
        "\"LR：very important 换成 crucially important，搭配更精准\". No text outside the JSON."
    });
    const out = await chat(messages, { json: true, temperature: 0.6, signal: opts && opts.signal });
    const j = parseJSON(out);
    if (!j || !j.band6 || !j.band7 || !j.band8) return null;
    return {
      base: answer,
      tiered: true,
      tiers: [
        { band: 6, name: "6 分版 · 把话说清楚", desc: "保留你的原话，修正错误，只补最基础的连接，信息完整、没有硬伤。", text: String(j.band6) },
        { band: 7, name: "7 分版 · 词汇与衔接升级", desc: "换成地道搭配与话语标记，句式有主次，至少带一个从句。", text: String(j.band7) },
        { band: 8, name: "8 分版 · 结构与抽象升级", desc: "精准地道的用词、灵活的句式，结尾退一步给出更宏观的判断，但仍像即兴说话。", text: String(j.band8) }
      ],
      notes: Array.isArray(j.notes) ? j.notes.slice(0, 8).map(x => ({
        tier: 8, kind: x.kind || "改写", from: x.from || "", to: x.to || "", note: x.note || ""
      })) : []
    };
  }

  /* ==================================================================
     练习报告
     ================================================================== */
  async function sessionReport(payload, opts) {
    const messages = [{
      role: "system",
      content:
        "You are a demanding but fair IELTS Speaking coach. You diagnose one practice session against the four official criteria " +
        "(FC 流利与连贯、LR 词汇资源、GRA 语法多样性与准确性、PR 发音).\n" +
        "Rules:\n" +
        "· Anchor every point in the candidate's actual words — quote a short phrase when you praise or criticise something.\n" +
        "· PR cannot be judged from a transcript; if no audio measurement is provided, say so instead of guessing.\n" +
        "· Give the practice advice in a form the candidate can act on tomorrow, not general encouragement.\n" +
        "Reply in Chinese, in strict JSON."
    }];
    messages.push({
      role: "user",
      content:
        "Session data (JSON):\n" + JSON.stringify(payload).slice(0, 6000) + "\n\n" +
        "Return strict JSON: " +
        '{"overall":"两三句总评，指出最值得先解决的一项","strengths":["...","..."],"weaknesses":["...","..."],' +
        '"advice":["...","..."]}. Each array max 4 items, each item under 40 Chinese characters. ' +
        "In strengths and weaknesses, name the criterion (FC / LR / GRA / PR) and cite a concrete detail from the data."
    });
    const out = await chat(messages, { json: true, temperature: 0.6, signal: opts && opts.signal });
    const j = parseJSON(out);
    if (!j) return null;
    return {
      overall: String(j.overall || ""),
      strengths: (j.strengths || []).slice(0, 4).map(String),
      weaknesses: (j.weaknesses || []).slice(0, 4).map(String),
      advice: (j.advice || []).slice(0, 4).map(String)
    };
  }

  /* 连通性自检 */
  async function testConnection() {
    const out = await chat([
      { role: "system", content: "You are a connectivity probe. Reply with exactly: OK" },
      { role: "user", content: "ping" }
    ], { temperature: 0 });
    return (out || "").trim();
  }

  return { PRESETS, get, save, preset, isReady, status, chat, examinerTurn, upgradeAnswer, sessionReport, testConnection, parseJSON };
})();
