# Vonvon 帮助与反馈助手

给 [Vonvon Bot](https://github.com/modelzen/vonvon-bot) 用户用的飞书随身助手群。

使用示例和建群步骤见 [飞书配方介绍](https://my.feishu.cn/docx/FyoGdja6BoqMZzxe8mucQljJnOb)。

在飞书里建一个专属的 **「vonvon 帮助与反馈」** 群，遇到安装配置疑问、本地运行异常，或者想提 Bug / 功能建议时，直接在这个群里找你自己的 Bot：

- **问题答疑**：对照真实源码和官方文档回答用法与配置问题，并区分当前正式版与未发布改动。
- **本地排错**：按系统化清单只读排查本机环境、运行日志、工具链和飞书连接，定位根因并给出绕过或修复方案。
- **高质量反馈**：自动在 GitHub 查重，帮你补全版本、环境、复现步骤、裁剪脱敏后的截图和日志，经你预览确认后直接提交 Issue（或生成一键预填提交链接，不装 `gh` 也能用）。

---

## 快速开始（一句话建群）

> 前提：你已经在电脑或服务器上装好 [Vonvon Bot](https://vonvon.cc/get/)，并接入了至少一个飞书机器人。

1. **复制下面这句话，发给你自己的 Vonvon Bot 私聊**：

   ```text
   帮我照这个配方建群：https://github.com/modelzen/vonvon-assistant
   ```

2. **确认配置**：Bot 会把本仓库拉到本地，并向你确认群名（默认 **`vonvon 帮助与反馈`**）、工作目录、后端与权限，回复 **「确认」** 即可建好群。
3. **进群使用**：打开建好的群，发一句 **「开始初始化」**（或者直接抛出你的问题），Bot 会引导你选择档位：
   - **A 档（推荐起步，几乎零依赖）**：几秒拉取官方文档与源码，马上开启答疑、排错，以及网页预填链接反馈；
   - **B 档（可选）**：在 A 档基础上启用 GitHub CLI（`gh`），可在群里直接提交 Issue 或给已有 Issue 补充复现评论。

---

## 进群后可以怎么问

直接像同事聊天一样发消息或贴截图，Bot 会在每个阶段主动引导你下一步：

- **查用法**：`智能模式和规则模式有什么区别？怎么配？`
- **排本地故障**：直接发报错文字或截图，例如 `打开了流式输出和工具调用，但卡片一直停在正在处理`
- **提建议或 Bug**：`这个场景用起来不太顺手，帮我整理个功能建议发到 GitHub`
- **更新助手**：`更新一下助手`（拉取最新答疑与排错能力）

---

## 隐私与安全说明

- **仅限个人私密群**：为了方便 Bot 直接只读查看本机运行日志，建群默认使用「完全访问」权限。**请只在群里保留你自己（或完全信任的协作者），切勿拉外人进群**。如果不希望给完全访问，建群后让私聊 Bot 切为「工作区可写」即可（排错时改为由 Bot 提供只读命令，你手动跑完贴结果）。
- **只读排错，不碰生产环境**：排错过程不会修改你的 `~/.vonvon-bot` 配置，也不会擅自停止或重启正在运行的后台服务，更不会读取密钥和凭据文件。
- **提交前强制脱敏与预览确认**：任何将要发到公开 GitHub 的文字、日志和截图，都会先去除密钥、飞书 ID、私有链接与敏感路径，并把完整正文和截图发给你预览确认（提醒按需打码），确认后才会提交。

---

<details>
<summary>手动准备工作区（不通过私聊）</summary>

1. 克隆配方仓库，再把配方导入一个新的群工作区。Vonvon 会按 Codex 和 Claude 的目录结构安装技能。
   ```bash
   git clone https://github.com/modelzen/vonvon-assistant.git ~/vonvon-assistant
   vonvon template stage ~/vonvon-assistant --dest ~/vonvon-help-workspace --mode fresh --source-url https://github.com/modelzen/vonvon-assistant
   ```
2. 在 Vonvon Bot 客户端新建一个仅含你自己的飞书群（建议命名为 **`vonvon 帮助与反馈`**）：
   - **主工作区**：选择 `~/vonvon-help-workspace`（支持 Codex 与 Claude，macOS / Linux / Windows 通用）
   - **会话方式**：推荐「多会话（@ 我开新会话，话题内免 @）」，也可按习惯选「智能」
   - **执行权限**：需要自动查日志选「完全访问」（仅限个人群），更保守可选「工作区可写」
3. 进群后发一句「开始初始化」或直接提问即可。

已经在用旧版时，把同一个配方链接发给 Vonvon，选择升级已有群。如果你之前直接把旧版仓库当作群工作区，可以在原目录旁建一个新的工作区，先用新配方导入技能，再按需复用原来的 Vonvon 源码目录。

</details>

<details>
<summary>Vonvon 配方目录与校验</summary>

- `vonvon-bot.json` 声明配方版本、建群建议和技能清单。
- `skills/` 存放 `vonvon-setup`、`vonvon-qa`、`vonvon-diagnose` 和 `vonvon-feedback`。每个技能只维护一份，导入时由 Vonvon 安装到两个后端。
- `workspace/` 存放导入时写入群工作区的 `AGENTS.md`、`CLAUDE.md` 和 `.gitignore`。
- 在仓库根目录运行 `vonvon template inspect .` 校验配方。

</details>
