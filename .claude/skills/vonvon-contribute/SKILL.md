---
name: vonvon-contribute
description: 协助用户认领 Vonvon Bot 的 GitHub Issue（自己刚提的或社区已有的），开工前先提醒 Token 消耗，在隔离 worktree 中基于 upstream/dev 开发、运行构建/类型检查/测试/lint、按改动类型收集验收证据（支持 Web UI 自动截图/录屏）、自审 diff，并推送到用户 fork 后向 modelzen/vonvon-bot 的 dev 分支提交 PR（缺实测证据时明确告知并提交 Draft PR）。用户说「我想修这个 issue」「捡一个 issue 来做」「帮我找个能贡献的 issue」「提个 PR」「参与开发」时先读本 skill。
---

# Vonvon Bot 贡献开发与提交 PR（基于 `dev` 分支）

本 Skill 负责带用户走完规范、安全、高质量的开源贡献闭环，严格遵守 `modelzen/vonvon-bot` 的 `CONTRIBUTING.md`、`dev` 分支流程与**分层验收证据合同**。

## 不可违反的工程红线

1. **开工前必须先提醒 Token 消耗**：在真正拉取 worktree、深度读源码、写代码与跑验收前，必须明确告知用户开发与验收流程会消耗大量 Token / 订阅额度，待用户确认后再开工。
2. **基线与目标分支固定为 `dev`**：所有贡献分支必须从最新的 `upstream/dev` 拉出，最终 PR 的目标分支固定为目标上游仓库（默认 `modelzen/vonvon-bot`）的 **`dev`**（绝不向 `main` 提日常 PR，绝不 force-push 已推送的分支）。
3. **隔离工作区，绝不碰生产环境**：
   - 所有代码修改都在 `workspace/worktrees/<分支名>/` 的隔离 `git worktree` 中完成；
   - 绝不修改、重启或读写用户日常运行的 `~/.vonvon-bot` 数据目录和后台服务，也绝不用生产 Bot 的 `appId` 起第二个进程抢飞书长连接；试跑 daemon 必须使用独立的临时 `VONVON_HOME` 与 `HOME`，并严禁在日志、截图或 PR 中打印 `local-credential` 或完整 `vonvon open` 链接。
4. **缺实测验收证据自动走 Draft PR**：允许提交，但必须明确告知用户本次会以 **Draft PR（`--draft`）** 提交，并在 PR 顶部醒目标明缺少哪项验收证据，避免未实测的改动伪装成 Ready PR 消耗维护者精力。
5. **推送与提 PR 前必须经用户确认**：展示核心 diff 说明、风险点、检查与验收证据状态及完整 PR 预览，收到用户明确确认后再 `git push` 和 `gh pr create`。

## 第一步：初始化与开发环境前置闸门（必检，不可跳过）

先检查 `workspace/setup-state.json` 是否存在：
- **如果不存在**：先简短承接用户想开发/认领的 Issue，明确提示「当前群尚未完成初始化」，立即转入 `vonvon-setup`（引导配置档位 C）。
- **如果已存在**：读取目标上游仓库（`upstreamRepo` / `upstreamUrl`，默认 `modelzen/vonvon-bot`）与本地路径（`repoPath`，默认 `workspace/vonvon-bot`），并核验以下 4 项是否就绪：
  1. 本地已有完整历史（非浅克隆）的 `vonvon-bot` 仓库；
  2. `origin` 指向用户的 fork，`upstream` 指向目标上游仓库（默认 `https://github.com/modelzen/vonvon-bot.git`）；
  3. Node.js 满足 Node 24（或 22.12+ / 26+），且 `gh auth status` 已登录；
  4. 仓库依赖已安装且可构建。

**若任意一项未就绪**：不要硬跑报错，统一先转入 `vonvon-setup` 交互式补齐后再继续。

## 第二步：Token 消耗提醒与确认目标 Issue

