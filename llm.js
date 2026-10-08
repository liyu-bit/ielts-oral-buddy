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
     考官（Part 1 / Part 3）：根据真实回答动态追问 + 跑题判断
     ================================================================== */
  function examinerSystem(topic, part) {
    const base =
      "You are a certified IELTS Speaking examiner. You conduct a realistic, adaptive interview " +
      "and respond to what the candidate actually says — you never read from a fixed list. " +
      "Rules: (1) Speak only English. (2) Keep your spoken reply under 45 words. " +
      "(3) Ask exactly ONE question per turn. " +
      "(4) Base your next question on the candidate's last answer; if they mention something specific, dig into it. " +
      "(5) If the candidate is off-topic or answering a different question, say so briefly and steer them back. " +
      "(6) If their answer is very short (under ~12 words), ask them to expand instead of moving on. " +
      "(7) Never praise excessively and never reveal band scores during the interview.";
    const extra = part === 3
      ? " (8) This is Part 3: escalate every question to an abstract, societal or general level — causes, changes over time, comparisons, the role of government or institutions, advantages and disadvantages."
      : " (8) This is Part 1: keep questions short, personal and everyday.";
    return base + extra + "\nCurrent topic: " + JSON.stringify(topicTitle(topic)) + ".";
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
        '{"feedback": "...", "question": "...", "flag": "ok|short|offtopic|escalated"}. ' +
        "feedback = one short natural sentence reacting to the candidate (empty string if this is the opening turn). " +
        "question = the single next question you ask. " +
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
        "You are an IELTS Speaking coach. You rewrite a candidate's answer into three parallel versions " +
        "at Band 6, Band 7 and Band 8, using the official band descriptors (Fluency & Coherence, " +
        "Lexical Resource, Grammatical Range & Accuracy). Keep each version the SAME length and the SAME " +
        "content as the original — improve the language, do not invent new facts. Band 6: clean, correct, " +
        "simple linking. Band 7: better collocations, discourse markers, at least one subordinate clause. " +
        "Band 8: precise and idiomatic lexis, flexible grammar, a concessive or complex structure, some " +
        "abstract framing. Reply in strict JSON only."
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
        "notes must list every meaningful change you made from the ORIGINAL answer to the Band 8 version " +
        "(max 8 items), in Chinese for the \"note\" field. No text outside the JSON."
    });
    const out = await chat(messages, { json: true, temperature: 0.6, signal: opts && opts.signal });
    const j = parseJSON(out);
    if (!j || !j.band6 || !j.band7 || !j.band8) return null;
    return {
      base: answer,
      tiered: true,
      tiers: [
        { band: 6, name: "6 分版 · 把话说清楚", desc: "结构干净、时态正确、有基本衔接。", text: String(j.band6) },
        { band: 7, name: "7 分版 · 词汇与衔接升级", desc: "更好的搭配、话语标记与从句。", text: String(j.band7) },
        { band: 8, name: "8 分版 · 结构与抽象升级", desc: "精准地道用词、灵活句式、让步与抽象延展。", text: String(j.band8) }
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
        "You are a demanding but encouraging IELTS Speaking coach. You analyse a practice session from " +
        "the raw data and the candidate's own answers, then give a short, concrete diagnosis. " +
        "Be specific and reference what the candidate actually said. Reply in Chinese, in strict JSON."
    }];
    messages.push({
      role: "user",
      content:
        "Session data (JSON):\n" + JSON.stringify(payload).slice(0, 6000) + "\n\n" +
        "Return strict JSON: " +
        '{"overall":"一两句总评","strengths":["...","..."],"weaknesses":["...","..."],' +
        '"advice":["...","..."]}. Each array max 4 items, each item under 40 Chinese characters.'
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
