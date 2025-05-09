-- Création de la table des réunions
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id VARCHAR NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Création de la table des messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id VARCHAR NOT NULL REFERENCES meetings(room_id),
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création d'un index pour améliorer les performances des requêtes sur room_id
CREATE INDEX IF NOT EXISTS messages_room_id_idx ON messages(room_id);
CREATE INDEX IF NOT EXISTS meetings_user_id_idx ON meetings(user_id);

-- Activer Row Level Security
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour meetings
-- Lecture: tout utilisateur authentifié peut voir les réunions (pour rejoindre par ID)
CREATE POLICY "Tout utilisateur peut voir les réunions" 
  ON meetings FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Création: l'utilisateur authentifié peut créer ses propres réunions
CREATE POLICY "Les utilisateurs peuvent créer leurs propres réunions" 
  ON meetings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Mise à jour: uniquement par le créateur de la réunion
CREATE POLICY "Le créateur peut mettre à jour sa réunion" 
  ON meetings FOR UPDATE 
  USING (auth.uid() = user_id);

-- Suppression: uniquement par le créateur de la réunion
CREATE POLICY "Le créateur peut supprimer sa réunion" 
  ON meetings FOR DELETE 
  USING (auth.uid() = user_id);

-- Politiques RLS pour messages
-- Lecture: tout utilisateur authentifié peut voir les messages d'une réunion
CREATE POLICY "Tout utilisateur peut voir les messages" 
  ON messages FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Création: l'utilisateur authentifié peut envoyer des messages
CREATE POLICY "Les utilisateurs peuvent envoyer des messages" 
  ON messages FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);

-- Mise à jour: uniquement par l'expéditeur du message
CREATE POLICY "L'expéditeur peut modifier son message" 
  ON messages FOR UPDATE 
  USING (auth.uid() = sender_id);

-- Suppression: uniquement par l'expéditeur du message
CREATE POLICY "L'expéditeur peut supprimer son message" 
  ON messages FOR DELETE 
  USING (auth.uid() = sender_id);

-- Activer les notifications en temps réel pour messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Remarque: Pour exécuter ce script dans l'interface SQL de Supabase
-- 1. Allez dans la section SQL du tableau de bord Supabase
-- 2. Créez une nouvelle requête et collez ce script
-- 3. Exécutez le script 