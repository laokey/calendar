# 芝麻日历项目交付文档（代码说明 + 部署配置）

## 1. 文档目的

本文档用于客户交付，说明当前前端项目的代码结构、关键业务逻辑、部署配置项、上线步骤与验收方式，便于后续接手维护、重新打包及正式环境部署。

## 2. 项目概况

- 项目名称：芝麻日历
- 技术栈：UniApp + Vue 3 + Vite + SCSS + vue-i18n
- 应用类型：移动端 App（iOS / Android）
- 当前 AppId：`__UNI__19BA6D3`
- 当前 iOS Bundle ID：`com.zmkhai.calendar`
- 当前 Android Scheme：`zmkhai`
- 当前 Universal Link 域名：`www.zmkhai.com`

## 3. 代码结构说明

### 3.1 主要目录

- `pages/`：业务页面目录，按功能拆分页面
- `components/`：通用组件
- `utils/`：接口封装、状态管理、请求封装、推送、国际化等公共能力
- `public/download/`：下载落地页静态资源
- `public/doc/`：项目说明文档
- `static/`：图片、图标等静态资源
- `manifest.json`：App 原生能力、包信息、打包配置
- `pages.json`：页面路由及页面级配置
- `App.vue`：应用入口，处理启动逻辑、推送监听、外部唤醒逻辑
- `apple-app-site-association`：iOS Universal Link 域名关联文件

### 3.2 主要业务模块

根据当前目录结构，项目主要模块如下：

- `pages/calendar/`：日历与事件管理
- `pages/tasks/`：任务管理
- `pages/gallery/`：相册、图片/视频上传与发送
- `pages/cards/`：贺卡、涂鸦、分享
- `pages/device/`、`pages/add-device/`：设备绑定与激活
- `pages/users/`、`pages/members/`：好友 / 成员管理
- `pages/rewards/`：奖励机制
- `pages/me/`：个人中心、设置、版本信息、权限说明
- `pages/sync/`：日历同步与第三方日历接入
- `pages/activity/`：动态、通知、邀请消息

### 3.3 核心公共代码

- `utils/request.js`
  - 统一封装 HTTP 请求
  - 自动注入登录 Token
  - 统一处理 401 未登录状态
  - 支持请求日志和错误提示

- `utils/apiConfig.js`
  - 控制接口基础地址
  - 生产环境默认接口域名：`https://www.zmkhai.com`
  - 本地开发通过 Vite 代理 `/calendar` 到正式域名

- `utils/api/*.js`
  - 按业务模块拆分接口
  - 当前已包含认证、日历、任务、设备、成员、好友、奖励、同步等接口封装

- `utils/i18n/`
  - 多语言配置
  - 当前包含中文、英文、法语、德语、意大利语、西班牙语、日语等语言包

## 4. 关键业务逻辑说明

### 4.1 应用启动

应用入口位于 `App.vue`，主要职责如下：

- 启动时初始化推送能力
- 监听在线推送与通知点击事件
- 在 App 启动或回到前台时，解析外部唤醒参数
- 若检测到好友邀请参数，则先弹出确认框，再调用好友添加接口

### 4.2 好友邀请 Deep Link / Universal Link 逻辑

这是当前交付中最关键的外部分发能力。

涉及文件：

- `App.vue`
- `public/download/index2.html`
- `manifest.json`
- `apple-app-site-association`
- `utils/api/users.js`

当前逻辑说明：

1. 外部链接访问下载页：`/download/index2.html`
2. 下载页自动识别设备类型
3. Android 优先尝试通过 `zmkhai://calendar` 拉起 App，失败则回退 APK 下载
4. iOS 优先尝试通过 Universal Link 拉起 App，失败则跳转 App Store
5. 下载页会从 URL 中读取 `code` / `inviteCode` / `token`
6. 这些参数会拼接到拉起链接中并透传给 App
7. App 启动后由 `App.vue` 解析参数
8. 若存在邀请 `code`，先弹出“是否确认添加”确认框
9. 用户确认后，调用接口 `/calendar/app/addNewFriendsByLink`

说明：当前实现已避免“外部链接直接自动加好友”，符合确认后再执行的业务要求。

## 5. 当前部署配置

### 5.1 接口域名

- 生产接口地址：`https://www.zmkhai.com`
- 本地开发代理前缀：`/calendar`
- Vite 代理配置文件：`vite.config.js`

### 5.2 Android 配置

配置文件：`manifest.json`

当前关键项：

- 最低系统版本：`minSdkVersion = 24`
- 目标系统版本：`targetSdkVersion = 36`
- Scheme：`zmkhai`
- 图标资源：`static/favicon.png`

说明：

- Android 的 Deep Link 注册依赖 `manifest.json -> app-plus -> distribute -> android -> schemes`
- 当前项目已按 UniApp 官方推荐方式配置，不建议再单独维护自定义 `AndroidManifest.xml`

