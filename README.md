# ONEPIECE STUDIO 官网

这里保存旺皮斯网络科技（成都）有限责任公司官网的可维护源码、公开素材和构建脚本。换电脑或接手维护时，请克隆本仓库的 `website-source` 分支。

| 去哪里 | 用来做什么 |
| --- | --- |
| `website-source` | 编辑内容和样式、构建、查看交接说明 |
| `main` | 保存 [GitHub Pages 备用站](https://chenhao5072.github.io/) 的静态发布快照 |
| [Cloudflare Pages 正式站](https://onepiecestudio.pages.dev/) | 对外使用的官网，独立上传部署 |

## 换电脑后从这里开始

准备 Git 和 Node.js 22 或以上版本（包含 npm）。该站没有 npm 第三方依赖，无需执行 `npm install`。

```sh
git clone --branch website-source https://github.com/chenhao5072/chenhao5072.github.io.git onepiece-website
cd onepiece-website
npm run build
npm run validate
npm run serve
```

在浏览器访问 [本地预览](http://127.0.0.1:4173/)，并打开 `/projects/` 检查项目页。按 `Ctrl+C` 停止预览。构建会重建 `dist/`，不要直接修改里面的文件。

## 修改入口

- 三语文案：`src/content-zh.mjs`、`src/content-ja.mjs`、`src/content-en.mjs`；文案及项目商店地址更新后，请检查三种语言。
- 页面模板、构建和正式域名处理：`scripts/build.mjs`。
- 样式和交互：`src/styles.css`、`src/core-pages.css`、`src/motion.css`、`src/site.js`、`src/motion.js`。
- Logo、项目截图、分享图：`src/assets/`；`src/og-source.html` 是分享图的可编辑模板。

维护时，先拉取 `website-source` 的最新版本；修改后重新构建、校验并预览，再将源码提交到该分支。提交源码不会自动发布任何站点。

自动发布的启用、验收、回滚和权限交接见 [维护与交接手册](OPERATIONS.md)。本仓库公开可见，请只提交可公开的源码和网站素材。