1. **前置费用提醒（必做）**：
   在开始开发工作前，明确告知用户：
   > 「开始开发前先提醒一下：完整的定位源码、编写修复与回归测试、跑全仓构建检查、自审以及界面验收流程**会消耗较多 Token / 订阅额度**（复杂问题通常需要十多分钟和多轮工具调用）。确认要继续开工吗？」
   待用户确认后再进入拉取 worktree 与编码环节（若用户已在当前指令里明确同意并指定了 Issue，可在确定方案一起确认，绝不静默跳过提醒）。
2. **确定要认领的 Issue**：
   - **入口 A（延续当前话题）**：用户刚在 `vonvon-feedback` 里提了一个 Issue，直接读取该 Issue 编号。
   - **入口 B（用户指定编号）**：读取用户指定的 `#<编号>`。
   - **入口 C（挑选社区 Issue）**：拉取候选 open Issue 列表：
     ```bash
     gh issue list --repo <upstreamRepo> --state open --limit 20
     ```
     整理编号、标题、涉及包（`daemon/ui/desktop/protocol/docs`）与预估复杂度让用户挑选。
3. **撞车与方案核查**：
   - 阅读 Issue 全文与评论（`gh issue view <编号> --repo <upstreamRepo> --comments`）；
   - 检查是否已有 open PR 在处理同一 Issue（`gh pr list --repo <upstreamRepo> --state open --search "<编号>"`）；
   - 若属于较大的新功能或行为变更且 Issue 中尚未与维护者对齐方案，先提醒用户按 `CONTRIBUTING.md` 在 Issue 下确认方向再动大工程。

## 第三步：同步 `upstream/dev` 并建立隔离 Worktree

在 `<repoPath>`（默认 `workspace/vonvon-bot`）执行：

```bash
git -C <repoPath> fetch upstream dev
mkdir -p workspace/worktrees
git -C <repoPath> worktree add -b <分支名> "$(pwd)/workspace/worktrees/<分支名>" upstream/dev
```

分支名按改动性质清晰命名（如 `fix/issue-<编号>-<slug>` 或 `feat/issue-<编号>-<slug>`）。在 worktree 内确保依赖就绪（首次或锁文件变更时运行 `npm ci && npm run build`）。

## 第四步：先定方案与验收等级、再编码

1. 阅读 worktree 内的 `CONTRIBUTING.md` 及相关源码、测试与文档。
2. 编码前先判定本次改动属于哪一类**验收等级**，连同 3～8 行的简短改动方案发给用户确认，并**提前说清本次要提交「正式 PR（Ready）」需要哪些验收项，缺哪些会提交为「Draft PR」**（不要等到最后提交前才突然告诉用户；**只要涉及可见效果或交互，尽量提倡在 PR 中带图或短录屏，最直观说明修复效果**）：
   - **A 类（纯逻辑 / 协议 / CLI / 后端修复）**：需红→绿回归测试 + 自动化检查 + 关键 CLI 脱敏输出；
   - **B1 类（Web UI / 管理界面 / 卡片预览改动，`packages/ui`）**：除自动化检查与红→绿测试外，由 Bot 在后台用隔离 `VONVON_HOME` + 无头 Playwright **自动截取改前/改后对比图或短录屏**发回群里预览（零打扰飞书聊天）；
   - **B2 类（真飞书实卡 / 原生桌面外壳、托盘、系统弹窗）**：尽量提倡附改前/改后截图、短录屏或独立测试 Bot 实卡验证结果，但**绝不为了截飞书而打断用户正在聊天的生产 Bot**——无独立测试环境不便手测时，补齐红→绿回归测试 + 脱敏真实 payload + 维护者 2 分钟复验步骤，默认丝滑提 Draft PR 交维护者复验；
   - **C 类（高风险核心改动：子进程/进程组、并发锁、关闭清理、数据迁移、权限沙箱、CI/发版脚本）**：需全套自动化与回归测试 + 真实环境冒烟记录 + 明确不变量/边界风险说明，且单 PR 保持小而聚焦。
