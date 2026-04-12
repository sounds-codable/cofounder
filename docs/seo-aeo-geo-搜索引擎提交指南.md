# Cofounder SEO / AEO / GEO 实施与搜索引擎提交指南

## 文档目的

这份文档用于说明：

- 当前站点已经完成了哪些 SEO / AEO / GEO 工作
- 当前站点有哪些公开抓取与机器可读入口
- 应该如何向 Baidu、360、Bing、Google 提交站点与 sitemap
- 除了 sitemap 之外，还建议提交或确认哪些信息
- 后续应该如何持续维护这些搜索与回答引擎相关能力

本文档只讨论公开可索引页面与搜索引擎相关事项，不涉及后台私有页的运营流程。

---

## 一、当前已经完成的 SEO / AEO / GEO 工作

### 1. 基础技术设施

当前 `client` 已经完成以下基础设施：

- 全站统一 `metadata` 管理
- 全站统一 canonical URL 生成
- `robots.txt`
- `sitemap.xml`
- `manifest.webmanifest`
- `llms.txt`
- `llms-full.txt`
- 公开页 JSON-LD 结构化数据
- 私有页 / 后台页 `noindex`

相关核心文件包括：

- `client/lib/seo.ts`
- `client/app/layout.tsx`
- `client/app/robots.ts`
- `client/app/sitemap.ts`
- `client/app/manifest.ts`
- `client/public/llms.txt`
- `client/public/llms-full.txt`

### 2. 已覆盖的公开页面 metadata

目前已经为以下页面补充了页面级 metadata：

- 首页 `/`
- Blog 列表 `/blog`
- Blog 详情 `/blog/[postId]`
- 项目库 `/projects`
- 程序员库 `/developers`
- 卡片详情页 `/{publicCode}` 与 `/{publicCode}/{titleSlug}`
- 缘起页 `/origin`
- 公益页 `/public-welfare`（通过 layout 承载 metadata）
- 多个新增专题页

### 3. 已覆盖的结构化数据类型

目前已经接入的 JSON-LD 类型包括：

- `Organization`
- `WebSite`
- `HowTo`
- `CollectionPage`
- `AboutPage`
- `FAQPage`
- `BreadcrumbList`
- `ItemList`
- `Blog`
- `BlogPosting`
- `WebPage`
- `ProfilePage`

### 4. 已完成的 AEO / GEO 类增强

为了更适合回答引擎与生成式搜索，目前已经补充了：

- 首页 FAQ 与 HowTo 结构化数据
- 列表页 FAQ / Breadcrumb / ItemList
- 详情页 Breadcrumb / ProfilePage / BlogPosting
- `llms.txt` 与 `llms-full.txt`
- 一批独立专题内容页，承接问答型搜索意图

### 5. 已新增的专题内容页

当前已新增以下专题页，并且全部已加入 `sitemap.xml`：

- `/how-it-works`
- `/for-experts`
- `/for-developers`
- `/mvp-guide`
- `/find-technical-cofounder`
- `/find-real-startup-projects`
- `/ai-era-startup`
- `/developer-and-expert-collaboration`
- `/how-to-post-a-project`
- `/how-to-build-a-developer-profile`
- `/reduce-ineffective-communication`
- `/validate-demand-before-building`
- `/how-to-evaluate-project-fit`
- `/how-to-evaluate-developer-fit`
- `/what-is-a-good-mvp-project`
- `/why-not-just-use-recruitment-platforms`

这些页面不会改动你现有主页面的可见文案、样式或交互，只是作为新增的公开内容页承接 SEO / AEO / GEO 搜索意图。

### 6. 已明确不应被索引的页面

当前已经对以下页面或路由分组做了 `noindex`：

- `/login`
- `/dashboard`
- `/requests`
- `/invite-codes`
- `/points`
- `/onboarding/*`
- `/admin/*`
- `/logo-lab`

这类页面不适合作为公开搜索结果出现。

---

## 二、当前站点的公开搜索入口

### 1. 正式站点

- 主域名：`https://cofounder.icu`

### 2. 当前应公开提交的核心入口

- 首页：`https://cofounder.icu/`
- 站点地图：`https://cofounder.icu/sitemap.xml`
- robots：`https://cofounder.icu/robots.txt`
- LLM 说明：`https://cofounder.icu/llms.txt`
- LLM 扩展说明：`https://cofounder.icu/llms-full.txt`

### 3. robots 当前作用

`robots.txt` 当前承担以下作用：

- 告诉搜索引擎公开可抓取页面
- 告诉搜索引擎哪些后台 / 私有路径不应抓取
- 告知搜索引擎 sitemap 地址

