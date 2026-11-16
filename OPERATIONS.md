# 官网维护与交接

## 交接要点

GitHub 同一仓库的 `website-source` 保存源码，`main` 发布静态备用站；Cloudflare 的 `onepiecestudio` 项目独立维护正式站。两个发布入口不会自动同步。在新电脑克隆源码后先本地验收，接手确认不需要为此重新发布正式站。

由现任管理员邀请接手人使用自己的账号，按以下职责授予权限：

| 系统 | 应具备的权限 |
| --- | --- |
| GitHub | 维护人员可以提交源码；负责备用站发布的人可以提交到 `main`，并查看仓库 Actions 和 Pages 部署。 |
| Cloudflare | 负责正式站发布的人能访问 `onepiecestudio` Pages 项目、创建部署、查看部署历史和执行回滚；仅域名负责人需要管理 DNS。 |
| 域名注册商 | 目前对外使用 Pages 提供的地址。若以后购买独立域名，交接域名所有权、续费和 DNS 管理职责。 |
| Google Search Console / 百度搜索资源平台 | 由站长管理员按平台规则授予对应站点的访问权限，接手人用自己的账号管理站点地图和搜索状态。 |

确认接手人实际能查看所需项目和记录，再移除不再需要的旧成员权限。账号名册、密码、验证码、恢复码、私钥、API 凭据或本地登录缓存不要存到公开仓库。正式站 HTML 所含的 Google 站点验证标签是公开校验标记，不用于账号登录；保留线上已使用的标记。核对站长平台的提交与收录状态时，以平台实际记录为准。

## 发布 Cloudflare 正式站

在源码目录切换到要发布的版本，运行：

```sh
npm run build
npm run validate
```

1. 打开 Cloudflare 控制台 → **Workers & Pages** → **onepiecestudio** → **Deployments** → **Create deployment**。使用 [Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/) 上传 `dist/`；如果上传 ZIP，确保打开 ZIP 就能看到 `index.html`，而不是外层再套一个 `dist/` 目录。只上传生成的页面和静态资源。
2. 先用预览部署检查中、日、英首页、项目页、图片和商店链接；通过后选择 **Production** 发布同一份产物。不要把 `npm run build:github` 生成的备用站包部署到正式站。
3. 在正式域名检查首页、`/projects/`、`/ja/`、`/en/`、`/sitemap.xml` 和 `/robots.txt`，确认 HTTPS、语言切换、项目截图和商店入口都正常。记录部署链接及对应源码提交，以便再次发布或回滚。

Windows 可用 PowerShell 7 从源码目录运行 `pwsh -File scripts/package-release.ps1` 生成 ZIP。变更正式域名时，先在 Cloudflare 添加自定义域名并确认 DNS 与 HTTPS，再用新的 `SITE_URL` 重新构建，核对规范网址、语言备用链接、站点地图及站长平台配置。

正式站出现发布回归时，在 **Deployments** 找到上一个已验证的生产部署，选择 [Rollback to this deployment](https://developers.cloudflare.com/pages/configuration/rollbacks/)。回滚后复查正式站，再在 `website-source` 修复原因。

## 同步 GitHub Pages 备用站

用一个单独的目录保存 `main`，不要在源码目录里切分支覆盖文件。首次在源码目录执行：

```sh
git clone --branch main https://github.com/chenhao5072/chenhao5072.github.io.git ../onepiece-pages
```

以后每次从干净的 `main` 工作目录开始。在源码目录执行：

```sh
git -C ../onepiece-pages pull --ff-only origin main
npm run build:github
npm run validate:github
node scripts/sync-github-pages.mjs ../onepiece-pages
git -C ../onepiece-pages status --short
git -C ../onepiece-pages diff --stat
```

同步脚本只复制备用站的生成文件。若脚本报告旧生成文件，先逐一确认是否仍被引用，再决定是否删除。检查改动范围后，在备用站工作目录提交并推送：

```sh
git -C ../onepiece-pages add -A
git -C ../onepiece-pages diff --cached --stat
git -C ../onepiece-pages commit -m "chore: sync GitHub Pages backup"
git -C ../onepiece-pages push origin main
```

到 [GitHub Actions](https://github.com/chenhao5072/chenhao5072.github.io/actions) 确认 Pages 部署成功，再访问 [备用站](https://chenhao5072.github.io/) 与 [备用项目页](https://chenhao5072.github.io/projects/) 确认新版已生效。备用站可以直接访问，页面用 `noindex` 告知搜索引擎不要收录，规范网址和站点地图指向正式域名。备用页不包含正式站的 Google 验证标签；GitHub Pages 不执行 Cloudflare 的响应头和重定向规则。

若备用站需要回滚，在 `main` 用 `git revert` 撤销明确的问题提交，检查变更后正常推送；等 Pages 重新部署并做同样的访问检查。该操作不影响 Cloudflare 正式站。
