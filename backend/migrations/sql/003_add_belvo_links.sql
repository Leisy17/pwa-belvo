BEGIN;

CREATE TABLE IF NOT EXISTS belvo_links (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    institution_id TEXT NOT NULL,
    belvo_link_id TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL,
    username TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ,
    external_id TEXT,
    institution_name TEXT,
    country TEXT
);

CREATE INDEX IF NOT EXISTS idx_belvo_links_user_id ON belvo_links(user_id);
CREATE INDEX IF NOT EXISTS idx_belvo_links_user_institution ON belvo_links(user_id, institution_id);

ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS link_id TEXT REFERENCES belvo_links(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_accounts_link_id ON accounts(link_id);

COMMIT;
