---
name: vonvon-setup
description: 统一承接所有正式工作前与对外分享前的交互式预准备，包括体检本机环境、拉取 vonvon-bot 源码、按需配置 gh、替换仓库占位地址、校验同步与协议以及后续更新。只要 workspace/setup-state.json 不存在，任何新话题都必须先读本 skill；用户说「开始初始化」「开始前准备」「替换仓库地址」「准备对外分享」「帮我配环境」「装一下 gh」「更新助手或源码」时也先读本 skill。
---

# Vonvon 助手预准备、初始化与更新（统一入口）

本 Skill 统一负责**所有正式工作前与对外分享前要预先准备好的事情**：
1. **用户工作前预准备（A / B 两档，极简按需）**：拉源码用于答疑与排错，按需决定是否配置 `gh` 命令行直提 Issue；
2. **助手仓库发布/分享前准备（模块 0，维护者模式）**：核对仓库地址、校验配方目录，按需补齐 `LICENSE` 与配置远端仓库。

> **【关键体验要求：一口气完成体检再回复】**
> 执行第一步只读体检时，**不要先发一句「我先检查一下初始化状态」就结束回合让用户追问**！必须在同一轮里跑完所有只读检查，一次性向用户输出简明体检结果和清晰选项。
>
> **被其他任务自动拦截触发时**：先用一句话承接用户的原始诉求（「收到你刚才的问题，先带你用几十秒完成初始化，配好后我立刻接着处理」），然后立刻给出体检结果与选项；等初始化完成写好 `workspace/setup-state.json` 后，主动无缝切回原任务继续处理。若用户明确回复「本次先跳过」，则尊重用户意愿直接回到原任务。

---

## 第一步：无侵入全量体检（同一轮内做完再发给用户）

执行只读检查（不修改文件、不安装软件）：

1. **配方源仓库（仅当当前目录同时有 `vonvon-bot.json` 和 `skills/` 时检查）**：
   - 检查 `git remote get-url origin` 是否已配置；
   - 检查 `vonvon-bot.json` 中的 `repository` 与 `README.md` 中的仓库地址是否仍为占位符或与 `origin` 不一致；
   - 检查 `LICENSE` 是否存在；
   - 若本机可用 Vonvon CLI，运行 `vonvon template inspect .` 校验清单、技能和工作区文件。已安装的群工作区通过 `.vonvon-template.json` 获取导入来源，无需检查 Git 远端或运行维护命令。
2. **系统与权限能力**：
   - 检查 OS 与 CPU 架构（macOS / Linux / Windows）；
   - 检查当前会话是否能联网、能否写 `workspace/`、能否只读查看 `~/.vonvon-bot/logs/`（用于判断权限档位；**严禁读取 `~/.vonvon-bot/` 下的任何密钥与凭据文件**）。
3. **目标源码与初始化记录**：
   - 读取 `workspace/setup-state.json`（若存在）；
   - 检查本地 `vonvon-bot` 仓库（默认 `workspace/vonvon-bot` 或 `setup-state.json` 记的路径）是否存在及当前分支/提交。
4. **本机工具链**：
   - `git --version`
   - `gh --version` 与 `gh auth status`（未装/未登只标现状，不强迫安装）
   - 若可访问则读取本机已安装的 Vonvon Bot 版本（群令牌拒绝属于正常现象，直接标注即可）。

---

## 第二步：一次性展示体检摘要与简短选项

把体检结果压缩成 2～4 行简明摘要，直接给出清晰可回复的短选项：

- **A（推荐起步，几乎零依赖）**：浅克隆 `modelzen/vonvon-bot` 文档与源码（几秒完成），立刻开启**问题答疑、本地排错**，提 Issue 时用**预填网页链接**一键提交（不需要安装 `gh` 或 Node 依赖）。
- **B（命令行直提 Issue，可选）**：在 A 的基础上配置并登录 GitHub CLI（`gh`），之后可以在飞书群里直接一键发布 Issue 或给已有 Issue 补发复现评论。
- **0（仅在维护配方源仓库时展示）**：配置仓库远端、更新 `vonvon-bot.json` 与 `README.md` 中的仓库地址、按需补 `LICENSE` 并校验配方。

结尾明确给出短回复提示：
> 「直接回复 **A** 或 **B**（需要对外分享可回 **0**）我就帮你配好；只是先随便看看也可以回 **本次先跳过**。」

> 如果用户明确只是来「更新助手」「更新源码」或「单独替换某个地址」，直接跳到对应小节执行，不走多余步骤。

---

## 第三步：按所选项目逐步执行

### 模块 0：助手仓库发布/分享前准备（替换地址、同步与协议）

