/* IELTS Oral Buddy · 分档示范回答
   ------------------------------------------------------------------
   按「问题类型 / 话题类别」组织，每个类型给出 6 / 7 / 8 三档英文示范，
   并逐档说明它为什么落在这一档——判断依据来自官方四项评分标准：
     FC  Fluency and Coherence      流利与连贯
     LR  Lexical Resource           词汇资源
     GRA Grammatical Range & Accuracy 语法多样性与准确性
     PR  Pronunciation              发音（文字无法体现，需自己听录音）
   ------------------------------------------------------------------
   使用约定：
     · 示范回答均为本项目自撰，不取自任何教辅或网络答案。
     · 6 分档并不等于“差”，它是有条理、无硬伤、但手段有限的版本——
       这正是多数考生的真实基线，也是改写的起点。
     · 8 分档共同的特征是：主动限定自己说的话、给出对立面、
       把原因从表面推进到机制或自我认知，而不只是堆砌难词。
   ------------------------------------------------------------------ */

window.IELTS_BANDS = {

  meta: {
    title: "分档示范回答",
    note: "同一道题的三档示范与分档依据。PR 无法从文字判断，请朗读后听自己的录音。",
    dimensions: [
      { k: "FC", en: "Fluency and Coherence", zh: "流利与连贯" },
      { k: "LR", en: "Lexical Resource", zh: "词汇资源" },
      { k: "GRA", en: "Grammatical Range and Accuracy", zh: "语法多样性与准确性" },
      { k: "PR", en: "Pronunciation", zh: "发音" }
    ]
  },

  /* ==================== Part 1 · 按问题类型 ==================== */
  part1: [
    {
      id: "pref", label: "偏好选择类", match: "\\bprefer\\b|\\brather\\b",
      q: "Do you prefer to travel by train or by bus?", qzh: "你更喜欢坐火车还是坐大巴？",
      tiers: [
        { band: 6, text: "I prefer to travel by train. It is more comfortable and it is also faster. So I usually take the train when I go home.", zh: "我更喜欢坐火车。更舒服，也更快。所以我回家一般坐火车。", why: "观点清楚、时态正确、没有语病，是合格的 6 分回答。但三句都是简单句，衔接只有 and / so / also，形容词停留在 comfortable / faster 这一层。" },
        { band: 7, text: "I'd say I prefer travelling by train, mainly because it's far more comfortable — you can get up and walk around. Buses tend to be cheaper, though, so it really depends on how far I'm going.", zh: "我大概会选火车，主要是舒服得多，你能站起来走动。不过大巴一般更便宜，所以还得看路程远近。", why: "I'd say / mainly because / tend to / though 四个手段让句子有了层次；并且用 get up and walk around 这样的具体描述代替抽象形容词，最后给出条件（看路程），而非一口咬死。" },
        { band: 8, text: "On the whole, I'd go for the train, largely because the journey itself feels far less draining — you've got room to move about and read. That said, if I'm only going a short distance, the bus is perfectly adequate, and the price gap is hard to ignore.", zh: "总体上说我会选火车，主要是因为整段路程没那么耗人，你有空间走动、看书。话虽如此，如果只是短途，大巴完全够用，而且差价很难忽略。", why: "On the whole / largely because / That said 让论述有起伏；draining、perfectly adequate、hard to ignore 都是更精准的搭配；最关键的是结尾主动承认对立面，这是 8 分档在连贯与思辨上的共同特征。" }
      ]
    },
    {
      id: "freq", label: "频率习惯类", match: "\\bhow often\\b|\\bdo you usually\\b|\\bhow many times\\b|\\bhow long\\b",
      q: "How often do you read?", qzh: "你多久读一次书？",
      tiers: [
        { band: 6, text: "I usually read in the evening. I read for about thirty minutes. I do it almost every day.", zh: "我一般晚上读书。读三十分钟左右。几乎每天都读。", why: "信息完整、回答直接。问题在于三个短句彼此独立，且反复使用 I read / I do it，没有一处衔接。" },
        { band: 7, text: "I try to read most evenings — probably half an hour or so before bed. It doesn't always happen, but I'd say four or five nights a week on average.", zh: "多数晚上我会尽量读一会儿，大概睡前半小时。不一定每天都能做到，平均一周四五晚吧。", why: "try to / probably / or so / on average 让频率表达接近母语者的模糊说法，而不是给一个假精确的数字；破折号插入补充信息，句式有了变化。" },
        { band: 8, text: "It's become something of a nightly ritual, to be honest — usually half an hour once the day has wound down. I'd like to claim it's every evening, but realistically it works out to four or five nights a week.", zh: "说实话，这已经成了一种睡前仪式，一般是一天忙完之后读半小时。我很想说自己是每晚都读，但实际算下来一周也就四五晚。", why: "something of a nightly ritual、wind down 是地道的成块表达；I'd like to claim… but realistically 用自嘲完成一次让步，这种语用层面的自然度正是 7 分与 8 分的分水岭。" }
      ]
    },
    {
      id: "like", label: "喜好类", match: "\\bdo you like\\b(?!\\s+to\\b)|\\bare you (keen|fond|into)\\b",
      q: "Do you like music?", qzh: "你喜欢音乐吗？",
      tiers: [
        { band: 6, text: "Yes, I like music very much. I listen to pop music. I listen when I am on the bus.", zh: "喜欢，我很喜欢音乐。我听流行音乐。我在坐公交的时候听。", why: "能直接回答问题、信息真实。但用词高度重复，三个句子都是同一结构的变体。" },
        { band: 7, text: "Yes, I'm quite into music — mostly pop, with a bit of jazz. I tend to put my headphones on during my commute, which makes the journey go a lot faster.", zh: "喜欢，我挺迷音乐的，主要是流行，也听一点爵士。通勤时我习惯戴上耳机，路程会快很多。", why: "be into / a bit of / tend to 是自然的口语搭配；补了一个非限定性定语从句，句子开始有主次之分。" },
        { band: 8, text: "I'm genuinely fond of music, though my taste is a bit all over the place — pop, jazz, the occasional film score. I usually have something playing on my commute; it's a small ritual that makes the journey far more bearable.", zh: "我真心喜欢音乐，不过口味挺杂的，流行、爵士，偶尔听点电影配乐。通勤时我总会放着点什么，这个小习惯让路上好过很多。", why: "genuinely fond of、all over the place、the occasional、bearable 都是高分表达；though 引导的让步让它不只是一句“喜欢”，而带上了自我观察。" }
      ]
    },
    {
      id: "change", label: "变化对比类", match: "\\bchanged\\b|\\bsince you were\\b|\\bwhen you were\\b|\\bcompared\\b",
      q: "Has your hometown changed much since you were a child?", qzh: "你家乡从你小时候到现在变化大吗？",
      tiers: [
        { band: 6, text: "Yes, it has changed a lot. Before, we did not have many shops. Now we have many shops and it is more convenient.", zh: "变化很大。以前我们没多少商店。现在商店很多，也方便多了。", why: "会用 before / now 做时间对比，时态基本正确，能完成这道题的核心要求。但对比手段单一，全篇只有一个稍好的词 convenient。" },
        { band: 7, text: "Definitely. When I was younger there weren't nearly as many options, whereas now there's almost too much choice — which can be a bit overwhelming.", zh: "变化很大。我小时候选择远没有这么多，而现在选择多到几乎过剩，有时候反而让人无所适从。", why: "whereas 是标准的对比连词；not nearly as many / almost too much choice 有具体感；结尾用定语从句补出一个带态度的评价。" },
        { band: 8, text: "It's changed beyond recognition, really. What used to be a handful of family-run shops has turned into an almost endless retail parade, and while that's convenient, it has also stripped away a good deal of the character the place once had.", zh: "变得几乎认不出来了。过去只有零星几家家庭小店，现在成了望不到头的商业街。方便是方便了，但这个地方原有的味道也被削掉了不少。", why: "beyond recognition、a handful of、retail parade 信息密度高；while 引导的让步让回答不停在“好或不好”，而是明确指出代价——这是 8 分档最明显的差异。" }
      ]
    },
    {
      id: "desc", label: "描述类", match: "\\bwhat kind of\\b|\\bwhat sort of\\b|\\bfavourite\\b",
      q: "What kind of place do you like to spend time in?", qzh: "你喜欢在什么样的地方待着？",
      tiers: [
        { band: 6, text: "I like the park near my home. It is big and quiet. I go there with my friends at the weekend.", zh: "我喜欢我家附近的公园。又大又安静。周末我会和朋友去那儿。", why: "描述准确、信息完整、结构清楚。但只见 big / quiet 这类最基础的形容词，画面感不足。" },
        { band: 7, text: "I'd have to say somewhere quiet, ideally with a bit of greenery — a park or a riverside path. It's nothing spectacular, but it's peaceful, and it gives me room to think.", zh: "我得说我喜欢安静的地方，最好有点绿意，公园或者河边的步道。算不上什么美景，但很平和，能让我静下来想想事情。", why: "I'd have to say / ideally / a bit of greenery / nothing spectacular but… 让描述带着态度；结尾给出一层功能性的理由。" },
        { band: 8, text: "Honestly, anywhere with a bit of breathing space — a park, a riverside path, anywhere I'm not surrounded by concrete. Nothing grand, but somewhere like that is remarkably good at clearing my head after a long week.", zh: "老实说，只要有点喘息空间就行，公园、河边步道，只要不是被水泥包着的地方。不用多气派，但这样的地方确实很能帮我在忙碌一周后把脑子清空。", why: "breathing space、surrounded by concrete、remarkably good at 都是母语者的日常说法；用具体意象替代抽象赞美，画面感直接高于 7 分档。" }
      ]
    },
    {
      id: "opinion", label: "观点理由类", match: "\\bdo you think\\b|\\bis it important\\b|\\bshould\\b",
      q: "Do you think it's important to learn a foreign language?", qzh: "你觉得学一门外语重要吗？",
      tiers: [
        { band: 6, text: "Yes, I think it is very important. It helps us talk to more people. Everyone should learn one.", zh: "重要。它帮我们和更多人交流。每个人都应该学一门。", why: "立场明确、给出了理由，是完整的 6 分回答。但 very / important / helps us 都是最高频的基础表达，且理由只有一层。" },
        { band: 7, text: "Yes, I'd say it's genuinely important — it comes up in everyday life far more than people expect, and being able to hold a conversation opens a lot of doors.", zh: "重要，我觉得是真的很重要。它出现在日常生活中的频率比大家想的高得多，而能顺畅对话会打开很多机会。", why: "I'd say / genuinely / far more than people expect / opens a lot of doors 让理由具体起来，语气也更像真实对话而非背诵。" },
        { band: 8, text: "I'd argue it matters a great deal, though perhaps not for the reason people usually give. It's less about the practical benefit and more about the confidence it gives you to deal with unfamiliar situations.", zh: "我认为它非常重要，但原因可能不是大家通常说的那个。它不太在于实际用处，更多在于它给你的那种面对陌生情境的底气。", why: "I'd argue / a great deal 提升表达分量；It's less about…and more about… 是重新定义问题的句式，把理由从“沟通方便”推到“心理层面”，体现了抽象概括能力。" }
      ]
    }
  ],

  /* ==================== Part 2 · 按话题类别 ==================== */
  part2: [
    {
      id: "person", label: "人物类", match: "人物",
      prompt: "Describe a person you admire.", promptZh: "描述一个你敬佩的人。",
      tiers: [
        { band: 6, text: "The person I admire is my grandmother. She is seventy years old. She is very kind and she always helps other people. When I was a child, she looked after me every day. She taught me to be patient. I want to be like her in the future.", zh: "我敬佩的人是我奶奶。她七十岁。她很善良，总是帮助别人。我小时候她每天照顾我。她教我要有耐心。我以后想成为像她一样的人。", why: "四个要点依次讲完，时态基本正确，听得出诚意。但句子几乎全是主谓宾，连接只有 and / when，形容词停在 kind、patient，撑不满 2 分钟。" },
        { band: 7, text: "The person I admire most is my grandmother. She's in her seventies now, and what strikes me about her is how calm she stays no matter what's going on. When I was small, she looked after me while my parents were at work, and she never once seemed to lose her patience. She's the reason I try to stay level-headed when things go wrong.", zh: "我最敬佩的人是我奶奶。她七十多岁了，最打动我的是无论发生什么她都很稳。我小的时候，父母上班，是她照顾我，而且她一次都没表现得不耐烦。我遇事尽量保持冷静，也是受她影响。", why: "用 what strikes me 把描述引向评价，never once 强化细节，level-headed 比 patient 更具体；补了 while 从句，句子开始有主次。" },
        { band: 8, text: "I'd have to pick my grandmother, though 'admire' feels almost too formal a word for it. She's in her seventies, and the thing I find genuinely remarkable is her composure — I've never once seen her rattled, even when the family was going through a really difficult patch. She brought me up while my parents were working, and she did it without ever making it feel like a burden. If I end up with half her steadiness, I'll consider that a success.", zh: "我得选我奶奶，不过用“敬佩”这个词好像有点太正式了。她七十多岁，真正让我觉得了不起的是她的沉稳，我从没见过她慌，哪怕家里最难的时候也没有。我父母上班，是她把我带大的，而且她从没让这件事显得像负担。如果我能有她一半的从容，我就觉得算成功了。", why: "开头主动限定措辞（'admire' feels almost too formal），是 8 分档典型的话语自我调节；composure、rattled、difficult patch、steadiness 用词密度高；四个要点被织进一条完整线索，而不是逐个报数。" }
      ]
    },
    {
      id: "place", label: "地点类", match: "地点",
      prompt: "Describe a place you like to go to.", promptZh: "描述一个你喜欢去的地方。",
      tiers: [
        { band: 6, text: "The place I like to go to is a small café near my home. It is not big but it is very cosy. I go there once or twice a week with my friends. We drink coffee and talk about our studies. I like it because it is quiet and the coffee is good.", zh: "我喜欢去的地方是我家附近的一家小咖啡馆。不大，但很温馨。我一周会和朋友们去一两次。我们喝咖啡、聊学习。我喜欢它，因为安静，咖啡也好喝。", why: "地点、频率、活动、理由齐全，结构是标准的四段式。但句式重复，形容词只有 big / cosy / quiet / good 四个。" },
        { band: 7, text: "There's a small café a few minutes from my flat that I keep going back to. It's nothing fancy — a handful of tables and a lot of plants — but it's remarkably quiet, which is why I end up there whenever I need to get some work done.", zh: "离我住处几分钟有家小咖啡馆，我总往那儿跑。谈不上精致，就几张桌子加一堆绿植，但特别安静，所以每次想干点正事我就去那儿。", why: "nothing fancy / a handful of / end up there whenever 让描述有节奏感；用 which 从句把“安静”和“所以常去”连成因果。" },
        { band: 8, text: "The place I keep drifting back to is a tiny café about ten minutes from where I live. On paper there's nothing to it — six tables, an unreasonable number of plants — but it has this quality of making an hour disappear. I'll go in intending to answer two emails and surface three hours later. It's the one spot in the city where I can actually hear myself think.", zh: "我总是不知不觉又去的地方，是离家十分钟的一家小咖啡馆。纸面上看它没什么特别的，六张桌子，多到不合理的绿植，但它就是有种让一小时凭空消失的魔力。我进去时打算回两封邮件，再抬头已经过去三小时。这是整座城里唯一一个我能真正静下来想事的地方。", why: "keep drifting back to、On paper there's nothing to it、making an hour disappear、hear myself think 都是地道的成块表达；用一个小场景（打算回两封邮件）替代抽象赞美，可信度立刻不同。" }
      ]
    },
    {
      id: "event", label: "事件经历类", match: "事件",
      prompt: "Describe a time when you had to make a difficult decision.", promptZh: "描述一次你不得不做艰难决定的经历。",
      tiers: [
        { band: 6, text: "I had to make a difficult decision last year. I had two job offers. One was in my city and one was in another city. I talked to my parents. In the end I chose the one near my home because I did not want to leave my family.", zh: "去年我不得不做一个艰难的决定。我拿到两个工作机会。一个在我所在的城市，一个在另一个城市。我和父母聊了。最后我选了离家近的那个，因为我不想离开家人。", why: "背景、选项、结果、理由都交代清楚，时态正确。问题是通篇简单句，decision / chose 之外几乎没有更有力的词，也没有交代“难”在哪里。" },
        { band: 7, text: "About a year ago I had to choose between two job offers, and I genuinely couldn't decide for weeks. One was in my home city, the other meant moving a long way away. In the end I went for the one closer to home, mainly because I wasn't ready to put that much distance between me and my family.", zh: "大约一年前，我需要在两个工作机会之间做选择，真的好几周都定不下来。一个在我家乡，另一个意味着搬去很远的地方。最后我选了离家近的那个，主要是我还没准备好离家那么远。", why: "couldn't decide for weeks 制造出真实的张力，回应了题干里的 difficult；mainly because 给出理由；put that much distance between me and my family 是自然的说法。" },
        { band: 8, text: "A year or so ago I was torn between two job offers and I sat on the decision far longer than I should have. One would have kept me close to home; the other would have meant starting over somewhere I knew nobody. What tipped it in the end wasn't the money or the title — it was realising that I'd have regretted not being around while my parents were getting older. It was uncomfortable, but I've never second-guessed it since.", zh: "大约一年前，我在两个工作机会之间摇摆不定，拖了远比该有的时间长。一个能让我留在家里这边，另一个意味着去一个谁都不认识的地方从头开始。最后起决定作用的不是钱也不是职位，而是我意识到，如果父母在一天天变老而我不在身边，我一定会后悔。当时不好受，但从那以后我一次都没怀疑过这个决定。", why: "torn between、sat on the decision、What tipped it in the end、second-guessed 全是高分词汇；更重要的是把理由从表面因素（钱、职位）推进到自我认知，这是 FC 与 LR 同时加分的写法。" }
      ]
    },
    {
      id: "object", label: "物品事物类", match: "物品",
      prompt: "Describe something you own that is important to you.", promptZh: "描述一件对你很重要的东西。",
      tiers: [
        { band: 6, text: "The thing that is important to me is my watch. My father gave it to me when I was eighteen. It is not expensive but I like it very much. I wear it every day. When I look at it, I remember my father.", zh: "对我很重要的东西是我的手表。我十八岁时父亲给我的。不贵，但我很喜欢。我每天都戴。看到它我就会想起父亲。", why: "物品、来源、意义三要素齐全，逻辑顺序自然。缺点是六个句子里有五句以 I 或 It 开头，句式单调。" },
        { band: 7, text: "The thing I'd hate to lose is a fairly ordinary watch my father gave me when I turned eighteen. It isn't worth much, but I wear it almost every day, and it's become a bit of a reminder of him more than anything else.", zh: "我最不想弄丢的，是一块很普通的手表，十八岁那年我父亲给我的。不值什么钱，但我几乎每天都戴，它更多成了关于他的一个念想。", why: "I'd hate to lose 一开口就带着情感分量；fairly ordinary、a bit of a reminder、more than anything else 让语气自然，而不是直白抒情。" },
        { band: 8, text: "If I had to pick one possession, it'd be a scruffy old watch my father gave me when I turned eighteen. There's nothing special about it — it keeps mediocre time and the strap has been replaced twice — but I've worn it more or less every day since, and somewhere along the way it stopped being an object and became a habit, which is a much harder thing to lose.", zh: "如果只能挑一样东西，我会选一块破破烂烂的旧手表，十八岁生日时父亲给的。它没什么特别的，走时也不太准，表带换过两次，但从那以后我基本上天天戴着。不知道从什么时候起，它不再是一件物品，而变成了一种习惯，那才是更难失去的东西。", why: "先用“破旧、走时不准”制造反差，显得真实；somewhere along the way / stopped being an object and became a habit 完成一次概念升级——把实物写成习惯，是 8 分档常见的收尾方式。" }
      ]
    },
    {
      id: "aspiration", label: "志向规划类", match: "志向",
      prompt: "Describe a goal you would like to achieve.", promptZh: "描述一个你想实现的目标。",
      tiers: [
        { band: 6, text: "My goal is to study abroad. I want to go to a good university. I need to improve my English first. I am studying every day now. I think I can do it in two years.", zh: "我的目标是出国留学。我想去一所好大学。我得先把英语提上来。我现在每天在学。我觉得两年内能做到。", why: "目标、条件、时间点都交代了，逻辑清楚。但五句话全部是 I want / I need / I think 的并列，缺少具体信息。" },
        { band: 7, text: "One goal I've set myself is to study abroad, ideally within the next couple of years. It depends on getting my English up to scratch first, so I've been putting in an hour or so every day — slow progress, but it's progress.", zh: "我给自己的一个目标就是出国读书，最好这两年内。前提是先把英语补到位，所以我每天投入一小时左右——进展慢，但确实在走。", why: "set myself / ideally / up to scratch / putting in an hour 都是自然说法；结尾的自我调侃让人听得出这是真实状态，不是背稿。" },
        { band: 8, text: "The goal I keep coming back to is studying abroad, though I've learned to be flexible about the timeline. The obvious obstacle is the language, so I've been chipping away at it daily — an hour here, an hour there. It's slow, but I'd rather get there properly prepared than arrive early and struggle.", zh: "我反复回到的那个目标是出国留学，不过我已经学会不在时间上较劲了。最明显的障碍是语言，所以我每天都在一点点啃，今天一小时明天一小时。进度是慢，但我宁愿准备充分再到那儿，也不想早早去了却跟不上。", why: "keep coming back to、chipping away at、an hour here, an hour there 地道且带节奏；最后一句用 rather…than 表达取舍，把“目标”写成了有判断力的选择，而不只是愿望。" }
      ]
    }
  ],

  /* ==================== Part 3 · 按问题类型 ==================== */
  part3: [
    {
      id: "reason", label: "原因类", match: "\\bmain reason\\b|\\bwhy do\\b|\\bwhat causes\\b|\\breason for\\b",
      q: "What do you think is the main reason for this?", qzh: "你认为造成这个现象最主要的原因是什么？",
      tiers: [
        { band: 6, text: "I think the main reason is money. Many people do not have enough money, so they cannot do it. Also, some people do not have time.", zh: "我觉得主要原因是钱。很多人钱不够，所以做不了。另外，有些人没时间。", why: "给出了一个明确原因并附带一条补充，方向没错。但推理停在表层，句式是 because / so / also 的直线串联。" },
        { band: 7, text: "I'd say it comes down to money, more than anything — for a lot of people it simply isn't affordable. Time is part of it too, though I'd argue that's more of a consequence than a cause.", zh: "我觉得说到底还是钱的问题，对很多人来说就是负担不起。时间也算一部分原因，但我认为那更像是结果而不是原因。", why: "comes down to / more than anything / isn't affordable 表述更精准；主动区分“原因”与“结果”，显示出对因果关系的分辨力。" },
        { band: 8, text: "I suspect it's less about any single cause and more about a combination of pressures — cost, certainly, but also the fact that people's priorities have quietly shifted over the last decade or so. If I had to isolate one, I'd point to affordability, since that's the constraint everyone runs up against regardless of their background.", zh: "我怀疑很难归结为单一原因，更多是几种压力叠加的结果：成本肯定算一个，但还有一点是人们在这个十来年里优先级悄然变了。如果一定要挑一个，我会指向可负担性，因为不管什么背景的人都绕不开这条约束。", why: "less about…and more about… / isolate one / runs up against / regardless of their background 都是高分表达；先承认多因，再在限定条件下给出主因，这正是评分标准里“能展开论证”的表现。" }
      ]
    },
    {
      id: "change", label: "变化类", match: "\\bchanged\\b|\\bcompared to the past\\b|\\bover the past\\b|\\bthese days\\b",
      q: "How has this changed compared to the past?", qzh: "和过去相比，这件事发生了怎样的变化？",
      tiers: [
        { band: 6, text: "It has changed a lot. Before, people did not do this very much. Now it is very common. I think technology is the reason.", zh: "变化很大。以前人们不太这么做。现在非常普遍。我觉得原因是科技。", why: "有 before / now 的时间对比，也附带了原因，完成度是够的。但语言停留在最基础的层面，very 出现了两次。" },
        { band: 7, text: "It's changed quite dramatically, actually. What used to be fairly rare has become completely normal, and I'd put most of that down to technology making it so much easier.", zh: "其实变化相当大。过去挺少见的事现在变得再正常不过，我主要把原因归于科技让它容易了太多。", why: "quite dramatically / what used to be fairly rare / put it down to 让对比更立体，也把原因讲得比“科技”两个字更具体。" },
        { band: 8, text: "The shift has been pretty dramatic, though I'd say it happened gradually rather than overnight. What used to be an exception has quietly become the default, largely because technology removed just about every barrier that used to stand in the way.", zh: "变化确实很大，不过我觉得它是渐变而非一夜之间发生的。原本属于例外的事，如今悄悄成了默认选项，主要是因为科技几乎清除了过去挡在路上的每一道障碍。", why: "gradually rather than overnight 主动修正“剧变”这种简化说法，体现对程度的分辨；removed every barrier that used to stand in the way 用具体机制代替笼统归因。" }
      ]
    },
    {
      id: "compare", label: "比较类", match: "\\bdifferences? between\\b|\\byoung people and\\b|\\bcompare\\b",
      q: "Are there any differences between young people and old people in this respect?", qzh: "在这方面年轻人和老年人有区别吗？",
      tiers: [
        { band: 6, text: "Yes, I think there are differences. Young people like new things and they learn fast. Old people are more traditional. But I think both of them can do it well.", zh: "有区别。年轻人喜欢新东西，学得快。老年人更传统。不过我觉得两者都能做得很好。", why: "对比了两个方面并给出平衡的结论，立场稳妥。但描述停留在 like / traditional 这类概括词，缺少例证。" },
        { band: 7, text: "To some extent, yes. Younger people tend to pick things up faster, partly because they've grown up with it, whereas older people are often more cautious — though that's a generalisation, of course.", zh: "某种程度上是的。年轻人往往上手更快，一部分原因是他们从小就接触，而年长的人通常更谨慎——当然这只是概括。", why: "To some extent / tend to / partly because / whereas 让差异有了层次；结尾主动承认这是概括，是 7 分档应有的分寸感。" },
        { band: 8, text: "There's a difference, though I'd be wary of framing it as young versus old — it's more about exposure than age. Someone in their sixties who's been using this for years is far more comfortable with it than a teenager who hasn't. So the generational gap is really a gap in familiarity, and that's narrowing all the time.", zh: "确实有差异，不过我不太愿意把它说成年轻对年长，这更多关乎接触程度而不是年龄。一个用了很多年的六十多岁的人，比一个从没用过的青少年要适应得多。所以所谓代沟其实是熟悉度的差距，而这个差距一直在缩小。", why: "wary of framing it as… / it's more about exposure than age 主动挑战题目的预设，是 8 分档讨论类回答的标志性动作；最后用 familiarity / narrowing 收束，逻辑闭环。" }
      ]
    },
    {
      id: "adv", label: "利弊类", match: "\\badvantages?\\b|\\bdisadvantages?\\b|\\bpros and cons\\b|\\bdrawbacks?\\b",
      q: "What are the advantages and disadvantages of this?", qzh: "这件事有哪些优点和缺点？",
      tiers: [
        { band: 6, text: "I think there are good points and bad points. The good point is it is very convenient. The bad point is it can be expensive. So I think we should be careful.", zh: "我觉得有利也有弊。好处是很方便。坏处是可能很贵。所以我觉得应该谨慎。", why: "利弊各给一条并加了立场收尾，结构完整。但每个论点只有一句话，没有得到展开，两头都很薄。" },
        { band: 7, text: "On the plus side it's remarkably convenient, and it saves a fair amount of time. The downside is the cost — for some people it's simply out of reach, which is where the real problem lies.", zh: "好的一面是它非常方便，省下不少时间。不好的一面是成本，对有些人来说根本够不着，真正的问题就在这里。", why: "On the plus side / saves a fair amount of time / out of reach 让利弊更有质感；结尾把“贵”升级为“公平性”问题，指向更深一层。" },
        { band: 8, text: "The obvious upside is convenience — it does away with a lot of the friction people used to put up with. The trade-off, though, is that it tends to benefit those who are already better off, so unless something is done about access, you end up widening the very gap you set out to close.", zh: "最明显的好处是方便，它省掉了人们过去不得不忍受的很多麻烦。但代价是它往往让本来条件更好的人更受益，所以如果不解决可及性的问题，最后反而会把原本想弥合的差距拉得更大。", why: "does away with friction 与 trade-off 把讨论拉到机制层面；结尾 widening the very gap you set out to close 形成因果回环，是抽象论证能力的直接体现。" }
      ]
    },
    {
      id: "role", label: "政策与角色类", match: "\\bgovernments?\\b|\\bshould .* spend\\b|\\bthe state\\b|\\bpublic money\\b",
      q: "Do you think governments should spend more money on this?", qzh: "你认为政府应该在这方面投入更多资金吗？",
      tiers: [
        { band: 6, text: "Yes, I think the government should spend more money on it. Because it is important for everyone. But they should also spend money on other things like health.", zh: "应该。因为它对每个人都重要。不过他们也应该把钱花在其他事情上，比如医疗。", why: "立场明确、给出理由，并补充了平衡观点，这是 6 分档里做得比较完整的版本。但结构仍是 Because / But 的直线串联。" },
        { band: 7, text: "Yes, up to a point. It's important enough to deserve public money, but I'd want to see some evidence that the spending actually delivers — otherwise you're just throwing money at the problem.", zh: "某种程度上是的。它重要到值得公共投入，但我希望看到这笔钱确实见效的证据，否则就只是在往问题上砸钱。", why: "up to a point 是典型的 7 分档立场限定语，避免了非黑即白；throwing money at the problem 是自然习语，态度明确但不过激。" },
        { band: 8, text: "I'd say yes, though with a caveat — what matters is less how much is spent than whether it's targeted properly. Public money is finite, so the real question isn't 'more or less' but which interventions actually move the needle and which are just politically convenient.", zh: "我认为应该，但有个前提：关键不在于花多少，而在于是否用对了地方。公共资金是有限的，所以真正的问题不是多花还是少花，而是哪些举措确实起作用，哪些只是为了政治上好交代。", why: "with a caveat / what matters is less A than B / move the needle / politically convenient —— 重新界定了问题本身，并引入“资源有限”这一现实约束，是政策类回答拿高分的核心动作。" }
      ]
    },
    {
      id: "future", label: "观点与预测类", match: "\\bwill .* change\\b|\\bin the future\\b|\\bdo you agree\\b|\\bnext (few|decade)\\b",
      q: "Do you think this will change in the future?", qzh: "你觉得这件事未来会改变吗？",
      tiers: [
        { band: 6, text: "Yes, I think it will change. Technology is getting better every year. Maybe in ten years it will be very different. But I am not sure.", zh: "会变。科技每年都在进步。也许十年后会完全不一样。但我不确定。", why: "给出了预测和理由，并诚实表达不确定，这是很自然的处理方式。但句式单一，用词都是最基础的那一批。" },
        { band: 7, text: "I'd expect so, though probably gradually rather than all at once. Technology is moving quickly, so I wouldn't be surprised if it looks completely different within a decade or so.", zh: "我预计会变，不过应该是渐进而非突然发生。科技发展很快，所以十年左右之后它变得完全不一样，我也不会意外。", why: "I'd expect so / gradually rather than all at once / within a decade or so 给预测加上了时间与方式的限定，可信度明显提升。" },
        { band: 8, text: "Almost certainly, and I'd guess the change will be gradual rather than dramatic — that's usually how these things go. The pace tends to be set less by the technology itself than by how quickly people's habits catch up, and habits are notoriously slow to shift.", zh: "几乎肯定会。我猜这种变化是渐进的，而不是戏剧性的——这类事情通常如此。节奏往往不是由技术本身决定，而是取决于人们的习惯跟得多快，而习惯是出了名地难改。", why: "that's usually how these things go 带出经验式判断的语气；把驱动力从技术转到习惯，并用 notoriously slow to shift 收尾，是对抽象问题作出机制性预测的写法。" }
      ]
    }
  ],

  /* ==================== 高频功能表达块 ==================== */
  chunks: [
    {
      group: "表达观点", hint: "别每次都说 I think。7 分以上更常用带分寸感的说法。",
      items: [
        { en: "I'd say…", zh: "我倾向于认为……", band: 7 },
        { en: "As far as I'm concerned, …", zh: "就我而言……", band: 7 },
        { en: "My own view is that…", zh: "我个人的看法是……", band: 8 },
        { en: "I'd argue that…", zh: "我认为（并愿意为之论证）……", band: 8 }
      ]
    },
    {
      group: "限定立场", hint: "给观点加边界，是 7 分往上最划算的一个动作。",
      items: [
        { en: "up to a point", zh: "在某种程度上（但不能一概而论）", band: 7 },
        { en: "to some extent", zh: "某种程度上", band: 7 },
        { en: "by and large", zh: "总体而言", band: 8 },
        { en: "more often than not", zh: "多半情况下", band: 8 }
      ]
    },
    {
      group: "对比与让步", hint: "先说一面，再承认另一面，论证立刻立体起来。",
      items: [
        { en: "That said, …", zh: "话虽如此……", band: 7 },
        { en: "whereas", zh: "而（表对比）", band: 7 },
        { en: "Having said that, …", zh: "尽管如此……", band: 8 },
        { en: "Even so, …", zh: "即便如此……", band: 8 }
      ]
    },
    {
      group: "举例", hint: "Part 3 里一个具体例子，胜过三句空泛的概括。",
      items: [
        { en: "Take …, for instance.", zh: "就拿……来说。", band: 7 },
        { en: "A case in point is…", zh: "一个典型的例子是……", band: 8 },
        { en: "off the top of my head", zh: "随口想到的是（表示不是精确数据）", band: 8 }
      ]
    },
    {
      group: "原因与结果", hint: "把 because 换成更有指向性的说法。",
      items: [
        { en: "which is why…", zh: "这就是为什么……", band: 7 },
        { en: "it comes down to…", zh: "归根结底是……", band: 8 },
        { en: "It stems from…", zh: "它源于……", band: 8 }
      ]
    },
    {
      group: "争取时间", hint: "想不出词时，用一句自然的话顶上去，比 um 好得多。",
      items: [
        { en: "That's a good question.", zh: "这个问题问得好。", band: 6 },
        { en: "Let me think for a second.", zh: "让我想一下。", band: 6 },
        { en: "How shall I put it?", zh: "该怎么说呢？", band: 8 },
        { en: "I've never really thought about it, but…", zh: "我还真没仔细想过，不过……", band: 8 }
      ]
    },
    {
      group: "修正与接续", hint: "说错了不必慌，自然改口不扣分，停顿才扣分。",
      items: [
        { en: "or rather…", zh: "或者更准确地说……", band: 7 },
        { en: "what I mean is…", zh: "我的意思是……", band: 7 },
        { en: "…, if that makes sense.", zh: "……如果这样说能明白的话。", band: 7 }
      ]
    },
    {
      group: "收尾总结", hint: "每个长回答都用一句总结封口，连贯性会明显提升。",
      items: [
        { en: "All in all, …", zh: "总的来说……", band: 7 },
        { en: "On balance, …", zh: "权衡下来……", band: 8 },
        { en: "at the end of the day", zh: "说到底", band: 8 }
      ]
    }
  ]
};

/* 按当前问题挑选最匹配的分档示范；匹配不到就返回第一个 */
(function () {
  const B = window.IELTS_BANDS;

  function byQuestion(part, question) {
    const list = B["part" + part] || [];
    const q = String(question || "");
    const hit = list.find(x => x.match && new RegExp(x.match, "i").test(q));
    return hit || list[0] || null;
  }
  function byCategory(cat) {
    const list = B.part2 || [];
    return list.find(x => x.match && cat && String(cat).indexOf(x.match) >= 0) || list[0] || null;
  }
  function forTopic(part, topic, question) {
    if (part === 2) return byCategory(topic && topic.cat);
    return byQuestion(part, question);
  }

  B.byQuestion = byQuestion;
  B.byCategory = byCategory;
  B.forTopic = forTopic;
})();
