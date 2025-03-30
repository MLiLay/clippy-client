# Clippy - 跨平台剪贴板同步工具

Clippy 是一个基于 Tauri v2 和 Vue 3 的跨平台剪贴板同步应用，允许在不同设备间无缝共享文本和图片。

## 功能特点

- 📋 **剪贴板同步**：在不同设备间实时同步剪贴板内容
- 🖼️ **多媒体支持**：支持共享文本、图片和文件
- 🔥 **实时通信**：基于 Socket.io 的即时数据传输
- 🔒 **安全可靠**：本地存储您的剪贴板历史
- ⌨️ **快捷键支持**：通过快捷键快速访问功能
- 🌐 **跨平台**：支持 Windows、macOS 和 Linux

## 技术栈

### 客户端
- **前端框架**：Vue 3 + TypeScript
- **状态管理**：Pinia
- **UI 组件**：Vant + TailwindCSS
- **桌面应用**：Tauri 2.0
- **图标**：FontAwesome

### 服务端
- **运行环境**：Node.js
- **数据库**：SQLite (better-sqlite3)
- **实时通信**：Socket.io
- **开发语言**：TypeScript

## 安装说明

### 客户端

```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建生产版本
npm run build

# 启动 Tauri 应用
npm run tauri dev
```

### 服务端

```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建生产版本
npm run build

# 直接运行
node dist/index.js

# 使用 PM2 运行（推荐用于生产环境）
npm install pm2 -g
pm2 start dist/index.js --name "clippy"
```

## 配置说明

服务端配置位于 `server/src/config.ts` 文件中，您可以根据需要修改端口等设置。

## 使用方法

1. 启动服务端应用
2. 在所有需要同步剪贴板的设备上启动客户端应用
3. 使用全局快捷键（默认为 `Ctrl+Shift+V`）打开剪贴板历史
4. 复制内容将自动同步到所有连接的设备

## 贡献指南

欢迎提交 PR 或 Issue 来帮助改进 Clippy！

## 开源协议

本项目采用 ISC 许可证
