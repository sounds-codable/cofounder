#!/usr/bin/env python3
"""仅卸载本项目的 Ubuntu 原生部署；默认只读，绝不加载 env 为代码。"""
import argparse
import fcntl
import grp
import json
import os
from pathlib import Path
import pwd
import re
import shutil
import subprocess
import sys
import time

APP = 'cofounder'


def log(kind, message):
    print(f'[{time.strftime("%H:%M:%S")}] [{kind}] {message}', flush=True)


def run(args, *, sql=None, allowed=(0,)):
    # 不输出原始命令、SQL 或 stderr，避免配置中的密码进入终端日志。
    result = subprocess.run(args, input=sql, text=True, capture_output=True, timeout=120)
    if result.returncode not in allowed:
        raise RuntimeError(f'{args[0]} 执行失败（退出码 {result.returncode}），请在服务器单独诊断该组件')
    return result.stdout.strip()


def env_read(path):
    values = {}
    if path.is_symlink():
        raise RuntimeError(f'配置文件不能是软链接：{path}')
    if not path.exists():
        return values
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        match = re.fullmatch(r'(?:export\s+)?([A-Z][A-Z0-9_]*)=(.*)', line)
        if not match:
            raise RuntimeError(f'配置格式无法安全解析：{path}（未输出内容）')
        key, value = match.groups()
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        values[key] = value
    return values


def exists(path):
    return path.exists() or path.is_symlink()


def guard_path(path):
    if path != path.resolve():
        raise RuntimeError(f'拒绝通过软链接或非规范路径操作：{path}')
    if Path('/proc/self/mountinfo').exists():
        for line in Path('/proc/self/mountinfo').read_text().splitlines():
            mount = Path(line.split()[4].replace('\\040', ' '))
            if mount == path or path in mount.parents:
                raise RuntimeError(f'删除目录包含挂载点，拒绝操作：{mount}')


