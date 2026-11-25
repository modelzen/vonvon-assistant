---
name: vonvon-diagnose
description: 系统化只读排查 Vonvon Bot 本地运行问题，包括 daemon 无法启动、飞书长连接断开、不回消息、卡片显示/更新异常、卡片回调失败、Codex/Claude 后端不可用、权限沙箱拦截、远程连接异常等。用户贴报错截图/日志或说「排错」「排查一下」「不回消息」「启动失败」「连不上」「显示异常」「帮我看看哪里出问题了」时先读本 skill。
---

# Vonvon Bot 本地问题排错（只读诊断）

本 Skill 负责系统化定位用户的 Vonvon Bot 本地问题，区分「本地环境/配置问题」「`dev` 已修复问题」与「已确认的代码 Bug」，并在定位结束后**主动把用户引导到下一步（验证恢复或转入反馈）**。

## 第零步：初始化闸门（必检，不可跳过）

开始排错前，必须先检查 `workspace/setup-state.json` 是否存在：
- **如果不存在**：先停止直接排错，立即转入 `vonvon-setup`——在同一轮内承接用户异常、一口气做完只读体检并给出 A / B 档位选项，初始化完立刻回到这里继续排查。仅在用户明确表示「本次先跳过」时，才直接进入下方排查。
- **如果已存在**：读取其中的 `repoPath`（默认 `workspace/vonvon-bot`），继续排查。

## 绝对安全红线（执行任何命令前必守）

1. **只读排查**：绝不修改、覆盖或删除 `~/.vonvon-bot/`（或 `VONVON_HOME`）下的任何文件，绝不擅自停止、重启、重装或卸载用户的生产 daemon / 系统服务。
2. **严禁触碰密钥与凭据**：绝不读取、打印或复制以下敏感文件：
   - `~/.vonvon-bot/master.key`
   - `~/.vonvon-bot/secrets.enc`
   - `~/.vonvon-bot/.keystore.salt`
   - `~/.vonvon-bot/local-credential`
   - `~/.vonvon-bot/device.json`
   - `~/.vonvon-bot/clients.json`
3. **敏感信息即查即脱敏**：展示日志摘录时，立即屏蔽 `cli_` / `ou_` / `oc_` 标识、Token、API Key、内网地址或私密群聊正文。

## 第一步：收集现象与自动适配排查模式

先用最少问题明确现象（用户若已提供报错/截图则直接跳过已明确的部分，**记住用户上传的现象截图路径，方便后续反馈直接复用**）：
- 出错的是哪一环？（安装启动 / 飞书收发消息 / 卡片渲染与交互 / Codex 或 Claude 执行 / 沙箱权限 / 远程连接 / 升级）
- 发生时间、操作步骤、预期与实际结果。
- 是本机运行还是连接远程 Linux 服务器？

然后按当前群权限自动适配诊断模式：

- **模式 1（可直接只读查看本机环境与日志，通常是完全访问档）**：
  - 直接执行安全只读命令采集环境信息与近期日志，重点筛选 `error` / `warn` 及出问题时间段前后上下文。
  - 注意：**即使在完全访问档下，也不要绕过群会话约束去读 `local-credential` 伪装主人连 daemon**；只读取日志文件和运行常规系统检查命令即可。
- **模式 2（受沙箱/群令牌限制，无法读取 `~/.vonvon-bot/` 或调用 `vonvon daemon status`）**：
  - 简短说明这是 Vonvon Bot 的正常沙箱隔离机制；
  - 按用户系统（macOS/Linux 或 Windows PowerShell）给出 **2～4 条安全、只读、可直接复制的终端命令**，请用户在终端运行后把脱敏输出贴回来。

### 常用安全只读排查命令参考

**macOS / Linux：**
```bash
uname -a
vonvon daemon status
vonvon service status
vonvon env scan
vonvon bot list
vonvon daemon logs --tail 120
```
日志文件位置（只读且不含密钥文件）：`~/.vonvon-bot/daemon.log` 与 `~/.vonvon-bot/logs/YYYY-MM-DD.log`（保留 7 天）。

**Windows（PowerShell）：**
```powershell
[System.Environment]::OSVersion; [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture
vonvon daemon status
vonvon env scan
vonvon bot list
vonvon daemon logs --tail 120
```
日志位置：`"$env:USERPROFILE\.vonvon-bot\daemon.log"` 与 `"$env:USERPROFILE\.vonvon-bot\logs\YYYY-MM-DD.log"`。

## 第二步：按故障域逐层定位根因

对照本地源码（`workspace/vonvon-bot/packages/daemon/src/`、`packages/protocol/src/` 等）与官方文档（`https://vonvon.cc/docs/troubleshooting/`）精准核对，避免猜测：

