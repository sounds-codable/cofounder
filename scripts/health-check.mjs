import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
const env = parseEnv(
  readFileSync("/var/www/www.cofounder.icu/shared/.env", "utf8"),
);
let last;
for (let i = 0; i < 45; i++) {
  try {
    const health = await fetch(`http://127.0.0.1:${env.PORT}/api/health`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!health.ok || !(await health.json()).ok) throw Error("API 未就绪");
    const web = await fetch(`http://127.0.0.1:${env.WEB_PORT}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!web.ok || !(await web.text()).includes("叩饭"))
      throw Error("网页未就绪");
    const cards = await fetch(
      `http://127.0.0.1:${env.PORT}/api/platform/cards`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!cards.ok) throw Error("数据库业务接口失败");
    const items = await cards.json();
    if (!Array.isArray(items)) throw Error("卡片接口结构异常");
    if (items.length) {
      const code = items[0].id.replace("-", "");
      for (const path of [`/${code}`, `/${code}/详情`]) {
        const detail = await fetch(
          `http://127.0.0.1:${env.WEB_PORT}${encodeURI(path)}`,
          {
            signal: AbortSignal.timeout(10000),
          },
        );
        if (!detail.ok) throw Error("卡片详情页服务端渲染失败");
        await detail.text();
      }
      const sitemap = await fetch(
        `http://127.0.0.1:${env.WEB_PORT}/sitemap.xml`,
        {
          signal: AbortSignal.timeout(10000),
        },
      );
      if (!sitemap.ok || !(await sitemap.text()).includes(code))
        throw Error("站点地图未包含真实卡片");
    }
    console.log(
      "健康检查通过：API、网页、数据库业务接口；有卡片时验证详情页和站点地图",
    );
    process.exit(0);
  } catch (e) {
    last = e;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
console.error(last.message);
process.exit(1);
