# 高达模型取件表管理系统

一个用于查看和记录高达模型取件表的网页应用，支持中文界面、响应式设计和深色/浅色模式。

## 功能特点

- 完全中文界面，适合中文用户使用
- 可以手动创建和编辑高达模型信息
- 支持多级取件表结构（主部位-子部位-板件）
- 支持搜索功能，快速查找模型
- 数据导入/导出功能，方便备份和迁移
- 响应式设计，适配手机、平板和桌面设备
- 支持深色/浅色模式切换，默认跟随系统设置

## 技术栈

- HTML5
- TailwindCSS 3.0+（通过CDN引入）
- JavaScript（原生，无框架）
- Font Awesome 图标库
- localStorage 用于数据存储

## 项目结构

## 配置说明

1. 复制配置文件示例：
   ```bash
   cp assets/js/config.example.js assets/js/config.js
   ```

2. 编辑 config.js 文件，填入您的配置信息：
   - GIST_ID：您的GitHub Gist ID
   - GITHUB_TOKEN：您的GitHub Personal Access Token

3. 确保 config.js 文件已被添加到 .gitignore 中

## 获取必要信息

1. 创建GitHub Gist：
   - 访问 https://gist.github.com/
   - 创建新的公开Gist
   - 复制Gist ID

2. 创建GitHub Personal Access Token：
   - 访问 https://github.com/settings/tokens
   - 生成新token，选择"gist"权限
   - 复制生成的token

## 注意事项

- 不要将包含敏感信息的 config.js 文件提交到Git仓库
- 在部署到生产环境时，确保正确设置配置信息
- 定期更新GitHub Token以保持安全性 