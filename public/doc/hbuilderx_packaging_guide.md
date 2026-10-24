# 芝麻日历 HBuilderX 打包文档

## 1. 文档用途

本文档用于指导客户拿到源码后，使用 HBuilderX 打包生成 Android 和 iOS 安装包。

适用项目：

- 项目名称：芝麻日历
- 技术栈：UniApp + Vue 3
- 工程类型：UniApp App 项目

## 2. 打包前准备

### 2.1 必备软件

请先安装以下工具：

- HBuilderX
- Node.js

建议：

- HBuilderX 使用最新版正式版
- Node.js 使用稳定版 LTS

### 2.2 源码导入

拿到源码后，在 HBuilderX 中操作：

1. 打开 HBuilderX
2. 点击 `文件 -> 打开目录`
3. 选择项目根目录 `calendar`
4. 等待 HBuilderX 完成项目识别

项目根目录下应能看到以下关键文件：

- `manifest.json`
- `pages.json`
- `App.vue`
- `package.json`

### 2.3 安装依赖

如果是首次打开源码，建议先安装前端依赖。

在项目根目录执行：

```bash
npm install
```

说明：

- 当前项目依赖较少
- 若 `node_modules` 已完整提供，可跳过此步骤

## 3. 当前项目关键打包配置

当前源码中的主要配置如下：

- App 名称：`芝麻日历`
- AppId：`__UNI__19BA6D3`
- 版本号：`1.1.0`
- 版本编码：`129`
- Android Scheme：`zmkhai`
- iOS Bundle ID：`com.zmkhai.calendar`
- iOS Associated Domains：`applinks:www.zmkhai.com`

以上配置文件位置：

- `manifest.json`

## 4. Android 打包步骤

### 4.1 打开打包入口

在 HBuilderX 顶部菜单操作：

1. 点击 `发行`
2. 选择 `原生App-云打包`

### 4.2 Android 打包参数

进入云打包窗口后，选择：

- 平台：`Android`

根据客户账号和发布方式填写：

- 包名
- 证书
- 签名 alias
- 签名密码
- 版本号
- 版本编码

如果沿用当前源码配置，重点确认：

- Android Scheme 已保留为 `zmkhai`
- 图标资源路径可正常读取
- 版本号与版本编码符合本次发布要求

### 4.3 Android 证书说明

Android 正式包通常需要客户自己的签名证书。

客户需准备：

- `keystore` 文件
- keystore 密码
- alias
- alias 密码

如果客户没有证书：

- 可先用测试证书出测试包
- 正式上架前必须改为客户正式证书

### 4.4 Android 打包完成后验证

生成 APK 或 AAB 后，建议检查：

1. App 能正常安装
2. 首页能正常打开
3. 接口请求正常
4. `zmkhai://calendar` 可以唤起 App
5. 下载页可以正常拉起或下载 APK

特别说明：

- 当前项目 Android 唤醒依赖 `manifest.json` 中的 `schemes`
- 如果改过 Scheme 或原生配置，必须重新云打包完整安装包
- 不能只靠热更新验证 Scheme 是否生效

## 5. iOS 打包步骤

### 5.1 打开打包入口

在 HBuilderX 顶部菜单操作：

1. 点击 `发行`
2. 选择 `原生App-云打包`

### 5.2 iOS 打包参数

进入云打包窗口后，选择：

- 平台：`iOS`

需要客户提供以下资料：

- Apple 开发者账号
- Bundle ID
- 证书
- Provisioning Profile

当前源码默认配置：

- Bundle ID：`com.zmkhai.calendar`

如果客户要切到自己的 iOS 账号，请同步修改或确认：

- `manifest.json` 中的 `bundleId`
- Apple 后台中的 App ID
- Provisioning Profile
- 推送能力
- Associated Domains 能力

### 5.3 iOS Universal Link 说明

当前项目已使用 Universal Link，配置如下：

- 域名：`www.zmkhai.com`
- Associated Domains：`applinks:www.zmkhai.com`

除 HBuilderX 打包外，还必须保证：

1. Apple 开发者后台已开启 Associated Domains
2. 域名下已部署 `apple-app-site-association`
3. 该文件内容与实际 Team ID、Bundle ID 一致

否则即使打包成功，iOS 拉起能力也可能失效。

### 5.4 iOS 打包完成后验证

生成安装包后，建议检查：

1. App 能正常安装
2. 首页能正常打开
3. 推送权限和系统权限提示正常
4. Safari 打开下载页时可正常唤起 App
5. 未安装场景可跳转 App Store

## 6. 打包前建议检查项

每次打包前，建议客户先检查以下内容：

1. `manifest.json` 中 App 名称是否正确
2. `manifest.json` 中版本号是否正确
3. `manifest.json` 中版本编码是否正确
4. Android `schemes` 是否保留为业务需要的值
5. iOS `bundleId` 是否与客户账号一致
6. iOS `Associated Domains` 是否正确
7. App 图标和启动图是否为最终版本
8. 下载页中的下载地址是否为正式地址

## 7. 当前项目相关文件

客户如果需要自行核对配置，可重点查看以下文件：

- `manifest.json`：App 打包配置
- `pages.json`：页面路由配置
- `App.vue`：应用启动逻辑
- `public/download/index2.html`：下载落地页
- `apple-app-site-association`：iOS Universal Link 关联文件

## 8. 常见问题

### 8.1 HBuilderX 能打开项目，但无法打包

通常检查以下几项：

- 是否已登录 HBuilderX 账号
- 是否选择了 `原生App-云打包`
- 证书或 profile 是否缺失
- `manifest.json` 是否存在格式错误

### 8.2 Android 安装后无法通过链接唤起

通常原因：

- 打包后安装的不是最新包
- `schemes` 未正确配置
- 手机里还有旧版安装包

处理建议：

1. 卸载旧包
2. 重新云打包
3. 安装最新 APK 后再测试

### 8.3 iOS 打包成功，但 Universal Link 不生效

通常原因：

- Apple 后台未开启 Associated Domains
- `apple-app-site-association` 未正确部署
- Bundle ID 和 Team ID 不匹配
- 安装包使用的 profile 不正确

## 9. 交付建议

建议交付给客户以下打包资料：

- 项目源码
- 本文档
- Android 签名证书说明
- iOS 证书 / Profile 配置说明
- 正式下载地址
- 域名部署说明

## 10. 补充说明

如果客户只需要重新出测试包，按本文档直接在 HBuilderX 云打包即可。

如果客户需要正式上架，请重点确认以下三类信息全部属于客户自己：

- Android 签名证书
- Apple 开发者账号与证书
- 域名与 Associated Domains 配置
