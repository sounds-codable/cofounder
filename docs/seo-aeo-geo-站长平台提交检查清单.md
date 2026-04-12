# Cofounder 站长平台提交检查清单

## 使用方式

这是一份可执行清单。

建议你按以下顺序逐项完成：

1. 先完成站内自查
2. 再完成各站长平台验证
3. 再提交 sitemap
4. 再提交首页与重点公开页
5. 最后观察收录与抓取情况

---

## 一、站内提交前自查

### 基础可访问性

- [ ] 首页可正常访问：`https://cofounder.icu/`
- [ ] sitemap 可正常访问：`https://cofounder.icu/sitemap.xml`
- [ ] robots 可正常访问：`https://cofounder.icu/robots.txt`
- [ ] 站点全站使用 HTTPS
- [ ] 没有把公开页错误跳转到登录页

### 索引边界

- [ ] `sitemap.xml` 中只包含应公开收录的页面
- [ ] 后台页、登录页、私有页没有出现在 `sitemap.xml` 中
- [ ] 私有页已经设置 `noindex`
- [ ] 公开页 canonical 统一到正式地址

### 当前要提交的核心地址

- [ ] 站点主地址：`https://cofounder.icu`
- [ ] sitemap：`https://cofounder.icu/sitemap.xml`
- [ ] robots：`https://cofounder.icu/robots.txt`

---

## 二、建议优先提交的公开页

### 核心页

- [ ] `https://cofounder.icu/`
- [ ] `https://cofounder.icu/projects`
- [ ] `https://cofounder.icu/developers`
- [ ] `https://cofounder.icu/blog`
- [ ] `https://cofounder.icu/origin`
- [ ] `https://cofounder.icu/public-welfare`

### 专题页

- [ ] `https://cofounder.icu/how-it-works`
- [ ] `https://cofounder.icu/for-experts`
- [ ] `https://cofounder.icu/for-developers`
- [ ] `https://cofounder.icu/mvp-guide`
- [ ] `https://cofounder.icu/find-technical-cofounder`
- [ ] `https://cofounder.icu/find-real-startup-projects`
- [ ] `https://cofounder.icu/ai-era-startup`
- [ ] `https://cofounder.icu/developer-and-expert-collaboration`
- [ ] `https://cofounder.icu/how-to-post-a-project`
- [ ] `https://cofounder.icu/how-to-build-a-developer-profile`
- [ ] `https://cofounder.icu/reduce-ineffective-communication`
- [ ] `https://cofounder.icu/validate-demand-before-building`
- [ ] `https://cofounder.icu/how-to-evaluate-project-fit`
- [ ] `https://cofounder.icu/how-to-evaluate-developer-fit`
- [ ] `https://cofounder.icu/what-is-a-good-mvp-project`
- [ ] `https://cofounder.icu/why-not-just-use-recruitment-platforms`

---

## 三、Baidu 提交检查清单

### 账号与站点验证

- [ ] 登录百度搜索资源平台：`https://ziyuan.baidu.com/`
- [ ] 添加站点：`https://cofounder.icu`
- [ ] 完成站点所有权验证
- [ ] 记录验证方式（DNS / HTML 文件 / Meta Tag 等）

### Sitemap 提交

- [ ] 在百度站长平台中找到 sitemap / 链接提交相关入口
- [ ] 提交：`https://cofounder.icu/sitemap.xml`
- [ ] 确认平台已接受 sitemap 提交
- [ ] 观察是否有 sitemap 格式错误或抓取错误

### 建议额外提交

- [ ] 提交首页：`https://cofounder.icu/`
- [ ] 提交 `/projects`
- [ ] 提交 `/developers`
- [ ] 提交 `/blog`
- [ ] 提交重点专题页

### 后续检查

- [ ] 查看抓取异常
- [ ] 查看收录情况
- [ ] 查看 robots 是否被正确读取
- [ ] 查看是否存在死链或异常页

---

## 四、360 提交检查清单

### 账号与站点验证

- [ ] 登录 360 站长平台：`https://zhanzhang.so.com/`
- [ ] 添加站点：`https://cofounder.icu`
- [ ] 完成站长身份验证

### Sitemap 提交

- [ ] 在 360 站长平台中找到 sitemap 提交入口
- [ ] 提交：`https://cofounder.icu/sitemap.xml`
- [ ] 确认提交成功
- [ ] 检查是否有格式或抓取错误

### 如果站点尚未被 360 发现

