# 首页性能优化规范（首屏体感与 Lighthouse）

## 1. 目的与范围

本文档用于沉淀 `client/app/page.tsx` 首页的首屏体感优化实践，目标是：

- 不改业务逻辑，仅优化渲染与视觉体感。
- 首屏“更酷、更有分屏感”的同时，控制动画与滤镜开销。
- 明确移动端降载策略，避免桌面方案直接套用到移动端造成性能劣化。
- 用 Lighthouse 做可复现的前后对比。

---

## 2. 当前落地原则（已执行）

### 2.1 首屏与非首屏分治

- 首屏关键内容（主文案、核心 CTA）优先直出，不使用 `content-visibility`。
- 非首屏区块统一使用延迟渲染策略：
  - `content-visibility: auto`
  - `contain: layout style paint`
  - `contain-intrinsic-size` 预占位，避免滚动到该区块时抖动。

### 2.2 动效分级（桌面保体验，移动保性能）

- 桌面端保留大范围动效：`driftOrbit`、`sweepX`。
- 移动端逐级降载：
  - 隐藏宽幅动效层（`home-fx-orb--wide`、`home-fx-sweep--wide`）。
  - 进一步隐藏 sweep 光带，仅保留低强度 orb。
  - 在 `prefers-reduced-motion: reduce` 下禁用动效。

### 2.3 backdrop-blur 收敛

- 仅在少量关键容器使用小半径 blur。
- 移动端首屏和导航条关闭或降级 blur，降低合成与重绘成本。

### 2.4 首屏信息结构减负

- 移动端移除首屏右侧重卡（桌面保留）。
- 在左侧主卡增加轻量流程条（场景 → MVP → 迭代），保证信息完整但 DOM 更轻。

---

## 3. 关键实现点（文件级）

- 首页结构与策略：`client/app/page.tsx`
- 全局动画与降载规则：`client/app/globals.css`

重点实现包括：

- 新增 `deferredSectionStyle`，用于非首屏延迟渲染。
- 新增动效关键帧 `driftOrbit`、`sweepX`。
- 新增动效控制类：`home-fx-orb`、`home-fx-sweep`。
- 新增媒体查询和 `prefers-reduced-motion` 的降载规则。
- 移动端 header 关闭 `backdrop-filter`。

---

## 4. Lighthouse 执行规范（本地）

> 说明：本项目开发端口为 `3000`，启动前建议先清端口再启动。

### 4.1 启动服务

```bash
if lsof -ti :3000 >/dev/null; then lsof -ti :3000 | xargs kill -9; fi
npm --prefix client run dev
```

### 4.2 Desktop 报告

```bash
npx --yes lighthouse http://localhost:3000 \
  --preset=desktop \
  --only-categories=performance,accessibility,best-practices,seo \
  --throttling-method=devtools \
  --output=json --output=html \
  --output-path=./temp/lighthouse/home-after-v5-desktop \
  --chrome-path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  --chrome-flags='--headless=new --disable-gpu --no-sandbox' \
  --no-enable-error-reporting
```

### 4.3 Mobile 报告

```bash
npx --yes lighthouse http://localhost:3000 \
  --only-categories=performance,accessibility,best-practices,seo \
  --throttling-method=devtools \
  --output=json --output=html \
  --output-path=./temp/lighthouse/home-after-v5-mobile \
  --chrome-path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  --chrome-flags='--headless=new --disable-gpu --no-sandbox' \
  --no-enable-error-reporting
```

---

## 5. 当前结果快照（基线 vs v5）

### 5.1 Desktop（基线 `home-before` → v5）

- Performance：`57 → 97`
- Accessibility：`100 → 100`
- Best Practices：`96 → 96`
- SEO：`91 → 100`
- FCP：`1.3s → 1.0s`
- LCP：`3.0s → 1.0s`
- TBT：`500ms → 50ms`
- CLS：`0 → 0`

### 5.2 Mobile（基线 `home-before` → v5）

- Performance：`57 → 87`
- Accessibility：`100 → 100`
- Best Practices：`96 → 96`
- SEO：`91 → 100`
- FCP：`1.3s → 1.7s`（移动端口径与桌面不同，需看同口径趋势）
- LCP：`3.0s → 1.7s`（显著改善）
- TBT：`500ms → 460ms`

> 注：跨轮对比建议固定同一口径（Desktop 对 Desktop、Mobile 对 Mobile），并至少复测 2 次取中位数，避免单次抖动误导判断。

---

## 6. 后续迭代守则

- 新增首屏视觉元素时，优先问三个问题：
  1. 是否必须首屏可见？
  2. 是否必须动画化？
  3. 是否可在移动端降级或移除？
- 禁止把高开销视觉（大半径 blur、大面积滤镜、复杂连续动画）默认下放到移动端。
- 每次首页改版都应输出 `temp/lighthouse` 前后报告，至少包含 Desktop+Mobile 两份。
- 若出现“桌面升分、移动降分”，优先回查：
  - 首屏 DOM 深度
  - 首屏动画层数
  - 移动端滤镜与阴影强度
  - 首屏外区块是否错误进入首屏渲染链路