### 4. sitemap 当前作用

`sitemap.xml` 当前承担以下作用：

- 汇总公开核心页面
- 汇总新增专题页
- 汇总卡片详情页
- 汇总博客详情页
- 帮助搜索引擎更快发现新增或重要 URL

### 5. llms 文件当前作用

`llms.txt` / `llms-full.txt` 当前主要用于：

- 帮助 LLM / 回答引擎理解站点是什么
- 告诉模型哪些页面是公开内容
- 告诉模型哪些页面不应被当成公开知识来源
- 强化平台核心流程和公开边界说明

注意：`llms.txt` 不是传统搜索引擎的强制提交项，一般不需要单独提交给 Baidu / 360 / Bing / Google，但公开放置是有价值的。

---

## 三、向搜索引擎提交时，至少要准备哪些信息

### 必须准备

以下信息建议在提交任何搜索引擎前都准备好：

- **站点正式域名**
  - 例如：`https://cofounder.icu`

- **站点地图地址**
  - 例如：`https://cofounder.icu/sitemap.xml`

- **robots 地址**
  - 例如：`https://cofounder.icu/robots.txt`

- **站点所有权验证方式**
  - 常见方式包括：
    - DNS 验证
    - HTML 文件上传验证
    - HTML Meta Tag 验证
    - CNAME 验证

- **确认站点可公开访问**
  - sitemap 不能被登录拦截
  - robots 不能把公开页全挡掉
  - `https` 必须正常
  - 首页能正常打开

### 建议准备

以下不是每个平台都强制要求，但建议准备：

- **首页 URL**
  - 有些平台支持先提交首页做站点发现

- **站点名称**
  - `叩饭 Cofounder`

- **站点描述**
  - 一句或一段简洁描述平台定位

- **首选域名版本**
  - 建议统一使用 `https://cofounder.icu`
  - 不要让 `http`、`www`、非 `www` 多版本混乱

- **站点更新时间节奏说明**
  - 例如有博客更新、卡片更新、专题页更新

- **ICP备案信息**
  - 如果后续有备案，建议确保站点底部和相关平台资料一致
  - 这更偏站点合规与信任增强，不是 sitemap 提交强制项

### 可选增强项

- **URL 主动推送 / 快速收录 / IndexNow**
  - 后续可以接，但当前不是必须

- **搜索引擎站长工具中的 URL 检查 / 请求抓取**
  - 用于新页面或关键页面加速发现

---

## 四、Baidu 提交指南

### 官方入口（常见）

- 百度搜索资源平台：`https://ziyuan.baidu.com/`
- Sitemap 说明与工具参考：`https://ziyuan.baidu.com/wiki/44`
- 常见 sitemap 提交入口：`https://ziyuan.baidu.com/sitemap/index`

注意：百度站长平台后台界面会调整，实际菜单位置可能变化，但总体流程稳定。

### 提交步骤

#### 1. 注册并登录百度搜索资源平台

使用百度账号登录。

#### 2. 添加站点

添加：

- `https://cofounder.icu`

建议直接添加正式 HTTPS 版本。

#### 3. 完成站点所有权验证

按平台支持选择以下任一方式：

- DNS 验证
- HTML 文件验证
- Meta Tag 验证
- 平台提供的其它验证方式

#### 4. 提交 sitemap

在百度站长平台中进入 sitemap / 链接提交相关功能后，提交：

- `https://cofounder.icu/sitemap.xml`

根据百度官方文档，其支持常见的 sitemap 格式：

- XML sitemap
- txt sitemap
- sitemap 索引文件

#### 5. 建议补充首页或重点页提交

除了 sitemap 之外，建议在百度站长平台中关注：

- 首页 URL 提交
- 重点专题页 URL 提交
- 重要博客页 URL 提交

特别是新站初期，重点页单独提交通常更稳妥。

### 建议额外做的事

- **检查 robots 是否可被百度读取**
- **确认 sitemap 里没有私有页**
- **后续可评估百度普通收录 / 链接提交 / 主动推送能力**
- **重点关注百度站长平台里的抓取异常、索引异常、死链、robots 问题**

### 对百度而言，建议提交的信息

- 站点正式 URL
- sitemap 地址
- 首页 URL
- 重点内容页 URL（可选）
- 站点验证信息

---

## 五、360 提交指南

### 官方入口（常见）

- 360 站长平台：`https://zhanzhang.so.com/`
- 360 sitemap 帮助：`https://www.so.com/help/help_3_3.html`
- 360 网站收录入口：`https://info.so.com/site_submit.html`

### 提交步骤

#### 1. 登录 360 站长平台

