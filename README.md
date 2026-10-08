# IELTS Mate · 雅思口语专练（ielts-oral-buddy）

一个**纯口语**雅思备考工具：随机抽题、AI 考官即兴追问、表达三档升级、全真套题计时。
纯静态网页——**无需安装、无需注册、没有服务器**，下载就能用。

> 在线版：<https://ielts-mate.app.workbuddy.host/>

## 功能一览

| 模块 | 说明 |
|---|---|
| 🎯 随机抽题 | 43 个话题 / 115 个题面（Part 1 23 话题 95 题、Part 2 20 张卡、Part 3 60 追问），支持按题型 / 场景（日常·学术·职场·社会）/ 换题季（当季新题·保留题）/ 类别 / 难度组合筛选 |
| 🤖 AI 考官 | 双引擎：不配 Key 用内置**离线规则考官**（动态追问、跑题判定、Part 3 抽象化）；配 Key 切换**大模型考官**（DeepSeek / 通义 / Kimi / 智谱 / OpenAI 等，OpenAI 兼容协议） |
| ✍️ 三档升级 | 把你的回答改写成 Band 6 / 7 / 8 三版参考表达，词级 diff 高亮改动处 + 改动清单 |
| ⏱ 套题模式 | 1×Part 1 + 1×Part 2 + 对应 Part 3，按真实考试计时自动推进（240s / 60s / 120s / 240s），结束后出四维报告 |
| 📈 复盘 | 练习历史、薄弱点本（类别覆盖 + 待攻克清单）、流利度统计（wpm / 填充词）、CSV 导出 |
| 📚 生词本 | 点词收藏、整本朗读 |
| 🗣 口音 | 考官朗读支持英音 / 美音 / 澳音 + 语速调节 |
| 🎙 录音 | Part 2 模拟自动录音，回放自查（存浏览器 IndexedDB，不出本机） |

## 快速开始

### 方式一：直接用在线版

打开 <https://ielts-mate.app.workbuddy.host/> 即可，无需任何配置。

### 方式二：本地运行

```bash
git clone https://github.com/liyu-bit/ielts-oral-buddy.git
```

然后**双击 `index.html`** 用浏览器打开即可。也可以起一个静态服务器：

```bash
cd ielts-oral-buddy
python -m http.server 8080
# 打开 http://localhost:8080
```

### 方式三：部署到你自己的托管

整个项目就是几个静态文件，扔到 **GitHub Pages / Vercel / Netlify / Cloudflare Pages** 任意一家即可，无构建步骤、无环境变量、无后端。

## 配置 AI 考官（可选）

不配置也能完整使用（内置离线考官）。想要更聪明的即兴追问和更地道的改写：

1. 任选一家 OpenAI 兼容服务商，例如 [DeepSeek 开放平台](https://platform.deepseek.com/)，注册后创建 API Key（`sk-` 开头）
2. 打开首页「AI 考官引擎」卡片，选择服务商（或选"自定义"填 Base URL）
3. 粘贴 Key → 「保存配置」→「测试连接性」

> 🔒 **隐私说明**：Key 只写入你自己浏览器的 localStorage，请求由你的浏览器直接发给你选的服务商，不经过本项目任何服务器（项目也没有服务器）。换设备或清浏览器数据后需重新填写。
> 💰 大模型 API 按量计费，口语练习用量下成本通常很低，具体以各服务商官网为准。

## 数据与隐私

**这个项目没有后端，全站只有一个网络出口**：你自己配置的大模型接口。没有统计、没有埋点、没有第三方 CDN，任何练习数据都不会离开你的设备。

| 数据 | 存在哪里 | 保存多久 |
|---|---|---|
| 练习记录 / 自评 / 生词本 / 偏好设置 | 浏览器 localStorage（`im_log`、`im_wordbook`、`im_settings`） | 直到你删除或清除浏览器数据 |
| 大模型 API Key（仅在你填写后存在） | 浏览器 localStorage（`im_llm`） | 同上 |
| Part 2 录音 | 浏览器 IndexedDB（`ielts-oral-buddy` → `recordings`） | 同上 |

**随时可自行删除**：复盘页 →「数据与隐私」卡片里可以

- 逐条删除练习记录（附带录音一并删除）
- 一键「删除全部录音」
- 一键「清除全部本机数据」（记录 / 自评 / 生词本 / 设置 / API Key / 录音全清）

也可以直接用浏览器的"清除站点数据"达到同样效果。练习历史和生词本还支持导出 CSV 备份。

## 项目结构

```
ielts-oral-buddy/
├── index.html   # 页面结构与样式（手写 CSS 设计系统，无框架）
├── topics.js    # 题库：window.IELTS_TOPICS（话题/题卡/词汇/参考表达/换季元信息）
├── engine.js    # 离线规则考官 + 诊断/三档改写/diff/报告引擎
├── llm.js       # 大模型接入：OpenAI 兼容 /chat/completions + SSE 流式
├── app.js       # 页面逻辑：抽题/套题/录音/复盘/生词本/导出
└── 口语模块*.md  # 设计文档（迭代记录与改进建议）
```

## 换题季维护

题库集中在 `topics.js`：换季时增删 `part1` / `part2` 条目、更新 `meta.version` 与 `meta.seasonRange` 即可，各页统计数字由自计数逻辑自动生成，不会漂移。

## 技术要点

- 零依赖、零构建：原生 HTML / CSS / JS，Web Speech API（TTS 朗读 + 语音识别），MediaRecorder + IndexedDB 录音
- localStorage / IndexedDB 均有不可用时降级（隐私模式可正常运行）
- 大模型流式输出（SSE）+ 严格 JSON 响应解析，失败自动回退离线引擎
- 移动端适配：≤700px / ≤560px / ≤400px 三档断点，触控目标 ≥40px，输入框 16px 以避免 iOS 聚焦时自动缩放

## License

[MIT](LICENSE) © 2026 liyu-bit

题面取自公开流传的当季雅思口语题；词汇与参考表达均为本项目自撰。本项目与雅思官方（IELTS / British Council / IDP）无任何关联。
