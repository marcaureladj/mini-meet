import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Landing: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const isMounted = useRef(true);

  useEffect(() => {
    // Si l'utilisateur est connecté, rediriger vers le dashboard
    if (user && !loading && isMounted.current) {
      navigate('/dashboard');
    }

    // Nettoyer lors du démontage
    return () => {
      isMounted.current = false;
    };
  }, [user, loading, navigate]);

  // Afficher un spinner pendant le chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark">
      <header className="bg-white dark:bg-dark-light shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-xl">
                M
              </div>
            </div>
            <h1 className="ml-3 text-2xl font-bold text-gray-900 dark:text-white">MiniMeet</h1>
          </div>
          <div className="flex space-x-3">
            <Link to="/login" className="btn btn-secondary">
              Connexion
            </Link>
            <Link to="/register" className="btn btn-primary">
              Inscription
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Section Hero */}
        <div className="relative bg-white dark:bg-dark-light overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="relative z-10 pb-8 bg-white dark:bg-dark-light sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
              <div className="pt-10 mx-auto max-w-7xl px-4 sm:pt-12 sm:px-6 md:pt-16 lg:pt-20 lg:px-8 xl:pt-28">
                <div className="sm:text-center lg:text-left">
                  <h2 className="text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
                    <span className="block">Réunions vidéo</span>
                    <span className="block text-blue-600">simples et efficaces</span>
                  </h2>
                  <p className="mt-3 text-base text-gray-500 dark:text-gray-300 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                    MiniMeet vous permet d'organiser des réunions vidéo en quelques clics. Partagez votre écran, discutez avec vos collègues et enregistrez vos réunions facilement.
                  </p>
                  <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                    <div className="rounded-md shadow">
                      <Link to="/register" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10">
                        Commencer gratuitement
                      </Link>
                    </div>
                    <div className="mt-3 sm:mt-0 sm:ml-3">
                      <Link to="/login" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 md:py-4 md:text-lg md:px-10">
                        Se connecter
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 bg-blue-50 dark:bg-gray-800 flex items-center justify-center">
            <div className="h-56 w-full sm:h-64 md:h-80 lg:h-full lg:w-full flex items-center justify-center p-8">
              <img 
                src="https://via.placeholder.com/600x400?text=MiniMeet+Video+Call" 
                alt="MiniMeet illustration" 
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>

        {/* Section Fonctionnalités */}
        <div className="py-12 bg-gray-50 dark:bg-dark">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Fonctionnalités</h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Une meilleure façon de communiquer
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-300 lg:mx-auto">
                MiniMeet propose des outils simples mais puissants pour vos réunions en ligne.
              </p>
            </div>

            <div className="mt-10">
              <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Vidéoconférence HD</h3>
                    <p className="mt-2 text-base text-gray-500 dark:text-gray-300">
                      Qualité audio et vidéo optimale pour des communications claires et efficaces.
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Chat en temps réel</h3>
                    <p className="mt-2 text-base text-gray-500 dark:text-gray-300">
                      Partagez des messages textuels pendant vos réunions pour plus d'interactions.
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Enregistrement MP4</h3>
                    <p className="mt-2 text-base text-gray-500 dark:text-gray-300">
                      Enregistrez vos réunions au format MP4 pour les consulter ultérieurement.
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Sécurité renforcée</h3>
                    <p className="mt-2 text-base text-gray-500 dark:text-gray-300">
                      Communications sécurisées et confidentialité de vos données garanties.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white dark:bg-dark-light">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
              M
            </div>
            <span className="ml-2 text-gray-500 dark:text-gray-300">© 2023 MiniMeet</span>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-500 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-200">
              Confidentialité
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-200">
              Conditions
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-200">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing; 