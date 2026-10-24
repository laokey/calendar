# 邀请拉起部署文档

## 1. 部署目标

完成以下能力上线：

- 下载页支持 Android / iOS 自动分流
- Android 已安装时可通过 `zmkhai://` 拉起 App
- iOS 已安装时可通过 Universal Link 拉起 App
- 拉起后 App 能解析 `code`、`token`
- 用户确认后完成好友添加

## 2. 发布前检查

### 2.1 前端代码

确认以下文件已包含最新逻辑：

- `public/download/index2.html`
- `App.vue`
- `manifest.json`

### 2.2 下载资源

确认以下资源可访问：

- Android APK：`https://www.zmkhai.com/download/calendar.apk`
- 下载页：`https://www.zmkhai.com/download/index2.html`

### 2.3 邀请链接格式

推荐统一使用：

```text
https://www.zmkhai.com/download/index2.html?code=123456&token=abc
```

说明：

- `code`：邀请码，必传
- `token`：当前业务里可选，但建议一并携带，便于去重和后续扩展

## 3. Android 部署

### 3.1 manifest 配置

当前项目使用老 `uni-app`，Android Scheme 必须配置在：

- `manifest.json -> app-plus -> distribute -> android -> schemes`

当前配置：

```json
"schemes": ["zmkhai"]
```

### 3.2 打包要求

Android Scheme 改动后，必须：

1. 重新云打包完整 APK
2. 卸载手机旧包
3. 安装新 APK

注意：

- 不是热更新
- 不是普通真机运行
- 必须安装新的云打包产物

### 3.3 下载页配置

`public/download/index2.html` 中需要确认：

```js
androidLaunchUrl: "zmkhai://calendar",
androidApk: "https://www.zmkhai.com/download/calendar.apk"
```

说明：

- 下载页会自动把当前 URL 里的 `code` / `token` 拼到 `androidLaunchUrl`
- 实际拉起时会变成：
  ```text
  zmkhai://calendar?code=123456&token=abc
  ```

### 3.4 Android 验证命令

安装新 APK 后，在设备上验证：

```bash
am start -a android.intent.action.VIEW -d "zmkhai://calendar?code=123456&token=abc"
```

如果要在电脑 adb 环境验证：

```bash
adb shell am start -a android.intent.action.VIEW -d "zmkhai://calendar?code=123456&token=abc"
```

### 3.5 Android 常见问题

#### 问题 1：执行命令提示 `unable to resolve Intent`

原因通常是：

- APK 不是新打的
- 手机里装的是旧包
- 最终打包产物里没有注册 `zmkhai` Scheme

处理：

1. 确认 `manifest.json` 已配置 `schemes`
2. 重新云打包
3. 卸载旧包再安装

#### 问题 2：点击下载页后直接下载 APK，没有拉起

原因通常是：

- App 未安装
- App 已安装但 Scheme 未生效
- 浏览器拦截了拉起动作

处理：

1. 先用 `am start` 验证系统层能否拉起
2. 再回到下载页验证浏览器行为

#### 问题 3：能打开 App，但没有邀请弹窗

原因：

- 拉起链接里没有 `code`

正确示例：

```text
zmkhai://calendar?code=123456&token=abc
```

## 4. iOS 部署

### 4.1 Universal Link 配置前提

必须同时满足：

1. 苹果开发者后台开启 `Associated Domains`
2. 云打包证书和 profile 正确
3. AASA 文件可访问
4. 安装的是包含最新能力的新包

### 4.2 manifest 配置

当前 iOS 配置在：

- `manifest.json -> app-plus -> distribute -> ios -> capabilities -> entitlements`

关键项：

```json
"com.apple.developer.associated-domains": ["applinks:www.zmkhai.com"]
```

### 4.3 AASA 文件

线上至少保证一个地址可访问：

- `https://www.zmkhai.com/apple-app-site-association`
- `https://www.zmkhai.com/.well-known/apple-app-site-association`

要求：

- 返回 200
- `Content-Type` 建议为 `application/json`
- 文件名不带 `.json`

### 4.4 下载页配置

当前配置：

```js
iosUniversalLink: "https://www.zmkhai.com",
iosAppStore: "https://apps.apple.com/cn/app/id6800324318"
```

说明：

- 下载页会基于当前页面地址重新拼接 `code`、`token`
- 实际跳转会类似：
  ```text
  https://www.zmkhai.com/download/index2.html?code=123456&token=abc
  ```

### 4.5 iOS 验证

建议顺序：

1. 删掉手机旧包
2. 安装新包
3. 用 Safari 打开邀请下载链接
4. 点“打开 App”
5. 观察是否弹出邀请确认框

不要优先用微信内打开测试。

## 5. Nginx / 静态资源部署

### 5.1 下载页

确认 `public/download/index2.html` 已随前端资源发布到：

```text
/download/index2.html
```

### 5.2 APK

确认 APK 放置到：

```text
/download/calendar.apk
```

### 5.3 AASA

如由 Nginx 托管，需保证不被错误重定向或下载。

可参考：

```nginx
location = /apple-app-site-association {
    default_type application/json;
    try_files $uri =404;
}

location = /.well-known/apple-app-site-association {
    default_type application/json;
    try_files $uri =404;
}
```

## 6. 联调流程

### 6.1 Android 联调

1. 生成邀请下载链接：

```text
https://www.zmkhai.com/download/index2.html?code=123456&token=abc
```

2. 手机浏览器打开下载页
3. 点击“打开 App”
4. App 被拉起
5. 弹出确认框：`收到好友邀请，是否确认添加？`
6. 点击“确定”
7. 请求 `/calendar/app/addNewFriendsByLink`
8. 弹出成功提示并跳转待处理列表

### 6.2 iOS 联调

1. 用 Safari 打开同一条邀请下载链接
2. 点击“打开 App”
3. App 被 Universal Link 拉起
4. 弹出确认框
5. 确认后调用接口

## 7. 排障清单

### 7.1 只打开 App，不弹窗

检查：

- 下载页 URL 是否有 `code`
- App 是否拿到了 `plus.runtime.arguments`
- `App.vue` 是否执行了 `handleUniversalInvite`

### 7.2 弹窗出来了，但接口失败

检查：

- `code` 是否有效
- `/calendar/app/addNewFriendsByLink` 是否可用
- 登录态 / token 是否影响后端校验

### 7.3 Android 下载页总是回退下载

检查：

- Scheme 是否注册成功
- 当前浏览器是否拦截拉起
- 是否是旧包

### 7.4 iOS 总是跳 App Store

检查：

- Universal Link 是否生效
- AASA 是否正常
- 新包是否重新安装

## 8. 上线建议

1. 后端统一生成标准邀请下载链接
2. 下载页增加埋点：
   - 页面访问
   - 点击打开 App
   - 拉起成功
   - 回退下载
3. App 增加 deeplink 接收日志，方便排查参数丢失问题