3. 编码要求：
   - **单 PR 只解决一个明确 Issue**，保持改动聚焦、最小化，不顺手重构无关代码；
   - **先复现再修复**：尽量先写出能在旧代码上稳定复现失败的回归测试（红），应用修复后验证通过（绿）；
   - 若参考或引入任何第三方代码，核对 Apache-2.0 兼容性并记录来源与许可证。

## 第五步：清理会话环境变量、跑检查与收集验收证据

### 1. 自动化检查（注意清理继承的群会话标记）

在飞书群会话中直接运行 `vonvon-bot` 仓库测试时，子进程会继承当前 Bot 会话的环境变量，可能污染 CLI / daemon 测试。运行测试时**必须清除这 4 个继承变量**：

- **macOS / Linux**：
  ```bash
  npm run build
  npm run typecheck
  env -u VONVON_SESSION -u VONVON_SCOPE -u VONVON_BOT -u FEISHU_CODEX_BRIDGE npm test
  npm run lint
  git diff --check
  ```
- **Windows（PowerShell）**：
  ```powershell
  npm run build
  npm run typecheck
  $env:VONVON_SESSION=$null; $env:VONVON_SCOPE=$null; $env:VONVON_BOT=$null; $env:FEISHU_CODEX_BRIDGE=$null; npm test
  npm run lint
  git diff --check
  ```
  （开发中可先跑单包测试如 `npm test -w packages/ui`，提交前按影响面补齐完整相关测试。）

### 2. 分层验收自测与成对留证（必须说清「修复前什么样 → 修复后什么样」）

按第四步判定的类别收集对应实测证据，**核心原则：只放几张“修复后看起来正常”的图看不出问题，必须成对呈现「修复前（Before） vs 修复后（After）」的同一条件对比，并给每张图/视频写清画面看点**：

- **通用留证要求（修 Bug 时必做）**：
  1. **先保留「修复前（Before）」现场**：在未修复基线（`upstream/dev`）上，按复现配置跑出问题现象并留存证据——优先留**修复前截图/短录屏**（如果原 Issue 已附清晰的问题截图或复现记录，可并列展示或明确对照引用），并同步截取**脱敏后的原始报错日志或非法 payload**（例如错误码、报错行、旧数据值）；
  2. **同条件采集「修复后（After）」现场**：应用修复后，在**完全相同的配置与操作步骤**下重跑，截留关键状态图/短录屏与脱敏正常日志；
  3. **每张图/视频必配「看点说明」**：说明是在什么配置下拍的、图里重点看哪一处（例如按钮位置、状态文案变化、持续刷新的进度）、以及它如何直接证明修复前的缺陷已消失——**禁止光秃秃堆几张图让维护者自己猜**。
- **B1 类（Web UI / 管理界面 / 卡片预览改动，全程后台自动完成、零打扰飞书聊天、不依赖 Computer Use）**：
  - 优先复用工作区 `vonvon-bot` 自带的 `.agents/skills/verify/` 思路：用隔离的临时 `VONVON_HOME` 与 `HOME` 分别在未修复基线和修复后构建下启动临时 daemon，由 **Playwright 无头 Chromium** 自动截取**修复前（Before）与修复后（After）对比图**（或用 `recordVideo` 录 10～30 秒短片）；
  - 唯一可选依赖是 Playwright + Chromium（若本机尚未安装，先征得用户同意再按需运行 `npx playwright install chromium`）；
  - 截完后清理临时 daemon 与 scratch 目录，**把 Before / After 截图或录屏连同每张图的看点说明直接发到当前飞书群里给用户预览确认**；
  - **强制媒体隐私审查与打码提醒**：无论是 Bot 自动截/录的画面，还是用户提供的截图/视频，在真正公开附到 PR 前**必须先发给用户完整预览**，并明确提醒用户检查画面中是否包含敏感信息（私密群聊/人名/头像、本机用户名路径、地址栏或终端里的凭据/Token、无关桌面窗口或浏览器标签等）；**需要打码或裁剪时，必须先打码（用户指明区域时 Bot 也可协助裁剪/打码并重发预览）再提交或上传**；
  - 严禁在终端输出、截图文字或 PR 中暴露临时目录里的 `local-credential` 或完整 `vonvon open` URL。