1. **Daemon 启动、进程锁与后台服务**
   - 检查 `daemon.log`：`daemon.pid` 锁冲突、端口占用、旧版残留、`service` 注册冲突（macOS launchd `com.vonvon.bot.daemon` / Linux systemd `vonvon-bot.service` 及 `linger` 状态）、崩溃保护暂停（10 分钟内崩溃 3 次触发 `crashPause`）。
2. **飞书连接、权限、卡片与“不回消息”**
   - 核对 Bot 是否在线（`ws.connected` / `ws.reconnecting`）、群是否已绑定、日志是否有 `scopeDenial` 或卡片更新报错（如 CardKit 错误码、组件 ID/容量限制）、卡片回调是否已确认（`vonvon bot callback status`）。
   - 规则模式：查免 `@` 开关、多 Bot 三条底线；智能模式：查判断 `skip`、决策模型密钥、每小时 60 次判断上限（45 次起暂停普通批次）；同时核对“回应谁（响应成员）”白名单。
3. **模型与 Provider 工具链（Codex / Claude / lark-cli）**
   - 检查工具安装、版本兼容性、登录/API Key；Linux Claude 沙箱查 `bwrap`/`socat`/`userns`；Windows Codex 查 ≥ 0.163.0 与 MXC 探测状态。
4. **权限、沙箱与路径边界**
   - `qa` 关网；`qa` / `write` 挡 `.claude/`、`.codex/`、`.mcp.json`、`.agents/skills/` 及 `~/.vonvon-bot/` 敏感路径；Codex 前两档受 `~/.gitconfig` 限制；工作区路径合法性与 `vonvon bot repair-dir`。
5. **远程连接与多设备**
   - 检查 7767 端口监听与网络连通性、配对邀请 10 分钟有效期、客户端是否被撤销（`client_revoked`）、协议版本是否匹配。

## 第三步：核对源码与上游 `dev` 分支

找到具体报错或异常逻辑后，如果本地有 `workspace/vonvon-bot`：
1. 在源码里定位对应报错文案、错误码或逻辑路径，确认是**预期限制**还是**真实代码 Bug**；
2. 若疑似 Bug 且有网络，顺手检查上游 `dev` 分支是否已经修复（如拉取远端 `dev` 提交或查 GitHub 源码，不改动当前检出的工作树）。

## 第四步：输出清晰结论并主动给出下一步选项（绝不冷场！）

给出结构化结论，并在结尾**主动把用户带向下一站**：

1. **根因结论**：明确归类为以下之一：
   - **本地环境/配置问题**（附具体依据）
   - **产品既定行为/权限边界**（附依据与正确用法）
   - **`dev` 分支已修复的已知问题**（说明对应的提交或 PR，建议等待下版更新）
   - **已确认的代码 Bug**（写清复现条件、源码定位文件/行号、脱敏报错依据）
2. **临时绕过或修复步骤**：给出可直接照做的操作（需改配置或重启服务时，说明在终端、客户端或管理员私聊操作；如给出了尚未实测的绕过法，诚实标明“尚未实卡验证”）。
3. **【关键】主动推进下一步（给简短可回复选项，绝不干等用户开口）**：
   - **若是安全漏洞**：严格走 `SECURITY.md` 私下报告渠道，禁止公开提 Issue。
   - **若确认是未修复的代码 Bug**：
     1. 顺手查重 `modelzen/vonvon-bot` 已有 Issue（若已查到相同 Open Issue，直接贴出链接，提议去该 Issue 下补充本次复现证据；若无重复，提议新建 Bug Issue）；
     2. 在结尾用明确的短选项引导用户：
        - 无重复时：「这已确认是 Vonvon Bot 的代码 Bug（上游 `dev` 尚未修复），建议提交到 GitHub 让维护者跟进。回复 **帮我反馈上去**，我马上帮你整理好脱敏带图的 Issue 预览给你核对；如果先用绕过方案，回 **先不用** 即可。」
        - 命中已有 Issue 时：「上游已有同一缺陷记录 `#<编号>`，建议把你当前正式版的复现截图和脱敏报错补到评论里帮助定位。回复 **帮我补充到 #<编号>**，我先整理好脱敏带图评论给你确认；不需要的话回 **先不用**。」
   - **若是本地配置/环境问题**：结尾提示「按上面步骤操作完后，回复 **帮我复查**，我再帮你核对日志确认已恢复正常。」
   - **若是产品体验局限**：主动问「要不要我把这个问题整理成一份功能优化建议提交到 GitHub？回复 **帮我整理成 Issue** 就行。」
