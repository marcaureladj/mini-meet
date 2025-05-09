# Contexte Actif - MiniMeet

## État Actuel du Projet
MiniMeet a maintenant sa structure de base en place. Les composants principaux, pages et services ont été créés. Le projet utilise React avec TypeScript et est configuré avec Tailwind CSS pour le styling. Le script SQL pour la création des tables Supabase est maintenant disponible. Le formulaire d'inscription a été amélioré pour inclure le nom complet de l'utilisateur.

## Focus Actuel
- Tests et finalisation de l'authentification avec Supabase
- Mise en place des tables nécessaires dans Supabase (script SQL disponible dans `sql/create_tables.sql`)
- Tests des fonctionnalités de visioconférence avec PeerJS
- Tests du chat en temps réel avec Supabase Realtime
- Capture et stockage des informations utilisateur (nom et prénom) pendant l'inscription

## Décisions Récentes
- Utilisation de TypeScript pour améliorer la robustesse du code
- Structure modulaire avec services séparés pour Supabase et PeerJS
- Composants réutilisables pour les fonctionnalités vidéo, chat et contrôles
- Utilisation de classes Tailwind pour une interface utilisateur cohérente
- Définition de politiques RLS (Row Level Security) pour sécuriser les données dans Supabase
- Ajout du champ "Nom et prénom" dans le formulaire d'inscription, stocké dans le champ `display_name` de Supabase Auth

## Prochaines Étapes
1. **Configuration Supabase**:
   - Exécuter le script SQL pour créer les tables `meetings` et `messages` avec leurs indices et politiques RLS
   - Activer les notifications en temps réel pour la table `messages`
   - Tester les fonctionnalités d'authentification

2. **Tests PeerJS**:
   - Tester les connexions P2P
   - Optimiser la gestion des flux audio/vidéo
   - Gérer les cas d'erreur et les reconnexions

3. **Finalisation UI/UX**:
   - Améliorer le responsive design
   - Optimiser les animations et transitions
   - Tester sur différents appareils et navigateurs
   - Afficher le nom complet de l'utilisateur dans l'interface

4. **Déploiement**:
   - Préparer l'application pour la production
   - Déployer sur une plateforme d'hébergement

## Architecture de la Base de Données
### Table `meetings`
- `id`: UUID (clé primaire)
- `room_id`: VARCHAR (unique, utilisé pour les connexions PeerJS)
- `user_id`: UUID (référence à auth.users, le créateur de la réunion)
- `created_at`: TIMESTAMP
- `ended_at`: TIMESTAMP (pour marquer la fin d'une réunion)

### Table `messages`
- `id`: UUID (clé primaire)
- `room_id`: VARCHAR (référence à meetings.room_id)
- `sender_id`: UUID (référence à auth.users, l'expéditeur)
- `content`: TEXT (contenu du message)
- `created_at`: TIMESTAMP

### Données Utilisateur (Supabase Auth)
- Données standard: email, mot de passe, etc.
- Données personnalisées: `display_name` (nom et prénom de l'utilisateur)

Les deux tables sont sécurisées avec des politiques RLS pour contrôler l'accès aux données.

## Challenges Actuels
- Configuration optimale de PeerJS pour les connexions P2P fiables
- Gestion des différents états de connexion et reconnexion
- Optimisation des performances pour les appels avec plusieurs participants
- Gestion des cas limites pour l'enregistrement et le partage d'écran

## Considérations Actives
- Expérience utilisateur fluide sur différents appareils et navigateurs
- Sécurité des données et des connexions
- Performance des connexions P2P avec plusieurs participants
- Compatibilité des API MediaRecorder et WebRTC sur différents navigateurs
- Affichage correct des noms d'utilisateurs dans l'interface (chat, visioconférence)

## Statut des Fonctionnalités

| Fonctionnalité              | Statut          | Priorité  |
|-----------------------------|-----------------|-----------|
| Structure du Projet         | Complété        | Haute     |
| Authentification            | En cours        | Haute     |
| Dashboard                   | Complété        | Haute     |
| Création de réunion         | Complété        | Haute     |
| Visioconférence P2P         | À tester        | Haute     |
| Contrôles Audio/Vidéo       | Complété        | Haute     |
| Chat en temps réel          | À tester        | Moyenne   |
| Partage d'écran             | Complété        | Moyenne   |
| Enregistrement de réunion   | Complété        | Moyenne   |
| UI/UX                       | En cours        | Moyenne   |
| Tests                       | À démarrer      | Basse     |
| Profil utilisateur          | Commencé        | Moyenne   | 