进入 360 站长平台并登录。

#### 2. 添加网站并验证站长身份

添加：

- `https://cofounder.icu`

完成站点所有权验证。

#### 3. 提交 sitemap

按 360 官方帮助，一般流程是：

- 添加网站
- 验证站长身份
- 完成验证后添加新数据
- 提交 sitemap 文件地址

当前建议提交：

- `https://cofounder.icu/sitemap.xml`

### 360 对 sitemap 的常见要求

根据 360 帮助文档，通常支持：

- XML 格式
- 文本格式
- sitemap 索引文件

并会对单文件大小、URL 数量有上限要求。当前本站规模远小于这些上限，现阶段无需拆分。

### 如果 360 还没有收录站点

除了站长平台提交 sitemap 外，还可以尝试：

- 在 360 网站收录入口先提交站点首页

即先提交：

- `https://cofounder.icu/`

然后再在站长平台里补 sitemap。

### 对 360 而言，建议提交的信息

- 站点正式 URL
- sitemap 地址
- 首页 URL
- 站点验证信息

---

## 六、Bing 提交指南

### 官方入口（常见）

- Bing Webmaster Tools：`https://www.bing.com/webmasters/`
- 站长工具介绍页：`https://www.bing.com/webmasters/about`

Bing 官方帮助中常见做法包括：

- 在 Bing Webmaster Tools 中提交 sitemap
- 在 `robots.txt` 中声明 sitemap
- 可选使用 API / IndexNow / URL Submission 等方式增强发现速度

### 提交步骤

#### 1. 登录 Bing Webmaster Tools

建议使用 Microsoft 账号。

#### 2. 添加站点

添加：

- `https://cofounder.icu`

#### 3. 验证站点所有权

Bing 常见支持方式包括：

- XML 文件验证
- Meta Tag 验证
- DNS / CNAME 验证
- 部分情况下支持从 Google Search Console 导入已验证站点信息

#### 4. 提交 sitemap

在 Bing Webmaster Tools 中提交：

- `https://cofounder.icu/sitemap.xml`

### Bing 额外建议

Bing 相比传统搜索，更建议关注：

- sitemap 是否持续可抓取
- robots 是否允许抓取公开页
- canonical 是否清晰
- `noindex` 是否只用于私有页

### Bing 可选增强项

后续可以考虑：

- **IndexNow**
  - 对新页面 / 更新页面更快通知 Bing
- **URL Submission API**
  - 批量提交重要更新页

这些目前不是必须，但对内容更新频繁的网站有帮助。

### 对 Bing 而言，建议提交的信息

- 站点正式 URL
- sitemap 地址
- robots 中的 sitemap 声明
- 站点验证信息
- 后续重点页 URL（可选）

---

## 七、Google 提交指南

### 官方入口（常见）

- Google Search Console：`https://search.google.com/search-console`
- Google Search Central sitemap 文档：`https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap`

虽然在中国大陆 Google 不是最主要的自然搜索入口，但如果你的内容未来希望被国际搜索、海外用户或更多 AI 系统引用，Google Search Console 仍然值得配置。

### 提交步骤

#### 1. 登录 Google Search Console

#### 2. 添加站点属性

推荐优先考虑：

- Domain Property（域名级）
- 或 URL Prefix Property（站点前缀级）

现阶段至少要覆盖：

- `https://cofounder.icu`

#### 3. 完成站点所有权验证

常见方式包括：

- DNS TXT 验证
- HTML 文件验证
- HTML meta tag 验证

#### 4. 提交 sitemap

在 Search Console 的 Sitemaps 报表中提交：

- `https://cofounder.icu/sitemap.xml`

Google 官方说明中强调：

- 提交 sitemap 只是提示，不保证一定抓取或一定收录
- 也应在 `robots.txt` 中列出 sitemap
- 需要确保 sitemap 对 Googlebot 可访问

### Google 额外建议

- 用 URL Inspection 检查首页和重点页
- 新专题页上线后，可针对重点页手动请求重新抓取
- 持续关注 sitemap 报表中的格式错误、抓取错误、路径错误

### 对 Google 而言，建议提交的信息

- 站点正式 URL / Property
- sitemap 地址
- 站点验证信息
- 重点页 URL（可选，配合 URL Inspection）

---

## 八、除了 sitemap，还需要提交其它信息吗？

简短答案：**建议提交，但不是每个平台都必须。**

### 最推荐额外处理的内容

#### 1. 站点所有权验证

这是所有平台的前置条件，没有验证通常无法完整使用工具。

#### 2. 首页 URL

新站初期建议额外提交首页：

- `https://cofounder.icu/`

