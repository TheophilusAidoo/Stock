-- ============================================
-- Support Messages Table for Chat-like Support
-- ============================================
CREATE TABLE IF NOT EXISTS support_messages (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_type TEXT CHECK (sender_type IN ('user', 'admin')) NOT NULL,
  sender_id TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON support_messages(created_at ASC);

-- Enable RLS
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages for their own tickets
DROP POLICY IF EXISTS "Users can view own ticket messages" ON support_messages;
CREATE POLICY "Users can view own ticket messages" ON support_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE support_tickets.id = support_messages.ticket_id 
      AND support_tickets.user_id = auth.uid()::text
    )
  );

-- Policy: Admins can manage all messages
DROP POLICY IF EXISTS "Admins can manage all ticket messages" ON support_messages;
CREATE POLICY "Admins can manage all ticket messages" ON support_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Migrate existing admin_response to messages
INSERT INTO support_messages (id, ticket_id, sender_type, sender_id, message, created_at)
SELECT 
  'MSG' || ticket.id || '_' || EXTRACT(EPOCH FROM ticket.updated_at)::bigint,
  ticket.id,
  'admin',
  'ADMIN',
  ticket.admin_response,
  ticket.updated_at
FROM support_tickets ticket
WHERE ticket.admin_response IS NOT NULL AND ticket.admin_response != '';










