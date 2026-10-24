// 只上传卸载器，默认预览；禁止隐式目标和批量卸载。
import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync, openSync, closeSync, writeSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lookup } from 'node:dns/promises';
import { createInterface } from 'node:readline/promises';
import { readConfig, selectTargets } from './deploy-config.mjs';
import { ssh, quote, options } from './remote.mjs';

export function parseArgs(args) {
  const [target, ...flags] = args;
  if (!['china', 'us'].includes(target)) throw Error('必须明确指定 china 或 us；禁止 all 和默认目标');
  if (flags.some(f => !['--execute', '--check', '--yes'].includes(f)) || new Set(flags).size !== flags.length ||
      (flags.includes('--execute') && flags.includes('--check')) || (flags.includes('--yes') && !flags.includes('--execute')))
    throw Error('参数无效：用法 pnpm server:uninstall <china|us> [--execute [--yes] | --check]');
  return { target, mode: flags.includes('--execute') ? 'execute' : flags.includes('--check') ? 'check' : 'preview', yes: flags.includes('--yes') };
}

async function main() {
  if (process.argv.slice(2).some(v => ['-h', '--help'].includes(v))) {
    console.log('用法：pnpm server:uninstall <china|us> [--execute [--yes] | --check]；默认只读预览。执行会永久删除所选服务器的项目数据及本机备份。');
    return;
  }
  const args = parseArgs(process.argv.slice(2));
  process.chdir(dirname(dirname(fileURLToPath(import.meta.url))));
  const targets = selectTargets(readConfig(), 'all');
  const [cnIPs, usIPs] = await Promise.all(targets.map(t => lookup(t.host, { all: true })));
  if (cnIPs.some(a => usIPs.some(b => a.address === b.address))) throw Error('China 与 US 地址重合，拒绝卸载');
  // 只读比较两端机器身份，防止两个 SSH 地址实际映射到同一台机器。
  const identities = targets.map(t => ssh(t, 'cat /etc/machine-id', true).trim());
  if (identities.some(id => !/^[a-f0-9]{32}$/.test(id)) || identities[0] === identities[1])
    throw Error('China/US 机器身份无效或相同，拒绝卸载');
  const index = args.target === 'china' ? 0 : 1;
  const t = targets[index];
  const logDir = mkdtempSync(join(tmpdir(), 'cofounder-uninstall-log-'));
  const logPath = join(logDir, `${args.target}.log`);
  const fd = openSync(logPath, 'wx', 0o600);
  const log = message => { console.log(message); writeSync(fd, message + '\n'); };
  let stage;
  try {
    log(`所选区域：${t.name}；服务器：${t.user}@${t.host}:${t.port}；模式：${args.mode}`);
    log(`项目目录：${t.root}；详细日志：${logPath}`);
    if (args.mode === 'execute' && !args.yes) {
      const reader = createInterface({ input: process.stdin, output: process.stdout });
      try {
        if (await reader.question(`永久删除此服务器上的代码、数据库、配置、日志、证书及本机备份。输入 cofounder/${t.name} 确认：`) !== `cofounder/${t.name}`)
          throw Error('已取消');
      } finally { reader.close(); }
    }
    stage = execFileSync('ssh', ['-T', ...options, '-p', t.port, `${t.user}@${t.host}`, 'umask 077; mktemp -d /tmp/cofounder-uninstall.XXXXXXXX'], {encoding: 'utf8'}).trim();
    if (!/^\/tmp\/cofounder-uninstall\.[A-Za-z0-9]{8}$/.test(stage)) { stage = undefined; throw Error('远端临时目录异常'); }
    execFileSync('scp', [...options, '-P', t.port, 'scripts/server-uninstall.py', `${t.user}@${t.host}:${stage}/server-uninstall.py`], { stdio: 'inherit' });
    const command = ['sudo', '-n', 'python3', `${stage}/server-uninstall.py`, '--root', t.root,
      '--target', t.name, '--domain', t.domain, '--machine-id', identities[index],
      ...(args.mode === 'execute' ? ['--execute', '--yes'] : args.mode === 'check' ? ['--check'] : [])].map(quote).join(' ');
    const child = spawn('ssh', ['-T', ...options, '-p', t.port, `${t.user}@${t.host}`, command], { stdio: ['ignore', 'pipe', 'pipe'] });
    for (const stream of [child.stdout, child.stderr]) stream.on('data', data => { process.stdout.write(data); writeSync(fd, data); });
    const code = await new Promise((resolve, reject) => { child.on('error', reject); child.on('close', (code) => resolve(code ?? 1)); });
    process.exitCode = code;
    log(`本次退出码：${code}；日志：${logPath}`);
  } finally {
    if (stage) {
      try { ssh(t, `rm -f -- ${quote(stage + '/server-uninstall.py')}; rmdir -- ${quote(stage)}`); }
      catch { log(`临时卸载器未清除，请检查 ${stage}`); process.exitCode = 1; }
    }
    closeSync(fd);
  }
}
if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) {
  main().catch(error => { console.error(`卸载未完成：${error.status ? `子命令退出码 ${error.status}` : error.message}`); process.exitCode = 1; });
}
