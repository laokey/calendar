# 芝麻日历 · Uni-Push 推送完整实现手册

> 版本：V1.0
> 适用端：iOS（App Store 已上架） + Android
> 技术栈：UniApp 3 + Uni-Push 2.x（个推服务端）

---

## 一、整体流程总览

一套完整可用的 Uni-Push 推送包含 **6 个部分**，缺一不可：

```
┌────────────────────┐     ┌─────────────────────┐    ┌────────────────────┐
│ 1. App 端接入推送   │────▶│  2. 后端绑定用户 CID │───▶│  3. 后端调用 DCloud │
│ (CID/alias/tags)    │     │ (bindPushInfo 接口)  │    │ REST API 发消息    │
└────────────────────┘     └─────────────────────┘    └────────────────────┘
          │                                                        │
          ▼                                                        │
┌────────────────────┐     ┌─────────────────────┐    ┌────────────────────┐
│ 4. DCloud 开发者后台 │◀────│  5. Apple 推送证书    │◀───│ 6. 打包云打包签名   │
│    配置证书/推送     │     │   (p12 / p8 .key)   │    │ (BundleId 一致)     │
└────────────────────┘     └─────────────────────┘    └────────────────────┘
```

---

## 二、客户端：当前项目已经做了什么

### 2.1 新增核心模块
- 推送管理模块：[utils/push.js](../utils/push.js)
  - `initPush()`：启动时请求 iOS 授权 + 获取 CID + 绑定 alias/tags + 上报后端
  - `getPushClientId()`：获取个推 CID（含缓存重试）
  - `setPushAlias(alias)`：把当前用户的 userId 绑定为 alias（后端可按 alias 发消息）
  - `setPushTags(tags)`：设置标签（平台、语言、邮箱、uid）
  - `handleOnlinePush(res)`：**在线时收到透传消息，自动用 `uni.createPushMessage` 生成本地通知**（否则用户看不到）
  - `handlePushClick(res)`：点击通知 → 按 `target / url / id` 跳对应详情页
  - `dispatchPushBusiness(data)`：统一的业务路由分发（event/task/reward/card/gallery/sync 等）
  - `clearPushBindingOnLogout()`：退出登录时解绑 alias/tags + 清缓存
  - `reportPushInfoToBackend()`：调用后端 `/calendar/app/bindPushInfo` 存映射

### 2.2 App.vue 接入
- [App.vue](../App.vue) 已经在：
  - `onLaunch`：注册事件监听（`uni.onPushMessage` + `uni.onPushClick` + 兜底 `plus.push.addEventListener`），然后调用 `initPush()`
  - `onShow`：如果已登录，刷新 alias/tags 绑定

### 2.3 manifest.json 补齐
- [manifest.json](../manifest.json) 已经：
  - 开启 `modules.Push` 和 `sdkConfigs.push.unipush.version=2`
  - iOS 端：
    - 新增 `bundleId`（当前占位：`com.zmkhai.calendar`，请替换成你们真实的）
    - 新增 `UIBackgroundModes: [remote-notification, fetch]`（保证后台静默推送、VoIP、内容可用）
    - 新增 `capabilities.entitlements.aps-environment = production`（生产环境推送）
    - 新增 `NSUserNotificationUsageDescription` + `NSLocalNotificationUsageDescription`（App Store 审核必须）
  - Android 端：
    - 已经声明 `POST_NOTIFICATIONS`（Android 13+ 动态通知权限）
    - `registerAndroidNotificationChannel()` 在 init 时自动建通道（日程提醒高优先级）

---

## 三、必须让后端做的 3 件事

### 3.1 新增 / 补齐后端接口：`bindPushInfo`

#### 接口定义
```
POST /calendar/app/bindPushInfo
Content-Type: application/x-www-form-urlencoded
```

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `token` | string | 是 | 登录 Token |
| `cid` | string | 是 | 个推客户端 ID（`uni.getPushClientId` 拿到的） |
| `alias` | string | 是 | 别名，当前固定 = `userId`（后端可直接按这个发） |
| `tags` | string | 否 | 英文逗号分隔的标签：`uid_xxx,platform_ios,lang_zh_cn,email_xxx` |
| `platform` | string | 否 | `ios / android` |
| `appVersion` | string | 否 | App 版本号（如 1.0.0） |
| `brand` | string | 否 | Apple / HUAWEI / Xiaomi 等 |
| `model` | string | 否 | iPhone 15 Pro 等 |
| `osVersion` | string | 否 | 17.5.1 / Android 14 等 |
| `sdkVersion` | string | 否 | Uni 运行 SDK 版本 |
| `deviceId` | string | 否 | 设备唯一标识 |

