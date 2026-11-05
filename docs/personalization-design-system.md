# 定制商品图片与设计模板提炼

调研日期：2026-11-05。范围为 Callie 首页及包袋、夜灯、人物插画、照片睡裤等代表样本，不代表穷举全站商品。页面会按地区跳转；美站与澳站的具体货品、文案和价格可能不同。

## 图片与编辑模板

观察：灯具样本可见 9–10 张图片，照片睡裤可见 12 张，包袋可见 9 个媒体位置，其中含视频。因此不能将所有商品理解为固定两张图片。

实现时分开管理：

1. 商品媒体：成品效果、其他角度、材质细节、规格/尺寸、使用场景、视频。它们通常是固定参考内容。
2. 可编辑底图：去除示例姓名、祝福语和用户照片后的商品底图，指定可印刷区域。
3. 设计图层：图案/装饰、用户照片、主姓名、下方祝福语。每个字段有独立区域、字体、长度和对齐规则。
4. 预览视图：完整商品和设计近景共享同一份设计数据；近景不是另一张独立商品照片。

推荐配置关系：商品 → 媒体列表 + 可选设计模板；模板 → 底图 + 装饰层 + 文字区 + 可选照片区 + 预览视角。风格、颜色、材质/尺寸规格是不同维度。

## 风格分类（调研归纳，并非竞品官方分类）

| 风格 | 图案及排版特征 | 定制内容 | 代表来源 |
| --- | --- | --- | --- |
| 姓名字母/极简 | 大姓名或首字母作为主视觉，边框、线条、留白 | 姓名、首字母、颜色 | 首页 monogram 商品；[字母高尔夫包](https://www.callie.com/)首页链接 |
| 花卉/生日花 | 花朵、枝叶、蝴蝶，单人或家人组合 | 姓名、生日花、人数 | [1–8 生日花夜灯](https://au.callie.com/personalized-dainty-1-8-birth-flowers-acrylic-led-night-light-with-1-8-names-and-wooden-base-christmas-birthday-gift-for-mom-grandma-pdp-76177) |
| 节日/主题插画 | 圣诞红绿、雪花、树、礼盒、角色等主题元素 | 姓名、年份、祝福语（按商品） | [圣诞分类](https://www.callie.com/christmas)及用户提供的圣诞麻布袋截图 |
| 可爱贴布/配件 | 绒感字母、花朵、动物或水果贴布 | 包色、字色、姓名、配件 | [灯芯绒包](https://www.callie.com/personalized-cute-flower-animal-patch-lightweight-corduroy-crossbody-bag-with-name-daily-use-birthday-gift-for-kids-girls-pdp-75823) |
| 人物插画/立体视觉 | 卡通人物与阅读、运动、职业等场景；部分标题强调 3D 视觉效果 | 姓名、人物/主题选择，字段因商品而异 | [阅读人物 Kindle 壳](https://au.callie.com/personalized-3d-effect-artwork-cartoon-reading-character-kindle-case-with-name-for-multiple-models-daily-use-birthday-gift-for-book-lover-bookworm)；[人物生日花沙滩巾](https://au.callie.com/personalized-cartoon-character-birth-flower-quick-dry-oversized-soft-beach-towel-with-name-swimming-beach-party-birthday-gift-for-kids-family) |
| 照片拼贴/满版 | 一至多张人像重复排列，搭配星星、爱心和文字 | 照片、文字、底色 | [1–6 照片睡裤](https://au.callie.com/personalized-this-belongs-to-1-6-face-photos-fleece-pajama-pants-with-name-and-pocket-daily-use-birthday-anniversary-gift-for-family-friends) |
| 经典油画 | 将宠物融入星空、珍珠耳环等绘画构图 | 上传照片、画风、姓名、预设纪念文字 | [油画宠物夜灯](https://au.callie.com/personalized-oil-painting-style-pet-portrait-art-acrylic-led-night-light-with-wooden-base-name-and-text-home-decor-memorial-gift-for-pet-lover-owner) |
| 水彩/纪念 | 柔和晕染、翅膀、星光、爪印等元素 | 照片、姓名、标题、日期 | [水彩翅膀宠物夜灯](https://au.callie.com/personalized-watercolor-wings-pet-photo-dimmable-touch-control-night-light-with-name-title-and-date-memorial-sympathy-gift-for-loss-of-pet) |

油画夜灯实测提供两种画风和五个预设文字选项，并未发现自由输入底部文案的选项。本店依据用户要求提供自由输入。照片艺术化商品的文案不能证明竞品在输入时即时生成画作；本次未上传私人照片或验证其生成流程。

## 本次落地

保持 TypeScript / Cloudflare Workers / D1 架构。现有已配置实时预览的商品 0、3、52 添加：

- 完整实时效果、设计近景、固定参考照片三个视图。
- 三种模板：原有贴布/圣诞设计、Botanical 花卉、Minimal 简约。
- 独立 Bottom Text，可选、最多 48 字符、单行；绘制到主设计下方，按可印刷宽度缩小字号。
- 每个包独立姓名和下方文字；同批次的颜色和模板仍共用，加入购物车后可逐件编辑模板。
- 主页面与放大编辑器双向同步；购物车缩略图使用同一渲染器。
- 服务端验证设计选项及文本；购物车区分不同祝福语；订单保存风格与文字。
- 不添加数据库表；使用现有 options 和订单 personalization 存储。

顾客照片上传、人物组件库、生日花月份映射及 AI 油画/水彩转绘仍是后续工作。后台商品图库上传、预览底图上传和已有模板选项编辑现已支持；任意底图的印刷坐标编辑仍待扩展。本次没有把未实现的照片处理包装成可用功能，也未给其余商品套用不匹配的包袋底图。

## 验收

检查 48 字符边界、非法选项/控制字符拒绝、不同文字购物车分行、订单文字保留、主页面与弹窗同步、多包独立文字，以及手机预览布局。既有价格、库存、权限和订单幂等规则继续生效。

## 扩展案例库

现已补充 [30 个 Callie 案例及 90 张参考图](callie-reference-library.md)，可在后台“素材案例库”按商品与设计风格筛选。所有案例保留原商品、原图来源和排版建议；成品参考图与可编辑底图继续分开管理。
