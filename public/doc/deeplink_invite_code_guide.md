# 邀请拉起代码说明

## 1. 功能目标

本方案用于实现“好友邀请链接 -> 下载页 -> 拉起 App -> 弹出确认框 -> 调用加好友接口”的完整链路。

当前支持两类入口：

- Android 通过 `zmkhai://` Scheme 拉起 App
- iOS 通过 Universal Link 拉起 App

核心要求：

- 不自动加好友
- 必须先弹出确认框
- 用户确认后才调用 `/calendar/app/addNewFriendsByLink`

## 2. 关键文件

### 2.1 下载页

文件：

- `public/download/index2.html`

作用：

- 判断设备类型
- 读取当前下载页 URL 里的 `code`、`inviteCode`、`token`
- 将邀请参数透传给 Android Scheme 或 iOS Universal Link
- 拉起失败时回退到 APK / App Store

关键配置：

```js
const CONFIG = {
    iosUniversalLink: "https://www.zmkhai.com",
    iosAppStore: "https://apps.apple.com/cn/app/id6800324318",
    androidLaunchUrl: "zmkhai://calendar",
    androidApk: "https://www.zmkhai.com/download/calendar.apk"
};
```

关键逻辑：

1. `getInviteParamsFromLocation()`
   - 从当前页面地址读取 `code` / `inviteCode` / `token`

2. `appendQueryParams(url, params)`
   - 把邀请参数拼到拉起链接后面

3. Android
   - 生成 `zmkhai://calendar?code=xxx&token=xxx`
   - 先尝试拉起 App
   - 未切后台则回退下载 APK

4. iOS
   - 生成 `https://www.zmkhai.com/download/index2.html?code=xxx&token=xxx`
   - 通过 Universal Link 唤起 App
   - 未拉起则跳 App Store

## 3. App 侧处理

文件：

- `App.vue`

作用：

- 在冷启动 `onLaunch` 和热启动 `onShow` 中捕获邀请参数
- 先弹确认框
- 用户确认后调用接口加好友

### 3.1 参数提取

关键函数：

- `assignInviteParam(target, key, value)`
- `readInviteParamsFromUrl(url, target)`
- `extractInviteParams(options)`

支持的参数来源：

- `options.query`
- `options.path`
- `options.url`
- `options.href`
- `options.scene`
- `plus.runtime.arguments`
- `plus.runtime.launcher`

支持的参数名：

- `code`
- `inviteCode`
- `token`

其中：

- `code` 是必须字段
- `token` 目前只用于生成防重签名，不直接参与接口提交

### 3.2 确认弹窗

关键函数：

- `confirmAndAddFriendByInvite(params)`

逻辑：

1. 没有 `code` 直接返回
2. 根据 `token|code` 生成签名，做短时间防重复处理
3. 弹出 `uni.showModal`

弹窗文案：

- 标题：`提示`
- 内容：`收到好友邀请，是否确认添加？`

用户选择：

- 取消：直接结束，不调用接口
- 确定：进入接口请求

### 3.3 接口调用

确认后调用：

- `usersApi.addNewFriendsByLink({ code })`

成功处理：

- 再弹一次成功提示：`添加好友成功`
- 跳转到 `pages/users/index?tab=pending`

失败处理：

- `201` -> `用户不存在`
- `202` -> `邀请码无效`
- `203` -> `添加好友失败`
- 其他错误 -> 使用后端返回消息或默认提示

### 3.4 启动时机

入口：

- `onLaunch((options) => { handleUniversalInvite(options) })`
- `onShow((options) => { handleUniversalInvite(options) })`

说明：

- 兼容冷启动和热启动
- 使用 `invitePromptState` 做去重，避免连续触发两次弹窗

## 4. Android Scheme 配置

文件：

- `manifest.json`

配置位置：

```json
"app-plus": {
  "distribute": {
    "android": {
      "schemes": ["zmkhai"]
    }
  }
}
```

说明：

- 当前项目是老 `uni-app`
- Android Scheme 采用官方支持的 `schemes` 配置
- 不再依赖自定义 `intent-filter` 注入邀请 Scheme

## 5. 参数流转示例

假设访问下载页：

```text
https://www.zmkhai.com/download/index2.html?code=123456&token=abc
```

Android 实际拉起链接：

```text
zmkhai://calendar?code=123456&token=abc
```

iOS 实际拉起链接：

```text
https://www.zmkhai.com/download/index2.html?code=123456&token=abc
```

App 接收到参数后：

1. 解析出 `code=123456`
2. 弹出“收到好友邀请，是否确认添加？”
3. 用户确认后调用加好友接口

## 6. 当前限制

1. Android 是否能成功拉起，最终取决于云打包产物是否正确注册了 `zmkhai` Scheme
2. iOS Universal Link 是否成功，取决于：
   - `Associated Domains`
   - AASA 文件
   - 已安装包是否为最新包
3. 当前接口提交时只传 `code`，未向后端额外传 `token`

## 7. 推荐后续

1. 云打包后解 APK 检查最终 Scheme 是否写入
2. 给下载页增加日志打点，区分“拉起成功 / 回退下载”
3. 让后端生成标准邀请下载链接，避免前端手工拼参数
