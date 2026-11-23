# Vonvon Assistant

专为 [Vonvon Bot](https://github.com/modelzen/vonvon-bot) 用户设计的飞书「帮助与反馈」群模板（**1 群 + 1 Bot + 4 个 Skill**）：

1. **`vonvon-setup`**：交互式体检与按需初始化（基础 A 档仅需几秒浅克隆文档源码；可选 B 档配置 `gh` 直提 Issue）。
2. **`vonvon-qa`**：基于真实源码与官方文档答疑，区分正式版与 `dev` 未发布改动。
3. **`vonvon-diagnose`**：只读排查本机运行环境、日志、工具链与飞书连接，绝不擅改 `~/.vonvon-bot`。
4. **`vonvon-feedback`**：自动查重、主动质量把关、默认裁剪脱敏话题截图、预览确认后提 Issue 或补充复现评论。

---

## 一句话快速开始（推荐）

复制下面任意一句，发给你自己的 Vonvon Bot **私聊**即可：

- **稳妥版（建群前先确认群名、目录和权限，推荐）**：
  > 帮我照这个配方建群，建前先确认群名、目录和权限：https://github.com/modelzen/vonvon-assistant
- **直接建群版（按默认配置直接创建）**：
  > 帮我照这个配方建群：https://github.com/modelzen/vonvon-assistant

默认配置为群名 **`vonvon 帮助与反馈`**、多会话（话题内免 `@`、`response: all`）、完全访问（仅限个人私有群；如需更保守，建群后直接让私聊 Bot 切为 `工作区可写` 即可）。建好后打开新群发一句 **「开始初始化」**（或直接提问），Bot 会全程引导你完成设置。

---

## 手动建群

1. 克隆本仓库到本地任意目录（例如 `~/vonvon-assistant`）：
   ```bash
   git clone https://github.com/modelzen/vonvon-assistant.git ~/vonvon-assistant
   ```
2. 在 Vonvon Bot 客户端里新建飞书群（建议命名 **`vonvon 帮助与反馈`**，仅含你自己）：
   - **主工作区**：`~/vonvon-assistant`（根目录的 `AGENTS.md` / `CLAUDE.md` 与 4 个 Skill 会自动加载，无需额外配置补充职责）
   - **会话方式**：推荐「多会话（@ 我开新会话）」，也可按习惯选「智能」
   - **执行权限**：
     - 想让 Bot 直接只读查本机日志自动排错：选「完全访问」（⚠️ **仅限个人私有群，切勿拉外人进群**）
     - 希望更保守：选「工作区可写」
3. 进群后直接发消息即可。

---

## 安全提醒

- **私密群原则**：开启「完全访问」的群仅限本人或完全信任的成员使用；面向团队多人答疑请单独建「只读」群。
- **不碰生产环境**：排错严格只读，不会擅改 `~/.vonvon-bot` 或重启后台服务。
- **脱敏与打码确认**：公开提交任何 Issue、评论或截图前，都会先脱敏并展示完整预览由你确认。

## 仓库维护校验

```bash
node scripts/sync-skills.mjs
node scripts/sync-skills.mjs --check
```
