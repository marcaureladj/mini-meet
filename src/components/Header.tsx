import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  showShareButton?: boolean;
  onShareClick?: () => void;
  isLinkCopied?: boolean;
  onLeaveClick?: () => void;
  title?: string;
}

const Header = ({ 
  showShareButton = false, 
  onShareClick, 
  isLinkCopied = false, 
  onLeaveClick,
  title = "MiniMeet"
}: HeaderProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // Récupère le nom d'affichage de l'utilisateur depuis les metadata
  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Utilisateur';
  
  // Crée les initiales pour l'avatar (2 premières lettres du nom)
  const initials = displayName
    .split(' ')
    .map((name: string) => name.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);

  return (
    <header className="bg-white dark:bg-dark-light shadow">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
        
        <div className="flex items-center space-x-4">
          {showShareButton && (
            <button
              onClick={onShareClick}
              className="btn btn-secondary text-sm"
            >
              {isLinkCopied ? 'Lien copié!' : 'Copier le lien'}
            </button>
          )}
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center">
                {initials}
              </div>
              <span className="text-gray-700 dark:text-gray-300 hidden md:block">
                {displayName}
              </span>
            </div>
            
            {onLeaveClick ? (
              <button
                onClick={onLeaveClick}
                className="btn bg-red-500 hover:bg-red-600 text-white text-sm"
              >
                Quitter
              </button>
            ) : (
              <button
                onClick={handleSignOut}
                className="btn btn-secondary text-sm"
              >
                Déconnexion
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 