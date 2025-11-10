import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { BannerCarousel } from '@/components/BannerCarousel';
import { ModuleCard } from '@/components/ModuleCard';
import { NewPostButton } from '@/components/NewPostButton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Modulo } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Sparkles } from 'lucide-react';

const Dashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [modules, setModules] = useState<Modulo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [daysSincePurchase, setDaysSincePurchase] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (user) {
      loadModules();
      calculateDaysSincePurchase();
    }
  }, [user, authLoading, navigate]);

  const calculateDaysSincePurchase = () => {
    if (!user?.purchase_date) return;

    const purchaseDate = new Date(user.purchase_date);
    const today = new Date();
    const diffTime = today.getTime() - purchaseDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    setDaysSincePurchase(diffDays);
  };

  const loadModules = async () => {
    try {
      const { data, error } = await supabase
        .from('modulos')
        .select('*')
        .order('order_number', { ascending: true });

      if (error) throw error;
      setModules(data || []);
    } catch (error) {
      console.error('Error loading modules:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os módulos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isModuleLocked = (moduleNumber: number) => {
    // Modules 1-9 are always unlocked
    if (moduleNumber <= 9) return false;
    // Modules 10-24 require 7 days
    return daysSincePurchase < 7;
  };

  const getDaysUntilUnlock = () => {
    return Math.max(0, 7 - daysSincePurchase);
  };

  const handleModuleClick = (module: Modulo) => {
    if (!isModuleLocked(module.order_number)) {
      navigate(`/modulo/${module.slug}`);
    } else {
      toast({
        title: 'Módulo bloqueado',
        description: `Este módulo será liberado em ${getDaysUntilUnlock()} dias`,
        variant: 'destructive',
      });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#0A0A0A] pb-20 lg:pb-8">
        <Navbar />

      {/* Banner Carousel */}
      <div className="pt-16">
        <BannerCarousel />
      </div>

      {/* Hero Section */}
      <div className="pt-12 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-primary animate-pulse" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary-glow to-secondary bg-clip-text text-transparent">
                Bem-vindo à Biblioteca Mística
              </h1>
              <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            </div>
            <p className="text-muted-foreground text-lg">
              Explore os mistérios do conhecimento esotérico
            </p>
            {daysSincePurchase < 7 && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <span className="text-sm text-primary font-medium">
                  Novos módulos serão liberados em {getDaysUntilUnlock()} {getDaysUntilUnlock() === 1 ? 'dia' : 'dias'}
                </span>
              </div>
            )}
          </div>

          {/* Modules Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fade-in">
            {modules.map((module) => {
              const locked = isModuleLocked(module.order_number);
              return (
                <ModuleCard
                  key={module.id}
                  title={module.title}
                  orderNumber={module.order_number}
                  isLocked={locked}
                  daysUntilUnlock={locked ? getDaysUntilUnlock() : undefined}
                  coverImageUrl={module.cover_image_url}
                  onClick={() => handleModuleClick(module)}
                />
              );
            })}
          </div>
        </div>
      </div>

        <NewPostButton />
        <BottomNav />
      </div>
    </>
  );
};

export default Dashboard;