class Uninstaller:
    def __init__(self, args):
        self.args = args
        self.root = Path(args.root)
        if args.root != '/var/www/www.cofounder.icu':
            raise RuntimeError('项目目录必须为 /var/www/www.cofounder.icu')
        self.home = Path('/var/lib/cofounder')
        self.backup = Path('/var/backups/cofounder')
        self.site = Path('/etc/nginx/sites-available/cofounder')
        self.enabled = Path('/etc/nginx/sites-enabled/cofounder')
        self.unit = Path('/etc/systemd/system/pm2-cofounder.service')
        self.unit_dropin = Path(str(self.unit) + '.d')
        self.domains = {args.domain} if args.domain else set()
        self.ports = set()
        self.storage = '未记录'
        self.state_file = Path('/var/log/cofounder-uninstall') / f'{args.target}.json'
        self.certs = []
        self.cert_checks = []
        self.shared_certs = []
        self.issues = []
        self.uid = None
        self.db_ready = False
        self.lock_files = []
        self.databases = []
        self.roles = ['cofounder', 'cofounder_app']
        self.supervisors = []
        self.supervisor_names = []
        self.sites = []
        self.extra = []

    def psql(self, sql):
        return run(['runuser', '-u', 'postgres', '--', 'psql', '-X', '-w', '-qAt',
                    '-v', 'ON_ERROR_STOP=1', '-d', 'postgres'], sql=sql)

    def db_state(self):
        return self.psql("SELECT '数据库:'||datname FROM pg_database WHERE datname='cofounder' OR datname ~ '^cofounder_migrated_' UNION ALL "
                         "SELECT '数据库账号:'||rolname FROM pg_roles WHERE rolname IN ('cofounder','cofounder_app');")

    def preflight(self):
        log('阶段', '1/4 只读核对区域、资源归属和依赖')
        for path in (self.root, self.root / 'shared', self.home, self.home / '.pm2', self.backup):
            guard_path(path)
        if Path('/etc/machine-id').read_text().strip() != self.args.machine_id:
            raise RuntimeError('SSH 服务器身份发生变化，拒绝操作')
        lock = self.root / 'shared/deploy.lock'
        if lock.exists():
            if lock.is_symlink():
                raise RuntimeError('部署锁不允许是软链接')
            handle = lock.open('r')
            fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
            self.lock_files.append(handle)
        if (self.root / 'shared/migration-running').exists():
            raise RuntimeError('迁移仍在进行，拒绝卸载')
        saved = {}
        if self.state_file.exists():
            guard_path(self.state_file)
            saved = json.loads(self.state_file.read_text())
            if saved.get('root') != str(self.root) or saved.get('target') != self.args.target:
                raise RuntimeError('历史卸载记录与当前目标不一致')
            self.ports.update(saved.get('ports', []))
        modern = env_read(self.root / 'shared/.env')
        legacy = env_read(self.root / 'shared/server/.env')
        app_env = modern or legacy
        region = self.root / 'shared/region'
        if region.exists() and region.read_text().strip() != self.args.target:
            raise RuntimeError('服务器区域标记与所选区域不一致')
        if modern and modern.get('SERVER_ROLE') != self.args.target:
            raise RuntimeError('SERVER_ROLE 与所选区域不一致')
        if legacy and (self.args.target != 'china' or modern):
            raise RuntimeError('旧 Supervisor 安装只允许在 China 卸载，且不可与新安装混用')
        if not app_env and not saved and not self.args.check:
            raise RuntimeError('缺少原始配置与卸载记录，无法确认资源归属；请先 --check')
        if not app_env and not saved:
            self.issues.append('缺少原配置与卸载记录，历史应用端口无法完整核验')
        for key, expected in [('DB_HOST', ('127.0.0.1', 'localhost')), ('DB_PORT', ('5432',)),
                              ('DB_USERNAME', tuple(self.roles))]:
            if app_env and app_env.get(key, '5432' if key == 'DB_PORT' else '') not in expected:
                raise RuntimeError(f'{key} 不属于本机项目专属数据库配置')
        dbname = app_env.get('DB_DATABASE', '')
        if dbname and not re.fullmatch(r'cofounder(?:_migrated_[0-9]{14}_[a-f0-9]{6})?', dbname):
            raise RuntimeError('数据库名不属于本项目安装/迁移范围')
        for key in ('WEB_PORT', 'PORT'):
            value = app_env.get(key)
            if value:
                if not value.isdigit() or not 1024 <= int(value) <= 65535:
                    raise RuntimeError(f'{key} 不是有效应用端口')
                self.ports.add(int(value))
        if legacy:
            self.ports.add(3000)
        self.domains = {self.args.domain, 'www.' + self.args.domain}
        for name in ('cofounder', 'cofounder.icu.conf'):
            site = Path('/etc/nginx/sites-available') / name
            enabled = Path('/etc/nginx/sites-enabled') / name
            if exists(site):
                names = set(' '.join(re.findall(r'\bserver_name\s+([^;]+);', site.read_text())).split())
                if site.is_symlink() or not names or not names <= self.domains:
                    raise RuntimeError(f'Nginx 文件包含非本项目域名：{site}')
                self.sites.append(site)
            if exists(enabled):
                if not enabled.is_symlink() or enabled.resolve() != site:
                    raise RuntimeError(f'Nginx 启用项归属不匹配：{enabled}')
                self.sites.insert(0, enabled)
        for directory, patterns in (
                ('/etc/nginx/sites-available', ('cofounder.icu.conf.bak.*', 'cofounder.icu.bak.*')),
                ('/etc/supervisor/conf.d', ('cofounder-backend.conf', 'supervisor.cofounder-frontend.conf',
                                           'cofounder-backend.conf.bak.*'))):
            for pattern in patterns:
                for path in Path(directory).glob(pattern):
                    if path.is_symlink() or str(self.root) not in path.read_text():
                        raise RuntimeError(f'专属配置归属无法确认：{path}')
                    if directory.endswith('conf.d'):
                        names = re.findall(r'^\[program:([^]\n]+)\]', path.read_text(), re.M)
                        expected = 'cofounder-backend' if path.name.startswith('cofounder-backend') else 'cofounder-frontend'
                        if names != [expected] or re.findall(r'^\[([^]\n]+)\]', path.read_text(), re.M) != ['program:' + expected]:
                            raise RuntimeError(f'Supervisor 配置包含非预期程序：{path}')
                        if '.bak.' not in path.name:
                            self.supervisors.append(path)
                            self.supervisor_names.append(expected)
                    else:
                        names = set(' '.join(re.findall(r'\bserver_name\s+([^;]+);', path.read_text())).split())
                        if not names or not names <= self.domains:
                            raise RuntimeError(f'Nginx 备份包含其它站点：{path}')
                    self.extra.append(path)
        if legacy and not self.supervisors and not saved:
            raise RuntimeError('旧安装缺少 Supervisor 归属证据')
        if self.unit.exists():
            if self.unit.is_symlink() or not re.search(r'^User=cofounder\s*$', self.unit.read_text(), re.M):
                raise RuntimeError('PM2 服务不是本项目专属用户')
        fragment = run(['systemctl', 'show', 'pm2-cofounder.service', '--property=FragmentPath', '--value'])
        if fragment and fragment != str(self.unit):
            raise RuntimeError('PM2 服务来自非预期路径')
        if exists(self.unit_dropin):
            raise RuntimeError('发现自定义 systemd drop-in，需先核对')
        try:
            account = pwd.getpwnam(APP)
        except KeyError:
            account = None
        if account:
            if account.pw_dir != str(self.home) or account.pw_uid < 100 or account.pw_shell not in ('/usr/sbin/nologin', '/sbin/nologin', '/bin/false'):
                raise RuntimeError('系统账号不是预期的专用服务账号')
            self.uid = account.pw_uid
        for dump in (self.home / '.pm2/dump.pm2', self.home / '.pm2/dump.pm2.bak'):
            if dump.exists() and any(item.get('name') not in ('cofounder-web', 'cofounder-api') for item in json.loads(dump.read_text())):
                raise RuntimeError('本用户 PM2 保存列表包含其它项目')
        for cmd in ('systemctl', 'runuser', 'ss', 'userdel', 'groupdel', 'psql'):
            if not shutil.which(cmd):
                raise RuntimeError(f'缺少必需命令：{cmd}')
        self.db_ready = True
        rows = self.psql("SELECT datname||'|'||pg_get_userbyid(datdba) FROM pg_database "
                         "WHERE datname='cofounder' OR datname ~ '^cofounder_migrated_' "
                         "OR pg_get_userbyid(datdba) IN ('cofounder','cofounder_app');")
        for row in rows.splitlines():
            name, owner = row.split('|')
            if not re.fullmatch(r'cofounder(?:_migrated_[0-9]{14}_[a-f0-9]{6})?', name) or owner not in self.roles:
                raise RuntimeError('数据库或角色被其它项目共用，拒绝删除')
            self.databases.append(name)
        self.discover_certs()
        self.cert_checks = sorted(set(self.certs + saved.get('certs', [])))
        if any(not re.fullmatch(r'[A-Za-z0-9._-]+', c) for c in self.cert_checks):
            raise RuntimeError('卸载记录中的证书名不安全')
        self.find_references(preflight=True)
        for path in self.targets():
            log('计划', f'{"存在，拟删除" if exists(path) else "不存在，跳过"}：{path}')
        log('计划', f'数据库：{self.databases}；专属数据库角色：{self.roles}')
        log('范围', f'仅当前 {self.args.target} 服务器；历史应用端口：{sorted(self.ports)}')
        log('说明', '删除代码、配置、日志、本机备份、独占证书；保留共用软件及 deployer 用户')
        log('审计', f'保留非敏感卸载记录 {self.state_file} 与 /run/lock/cofounder-uninstall.lock')
        for cert in self.certs:
            log('计划', f'删除独占证书：{cert}')
        for issue in self.issues:
            log('待处理', issue)

    def discover_certs(self):
        for renewal in sorted(Path('/etc/letsencrypt/renewal').glob('*.conf')):
            cert = renewal.stem
            if not re.fullmatch(r'[A-Za-z0-9._-]+', cert):
                raise RuntimeError('发现无法安全识别的证书名称')
            pem = Path('/etc/letsencrypt/live') / cert / 'cert.pem'
            if not pem.exists():
                if cert in self.domains or cert == APP:
                    raise RuntimeError('本项目证书损坏，无法安全识别其域名')
                continue
            names = set(re.findall(r'DNS:([^,\s]+)', run(['openssl', 'x509', '-in', str(pem), '-noout', '-ext', 'subjectAltName'])))
            if not names & self.domains:
                continue
            references = self.reference_files([f'/etc/letsencrypt/live/{cert}/'], exclude_site=True)
            if names <= self.domains and not references:
                self.certs.append(cert)
            else:
                self.shared_certs.append(cert)
        if self.certs and not shutil.which('certbot'):
            raise RuntimeError('发现待清理证书但缺少 certbot')

    def reference_files(self, tokens, *, exclude_site=False):
        found = []
        bases = ('/etc/nginx', '/etc/systemd/system', '/etc/cron.d', '/etc/cron.daily',
                 '/etc/cron.hourly', '/etc/cron.weekly', '/etc/cron.monthly', '/etc/supervisor',
                 '/var/spool/cron', '/etc/logrotate.d', '/etc/postgresql', '/etc/ufw')
        files = [Path('/etc/crontab'), Path('/etc/rc.local')]
        for base in bases:
            directory = Path(base)
            if directory.exists():
                files.extend(p for p in directory.rglob('*') if p.is_file())
        for path in files:
            if not path.is_file():
                continue
            if exclude_site and path.resolve() in {p.resolve() for p in self.sites + self.extra}:
                continue
            content = path.read_text(errors='replace')
            if any(token in content for token in tokens):
                found.append(path)
        return sorted(set(found))

    def find_references(self, *, preflight=False):
        tokens = [APP, str(self.root)] + list(self.domains)
        managed = {p.resolve() for p in self.targets() if p != self.root}
        for path in self.reference_files(tokens):
            if preflight and path.resolve() in managed:
                continue
            self.issues.append(f'额外配置引用，需核对：{path}')

    def targets(self):
        fixed = [Path('/etc/nginx/sites-enabled') / name for name in ('cofounder', 'cofounder.icu.conf')]
        fixed += [Path('/etc/nginx/sites-available') / name for name in ('cofounder', 'cofounder.icu.conf')]
        fixed += [Path('/etc/supervisor/conf.d') / name for name in ('cofounder-backend.conf', 'supervisor.cofounder-frontend.conf')]
        return list(dict.fromkeys(fixed + self.extra + [self.unit, self.root, self.home, self.backup] + self.temp_targets()))

    def find_docker_residuals(self):
        if not Path('/var/run/docker.sock').exists():
            if Path('/var/lib/docker').exists():
                self.issues.append('存在 Docker 数据目录但 daemon 不可访问，无法排除历史容器/镜像/卷残留')
            return
        if not shutil.which('docker'):
            self.issues.append('存在 Docker socket 但缺少客户端，无法检查历史项目资源')
            return
        for args, label in (
                (['ps', '-a', '--format', '{{.Names}} {{.Label "com.docker.compose.project"}} {{.Label "com.docker.compose.project.working_dir"}}'], '容器'),
                (['image', 'ls', '--format', '{{.Repository}}:{{.Tag}}'], '镜像'),
                (['volume', 'ls', '--format', '{{.Name}} {{.Label "com.docker.compose.project"}}'], '数据卷'),
                (['network', 'ls', '--format', '{{.Name}} {{.Label "com.docker.compose.project"}}'], '网络')):
            for line in run(['docker'] + args).splitlines():
                if APP in line or str(self.root) in line:
                    self.issues.append(f'历史 Docker {label}待核对（未盲目删除）：{line}')

    def temp_targets(self):
        # 仅处理部署器使用的明确项目前缀，不包含正在执行的卸载器。
        patterns = ('cofounder-????????T??????Z-??????.tar.gz', 'cofounder-bootstrap-*.tar.gz',
                    'cofounder-china-*.dump', 'cofounder-snapshot-*.py',
                    'cofounder-verified-*.json', 'cofounder-env-*')
        return sorted({p for pattern in patterns for p in Path('/tmp').glob(pattern)})

    def remove(self, path):
        if not exists(path):
            log('跳过', f'已不存在：{path}')
            return
        log('删除', str(path))
        if path.is_symlink() or path.is_file():
            path.unlink()
        else:
            guard_path(path)
            shutil.rmtree(path)

    def process_ids(self):
        pids = []
        for proc in Path('/proc').glob('[0-9]*'):
            try:
                own = self.uid is not None and proc.stat().st_uid == self.uid
                cwd = (proc / 'cwd').resolve()
                if own or cwd == self.root or self.root in cwd.parents:
                    pids.append(int(proc.name))
            except (FileNotFoundError, PermissionError, ProcessLookupError):
                continue
        return pids

    def execute(self):
        log('阶段', '2/4 停止服务并清理对外入口')
        # 保留非敏感验收元数据，供代码及 .env 删除后的 --check 使用。
        self.state_file.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        guard_path(self.state_file.parent)
        if self.state_file.is_symlink():
            raise RuntimeError('卸载记录不能是软链接')
        self.state_file.write_text(json.dumps(dict(root=str(self.root), target=self.args.target,
                                                 domains=sorted(self.domains), ports=sorted(self.ports),
                                                 storage=self.storage, certs=self.cert_checks), ensure_ascii=False))
        self.state_file.chmod(0o600)
        if self.supervisors:
            for name in self.supervisor_names:
                status = run(['supervisorctl', 'status', name], allowed=(0, 3, 4))
                if 'RUNNING' in status or 'STARTING' in status:
                    run(['supervisorctl', 'stop', name])
            for path in self.supervisors:
                self.remove(path)
            run(['supervisorctl', 'reread'])
            run(['supervisorctl', 'update'] + self.supervisor_names)
            log('停止', '旧 Supervisor 前后端及自启配置')
        run(['systemctl', 'disable', '--now', 'pm2-cofounder.service'], allowed=(0, 1, 5))
        pids = self.process_ids()
        if pids:
            import signal
            log('停止', f'本项目进程 PID：{pids}')
            for sig in (signal.SIGTERM, signal.SIGKILL):
                for pid in self.process_ids():
                    try:
                        os.kill(pid, sig)
                    except ProcessLookupError:
                        pass
                if sig == signal.SIGTERM:
                    time.sleep(2)
            if self.process_ids():
                raise RuntimeError('本项目仍有进程未退出，停止后续删除')
        # 先撤销站点，再删除证书；nginx 配置检测失败时恢复站点。
        stash = []
        for path in self.sites:
            if exists(path):
                stash.append((path, path.readlink() if path.is_symlink() else path.read_bytes(), path.is_symlink()))
                path.unlink()
        if shutil.which('nginx'):
            try:
                run(['nginx', '-t'])
                if run(['systemctl', 'is-active', 'nginx'], allowed=(0, 3)) == 'active':
                    run(['systemctl', 'reload', 'nginx'])
            except Exception:
                for path, data, link in reversed(stash):
                    path.symlink_to(data) if link else path.write_bytes(data)
                raise RuntimeError('Nginx 检查或重载失败，站点已恢复；数据库和代码尚未删除')
        for cert in self.certs:
            log('删除', f'独占 TLS 证书和续期配置：{cert}')
            run(['certbot', 'delete', '--non-interactive', '--cert-name', cert])
        log('阶段', '3/4 删除数据库、专属账号、代码、配置、上传与备份')
        if self.db_ready:
            for name in self.databases:
                self.psql(f'DROP DATABASE IF EXISTS "{name}" WITH (FORCE);')
                log('删除', f'PostgreSQL 数据库：{name}')
            for role in self.roles:
                self.psql(f'DROP ROLE IF EXISTS "{role}";')
                log('删除', f'PostgreSQL 专属角色：{role}')
        for path in self.targets():
            if path not in (self.root, self.home, self.backup):
                self.remove(path)
        run(['systemctl', 'daemon-reload'])
        run(['systemctl', 'reset-failed', 'pm2-cofounder.service'], allowed=(0, 1))
        if self.uid is not None:
            run(['userdel', APP])  # 不使用 -r，目录由明确白名单处理。
            log('删除', '系统专属用户 cofounder')
        try:
            group = grp.getgrnam(APP)
        except KeyError:
            group = None
        if group:
            if group.gr_mem or any(p.pw_gid == group.gr_gid for p in pwd.getpwall()):
                self.issues.append('cofounder 系统组仍被其它用户使用，已保留')
            else:
                run(['groupdel', APP])
        for path in (self.root, self.home, self.backup):
            self.remove(path)

    def verify(self):
        log('阶段', '4/4 清理结果逐项验收')
        issues = list(self.issues)
        for path in self.targets():
            if exists(path):
                issues.append(f'文件或目录仍存在：{path}')
            else:
                log('通过', f'无残留：{path}')
        if self.db_ready:
            state = self.db_state()
            if state:
                issues.append(f'PostgreSQL 残留：{state.replace(chr(10), "、")}')
            else:
                log('通过', '数据库和数据库账号均不存在')
        for lookup, label in ((pwd.getpwnam, '系统用户'), (grp.getgrnam, '系统组')):
            try:
                lookup(APP)
                issues.append(f'{label}仍存在：{APP}')
            except KeyError:
                log('通过', f'{label}已不存在')
        pids = self.process_ids()
        if pids:
            issues.append(f'本项目进程仍存在：{pids}')
        else:
            log('通过', '未发现专属用户或项目目录关联的进程')
        active = run(['systemctl', 'is-active', 'pm2-cofounder.service'], allowed=(0, 3, 4))
        enabled = run(['systemctl', 'is-enabled', 'pm2-cofounder.service'], allowed=(0, 1, 3, 4))
        if active == 'active' or enabled in ('enabled', 'enabled-runtime', 'linked', 'linked-runtime'):
            issues.append('PM2 systemd 服务仍在运行或仍启用')
        else:
            log('通过', f'PM2 systemd 服务已停用：{active} / {enabled}')
        if shutil.which('supervisorctl'):
            status = run(['supervisorctl', 'status'], allowed=(0, 3))
            if re.search(r'^cofounder-(backend|frontend)\s', status, re.M):
                issues.append('Supervisor 仍加载本项目前后端')
            else:
                log('通过', 'Supervisor 无本项目前后端条目')
        listeners = run(['ss', '-H', '-lntup'])
        for port in sorted(self.ports):
            if re.search(rf':{port}\s', listeners):
                issues.append(f'历史应用端口 {port} 仍被监听（未按端口盲目杀进程，请核对归属）')
            else:
                log('通过', f'历史应用端口 {port} 无监听')
        self.issues = []
        self.find_references()
        self.find_docker_residuals()
        issues.extend(self.issues)
        for cert in self.cert_checks:
            for path in (Path('/etc/letsencrypt/renewal') / f'{cert}.conf',
                         Path('/etc/letsencrypt/live') / cert, Path('/etc/letsencrypt/archive') / cert):
                if exists(path):
                    issues.append(f'证书残留：{path}')
        issues.extend(f'共享证书已保留，需核对：{c}' for c in self.shared_certs)
        if shutil.which('nginx'):
            run(['nginx', '-t'])
            log('通过', '剩余 Nginx 配置语法正确')
        if self.storage not in ('local', '未记录'):
            log('范围外', 'COS 等外部对象未删除；本次结果仅代表服务器本机资源')
        for issue in sorted(set(issues)):
            log('待处理', issue)
        if issues:
            log('结果', f'仍有 {len(set(issues))} 项需处理，未宣称清理完成；退出码 2')
            return 2
        log('结果', '服务器本机已知项目资源验收通过；外部平台、异机备份及未登记自定义路径不在核验范围')
        return 0


