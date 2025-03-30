# Clippy - 跨平台剪贴板同步工具

Clippy 是一个基于 Tauri v2 和 Vue 3 的跨平台剪贴板同步应用，允许在不同设备间无缝共享文本和图片。

[Clippy Web Demo](https://clippy.oopstls.com)

## 功能特点

- 📋 **剪贴板同步**：在不同设备间实时同步剪贴板内容
- 🖼️ **多媒体支持**：支持共享文本和图片
- 🔥 **实时通信**：基于 Socket.io 的即时数据传输
- ⌨️ **热键支持**：通过热键快速访问功能
- 🌐 **跨平台**：基于 Tauri 支持跨平台应用，基于 Vue 3 的 Web 页面可以作为云剪切板使用

## 构建说明

```bash
# 克隆仓库
git clone https://github.com/oopstls/clippy-client

# 安装依赖
npm install

# 开发模式运行 Web 
npm run dev

# 构建 Web 生产版本
npm run build

# 开发模式运行 Tauri App
npm run tauri dev

# 构建 Tauri App 客户端
npm run tauri build
```

## 界面截图
![](https://raw.githubusercontent.com/oopstls/PicBed/refs/heads/master/project/clippy-client.png)

### 服务端

[clippy-server](https://github.com/oopstls/clippy-server)