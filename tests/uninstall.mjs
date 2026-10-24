import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs } from '../scripts/uninstall-remote.mjs';

test('卸载必须明确选择单一区域，不读取默认目标，不接受 all', () => {
  for (const args of [[], ['all'], ['--execute'], ['China'], ['china', 'us']])
    assert.throws(() => parseArgs(args));
  assert.deepEqual(parseArgs(['china']), {target: 'china', mode: 'preview', yes: false});
  assert.deepEqual(parseArgs(['us', '--check']), {target: 'us', mode: 'check', yes: false});
  assert.deepEqual(parseArgs(['china', '--execute', '--yes']), {target: 'china', mode: 'execute', yes: true});
});

test('拒绝执行与验收混用、未知或重复参数', () => {
  for (const flags of [['--execute','--check'], ['--yes'], ['--execute','--execute'], ['--force']])
    assert.throws(() => parseArgs(['china', ...flags]));
});
