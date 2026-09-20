-- Fix BCrypt hash for admin@odessi.tfi so Admin@Odessi123 authenticates properly in development
UPDATE users
SET password_hash = '$2a$12$m.X.vt/FMN.ZjsSIIWmdJ.i11JkO3oa2zPW25sbQt/ke3OWdWdOFi'
WHERE email = 'admin@odessi.tfi';
