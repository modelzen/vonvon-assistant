# Vonvon Assistant

一套专为 [Vonvon Bot](https://github.com/modelzen/vonvon-bot) 用户设计的飞书随身帮助与反馈群配方（**1 个群 + 1 个 Bot + 4 个 Skill**），同时也是声明式 `vonvon-bot.json` 配方的参考样板。

把这个配方导入或绑定为你的飞书群主工作区后，你的 Bot 就能在同一个群里全程主动引导你完成从环境准备、日常答疑、本地排错到提交高质量反馈的完整闭环：

1. **`vonvon-setup`（交互式预准备与更新）**：一次性体检本机环境，按需选档（基础 A 档仅需几秒浅克隆文档源码，无需安装 `gh` 或 Node 依赖；可选 B 档开启命令行直提 Issue；同时支持维护者对外分享前核对清单与双端校验）。
2. **`vonvon-qa`（问题答疑）**：基于真实源码与官方文档回答安装、配置、权限与使用问题，区分正式版与 `dev` 未发布改动。
3. **`vonvon-diagnose`（本地问题排错）**：按系统化清单只读排查本机运行环境、日志、工具链与飞书连接，给出临时绕过方案与根因定位，绝不擅改正在运行的 `~/.vonvon-bot`。
4. **`vonvon-feedback`（高质量反馈与提 Issue）**：自动查重（支持新建 Issue 或给已有 Issue 补充复现证据）、主动帮用户补齐模板与验收例子、默认保留并裁剪脱敏话题截图、强制预览确认后再提交（装了 `gh` 可直提，没装 `gh` 也会生成一键预填链接）。

---

## 配方结构

本仓库是纯声明式配方包，不包含硬编码的 CLI 安装脚本，由 Vonvon Bot 的私聊配置能力统一解析与装配：

- [`vonvon-bot.json`](vonvon-bot.json)：配方清单（元数据、推荐群名 `vonvon 帮助与反馈`、默认权限与会话方式、兼容平台/后端与 Skill 目录）
- [`supplement.md`](supplement.md)：本群补充职责
- [`AGENTS.md`](AGENTS.md) / [`CLAUDE.md`](CLAUDE.md)：群工作区约定与安全红线
- `.agents/skills/` & `.claude/skills/`：Codex 与 Claude 原生加载的 4 个 Skill（实体副本，无符号链接，兼容 macOS / Linux / Windows）

---

## 快速开始

### 方式一：通过私聊 Bot 导入配方（推荐）

支持三种来源，直接发给你的 Vonvon Bot **私聊** 即可：

- **GitHub 链接**：
  > 请按这个配方帮我创建并配置群聊：https://github.com/modelzen/vonvon-assistant
- **本地配方文件夹 / 压缩包**：把本仓库下载或解压到本地目录后，把路径发给私聊 Bot，让它读取其中的 `vonvon-bot.json` 和 `supplement.md` 帮你建群并绑定；
- **飞书云文档**：把本仓库打成 ZIP 附在飞书云文档里分享给同事，让对方的私聊 Bot 读取文档并解压附件创建群聊。

建好群后进群发一句 **「开始初始化」**（或直接提问），`vonvon-setup` 会主动带你走完初始化。

### 方式二：手动建群

1. 把本仓库克隆到本地任意目录（例如 `~/vonvon-assistant`）：
   ```bash
   git clone https://github.com/modelzen/vonvon-assistant.git ~/vonvon-assistant
   ```
2. 在 Vonvon Bot 客户端里新建一个飞书群（建议命名为 **`vonvon 帮助与反馈`**，或绑定一个**仅含你自己**的飞书群）：
   - **主工作区**：选择刚才克隆的 `~/vonvon-assistant`
   - **会话方式**：推荐「多会话（@ 我开新会话）」，也可按习惯选「智能」
   - **执行权限**：
     - 想让 Bot 直接只读查本机日志自动排错：选「完全访问」（⚠️ **仅限个人私有群，切勿拉不信任的人进群**）
     - 希望更保守：选「工作区可写」（答疑、查重、给只读排错命令由你贴输出、提交反馈均可正常使用）
   - **补充职责**：把 [`supplement.md`](supplement.md) 的内容填入本群补充职责
3. 进群后对 Bot 说话，`vonvon-setup` 会自动检测并引导完成前置准备。

---

## 安全提醒

- **私密群原则**：如果该群开启了「完全访问」，群内成员可以让 Bot 在本机执行任何操作。**请只保留你自己（或完全信任的协作者）在群内**；如需面向团队多人答疑，请单独建一个「只读」群。
- **不碰生产环境**：本套 Skill 严格只读排查，不会擅自修改你正在使用的 `~/.vonvon-bot` 数据目录或重启后台服务。
- **文字与图片强制脱敏确认**：提交任何公开 Issue 或补充评论前，Bot 会脱敏密钥、飞书 ID、私有链接与路径，并把完整文字和所有拟公开截图/视频发给你预览确认（提示按需打码）后再提交。

---

## 更新与维护

- **更新助手 / 升档 / 对外分享前核对**：直接在群里触发 `vonvon-setup`（例如说「更新一下助手」「升级到 B 档」或「准备对外分享」）。
- **校验配方清单与双端 Skill 同步**（`vonvon-bot.json`、`.agents/skills/`、`.claude/skills/`、`AGENTS.md`、`CLAUDE.md`）：
  ```bash
  node scripts/sync-skills.mjs
  node scripts/sync-skills.mjs --check
  ```