- [ ] 在 360 网站收录入口尝试提交首页：`https://info.so.com/site_submit.html`
- [ ] 提交首页：`https://cofounder.icu/`

### 建议额外提交

- [ ] 提交 `/projects`
- [ ] 提交 `/developers`
- [ ] 提交 `/blog`
- [ ] 提交重点专题页

### 后续检查

- [ ] 检查 sitemap 是否被处理
- [ ] 检查 robots 与抓取问题
- [ ] 检查收录变化

---

## 五、Bing 提交检查清单

### 账号与站点验证

- [ ] 登录 Bing Webmaster Tools：`https://www.bing.com/webmasters/`
- [ ] 添加站点：`https://cofounder.icu`
- [ ] 完成站点验证
- [ ] 如方便，可评估是否从 Google Search Console 导入已验证站点

### Sitemap 提交

- [ ] 在 Bing Webmaster Tools 中提交 sitemap
- [ ] 提交：`https://cofounder.icu/sitemap.xml`
- [ ] 确认 sitemap 状态正常
- [ ] 检查是否存在 fetch error / robots error / 403 / 5xx 错误

### 建议额外处理

- [ ] 检查 `robots.txt` 中已声明 sitemap
- [ ] 检查首页 URL 是否可被 Bing 抓取
- [ ] 检查重点公开页是否可被 Request Indexing

### 可选增强

- [ ] 评估后续是否接入 IndexNow
- [ ] 评估后续是否接入 Bing URL Submission API

---

## 六、Google 提交检查清单

### 账号与站点验证

- [ ] 登录 Google Search Console：`https://search.google.com/search-console`
- [ ] 添加 `https://cofounder.icu` 属性
- [ ] 完成站点验证（推荐 DNS，或 HTML 文件 / Meta Tag）

### Sitemap 提交

- [ ] 打开 Search Console 的 Sitemaps 报表
- [ ] 提交：`https://cofounder.icu/sitemap.xml`
- [ ] 确认 sitemap 状态为可处理或成功
- [ ] 检查是否有路径、格式、抓取异常

### 建议额外处理

- [ ] 用 URL Inspection 检查首页
- [ ] 用 URL Inspection 检查 `/projects`
- [ ] 用 URL Inspection 检查 `/developers`
- [ ] 用 URL Inspection 检查 `/blog`
- [ ] 视情况对重点专题页请求抓取

---

## 七、提交后 1~4 周内的观察清单

### 搜索引擎平台侧

- [ ] Baidu 已识别 sitemap
- [ ] 360 已识别 sitemap
- [ ] Bing 已识别 sitemap
- [ ] Google 已识别 sitemap

### 抓取与索引侧

- [ ] 首页被抓取
- [ ] 列表页被抓取
- [ ] 部分专题页被抓取
- [ ] 没有明显 robots 错误
- [ ] 没有大量 404 / 5xx / 403

### 内容策略侧

- [ ] 持续新增公开内容
- [ ] 新增重要内容后同步确认是否在 sitemap 中
- [ ] 新增重点内容后视情况手动提交 URL

---

## 八、后续持续维护清单

- [ ] 新增公开页时确认 metadata 正常
- [ ] 新增公开页时确认 JSON-LD 正常
- [ ] 新增公开页时确认已进入 sitemap
- [ ] 新增公开页时确认不和私有页混淆
- [ ] 每月查看一次站长平台抓取 / 索引异常
- [ ] 每月检查一次是否需要补提交重点页

---

## 九、当前最推荐你马上做的动作

### 今天就做

- [ ] 完成 Baidu 站点验证
- [ ] 完成 360 站点验证
- [ ] 完成 Bing 站点验证
- [ ] 完成 Google 站点验证
- [ ] 在 4 个平台都提交 `https://cofounder.icu/sitemap.xml`

### 验证完成后立刻补交

- [ ] 首页 `https://cofounder.icu/`
- [ ] 项目库 `https://cofounder.icu/projects`
- [ ] 程序员库 `https://cofounder.icu/developers`
- [ ] Blog `https://cofounder.icu/blog`
- [ ] 2~4 个最核心专题页

---

## 十、备注

如果后续站点更新频率明显提高，可以继续补：

- IndexNow
- 重点页主动提交机制
- 更细的内容分组 sitemap
- 收录数据跟踪表

这份清单建议与你的《SEO / AEO / GEO 实施与搜索引擎提交指南》一起使用。