#### 返回示例
```json
{ "code": 200, "message": "ok", "data": { "bound": true } }
```

#### 后端存储建议表
```sql
CREATE TABLE IF NOT EXISTS `t_push_device` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` VARCHAR(64) NOT NULL COMMENT '用户ID',
  `cid` VARCHAR(128) NOT NULL COMMENT '个推客户端ID',
  `alias` VARCHAR(64) DEFAULT NULL COMMENT '别名=userId',
  `tags` VARCHAR(512) DEFAULT NULL,
  `platform` VARCHAR(16) DEFAULT NULL,
  `app_version` VARCHAR(32) DEFAULT NULL,
  `brand` VARCHAR(32) DEFAULT NULL,
  `model` VARCHAR(64) DEFAULT NULL,
  `os_version` VARCHAR(32) DEFAULT NULL,
  `device_id` VARCHAR(128) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` TINYINT DEFAULT 1 COMMENT '1=有效 0=失效',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cid` (`cid`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

---

### 3.2 新增后端接口：`unbindPushInfo`
```
POST /calendar/app/unbindPushInfo
```
- 仅需参数：`token` + 可选 `cid`
- 作用：把该用户对应 cid 记录标记 `status=0`，避免退出登录后还继续推送
- 前端 `logout()` 时调用

---

### 3.3 后端：调用 DCloud（个推）REST API 发推送

Uni-Push 后端调用地址（个推官方文档最新版本）：

```
# 域名：根据应用所属地域选择
国内版：https://restapi.getui.com/v2/<APP_ID>
国际版：https://restapi-zmy.getui.com/v2/<APP_ID>
```

**3.3.1 在 DCloud 开发者后台拿到 4 个参数**
```
AppId:      __UNI__19BA6D3   （manifest.json 里的 appid 字段）
AppKey:     <DCloud 后台 → 应用管理 → 推送配置里查看>
MasterSecret: <同上，只有 MasterSecret 能签名 REST API>
```

**3.3.2 个推 REST API 签名流程（必做）**
1. 调 `POST /auth` 用 `AppKey + timestamp + sha256(MasterSecret)` 拿到临时 token
2. 调下面 3 个业务接口都要带这个 token

**3.3.3 后端常用 4 个接口**

| 场景 | 接口 | 说明 |
|---|---|---|
| 给某个人发（按 userId=alias） | `POST /push/single/alias` | 最常用 |
| 给一批 userId 发 | `POST /push/single/batch/alias` | 列表任务 |
| 按标签 / 全员推送 | `POST /push/all` 或 `push/tag` | 运营通知 |
| 对单个 CID 发测试 | `POST /push/single/cid` | 联调测试 |

**3.3.4 「按 alias 单推」请求体示例（最常用）**
```json
{
  "request_id": "xxx唯一ID",
  "audience": { "alias": ["10086"] },
  "settings": {
    "ttl": 86400000,
    "strategy": { "default": 2, "ios": 4, "st": 4, "hw": 4, "xm": 4, "vv": 4, "mz": 4, "op": 4 }
  },
  "push_message": {
    "transmission": "{\"title\":\"你有新任务啦\",\"content\":\"数学作业：P12-P15\",\"payload\":{\"target\":\"task\",\"id\":\"20240101123\"}}"
  },
  "push_channel": {
    "android": {
      "ups": {
        "notification": {
          "title": "你有新任务啦",
          "body": "数学作业：P12-P15",
          "channel_id": "default",
          "click_type": "intent"
        }
      }
    },
    "ios": {
      "type": "notify",
      "payload": "{\"target\":\"task\",\"id\":\"20240101123\"}",
      "aps": {
        "alert": { "title": "你有新任务啦", "body": "数学作业：P12-P15" },
        "badge": 1,
        "sound": "default",
        "content-available": 0
      },
      "multimedia": []
    }
  }
}
```

> **关键提示：**
> - `alias` 必须和前端 `setPushAlias(userId)` 绑定的完全一致（注意类型，推荐统一字符串）
> - `transmission`（透传） + `push_channel.ios.aps.notify`（通知）要**同时**发，这样在线离线都能收到
> - `payload` 字段会传给前端，前端 `handlePushClick` 会解析 `target + id` 自动跳页

---

## 四、iOS 端：必须完成的 Apple & DCloud 配置（App Store 已上架版）

### 4.1 确认 4 点一致
必须完全一致，否则 iOS 推送 100% 收不到：
1. Apple 开发者中心的 **App ID / Bundle Identifier**
2. Xcode 打包 / HBuilderX 云打包时填的 **BundleId**
3. manifest.json 的 `app-plus.distribute.ios.bundleId`
4. DCloud 后台上传的 **推送证书 (p12) 对应同一个 App ID**

### 4.2 Apple 开发者中心操作步骤

1. 登录 <https://developer.apple.com/account>
2. 进入 `Identifiers` → 找到你们的 App ID（比如 `com.zmkhai.calendar`）
3. 勾选 **Push Notifications** capability（如果没勾，勾上 Save）
4. 分别生成两种证书：
   - **Development SSL Certificate (Sandbox)**: 真机调试用
   - **Production SSL Certificate (Production/Release)**: App Store 正式包用
5. 把生成的 `.cer` 双击导入 Keychain，然后在"我的证书"里**展开私钥 → 右键导出 .p12**，设置密码（DCloud 后台要）
6. （推荐最新做法）也可以改用 **APNs Auth Key (.p8)**，不需要每年续签，强烈推荐：
   - Keys → + → 勾选 **Apple Push Notification service (APNs)** → 生成，下载 `AuthKey_XXXXXX.p8`，保存 Key ID
   - Team ID 在 Apple 后台 Membership 里可以看到

### 4.3 DCloud 开发者后台上传证书
1. 登录 <https://dev.dcloud.net.cn>
2. 找到「应用列表 → 芝麻日历（`__UNI__19BA6D3`）」
3. 进入「Uni-Push → 推送配置 → iOS 推送」
4. 选择上传：
   - **方式 A（证书，旧）**：分别上传 Development p12 + Production p12，填密码
   - **方式 B（p8，推荐）**：填写 BundleId、Team ID、Key ID、上传 AuthKey_xxx.p8（不用每年签）
5. 勾「生产环境」，保存

### 4.4 打包 & Capabilities
- 在 HBuilderX 云打包（或自定义基座）时，iOS 的 `profile.mobileprovision` 必须是：
  - **带 Push Notifications capability 的描述文件**（要么是 App Store Distribution，要么是 Development Ad-Hoc）
- manifest.json 已经加了：
  ```json
  "capabilities": { "entitlements": { "aps-environment": "production" } }
  ```
  开发调试时可临时改成 `development`（发布 App Store 必须 `production`）

---

## 五、Android 端：厂商通道（可选但强烈推荐）
国内 Android 厂商（华为/小米/OPPO/VIVO/魅族）App 被杀后台后，个推在线链路会断，必须用厂商通道：

1. 分别去华为 HMS/小米开放平台/OPPO 开放平台/VIVO 开放平台申请应用
2. 打开 Push 能力，拿到 `AppId/AppKey/AppSecret`
3. 去 DCloud 后台「Uni-Push → 推送配置 → Android 推送」填进去
4. manifest.json 的 `sdkConfigs.push.unipush` 把 `offline` 改为 `true`（项目里目前是 `false`）

---

## 六、后端推送 payload 规范（前端已按这个解析）

### 6.1 「业务跳转」字段
后端只要在 `payload`（iOS）或 `transmission` 里放这 2 个字段，前端点击通知会**自动跳详情页**：

| 字段 | 示例 | 作用 |
|---|---|---|
| `target` | `event / task / reward / card / gallery / sync / notice / me` | 业务类型 |
| `id` | `1001` | 详情 ID，没有可不传 |
| 或直接传 `url` | `/pages/calendar/event-detail?id=1001` | 直接指定页面路径（优先级更高） |
| `navigateType` | `navigateTo / switchTab / reLaunch / redirectTo` | 跳转方式，默认 navigateTo |

### 6.2 支持的 target 映射
| target 值 | 跳转页面 |
|---|---|
| `event` / `calendar` | `/pages/calendar/event-detail` |
| `add_event` / `event_form` | `/pages/calendar/event-form` |
| `task` / `tasks` | `/pages/tasks/task-detail` |
| `add_task` / `task_form` | `/pages/tasks/task-form` |
| `reward` / `rewards` | `/pages/rewards/index` |
| `add_reward` / `reward_form` | `/pages/rewards/reward-form` |
| `card` / `cards` | `/pages/cards/index` |
| `gallery` / `photo` | `/pages/gallery/index` |
| `sync` | `/pages/sync/sync-home` |
| `notice` | `/pages/me/notice` |
| `me` | `/pages/me/index` (switchTab) |
| `calendar_home` | `/pages/calendar/index` (switchTab) |

---

## 七、联调 Checklist（按这个顺序 100% 能调通）

- [ ] manifest.json 里 `bundleId` 跟 Apple App ID 一致
- [ ] Apple 后台 Capabilities 开了 Push Notifications
- [ ] DCloud 后台 iOS 证书/ p8 已上传且通过校验
- [ ] iOS 打包用的 profile 是带 push capability 的 Distribution 包
- [ ] 首次安装 → 系统弹出"允许发送通知"弹框（用户点允许）
- [ ] 接口 `/calendar/app/bindPushInfo` 成功记录 cid + alias
- [ ] 后端按 alias 发推送测试，**透传 + APNs notify**同时发
- [ ] App 在线：能收到本地通知（`uni.createPushMessage` 兜底）
- [ ] App 离线 / 杀掉：能收到系统通知栏推送（iOS = APNs，Android = 个推 + 厂商）
- [ ] 点通知：能正确跳到 `target + id` 指定详情页
- [ ] 退出登录：`unbindPushInfo` 成功，不再收到老账号的推送

---

## 八、常见问题排查

### Q1: iOS 打包成功但完全收不到推送？
- 先按上面第 4.1 核对 4 个 BundleId 是否一字不差
- DCloud 后台证书校验是否通过
- `aps-environment` 是 production 还是 development？要跟你打包环境一致
- 首次安装一定要**点允许通知**，看「系统设置 → 芝麻日历 → 通知」是否开着

### Q2: App 在前台时通知栏看不到？
- **正确的**：iOS 前台系统默认不弹通知栏
- **解决**：客户端已在 `handleOnlinePush` 里做了兜底，收到透传自动 `uni.createPushMessage` 弹本地通知
- 如果还是没弹，查后端是否同时发了 `push_message.transmission`（透传）

### Q3: 点通知跳错页 / 不跳？
- 查后端 payload 里的 `target / id` 是否拼对
- 看前端 [utils/push.js](../utils/push.js) 的 `parseNavigatePayload` 是否命中分支
- 目标页面必须是已在 `pages.json` 里注册的页面

### Q4: Android 杀后台就收不到？
- 按「第五步」打开厂商通道
- manifest 的 `sdkConfigs.push.unipush.offline` 改成 `true`（当前是 false）
- 手动给 App 打开「自启动 / 后台弹窗 / 锁定最近任务」等权限

### Q5: alias 绑定失败 / 推送报 alias 不存在？
- 前端登录成功后立即 `refreshPushBindingForCurrentUser()` 一次（`onShow` 里做了）
- 后端不要立刻发推送，**登录后等 1~2 秒再发**（个推有个小延迟）

---

## 九、最终交付给后端的「最短接入动作」清单

1. 建表：`t_push_device`（上面 SQL 直接用）
2. 实现 2 个接口：`/calendar/app/bindPushInfo` + `/calendar/app/unbindPushInfo`
3. 在 DCloud 后台开应用、拿 `AppKey / MasterSecret`，写进后端配置
4. 后端实现「按 alias 单推」封装函数，接入业务（任务创建、奖励发放、日程提醒、好友申请等）
5. 联调时先用 DCloud 后台 → 推送预览 → 按 cid 单发测试，确认链路通

---

## 十、后端 payload 模板速查

### 模板 A：日程提醒（跳事件详情）
```json
{
  "title": "日程提醒",
  "content": "明天 10:00 家庭会议",
  "payload": { "target": "event", "id": "EVT20260812001" }
}
```

### 模板 B：任务到期（跳任务详情）
```json
{
  "title": "任务到期",
  "content": "数学作业 P12-P15 今天到期",
  "payload": { "target": "task", "id": "T_10086" }
}
```

### 模板 C：家人送贺卡（跳卡片页）
```json
{
  "title": "💌 妈妈送你一张贺卡",
  "content": "最近表现很棒！继续加油～",
  "payload": { "target": "card", "id": "C_20260812" }
}
```

### 模板 D：好友申请通知（跳用户管理）
```json
{
  "title": "待处理：3 条好友申请",
  "content": "爸爸邀请妈妈加入家庭日历",
  "payload": { "url": "/pages/users/index" }
}
```