def main():
    parser = argparse.ArgumentParser(description='Cofounder服务器卸载：默认只读预览，执行时删除数据及备份')
    parser.add_argument('--root', default='/var/www/www.cofounder.icu', help='服务器项目目录')
    parser.add_argument('--target', required=True, choices=('china', 'us'), help='只处理选定区域')
    parser.add_argument('--machine-id', required=True, help='两端对比后选定的服务器身份')
    parser.add_argument('--domain', required=True, help='项目域名，删除项目后可用于再次检查证书/配置引用')
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--execute', action='store_true', help='执行不可逆删除并验收')
    mode.add_argument('--check', action='store_true', help='只做残留验收，不删除')
    parser.add_argument('--yes', action='store_true', help='配合 --execute 跳过输入项目名确认')
    args = parser.parse_args()
    if sys.platform != 'linux' or os.geteuid() != 0:
        parser.error('必须在 Linux 服务器使用 sudo/root 运行；本地请使用 uninstall-remote.sh')
    # 避免继承终端 PG* 改变目标 PostgreSQL 集群，固定本机默认 socket/端口。
    for key in list(os.environ):
        if key.startswith('PG'):
            del os.environ[key]
    os.environ.update(PGHOST='/var/run/postgresql', PGPORT='5432', PGCONNECT_TIMEOUT='5', LC_ALL='C')
    # 从项目目录手动运行时，避免把卸载器自身识别成残留进程。
    os.chdir('/')
    worker = Uninstaller(args)
    # 锁文件是空白运维互斥元数据，刻意保留，避免 unlink 后形成两把不同的锁。
    with open('/run/lock/cofounder-uninstall.lock', 'a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        worker.preflight()
        if args.check:
            return worker.verify()
        if not args.execute:
            for issue in sorted(set(worker.issues)):
                log('待处理', issue)
            log('预览', '未删除任何资源。添加 --execute 执行；添加 --check 只验收残留')
            return 0
        if not args.yes:
            if input(f'将永久删除项目、数据库、上传和服务器本机备份。输入 {APP}/{args.target} 确认：') != f'{APP}/{args.target}':
                log('取消', '未确认，未执行删除')
                return 1
        try:
            worker.execute()
        except Exception as error:
            log('失败', str(error))
            log('提示', '执行中断，继续只读验收，列出剩余资源')
            worker.verify()
            return 1
        return worker.verify()


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (RuntimeError, OSError, ValueError, subprocess.SubprocessError) as error:
        log('失败', str(error))
        log('结果', '未完成清理；修复问题后可重跑。未输出敏感配置内容')
        sys.exit(1)