- **B2 类（真飞书实卡 / 原生 Electron 外壳、托盘、系统弹窗，边验边留成对证据，绝不空口白话）**：
  - **核心铁律**：只要进入真飞书实卡或桌面实测验收（无论是通过独立测试 Bot、Playwright 还是 Computer Use），**必须在验收过程中同步留存「修复前（Before）现象/报错 + 修复后（After）关键状态」的成对客观证据**（截图或 10～30 秒短录屏 + 脱敏日志对照），**绝不允许验收完不留图/不录屏，也不允许只堆几张修复后的正常图却看不出之前坏在哪**；
  - 留存的截图/录屏必须先裁掉无关群聊和桌面信息，连同每张图的看点说明发到当前飞书话题给用户预览并提醒按需打码；
  - 绝不拿用户正在聊天的生产 Bot 抢长连接，也不强逼没有独立测试环境的普通用户打断聊天手工折腾：如果本机确实没有独立测试环境做不到实测留图，就跑齐红→绿回归测试 + 脱敏真实 Before/After payload 对照 + 维护者 2 分钟复验步骤，诚实提交为 **Draft PR（标注“已过全套测试，尚缺实卡/真机可视化验收证据”）**。
- **A 类（纯逻辑 / CLI / 后台改动）**：
  - 同样必须成对呈现 Before → After：写明新增/修改的回归测试文件路径与用例名、旧代码复现失败的原始报错摘录 → 修复后通过的输出摘录，以及隔离 `VONVON_HOME` 下真实 CLI 修复前后的脱敏输出对照。

### 3. 自我审查（Diff Self-Review）

检查通过后，逐文件审查 `git diff upstream/dev...HEAD`：
- 核对边界条件、错误处理、资源清理、跨平台路径假设（macOS / Linux / Windows）；
- 确认无调试日志、临时文件、误改文件或敏感信息混入；
- 用白话向用户总结：**核心改了哪几处、有哪些潜在风险、哪些验收已通过、哪些实测项缺失**，确保贡献者本人理解改动内容。

## 第六步：判定正式 PR / Draft PR → 告知补齐路径 → 预览确认提交