1. **确定本助手仓库的真实地址**：
   - 若本目录已配置 `origin` remote，优先从 `git remote get-url origin` 推导 HTTPS 地址并向用户确认；
   - 若尚未配置远端，询问用户：已有地址则直接 `git remote add origin <url>`；还没建远端且已登录 `gh`，经确认后运行 `gh repo create` 建仓并关联 `origin`。
2. **自动同步仓库地址**：
   - 将 `vonvon-bot.json` 的 `repository` 与 `README.md` 中的仓库地址更新为真实仓库地址；
   - 若用户指定了自定义的上游 `vonvon-bot` 地址（如内部镜像），询问是仅写入本机 `workspace/setup-state.json` 还是同步更新文档。
3. **补齐协议与校验配方**：
   - 若尚无 `LICENSE`，询问是否添加开源协议（如 Apache-2.0）及版权归属名称；
   - 运行 `vonvon template inspect .`。在空的临时目录试导入后，检查 `.agents/skills/` 和 `.claude/skills/` 是否都含清单里的技能。技能只在源仓库的 `skills/` 下编辑。
4. **预览并经确认后提交/推送**：
   - 展示 `git status` 与 `git diff` 摘要，经用户明确确认后再执行 `git add`、`git commit` 与（可选）`git push`。

### 档位 A：基础源码与文档就位（答疑 + 本地排错 + 网页预填反馈）

1. **确认目标仓库与本地位置**：
   - 默认上游仓库 `https://github.com/modelzen/vonvon-bot.git`，默认存放于 `workspace/vonvon-bot`（如果用户主动提到本机已有现成源码目录想复用，验证可读后直接复用并写入 `setup-state.json`）。
   - 执行浅克隆（默认拉 `main` 对齐用户正式版）：
     ```bash
     mkdir -p workspace
     git clone --depth 1 --branch main <upstreamUrl> workspace/vonvon-bot
     ```
2. **核验可读性**：确认 `<repoPath>/README.md`、`docs/` 可读取。
3. **说明当前权限预期**：
   - 能读取 `~/.vonvon-bot/logs/`（完全访问）：排错时可直接只读查日志，并提醒**切勿拉不信任的人进群**；
   - 无法读取 `~/.vonvon-bot/logs/`（只读/工作区可写）：排错时由 Bot 给出安全只读命令请用户在终端运行后贴回。

### 档位 B：可选配置 GitHub CLI（`gh`）

先完成档位 A（若尚未完成），再处理 `gh`：
- 若本机已安装且 `gh auth status` 已登录 → 直接标记 `ghReady: true`，无需多余步骤！
- 若未安装 `gh`：按平台给出清晰指引（macOS 经确认可 `brew install gh`；Linux 给官方步骤，涉及 `sudo` 交用户终端执行；Windows 提示 `winget install --id GitHub.cli`）。
- 若已安装但未登录：请用户在终端执行 `gh auth login` 完成后回复「登录好了」，再跑 `gh auth status` 复核。

### 保存初始化状态

每次完成初始化、升档或更改仓库地址后，将非敏感状态写入 `workspace/setup-state.json`：

```json
{
  "tier": "A",
  "assistantRepoUrl": "",
  "upstreamRepo": "modelzen/vonvon-bot",
  "upstreamUrl": "https://github.com/modelzen/vonvon-bot.git",
  "repoPath": "workspace/vonvon-bot",
  "ghReady": false,
  "updatedAt": "2026-11-23T00:00:00Z"
}
```

> 严禁在 `setup-state.json` 中写入任何密钥、Token、邮箱或飞书 ID。

---

## 第四步：日常更新与收尾引导

- **更新助手本身**：如果这是通过配方导入的群工作区，从 `.vonvon-template.json` 确认来源，使用 Vonvon 的配方升级入口更新已有群。先核对技能和工作区文件的冲突，取得用户同意再覆盖已有技能。若正在维护配方源仓库，检查 `git status` 干净后使用 `git pull --ff-only`，再用该配方升级群工作区。
- **更新本地 `vonvon-bot` 源码**：检查 `<repoPath>` 工作区干净后运行 `git -C <repoPath> fetch --depth 1 origin main && git -C <repoPath> reset --hard origin/main`。
- **替换地址**：随时支持切换助手远端或上游目标仓库地址并同步写回 `workspace/setup-state.json`。
- **收尾主动引导**：
  - 若本次是由用户原问题自动拦截触发的，初始化完成后**立即无缝切回用户原问题继续处理**；
  - 若用户是主动跑初始化，收尾简短列出当前已就绪能力，并给 2～3 句直接能发的话（如问个用法、贴个报错、或提个功能想法）。
