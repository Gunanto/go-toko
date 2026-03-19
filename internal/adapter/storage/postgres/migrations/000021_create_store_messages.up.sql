CREATE TABLE IF NOT EXISTS store_messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES store_conversations(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL,
    sender_customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
    sender_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT store_messages_sender_type_check CHECK (sender_type IN ('customer', 'admin'))
);

CREATE INDEX IF NOT EXISTS idx_store_messages_conversation_id_id
    ON store_messages (conversation_id, id);
