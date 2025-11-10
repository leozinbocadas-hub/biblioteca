import { LogOut, Home, Newspaper, Users, User, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { NotificationButton } from '@/components/NotificationButton';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { icon: Home, label: 'Início', to: '/dashboard' },
    { icon: Newspaper, label: 'Feed Oculto', to: '/feed' },
    { icon: Users, label: 'Legião Oculta', to: '/comunidade' },
    { icon: Bot, label: 'Robô Oculto', to: '/robo-oculto' },
    { icon: User, label: 'Perfil', to: '/perfil' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1A1A1A] border-b border-purple-500/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo (Esquerda) */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
              <picture>
                <source srcSet="/logo.webp" type="image/webp" />
                <img 
                  src="/logo.png" 
                  alt="Biblioteca Mística Logo" 
                  className="w-full h-full object-contain"
                />
              </picture>
            </div>
            <span className="text-lg font-bold text-white">Biblioteca Mística</span>
          </div>

          {/* Links de Navegação (Centro) - APENAS DESKTOP */}
          {user && (
            <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center px-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-400 hover:bg-purple-500/10 hover:text-purple-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* User Info (Direita) */}
          {user && (
            <div className="flex items-center gap-2">
              {/* Botão de Notificações */}
              <NotificationButton />
              
              <span className="text-sm text-gray-400 hidden md:block">
                {user.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">Sair</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
