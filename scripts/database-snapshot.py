#!/usr/bin/env python3
"""只读输出每表行数、内容摘要和序列状态，不输出业务数据。"""
import json,re,subprocess,sys
name=sys.argv[1]
if not re.fullmatch(r'[a-zA-Z_][a-zA-Z0-9_]*',name): raise SystemExit('数据库名称无效')
def query(sql):
    command=['runuser','-u','postgres','--','psql','-XAt','-v','ON_ERROR_STOP=1','-d',name,'-c',sql]
    return subprocess.check_output(command,env={'PATH':'/usr/sbin:/usr/bin:/bin','PGOPTIONS':'-c timezone=UTC -c extra_float_digits=3'},text=True).strip()
def ident(v): return '"'+v.replace('"','""')+'"'
result={}
for table in query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename").splitlines():
    raw=query(f"SELECT json_build_object('count',count(*)::text,'digest',md5(coalesce(string_agg(h,'' ORDER BY h),''))) FROM (SELECT md5(row_to_json(t)::text) h FROM public.{ident(table)} t) s")
    result[table]=json.loads(raw)
result['_sequences']={}
for seq in query("SELECT sequencename FROM pg_sequences WHERE schemaname='public' ORDER BY sequencename").splitlines():
    result['_sequences'][seq]=json.loads(query(f'SELECT row_to_json(s) FROM (SELECT last_value::text,is_called FROM public.{ident(seq)}) s'))
print(json.dumps(result,ensure_ascii=False,sort_keys=True))