### 5.3 iOS 配置

配置文件：`manifest.json`

当前关键项：

- Bundle ID：`com.zmkhai.calendar`
- 推送环境：`aps-environment = production`
- Associated Domains：
  - `applinks:www.zmkhai.com`

说明：

- iOS Universal Link 生效，必须同时满足：
  - App 打包配置中已开启 Associated Domains
  - 域名根目录可访问 `apple-app-site-association`
  - 该文件内容中的 `appID` 与 Apple Team ID + Bundle ID 一致

### 5.4 Apple Universal Link 关联文件

文件：`apple-app-site-association`

当前配置：

- `appID`：`W5BHNLRW9R.com.zmkhai.calendar`
- 生效路径：`/download/*`

部署要求：

- 文件应部署到域名根目录
- 推荐访问地址：
  - `https://www.zmkhai.com/apple-app-site-association`
- 返回内容应为 JSON
- 不建议带 `.json` 后缀
- 必须通过 HTTPS 提供访问

### 5.5 下载落地页配置

文件：`public/download/index2.html`

当前关键配置：

- iOS App Store 地址：`https://apps.apple.com/cn/app/id6800324318`
- Android 唤醒地址：`zmkhai://calendar`
- Android APK 下载地址：`https://www.zmkhai.com/download/calendar.apk`

页面职责：

- 根据设备类型决定打开 App 还是下载
- 透传邀请参数
- 作为客户投放链接、邀请链接、二维码扫码入口

## 6. 服务器部署清单

正式部署时，服务器至少需要提供以下资源：

1. App 下载落地页
   - `/download/index.html`

2. Android 安装包
   - `/download/calendar.apk`

3. iOS Universal Link 关联文件
   - `/apple-app-site-association`

4. 后端接口服务
   - `/calendar/*`

## 7. App 打包与发布说明

### 7.1 前端代码打包

本项目为 UniApp 工程，建议通过 HBuilderX 云打包或自定义基座方式构建原生安装包。

打包前需确认：

- `manifest.json` 中的版本号是否正确
- `manifest.json` 中 Android Scheme 是否保留
- `manifest.json` 中 iOS Bundle ID / Associated Domains 是否正确
- App 图标、启动图、权限文案是否已确认

### 7.2 Android 发布

需产出：

- Android APK 或 AAB

重点校验：

- 安装后能正确响应 `zmkhai://calendar`
- 访问下载页时，点击按钮可拉起已安装 App
- 未安装时可正常下载 APK

### 7.3 iOS 发布

需产出：

- iOS 安装包并上架 App Store

重点校验：

- Universal Link 可唤起已安装 App
- 未安装时可跳转到对应 App Store 页面
- `apple-app-site-association` 能被 Apple 正常拉取

## 8. 上线验收清单

建议上线后按以下顺序验收：

1. 访问 `https://www.zmkhai.com/download/index.html`
2. Android 手机点击“下载 / 打开 App”
3. 已安装场景：直接拉起 App
4. 未安装场景：跳转或下载 APK
5. iPhone 打开同一链接
6. 已安装场景：通过 Universal Link 拉起 App
7. 未安装场景：跳转 App Store
8. 访问带邀请参数的链接，例如：
   - `https://www.zmkhai.com/download/index.html?code=123456&token=abc`
9. App 被拉起后出现确认弹窗
10. 点击“确定”后，成功调用好友添加逻辑

## 9. 可交付文件建议

建议向客户同步以下内容：

- 当前前端项目源码
- 本文档
- Android 安装包
- iOS 上架信息或 App Store 下载地址
- 域名服务器部署说明
- 若由客户接手运维，需同步 Apple 开发者账号中的 Associated Domains 配置与证书权限

## 10. 后续维护注意事项

1. 若更换域名，需同步修改以下内容：
   - `manifest.json` 中 Associated Domains
   - `apple-app-site-association`
   - `public/download/index.html`
   - 后端接口基础域名

2. 若更换 iOS App 或重签名，需同步检查：
   - Apple Team ID
   - Bundle ID
   - App Store 下载地址

3. 若更换 Android 包或 Scheme，需同步检查：
   - `manifest.json`
   - 下载落地页中的 `androidLaunchUrl`
   - 外部投放链接和二维码

4. 邀请参数 `code` / `inviteCode` / `token` 为当前好友邀请链路关键字段，任何一端修改都需联动验证。

## 11. 交付结论

当前项目已具备以下交付条件：

- App 端核心业务代码完整
- Android Scheme 唤醒配置已落地
- iOS Universal Link 配置已落地
- 下载落地页已支持参数透传
- 好友邀请链路已改为“用户确认后执行”
- 服务端部署所需静态资源和配置项明确

如客户后续需要二次开发，建议优先从 `pages/`、`utils/api/`、`App.vue` 与 `manifest.json` 四个区域入手。
