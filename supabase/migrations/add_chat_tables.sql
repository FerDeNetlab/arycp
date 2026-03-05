-- Chat Interno: Conversaciones y Mensajes en Tiempo Real
-- Run this in Supabase SQL Editor

-- Conversaciones (1:1 entre usuarios internos)
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1 UUID NOT NULL REFERENCES auth.users(id),
  participant_2 UUID NOT NULL REFERENCES auth.users(id),
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(participant_1, participant_2)
);

-- Mensajes de chat
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread ON chat_messages(conversation_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_chat_conversations_p1 ON chat_conversations(participant_1);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_p2 ON chat_conversations(participant_2);

-- RLS (Row Level Security)
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Conversations: users can only see/create their own
CREATE POLICY "Users see own conversations" ON chat_conversations
  FOR SELECT USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users create conversations" ON chat_conversations
  FOR INSERT WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users update own conversations" ON chat_conversations
  FOR UPDATE USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- Messages: users can see/create messages in their own conversations
CREATE POLICY "Users see messages in own conversations" ON chat_messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM chat_conversations
      WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
    )
  );

CREATE POLICY "Users send messages in own conversations" ON chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT id FROM chat_conversations
      WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
    )
  );

CREATE POLICY "Users mark messages as read" ON chat_messages
  FOR UPDATE USING (
    sender_id != auth.uid() AND
    conversation_id IN (
      SELECT id FROM chat_conversations
      WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
    )
  );

-- Enable Realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
