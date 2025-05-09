# MiniMeet - Plateforme de Visioconférence

MiniMeet est une plateforme de visioconférence simple, rapide et efficace, construite avec React, Tailwind CSS et Supabase.

## Fonctionnalités

- Authentification via Supabase
- Création et participation à des appels vidéo P2P
- Chat en temps réel
- Enregistrement de réunion (téléchargeable)
- Partage d'écran
- Interface propre et responsive

## Stack Technique

- **Frontend**: React.js + Tailwind CSS
- **Auth + Base de données**: Supabase (auth + Realtime)
- **Appels vidéo P2P**: PeerJS
- **Enregistrement réunion**: MediaRecorder API
- **Routing**: React Router DOM

## Installation

1. Clonez ce dépôt :
   ```
   git clone https://github.com/votre-utilisateur/minimeet.git
   cd minimeet
   ```

2. Installez les dépendances :
   ```
   npm install
   ```

3. Créez un fichier `.env` à partir du fichier `.env.example` et ajoutez vos identifiants Supabase :
   ```
   VITE_SUPABASE_URL=votre_url_supabase
   VITE_SUPABASE_ANON_KEY=votre_clé_anon_supabase
   ```

4. Lancez l'application en mode développement :
   ```
   npm run dev
   ```

## Configuration de Supabase

1. Créez un nouveau projet Supabase
2. Allez dans la section SQL du tableau de bord Supabase
3. Créez une nouvelle requête et exécutez le contenu du fichier `sql/create_tables.sql` 
   (Ce script créera les tables `meetings` et `messages` avec les champs nécessaires et les politiques RLS)
4. Vous pouvez aussi créer manuellement les tables avec la structure suivante:

### Structure de la Base de Données Supabase

#### Table : `meetings`

| Champ       | Type     | Description        |
| ----------- | -------- | ------------------ |
| id          | UUID     | ID de la réunion   |
| room_id     | string   | Identifiant PeerJS |
| user_id     | UUID     | Créateur           |
| created_at  | datetime |                    |
| ended_at    | datetime | Fin de la réunion  |

#### Table : `messages`

| Champ       | Type     | Description            |
| ----------- | -------- | ---------------------- |
| id          | UUID     |                        |
| room_id     | string   | Identifiant de réunion |
| sender_id   | UUID     | Utilisateur            |
| content     | text     | Message                |
| created_at  | datetime |                        |

5. Assurez-vous d'activer Row Level Security (RLS) sur les deux tables
6. Configurez les politiques RLS comme défini dans le script SQL
7. Activez les notifications en temps réel pour la table `messages`
8. Utilisez les clés d'API dans votre fichier `.env`

## Déploiement

Cette application peut être déployée sur n'importe quelle plateforme supportant les applications Node.js comme Vercel, Netlify, ou Heroku.

## Licence

MIT
