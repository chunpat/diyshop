# GitHub Actions 手动部署

工作流：`.github/workflows/deploy-cloudflare.yml`，显示名称 **Deploy to Cloudflare**。

只在 GitHub 点击 **Run workflow** 时运行，且只接受 `chunpat/diyshop` 的 `main` 分支。普通 commit、push 和 PR 都不会触发部署。该文件目前只在本地提交；推送到 GitHub 的 main 后，Actions 页面才会显示它。

## 一次性配置

1. 在 Cloudflare 创建专用于此仓库的 API Token，资源范围限定为当前账号 `2a1f005a143e83feb871d22ea1678d91`。需要 **Account → Workers Scripts → Edit** 和 **Account → D1 → Edit**，分别用于发布现有 Worker / 静态资源和应用数据库迁移。可从 Edit Cloudflare Workers 模板开始收紧范围。此工作流使用已有域名关联，不执行 DNS 或域名创建，也不需要 R2 权限。
2. 在仓库 **Settings → Environments** 创建 `production`，在该环境的 **Environment secrets** 中添加 `CLOUDFLARE_API_TOKEN`。将令牌直接填入 GitHub，不发到聊天里、不写入代码。
3. 账号 ID、Worker 名称、D1 数据库 ID 统一读取 `cloudflare/wrangler.jsonc`。不必重复添加账号 ID secret。
4. 将本地工作流提交推送至 `main`。按当前约定，助手不会主动推送或运行工作流。

Cloudflare 上已有的 `AUTH_PEPPER`、`ADMIN_EMAILS` 等运行时 secrets 保留在 Worker；此工作流不重新设置它们，也不复制本机 Wrangler 登录文件。特别不要替换 `AUTH_PEPPER`，否则现有密码将无法验证。

## 每次发布

打开仓库 **Actions → Deploy to Cloudflare → Run workflow**，选择 `main`，运行。

执行顺序：

1. 使用 Node.js 22 和 `package-lock.json` 安装依赖。
2. 检查代码并测试商品、购物车、订单 API。
3. 构建 Worker 与静态资源，测试登录、账户权限及 Access 兼容逻辑。
4. 本地 dry-run 验证部署包。
5. 应用尚未执行的 D1 迁移；CI 中无需交互确认。
6. 发布刚才验证过的 Worker 和静态资源，记录对应提交编号。

任何检查或迁移失败都会停止后续步骤。部署流程串行执行，新的运行不会主动取消正在进行的迁移或发布。不会执行示例商品 seed、覆盖已有商品配置或重新创建管理员。

## 迁移及失败处理

- 迁移只应用一次，以远程 D1 的迁移记录为准；已应用的 SQL 文件不能改写。
- 新迁移应兼容仍在运行的旧 Worker，因为迁移在部署前执行。
- 迁移与发布不是跨服务事务：如果迁移成功而 Worker 发布失败，已成功的迁移会保留。修复后重新运行即可继续；不要通过重置数据库来重试。
- 回退 Worker 代码不会自动回退数据库结构。需要数据变更时，应另行设计迁移和恢复步骤。
- 本次只完成本地配置与验证，没有创建 Cloudflare Token、写入 GitHub Secret、运行线上迁移或发布。

参考：[Cloudflare GitHub Actions 部署](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)、[D1 migrations apply](https://developers.cloudflare.com/d1/wrangler-commands/#d1-migrations-apply)。
