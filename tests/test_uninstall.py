"""在临时文件系统及模拟服务中验证卸载；不连接服务器、不调用真实删除命令。"""
import contextlib
import importlib.util
import io
from pathlib import Path
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('uninstall', Path(__file__).resolve().parents[1] / 'scripts/server-uninstall.py')
u = importlib.util.module_from_spec(spec)
spec.loader.exec_module(u)


class UninstallTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='cofounder-uninstall-test-')
        self.addCleanup(self.temp.cleanup)
        self.fs = Path(self.temp.name).resolve()
        self.commands = []
        self.dropped = False
        self.role_dropped = False
        self.owner = 'cofounder'
        self.patches = contextlib.ExitStack()
        self.addCleanup(self.patches.close)
        self.patches.enter_context(contextlib.redirect_stdout(io.StringIO()))
        self.patches.enter_context(patch.object(u, 'Path', self.path))
        self.patches.enter_context(patch.object(u, 'run', self.mock_run))
        self.patches.enter_context(patch.object(u.shutil, 'which', return_value='/mock/bin'))
        self.patches.enter_context(patch.object(u.pwd, 'getpwnam', side_effect=KeyError))
        self.patches.enter_context(patch.object(u.grp, 'getgrnam', side_effect=KeyError))
        self.write('/etc/machine-id', 'a' * 32)
        self.args = SimpleNamespace(root='/var/www/www.cofounder.icu', target='china',
                                    domain='cofounder.icu', machine_id='a' * 32, check=False)
        self.worker = u.Uninstaller(self.args)
        self.write('/var/www/www.cofounder.icu/shared/server/.env',
                   'DB_HOST=127.0.0.1\nDB_PORT=5432\nDB_USERNAME=cofounder\nDB_DATABASE=cofounder\nPORT=3010\n')
        self.write('/etc/supervisor/conf.d/cofounder-backend.conf',
                   '[program:cofounder-backend]\ndirectory=' + str(self.worker.root) + '/current/server')
        self.write('/etc/nginx/sites-available/cofounder.icu.conf',
                   'server { server_name cofounder.icu www.cofounder.icu; }')
        link = self.path('/etc/nginx/sites-enabled/cofounder.icu.conf')
        link.parent.mkdir(parents=True, exist_ok=True)
        link.symlink_to(self.path('/etc/nginx/sites-available/cofounder.icu.conf'))

    def path(self, value):
        value = str(value)
        if value.startswith(str(self.fs)):
            return Path(value)
        return self.fs / value.lstrip('/')

    def write(self, value, text):
        p = self.path(value)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(text)
        return p

    def mock_run(self, args, *, sql=None, allowed=(0,)):
        self.commands.append((args, sql))
        if sql:
            if sql.startswith('SELECT datname'):
                return '' if self.dropped else 'cofounder|' + self.owner
            if sql.startswith("SELECT '数据库:"):
                return '' if self.dropped and self.role_dropped else '数据库:cofounder'
            if sql.startswith('DROP DATABASE'):
                self.dropped = True
            if sql.startswith('DROP ROLE'):
                self.role_dropped = True
        if args[:2] == ['systemctl', 'is-active']:
            return 'inactive'
        if args[:2] == ['systemctl', 'is-enabled']:
            return 'disabled'
        return ''

    def test_preview_never_drops_data_or_removes_files(self):
        self.worker.preflight()
        self.assertTrue(self.worker.root.exists())
        self.assertFalse(self.dropped)
        self.assertFalse(any(args[0] in ('certbot', 'userdel', 'groupdel') for args, _ in self.commands))

    def test_execute_and_check_are_repeatable(self):
        self.worker.preflight()
        self.worker.execute()
        self.assertFalse(self.worker.root.exists())
        self.assertEqual(self.worker.verify(), 0)
        # 配置删除后依据非敏感记录恢复核验范围。
        second = u.Uninstaller(self.args)
        second.preflight()
        self.assertEqual(second.ports, {3000, 3010})
        self.assertEqual(second.verify(), 0)
        self.assertTrue(self.worker.state_file.exists())

    def test_reject_wrong_region_machine_and_db_owner(self):
        self.args.target = 'us'
        with self.assertRaisesRegex(RuntimeError, 'China'):
            self.worker.preflight()
        self.args.target = 'china'
        self.args.machine_id = 'b' * 32
        with self.assertRaisesRegex(RuntimeError, '身份'):
            self.worker.preflight()
        self.args.machine_id = 'a' * 32
        self.owner = 'postgres'
        with self.assertRaisesRegex(RuntimeError, '共用'):
            self.worker.preflight()
        self.assertFalse(self.dropped)

    def test_reject_shared_db_credentials(self):
        self.write('/var/www/www.cofounder.icu/shared/server/.env',
                   'DB_HOST=127.0.0.1\nDB_USERNAME=postgres\nDB_DATABASE=cofounder\n')
        with self.assertRaisesRegex(RuntimeError, 'DB_USERNAME'):
            self.worker.preflight()
        self.assertFalse(self.dropped)

    def test_nginx_failure_restores_site_and_keeps_database(self):
        self.worker.preflight()
        original = self.mock_run
        def failed(args, **kwargs):
            if args == ['nginx', '-t']:
                raise RuntimeError('模拟 Nginx 检查失败')
            return original(args, **kwargs)
        with patch.object(u, 'run', failed):
            with self.assertRaisesRegex(RuntimeError, '站点已恢复'):
                self.worker.execute()
        self.assertTrue(self.path('/etc/nginx/sites-enabled/cofounder.icu.conf').is_symlink())
        self.assertTrue(self.worker.root.exists())
        self.assertFalse(self.dropped)

    def test_residual_config_returns_nonzero(self):
        self.worker.preflight()
        self.worker.execute()
        self.write('/etc/cron.d/unknown', 'echo cofounder')
        self.assertEqual(self.worker.verify(), 2)

    def test_does_not_remove_foreign_nginx_site(self):
        self.write('/etc/nginx/sites-available/cofounder.icu.conf',
                   'server { server_name unrelated.example; }')
        with self.assertRaisesRegex(RuntimeError, '非本项目域名'):
            self.worker.preflight()

    def test_path_symlink_guard(self):
        other = self.path('/other-project')
        other.mkdir()
        alias = self.path('/alias')
        alias.symlink_to(other)
        with self.assertRaisesRegex(RuntimeError, '软链接'):
            u.guard_path(alias)
        self.assertTrue(other.exists())


if __name__ == '__main__':
    unittest.main()
