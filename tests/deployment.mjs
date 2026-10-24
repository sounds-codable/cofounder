import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readConfig, selectTargets } from "../scripts/deploy-config.mjs";
const config = {
  DEPLOY_CHINA_SSH_HOST: "cn.example.com",
  DEPLOY_US_SSH_HOST: "us.example.com",
};
test("区域和 China → US 顺序，拒绝旧组件参数和同机配置", () => {
  assert.deepEqual(
    selectTargets(config, "all").map((t) => t.name),
    ["china", "us"],
  );
  for (const value of ["frontend", "backend", "--", "bad"])
    assert.throws(() => selectTargets(config, value));
  assert.throws(() =>
    selectTargets({ ...config, DEPLOY_US_SSH_HOST: "cn.example.com" }, "all"),
  );
});
test("部署配置覆盖且不执行 shell 表达式", () => {
  const root = mkdtempSync(join(tmpdir(), "cofounder-config-test-"));
  try {
    writeFileSync(join(root, ".env"), "DEPLOY_TARGET=china\nVALUE=$(id)\n");
    writeFileSync(join(root, ".deploy.env"), "DEPLOY_TARGET=us\n");
    assert.equal(readConfig(root).DEPLOY_TARGET, "us");
    assert.equal(readConfig(root).VALUE, "$(id)");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
test("拒绝不安全路径、主机与代理", () => {
  for (const patch of [
    { DEPLOY_US_ROOT: "/" },
    { DEPLOY_US_SSH_HOST: "host;id" },
    { DEPLOY_US_SSH_PORT: "0" },
    { DEPLOY_US_USE_PROXY: "yes" },
  ])
    assert.throws(() => selectTargets({ ...config, ...patch }, "us"));
});
