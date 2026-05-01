-- migrate:up

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS google_sub text,
  ADD COLUMN IF NOT EXISTS auth_provider varchar(50) NOT NULL DEFAULT 'email';

CREATE UNIQUE INDEX IF NOT EXISTS uk_users_google_sub ON users (google_sub) WHERE google_sub IS NOT NULL;

CREATE TABLE IF NOT EXISTS mindmaps (
  id uuid NOT NULL DEFAULT uuidv7() CONSTRAINT pk_mindmaps_id PRIMARY KEY,
  user_id uuid NOT NULL CONSTRAINT fk_mindmaps_user_id REFERENCES users(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL DEFAULT 'Untitled mind map',
  nodes jsonb NOT NULL DEFAULT '[]'::jsonb,
  edges jsonb NOT NULL DEFAULT '[]'::jsonb,
  viewport jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone
);

CREATE INDEX IF NOT EXISTS idx_mindmaps_user_id_created_at ON mindmaps (user_id, created_at DESC);

-- migrate:down

DROP INDEX IF EXISTS idx_mindmaps_user_id_created_at;
DROP TABLE IF EXISTS mindmaps;
DROP INDEX IF EXISTS uk_users_google_sub;
ALTER TABLE users DROP COLUMN IF EXISTS auth_provider;
ALTER TABLE users DROP COLUMN IF EXISTS google_sub;