#### 3. 重点内容页 URL

建议优先提交以下类型页面：

- 首页
- 项目库
- 程序员库
- Blog 列表
- 新专题页
- 新博客文章页

#### 4. robots.txt

不是“提交”，但必须确认：

- 搜索引擎能访问
- 里面声明了 sitemap
- 没误伤公开页面

#### 5. canonical / HTTPS 统一

不是“提交”，但必须确认：

- 全站统一使用 `https://cofounder.icu`
- 不出现多个版本抢索引

### 可选提交或后续增强项

#### 1. URL 主动推送

适合：

- 新文章上线
- 新专题页上线
- 重要公开页更新

#### 2. IndexNow（更适合 Bing）

适合后续内容更新频率提高时接入。

#### 3. 站点名称、站点描述、Logo 等品牌信息

部分平台 / 工具会在验证后支持补充这些站点资料，建议保持与站内品牌表达一致。

#### 4. 死链、异常页、抓取错误管理

后续要定期检查：

- 死链
- 抓取异常
- robots 屏蔽错误
- sitemap 格式错误

---

## 九、建议的提交流程顺序

建议按下面顺序做：

### 第一步：确认站内基础无误

检查：

- 首页正常打开
- sitemap 正常打开
- robots 正常打开
- 私有页没有被放进 sitemap
- public 页面 metadata 正常

### 第二步：完成站点所有权验证

优先在以下平台完成：

- Baidu
- 360
- Bing
- Google

### 第三步：提交 sitemap

统一提交：

- `https://cofounder.icu/sitemap.xml`

### 第四步：补提交首页与重点内容页

优先：

- 首页
- `/projects`
- `/developers`
- `/blog`
- 新专题页

### 第五步：后续持续维护

每次新增重要公开内容后：

- 确保页面被加入 sitemap
- 确保 metadata 与 JSON-LD 正常
- 必要时在站长平台里手动请求抓取重点页

---

## 十、当前建议你立即提交的地址

### 统一提交项

- 站点：`https://cofounder.icu`
- sitemap：`https://cofounder.icu/sitemap.xml`
- robots：`https://cofounder.icu/robots.txt`

### 建议额外提交的重点公开页

- `https://cofounder.icu/`
- `https://cofounder.icu/projects`
- `https://cofounder.icu/developers`
- `https://cofounder.icu/blog`
- `https://cofounder.icu/how-it-works`
- `https://cofounder.icu/for-experts`
- `https://cofounder.icu/for-developers`
- `https://cofounder.icu/mvp-guide`
- `https://cofounder.icu/find-technical-cofounder`
- `https://cofounder.icu/find-real-startup-projects`
- `https://cofounder.icu/ai-era-startup`
- `https://cofounder.icu/developer-and-expert-collaboration`
- `https://cofounder.icu/how-to-post-a-project`
- `https://cofounder.icu/how-to-build-a-developer-profile`
- `https://cofounder.icu/reduce-ineffective-communication`
- `https://cofounder.icu/validate-demand-before-building`
- `https://cofounder.icu/how-to-evaluate-project-fit`
- `https://cofounder.icu/how-to-evaluate-developer-fit`
- `https://cofounder.icu/what-is-a-good-mvp-project`
- `https://cofounder.icu/why-not-just-use-recruitment-platforms`

---

## 十一、后续建议

### 短期建议

- 完成 Baidu / 360 / Bing / Google 的站点验证
- 提交 sitemap
- 提交首页与重点专题页
- 观察 1 到 4 周索引情况

### 中期建议

- 如果博客更新频率提高，考虑重点页主动提交
- 如果公开内容更新频率提高，考虑 Bing 的 IndexNow
- 持续新增围绕真实问题的专题页与博客内容

### 长期建议

- 逐步建立内容集群
- 形成“首页 + 列表页 + 详情页 + 专题页 + 博客页”的搜索矩阵
- 定期检查收录、抓取错误、索引异常与重复 canonical 问题

---

## 十二、结论

对于当前站点，最重要的事情不是继续堆更多技术细节，而是先把以下动作做完：

- 完成各站长平台的站点验证
- 提交 `sitemap.xml`
- 提交首页与重点公开页
- 后续有重要公开内容新增时，持续更新 sitemap 并视情况做手动提交

当前站点的基础 SEO / AEO / GEO 架构已经基本具备，接下来重点会转向：

- 搜索引擎站长平台接入
- 内容持续更新
- 收录与抓取数据跟踪

如果后续需要，我可以继续补一份：

- `docs/seo-aeo-geo-提交检查清单.md`

专门做成可打勾执行版，方便你逐个平台操作。
