/* IELTS Mate 口语题库 · 2026 年 9–12 月保留题
   题面来源：公开流传的当季保留题（含用户提供的题库 PDF 中的题面清单）
   核心词汇与参考表达：本项目自行撰写，未采用任何第三方示范答案文本
   数据结构：[英文, 中文]，便于渲染与朗读 */

window.IELTS_TOPICS = {
  meta: {
    version: "2026年9-12月保留题",
    updated: "2026-10-08",
    counts: { part1Topics: 15, part1Questions: 63, part2Cards: 14, part3Questions: 15 }
  },

  part1: [
    { id:"p1-01", zh:"唱歌", en:"Singing", cat:"兴趣娱乐", level:"基础", scene:"日常交流",
      qs:[
        "Did you sing when you were a child?",
        "How well did you sing?",
        "Do you like singing?",
        "Did you take music lessons?",
        "Will you sing in the car?"],
      vocab:[["choir","合唱团"],["melody","旋律"],["go flat","（唱歌）跑调"],["sing along","跟着唱"],["self-conscious","放不开的、拘谨的"],["sheet music","乐谱"],["in tune","音准正确"],["karaoke","卡拉OK"],["lyrics","歌词"],["tone-deaf","五音不全的"]],
      exprs:[
        ["I'm a shower singer — my best performances happen where nobody can hear them.","我是浴室歌手，最好的表演都发生在没人听得见的地方。"],
        ["Whenever a song I love comes on, I can't help humming along, even in public.","每次放到我喜欢的歌，我都会忍不住跟着哼，哪怕在公共场合。"],
        ["I'd call myself enthusiastic rather than talented — I'm usually slightly off-key.","我更愿意说自己热情有余、天赋不足，一般都稍微跑调。"],
        ["Karaoke nights with friends are the only time I sing in front of other people.","和朋友唱K是唯一我敢在别人面前开口的场合。"]] },

    { id:"p1-02", zh:"整洁", en:"Tidiness", cat:"生活日常", level:"基础", scene:"日常交流",
      qs:[
        "Were you a tidy person as a child?",
        "Are you a tidy person now?",
        "Do you think people should be tidy?",
        "How do you keep your room tidy?"],
      vocab:[["tidy","整洁的"],["keep things in order","保持整齐"],["a mess","一团乱"],["clutter","杂物堆积"],["declutter","断舍离、清理杂物"],["spotless","一尘不染的"],["a place for everything","物有其位"],["hoarder","囤积癖的人"],["tidy up","收拾整理"],["housekeeping","家务打理"]],
      exprs:[
        ["I'm tidy in shared spaces but let things slide in my own room.","在公共空间我很整洁，自己房间里就放任了。"],
        ["I always feel calmer when my desk is clear.","桌子一空，我心里就踏实。"],
        ["My mum is the organised one at home — nothing escapes her.","家里有条理的是我妈，什么都逃不过她的眼睛。"],
        ["I tidy up before guests arrive; otherwise I can live with a bit of mess.","有客人来之前我会收拾，平时一点乱我无所谓。"]] },

    { id:"p1-03", zh:"科学", en:"Science", cat:"学习工作", level:"进阶", scene:"学术课程",
      qs:[
        "Do you like science?",
        "What science subject do you like most?",
        "Did you learn science at school?",
        "Is science important to you?"],
      vocab:[["curiosity","好奇心"],["experiment","实验"],["theory","理论"],["evidence","证据"],["hypothesis","假设"],["observation","观察"],["break down","分解、拆解"],["apply","应用"],["discovery","发现"],["make sense of","想明白"]],
      exprs:[
        ["Science appeals to me because it explains things we normally take for granted.","科学吸引我，是因为它解释了我们习以为常的事。"],
        ["Biology was my favourite — how the human body works still amazes me.","我最喜欢生物，人体的运作方式至今让我惊叹。"],
        ["I follow science videos online, though I skip the maths-heavy parts.","我会看网上的科普视频，但跳过数学多的部分。"],
        ["I'd rather understand a topic than memorise it, which is why experiments work for me.","我更愿意理解而不是背下来，所以实验对我很有用。"]] },

    { id:"p1-04", zh:"手表", en:"Watch", cat:"生活物品", level:"基础", scene:"日常交流",
      qs:[
        "Do you wear a watch?",
        "What kind of watch do you like?",
        "Do people around you wear watches?",
        "Have you ever received a watch as a gift?"],
      vocab:[["smartwatch","智能手表"],["mechanical watch","机械表"],["strap","表带"],["step counter","计步功能"],["water-resistant","防水的"],["accessory","配饰"],["battery life","电池续航"],["tell the time","看时间"],["sentimental value","纪念意义"],["analogue","指针式的"]],
      exprs:[
        ["I mainly wear a smartwatch to track my steps and sleep, not to check the time.","我戴智能手表主要是记步数和睡眠，看时间反而是次要的。"],
        ["I keep a plain analogue watch for occasions when I want to look a bit smarter.","我留着一块朴素的指针表，需要显得正式些时戴。"],
        ["The one I wear most was a gift, so it means more to me than its price.","我戴得最多的那块是别人送的，意义大过价格。"],
        ["People my age treat watches as accessories rather than instruments.","我这个年纪的人把手表当配饰，而不是工具。"]] },

    { id:"p1-05", zh:"公园与花园", en:"Park and gardens", cat:"生活场所", level:"基础", scene:"日常交流",
      qs:[
        "Did you often go to parks as a child?",
        "Do you like parks?",
        "Should cities have more parks?"],
      vocab:[["green space","绿地"],["jog","慢跑"],["picnic","野餐"],["playground","游乐场"],["tranquil","宁静的"],["shade","树荫"],["landscape","景观"],["fresh air","新鲜空气"],["do exercise","锻炼"],["neighbourhood","社区"]],
      exprs:[
        ["I go there to jog, or just to clear my head.","我去那儿慢跑，或者单纯放空一下。"],
        ["The park near me is busiest in the early morning with people exercising.","我家附近的公园清晨最热闹，全是锻炼的人。"],
        ["I'd rather live somewhere with greenery around than in a brand-new block.","比起新楼盘，我更愿意住在周围有绿意的地方。"],
        ["Gardening is my grandparents' thing; I've never had the patience for it.","园艺是我祖父母的事，我从没那个耐心。"]] },

    { id:"p1-06", zh:"网站", en:"Websites", cat:"科技媒体", level:"基础", scene:"日常交流",
      qs:[
        "What websites do you often visit?",
        "Do you prefer to use apps or websites?",
        "Have you ever made a website?",
        "Do you think websites are useful?"],
      vocab:[["browse","浏览"],["feed","信息流"],["bookmark","收藏夹"],["user-friendly","易用的"],["algorithm","算法"],["paywall","付费墙"],["subscription","订阅"],["log in","登录"],["time sink","时间黑洞"],["pop-up","弹窗"]],
      exprs:[
        ["I use a video site for lectures and documentaries, though I often drift off-topic.","我用视频网站看讲座和纪录片，不过经常不知不觉就跑偏。"],
        ["A dictionary site is the one page I open several times a day.","有个词典网站是我每天要开好几次的页面。"],
        ["I've muted the notifications because the pop-ups kept pulling me back.","我把通知关了，因为弹窗总把我拉回去。"],
        ["I'd rather read one solid article than scroll through a feed.","比起刷信息流，我更愿意读一篇扎实的文章。"]] },

    { id:"p1-07", zh:"太空", en:"The space", cat:"科技媒体", level:"进阶", scene:"学术课程",
      qs:[
        "Are you interested in space?",
        "Would you like to travel to space?",
        "Do you think space travel is worth the money?",
        "Have you ever watched a rocket launch?"],
      vocab:[["mission","（航天）任务"],["orbit","轨道"],["astronaut","宇航员"],["launch","发射"],["telescope","望远镜"],["galaxy","星系"],["space station","空间站"],["exploration","探索"],["zero gravity","失重"],["funding","经费"]],
      exprs:[
        ["I'd rather look at photos others bring back than go up there myself.","我宁愿看别人带回来的照片，也不想自己上去。"],
        ["Space missions are worth funding because the technology reaches daily life.","航天值得投入，因为技术最终会进入日常生活。"],
        ["I follow launches online, mostly for the pictures rather than the numbers.","我会在网上看发射，主要看图，不看参数。"],
        ["Thinking about the size of the universe makes our problems feel small.","想到宇宙之大，就觉得我们的烦恼很小。"]] },

    { id:"p1-08", zh:"音乐", en:"Music", cat:"兴趣娱乐", level:"基础", scene:"日常交流",
      qs:[
        "What kind of music do you like?",
        "When do you listen to music?",
        "Have you ever learned to play an instrument?",
        "Did you learn music at school?",
        "Do you prefer live music or recorded music?",
        "Will you go to a concert in the future?"],
      vocab:[["genre","音乐类型"],["playlist","播放列表"],["live concert","现场演出"],["soundtrack","配乐"],["upbeat","明快有活力的"],["mellow","舒缓的"],["instrument","乐器"],["busking","街头表演"],["atmosphere","氛围"],["background music","背景音乐"]],
      exprs:[
        ["My playlist changes with what I'm doing — upbeat for running, mellow for studying.","歌单跟着我在做什么变：跑步听明快的，学习听舒缓的。"],
        ["Music lessons at school were compulsory until about fourteen, and nobody took them seriously.","学校里音乐课到十四岁前都是必修，没人当真。"],
        ["I've never learned an instrument properly, which I slightly regret.","我从没正经学过一门乐器，有点遗憾。"],
        ["A live concert hits differently, even when the sound is worse than a recording.","现场演出感觉完全不同，哪怕音效还不如录音。"]] },

    { id:"p1-09", zh:"老师", en:"Teachers", cat:"学习工作", level:"基础", scene:"学术课程",
      qs:[
        "Do you have a favourite teacher?",
        "What makes a good teacher?",
        "Do you still keep in touch with any of your teachers?",
        "Would you like to be a teacher?"],
      vocab:[["inspire","激励、启发"],["patience","耐心"],["role model","榜样"],["approachable","平易近人的"],["strict","严格的"],["encourage","鼓励"],["feedback","反馈"],["explain clearly","讲得清楚"],["mentor","导师"],["fair","公平的"]],
      exprs:[
        ["My favourite teacher asked what we thought instead of testing what we'd memorised.","我最喜欢的老师会问我们的看法，而不是检查我们背没背下来。"],
        ["Good teachers can explain the same idea in three different ways.","好老师能把同一个概念用三种方式讲明白。"],
        ["I still remember the teachers who noticed small things about us.","我至今记得那些留意到我们小事的老师。"],
        ["A strict teacher can be a good one, as long as they're fair.","严格的老师也可以是好老师，只要公平。"]] },

    { id:"p1-10", zh:"社交媒体", en:"Social media", cat:"科技媒体", level:"进阶", scene:"社会议题",
      qs:[
        "Do you use social media?",
        "When did you start using social media?",
        "How much time do you spend on social media?",
        "Do you think social media is good for you?"],
      vocab:[["newsfeed","动态流"],["scroll","刷手机"],["follower","粉丝"],["post","发帖"],["screen time","屏幕使用时间"],["comparison","攀比"],["misinformation","虚假信息"],["unfollow","取关"],["privacy settings","隐私设置"],["doomscrolling","无目的刷坏消息"]],
      exprs:[
        ["I joined at about fifteen, and my first habit was comparing myself with others.","我十五岁左右开始用，最初的习惯就是拿自己和别人比。"],
        ["I've turned off notifications to cut down my screen time.","我关了通知，为了减少屏幕时间。"],
        ["The upside is staying in touch; the downside is losing an hour without noticing.","好处是保持联系，坏处是不知不觉少了一小时。"],
        ["I keep my accounts private and think twice before posting.","我的账号设成私密，发之前会想两遍。"]] },

    { id:"p1-11", zh:"耳机", en:"Headphone", cat:"生活物品", level:"基础", scene:"日常交流",
      qs:[
        "Do you use headphones?",
        "When do you use headphones?",
        "What kind of headphones do you prefer?",
        "Are there times when you shouldn't wear headphones?"],
      vocab:[["earphones","入耳式耳机"],["noise cancelling","降噪"],["volume","音量"],["charging case","充电盒"],["wired","有线的"],["wireless","无线的"],["drown out","盖过（噪音）"],["leak sound","漏音"],["commute","通勤"],["hearing damage","听力损伤"]],
      exprs:[
        ["I wear them on the metro mainly to block out the noise.","我在地铁上戴耳机主要是为了隔掉噪音。"],
        ["I take them off when I need to be aware of traffic or talk to someone.","需要留意路况或者跟人说话时我会摘下来。"],
        ["Noise-cancelling ones completely changed my commute.","降噪耳机彻底改变了我的通勤体验。"],
        ["I keep the volume moderate — hearing damage isn't worth it.","我把音量控制在中等，听力损伤不划算。"]] },

    { id:"p1-12", zh:"讲笑话", en:"Telling Jokes", cat:"兴趣娱乐", level:"进阶", scene:"社交场合",
      qs:[
        "Do you like telling jokes?",
        "Do you know any funny jokes?",
        "Do you laugh at jokes about yourself?",
        "Who tells the best jokes among your friends?",
        "Is it important to have a sense of humour?"],
      vocab:[["punchline","笑点、包袱"],["sense of humour","幽默感"],["self-deprecating","自嘲的"],["timing","节奏把握"],["awkward","尴尬的"],["banter","你来我往的打趣"],["take a joke","开得起玩笑"],["misinterpret","误解"],["laugh it off","一笑而过"],["tease","调侃"]],
      exprs:[
        ["I'm better at laughing at jokes than telling them.","比起讲笑话，我更擅长被逗笑。"],
        ["It depends on who's joking and why — with close friends I don't mind at all.","这要看是谁开、出于什么目的；好朋友之间我完全不介意。"],
        ["A joke only lands when the timing is right.","笑话只有在节奏对的时候才成立。"],
        ["If it's about something I genuinely care about, it stops being funny fast.","如果戳的是我真正在意的事，很快就不好笑了。"]] },

    { id:"p1-13", zh:"汽车", en:"Cars", cat:"生活物品", level:"进阶", scene:"社会议题",
      qs:[
        "Do you like cars?",
        "Can you drive?",
        "Would you like to buy a car?",
        "Do you prefer driving or taking public transport?"],
      vocab:[["driving licence","驾照"],["traffic jam","堵车"],["public transport","公共交通"],["fuel","燃油"],["electric vehicle","电动车"],["road trip","自驾游"],["parking space","停车位"],["commute","通勤"],["car ownership","拥有汽车"],["back seat","后座"]],
      exprs:[
        ["Long drives to my grandparents' house were a family ritual.","开车长途去祖父母家是我们家的固定节目。"],
        ["During rush hour I'd take the metro over driving any day.","高峰期我宁可坐地铁，绝不自己开车。"],
        ["My parents still tease me about asking 'are we there yet' the whole way.","我爸妈至今还笑我一路都在问到了没有。"],
        ["I'm curious about electric cars, but the charging network puts me off.","我对电动车挺好奇，但充电网络让我犹豫。"]] },

    { id:"p1-14", zh:"衣服", en:"Clothes", cat:"生活物品", level:"基础", scene:"日常交流",
      qs:[
        "What kind of clothes do you like to wear?",
        "Do you buy clothes online?",
        "Are you interested in fashion?",
        "Do colours matter to you when choosing clothes?"],
      vocab:[["outfit","整套搭配"],["fabric","面料"],["fit","合身程度"],["casual","休闲的"],["formal","正式的"],["second-hand","二手的"],["go with","搭配得上"],["wardrobe","衣柜"],["in fashion","流行"],["dress code","着装要求"]],
      exprs:[
        ["Bright fluorescent colours don't suit me; I stick to navy and grey.","荧光色不适合我，我基本只穿藏蓝和灰色。"],
        ["I'd rather spend more on one jacket than on five cheap tops.","我宁愿花多的钱买一件外套，而不是五件便宜上衣。"],
        ["Comfort matters more to me than following trends.","比起追流行，我更在意舒服。"],
        ["I've started buying second-hand, mostly out of curiosity.","我开始买二手衣服，多半是出于好奇。"]] },

    { id:"p1-15", zh:"购物", en:"Shopping", cat:"生活日常", level:"基础", scene:"日常交流",
      qs:[
        "Do you like shopping?",
        "Do you prefer shopping online or in shops?",
        "How often do you go shopping?",
        "Do you ever buy things you don't need?"],
      vocab:[["browse","逛、随便看看"],["impulse buy","冲动消费"],["discount","折扣"],["receipt","小票"],["refund","退款"],["window shopping","只看不买"],["delivery","快递"],["budget","预算"],["shop assistant","店员"],["add up","（花销）累加起来"]],
      exprs:[
        ["I do most of my shopping online and go to shops only for something specific.","我大多数东西网购，只有买特定物品才去店里。"],
        ["I keep a rough budget, otherwise small purchases add up.","我会定个大概预算，不然小钱会累起来。"],
        ["Sales tempt me, but I ask whether I'd buy it at full price.","打折会让我心动，但我会问自己原价还买不买。"],
        ["Reading reviews before buying saves me a lot of returns.","买前看评价帮我省了很多退货麻烦。"]] }
  ],

  part2: [
    { id:"p2-01", zh:"无聊的地方", cat:"地点", level:"进阶", scene:"社会议题",
      cue:"Describe a boring place you have been to",
      bullets:["Where it is","When you went there","Who you went with","And explain why you felt it was boring"],
      vocab:[["dull","乏味的"],["nothing to do","无事可做"],["drag on","拖沓难熬"],["predictable","可预见的"],["let down","让人失望"],["resort","度假地"],["overrated","名不副实"],["kill time","消磨时间"],["wander around","闲逛"],["a waste of time","浪费时间"]],
      exprs:[
        ["There was one main street, and we'd walked it twice by the third day.","只有一条主街，到第三天我们已经来回走了两遍。"],
        ["It wasn't awful, but I have no wish to go back.","倒不至于很糟，但我完全不想再去。"],
        ["The photos online made it look far livelier than it actually was.","网上的照片把它拍得比实际热闹得多。"],
        ["What made it worse was that everything shut before nine.","更糟的是所有店九点前就关门了。"]],
      part3:[
        ["On what occasions do people feel bored?","人们在什么场合会感到无聊？"],
        ["Why do students find some lessons boring?","为什么学生觉得有些课很无聊？"],
        ["How can people avoid feeling bored?","人们怎么避免感到无聊？"]] },

    { id:"p2-02", zh:"高建筑", cat:"地点", level:"进阶", scene:"社会议题",
      cue:"A high-rise building you like or dislike",
      bullets:["Where it is","What it looks like","What it is used for","And explain why you like or dislike it"],
      vocab:[["skyscraper","摩天大楼"],["skyline","天际线"],["landmark","地标"],["glass façade","玻璃幕墙"],["maintenance","维护"],["energy-efficient","节能的"],["architecture","建筑风格"],["cramped","逼仄拥挤的"],["iconic","标志性的"],["office block","写字楼"]],
      exprs:[
        ["What strikes me first is how it catches the light at sunset.","最先吸引我的是它日落时映光的样子。"],
        ["I like the design, but I wouldn't want to live halfway up it.","我喜欢这个设计，但不想住在半空中。"],
        ["It's become a landmark — you can spot it from anywhere in the city.","它已经成了地标，城里哪儿都能看到。"],
        ["Maintaining a building that tall must cost a fortune.","养这么高一栋楼一定很烧钱。"]],
      part3:[
        ["Why do cities build tall buildings?","为什么城市要建高层建筑？"],
        ["What problems can high-rise living cause?","住在高层可能带来什么问题？"],
        ["Should old buildings be protected from redevelopment?","老建筑该不该被保护、免于改造？"]] },

    { id:"p2-03", zh:"本地新闻", cat:"事件经历", level:"进阶", scene:"社会议题",
      cue:"Local news you have heard or seen",
      bullets:["What it was","When you heard or saw it","Where you heard or saw it","And explain how you felt about it"],
      vocab:[["coverage","报道"],["source","消息来源"],["sensational","耸动夸张的"],["go viral","病毒式传播"],["factual","有事实依据的"],["local council","地方议会/政府"],["rumour","谣言"],["follow-up","后续报道"],["headline","新闻标题"],["spread","扩散"]],
      exprs:[
        ["I came across it on a local news account I follow.","我是在关注的一个本地资讯号上看到的。"],
        ["National news travels faster, but local news touches my daily life more.","全国新闻传得快，但本地新闻更影响我的日常。"],
        ["I check whether a story appears in more than one source before believing it.","我会先看是不是多个来源都有，再决定信不信。"],
        ["It's the kind of thing you'd never hear about outside the district.","这种事出了这个区根本听不到。"]],
      part3:[
        ["How do people get local news today?","现在人们怎么获取本地新闻？"],
        ["Is local news still important?","本地新闻还重要吗？"],
        ["Why is false information easy to spread?","为什么假消息容易传播？"]] },

    { id:"p2-04", zh:"医疗行业从业者", cat:"人物", level:"进阶", scene:"职场社会",
      cue:"Describe a person you know who works in the medical field",
      bullets:["Who this person is","How you know them","What their work involves","And explain why you admire them"],
      vocab:[["nurse","护士"],["shift work","倒班工作"],["workload","工作量"],["empathy","共情能力"],["dedication","敬业精神"],["patient care","病患护理"],["burnout","职业倦怠"],["emergency","急诊"],["underpaid","报酬偏低的"],["stays calm","保持镇定"]],
      exprs:[
        ["She works twelve-hour shifts and still asks how everyone else is doing.","她上十二小时的班，还惦记着别人过得怎么样。"],
        ["What impresses me is how calm she stays when things go wrong.","最让我佩服的是出事时她的镇定。"],
        ["The job is far more demanding than people outside it realise.","这份工作的辛苦远超圈外人的想象。"],
        ["She chose it because she wanted work that actually mattered.","她选这行是因为想做真正有意义的工作。"]],
      part3:[
        ["Why do some people choose medical careers?","为什么有人选择从医？"],
        ["Should healthcare workers be paid more?","医护人员该不该拿更高薪水？"],
        ["How can people in demanding jobs avoid burnout?","高强度职业的人怎么避免倦怠？"]] },

    { id:"p2-05", zh:"商业人物", cat:"人物", level:"进阶", scene:"职场社会",
      cue:"Describe a business person you admire",
      bullets:["Who this person is","How you know about them","What they have achieved","And explain why you admire them"],
      vocab:[["entrepreneur","创业者"],["start-up","初创公司"],["risk-taking","敢于冒险"],["vision","远见"],["reputation","声誉"],["scale up","把生意做大"],["philanthropic","热心公益的"],["hands-on","亲力亲为的"],["market gap","市场空白"],["humble beginnings","出身微末"]],
      exprs:[
        ["What I admire is that he started with almost nothing.","我佩服的是他几乎白手起家。"],
        ["She spotted a gap in the market nobody else had noticed.","她发现了别人没注意到的市场空白。"],
        ["He stayed hands-on even after the company grew large.","公司做大之后他依然亲力亲为。"],
        ["Not every decision worked out, but he owned the failures.","并非每个决定都对，但他敢认账。"]],
      part3:[
        ["What makes a successful business person?","成功的商业人士具备什么特质？"],
        ["Should companies do more for society?","企业是否该承担更多社会责任？"],
        ["Is it harder to start a business today than in the past?","现在创业比过去更难吗？"]] },

    { id:"p2-06", zh:"特殊场合的食物", cat:"物品事物", level:"基础", scene:"日常生活",
      cue:"Describe a special meal or food you eat on a particular occasion",
      bullets:["What the food is","When you eat it","Who you eat it with","And explain why it is special"],
      vocab:[["festive","节日气氛的"],["family recipe","家传食谱"],["bring people together","把大家聚在一起"],["traditional dish","传统菜"],["home-made","家里做的"],["symbolise","象征"],["portion","份量"],["toast","敬酒"],["reunion","团聚"],["pass down","传承下来"]],
      exprs:[
        ["It's the one dish we only make once a year, which is part of why it matters.","这道菜一年只做一次，这也是它特别的原因之一。"],
        ["The cooking is a family effort — everyone gets a job.","做饭是全家的事，人人都有分工。"],
        ["What I remember isn't the taste so much as the noise around the table.","我记住的不是味道，而是桌边的热闹。"],
        ["The recipe has been passed down, though everyone argues about the amounts.","食谱是传下来的，只是每个人对份量都有意见。"]],
      part3:[
        ["Why is food important at celebrations?","为什么食物在庆典中很重要？"],
        ["Have eating habits changed in your country?","你国家的饮食习惯变了吗？"],
        ["Do people eat out more than they used to?","现在的人比过去更常在外面吃吗？"]] },

    { id:"p2-07", zh:"观看体育比赛", cat:"事件经历", level:"基础", scene:"日常生活",
      cue:"Describe an experience of watching a sports event",
      bullets:["What the event was","When and where you watched it","Who you watched it with","And explain how you felt about it"],
      vocab:[["atmosphere","现场氛围"],["stadium","体育场"],["fan","球迷"],["underdog","不被看好的队"],["cheer","欢呼"],["half-time","中场休息"],["live broadcast","直播"],["season ticket","赛季套票"],["rivalry","对抗、宿敌"],["nail-biting","紧张到咬指甲的"]],
      exprs:[
        ["The noise when we scored is something a screen can't reproduce.","进球那一刻的声浪，屏幕永远复制不出来。"],
        ["I'm not a huge fan, but the atmosphere carried me along.","我不算铁杆球迷，但氛围把我带进去了。"],
        ["The ticket cost more than I'd planned, though I'd do it again.","票价超出预算，但我还会再来。"],
        ["Watching live means missing the replays but feeling everything.","看现场就看不到回放，但每一下都感受到了。"]],
      part3:[
        ["Why do people enjoy watching sports?","人们为什么爱看体育比赛？"],
        ["Should governments spend money on sports facilities?","政府该不该投钱建体育设施？"],
        ["Are professional athletes paid too much?","职业运动员收入是否过高？"]] },

    { id:"p2-08", zh:"改变决定", cat:"事件经历", level:"进阶", scene:"日常生活",
      cue:"Describe a time when you changed a decision",
      bullets:["What the decision was","Why you changed it","Who or what influenced you","And explain how you felt afterwards"],
      vocab:[["change of heart","改变主意"],["rethink","重新考虑"],["second thoughts","开始犹豫"],["circumstance","情况、境况"],["regret","后悔"],["instinct","直觉"],["weigh up","权衡"],["back out","退出"],["gut feeling","直觉判断"],["outcome","结果"]],
      exprs:[
        ["I'd already said yes, then realised I was doing it for the wrong reason.","我已经答应了，后来发现自己的理由不对。"],
        ["Looking back, changing my mind was the best part of the whole thing.","回头看，改主意反而是整件事里最对的。"],
        ["It was awkward to admit I'd been wrong, but it was worth it.","承认自己错了挺尴尬，但值得。"],
        ["I've learned to give big decisions a night's sleep.","我学会了大决定先睡一觉再说。"]],
      part3:[
        ["Why do people change their minds?","人为什么会改变主意？"],
        ["Should important decisions be made quickly?","重要决定该不该快速做出？"],
        ["How do people deal with regret?","人们怎么处理后悔的情绪？"]] },

    { id:"p2-09", zh:"长期目标", cat:"志向规划", level:"进阶", scene:"职场社会",
      cue:"Describe an ambition you have had for a long time",
      bullets:["What the ambition is","When you first had it","What you have done towards it","And explain why it matters to you"],
      vocab:[["ambition","志向"],["long-term","长期的"],["milestone","里程碑"],["perseverance","坚持"],["setback","挫折"],["achievable","可实现的"],["self-discipline","自律"],["plan ahead","提前规划"],["motivation","动力"],["give up","放弃"]],
      exprs:[
        ["I've wanted it since I was about twelve, and it hasn't faded.","我十二岁左右就想做这件事，到现在也没淡。"],
        ["Progress has been slow, but each small milestone keeps me going.","进展很慢，但每个小节点都让我继续下去。"],
        ["There were months when I barely touched it, and that's fine.","有几个月我几乎没碰它，这也没关系。"],
        ["What matters to me is not giving up on it entirely.","对我重要的是别彻底放弃它。"]],
      part3:[
        ["Is it good to have long-term goals?","有长期目标是好事吗？"],
        ["How do people stay motivated?","人怎么保持动力？"],
        ["Do ambitions change as people get older?","志向会随年龄改变吗？"]] },

    { id:"p2-10", zh:"科技产品故障", cat:"物品事物", level:"进阶", scene:"日常生活",
      cue:"Describe a problem of technology you have encountered",
      bullets:["What the problem was","When it happened","What you did about it","And explain how you felt"],
      vocab:[["glitch","小故障"],["crash","崩溃"],["back up","备份"],["troubleshoot","排查故障"],["freeze","卡死"],["outage","断网、宕机"],["update","系统更新"],["data loss","数据丢失"],["customer support","客服"],["workaround","临时变通办法"]],
      exprs:[
        ["It froze at the worst possible moment — minutes before I had to submit.","它偏偏在交东西前几分钟卡死。"],
        ["What annoyed me wasn't the fault, it was the lack of support.","让我恼火的不是故障，是没人管。"],
        ["I now back things up in two places.","现在我会在两个地方备份。"],
        ["Restarting fixed the symptom but not the cause.","重启只解决了表象，没解决根因。"]],
      part3:[
        ["How dependent are we on technology?","我们对技术的依赖有多深？"],
        ["Should companies be responsible for technology failures?","企业该为技术故障负责吗？"],
        ["How will technology change in the next twenty years?","未来二十年技术会怎么变？"]] },

    { id:"p2-11", zh:"必须早起", cat:"事件经历", level:"基础", scene:"日常生活",
      cue:"Describe a time when you had to get up very early",
      bullets:["When it was","Why you had to get up early","What you did that day","And explain how you felt"],
      vocab:[["alarm clock","闹钟"],["oversleep","睡过头"],["rush hour","早高峰"],["groggy","昏昏沉沉的"],["early bird","早起的人"],["night owl","夜猫子"],["schedule","日程安排"],["sacrifice","牺牲"],["refresh","恢复精神"],["commute","通勤"]],
      exprs:[
        ["I set three alarms because I don't trust the first one.","我设了三个闹钟，因为信不过第一个。"],
        ["The odd thing is I felt better than on days I slept in.","奇怪的是那天反而比睡懒觉的日子精神。"],
        ["Getting up early is easy once you've done it a few days in a row.","连着早起几天之后就轻松了。"],
        ["I'm a night owl by nature, so early starts are a real effort.","我天生夜猫子，早起真的很费劲。"]],
      part3:[
        ["Why do some people get up early?","为什么有人会早起？"],
        ["Is getting up early good for health?","早起对健康有好处吗？"],
        ["Should school start times be later?","学校该不该推迟上课时间？"]] },

    { id:"p2-12", zh:"不想住的房子", cat:"地点", level:"进阶", scene:"日常生活",
      cue:"Describe a home you like to visit but would not want to live in",
      bullets:["Where it is","What it is like","How often you visit","And explain why you would not want to live there"],
      vocab:[["spacious","宽敞的"],["cosy","温馨舒适的"],["countryside","乡下"],["remote","偏远的"],["upkeep","日常维护"],["isolation","与世隔绝"],["heating bills","取暖费"],["clutter","杂乱堆积"],["charm","独特的韵味"],["convenience","便利性"]],
      exprs:[
        ["It's beautiful, but it's an hour from the nearest shop.","那儿很美，但离最近的商店要一小时。"],
        ["I love visiting; I just couldn't handle the upkeep.","我很爱去，但维护我真扛不住。"],
        ["The old house has real charm, but the winter bills must be painful.","老房子很有韵味，冬天账单肯定难受。"],
        ["I'd miss the convenience of living in the city.","我会想念城市生活的便利。"]],
      part3:[
        ["Why do people move from the countryside to cities?","人们为什么从乡下搬去城市？"],
        ["What makes a house feel like a home?","什么让一栋房子像个家？"],
        ["Will people live in smaller homes in the future?","未来人们会住在更小的房子里吗？"]] },

    { id:"p2-13", zh:"名人广告", cat:"物品事物", level:"进阶", scene:"社会议题",
      cue:"Describe an advertisement which is about a famous person",
      bullets:["What the advertisement was","Who the famous person was","Where you saw or heard it","And explain how you felt about it"],
      vocab:[["endorsement","代言"],["celebrity","名人"],["brand image","品牌形象"],["target audience","目标受众"],["slogan","广告语"],["influence","影响力"],["misleading","有误导性的"],["consumer","消费者"],["eye-catching","抓眼球的"],["credibility","可信度"]],
      exprs:[
        ["I remember the ad better than the product it was selling.","我对广告的印象比它卖的产品还深。"],
        ["A familiar face makes a brand feel trustworthy, whether or not it is.","熟脸会让品牌显得可信，不管实际可不可信。"],
        ["I trust a friend's recommendation far more than a celebrity endorsement.","比起名人代言，我信朋友推荐得多。"],
        ["It works because people imitate whoever they look up to.","之所以有效，是因为人会模仿自己仰望的对象。"]],
      part3:[
        ["Why do companies use celebrities in advertising?","公司为什么用名人做广告？"],
        ["How much do famous people influence what we buy?","名人对我们的购买影响有多大？"],
        ["Should advertising aimed at children be restricted?","面向儿童的广告该不该受限？"]] },

    { id:"p2-14", zh:"语言高手", cat:"人物", level:"进阶", scene:"学术课程",
      cue:"Describe a person who is good at learning languages",
      bullets:["Who this person is","What languages they speak","How they learned them","And explain what you can learn from them"],
      vocab:[["multilingual","会多种语言的"],["fluency","流利程度"],["accent","口音"],["immerse","沉浸式投入"],["pick up","自然习得"],["grammar","语法"],["vocabulary","词汇量"],["practise","练习"],["native speaker","母语者"],["confidence","自信"]],
      exprs:[
        ["He picks up languages mainly by talking to people, not from textbooks.","他学语言主要靠跟人聊天，不是靠课本。"],
        ["She isn't afraid of making mistakes, which is why she improves so fast.","她不怕犯错，所以进步特别快。"],
        ["What helps is that he thinks in the language instead of translating.","他的诀窍是用那种语言思考，而不是翻译。"],
        ["I've tried to copy her habit of watching shows without subtitles.","我试着学她看剧不开字幕的习惯。"]],
      part3:[
        ["Why are some people better at learning languages?","为什么有些人更擅长学语言？"],
        ["What is the best way to learn a language?","学语言最好的方法是什么？"],
        ["Will translation technology replace language learning?","翻译技术会取代语言学习吗？"]] }
  ]
};
