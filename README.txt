部署方式（你现在的仓库结构适配 Vercel 静态站）：

1) 将本压缩包里的文件覆盖到你的 GitHub 仓库根目录：
   - index.html
   - css/app.css
   - js/app.js

2) Vercel 会自动重新部署。

说明：
- 页面不会自动抽奖，只会在 URL 自带 ?code=XXXX 时自动填入输入框。
- 点击“立即抽奖”后请求 /api/redeem 并把结果渲染在页面中间结果卡片。
