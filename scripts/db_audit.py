import subprocess
import os

env = os.environ.copy()
env["PGPASSWORD"] = "odessi_password"
psql = r"C:\Program Files\PostgreSQL\18\bin\psql.exe"

sql = """
SELECT p.id, p.name, p.slug, p.active,
       COUNT(DISTINCT pv.id) as variants_cnt,
       COUNT(DISTINCT pi.id) as images_cnt,
       COUNT(DISTINCT ci.id) as cart_items_cnt,
       COUNT(DISTINCT wi.id) as wishlist_items_cnt,
       COUNT(DISTINCT oi.id) as order_items_cnt,
       COUNT(DISTINCT pr.id) as reviews_cnt,
       COUNT(DISTINCT il.id) as inv_logs_cnt
FROM products p
LEFT JOIN product_variants pv ON pv.product_id = p.id
LEFT JOIN product_images pi ON pi.product_id = p.id
LEFT JOIN cart_items ci ON ci.variant_id = pv.id
LEFT JOIN wishlist_items wi ON wi.product_id = p.id
LEFT JOIN order_items oi ON oi.variant_id = pv.id
LEFT JOIN product_reviews pr ON pr.product_id = p.id
LEFT JOIN inventory_logs il ON il.variant_id = pv.id
GROUP BY p.id, p.name, p.slug, p.active
ORDER BY p.id;

SELECT count(*) as total_orders FROM orders;
"""

cmd = [psql, "-U", "odessi_user", "-d", "odessi", "-h", "localhost", "-c", sql]
result = subprocess.run(cmd, env=env, capture_output=True, text=True)
print("STDOUT:\n", result.stdout)
