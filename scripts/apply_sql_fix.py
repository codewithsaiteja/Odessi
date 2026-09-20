import subprocess
import os

env = os.environ.copy()
env["PGPASSWORD"] = "odessi_password"
psql = r"C:\Program Files\PostgreSQL\18\bin\psql.exe"

sql_file = r"e:\Odessi Store\odessi-store\scripts\fix_product_names.sql"

cmd = [psql, "-U", "odessi_user", "-d", "odessi", "-h", "localhost", "-f", sql_file]
result = subprocess.run(cmd, env=env, capture_output=True, text=True)
print("STDOUT:\n", result.stdout)
if result.stderr:
    print("STDERR:\n", result.stderr)