1. **按硬证据标准判定「正式 PR（Ready）」还是「Draft PR」**（**铁律：纯文字自述“已验收通过”不算正式 PR 证据；只有修复后画面却看不出修复前坏在哪，也不算合格验收展示**）：

   | 维度 | 可以直接提交 **正式 PR（Ready）** | 提交为 **Draft PR（`--draft`）** |
   | --- | --- | --- |
   | **共同底线** | `build` / `typecheck` / 相关 `test` / `lint` / `git diff --check` 全绿；有红→绿回归测试或新功能单测；完成 diff 自审；正文含「修复前 vs 修复后对照」与「维护者 2 分钟最小复验步骤」 | 任一关键项未闭环、仍在进行中，或较大行为变更尚未在 Issue 对齐方案 |
   | **A 类（纯逻辑 / 协议 / CLI / 后端）** | 正文附可核查的回归测试文件路径/用例名、修复前失败 → 修复后通过的精简原始输出对照，及隔离 CLI 脱敏实跑对照 | 仅有修改或口头描述“已通过”，未附可核查的 Before/After 回归与实跑对照 |
   | **B1 类（Web UI / 卡片预览）** | **PR 页面已实际附带**经用户预览与按需打码的**修复前（Before）与修复后（After）对比截图或短录屏**，且每张图写清验证看点 | 缺少界面截图/录屏、只有修复后图而未呈现修复前问题、或截图尚未上传到 GitHub PR 页面（须先开 Draft，挂上图后再转 Ready） |
   | **B2 类（真飞书实卡 / 原生桌面壳）** | **PR 页面已实际附带**经用户预览与按需打码的**修复前（Before）问题画面/报错对照 + 修复后（After）实卡/真机截图或短录屏**，每张图写清验证看点并附关键脱敏日志对照（**纯文字总结或光秃秃几张正常图均不能直接算 Ready！**） | 仅有文字描述、缺少 Before 对比导致看不出问题、截图尚未上传到 PR 页面，或本机无独立测试环境尚未做实卡/真机验收 |
   | **C 类（高风险核心改动）** | 除全套自动化测试外，已附真实环境冒烟的 Before/After 脱敏原始记录、明确的边界风险与不变量说明，且 diff 聚焦可控 | 缺少真实环境冒烟的客观记录，或关键跨平台风险项尚未验证 |

   - **媒体附件尚未上传到 GitHub 时的硬门禁**：如果本次 PR 需要附图/录屏才能成为正式 PR，但 `gh pr create` 无法直接上传本地二进制图/视频，**必须先带 `--draft` 创建 Draft PR**，等用户把已预览打码的截图/录屏拖进 PR 正文或评论区（或经浏览器上传确认页面已显示图片/视频）之后，再执行 `gh pr ready <PR号> --repo <upstreamRepo>` 转为正式 PR。这样维护者看到的每一份 **Ready PR** 上一定实打实看得到验收图/录屏，与 Draft PR 有清晰硬区分！
   - **满足正式 PR 条件时**（A 类证据已在正文齐备，或 B1/B2 Before/After 媒体已确认可随 PR 呈现）：向用户确认全部达标项，准备提交正式 PR。
   - **尚不满足正式 PR 条件（将提交 Draft PR）时，必须说清「差什么就能转正式 PR」，并给用户两个选择**：
     > 「当前已通过：【列出已达标项】；距离提交**正式 PR（Ready）**还差以下客观证据：
     > 1. 【具体缺项 1，例如：缺少同一条件下的修复前（Before）复现画面/报错对照，或缺少 B2 实卡验收截图/录屏，并写清如何补齐】
     > 2. 【具体缺项 2，如有】
     >
     > 你可以选：
     > - **选项 1（现在补齐 → 转为正式 PR）**：我马上带你补齐 Before/After 对比证据（裁剪并先发你预览打码），先建 Draft PR 挂上图后再一键转成正式 PR；
     > - **选项 2（先提 Draft PR → 以后补齐再转正）**：我现在先帮你提交为 Draft PR 并在顶部标明待补证据；之后补齐证据后，我可以一键帮你执行 `gh pr ready` 转为正式 PR。」
