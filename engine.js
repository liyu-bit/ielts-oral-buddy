/* IELTS Oral Buddy · 本地智能引擎（离线，无需联网）
   ------------------------------------------------------------------
   1) 考官引擎  —— 根据你的实际回答动态追问、判断是否跑题、
                    Part 3 自动升维到抽象层面
   2) 升级引擎  —— 把你的回答改写成 6 / 7 / 8 分三档，并报告
                    换了哪个词、补了什么连接词、加了什么结构
   3) 报告引擎  —— 一次练习结束后生成优势 / 短板 / 改进建议

   设计原则：本地版只做"语法安全"的替换与结构增补，
   不做多词动词短语改写（那会破坏英语的补语搭配）。
   要做真正地道的改写，请在首页接入大模型。
   ------------------------------------------------------------------ */

window.IELTS_ENGINE = (function () {

  /* =========================== 通用工具 =========================== */
  const STOP = new Set(("a an the i me my we our you your he she it they them this that these those is am are was were be been being do does did doing have has had having will would shall should can could may might must of in on at to for with from by about into over after before between during without and or but so because if while as than then also very really quite just too much many more most some any no not only own same such here there when where why how what which who whom whose".split(" ")));

  const tokenize = s => (s || "").toLowerCase().replace(/[^a-z0-9'\s-]/g, " ").split(/\s+/).filter(Boolean);
  const contentWords = s => tokenize(s).filter(w => !STOP.has(w) && w.length > 2);

  const FILLERS = ["um", "uh", "erm", "hmm", "er", "ah", "eh"];
  const FILLER_PHRASES = ["you know", "i mean", "sort of", "kind of", "like i said"];

  function countFillers(text) {
    const low = " " + (text || "").toLowerCase() + " ";
    let n = 0;
    FILLER_PHRASES.forEach(p => { n += (low.match(new RegExp("\\b" + p.replace(/ /g, "\\s+") + "\\b", "g")) || []).length; });
    const toks = tokenize(text);
    FILLERS.forEach(f => { n += toks.filter(t => t === f).length; });
    return n;
  }

  /* 轻量词干化：让 work / worked / working / works 归为同一族 */
  function stem(w) {
    return w.replace(/(ations|ation|ings|ing|ies|ied|ers|er|ed|es|s|ly)$/, "") || w;
  }

  /* 话题相关词（用于"你回答里哪些词是话题词"） */
  function topicTerms(topic) {
    if (!topic) return [];
    if (topic.__terms) return topic.__terms;
    const bag = [
      topic.en || "", topic.cue || "", topic.cat || "",
      (topic.qs || []).join(" "), (topic.bullets || []).join(" "),
      (topic.vocab || []).map(v => v[0]).join(" "),
      (topic.exprs || []).map(e => e[0]).join(" ")
    ].join(" ");
    const set = [...new Set(contentWords(bag))];
    Object.defineProperty(topic, "__terms", { value: set, enumerable: false });
    return set;
  }

  function refTextFor(topic, question) {
    if (!topic) return String(question || "");
    return [
      topic.en || "", topic.cue || "", topic.cat || "", topic.zh || "",
      (topic.qs || []).join(" "), (topic.bullets || []).join(" "),
      (topic.vocab || []).map(v => v[0]).join(" "),
      (topic.exprs || []).map(e => e[0]).join(" "),
      question || ""
    ].join(" ");
  }

  /* 与"话题 + 当前问题"的语义重合度（0~1），含词干与词根前缀匹配 */
  function overlapScore(answer, topic, question) {
    const ref = new Set(contentWords(refTextFor(topic, question)).map(stem));
    const aw = [...new Set(contentWords(answer))];
    if (!aw.length || !ref.size) return 0;
    let hit = 0;
    aw.forEach(w => {
      const n = stem(w);
      if (ref.has(n)) { hit++; return; }
      for (const r of ref) {
        if (r.length >= 4 && n.length >= 4 && (r.indexOf(n) === 0 || n.indexOf(r) === 0)) { hit++; return; }
      }
    });
    return hit / Math.min(aw.length, 15);
  }

  /* =========================== 回答诊断 =========================== */
  /* 阈值偏保守：宁可漏判跑题，也不要冤枉一个正常回答 */
  function diagnose(answer, topic, question) {
    const toks = tokenize(answer);
    const n = toks.length;
    const fill = countFillers(answer);
    const ov = overlapScore(answer, topic, question);
    const hasReason = /\b(because|since|as|due to|that's why|which is why|so that)\b/i.test(answer || "");
    const hasExample = /\b(for example|for instance|such as|like when|once i|one time)\b/i.test(answer || "");
    return {
      words: n,
      fillers: fill,
      fillerRatio: n ? fill / n : 0,
      overlap: ov,
      hasReason: hasReason,
      hasExample: hasExample,
      tooShort: n > 0 && n < 12,
      offTopic: n >= 15 && ov < 0.05
    };
  }

  /* =========================== Part 3 抽象名词 =========================== */
  const P3_NOUN = {
    "p1-01": "singing and music in everyday life", "p1-02": "how tidy people are",
    "p1-03": "science and scientific research", "p1-04": "wearing watches",
    "p1-05": "parks and public green space", "p1-06": "the websites and apps people use",
    "p1-07": "space exploration", "p1-08": "music",
    "p1-09": "teachers and teaching", "p1-10": "social media",
    "p1-11": "headphones and personal audio", "p1-12": "humour and joking",
    "p1-13": "cars and private transport", "p1-14": "clothing and fashion",
    "p1-15": "shopping habits", "p1-16": "work and careers",
    "p1-17": "teamwork", "p1-18": "commuting",
    "p1-19": "time management", "p1-20": "protecting the environment",
    "p1-21": "public holidays", "p1-22": "museums and cultural institutions",
    "p1-23": "online learning",
    "p2-01": "boredom in modern life", "p2-02": "tall buildings and city design",
    "p2-03": "local news and the media", "p2-04": "medical careers and healthcare",
    "p2-05": "business and entrepreneurship", "p2-06": "food and celebrations",
    "p2-07": "watching sport", "p2-08": "how people make decisions",
    "p2-09": "long-term ambitions", "p2-10": "our dependence on technology",
    "p2-11": "sleep and daily routines", "p2-12": "housing and where people live",
    "p2-13": "advertising and celebrity culture", "p2-14": "language learning",
    "p2-15": "teamwork in the workplace", "p2-16": "relationships with colleagues",
    "p2-17": "public speaking", "p2-18": "environmental responsibility",
    "p2-19": "crowded public spaces", "p2-20": "learning new skills"
  };
  const nounOf = topic => P3_NOUN[topic && topic.id] || (topic && topic.en ? topic.en.toLowerCase() : "this topic");

  /* =========================== 追问策略 =========================== */
  const FOLLOWUP = {
    yesno: ["Why do you think that is?", "Has that always been the case, or has it changed?",
            "How does that compare with the people around you?"],
    what:  ["What is it about it that appeals to you?", "Why does that matter to you?",
            "Can you give me a specific example?"],
    how:   ["What makes you say that?", "Is that something you would change if you could?",
            "How did you first get into it?"],
    who:   ["What is it about them that stands out most?", "How has that person influenced you?"],
    when:  ["How has that changed since then?", "What do you remember most clearly about it?"],
    where: ["What do you like or dislike about that place?", "Would you go there again? Why?"],
    should:["Why do you think some people would disagree?", "What would the consequences be?"],
    generic:["Could you give me a specific example?", "Why do you think that is?",
             "How has that changed in recent years?", "What do other people you know think about it?"]
  };

  function qType(q) {
    const s = (q || "").trim().toLowerCase();
    if (/^(do|did|does|are|is|was|were|have|has|had|can|could|will|would)\b/.test(s)) return "yesno";
    if (/^should\b/.test(s)) return "should";
    if (/^what\b/.test(s)) return "what";
    if (/^how\b/.test(s)) return "how";
    if (/^who\b/.test(s)) return "who";
    if (/^when\b/.test(s)) return "when";
    if (/^where\b/.test(s)) return "where";
    return "generic";
  }

  const SHORT_LEAD = ["Could you expand on that a little?", "Could you say a bit more about that?",
                      "Can you tell me more about that?"];
  const OFFTOPIC_LEAD = ["That's a slightly different angle, so let me steer you back.",
                         "Interesting, though that drifts away from what I asked.",
                         "I see — but let's stay with the question."];

  const P3_TEMPLATES = [
    t => "Why do people feel so differently about " + t + "?",
    t => "How has " + t + " changed over the past few decades?",
    t => "How important is " + t + " in modern society?",
    t => "What role should governments play when it comes to " + t + "?",
    t => "Do you think attitudes towards " + t + " will change in the future?",
    t => "What are the advantages and disadvantages of " + t + " for society as a whole?",
    t => "Some people say " + t + " matters less than it used to. Do you agree?",
    t => "How does " + t + " affect different generations differently?"
  ];

  function trimTo(s, n) {
    const w = (s || "").trim().split(/\s+/);
    return w.slice(0, n).join(" ");
  }

  /* =========================== 考官引擎 =========================== */
  /**
   * 生成本轮的考官回应。
   * ctx = { topic, part, asked:[已问过的问题], lastQ, answer, reaskDone }
   * 返回 { question, feedback, flag }
   */
  function react(ctx) {
    const { topic, part, asked = [], lastQ = "", answer = "", reaskDone = false } = ctx;
    /* anchorQ = 最近一个"内容型"问题（不含"How could you expand…"这类元追问），
       用它决定追问类型，避免追问跟着元追问跑偏 */
    const anchor = ctx.anchorQ || lastQ;
    const d = diagnose(answer, topic, lastQ);
    let feedback = "", flag = "ok", question = "";

    /* --- 1. 先给一句自然反馈 --- */
    if (d.words === 0) {
      feedback = "";
    } else if (d.fillerRatio > 0.12) {
      feedback = "Keep going — try replacing the um's and you-know's with a short pause.";
      flag = "fillers";
    } else if (d.hasReason && d.hasExample) {
      feedback = "That's a well-developed answer — you gave both a reason and an example.";
    } else if (d.hasReason) {
      feedback = "Good — you explained why. A concrete example would make it even stronger.";
    } else if (d.words >= 12) {
      feedback = "Nice. Let me push you a little further.";
    }

    /* --- 2. 决定下一个问题 --- */
    if (d.offTopic) {
      flag = "offtopic";
      if (!reaskDone && lastQ) {
        /* 第一次跑题：明确指出并把原问题再问一次 */
        feedback = (feedback ? feedback + " " : "") + OFFTOPIC_LEAD[Math.floor(Math.random() * OFFTOPIC_LEAD.length)];
        question = "Let me ask that again — " + lastQ;
      } else {
        /* 已经提醒过：不再纠缠，换一道新题 */
        feedback = (feedback ? feedback + " " : "") + "Let's move on to something else.";
        question = freshQuestion(topic, part, asked, lastQ);
      }
    } else if (d.tooShort && part !== 2) {
      flag = "short";
      const lead = SHORT_LEAD[Math.floor(Math.random() * SHORT_LEAD.length)];
      const quoted = answer ? ' You said "' + trimTo(answer, 8) + '…" —' : "";
      question = lead + quoted + " what else can you tell me about " + nounOf(topic) + "?";
    } else if (part === 3) {
      const bank = (topic.part3 || []).map(p => p[0]);
      const left = bank.filter(q => asked.indexOf(q) < 0 && q !== lastQ);
      if (left.length) question = left[Math.floor(Math.random() * left.length)];
      else { question = abstractQuestion(topic, asked); flag = "escalated"; }
    } else {
      question = dynamicFollowUp({ topic: topic, asked: asked, lastQ: anchor, answer: answer });
    }

    return { question: question, feedback: feedback, flag: flag };
  }

  function freshQuestion(topic, part, asked, lastQ) {
    const bank = part === 3 ? (topic.part3 || []).map(p => p[0]) : (topic.qs || []);
    const left = bank.filter(q => asked.indexOf(q) < 0 && q !== lastQ);
    if (left.length) return left[0];
    return dynamicFollowUp({ topic: topic, asked: asked, lastQ: lastQ, answer: "" });
  }

  function dynamicFollowUp(ctx) {
    const { topic, asked = [], lastQ = "", answer = "" } = ctx;
    const pool = FOLLOWUP[qType(lastQ)] || FOLLOWUP.generic;
    const terms = contentWords(answer).filter(w =>
      ["think", "really", "thing", "things", "people", "time", "want", "make", "made", "going", "get", "got", "know"].indexOf(w) < 0);
    const tset = topicTerms(topic).map(stem);
    const mine = [...new Set(terms)].filter(w => tset.indexOf(stem(w)) < 0).slice(0, 6);

    const candidates = [];
    if (mine.length >= 1) {
      /* 只做"引述式"追问：直接把你的用词引回来，不会出现 "Why is friendly important" 这类语法问题 */
      const w = mine[Math.floor(Math.random() * mine.length)];
      candidates.push('You mentioned "' + w + '" — could you say a little more about that?');
    }
    pool.forEach(q => candidates.push(q));

    const fresh = candidates.filter(q => asked.indexOf(q) < 0);
    const list = fresh.length ? fresh : candidates;
    return list[Math.floor(Math.random() * list.length)];
  }

  function abstractQuestion(topic, asked) {
    const t = nounOf(topic);
    const pool = P3_TEMPLATES.map(fn => fn(t)).filter(q => asked.indexOf(q) < 0);
    const list = pool.length ? pool : P3_TEMPLATES.map(fn => fn(t));
    return list[Math.floor(Math.random() * list.length)];
  }

  /* =========================== 升级引擎 =========================== */
  /* 只做语法安全的替换。刻意不做这几件事：
     · 不替换 thing / things（盲替换会出现"买了一堆方面"这类语义错乱）
     · 不用 a great deal of 这类"只接不可数名词"的量词
     · 不做动词短语改写（会破坏英语的补语搭配） */
  const MAP7 = {
    "a lot of": "plenty of", "lots of": "plenty of", "a lot": "considerably",
    "very important": "particularly important", "very good": "particularly good",
    "very": "particularly", "really": "genuinely", "people": "individuals",
    "important": "significant", "big": "substantial", "nice": "pleasant",
    "i think": "I'd say", "a bit": "slightly", "kind of": "somewhat"
  };
  const MAP8 = {
    "a lot of": "an abundance of", "lots of": "an abundance of", "a lot": "substantially",
    "very important": "crucially important", "very good": "exceptionally strong",
    "very": "exceptionally", "really": "undeniably", "people": "individuals",
    "important": "crucial", "big": "considerable", "nice": "delightful",
    "i think": "my own view is that", "a bit": "marginally", "kind of": "to some extent"
  };
  const CONNECT1 = ["Actually,", "To be honest,", "In my case,", "Well,", "Generally speaking,"];
  const CONNECT2 = ["Broadly speaking,", "From my point of view,", "What's more,", "That said,", "Looking at it more widely,"];
  const TAIL1 = [
    ", which I find quite interesting.",
    ", and that's something I've noticed more and more.",
    ", which is partly why it matters to me."
  ];
  const TAIL2 = [
    ", which is a pattern I would argue is far from unusual.",
    ", and I suspect that's true for a great many people my age.",
    ", something that says a good deal about how attitudes have shifted."
  ];

  function splitSentences(t) {
    return (t || "").replace(/\s+/g, " ").trim()
      .split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
  }
  function cleanFillers(t) {
    let s = " " + (t || "").replace(/\s+/g, " ").trim() + " ";
    FILLER_PHRASES.forEach(p => { s = s.replace(new RegExp("\\b" + p.replace(/ /g, "\\s+") + "\\b,?", "gi"), " "); });
    s = s.replace(/\b(um+|uh+|erm+|hmm+)\b,?/gi, " ");
    return s.replace(/\s+/g, " ").replace(/\s+([,.!?])/g, "$1").trim();
  }
  function capitalizeFirst(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
  /* 在连接词后面接句子时，保住独立的 "I"，其余首字母小写 */
  function afterComma(s) {
    if (/^I\b/.test(s) || /^I'/.test(s)) return s;
    return s ? s[0].toLowerCase() + s.slice(1) : s;
  }
  function matchCase(src, dst) {
    if (src && src[0] === src[0].toUpperCase() && src.slice(1) === src.slice(1).toLowerCase()) {
      return dst[0].toUpperCase() + dst.slice(1);
    }
    return dst;
  }

  /* 单次扫描替换：保证一个位置只被替换一次，
     避免 "very important" 先变 "crucially important" 又被 "important" 二次命中 */
  function applyLex(text, map) {
    const keys = Object.keys(map).sort((a, b) => b.length - a.length);
    if (!keys.length) return { text: text, changes: [] };
    const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp("(?<![A-Za-z])(" + keys.map(escapeRe).join("|") + ")(?![A-Za-z])", "gi");
    const changes = [];
    const out = text.replace(re, (m, _g, offset, whole) => {
      const to = map[m.toLowerCase()];
      if (!to) return m;
      changes.push({ kind: "词汇", from: m.toLowerCase(), to: to });
      /* 只有位于句首才大写；句中保持原样（"I'd say" 这类本来就带大写 I 的不受影响） */
      const atStart = offset === 0 || /[.!?]["')\]]?\s+$/.test(whole.slice(0, offset));
      return atStart ? to.charAt(0).toUpperCase() + to.slice(1) : to;
    });
    return { text: out, changes: changes };
  }

  /* 收尾清理：合并重复的 that、多余空格、补句末标点 */
  function tidy(s) {
    let out = (s || "")
      .replace(/\bthat\s+that\b/gi, "that")
      .replace(/\b(\w+)\s+\1\b/gi, "$1")
      .replace(/\s{2,}/g, " ")
      .replace(/\s+([,.!?])/g, "$1")
      .trim();
    if (out && !/[.!?]$/.test(out)) out += ".";
    return out;
  }

  /**
   * 三档升级（三档都从同一个"清洗后的基底"独立改写，
   * 避免串联改写造成的语法崩坏）
   */
  function upgrade(answer, topic) {
    const raw = (answer || "").trim();
    let base = cleanFillers(raw), baseNote = "已去掉口头填充词（um / you know 等），并在句间补了标点";

    if (tokenize(raw).length < 5) {
      const ref = (topic && topic.exprs && topic.exprs.length) ? topic.exprs[0][0] : "";
      base = ref || raw;
      baseNote = ref
        ? "你的回答太短（少于 5 个词），无法改写；下面以该话题的参考表达作为示范基底"
        : "还没有可改写的回答内容";
    }

    const sents = splitSentences(base);
    if (!sents.length) return { base: "", baseNote: baseNote, tiers: [], notes: [] };

    const notes = [];

    /* ---- Band 6：保留原话，只补最基本的句间连接 ---- */
    /* 只用"递进/顺接"类连接词，不猜因果与转折（猜错比不加更糟） */
    const LINK6 = ["Also", "And", "Besides", "In addition"];
    const b6 = sents.map((s, i) => {
      let out = capitalizeFirst(s);
      if (!/[.!?]$/.test(out)) out += ".";
      if (i > 0 && !/^(and|but|so|because|also|then|however|besides|in addition)\b/i.test(out)) {
        const link = LINK6[(i - 1) % LINK6.length];
        out = link + (link === "And" ? " " : ", ") + afterComma(out);
        notes.push({ tier: 6, kind: "连接词", from: "（无）", to: link, note: "补一个最基础的句间连接" });
      }
      return out;
    }).join(" ");

    /* ---- Band 7：词汇升级 + 话语标记 + 一个从句 ---- */
    const lex7 = applyLex(splitSentences(base).map(capitalizeFirst).join(" "), MAP7);
    lex7.changes.forEach(c => notes.push({ tier: 7, kind: c.kind, from: c.from, to: c.to, note: "换成更自然的表达" }));
    const b7s = splitSentences(lex7.text);
    if (b7s.length) {
      const conn = CONNECT1[0];
      b7s[0] = conn + " " + afterComma(b7s[0]);
      notes.push({ tier: 7, kind: "连接词", from: "（句首无标记）", to: conn, note: "开头加话语标记，听起来更自然" });
      if (b7s.length >= 2) {
        const tail = TAIL1[0];
        b7s[b7s.length - 1] = b7s[b7s.length - 1].replace(/[.?!]\s*$/, "") + tail;
        notes.push({ tier: 7, kind: "结构", from: "（无从句）", to: tail.replace(/^,\s*/, ""), note: "补一个非限定性从句，增加语法多样性" });
      }
    }
    const b7 = b7s.join(" ");

    /* ---- Band 8：再升一档词汇 + 让步状语 + 抽象收尾 ---- */
    const lex8 = applyLex(splitSentences(base).map(capitalizeFirst).join(" "), MAP8);
    lex8.changes.forEach(c => notes.push({ tier: 8, kind: c.kind, from: c.from, to: c.to, note: "改用更精准的搭配" }));
    const b8s = splitSentences(lex8.text);
    if (b8s.length) {
      const conn = CONNECT2[0];
      b8s[0] = conn + " " + afterComma(b8s[0]);
      notes.push({ tier: 8, kind: "连接词", from: "（句首无标记）", to: conn, note: "换成更高级的衔接手段" });
      if (b8s.length >= 2 && /^I\b/.test(b8s[1])) {
        b8s[1] = "Although there are exceptions to this, " + afterComma(b8s[1]);
        notes.push({ tier: 8, kind: "结构", from: "（无让步）", to: "Although there are exceptions to this", note: "加让步状语从句，体现句式复杂度" });
      }
      const tail = TAIL2[1];
      b8s[b8s.length - 1] = b8s[b8s.length - 1].replace(/[.?!]\s*$/, "") + tail;
      notes.push({ tier: 8, kind: "结构", from: "（无延伸）", to: tail.replace(/^,\s*/, ""), note: "收尾加一层抽象延伸，体现思辨深度" });
    }
    const b8 = b8s.join(" ");

    /* 去重（同 kind + from + to 只保留一次） */
    const seen = {};
    const uniq = notes.filter(n => {
      const k = n.tier + "|" + n.kind + "|" + n.from + "|" + n.to;
      if (seen[k]) return false;
      seen[k] = 1; return true;
    });

    return {
      base: base, baseNote: baseNote,
      tiers: [
        { band: 6, name: "6 分版 · 把话说清楚", desc: "保留你的原话，只补最基本的连接，确保信息完整、没有明显语病。", text: tidy(b6) },
        { band: 7, name: "7 分版 · 词汇与衔接升级", desc: "基础词换成更自然的搭配，句首加话语标记，补一个从句。", text: tidy(b7) },
        { band: 8, name: "8 分版 · 结构与抽象升级", desc: "更精准的搭配 + 让步状语从句 + 抽象延伸收尾。", text: tidy(b8) }
      ],
      notes: uniq
    };
  }

  /* =========================== 单词级差异 diff =========================== */
  function diffWords(a, b) {
    const A = (a || "").split(/(\s+)/).filter(s => s !== "");
    const B = (b || "").split(/(\s+)/).filter(s => s !== "");
    const n = A.length, m = B.length;
    const dp = [];
    for (let i = 0; i <= n; i++) dp.push(new Int32Array(m + 1));
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        dp[i][j] = A[i].toLowerCase() === B[j].toLowerCase()
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    const out = [];
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (A[i].toLowerCase() === B[j].toLowerCase()) { out.push({ t: A[i], s: "same" }); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ t: A[i], s: "del" }); i++; }
      else { out.push({ t: B[j], s: "add" }); j++; }
    }
    while (i < n) out.push({ t: A[i++], s: "del" });
    while (j < m) out.push({ t: B[j++], s: "add" });
    return out;
  }

  function diffHTML(a, b) {
    const escape = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const parts = diffWords(a, b);
    let html = "", mode = null, buf = [], prevChar = "";
    const flush = () => {
      if (!buf.length) return;
      const raw = buf.join("");
      const txt = escape(raw);
      if (mode === "add" || mode === "del") {
        /* 删除块与新增块相邻且两侧都没有空白时补一个空格，
           否则会渲染成 "reallygenuinely" 这种粘在一起的词 */
        if (prevChar && !/\s/.test(prevChar) && !/^\s/.test(raw)) html += " ";
        html += (mode === "add")
          ? '<ins class="df-add">' + txt + "</ins>"
          : '<del class="df-del">' + txt + "</del>";
      } else {
        html += txt;
      }
      prevChar = raw.slice(-1);
      buf = [];
    };
    parts.forEach(p => {
      if (p.s !== mode) { flush(); mode = p.s; }
      buf.push(p.t);
    });
    flush();
    return html;
  }

  /* =========================== 报告引擎 =========================== */
  function buildReport(records) {
    const r = (records || []).filter(Boolean);
    const n = r.length;
    const out = { strengths: [], weaknesses: [], advice: [] };
    if (!n) { out.advice.push("本轮没有可分析的作答记录——每道题都开口说、或至少打字作答，报告才有依据。"); return out; }

    const scored = r.filter(x => x.FC != null && (x.FC + x.LR + x.GRA + x.PR) > 0);
    const avgOf = k => scored.length ? (scored.reduce((s, x) => s + x[k], 0) / scored.length) : null;
    const wpmList = r.map(x => x.wpm).filter(Boolean);
    const avgWpm = wpmList.length ? Math.round(wpmList.reduce((a, b) => a + b, 0) / wpmList.length) : 0;
    const withWords = r.filter(x => x.words);
    const fillRatio = withWords.length ? withWords.reduce((s, x) => s + (x.fill || 0) / x.words, 0) / withWords.length : 0;
    const shortCount = r.filter(x => x.durSec && x.durSec < 90).length;
    const flagged = r.reduce((s, x) => s + (x.flag === "short" || x.flag === "offtopic" ? 1 : 0), 0);
    const answers = r.length;

    if (scored.length) {
      const fc = avgOf("FC"), lr = avgOf("LR"), gra = avgOf("GRA"), pr = avgOf("PR");
      if (lr >= 6.5) out.strengths.push("词汇资源（LR）平均 " + lr.toFixed(1) + "，表达储备是相对优势。");
      if (pr >= 6.5) out.strengths.push("发音（PR）平均 " + pr.toFixed(1) + "，听起来比较清楚。");
      if (gra >= 6.5) out.strengths.push("语法多样性（GRA）平均 " + gra.toFixed(1) + "，复杂句式已经能用起来。");
      if (fc < 6.5) out.weaknesses.push("流利与连贯（FC）平均 " + fc.toFixed(1) + "，是最需要投入的一项。");
      if (gra < 6.5) out.weaknesses.push("语法多样性与准确性（GRA）平均 " + gra.toFixed(1) + "，复杂句式偏少。");
      if (lr < 6.5) out.weaknesses.push("词汇资源（LR）平均 " + lr.toFixed(1) + "，反复用同一批基础词。");
      if (pr < 6.5) out.weaknesses.push("发音（PR）平均 " + pr.toFixed(1) + "，建议增加跟读。");
    }
    if (avgWpm && avgWpm >= 115 && avgWpm <= 165) out.strengths.push("平均语速 " + avgWpm + " 词/分，处在自然区间。");
    if (withWords.length && fillRatio < 0.04) out.strengths.push("填充词占比只有 " + Math.round(fillRatio * 100) + "%，听起来很干净。");
    if (avgWpm && avgWpm < 100) out.weaknesses.push("平均语速只有 " + avgWpm + " 词/分，停顿偏多。");
    if (withWords.length && fillRatio >= 0.08) out.weaknesses.push("填充词占比 " + Math.round(fillRatio * 100) + "% 偏高。");
    if (shortCount) out.weaknesses.push("有 " + shortCount + " 次 Part 2 陈述不足 90 秒。");
    if (flagged) out.weaknesses.push("有 " + flagged + " 个回答被判定为过短或偏离题目。");
    if (!out.strengths.length) out.strengths.push("已经开始系统练习了——先把这一项保持住，再逐项补短板。");
    if (!out.weaknesses.length) out.weaknesses.push("四维自评都在 6.5 以上，短板不明显；把目标提到 7.5 再自评一次。");

    if (shortCount) out.advice.push("Part 2 固定成「总起一句 + 三个细节 + 一句感受」，就能把 2 分钟撑满。");
    if (flagged) out.advice.push("被标为过短的题，先写下 3 个关键词，再开口讲满 30 秒。");
    if (avgWpm && avgWpm < 100) out.advice.push("用 well / actually / to be honest 做过渡，比停下来想词更自然。");
    if (withWords.length && fillRatio >= 0.08) out.advice.push("把 um / like 换成 1 秒沉默，考官不会扣分，填充词会。");
    out.advice.push("把 8 分版表达朗读 3 遍再复述，比单纯背诵更有效。");
    out.advice.push("本轮共 " + answers + " 条回答记录，建议每题都过一遍三档升级。");
    return out;
  }

  return {
    react: react, diagnose: diagnose, upgrade: upgrade,
    diffHTML: diffHTML, diffWords: diffWords,
    buildReport: buildReport, countFillers: countFillers,
    nounOf: nounOf, topicTerms: topicTerms, overlapScore: overlapScore
  };
})();
