import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Modulo, PDF } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Download, Eye, ArrowLeft, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const Module = () => {
  const { slug } = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const [module, setModule] = useState<Modulo | null>(null);
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPdf, setSelectedPdf] = useState<PDF | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (user && slug) {
      loadModuleData();
    }
  }, [user, authLoading, slug, navigate]);

  const loadModuleData = async () => {
    try {
      // Load module
      const { data: moduleData, error: moduleError } = await supabase
        .from('modulos')
        .select('*')
        .eq('slug', slug)
        .single();

      if (moduleError) throw moduleError;
      setModule(moduleData);

      // Load PDFs for this module
      const { data: pdfData, error: pdfError } = await supabase
        .from('pdfs')
        .select('*')
        .eq('modulo_id', moduleData.id)
        .order('title', { ascending: true });

      if (pdfError) throw pdfError;
      setPdfs(pdfData || []);
    } catch (error) {
      console.error('Error loading module data:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o módulo',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (pdf: PDF) => {
    window.open(pdf.file_url, '_blank');
  };

  const handleView = (pdf: PDF) => {
    setSelectedPdf(pdf);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando módulo...</p>
        </div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-2xl font-bold mb-4">Módulo não encontrado</h1>
            <Button onClick={() => navigate('/dashboard')}>
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 w-full overflow-x-hidden">
      <Navbar />

      <div className="pt-20 sm:pt-24 px-4 sm:px-6 lg:px-8 w-full">
        <div className="w-full max-w-5xl mx-auto">
          {/* Breadcrumb */}
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4 sm:mb-6 text-muted-foreground hover:text-foreground text-sm sm:text-base"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            Voltar ao Dashboard
          </Button>

          {/* Module Header */}
          <div className="mb-6 sm:mb-8 animate-fade-in">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                <span className="text-base sm:text-lg font-bold text-primary-foreground">
                  {module.order_number}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent break-words">
                {module.title}
              </h1>
            </div>
          </div>

          {/* PDFs List */}
          <div className="w-full space-y-3 sm:space-y-4 animate-fade-in">
            {pdfs.length === 0 ? (
              <div className="w-full text-center py-8 sm:py-12 bg-card/50 rounded-lg border border-border">
                <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground px-4">
                  Nenhum conteúdo disponível neste módulo ainda
                </p>
              </div>
            ) : (
              pdfs.map((pdf) => (
                <div
                  key={pdf.id}
                  className="w-full group bg-card/50 backdrop-blur-sm rounded-lg border border-border p-4 sm:p-5 md:p-6 hover:border-primary/50 transition-all duration-300"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-3 sm:gap-4 w-full min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                      </div>
                      <h3 className="flex-1 font-semibold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors break-words min-w-0">
                        {pdf.title}
                      </h3>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(pdf)}
                        className="w-full sm:w-auto sm:flex-1 border-primary/30 hover:bg-primary/10 text-sm sm:text-base"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Visualizar
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleDownload(pdf)}
                        className="w-full sm:w-auto sm:flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-sm sm:text-base"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      <Dialog open={!!selectedPdf} onOpenChange={() => setSelectedPdf(null)}>
        <DialogContent className="w-screen h-screen max-w-none sm:max-w-[95vw] md:max-w-5xl sm:h-[95vh] md:h-[90vh] p-0 m-0 sm:m-auto sm:rounded-lg overflow-hidden">
          <DialogHeader className="flex-shrink-0 p-3 sm:p-4 md:p-6 pb-2 sm:pb-3 md:pb-4 border-b border-border">
            <DialogTitle className="text-sm sm:text-base md:text-lg pr-10 truncate">{selectedPdf?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden w-full h-full">
            {selectedPdf && (
              <iframe
                src={selectedPdf.file_url}
                className="w-full h-[calc(100vh-56px)] sm:h-[calc(95vh-80px)] md:h-[calc(90vh-88px)] border-0"
                title={selectedPdf.title}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Module;