2. **按官方模板 `.github/pull_request_template.md` 起草 PR 描述**（必须包含 **`### 修复前（Before）vs 修复后（After）`** 对比、每张图的看点说明以及「维护者 2 分钟最小复验步骤」；默认在末尾附克制来源署名，不夹带隐私信息；预览时若用户要求去掉署名则尊重去掉）：
   ```markdown
   ## 改动

   - 关联 Issue：Fixes #<编号>（或 Refs #<编号>）
   - 核心改动说明与边界风险（如涉及第三方代码，注明来源与许可证并确认按 Apache-2.0 贡献）。

   ## 验证

   - **验收状态**：Ready（证据齐全） / Draft（尚缺：<具体缺失的实测项>）
   - **统一验证前提/配置**：<写清 Before 与 After 共用的精确配置、开关、测试环境与触发动作>

   ### 修复前（Before）vs 修复后（After）

   - **修复前（Before）**：
     - 现象：<在统一前提下，修复前具体坏成什么样，例如卡片卡在初始态无法更新、按钮点击报错等>
     - 证据：<修复前实测截图/短录屏（或明确引用原 Issue 复现画面）+ 脱敏后的关键报错日志/非法数据摘录，如 `code=1002 ...`>
   - **修复后（After）**：
     - 现象：<在完全相同前提下，修复后每一步具体表现如何>
     - 证据：<修复后截图/短录屏，**每张图下方必须用 1～2 句写明“看图重点：图里哪一处证明了什么”** + 脱敏后的正常日志对照>

   ### 自动化与回归检查

   - **回归测试（红 → 绿）**：`<测试文件路径>` 的 `<用例名>`（旧代码复现失败原因 → 修复后通过）
   - **全量/受影响检查**：`npm run build`、`npm run typecheck`、`npm test ...`、`npm run lint`、`git diff --check`
   - **已验证平台**：<如 macOS ARM64 / Linux x64 / Windows x64>
   - **尚未验证的平台或场景**：<如实列明>

   ### 维护者 2 分钟最小复验步骤

   1. <启动命令或环境配置>
   2. <触发动作>
   3. <预期看到的正确结果（对照修复前不再复现的报错/异常）>

   ---
   <sub>通过 vonvon-assistant（`vonvon-contribute`）辅助开发与自检</sub>
   ```
   > 若 `workspace/setup-state.json` 已配公开 `assistantRepoUrl`，可将署名里的 `vonvon-assistant` 写成 `[vonvon-assistant](<assistantRepoUrl>)`。
3. **展示完整预览并等待用户明确确认**：列明分支名、commit 列表、目标 `dev`、**Ready 还是 Draft 状态**、PR 标题与完整正文；若本次将附带任何截图或录屏视频，**必须一并展示全部媒体预览，并明确提醒用户检查画面敏感信息、如需打码先打码再确认提交/上传**。
4. **确认后推送 Fork 并创建 PR**：
   ```bash
   git -C workspace/worktrees/<分支名> push -u origin <分支名>
   # Ready PR 省略 --draft；缺少关键验收证据时必须带上 --draft
   gh pr create \
     --repo <upstreamRepo> \
     --base dev \
     --head <github用户名>:<分支名> \
     --title "<PR标题>" \
     --body-file workspace/.pr-body.md \
     [--draft]
   ```
   删除临时文件 `workspace/.pr-body.md`，把 **PR 链接**发给用户。
   - **图片/视频附件补充提示**：由于 `gh pr create` 不支持直接上传本地图片或视频到 GitHub，如果刚才 Bot 已经帮你生成了改前/改后截图或录屏，发完 PR 链接后把**已经用户预览确认无敏感信息（或已打码）的**截图/视频路径一并告诉用户，请用户直接拖进 PR 正文或评论区（若因此先开了 Draft，拖完图即可提醒转 Ready）。

## 第七步：说明 CI 机制、Draft 转正式 PR 与后续跟进

- **Draft 转正式 PR**：如果本次提交的是 Draft PR，在用户补齐所缺的验收证据（例如把已预览/打码的截图或录屏拖入 PR，或补完实机复测）后，帮用户更新 PR 正文的「验收状态」和「实测证据」，并执行：
  ```bash
  gh pr ready <PR号> --repo <upstreamRepo>
  ```
  将其正式转为 Ready PR。
- 提醒用户：`modelzen/vonvon-bot` 的 CI 会先跑轻量范围分析，完整平台检查由维护者在准备合入时添加 `frozen` 标签触发（无需用户手工加标签）。
- 如后续维护者提出 Review 意见，用户直接把意见贴回本话题，Bot 继续在同一个 worktree 修改、重跑检查并 `git push` 更新 PR（同步最新 `dev` 用 `git fetch upstream dev && git merge upstream/dev`，不 force-push）。
- PR 合入或关闭后，提醒并协助清理隔离 worktree：
  ```bash
  git -C <repoPath> worktree remove workspace/worktrees/<分支名>
  ```
