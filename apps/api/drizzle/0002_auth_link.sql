ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS auth_user_id text REFERENCES "user" (id);

CREATE UNIQUE INDEX IF NOT EXISTS usuarios_auth_user_id_idx
  ON usuarios (auth_user_id);
