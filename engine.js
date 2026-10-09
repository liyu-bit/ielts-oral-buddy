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

  /* =========================== 考官话术脚本 ===========================
     真实雅思口语考官的语言高度"脚本化"：用词固定、只负责推进流程。
     他**不评价**回答好坏、不给分数、不纠正语法、不解释生词、
     不聊私人话题、不发表自己的观点；Mm-hmm / Right 只是"我在听"的信号。
     这里把官方流程逐句固化（英文原文 + 中文对照），供离线考官、
     模考流程节点与 UI 提示共用。同时提供"教练点评"作为独立通道——
     点评是学习辅助，真实考官不会说，UI 上必须与考官台词分开显示。
     ------------------------------------------------------------------ */
  const SCRIPT = {
    rules: {
      label: "考官行为边界",
      items: [
        { en: "Mm-hmm. / Right. / I see.", zh: "只在倾听，不代表赞同或给分。" },
        { en: "Thank you. That's enough.", zh: "Part 2 到 2 分钟必然打断，属正常流程。" },
        { en: "I'm afraid I can't explain the words.", zh: "不解释单词含义，只提示你试着作答。" },
        { en: "(no reaction)", zh: "不会评价好坏、不给建议、不与你闲聊、不分享自己的观点。" }
      ]
    },
    part0: {
      label: "进场与身份核验",
      lines: [
        { en: "Good morning.", zh: "早上好。" },
        { en: "Good afternoon.", zh: "下午好。" },
        { en: "My name is Amy. Could you tell me your full name, please?", zh: "我叫 Amy，请告诉我你的全名。" },
        { en: "What should I call you?", zh: "我该怎么称呼你？" },
        { en: "Could you show me your identification, please?", zh: "请出示你的身份证件。" },
        { en: "Thank you. Alright. Now, in this speaking test, we are going to talk about several different topics.", zh: "谢谢。好的，接下来我们会聊几个不同的话题。" },
        { en: "First, I'd like to ask you some general questions about yourself.", zh: "首先，我想问你一些关于你自己的基础问题。" }
      ]
    },
    part1: {
      label: "Part 1 · 日常问答",
      open: [
        { en: "Let's talk about {topic}.", zh: "我们聊聊{topic}吧。" },
        { en: "Now, let's move on to talk about {topic}.", zh: "下面我们换个话题，聊聊{topic}。" },
        { en: "I'd like to ask you about {topic}.", zh: "我想问问你关于{topic}的事。" }
      ],
      short: [
        { en: "Why is that?", zh: "为什么呢？" },
        { en: "Could you explain that a bit more?", zh: "可以再多说一点吗？" },
        { en: "What do you mean by that?", zh: "你这么说是什么意思？" },
        { en: "Do many people do that where you live?", zh: "在你住的地方，很多人会这样吗？" },
        { en: "How often do you do it?", zh: "你多久做一次？" }
      ],
      waiting: [
        { en: "Don't worry. Take your time.", zh: "别紧张，慢慢来。" },
        { en: "Maybe you can think about it for a second.", zh: "你可以稍微想一下。" }
      ],
      moveOn: [
        { en: "OK. Let's move on to the next question.", zh: "好，我们换下一个问题。" }
      ],
      backTo: [
        { en: "OK. Let's go back to the question about {topic}.", zh: "好，我们回到关于{topic}的问题。" }
      ],
      toPart2: [
        { en: "Alright. Now, I'm going to give you a task card.", zh: "好了，现在我会给你一张话题卡。" },
        { en: "Here is your task card. You have one minute to prepare. You can make notes on this paper.", zh: "这是你的话题卡。你有 1 分钟准备时间，可以在纸上写笔记。" },
        { en: "I will tell you when one minute is up.", zh: "一分钟到了我会提醒你。" }
      ]
    },
    part2: {
      label: "Part 2 · 个人陈述",
      giveCard: [
        { en: "Here is your task card. You have one minute to prepare.", zh: "这是你的话题卡，你有 1 分钟准备时间。" }
      ],
      start: [
        { en: "Your one minute starts now.", zh: "一分钟计时开始。" }
      ],
      timeUp: [
        { en: "OK. Time's up. Please start speaking.", zh: "好了，时间到，请开始讲述。" }
      ],
      extend: [
        { en: "Can you tell me more about it?", zh: "你可以再多讲讲吗？" },
        { en: "Is there anything else you would like to add?", zh: "还有什么想补充的吗？" }
      ],
      enough: [
        { en: "Thank you. That's enough.", zh: "谢谢，可以了。" }
      ],
      toPart3: [
        { en: "Now, we will discuss some more general questions related to this topic.", zh: "现在我们来讨论和这个话题相关的一些更宏观的问题。" }
      ]
    },
    part3: {
      label: "Part 3 · 深入讨论",
      deepen: [
        { en: "Why do you think so?", zh: "你为什么这么认为？" },
        { en: "Do you agree or disagree with that?", zh: "你同意还是不同意这个观点？" },
        { en: "What do other people think about this?", zh: "其他人怎么看待这件事？" },
        { en: "Are there any differences between young people and old people in this respect?", zh: "在这方面年轻人和老年人有区别吗？" },
        { en: "How has this changed compared to the past?", zh: "和过去相比，这件事发生了怎样的变化？" },
        { en: "What are the advantages and disadvantages of that?", zh: "那有哪些优点和缺点？" },
        { en: "Do you think governments should spend more money on this?", zh: "你认为政府应该在这方面投入更多资金吗？" }
      ],
      repeatRequest: [
        { en: "Sorry, could you repeat that question please?", zh: "（考生可用）不好意思，可以重复一下这个问题吗？" }
      ],
      repeatGrant: [
        { en: "Sure. I asked you ...", zh: "当然。我刚才问你的是……（礼貌重复一次）" }
      ],
      cantExplain: [
        { en: "I'm afraid I can't explain the words. Could you try to answer the question?", zh: "抱歉我不能解释词义，你可以试着回答这个问题。" }
      ],
      anotherAngle: [
        { en: "Alright. Let's look at it from another angle.", zh: "好，那我们换个角度来看这个问题。" }
      ]
    },
    end: {
      label: "结束语",
      lines: [
        { en: "Thank you. That is the end of the speaking test.", zh: "谢谢。口语考试到此结束。" },
        { en: "Goodbye.", zh: "再见。" }
      ]
    },
    backchannel: ["Mm-hmm.", "Right.", "I see.", "OK."],
    scenarios: [
      { key: "fluent", zh: "回答流利、有细节、逻辑清楚", en: "Examiner listens quietly, nods, occasionally says Mm-hmm / Right, cuts you off at the time limit and never praises you." },
      { key: "hesitant", zh: "大量卡顿、重复、反复自我纠正", en: "Examiner keeps a neutral smile, listens patiently, asks fewer follow-ups and ends on time. No grammar correction." },
      { key: "offtopic", zh: "答非所问", en: "Mild: moves to the next question. Serious: \"OK, let's go back to ...\" to pull you back." },
      { key: "tooShort", zh: "只答 Yes / No 或一两句", en: "\"Why?\" / \"Could you tell me more?\" — and if it continues, switches question quickly." },
      { key: "askRepeat", zh: "听不懂问题，请求重复", en: "Repeats once. If you still don't follow the same question, most likely moves on." },
      { key: "selfCorrect", zh: "说错后马上纠正自己", en: "No reaction, keeps listening. Occasional self-correction costs nothing; constant correction hurts fluency." },
      { key: "overtime", zh: "Part 2 超时", en: "\"Thank you. That's enough.\" — a normal procedure, not a negative signal." }
    ]
  };

  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  /* 按文本生成稳定的选择下标：同一段回答每次渲染结果一致，便于复现 */
  function seedPick(arr, seed, offset) {
    let h = 0; const s = String(seed || "");
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return arr[(h + (offset || 0)) % arr.length];
  }
  /* 取一条脚本台词；vars 用于替换 {topic} 占位符 */
  function line(kind, vars) {
    const seg = SCRIPT[kind];
    if (!seg) return { en: "", zh: "" };
    const arr = seg.lines || seg.deepen || seg.start || [];
    const raw = pick(arr);
    const fill = s => String(s || "").replace(/\{topic\}/g, (vars && vars.topic) || "this");
    return { en: fill(raw.en), zh: fill(raw.zh) };
  }

  /* =========================== 四维分档估计 ===========================
     只依据文本可观测的证据做保守估计：连接手段、词汇多样性、
     从句与句式变化。发音（PR）无法从文字判断，一律返回 null，
     由用户听自己的录音自评——宁可留白，也不给假数字。
     ------------------------------------------------------------------ */
  const LINKERS = ["however", "although", "though", "even though", "whereas", "while", "despite",
    "in spite of", "on the other hand", "that said", "that being said", "moreover", "furthermore",
    "in addition", "besides", "as a result", "consequently", "therefore", "which is why", "so that",
    "in terms of", "apart from", "not only", "first of all", "to begin with", "overall", "all in all"];
  const HEDGES = ["i suppose", "i'd say", "i would say", "tend to", "tends to", "more or less",
    "roughly", "probably", "it seems", "as far as i'm concerned", "to some extent",
    "to a large extent", "it depends", "generally speaking", "in most cases", "by and large"];
  const BAND8_LEX = ["compelling", "inevitable", "arguably", "sustainable", "accessible", "rewarding",
    "worthwhile", "crucial", "significant", "genuinely", "considerably", "substantially",
    "strike a balance", "make the most of", "get the hang of", "out of the blue", "in the long run",
    "take for granted", "bear in mind", "on the whole", "as opposed to", "rather than", "in favour of",
    "spoil for choice", "all over the place", "wind down", "clear my head", "come to terms with"];
  const COMPLEX_RE = /\b(which|who|whom|whose|that|where|when|although|though|while|whereas|if|unless|since|because|so that|even though|as long as|in case)\b/i;
  const TENSE_RE = [/\b(was|were|did|had|used to)\b/i, /\b(am|is|are|do|does|have|has)\b/i,
    /\b(will|going to|would|shall)\b/i, /\b(have been|has been|had been)\b/i];

  function clampBand(x) { return Math.max(5, Math.min(9, Math.round(x * 2) / 2)); }
  function lowIncludes(text, list) {
    const t = " " + (text || "").toLowerCase() + " ";
    return list.filter(k => t.indexOf(k) >= 0);
  }

  function bandEstimate(answer, topic) {
    const raw = (answer || "").trim();
    const toks = tokenize(raw);
    const n = toks.length;
    if (!n) return null;

    const d = diagnose(raw, topic, "");
    const content = contentWords(raw);
    const uniq = [...new Set(content.map(stem))];
    const variety = content.length ? uniq.length / content.length : 0;
    const linkers = lowIncludes(raw, LINKERS);
    const hedges = lowIncludes(raw, HEDGES);
    const adv = lowIncludes(raw, BAND8_LEX);
    const sents = splitSentences(raw);
    const avgLen = sents.length ? n / sents.length : n;
    const tenses = TENSE_RE.filter(re => re.test(raw)).length;
    const complex = COMPLEX_RE.test(raw);
    const topicHits = (topic ? topicTerms(topic) : []).filter(t => raw.toLowerCase().indexOf(t) >= 0).length;

    const ev = [];
    /* FC 流利与连贯 */
    let fc = 6;
    if (n < 12) { fc -= 0.5; ev.push("FC：只有 " + n + " 个词，信息量不足以展现连贯。"); }
    if (n >= 40) fc += 0.5;
    if (n >= 75) fc += 0.5;
    if (linkers.length >= 2) fc += 0.5;
    if (linkers.length >= 4) fc += 0.5;
    if (linkers.length) ev.push("FC：用到 " + linkers.slice(0, 3).join(" / ") + " 等衔接手段。");
    else if (n >= 15) { fc -= 0.5; ev.push("FC：句与句基本是并列，缺少衔接词。"); }
    if (d.fillerRatio > 0.08) { fc -= 0.5; ev.push("FC：填充词占 " + Math.round(d.fillerRatio * 100) + "%，影响流畅度。"); }

    /* LR 词汇资源 */
    let lr = 6;
    if (variety >= 0.65) lr += 0.5;
    if (variety < 0.45) { lr -= 0.5; ev.push("LR：实词重复率偏高，同一批词反复出现。"); }
    if (adv.length >= 1) { lr += 0.5; ev.push("LR：出现 " + adv.slice(0, 3).join(" / ") + " 这类更有质感的表达。"); }
    if (adv.length >= 3) lr += 0.5;
    if (hedges.length) { lr += 0.5; ev.push("LR：会用 " + hedges.slice(0, 2).join(" / ") + " 做程度上的模糊，听感更自然。"); }
    if (topicHits >= 3) lr += 0.5;

    /* GRA 语法多样性与准确性 */
    let gra = 6;
    if (complex) { gra += 0.5; ev.push("GRA：出现了从句结构。"); }
    else if (n >= 25) { gra -= 0.5; ev.push("GRA：通篇简单句，句式变化不足。"); }
    if (tenses >= 2) gra += 0.5;
    if (tenses >= 3) gra += 0.5;
    if (avgLen >= 14 && complex) gra += 0.5;

    return {
      words: n, fc: clampBand(fc), lr: clampBand(lr), gra: clampBand(gra), pr: null,
      linkers: linkers.length, complex: complex, variety: Math.round(variety * 100) / 100,
      evidence: ev,
      overall: clampBand((clampBand(fc) + clampBand(lr) + clampBand(gra)) / 3)
    };
  }

  /* 教练点评：与考官台词严格分离。真实考官不会说这些。 */
  function coachNote(answer, topic, part, d) {
    const b = bandEstimate(answer, topic);
    if (!b) return "";
    const head = "这段大致在 " +
      (b.overall - 0.5).toFixed(1) + "–" + (b.overall + 0.5).toFixed(1) + " 分区间。" +
      " FC " + b.fc.toFixed(1) + "，LR " + b.lr.toFixed(1) + "，GRA " + b.gra.toFixed(1) +
      "；PR 无法从文字判断，请听自己的录音打分。";
    const tips = [];
    if (b.linkers < 2) tips.push("补 2–3 个衔接词（that said / which is why / on the whole），把短句串成一段话。");
    if (b.lr < 6.5) tips.push("把 a lot of、very、important 这类高频基础词换掉一个，换成具体一点的表达。");
    if (!b.complex) tips.push("加一处从句或让步结构（although… / which means…），并让时态在现在和过去之间切换一次。");
    if (d.hasReason && d.hasExample && b.overall >= 7) tips.push("已经有理由也有例子，下一步是把观点往前推一层：追问它为什么会这样、会带来什么影响。");
    if (part === 2 && d.words < 120) tips.push("Part 2 的目标是 2 分钟，先固定成「一句总起 + 三个细节 + 一句感受」。");
    const ev = b.evidence.length ? " 依据：" + b.evidence.join(" ") : "";
    const tip = tips.length ? " 建议：" + tips.slice(0, 2).join(" ") : "";
    return head + ev + tip;
  }

  /* =========================== 考官引擎 =========================== */
  /**
   * 生成本轮的考官回应。
   * ctx = { topic, part, asked:[已问过的问题], lastQ, answer, reaskDone }
   * 返回 { question, feedback, coach, flag, band }
   *
   * feedback = 考官说的话。只做流程推进，**不含任何评价**：
   *   · 回答过短 → 要求展开（Why is that? / Could you explain that a bit more?）
   *   · 答非所问 → 礼貌拉回原问题（OK. Let's go back to the question about …）
   *   · 内容充分 → 只给倾听信号（Mm-hmm. / Right. / I see.），或直接问下一题
   * coach = 教练点评（含四维估计与依据），是学习辅助，真实考官不会说。
   */
  function react(ctx) {
    const { topic, part, asked = [], lastQ = "", answer = "", reaskDone = false } = ctx;
    /* anchorQ = 最近一个"内容型"问题（不含"How could you expand…"这类元追问），
       用它决定追问类型，避免追问跟着元追问跑偏 */
    const anchor = ctx.anchorQ || lastQ;
    const d = diagnose(answer, topic, lastQ);
    let feedback = "", flag = "ok", question = "";

    /* --- 1. 考官台词：只推进流程，不评价 --- */
    if (d.words === 0) {
      feedback = "";
    } else if (d.offTopic && !reaskDone && lastQ) {
      flag = "offtopic";
      feedback = pick(SCRIPT.part1.backTo).en.replace(/\{topic\}/g, nounOf(topic));
    } else if (d.offTopic) {
      flag = "offtopic";
      feedback = pick(SCRIPT.part1.moveOn).en;
    } else if (d.tooShort && part !== 2) {
      flag = "short";
      /* 真实考官不会先复述你的话再让你展开，他直接问一个更具体的问题 */
      question = part === 3 ? pick(SCRIPT.part3.deepen).en : pick(SCRIPT.part1.short).en;
    } else if (d.fillerRatio > 0.12) {
      flag = "fillers";
      feedback = pick(SCRIPT.backchannel);
    } else if (d.words >= 25) {
      /* 内容足够时，考官通常只给倾听信号，然后直接问下一题 */
      feedback = pick(SCRIPT.backchannel);
    }

    /* --- 2. 教练点评（学习辅助，与考官台词分开展示） --- */
    const coach = coachNote(answer, topic, part, d);

    /* --- 3. 决定下一个问题 --- */
    if (flag === "offtopic" && !reaskDone && lastQ) {
      /* 第一次跑题：明确拉回，并把原问题再问一次（这就是考官的下一问） */
      question = lastQ;
    } else if (flag === "offtopic") {
      question = freshQuestion(topic, part, asked, lastQ);
    } else if (!question) {
      /* 过短时 question 已在上面定好（就是那个更具体的追问），不要覆盖 */
      if (part === 3) {
        const bank = (topic.part3 || []).map(p => p[0]);
        const left = bank.filter(q => asked.indexOf(q) < 0 && q !== lastQ);
        if (left.length) question = pick(left);
        else { question = abstractQuestion(topic, asked); flag = "escalated"; }
      } else {
        question = dynamicFollowUp({ topic: topic, asked: asked, lastQ: anchor, answer: answer });
      }
    }

    return { question: question, feedback: feedback, coach: coach, flag: flag, band: bandEstimate(answer, topic) };
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
    "i think": "I'd say", "a bit": "slightly", "kind of": "somewhat",
    "interesting": "intriguing", "difficult": "challenging",
    "tiring": "exhausting", "boring": "dull"
  };
  const MAP8 = {
    "a lot of": "an abundance of", "lots of": "an abundance of", "a lot": "substantially",
    "very important": "crucially important", "very good": "exceptionally strong",
    "very": "exceptionally", "really": "undeniably", "people": "individuals",
    "important": "crucial", "big": "considerable", "nice": "delightful",
    "i think": "my own view is that", "a bit": "marginally", "kind of": "to some extent",
    "interesting": "compelling", "difficult": "demanding",
    "tiring": "draining", "boring": "monotonous"
  };
  const CONNECT1 = ["Actually,", "To be honest,", "In my case,", "Well,", "Generally speaking,"];
  const CONNECT2 = ["Broadly speaking,", "From my point of view,", "What's more,", "That said,", "Looking at it more widely,"];
  const TAIL1 = [
    ", which I find quite interesting.",
    ", and that's something I've noticed more and more.",
    ", which is partly why it matters to me.",
    ", and that seems to be the general pattern."
  ];
  const TAIL2 = [
    ", which is a pattern I would argue is far from unusual.",
    ", and I suspect that's true for a great many people my age.",
    ", something that says a good deal about how attitudes have shifted.",
    ", and that, to my mind, is the crux of the whole issue."
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
      const conn = seedPick(CONNECT1, base, 0);
      b7s[0] = conn + " " + afterComma(b7s[0]);
      notes.push({ tier: 7, kind: "连接词", from: "（句首无标记）", to: conn, note: "开头加话语标记，听起来更自然" });
      if (b7s.length >= 2) {
        const tail = seedPick(TAIL1, base, 3);
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
      const conn = seedPick(CONNECT2, base, 0);
      b8s[0] = conn + " " + afterComma(b8s[0]);
      notes.push({ tier: 8, kind: "连接词", from: "（句首无标记）", to: conn, note: "换成更高级的衔接手段" });
      if (b8s.length >= 2 && /^I\b/.test(b8s[1])) {
        b8s[1] = "Although there are exceptions to this, " + afterComma(b8s[1]);
        notes.push({ tier: 8, kind: "结构", from: "（无让步）", to: "Although there are exceptions to this", note: "加让步状语从句，体现句式复杂度" });
      }
      const tail = seedPick(TAIL2, base, 5);
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
    nounOf: nounOf, topicTerms: topicTerms, overlapScore: overlapScore,
    SCRIPT: SCRIPT, line: line, pick: pick, seedPick: seedPick,
    bandEstimate: bandEstimate, coachNote: coachNote
  };
})();
