# Contexte Technique de MiniMeet

## Stack Technique

### Frontend
- **React.js**: Framework JavaScript pour l'interface utilisateur
- **Tailwind CSS**: Framework CSS utilitaire pour le styling
- **React Router DOM**: Pour la gestion des routes et la navigation

### Backend et Base de Données
- **Supabase**: Plateforme backend-as-a-service offrant:
  - Authentification
  - Base de données PostgreSQL
  - Fonctionnalités temps réel
  - Stockage

### Communication en Temps Réel
- **PeerJS**: Bibliothèque pour la communication WebRTC peer-to-peer
- **Supabase Realtime**: Pour le chat en temps réel et la synchronisation

### Médias
- **MediaRecorder API**: API Web native pour l'enregistrement des flux média
- **WebRTC**: Technologie web pour les communications audio/vidéo en temps réel
- **getDisplayMedia API**: Pour la fonctionnalité de partage d'écran

## Architecture Technique

### Structure des Composants React
- Approche modulaire avec composants réutilisables
- Utilisation du Context API pour la gestion d'état global
- Hooks React pour la gestion d'état local et les effets

### Gestion de l'Authentification
- Flux d'authentification complet via Supabase Auth
- Sessions persistantes
- Contrôle d'accès sur les routes protégées

### Communication P2P
- Utilisation de PeerJS comme abstraction au-dessus de WebRTC
- Établissement de connexions peer-to-peer pour les flux audio/vidéo
- Flux de données séparés pour le partage d'écran

### Stockage des Données
- Tables Supabase pour les informations utilisateurs et réunions
- Structure de la base de données optimisée pour les requêtes fréquentes
- Policies Supabase pour la sécurité au niveau de la base de données

### Enregistrement des Réunions
- Capture des flux médias via MediaRecorder
- Génération de fichiers .webm téléchargeables
- Stockage local des enregistrements (sans upload sur le serveur)

## Dépendances Principales
- react, react-dom
- react-router-dom
- @supabase/supabase-js
- peerjs
- tailwindcss
- uuid (pour la génération d'identifiants uniques)

## Configuration du Développement
- Projet initié avec Vite pour des performances optimales
- ESLint pour la qualité du code
- Prettier pour le formatage
- Structure de dossiers organisée par type (components, pages, services)

## Considérations Techniques
- Compatibilité navigateur pour WebRTC et MediaRecorder
- Gestion de la bande passante pour les connexions P2P
- Optimisation des performances pour l'interface utilisateur
- Sécurité des connexions et des données utilisateur 