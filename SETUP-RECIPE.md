# Vonvon 助手群一键配置配方（供 Bot 私聊读取）

> **给用户看**：把这篇文档（或它的链接）直接发给你自己的 Vonvon Bot **私聊**，然后说一句「照这份配方帮我建一个 Vonvon 助手群」。
>
> **给 Bot 看**：你是管理员私聊中的 Vonvon Bot，具备内置 `vonvon-config` Skill。本配方**只负责把群建起来并绑定本仓库**；其余所有工作前预准备（拉取 `vonvon-bot` 源码、替换地址、按需装 `gh` 等）全部留给进群后的 `vonvon-setup` Skill 交互式完成。**不要跳过确认，不要改动其他无关的群或 Bot。**

---

## 第一步：向主人确认 4 个选项（一次问清）

在动手前，向主人简短确认以下 4 项（括号内为推荐默认值，主人说“按默认来”就直接采用）：

1. **存放目录**：把 `vonvon-assistant` 仓库放在本机哪里？（默认 `~/vonvon-assistant`；如果主人本机已经克隆过，请让主人提供绝对路径）
2. **模型后端（`--tool`）**：用 `codex` 还是 `claude`？（先用 `vonvon env scan` 看本机哪些后端可用，只推荐已配置可用的）
3. **会话方式（`--conversation`）**：
   - 推荐 `multi`（多会话：在主区 `@` 就开新话题，一个问题一条独立会话，不依赖决策模型）
   - 也可选择 `smart`（智能模式：主区可直接聊天，由 Bot 判断何时接话和开话题）
4. **群执行权限（`permission.mode`）**：
   - `full`（完全访问）：支持 Bot 直接只读查本机日志与环境自动排错、命令行提 Issue。**务必向主人明确提醒：完全访问群里，群成员等于本机主人，此群只应保留主人自己，不要拉外人进群。**
   - `write`（工作区可写）：更保守；支持答疑、查重、由 Bot 给出安全排错命令请主人贴输出、生成预填 Issue 链接。

---

## 第二步：准备主工作区目录

如果主人还没有把 `vonvon-assistant` 克隆到本地：

- 优先从主人发来的文档链接中自动识别仓库地址；否则默认使用 `https://github.com/modelzen/vonvon-assistant.git`；
- 克隆到选定路径（例如 `~/vonvon-assistant`）：
  ```bash
  git clone https://github.com/modelzen/vonvon-assistant.git ~/vonvon-assistant
  ```
- 确认目标目录下存在 `.agents/skills/`（或 `.claude/skills/`）和 `AGENTS.md` / `CLAUDE.md`。

---

## 第三步：创建并配置飞书群

> 命令路径请按 `vonvon-config` 的说明，优先使用 `"$VONVON_CLI"`（PowerShell 用 `& $env:VONVON_CLI`）。

1. **查看当前 Bot 列表**（若本机有多个 Bot，确认主人要用哪一个，以下用 `--bot <Bot名>`，仅一个 Bot 时可省略）：
   ```bash
   "$VONVON_CLI" bot list
   ```

2. **创建飞书群并绑定主工作区**（注意：`vonvon group create` 创建的群默认就是 `full` 完全访问权限）：
   ```bash
   "$VONVON_CLI" group create "Vonvon 助手" \
     --folder ~/vonvon-assistant \
     --tool <codex|claude> \
     --conversation <multi|smart>
   ```
   > 如果主人希望绑定一个**已有的仅限自己使用的飞书群**，请先让主人在飞书里把 Bot 拉入该群，用 `vonvon group pending` 查到群 ID（`oc_...`）后，改用 `vonvon group bind <groupId> --folder ~/vonvon-assistant --tool <codex|claude> --conversation <multi|smart>`。

3. **按主人选择设置执行权限**（`group create` 默认是 `full`；`group bind` 默认是 `qa`。若与主人选择不同，则调整）：
   ```bash
   # 如果主人选了工作区可写：
   "$VONVON_CLI" settings set --group "Vonvon 助手" permission.mode=write

   # 如果用 group bind 且主人明确确认要完全访问（仅限个人群）：
   "$VONVON_CLI" settings set --group "Vonvon 助手" permission.mode=full
   ```

4. **写入本群的补充职责（`role.supplement`）**（注意换行必须使用 JSON 双引号字符串）：
   ```bash
   "$VONVON_CLI" settings set --group "Vonvon 助手" role.supplement='"你是 Vonvon Bot 专属助手，负责在当前群里全程主动引导主人完成 4 件事：预准备与更新（vonvon-setup）、问题答疑（vonvon-qa）、本地问题排错（vonvon-diagnose）、高质量问题与功能反馈提 Issue（vonvon-feedback）。\n\n最高优先级规则：\n0. 【首次必检且一步到位】每条新话题第一轮必须先检查是否存在 workspace/setup-state.json。只要不存在，绝不跳过初始化，也不要只发一句「我先检查一下」停住：一口气做完只读体检，在同一条回复里承接主人消息、提示群未初始化并直接给出 A / B 档位选项。\n1. 【全程主动引导】主人是被引导的一方。每个阶段结束后必须主动给出 1～2 个简短可直接回复的下一步选项。答疑或排错一旦确认是未修复的代码 Bug（非安全漏洞）或聊出清晰功能需求，绝不停在结论冷场，必须主动引导转入 vonvon-feedback 查重并整理反馈。\n2. 【反馈自检与默认带图】无论新建 Issue 还是给已有 Issue 补发复现评论，起草前必须主动把关清晰度（补齐边界条件、验收例子、源码定位）不要等主人问要不要优化；只要话题里主人发过截图或录屏，默认裁剪脱敏并带图预览，绝不擅自改成纯文字；并统一附来源署名。\n3. 【只读安全与预览打码】严禁读取或泄露 ~/.vonvon-bot 中的密钥与凭据文件；排错保持只读，不擅改生产配置或重启服务；提交任何公开 Issue 或评论前必须脱敏并展示完整文字与图片/视频预览，提示主人检查敏感信息并按需打码，确认后再提交。"'
   ```

5. **核对配置**：
   ```bash
   "$VONVON_CLI" group show "Vonvon 助手"
   "$VONVON_CLI" settings get --group "Vonvon 助手"
   ```
   确认工作区路径、会话方式、权限档位、以及 4 个 Skill 已出现在群设置中。

---

## 第四步：进入群聊运行 `vonvon-setup`

配置核对无误后，向主人汇报群名、工作区路径、后端、会话方式与权限档位（如为 `full` 再次提醒勿拉外人），并引导主人打开 **「Vonvon 助手」** 群发一句：

> **开始初始化**

进群后的所有前置准备（拉源码、替换地址、按需装 `gh` 等）均由 `vonvon-setup` 交互式完成。
