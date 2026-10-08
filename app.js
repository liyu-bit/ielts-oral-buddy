/* IELTS Oral Buddy · 主应用逻辑
   ------------------------------------------------------------------ */

(function () {
  "use strict";

  /* ======================= 基础工具 ======================= */
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const nowISO = () => new Date().toISOString();
  const fmtDate = (ts) => {
    const d = new Date(ts);
    const p = n => String(n).padStart(2, "0");
    return (d.getMonth() + 1) + "/" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
  };
  const mmss = s => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");

  /* 图标：引用 index.html 页首那个内联 SVG 精灵。
     cls 可传 "ic-ok" / "ic-warn" / "ic-err" / "ic-info" 做语义着色。 */
  function IC(name, cls) {
    return '<svg class="ic' + (cls ? " " + cls : "") + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>';
  }
  const prefersReduce = () => {
    try { return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
    catch (e) { return false; }
  };

  /* 逐字打出：让考官的提问像流式输出一样出现（约 0.3–0.6 秒）。
     用户开启"减少动效"或文本很长时直接整段显示，不拖慢阅读。 */
  function typeIn(el, text, box) {
    if (!el) return;
    if (prefersReduce() || text.length > 260) { el.textContent = text; return; }
    el.textContent = "";
    const span = document.createElement("span");
    const caret = document.createElement("span");
    caret.className = "caret";
    el.appendChild(span); el.appendChild(caret);
    const step = Math.max(4, Math.min(16, Math.round(320 / Math.max(1, text.length))));
    let i = 0;
    (function tick() {
      if (i >= text.length) { if (caret.parentNode) caret.parentNode.removeChild(caret); return; }
      span.textContent += text.charAt(i++);
      if (box) box.scrollTop = box.scrollHeight;
      setTimeout(tick, step);
    })();
  }
  /* 等待指示：三点跳动（比原来那行斜体文字更像"对方在打字"） */
  function thinkingHTML() {
    return '<span class="typing" role="status" aria-label="考官正在输入"><i></i><i></i><i></i></span>';
  }

  let toastTimer = null;
  /* type: 省略=成功/中性 · "warn"=需要注意 · "err"=失败（错误停留更久） */
  function toast(msg, type) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.remove("warn", "err");
    if (type === "warn" || type === "err") el.classList.add(type);
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), type === "err" ? 3600 : 2200);
  }

  const rand = arr => arr[Math.floor(Math.random() * arr.length)];

  /* ---------- 存储层 ----------
     localStorage 在个别环境（隐私模式、部分浏览器的 file:// 页面）会被禁用，
     直接访问会抛异常并让整个页面失效。这里先探测，失败则回退到内存存储。 */
  const MEMSTORE = {};
  const LS = (function () {
    try {
      const probe = "__im_probe__";
      window.localStorage.setItem(probe, "1");
      window.localStorage.removeItem(probe);
      return window.localStorage;
    } catch (e) {
      console.warn("localStorage 不可用，已回退到内存存储（关闭页面后记录不保留）");
      return {
        getItem: k => (k in MEMSTORE ? MEMSTORE[k] : null),
        setItem: (k, v) => { MEMSTORE[k] = String(v); },
        removeItem: k => { delete MEMSTORE[k]; }
      };
    }
  })();

  const hasIDB = (function () {
    try { return typeof window.indexedDB !== "undefined" && !!window.indexedDB; }
    catch (e) { return false; }
  })();


  /* ======================= 设置存储 ======================= */
  const SKEY = "im_settings";
  const DEF_SET = {
    accent: "en-GB", rate: 0.95,
    autoTimer: true, autoSpeak: true,
    mockRecord: true,
    examinerName: "Amy"
  };
  let SET = loadJSON(SKEY, DEF_SET);
  SET = Object.assign({}, DEF_SET, SET);
  function saveSet() { LS.setItem(SKEY, JSON.stringify(SET)); }

  function loadJSON(key, def) {
    try { const v = JSON.parse(LS.getItem(key)); return v == null ? def : v; }
    catch (e) { return def; }
  }

  /* ======================= 语音（考官口音 / 语速） ======================= */
  const ACCENT_LABEL = { "en-GB": "英音", "en-US": "美音", "en-AU": "澳音" };
  let voices = [];
  function loadVoices() { voices = window.speechSynthesis ? speechSynthesis.getVoices() : []; }
  loadVoices();
  if (window.speechSynthesis) speechSynthesis.onvoiceschanged = loadVoices;

  function pickVoice(lang) {
    const norm = l => (l || "").replace("_", "-").toLowerCase();
    const t = norm(lang);
    const two = t.slice(0, 2);
    return voices.find(v => norm(v.lang) === t)
        || voices.find(v => norm(v.lang).startsWith(t))
        || voices.find(v => norm(v.lang).startsWith(two) && /google|natural|online|premium/i.test(v.name))
        || voices.find(v => norm(v.lang).startsWith(two))
        || null;
  }
  function accentAvailable(lang) { return !!pickVoice(lang); }

  let speaking = false;
  function stopSpeak() { if (window.speechSynthesis) speechSynthesis.cancel(); speaking = false; }

  function speak(text, opts) {
    opts = opts || {};
    if (!window.speechSynthesis || !text) { if (opts.onend) opts.onend(); return null; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text));
    const lang = opts.lang || SET.accent;
    u.lang = lang;
    u.rate = opts.rate != null ? opts.rate : SET.rate;
    u.pitch = opts.pitch != null ? opts.pitch : 1;
    const v = pickVoice(lang);
    if (v) u.voice = v;
    if (opts.onend) u.onend = opts.onend;
    speaking = true;
    speechSynthesis.speak(u);
    return u;
  }

  /* ======================= 练习历史 / 生词本 ======================= */
  const LKEY = "im_log";
  const WKEY = "im_wordbook";
  function loadLog() { const v = loadJSON(LKEY, []); return Array.isArray(v) ? v : []; }
  function saveLog(list) { LS.setItem(LKEY, JSON.stringify(list.slice(0, 400))); }
  function pushLog(rec) { const l = loadLog(); l.unshift(rec); saveLog(l); bumpSessions(); }

  function loadWb() { const v = loadJSON(WKEY, []); return Array.isArray(v) ? v : []; }
  function saveWb(list) { LS.setItem(WKEY, JSON.stringify(list.slice(0, 500))); }

  let sessions = +(LS.getItem("im_sessions") || 0);
  function bumpSessions() { sessions++; LS.setItem("im_sessions", sessions); renderPill(); }
  function renderPill() { $("#statPill").textContent = "累计练习：" + sessions + " 次"; const k = $("#kpiSessions"); if (k) k.textContent = sessions; }
  renderPill();

  /* ======================= 题库与筛选 ======================= */
  const LIB = window.IELTS_TOPICS;
  const P1 = LIB.part1.map(t => Object.assign({}, t, { part: 1 }));
  const P2 = LIB.part2.map(t => Object.assign({}, t, { part: 2 }));
  const ALL = P1.concat(P2);
  const BY_ID = {};
  ALL.forEach(t => { BY_ID[t.id] = t; });
  const titleOf = t => t.part === 2 ? (t.zh + " · " + (t.cue || "")) : (t.zh + " · " + (t.en || ""));

  const filter = { part: "all", scene: "all", season: "all", cat: "all", level: "all" };

  function poolFor(f) {
    return ALL.filter(t =>
      (f.part === "all" || t.part === +f.part) &&
      (f.scene === "all" || t.scene === f.scene) &&
      (f.season === "all" || t.season === f.season) &&
      (f.cat === "all" || t.cat === f.cat) &&
      (f.level === "all" || t.level === f.level));
  }
  function promptsFor(f) {
    const out = [];
    poolFor(f).forEach(t => {
      if (t.part === 1) t.qs.forEach((q, i) => out.push({ key: t.id + "#" + i, part: 1, topic: t, qi: i, text: q }));
      else out.push({ key: t.id, part: 2, topic: t, text: t.cue });
    });
    return out;
  }

  /* ======================= 路由 ======================= */
  function showPage(name) {
    flushOnLeave();
    $$(".page").forEach(p => p.classList.remove("active"));
    const el = $("#page-" + name);
    if (el) el.classList.add("active");
    $$(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.page === name));
    stopSpeak(); stopMockTimers(); cancelAutoTimer();
    window.scrollTo(0, 0);
  }
  $$(".tab-btn").forEach(b => b.addEventListener("click", () => showPage(b.dataset.page)));
  document.addEventListener("click", e => {
    const g = e.target.closest("[data-goto]");
    if (g) showPage(g.dataset.goto);
  });

  /* ======================= 首页 ======================= */
  function renderSeasonBanner() {
    const m = LIB.meta;
    const end = new Date(m.nextChange + "T00:00:00");
    const days = Math.ceil((end - new Date()) / 86400000);
    const cnt = m.counts;
    let tail;
    if (days > 0) tail = "距下一次换题季约 <b>" + days + "</b> 天，建议优先吃透「当季新题」。";
    else tail = "换题季可能已经开始，记得更新 <b>topics.js</b> 的题库数据。";
    $("#seasonBanner").innerHTML =
      '<div>' + IC("calendar") + ' <b>题库更新季：' + esc(m.version) + '</b>（' + esc(m.seasonRange) + '）<br>' +
      "当前收录 <b>" + cnt.totalTopics + "</b> 个话题 / <b>" + cnt.drawablePrompts + "</b> 个可抽题面（Part 1 问题 " +
      cnt.part1Questions + " 道 · Part 2 题卡 " + cnt.part2Cards + " 套 · Part 3 追问 " + cnt.part3Questions + " 道）。" + tail +
      "</div>";
  }

  function renderKpi() {
    const cnt = LIB.meta.counts;
    $("#kpiTopics").textContent = cnt.totalTopics + " 个";
    $("#kpiPrompts").textContent = cnt.drawablePrompts + " 个";
    const recs = loadLog().filter(r => r.scores);
    const avg = recs.length
      ? (recs.reduce((s, r) => s + (r.scores.FC + r.scores.LR + r.scores.GRA + r.scores.PR) / 4, 0) / recs.length).toFixed(1)
      : "—";
    $("#kpiAvg").textContent = avg;
  }

  /* ---------- AI 考官引擎设置 ---------- */
  function renderEngineSettings() {
    const sel = $("#llmProvider");
    sel.innerHTML = window.IELTS_LLM.PRESETS.map(p => '<option value="' + p.id + '">' + esc(p.label) + "</option>").join("");
    const c = window.IELTS_LLM.get();
    sel.value = c.provider;
    $("#llmBase").value = c.baseUrl || "";
    $("#llmModel").value = c.model || "";
    $("#llmKey").value = c.apiKey || "";
    syncEngineUI();
  }
  function syncEngineUI() {
    const ready = window.IELTS_LLM.isReady();
    const st = window.IELTS_LLM.status();
    $("#engineBadge").textContent = ready ? "已接入大模型" : st;
    $("#engineBadge").className = "badge" + (ready ? " purple" : " gray");
    $("#llmHint").textContent = ready
      ? "当前引擎：" + st + "（回答将实时发送到该模型服务商）"
      : "当前引擎：本地智能引擎（离线可用）";
    const b1 = $("#mockEngineBadge"); if (b1) { b1.textContent = st; }
    const b2 = $("#examinerBadge"); if (b2) { b2.textContent = window.IELTS_LLM.isReady() ? "Amy · LLM" : "Amy · 本地"; }
  }
  $("#llmProvider").addEventListener("change", () => {
    const p = window.IELTS_LLM.preset($("#llmProvider").value);
    if (p.id !== "custom") { $("#llmBase").value = p.baseUrl; $("#llmModel").value = p.model; }
    else { $("#llmBase").value = ""; $("#llmModel").value = ""; }
  });
  $("#btnLlmSave").addEventListener("click", () => {
    window.IELTS_LLM.save({
      provider: $("#llmProvider").value,
      baseUrl: $("#llmBase").value.trim(),
      model: $("#llmModel").value.trim(),
      apiKey: $("#llmKey").value.trim()
    });
    syncEngineUI();
    toast(window.IELTS_LLM.isReady() ? "已接入大模型，考官将实时生成追问" : "已切换为本地智能引擎");
  });
  $("#btnLlmClear").addEventListener("click", () => {
    window.IELTS_LLM.save({ provider: "local", baseUrl: "", model: "", apiKey: "" });
    renderEngineSettings(); toast("已清除配置，回到本地智能引擎");
  });
  $("#btnLlmTest").addEventListener("click", async () => {
    $("#btnLlmTest").disabled = true; $("#llmHint").textContent = "正在测试…";
    try {
      window.IELTS_LLM.save({
        provider: $("#llmProvider").value, baseUrl: $("#llmBase").value.trim(),
        model: $("#llmModel").value.trim(), apiKey: $("#llmKey").value.trim()
      });
      const r = await window.IELTS_LLM.testConnection();
      $("#llmHint").innerHTML = IC('check', 'ic-ok') + " 连通成功，模型回复：" + esc(r.slice(0, 40));
      syncEngineUI();
    } catch (e) {
      $("#llmHint").innerHTML = IC('x', 'ic-err') + " " + esc(e.message) + (e.message === "Failed to fetch" ? "（可能是网络或该服务商未开放浏览器直连）" : "");
    }
    $("#btnLlmTest").disabled = false;
  });

  /* ---------- 口音 / 语速 ---------- */
  function bindChips(sel, key, after) {
    $$(sel + " .fchip").forEach(c => c.addEventListener("click", () => {
      $$(sel + " .fchip").forEach(x => x.classList.remove("on"));
      c.classList.add("on");
      SET[key] = key === "rate" ? +c.dataset.v : c.dataset.v;
      saveSet(); if (after) after();
    }));
  }
  function renderVoiceSettings() {
    $$("#accentChips .fchip").forEach(c => c.classList.toggle("on", c.dataset.v === SET.accent));
    $$("#rateChips .fchip").forEach(c => c.classList.toggle("on", +c.dataset.v === SET.rate));
    $("#optAutoTimer").checked = !!SET.autoTimer;
    $("#optAutoSpeak").checked = !!SET.autoSpeak;
    const missing = Object.keys(ACCENT_LABEL).filter(l => !accentAvailable(l));
    const box = $("#voiceListBox");
    const en = voices.filter(v => /^en/i.test(v.lang));
    box.innerHTML = en.length
      ? "本机可用英文音色 " + en.length + " 个：" + en.slice(0, 12).map(v => esc(v.name + " (" + v.lang + ")")).join("、") +
        (missing.length ? "<br>" + IC('alert') + " 本机缺少：" + missing.map(l => ACCENT_LABEL[l]).join("、") + "，会自动退回最接近的英文音色。" : "")
      : "尚未加载到英文音色，可点“试听”触发加载（部分浏览器需先有用户交互）。";
  }
  bindChips("#accentChips", "accent", () => { renderVoiceSettings(); toast("考官口音：" + ACCENT_LABEL[SET.accent]); });
  bindChips("#rateChips", "rate");
  $("#btnVoiceTest").addEventListener("click", () => {
    loadVoices();
    speak("Good morning. Let's begin. Can you tell me something about where you live?", { rate: SET.rate });
  });
  $("#btnVoiceList").addEventListener("click", () => { loadVoices(); renderVoiceSettings(); });
  $("#optAutoTimer").addEventListener("change", e => { SET.autoTimer = e.target.checked; saveSet(); });
  $("#optAutoSpeak").addEventListener("change", e => { SET.autoSpeak = e.target.checked; saveSet(); });
  $("#optMockRecord").addEventListener("change", e => { SET.mockRecord = e.target.checked; saveSet(); });

  /* ======================= 对话控制器（考官） ======================= */
  const CONV = {
    topic: null, part: 1, mode: "single",
    history: [], asked: [], lastQ: "", anchorQ: "",
    busy: false, reaskDone: false, saved: false,
    buf: []          // 本轮问答记录
  };

  function convReset(topic, part, mode) {
    CONV.topic = topic; CONV.part = part; CONV.mode = mode || "single";
    CONV.history = []; CONV.asked = []; CONV.lastQ = ""; CONV.anchorQ = "";
    CONV.busy = false; CONV.reaskDone = false; CONV.saved = false; CONV.buf = [];
  }

  function addMsg(boxSel, who, text, opts) {
    opts = opts || {};
    const box = $(boxSel);
    if (!box) return null;
    const el = document.createElement("div");
    el.className = "msg " + who;
    if (who === "ai") {
      const w = document.createElement("div");
      w.className = "who"; w.textContent = SET.examinerName;
      const body = document.createElement("span");
      body.className = "body";
      if (opts.html) body.innerHTML = text; else body.textContent = text;
      el.appendChild(w); el.appendChild(body);
      if (opts.type && !opts.html) typeIn(body, text, box);
    } else if (opts.html) el.innerHTML = text;
    else el.textContent = text;
    box.appendChild(el);
    box.scrollTop = box.scrollHeight;
    if (opts.speak && SET.autoSpeak) speak(text, { rate: SET.rate });
    return el;
  }
  function addSys(boxSel, text, opts) { return addMsg(boxSel, "sys", text, opts); }

  /* 考官开场 */
  function examinerOpen(topic, part, specificQ, boxSel) {
    let q;
    if (part === 2) {
      q = "Here's your topic card. You have one minute to prepare, then speak for up to two minutes.";
    } else if (specificQ) {
      q = specificQ;
    } else if (part === 3 && topic.part3 && topic.part3.length) {
      q = topic.part3[0][0];
    } else {
      q = topic.qs && topic.qs[0] ? topic.qs[0] : "Tell me about it.";
    }
    CONV.asked.push(q); CONV.lastQ = q;
    CONV.history.push({ role: "assistant", content: q });
    addMsg(boxSel, "ai", q, { speak: true, type: true });
    return q;
  }

  /* 本地：混合策略（题库骨架 + 基于回答的动态追问） */
  function localNext(answer) {
    const t = CONV.topic, asked = CONV.asked, lastQ = CONV.lastQ;
    const d = window.IELTS_ENGINE.diagnose(answer, t, lastQ);
    const rich = d.words >= 25 && d.hasReason && d.hasExample;
    const bank = CONV.part === 3
      ? (t.part3 || []).map(p => p[0])
      : (t.qs || []);
    const left = bank.filter(q => asked.indexOf(q) < 0);

    if (d.offTopic || d.tooShort || rich || !left.length) {
      return window.IELTS_ENGINE.react({
        topic: t, part: CONV.part, asked: asked, lastQ: lastQ, anchorQ: CONV.anchorQ,
        answer: answer, reaskDone: CONV.reaskDone
      });
    }
    return {
      question: left[0],
      feedback: d.words >= 15 ? "Good — let's move on." : "",
      flag: "ok"
    };
  }

  async function nextTurn(answer, boxSel) {
    const t = CONV.topic;
    let res = null, engine = "local";

    if (window.IELTS_LLM.isReady() && CONV.part !== 2) {
      try {
        res = await window.IELTS_LLM.examinerTurn(t, CONV.part, CONV.history);
        if (res) engine = "llm";
      } catch (e) {
        addSys(boxSel, "大模型调用失败：" + e.message + " —— 本次改用本地引擎继续。");
      }
    }
    if (!res) res = localNext(answer);

    if (res.feedback) addMsg(boxSel, "ai", res.feedback);
    addMsg(boxSel, "ai", res.question, { speak: true, type: true });
    CONV.asked.push(res.question);
    const prevQ = CONV.lastQ;
    CONV.lastQ = res.question;
    CONV.history.push({ role: "assistant", content: (res.feedback ? res.feedback + " " : "") + res.question });
    if (CONV.history.length > 24) CONV.history = CONV.history.slice(-24);

    const d = window.IELTS_ENGINE.diagnose(answer, t, prevQ);
    CONV.buf.push({ q: prevQ || res.question, a: answer, words: d.words, fillers: d.fillers, flag: res.flag, engine: engine });

    if (res.flag === "offtopic") {
      CONV.reaskDone = true;
      addSys(boxSel, IC('alert', 'ic-warn') + " 考官判定：上一回答偏离题目", { html: true });
    } else {
      CONV.reaskDone = false;
      /* 只有"内容型"问题才作为下一次追问的锚点 */
      if (res.flag === "ok" || res.flag === "escalated") CONV.anchorQ = res.question;
    }
    return res;
  }

  /* 用户提交回答（单题练习） */
  async function submitAnswer(text, boxSel) {
    text = (text || "").trim();
    if (!text || CONV.busy) return;
    if (!CONV.topic) { toast("先抽一道题、点「进入练习」再作答", "warn"); return; }
    CONV.busy = true;
    addMsg(boxSel, "me", text);
    CONV.history.push({ role: "user", content: text });
    const tip = addMsg(boxSel, "ai", thinkingHTML(), { html: true });
    try {
      await nextTurn(text, boxSel);
    } finally {
      if (tip && tip.parentNode) tip.parentNode.removeChild(tip);
      CONV.busy = false;
    }
  }

  /* ======================= 抽题练习 ======================= */
  let drawn = null;
  const recentDraw = [];

  function renderFilterChips() {
    const scenes = LIB.meta.scenes;
    $("#fScene").innerHTML = '<span class="fchip' + (filter.scene === "all" ? " on" : "") + '" data-v="all">全部场景</span>' +
      scenes.map(s => '<span class="fchip' + (filter.scene === s ? " on" : "") + '" data-v="' + esc(s) + '">' + esc(s) + "</span>").join("");
    $("#fSeason").innerHTML = '<span class="fchip' + (filter.season === "all" ? " on" : "") + '" data-v="all">全部</span>' +
      LIB.meta.seasons.map(s => '<span class="fchip' + (filter.season === s ? " on" : "") + '" data-v="' + esc(s) + '">' + esc(s) + "</span>").join("");
    const cats = [...new Set(poolFor(Object.assign({}, filter, { cat: "all" })).map(t => t.cat))];
    if (filter.cat !== "all" && cats.indexOf(filter.cat) < 0) filter.cat = "all";
    $("#fCat").innerHTML = '<span class="fchip' + (filter.cat === "all" ? " on" : "") + '" data-v="all">全部类别</span>' +
      cats.map(c => '<span class="fchip' + (filter.cat === c ? " on" : "") + '" data-v="' + esc(c) + '">' + esc(c) + "</span>").join("");
    bindFilter("#fScene", "scene", renderAll);
    bindFilter("#fSeason", "season", renderAll);
    bindFilter("#fCat", "cat", renderAll);
  }
  function bindFilter(sel, key, after) {
    $$(sel + " .fchip").forEach(c => c.addEventListener("click", () => {
      $$(sel + " .fchip").forEach(x => x.classList.remove("on"));
      c.classList.add("on"); filter[key] = c.dataset.v;
      if (after) after();
    }));
  }
  function bindPartLevel() {
    $$("#fPart .fchip").forEach(c => c.addEventListener("click", () => {
      $$("#fPart .fchip").forEach(x => x.classList.remove("on"));
      c.classList.add("on"); filter.part = c.dataset.v; renderAll();
    }));
    $$("#fLevel .fchip").forEach(c => c.addEventListener("click", () => {
      $$("#fLevel .fchip").forEach(x => x.classList.remove("on"));
      c.classList.add("on"); filter.level = c.dataset.v; renderAll();
    }));
  }
  function renderAll() { renderFilterChips(); renderPoolInfo(); }

  /* 标签层次：主标签保留为徽章（每张卡最多 1 个），类别 / 场景 / 季节 / 难度
     降级为一行中性元信息。原来一张抽题卡会叠 5 个同尺寸徽章，等于没有重点。 */
  const PART_LABEL = { 1: "问答", 2: "陈述", 3: "深入讨论" };
  function tagHead(part, meta) {
    const line = (meta || []).filter(Boolean).map(esc).join(" · ");
    return '<span class="badge' + (part === 2 ? " amber" : "") + '">Part ' + part + " · " + (PART_LABEL[part] || "") + "</span>" +
      (line ? '<div class="meta-line">' + line + "</div>" : "");
  }

  function renderPoolInfo() {
    const p = promptsFor(filter);
    const t = poolFor(filter);
    const mix = { 1: 0, 2: 0 };
    p.forEach(x => mix[x.part]++);
    $("#poolInfo").textContent = "当前范围：" + t.length + " 个话题 / " + p.length + " 个可抽题面（Part 1 " + mix[1] + " · Part 2 " + mix[2] + "）";
    renderFilterSummary(p.length);
  }

  /* 筛选栏收起时也要让人知道"当前筛了什么、还剩多少题" */
  function filterActive() {
    return ["part", "scene", "season", "cat", "level"].some(k => filter[k] !== "all");
  }
  function renderFilterSummary(count) {
    const seg = [
      filter.part === "all" ? "全部题型" : "Part " + filter.part,
      filter.scene === "all" ? "全部场景" : filter.scene,
      filter.season === "all" ? "全部" : filter.season,
      filter.cat === "all" ? "全部类别" : filter.cat,
      filter.level === "all" ? "不限" : filter.level
    ];
    const s = $("#filterSummary");
    if (s) s.textContent = seg.join(" · ");
    const coll = $("#filterColl");
    if (coll) coll.dataset.active = filterActive() ? "true" : "false";
    const badge = $("#poolBadge");
    if (badge) {
      const n = count == null ? promptsFor(filter).length : count;
      badge.textContent = n ? "可抽 " + n + " 题" : "无匹配";
      badge.className = "badge" + (n ? "" : " danger");
    }
  }

  /* ---------- 渐进披露 ----------
     .coll 容器用 data-collapsed 控制展开态；点击整条 .coll-head 即可切换
     （内部 button 负责键盘与无障碍，事件冒泡到 head 上统一处理）。 */
  function setCollapsed(coll, collapsed) {
    if (!coll) return;
    coll.dataset.collapsed = collapsed ? "true" : "false";
    const btn = coll.querySelector(".coll-toggle");
    if (btn) btn.setAttribute("aria-expanded", String(!collapsed));
  }
  function initCollapses() {
    document.addEventListener("click", e => {
      const t = e.target;
      if (!t || typeof t.closest !== "function") return;
      const head = t.closest(".coll-head");
      if (!head) return;
      const coll = head.closest(".coll");
      if (!coll) return;
      setCollapsed(coll, coll.dataset.collapsed === "false");
    });
  }
  bindPartLevel();

  function doDraw() {
    const pool = promptsFor(filter);
    if (!pool.length) {
      $("#drawResult").style.display = "block";
      $("#drawnCard").innerHTML = '<span style="color:var(--danger);font-size:var(--fs-lead)">当前组合下没有题目，请放宽筛选条件。</span>';
      $("#btnDrawAgain").style.display = "none";
      return;
    }
    let pick, guard = 0;
    do { pick = rand(pool); guard++; }
    while (recentDraw.indexOf(pick.key) >= 0 && guard < 30 && pool.length > 3);
    recentDraw.push(pick.key); if (recentDraw.length > 8) recentDraw.shift();
    drawn = pick;

    $("#drawResult").style.display = "block";
    $("#btnDrawAgain").style.display = "inline-block";
    $("#drawnCard").innerHTML =
      "<div>" + tagHead(pick.part, [pick.topic.cat, pick.topic.scene, pick.topic.season, pick.topic.level]) + "</div>" +
      '<div class="drawn-q">' + esc(pick.text) + "</div>" +
      '<div class="meta-line" style="margin-top:var(--sp-2)">' +
      (pick.part === 1
        ? "话题：" + esc(pick.topic.zh) + " / " + esc(pick.topic.en) + "（共 " + pick.topic.qs.length + " 问，第 " + (pick.qi + 1) + " 问）"
        : "题卡：" + esc(pick.topic.zh) + "（" + pick.topic.bullets.length + " 个要点）· 抽中后自动开始计时") +
      "</div>";
    $("#btnGoTopic").textContent = pick.part === 2 ? "进入 Part 2 模拟（自动计时）→" : "进入练习 →";
  }
  $("#btnDraw").addEventListener("click", doDraw);
  $("#btnDrawAgain").addEventListener("click", doDraw);
  $("#btnGoTopic").addEventListener("click", () => {
    if (!drawn) return;
    openTopic(drawn.topic.id, drawn.part === 1 ? drawn.qi : undefined, { auto: drawn.part === 2 });
  });

  /* ======================= 话题详情 ======================= */
  let curTopic = null;

  function openTopic(id, qi, opts) {
    opts = opts || {};
    curTopic = BY_ID[id];
    if (!curTopic) return;
    const isP2 = curTopic.part === 2;

    $("#practiceHome").classList.add("hidden");
    $("#practiceDetail").classList.remove("hidden");

    $("#dHead").innerHTML = "<h1>" + esc(curTopic.zh) + "</h1>" +
      tagHead(curTopic.part, [curTopic.cat, curTopic.scene, curTopic.season, curTopic.level]);

    if (isP2) {
      $("#dCue").classList.remove("no-label");
      $("#dCue").innerHTML = '<p style="font-weight:600;font-size:var(--fs-lead)">' + esc(curTopic.cue) + "</p><ul>" +
        curTopic.bullets.map(b => "<li>" + esc(b) + "</li>").join("") + "</ul>";
    } else {
      $("#dCue").classList.add("no-label");
      $("#dCue").innerHTML = '<p style="font-weight:600;font-size:var(--fs-lead)">' + esc(curTopic.en) + "</p>" +
        '<p style="font-size:var(--fs-body);color:var(--muted);margin:2px 0 var(--sp-3)">本话题共 ' + curTopic.qs.length + " 问，当前高亮为抽中的题目</p>" +
        curTopic.qs.map((q, i) => '<div class="qlist-item' + (i === qi ? " hot" : "") + '">' + (i + 1) + ". " + esc(q) + "</div>").join("");
    }

    /* 词汇：点击朗读，点 + 加入生词本 */
    $("#dVocab").innerHTML = curTopic.vocab.map((v, i) =>
      '<span class="vocab-item" data-wi="' + i + '"><span class="plus" data-add="' + i + '" title="加入生词本">' + IC("plus") + '</span>' + esc(v[0]) + "<i>" + esc(v[1]) + "</i></span>").join("");
    $$("#dVocab .vocab-item").forEach(el => {
      el.addEventListener("click", e => {
        const i = +el.dataset.wi;
        if (e.target.dataset.add != null) { addWord(curTopic.vocab[i], curTopic); return; }
        speak(curTopic.vocab[i][0], { rate: 0.9 });
      });
    });
    $("#dExprs").innerHTML = curTopic.exprs.map((e, i) =>
      '<div class="expr-li" data-ei="' + i + '">' + esc(e[0]) + "<small>" + esc(e[1]) + "</small></div>").join("");
    $$("#dExprs .expr-li").forEach(el => el.addEventListener("click", () => {
      speak(curTopic.exprs[+el.dataset.ei][0], { rate: 0.9 });
    }));
    /* 素材卡收起时用一行摘要告知存量，换话题时重新收起 */
    const mc = $("#materialCount");
    if (mc) mc.textContent = curTopic.vocab.length + " 词 · " + curTopic.exprs.length + " 表达";
    setCollapsed($("#materialColl"), true);

    /* 清空上一话题状态 */
    $("#chatBox").innerHTML = "";
    $("#upgradeBody").innerHTML = "";
    $("#assessSaved").textContent = "";
    $("#btnSaveAssess").disabled = false;
    lastSimMeta = null;
    stopSpeak(); $("#recHint").textContent = "语音识别需 Chrome / Edge 并允许麦克风。";

    if (isP2) {
      $("#autoTimerCard").classList.add("hidden");
      $("#simWrap").classList.remove("hidden");
      resetSim();
      convReset(curTopic, 2, "single");
      if (opts.auto && SET.autoTimer) startAutoTimer();
    } else {
      cancelAutoTimer();
      $("#autoTimerCard").classList.add("hidden");
      $("#simWrap").classList.add("hidden");
      convReset(curTopic, 1, "single");
      examinerOpen(curTopic, 1, typeof qi === "number" ? curTopic.qs[qi] : null, "#chatBox");
    }
    renderTopicHistory();
    window.scrollTo(0, 0);
  }
  window.APP = { backHome: function () { showPage("practice"); }, speakTopicTitle: null };

  $("#btnSend").addEventListener("click", () => {
    const v = $("#chatInput").value; $("#chatInput").value = "";
    submitAnswer(v, "#chatBox");
  });
  $("#chatInput").addEventListener("keydown", e => { if (e.key === "Enter") { const v = e.target.value; e.target.value = ""; submitAnswer(v, "#chatBox"); } });
  $("#btnSpeakQ").addEventListener("click", () => { if (CONV.lastQ) speak(CONV.lastQ, { rate: SET.rate }); });
  $("#btnEndTopic").addEventListener("click", () => { if (curTopic) endRound(); });

  /* 语音识别（练习 + 模考共用） */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null, recOn = false;
  function initSR(onFinal, hintSel, btnSel) {
    if (!SR) return null;
    const r = new SR();
    r.lang = SET.accent; r.interimResults = false; r.continuous = false;
    r.onresult = e => { const t = e.results[0][0].transcript; onFinal(t); };
    r.onend = () => { recOn = false; const b = $(btnSel); if (b) b.classList.remove("rec"); };
    r.onerror = () => { recOn = false; const b = $(btnSel); if (b) b.classList.remove("rec"); if (hintSel) $(hintSel).textContent = "未捕获到语音，可改用打字。"; };
    return r;
  }
  function bindMic(btnSel, srRef) {
    const btn = $(btnSel);
    if (!btn) return;
    btn.addEventListener("click", () => {
      if (!srRef.g) { if (!SR) { toast("当前浏览器不支持语音识别，请用 Chrome / Edge", "err"); return; } srRef.g = initSR(srRef.onFinal, srRef.hint, btnSel); }
      if (recOn) { try { srRef.g.stop(); } catch (e) {} return; }
      try { srRef.g.start(); recOn = true; btn.classList.add("rec"); } catch (e) { toast("麦克风启动失败：" + e.message, "err"); }
    });
  }
  const micPractice = { g: null, onFinal: t => { $("#chatInput").value = t; submitAnswer(t, "#chatBox"); }, hint: "#recHint" };
  const micMock = { g: null, onFinal: t => { $("#mockInput").value = t; mockSubmit(); }, hint: "#mockRecHint" };
  bindMic("#btnMic", micPractice);
  bindMic("#mockMic", micMock);
  if (SR) { $("#recHint").innerHTML = "点击 " + IC("mic") + " 说英语，识别后自动发送。"; $("#mockRecHint").innerHTML = "点击 " + IC("mic") + " 说英语，识别后自动发送。"; }

  /* ======================= 录音器（共用） ======================= */
  const hasMR = typeof MediaRecorder !== "undefined" && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const Rec = {
    mr: null, chunks: [], stream: null, sr: null, transcript: "", startTs: 0, onDone: null,
    async start(onDone) {
      this.onDone = onDone; this.chunks = []; this.transcript = ""; this.startTs = Date.now();
      if (hasMR) {
        try {
          this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          this.mr = new MediaRecorder(this.stream);
          this.mr.ondataavailable = e => { if (e.data && e.data.size) this.chunks.push(e.data); };
          this.mr.onstop = () => this._finish();
          this.mr.start();
        } catch (e) { this.mr = null; }
      }
      if (SR) {
        try {
          this.sr = new SR(); this.sr.lang = SET.accent; this.sr.continuous = true; this.sr.interimResults = false;
          this.sr.onresult = e => { for (const r of e.results) if (r.isFinal) this.transcript += " " + r[0].transcript; };
          this.sr.onerror = () => {};
          this.sr.start();
        } catch (e) { this.sr = null; }
      }
      return { recording: !!this.mr, sr: !!this.sr };
    },
    stop() {
      if (this.sr) { try { this.sr.stop(); } catch (e) {} this.sr = null; }
      if (this.mr && this.mr.state !== "inactive") { this.mr.stop(); }
      else this._finish();
    },
    _finish() {
      const dur = Math.max(1, Math.round((Date.now() - this.startTs) / 1000));
      let blob = null;
      if (this.chunks.length) blob = new Blob(this.chunks, { type: (this.mr && this.mr.mimeType) || "audio/webm" });
      if (this.stream) { this.stream.getTracks().forEach(t => t.stop()); this.stream = null; }
      this.mr = null; this.chunks = [];
      const cb = this.onDone; this.onDone = null;
      if (cb) cb({ blob: blob, dur: dur, transcript: this.transcript.trim() });
    }
  };

  /* IndexedDB 存录音（环境不支持时静默降级，不影响计时与自评） */
  function idbOpen() {
    if (!hasIDB) return Promise.reject(new Error("no indexeddb"));
    return new Promise((res, rej) => {
      const r = indexedDB.open("ielts-oral-buddy", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("recordings");
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  async function idbPut(id, blob) {
    const db = await idbOpen();
    return new Promise((res, rej) => {
      const tx = db.transaction("recordings", "readwrite");
      tx.objectStore("recordings").put(blob, id);
      tx.oncomplete = res; tx.onerror = () => rej(tx.error);
    });
  }
  async function idbGet(id) {
    const db = await idbOpen();
    return new Promise((res, rej) => {
      const rq = db.transaction("recordings").objectStore("recordings").get(id);
      rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error);
    });
  }
  /* 删除单段录音（按 id） */
  async function idbDel(id) {
    if (!hasIDB || !id) return;
    const db = await idbOpen();
    return new Promise((res, rej) => {
      const tx = db.transaction("recordings", "readwrite");
      tx.objectStore("recordings").delete(id);
      tx.oncomplete = res; tx.onerror = () => rej(tx.error);
    });
  }
  /* 录音占用统计：{ count, bytes }；环境不支持时返回 null */
  async function idbStats() {
    if (!hasIDB) return null;
    try {
      const db = await idbOpen();
      return await new Promise((res, rej) => {
        const rq = db.transaction("recordings").objectStore("recordings").getAll();
        rq.onsuccess = () => {
          const arr = rq.result || [];
          res({ count: arr.length, bytes: arr.reduce((s, b) => s + (b && b.size ? b.size : 0), 0) });
        };
        rq.onerror = () => rej(rq.error);
      });
    } catch (e) { return null; }
  }
  /* 清空全部录音，返回被删条数 */
  async function idbClearAll() {
    if (!hasIDB) return 0;
    try {
      const db = await idbOpen();
      const n = await new Promise(res => {
        const rq = db.transaction("recordings").objectStore("recordings").count();
        rq.onsuccess = () => res(rq.result || 0); rq.onerror = () => res(0);
      });
      await new Promise((res, rej) => {
        const tx = db.transaction("recordings", "readwrite");
        tx.objectStore("recordings").clear();
        tx.oncomplete = res; tx.onerror = () => rej(tx.error);
      });
      return n;
    } catch (e) { return 0; }
  }
  const fmtBytes = b => (b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(0) + " KB" : (b / 1048576).toFixed(1) + " MB");

  /* ======================= 抽题即计时 ======================= */
  let atInt = null, atLeft = 60, atDone = null;
  function startAutoTimer() {
    cancelAutoTimer();
    $("#autoTimerCard").classList.remove("hidden");
    $("#atStage").textContent = "准备时间 —— 倒计时结束自动开始陈述";
    atLeft = 60; $("#atTimer").textContent = "01:00"; $("#atTimer").classList.remove("warn");
    $("#atNotes").value = "";
    atInt = setInterval(() => {
      atLeft--; $("#atTimer").textContent = mmss(atLeft);
      $("#atTimer").classList.toggle("warn", atLeft <= 10);
      if (atLeft <= 0) { cancelAutoTimer(); autoStartTalk(); }
    }, 1000);
  }
  function cancelAutoTimer() { if (atInt) { clearInterval(atInt); atInt = null; } }
  function autoStartTalk() {
    $("#autoTimerCard").classList.add("hidden");
    $("#simWrap").classList.remove("hidden");
    if ($("#simResult")) $("#simResult").classList.add("hidden");
    startTalk();
    toast("计时结束，开始录音陈述（2 分钟）");
  }
  $("#btnAtSkip").addEventListener("click", () => { cancelAutoTimer(); autoStartTalk(); });
  $("#btnAtCancel").addEventListener("click", () => { cancelAutoTimer(); $("#autoTimerCard").classList.add("hidden"); toast("已取消自动计时，可用下方按钮手动开始模拟"); });

  /* ======================= Part 2 全真模拟 ======================= */
  let simStage = "idle", prepInt = null, talkInt = null, talkLeft = 120;
  let lastAudioId = null, lastAudioURL = null, lastSimMeta = null;

  function resetSim() {
    clearInterval(prepInt); clearInterval(talkInt);
    simStage = "idle";
    ["simStart", "simPrep", "simTalk", "simResult"].forEach(id => { const e = $("#" + id); if (e) e.classList.add("hidden"); });
    $("#simStart").classList.remove("hidden");
    $("#prepTimer").textContent = "01:00"; $("#talkTimer").textContent = "02:00";
    $("#talkTimer").classList.remove("warn");
    $("#simNotes").value = "";
    $("#fluGrid").innerHTML = ""; $("#fluTip").textContent = "";
    $("#assessSaved").textContent = "";
  }
  $("#btnSimStart").addEventListener("click", () => {
    simStage = "prep";
    $("#simStart").classList.add("hidden");
    $("#simPrep").classList.remove("hidden");
    let left = 60; $("#prepTimer").textContent = "01:00";
    prepInt = setInterval(() => {
      left--; $("#prepTimer").textContent = mmss(Math.max(0, left));
      if (left <= 0) startTalk();
    }, 1000);
  });
  $("#btnStartTalk").addEventListener("click", startTalk);

  async function startTalk() {
    if (simStage !== "prep" && simStage !== "idle") return;
    clearInterval(prepInt);
    simStage = "talk";
    $("#simStart").classList.add("hidden");
    $("#simPrep").classList.add("hidden");
    $("#simTalk").classList.remove("hidden");
    talkLeft = 120; updateTalkTimer();
    $("#talkHint").textContent = "正在录音，时间到自动结束。";
    const info = await Rec.start(rec => onSimRecordDone(rec));
    if (!info.recording) $("#talkHint").textContent = "未获得麦克风权限，本次无录音，仍可正常计时。";
    if (!info.sr) $("#talkHint").textContent = "语音识别不可用，流利度将缺少词数/语速。";
    talkInt = setInterval(() => {
      talkLeft--; updateTalkTimer();
      if (talkLeft <= 0) endTalk(true);
    }, 1000);
  }
  function updateTalkTimer() {
    const el = $("#talkTimer");
    el.textContent = mmss(Math.max(0, talkLeft));
    el.classList.toggle("warn", talkLeft < 30);
  }
  $("#btnStopTalk").addEventListener("click", () => endTalk(false));
  function endTalk(auto) {
    if (simStage !== "talk") return;
    clearInterval(talkInt); simStage = "result";
    $("#simTalk").classList.add("hidden");
    $("#talkHint").textContent = auto ? "时间到，已自动结束。" : "已手动结束。";
    Rec.stop();
  }
  function onSimRecordDone(rec) {
    $("#simResult").classList.remove("hidden");
    lastSimMeta = { durSec: rec.dur, topicId: curTopic ? curTopic.id : null, topic: curTopic ? titleOf(curTopic) : "" };
    if (rec.blob) {
      lastAudioId = (curTopic ? curTopic.id : "t") + "-" + Date.now();
      idbPut(lastAudioId, rec.blob).catch(() => { lastAudioId = null; });
      if (lastAudioURL) URL.revokeObjectURL(lastAudioURL);
      lastAudioURL = URL.createObjectURL(rec.blob);
      $("#simAudio").src = lastAudioURL;
    } else {
      $("#simAudio").removeAttribute("src");
      lastAudioId = null;
    }
    renderFluency("#fluGrid", "#fluTip", rec.dur, rec.transcript, !!rec.blob);
    renderTopicHistory();
    window.scrollTo({ top: $("#simResult").offsetTop - 80, behavior: "smooth" });
  }

  function renderFluency(gridSel, tipSel, durSec, transcript, hasAudio) {
    const E = window.IELTS_ENGINE;
    const words = transcript ? transcript.split(/\s+/).filter(w => /[a-zA-Z]/.test(w)) : [];
    const wpm = words.length ? Math.round(words.length / (durSec / 60)) : 0;
    const fill = E.countFillers(transcript);
    $(gridSel).innerHTML =
      '<div class="f"><div class="n">' + mmss(durSec) + '</div><div class="l">陈述时长</div></div>' +
      '<div class="f"><div class="n">' + (words.length || "—") + '</div><div class="l">识别词数</div></div>' +
      '<div class="f"><div class="n">' + (wpm || "—") + '</div><div class="l">语速（词/分）</div></div>' +
      '<div class="f"><div class="n">' + (words.length ? fill : "—") + '</div><div class="l">填充词次数</div></div>';

    const tips = [];
    if (durSec < 90) tips.push("Part 2 建议讲满 2 分钟，本次偏短——多准备 1–2 个细节点（举例 / 对比 / 个人感受）。");
    if (wpm && wpm < 70) tips.push("语速偏慢，可能有较多停顿；用 well / actually / to be honest 过渡会更自然。");
    if (wpm && wpm > 170) tips.push("语速偏快，考官可能跟不上，注意断句。");
    if (words.length && fill / words.length > 0.08) tips.push("填充词比例偏高（" + Math.round(fill / words.length * 100) + "%），把 um / like 换成 1 秒停顿。");
    if (!hasAudio) tips.push("本次没有录音：允许麦克风权限后可回放自听。");
    if (!words.length) tips.push("未捕获识别文本：如需流利度统计，请在 Chrome / Edge 中允许麦克风。");
    $(tipSel).innerHTML = tips.length ? IC('bulb', 'ic-info') + " " + esc(tips.join(" ")) : "各项数据良好，保持节奏！";
    return { words: words.length, wpm: wpm, fill: fill };
  }

  /* 四维自评（单题）滑条 */
  [["slFC", "vFC"], ["slLR", "vLR"], ["slGRA", "vGRA"], ["slPR", "vPR"]].forEach(p => {
    const el = $("#" + p[0]); if (el) el.addEventListener("input", () => { $("#" + p[1]).textContent = el.value; });
  });

  /* 把本轮问答落库（一次会话只落一条，避免重复） */
  function persistRound(scores) {
    if (!curTopic || CONV.saved) return null;
    if (!CONV.buf.length && !lastSimMeta) return null;
    const rec = {
      ts: nowISO(), date: fmtDate(Date.now()),
      mode: CONV.mode === "mock" ? "mock" : "single",
      topicId: curTopic.id, topic: titleOf(curTopic), part: curTopic.part,
      cat: curTopic.cat, scene: curTopic.scene, season: curTopic.season,
      qa: CONV.buf.slice(), scores: scores || null, audioId: lastAudioId || null
    };
    if (lastSimMeta) Object.assign(rec, lastSimMeta);
    pushLog(rec);
    CONV.saved = true;
    renderKpi(); renderReview(); renderTopicHistory();
    return rec;
  }
  /* 离开话题时静默落库，保证"抽过的题 / 自评 / 复练次数"一定有记录 */
  function flushOnLeave() {
    if (CONV.mode !== "single") return;
    if ($("#practiceDetail").classList.contains("hidden")) return;
    const rec = persistRound(null);
    if (rec) toast("已记录本轮练习");
  }

  $("#btnSaveAssess").addEventListener("click", () => {
    if (!curTopic) return;
    const scores = { FC: +$("#slFC").value, LR: +$("#slLR").value, GRA: +$("#slGRA").value, PR: +$("#slPR").value };
    const rec = persistRound(scores);
    if (!rec) { toast("本次练习已经保存过了"); return; }
    $("#assessSaved").textContent = "已保存（均分 " + ((scores.FC + scores.LR + scores.GRA + scores.PR) / 4).toFixed(1) + "）";
    $("#btnSaveAssess").disabled = true;
    toast("已写入练习历史");
  });

  /* 本轮小结（未做 Part 2 模拟时也能落库） */
  function endRound() {
    if (!curTopic) return;
    if (!CONV.buf.length && !lastSimMeta) { toast("先回答几个问题再结束吧", "warn"); return; }
    const flagged = CONV.buf.filter(x => x.flag === "short" || x.flag === "offtopic").length;
    const box = $("#chatBox");
    box.insertAdjacentHTML("beforeend",
      '<div class="msg sys">本轮结束 · 共回答 ' + CONV.buf.length + " 个问题" +
      (flagged ? "，其中 " + flagged + " 个被判定为过短或跑题" : "，没有明显跑题") +
      "。可用下方「生成三档升级」把刚才的回答升级一遍。</div>");
    box.scrollTop = box.scrollHeight;
    const rec = persistRound(null);
    if (rec) toast("本轮已写入练习历史");
  }

  /* ======================= 三档升级 ======================= */
  function lastUserAnswer() {
    for (let i = CONV.history.length - 1; i >= 0; i--) if (CONV.history[i].role === "user") return CONV.history[i].content;
    return "";
  }
  function renderTiers(res, engineLabel) {
    const E = window.IELTS_ENGINE;
    let html = '<p style="font-size:var(--fs-body);color:var(--muted);margin-bottom:var(--sp-3)">基底：' + esc(res.baseNote || "") +
      ' · 引擎：' + esc(engineLabel) + "</p>";
    html += '<div style="font-size:var(--fs-body);margin-bottom:var(--sp-3)"><b>你的原话：</b>' + esc(res.base) + "</div>";
    res.tiers.forEach(t => {
      html += '<div class="tier b' + t.band + '">' +
        '<div class="thead"><span class="tname">' + esc(t.name) + '</span><span class="badge ' +
        (t.band === 6 ? "gray" : t.band === 7 ? "" : "purple") + '">Band ' + t.band + "</span></div>" +
        '<div class="tdesc">' + esc(t.desc) + "</div>" +
        '<div class="ttext">' + E.diffHTML(res.base, t.text) + "</div>" +
        '<div class="row mt8"><button class="btn sm" data-speak-tier="' + t.band + '">' + IC("volume") + ' 朗读这一版</button></div>' +
        '<div class="hidden" data-tier-text="' + t.band + '">' + esc(t.text) + "</div>" +
        "</div>";
    });
    if (res.notes && res.notes.length) {
      html += '<h3 class="mt16">差异清单（换了哪个词 / 补了什么连接词）</h3>';
      html += res.notes.map(n =>
        '<div class="change-li"><span class="badge ' + (n.tier === 6 ? "gray" : n.tier === 7 ? "" : "purple") + '">Band ' +
        (n.tier || 7) + " · " + esc(n.kind) + "</span>" +
        (n.from && n.from.indexOf("（") < 0 ? '<span class="chg-from">' + esc(n.from) + "</span><span>→</span>" : "") +
        '<span class="chg-to">' + esc(n.to) + "</span>" +
        (n.note ? '<span style="color:var(--muted)">· ' + esc(n.note) + "</span>" : "") + "</div>").join("");
    }
    html += '<p style="font-size:var(--fs-note);color:var(--muted);margin-top:var(--sp-3)">' +
      '<ins class="df-add">绿色</ins> = 新增内容；<del class="df-del">红色删除线</del> = 被替换掉的原文。' +
      "对比三档差异，能直观看到「同样的意思，怎么说才更得分」。</p>";
    if (String(engineLabel).indexOf("本地") === 0) {
      html += '<p style="font-size:var(--fs-note);color:var(--amber);margin-top:var(--sp-2)">' +
        "" + IC('alert') + " 本地引擎只做<b>语法安全</b>的替换与结构增补（不会把动词搭配改坏），所以个别位置读起来仍偏生硬。" +
        "想要真正地道的整句改写，可在「首页 → AI 考官引擎」填入你自己的大模型 API Key。</p>";
    }
    $("#upgradeBody").innerHTML = html;

    $$("#upgradeBody [data-speak-tier]").forEach(b => b.addEventListener("click", () => {
      const band = b.dataset.speakTier;
      const t = $("#upgradeBody [data-tier-text='" + band + "']");
      if (t) speak(t.textContent, { rate: SET.rate });
    }));
  }
  $("#btnUpgradeClear").addEventListener("click", () => { $("#upgradeBody").innerHTML = ""; });
  $("#btnUpgrade").addEventListener("click", async () => {
    if (!curTopic) return;
    const btn = $("#btnUpgrade");
    let ans = lastUserAnswer();
    if (!ans && curTopic.exprs && curTopic.exprs.length) ans = "";
    btn.disabled = true;
    $("#upgradeBody").innerHTML = '<p class="loader">' + IC("loader") + '正在生成三档升级…</p>';

    let res = null, label = "本地升级引擎";
    if (window.IELTS_LLM.isReady()) {
      try {
        res = await window.IELTS_LLM.upgradeAnswer(curTopic, CONV.lastQ, ans);
        label = "大模型（" + window.IELTS_LLM.status() + "）";
      } catch (e) { $("#upgradeBody").innerHTML = ""; toast("大模型调用失败，改用本地引擎：" + e.message, "err"); }
    }
    if (!res) res = window.IELTS_ENGINE.upgrade(ans || (curTopic.exprs[0] ? curTopic.exprs[0][0] : ""), curTopic);
    renderTiers(res, label);
    btn.disabled = false;
  });

  /* 本话题历史 */
  function renderTopicHistory() {
    const el = $("#assessHist");
    if (!el) return;
    const list = loadLog().filter(r => r.topicId === (curTopic && curTopic.id)).slice(0, 5);
    if (!list.length) { el.innerHTML = '<p class="sim-stage">本话题还没有记录。完成一次模拟并保存，就会出现在这里。</p>'; return; }
    el.innerHTML = list.map(r => {
      const avg = r.scores ? ((r.scores.FC + r.scores.LR + r.scores.GRA + r.scores.PR) / 4).toFixed(1) : "—";
      return '<div class="hist-item"><span>' + esc(r.date) + '</span>' +
        '<span style="flex:1;color:var(--muted)">' + esc(r.mode === "mock" ? "套题模考" : "单题练习") + "</span>" +
        (r.wpm ? '<span style="color:var(--muted)">' + r.wpm + " 词/分</span>" : "") +
        '<span class="sc">均分 ' + avg + "</span>" +
        (r.audioId ? '<button class="btn sm" data-play="' + esc(r.audioId) + '">回放</button>' : "") + "</div>";
    }).join("");
    $$("#assessHist [data-play]").forEach(b => b.addEventListener("click", async () => {
      let blob = null;
      try { blob = await idbGet(b.dataset.play); } catch (e) { blob = null; }
      if (!blob) { toast("该录音已不存在（可能清理过浏览器数据）", "warn"); return; }
      if (lastAudioURL) URL.revokeObjectURL(lastAudioURL);
      lastAudioURL = URL.createObjectURL(blob);
      const a = $("#simAudio"); a.src = lastAudioURL; a.play();
    }));
  }

  /* 生词本 */
  function addWord(pair, topic) {
    if (!pair) return;
    const wb = loadWb();
    if (wb.some(x => x.en.toLowerCase() === pair[0].toLowerCase())) { toast("“" + pair[0] + "”已在生词本里", "warn"); return; }
    wb.unshift({ en: pair[0], zh: pair[1], topic: topic ? topic.zh : "", ts: nowISO() });
    saveWb(wb); renderReview();
    toast("已加入生词本：" + pair[0]);
  }

  /* ======================= 题库浏览 ======================= */
  $("#libSearch").addEventListener("input", renderLib);
  function renderLib() {
    const kw = ($("#libSearch").value || "").trim().toLowerCase();
    const hit = t => !kw || [t.zh, t.en, t.cue, (t.qs || []).join(" "), (t.bullets || []).join(" "), t.cat, t.level, t.scene, t.season]
      .filter(Boolean).join(" ").toLowerCase().indexOf(kw) >= 0;
    const list = ALL.filter(hit);
    $("#libStat").textContent = list.length + " / " + ALL.length + " 个话题";
    if (!list.length) { $("#topicList").innerHTML = '<p class="sim-stage">没有匹配的话题，换个关键词试试。</p>'; return; }
    let html = "", lastPart = null;
    list.forEach(t => {
      if (t.part !== lastPart) {
        html += '<div class="lib-group">Part ' + t.part + " · " + (t.part === 1 ? "日常问答（每题 2–3 句）" : "话题陈述（1 分钟准备 + 2 分钟陈述）") + "</div>";
        lastPart = t.part;
      }
      const meta = t.part === 1
        ? t.cat + " · " + t.scene + " · " + t.season + " · " + t.level + " · " + t.qs.length + " 问"
        : t.cat + " · " + t.scene + " · " + t.season + " · " + t.level + " · " + t.bullets.length + " 要点 · " + (t.part3 || []).length + " 道追问";
      html += '<div class="lib-item" data-id="' + esc(t.id) + '"><div><div class="t">' + esc(t.zh) +
        ' <span style="color:var(--muted);font-weight:400">' + esc(t.part === 1 ? t.en : (t.cue || "")) + "</span></div>" +
        '<div class="m">' + esc(meta) + "</div></div><span style='color:var(--teal);font-size:var(--fs-body)'>练习 →</span></div>";
    });
    $("#topicList").innerHTML = html;
    $$("#topicList .lib-item").forEach(el => el.addEventListener("click", () => {
      showPage("practice");
      openTopic(el.dataset.id, undefined, { auto: BY_ID[el.dataset.id].part === 2 && SET.autoTimer });
    }));
  }

  /* ======================= 复盘 ======================= */
  function renderReview() {
    renderHist(); renderWeak(); renderWordbook(); refreshStoreStat();
  }
  function renderHist() {
    const list = loadLog();
    $("#histCount").textContent = list.length + " 条";
    if (!list.length) { $("#histList").innerHTML = '<p class="sim-stage">还没有练习记录。</p>'; return; }
    $("#histList").innerHTML = list.slice(0, 60).map((r, i) => {
      const avg = r.scores ? ((r.scores.FC + r.scores.LR + r.scores.GRA + r.scores.PR) / 4).toFixed(1) : "—";
      const flagged = (r.qa || []).filter(x => x.flag === "short" || x.flag === "offtopic").length;
      return '<div class="hist-item">' +
        "<span>" + esc(r.date) + "</span>" +
        '<span class="badge ' + (r.mode === "mock" ? "purple" : "") + '">' + (r.mode === "mock" ? "套题" : "Part " + r.part) + "</span>" +
        '<span style="flex:1;color:var(--muted)">' + esc(r.topic) + "</span>" +
        (r.qa ? '<span style="color:var(--muted)">' + r.qa.length + " 问</span>" : "") +
        (r.wpm ? '<span style="color:var(--muted)">' + r.wpm + " 词/分</span>" : "") +
        (flagged ? '<span class="badge danger">' + flagged + " 处待改</span>" : "") +
        '<span class="sc">' + (r.scores ? "均分 " + avg : "未自评") + "</span>" +
        '<button class="btn sm danger" data-hist-del="' + i + '" title="删除这条记录' + (r.audioId ? "及其录音" : "") + '">删除</button>' +
        "</div>";
    }).join("");
    $$("#histList [data-hist-del]").forEach(b => b.addEventListener("click", async () => {
      const idx = +b.dataset.histDel;
      const l = loadLog();
      const r = l[idx];
      if (!r) return;
      if (!confirm("删除这条练习记录？" + (r.audioId ? "它附带的录音也会一并删除。" : "") + "此操作不可撤销。")) return;
      if (r.audioId) { try { await idbDel(r.audioId); } catch (e) { /* 录音可能已被清空 */ } }
      l.splice(idx, 1); saveLog(l);
      renderReview(); renderKpi(); toast("已删除该条记录");
    }));
  }

  function renderWeak() {
    const list = loadLog();
    if (!list.length) {
      $("#weakGap").innerHTML = '<p class="sim-stage">完成几次练习后，这里会自动指出你练得最少的话题类型。</p>';
      $("#weakList").innerHTML = ""; return;
    }
    /* 覆盖缺口：按类别统计 */
    const byCat = {};
    ALL.forEach(t => { byCat[t.cat] = byCat[t.cat] || { total: 0, done: 0 }; byCat[t.cat].total++; });
    list.forEach(r => {
      const t = BY_ID[r.topicId];
      if (t && byCat[t.cat]) byCat[t.cat].done++;
    });
    const rows = Object.keys(byCat).map(c => ({ c: c, total: byCat[c].total, done: byCat[c].done, pct: byCat[c].done / byCat[c].total }))
      .sort((a, b) => a.pct - b.pct);
    const weakest = rows.filter(r => r.pct === 0).slice(0, 3);
    let gap = '<h3>覆盖缺口 —— 练得最少的话题类型</h3><p style="font-size:var(--fs-body);color:var(--muted);margin-bottom:var(--sp-3)">按类别统计你实际练过的话题数。</p>';
    gap += rows.slice(0, 10).map(r =>
      '<div class="note-li"><span style="min-width:96px">' + esc(r.c) + "</span>" +
      '<div class="bar-wrap"><div class="bar" style="width:' + Math.round(r.pct * 100) + '%"></div></div>' +
      '<span style="color:var(--muted);min-width:80px;text-align:right">' + r.done + " / " + r.total + "</span></div>").join("");
    if (weakest.length) {
      gap += '<div class="notice warn mt16" style="margin-bottom:0">' + IC("alert") + ' 还没练过的类别：<b>' +
        weakest.map(w => esc(w.c) + "（" + w.total + " 个话题）").join("、") + "</b>。建议用抽题练习的场景 / 类别筛选专门补一补。</div>";
    }
    $("#weakGap").innerHTML = gap;

    /* 待攻克题目 */
    const todo = [];
    list.forEach(r => {
      (r.qa || []).forEach(x => {
        if (x.flag === "short" || x.flag === "offtopic") todo.push({ q: x.q, flag: x.flag, topic: r.topic, date: r.date });
      });
      if (r.scores) {
        const avg = (r.scores.FC + r.scores.LR + r.scores.GRA + r.scores.PR) / 4;
        if (avg < 6.5) todo.push({ q: "（整轮自评 " + avg.toFixed(1) + " 分）", flag: "low", topic: r.topic, date: r.date });
      }
    });
    /* 复练次数统计 */
    const counts = {};
    list.forEach(r => { counts[r.topicId] = (counts[r.topicId] || 0) + 1; });
    const never = ALL.filter(t => !counts[t.id]).length;

    let weak = '<h3>待攻克清单 <span class="badge gray">' + todo.length + " 条</span></h3>";
    weak += '<p style="font-size:var(--fs-body);color:var(--muted);margin:var(--sp-2) 0 var(--sp-3)">已被判定为「回答过短 / 偏离题目」或整轮自评低于 6.5 的题目，建议逐条重说一遍。</p>';
    weak += todo.length
      ? todo.slice(0, 20).map(x =>
        '<div class="note-li"><span class="badge ' + (x.flag === "offtopic" ? "danger" : x.flag === "short" ? "amber" : "gray") + '">' +
        (x.flag === "offtopic" ? "跑题" : x.flag === "short" ? "过短" : "低分") + "</span>" +
        '<span style="flex:1">' + esc(x.q) + '</span><span style="color:var(--muted)">' + esc(x.topic) + " · " + esc(x.date) + "</span></div>").join("")
      : '<p class="sim-stage">暂无待攻克题目。</p>';
    weak += '<p style="font-size:var(--fs-body);color:var(--muted);margin-top:var(--sp-3)">复练覆盖：已练 ' + (ALL.length - never) + " / " + ALL.length +
      " 个话题，还有 <b>" + never + "</b> 个话题一次都没抽到过。</p>";
    $("#weakList").innerHTML = weak;
  }

  function renderWordbook() {
    const wb = loadWb();
    $("#wbCount").textContent = wb.length + " 词";
    if (!wb.length) { $("#wordbookList").innerHTML = '<p class="sim-stage">生词本还是空的。在话题详情里点词汇前面的「+」就能加进来。</p>'; return; }
    $("#wordbookList").innerHTML = wb.map((w, i) =>
      '<div class="wb-item"><span class="w">' + esc(w.en) + '</span><span class="z">' + esc(w.zh) +
      (w.topic ? " · " + esc(w.topic) : "") + "</span>" +
      '<button class="btn sm" data-wb-speak="' + i + '">' + IC("volume") + '</button>' +
      '<button class="btn sm danger" data-wb-del="' + i + '">删除</button></div>').join("");
    $$("#wordbookList [data-wb-speak]").forEach(b => b.addEventListener("click", () => {
      const w = loadWb()[+b.dataset.wbSpeak]; if (w) speak(w.en, { rate: 0.85 });
    }));
    $$("#wordbookList [data-wb-del]").forEach(b => b.addEventListener("click", () => {
      const wb2 = loadWb(); wb2.splice(+b.dataset.wbDel, 1); saveWb(wb2); renderWordbook();
    }));
  }

  /* 整本朗读 */
  let wbSpeaking = false;
  $("#btnWbSpeak").addEventListener("click", () => {
    const wb = loadWb();
    if (!wb.length) { toast("生词本还是空的", "warn"); return; }
    wbSpeaking = true;
    let i = 0;
    const step = () => {
      if (!wbSpeaking || i >= wb.length) { wbSpeaking = false; return; }
      const w = wb[i++];
      speak(w.en, { rate: 0.82, onend: () => setTimeout(step, 420) });
    };
    step();
    toast("开始整本朗读（共 " + wb.length + " 词）");
  });
  $("#btnWbStop").addEventListener("click", () => { wbSpeaking = false; stopSpeak(); });
  $("#btnWbClear").addEventListener("click", () => {
    if (!loadWb().length) return;
    if (!confirm("确定清空生词本？此操作不可撤销。")) return;
    saveWb([]); renderWordbook(); toast("已清空生词本");
  });
  $("#btnClearHist").addEventListener("click", () => {
    if (!loadLog().length) return;
    if (!confirm("确定清空全部练习历史？此操作不可撤销。\n注意：Part 2 录音不会被一起清空，如需一并删除请用下方「删除全部录音」。")) return;
    saveLog([]); renderReview(); renderKpi(); toast("已清空练习历史");
  });

  /* ======================= 数据与隐私 ======================= */
  async function refreshStoreStat() {
    const el = $("#storeStat");
    if (!el) return;
    const st = await idbStats();
    const lb = loadLog().length, wb = loadWb().length;
    const audio = st ? st.count + " 段录音（" + fmtBytes(st.bytes) + "）" : "录音存储不可用";
    el.textContent = lb + " 条记录 · " + wb + " 词 · " + audio;
  }
  $("#btnClearAudio").addEventListener("click", async () => {
    const st = await idbStats();
    if (!st || !st.count) { toast("没有可删除的录音", "warn"); return; }
    if (!confirm("删除全部 " + st.count + " 段录音（约 " + fmtBytes(st.bytes) + "）？此操作不可撤销。\n练习记录与自评会保留。")) return;
    const n = await idbClearAll();
    toast("已删除 " + n + " 段录音");
    refreshStoreStat();
  });
  $("#btnClearAll").addEventListener("click", async () => {
    if (!confirm("清除全部本机数据（练习记录、自评、生词本、偏好设置、API Key、全部录音）？\n此操作不可撤销，且会清除后无法找回。")) return;
    if (!confirm("再次确认：真的要清除全部数据吗？")) return;
    await idbClearAll();
    [LKEY, WKEY, SKEY, "im_llm", "im_sessions"].forEach(k => { try { LS.removeItem(k); } catch (e) {} });
    SET = Object.assign({}, DEF_SET);          /* 重置内存中的设置 */
    sessions = 0;                              /* 重置累计计数 */
    window.IELTS_LLM.save({ provider: "local", baseUrl: "", apiKey: "", model: "" });  /* 重置内存中的 Key 缓存 */
    /* 让练习面板回到干净状态，避免残留一个已清空数据的话题 */
    if ($("#practiceDetail")) $("#practiceDetail").classList.add("hidden");
    if ($("#drawResult")) $("#drawResult").style.display = "none";
    if ($("#btnDrawAgain")) $("#btnDrawAgain").style.display = "none";
    drawn = null; CONV.topic = null; CONV.saved = false;
    renderEngineSettings(); renderVoiceSettings();
    $("#optMockRecord").checked = !!SET.mockRecord;
    renderReview(); renderKpi(); renderPill();
    toast("已清除全部本机数据");
  });

  /* CSV 导出 */
  function csvCell(v) { const s = String(v == null ? "" : v); return '"' + s.replace(/"/g, '""') + '"'; }
  function download(name, text) {
    const blob = new Blob(["\ufeff" + text], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  $("#btnExportCsv").addEventListener("click", () => {
    const list = loadLog();
    if (!list.length) { toast("还没有练习记录", "warn"); return; }
    const head = ["时间", "模式", "题型", "话题", "类别", "场景", "季节", "题数", "回答总词数", "陈述时长(秒)", "语速(词/分)", "填充词", "FC", "LR", "GRA", "PR", "均分", "待改题数"];
    const rows = list.map(r => {
      const words = (r.qa || []).reduce((s, x) => s + (x.words || 0), 0);
      const flagged = (r.qa || []).filter(x => x.flag === "short" || x.flag === "offtopic").length;
      const avg = r.scores ? ((r.scores.FC + r.scores.LR + r.scores.GRA + r.scores.PR) / 4).toFixed(1) : "";
      return [r.date, r.mode === "mock" ? "套题模考" : "单题练习", "Part " + r.part, r.topic, r.cat, r.scene, r.season,
        (r.qa || []).length, words, r.durSec || "", r.wpm || "", r.fill != null ? r.fill : "",
        r.scores ? r.scores.FC : "", r.scores ? r.scores.LR : "", r.scores ? r.scores.GRA : "", r.scores ? r.scores.PR : "",
        avg, flagged];
    });
    download("ielts-oral-log-" + new Date().toISOString().slice(0, 10) + ".csv",
      [head].concat(rows).map(r => r.map(csvCell).join(",")).join("\r\n"));
    toast("已导出 " + rows.length + " 条记录");
  });
  $("#btnWbExport").addEventListener("click", () => {
    const wb = loadWb();
    if (!wb.length) { toast("生词本还是空的", "warn"); return; }
    download("ielts-oral-wordbook-" + new Date().toISOString().slice(0, 10) + ".csv",
      [["单词", "释义", "来源话题", "加入时间"]].concat(wb.map(w => [w.en, w.zh, w.topic, (w.ts || "").slice(0, 10)]))
        .map(r => r.map(csvCell).join(",")).join("\r\n"));
    toast("已导出生词本");
  });

  /* ======================= 初始化 ======================= */
  function init() {
    initCollapses();
    renderSeasonBanner();
    renderKpi();
    renderEngineSettings();
    renderVoiceSettings();
    renderAll();
    renderLib();
    renderReview();
    renderPill();
    $("#optMockRecord").checked = !!SET.mockRecord;
    if (!window.IELTS_LLM.isReady()) $("#examinerHint").textContent = "本地智能考官：会根据你的回答动态追问；回答太短会要求展开，跑题会被拉回，Part 3 自动升维。";
    else $("#examinerHint").textContent = "已接入大模型，考官将基于你的原话即兴追问。";
  }
  document.addEventListener("DOMContentLoaded", init);
  if (document.readyState !== "loading") init();

  /* ======================= 套题模考 ======================= */
  const STAGES = [
    { key: "p1",     name: "Part 1 · 日常问答",        short: "Part 1", sec: 240 },
    { key: "p2prep", name: "Part 2 · 准备（1 分钟）",   short: "P2 准备", sec: 60 },
    { key: "p2talk", name: "Part 2 · 陈述（2 分钟）",   short: "P2 陈述", sec: 120 },
    { key: "p3",     name: "Part 3 · 深入讨论",        short: "Part 3", sec: 240 }
  ];
  const mock = { set: null, idx: 0, left: 0, int: null, p2res: null, p2promise: null, p2resolve: null, recOn2: false, report: null };

  function stopMockTimers() {
    if (mock.int) { clearInterval(mock.int); mock.int = null; }
    if (mock.recOn2) { mock.recOn2 = false; try { Rec.stop(); } catch (e) {} }
  }

  function newMockSet() {
    const p1 = rand(P1);
    const p2 = rand(P2);
    return { p1: p1, p2: p2 };
  }

  function renderMockPreview() {
    const s = mock.set;
    if (!s) { $("#mockPreview").style.display = "none"; return; }
    $("#mockPreview").style.display = "block";
    $("#mockPreview").innerHTML =
      '<div class="drawn-card">' +
      "<div>" + tagHead(1, [s.p1.cat, s.p1.scene, s.p1.season]) + "</div>" +
      '<div class="drawn-q">' + esc(s.p1.zh) + " / " + esc(s.p1.en) + "（" + s.p1.qs.length + " 问）</div>" +
      '<hr class="sep">' +
      "<div>" + tagHead(2, [s.p2.cat, s.p2.scene]) + "</div>" +
      '<div class="drawn-q">' + esc(s.p2.cue) + "</div>" +
      '<ul style="margin:var(--sp-2) 0 0 var(--sp-4);font-size:var(--fs-body)">' + s.p2.bullets.map(b => "<li>" + esc(b) + "</li>").join("") + "</ul>" +
      '<hr class="sep">' +
      "<div>" + tagHead(3, [(s.p2.part3 || []).length + " 道追问"]) + "</div>" +
      '<div class="drawn-q" style="font-size:var(--fs-body)">' + esc((s.p2.part3 || []).map(p => p[0])[0] || "") + " …</div>" +
      '<div class="row mt16"><button class="btn primary big" id="btnMockStart">' + IC("play") + ' 开始模考</button></div>' +
      "</div>";
    $("#btnMockStart").addEventListener("click", startMock);
  }

  $("#btnMockNew").addEventListener("click", () => { mock.set = newMockSet(); renderMockPreview(); });
  $("#btnMockAgain").addEventListener("click", () => {
    mock.set = newMockSet(); renderMockPreview();
    $("#mockResult").classList.add("hidden");
    $("#mockHome").classList.remove("hidden");
    window.scrollTo(0, 0);
  });
  $("#btnMockQuit").addEventListener("click", () => {
    if (!confirm("放弃本次模考？已进行的内容不会保存。")) return;
    stopMockTimers();
    $("#mockRun").classList.add("hidden");
    $("#mockHome").classList.remove("hidden");
  });

  function startMock() {
    if (!mock.set) return;
    mock.report = null; mock.p2res = null;
    $("#mockHome").classList.add("hidden");
    $("#mockResult").classList.add("hidden");
    $("#mockRun").classList.remove("hidden");
    $("#mockChat").innerHTML = "";
    $("#mockSaved").textContent = "";
    $("#btnMockSave").disabled = false;
    goStage(0);
    window.scrollTo(0, 0);
  }

  function renderStageBar() {
    $("#mockStageBar").innerHTML = STAGES.map((s, i) =>
      '<div class="stage-pill ' + (i < mock.idx ? "done" : i === mock.idx ? "on" : "") + '">' +
      esc(s.short) + '<span class="k">' + mmss(s.sec) + "</span></div>").join("");
  }

  function goStage(i) {
    stopMockTimers();
    mock.idx = i;
    renderStageBar();
    const st = STAGES[i];
    $("#mockStageName").textContent = st.name;
    mock.left = st.sec;
    $("#mockTimer").textContent = mmss(mock.left);
    $("#mockTimer").classList.remove("warn");
    $("#mockActRow").innerHTML = "";
    $("#mockNotesCard").classList.add("hidden");
    $("#mockInput").disabled = false; $("#mockSend").disabled = false; $("#mockMic").disabled = false;

    const s = mock.set;
    const isLast = i === STAGES.length - 1;
    $("#btnMockNext").textContent = isLast ? "结束模考并出报告 →" : "下一阶段 →";

    if (st.key === "p1") {
      $("#mockCue").innerHTML = "<p style='font-weight:600'>" + esc(s.p1.en) + "</p><p style='font-size:var(--fs-body);color:var(--muted)'>" +
        esc(s.p1.zh) + " · 考官会从这里开始提问并追问</p>" +
        s.p1.qs.map((q, k) => '<div class="qlist-item">' + (k + 1) + ". " + esc(q) + "</div>").join("");
      convReset(s.p1, 1, "mock");
      examinerOpen(s.p1, 1, null, "#mockChat");
    } else if (st.key === "p2prep") {
      $("#mockNotesCard").classList.remove("hidden");
      $("#mockNotes").value = "";
      $("#mockCue").innerHTML = '<p style="font-weight:600">' + esc(s.p2.cue) + "</p><ul style='margin:var(--sp-2) 0 0 var(--sp-4);font-size:var(--fs-lead)'>" +
        s.p2.bullets.map(b => "<li>" + esc(b) + "</li>").join("") + "</ul>";
      $("#mockInput").disabled = true; $("#mockSend").disabled = true; $("#mockMic").disabled = true;
      addSys("#mockChat", "考官把题卡递给你：1 分钟准备，可在左侧记关键词，时间到自动进入陈述。");
    } else if (st.key === "p2talk") {
      $("#mockCue").innerHTML = '<p style="font-weight:600">' + esc(s.p2.cue) + "</p><p style='font-size:var(--fs-body);color:var(--muted)'>现在开口讲满 2 分钟</p>";
      $("#mockInput").disabled = true; $("#mockSend").disabled = true; $("#mockMic").disabled = true;
      $("#mockRecDot").classList.remove("hidden");
      $("#mockActRow").innerHTML = '<button class="btn sm" id="btnMockStopTalk">提前结束陈述</button>';
      $("#btnMockStopTalk").addEventListener("click", () => { goStage(mock.idx + 1); });
      addSys("#mockChat", "Part 2 陈述开始，正在录音……");
      mock.recOn2 = true;
      mock.p2promise = new Promise(res => { mock.p2resolve = res; });
      Rec.start(rec => {
        mock.p2res = rec; mock.recOn2 = false;
        if (mock.p2resolve) { mock.p2resolve(rec); mock.p2resolve = null; }
      }).then(info => {
        if (info && !info.recording) addSys("#mockChat", "未能录音（未授权麦克风），时长与节奏仍会统计。");
      });
    } else if (st.key === "p3") {
      $("#mockRecDot").classList.add("hidden");
      const p3 = (s.p2.part3 || []).map(p => p[0]);
      $("#mockCue").innerHTML = "<p style='font-weight:600'>Part 3 · 深入讨论</p><p style='font-size:var(--fs-body);color:var(--muted)'>考官会把这些追问推向抽象层面，尽量展开论述。</p>" +
        p3.map((q, k) => '<div class="qlist-item">' + (k + 1) + ". " + esc(q) + "</div>").join("");
      convReset(s.p2, 3, "mock");
      examinerOpen(s.p2, 3, null, "#mockChat");
    }

    if (st.key !== "p2talk") $("#mockRecDot").classList.add("hidden");

    mock.int = setInterval(() => {
      mock.left--;
      $("#mockTimer").textContent = mmss(Math.max(0, mock.left));
      $("#mockTimer").classList.toggle("warn", mock.left <= 30);
      if (mock.left <= 0) goStage(mock.idx + 1);
    }, 1000);
  }

  $("#btnMockNext").addEventListener("click", () => goStage(mock.idx + 1));

  async function finishMock() {
    stopMockTimers();
    $("#mockRun").classList.add("hidden");
    $("#mockResult").classList.remove("hidden");

    let rec = mock.p2res;
    if (!rec && mock.p2promise) { try { rec = await mock.p2promise; } catch (e) { rec = null; } }
    const durSec = rec ? rec.dur : 0;
    const transcript = rec ? rec.transcript : "";
    let flu = { words: 0, wpm: 0, fill: 0 };
    if (rec) flu = renderFluency("#mockFluGrid", "#mockFluTip", durSec, transcript, !!rec.blob);
    else { $("#mockFluGrid").innerHTML = ""; $("#mockFluTip").textContent = "本次 Part 2 没有录音数据。"; }

    if (rec && rec.blob) {
      const id = "mock-" + Date.now();
      idbPut(id, rec.blob).catch(() => {});
      mock.audioId = id;
      if (lastAudioURL) URL.revokeObjectURL(lastAudioURL);
      lastAudioURL = URL.createObjectURL(rec.blob);
      $("#mockAudio").src = lastAudioURL;
    } else { $("#mockAudio").removeAttribute("src"); mock.audioId = null; }

    const s = mock.set;
    $("#mockReportBody").innerHTML = '<p class="loader">' + IC("loader") + '正在生成练习报告…</p>';
    const payload = {
      part1Topic: s.p1.zh + " / " + s.p1.en,
      part2Card: s.p2.cue,
      part3Questions: (s.p2.part3 || []).map(p => p[0]),
      answers: CONV.buf,
      part2: { durSec: durSec, words: flu.words, wpm: flu.wpm, fillers: flu.fill }
    };
    let rep = null, label = "本地报告引擎";
    if (window.IELTS_LLM.isReady()) {
      try { rep = await window.IELTS_LLM.sessionReport(payload); if (rep) label = "大模型（" + window.IELTS_LLM.status() + "）"; }
      catch (e) { /* 回退 */ }
    }
    if (!rep) {
      const local = window.IELTS_ENGINE.buildReport(CONV.buf.map(x => ({
        words: x.words, fill: x.fillers, flag: x.flag, wpm: flu.wpm, durSec: durSec
      })));
      rep = {
        overall: "本套题共回答 " + CONV.buf.length + " 个问题，Part 2 陈述 " + mmss(durSec) +
          (flu.wpm ? "（" + flu.wpm + " 词/分）" : "") + "。下面按数据给出诊断。",
        strengths: local.strengths, weaknesses: local.weaknesses, advice: local.advice
      };
    }
    mock.report = rep;
    const li = (arr, cls) => (arr || []).length ? "<ul style='margin:var(--sp-2) 0 0 var(--sp-4);font-size:var(--fs-lead)'>" + arr.map(x => '<li class="' + cls + '">' + esc(x) + "</li>").join("") + "</ul>" : "<p class='sim-stage'>—</p>";
    $("#mockReportBody").innerHTML =
      '<p style="font-size:var(--fs-lead);margin-bottom:var(--sp-3)">' + esc(rep.overall || "") + "</p>" +
      '<div class="grid grid-3">' +
      "<div><h3>" + IC('check', 'ic-ok') + " 优势</h3>" + li(rep.strengths) + "</div>" +
      "<div><h3>" + IC('alert', 'ic-warn') + " 短板</h3>" + li(rep.weaknesses) + "</div>" +
      "<div><h3>" + IC('bulb', 'ic-info') + " 建议</h3>" + li(rep.advice) + "</div>" +
      "</div>" +
      '<p style="font-size:var(--fs-note);color:var(--muted);margin-top:var(--sp-3)">报告来源：' + esc(label) + "</p>";
    window.scrollTo(0, 0);
  }

  /* 覆盖：最后一阶段结束后进入报告 */
  const _goStage = goStage;
  goStage = function (i) {
    if (i >= STAGES.length) { finishMock(); return; }
    _goStage(i);
  };

  /* 四维自评（模考） */
  [["mkFC", "mkvFC"], ["mkLR", "mkvLR"], ["mkGRA", "mkvGRA"], ["mkPR", "mkvPR"]].forEach(p => {
    const el = $("#" + p[0]); if (el) el.addEventListener("input", () => { $("#" + p[1]).textContent = el.value; });
  });
  $("#btnMockSave").addEventListener("click", () => {
    const scores = { FC: +$("#mkFC").value, LR: +$("#mkLR").value, GRA: +$("#mkGRA").value, PR: +$("#mkPR").value };
    const s = mock.set;
    const rec = {
      ts: nowISO(), date: fmtDate(Date.now()), mode: "mock",
      topicId: s.p2.id, topic: "套题：" + s.p1.zh + " + " + s.p2.zh,
      part: 2, cat: s.p2.cat, scene: s.p2.scene, season: s.p2.season,
      qa: CONV.buf.slice(), scores: scores, audioId: mock.audioId || null,
      durSec: mock.p2res ? mock.p2res.dur : 0,
      words: mock.p2res ? mock.p2res.transcript.split(/\s+/).filter(w => /[a-zA-Z]/.test(w)).length : 0,
      wpm: (function () {
        if (!mock.p2res) return 0;
        const w = mock.p2res.transcript.split(/\s+/).filter(x => /[a-zA-Z]/.test(x)).length;
        return w ? Math.round(w / (mock.p2res.dur / 60)) : 0;
      })(),
      report: mock.report || null
    };
    /* 模考也记入 Part 1 话题的复练覆盖 */
    pushLog(rec);
    pushLog(Object.assign({}, rec, { ts: nowISO(), date: fmtDate(Date.now()), topicId: s.p1.id, topic: "套题(P1)：" + s.p1.zh, part: 1, qa: [] }));
    $("#mockSaved").textContent = "已保存（均分 " + ((scores.FC + scores.LR + scores.GRA + scores.PR) / 4).toFixed(1) + "），可到「复盘」查看";
    $("#btnMockSave").disabled = true;
    renderKpi(); renderReview();
    toast("模考记录已保存");
  });

  $("#mockSend").addEventListener("click", mockSubmit);
  $("#mockInput").addEventListener("keydown", e => { if (e.key === "Enter") mockSubmit(); });
  function mockSubmit() {
    const el = $("#mockInput");
    const v = el.value; el.value = "";
    submitAnswer(v, "#mockChat");
  }

  /* ======================= 覆盖 init 以补模考初始化 ======================= */
  const _renderEngineSettings = renderEngineSettings;
  window.addEventListener("load", () => { syncEngineUI(); renderVoiceSettings(); });
})();
