import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Mensagem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const HISTORICO_KEY = 'robo_oculto_historico';
const HISTORICO_DURACAO_HORAS = 48;

interface HistoricoSalvo {
  mensagens: Mensagem[];
  timestamp: number; // timestamp de quando foi criado
}

const RoboOculto = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Carregar histórico salvo ou usar mensagem inicial
  const carregarHistorico = (): Mensagem[] => {
    try {
      const historicoSalvo = localStorage.getItem(HISTORICO_KEY);
      if (!historicoSalvo) {
        return [
          {
            id: '1',
            role: 'assistant',
            content: 'Olá! Sou o Robô Oculto, seu assistente místico. Como posso ajudá-lo hoje com conhecimento esotérico, astrologia, cabala ou outras práticas sagradas?',
            timestamp: new Date(),
          },
        ];
      }

      const historico: HistoricoSalvo = JSON.parse(historicoSalvo);
      const agora = Date.now();
      const tempoDecorrido = agora - historico.timestamp;
      const horasDecorridas = tempoDecorrido / (1000 * 60 * 60);

      // Se passou mais de 48 horas, limpar e retornar mensagem inicial
      if (horasDecorridas >= HISTORICO_DURACAO_HORAS) {
        localStorage.removeItem(HISTORICO_KEY);
        return [
          {
            id: '1',
            role: 'assistant',
            content: 'Olá! Sou o Robô Oculto, seu assistente místico. Como posso ajudá-lo hoje com conhecimento esotérico, astrologia, cabala ou outras práticas sagradas?',
            timestamp: new Date(),
          },
        ];
      }

      // Converter timestamps string de volta para Date
      return historico.mensagens.map((msg) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      return [
        {
          id: '1',
          role: 'assistant',
          content: 'Olá! Sou o Robô Oculto, seu assistente místico. Como posso ajudá-lo hoje com conhecimento esotérico, astrologia, cabala ou outras práticas sagradas?',
          timestamp: new Date(),
        },
      ];
    }
  };

  const [mensagens, setMensagens] = useState<Mensagem[]>(carregarHistorico);
  const [inputMensagem, setInputMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Salvar histórico no localStorage
  const salvarHistorico = (msgs: Mensagem[]) => {
    try {
      const historico: HistoricoSalvo = {
        mensagens: msgs,
        timestamp: Date.now(),
      };
      localStorage.setItem(HISTORICO_KEY, JSON.stringify(historico));
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [mensagens]);

  // Salvar histórico sempre que mensagens mudarem
  useEffect(() => {
    salvarHistorico(mensagens);
  }, [mensagens]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleEnviarMensagem = async () => {
    if (!inputMensagem.trim() || enviando) return;

    const novaMensagem: Mensagem = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMensagem,
      timestamp: new Date(),
    };

    setMensagens((prev) => [...prev, novaMensagem]);
    const mensagemEnviada = inputMensagem;
    setInputMensagem('');
    setEnviando(true);

    try {
      // Integração com N8N webhook (produção)
      const response = await fetch('https://n8n.produtohub.store/webhook/agenteia-biblioteca', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mensagem: mensagemEnviada,
          usuario: user?.nome_exibicao || user?.email || 'Usuário',
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao comunicar com o agente: ${response.status}`);
      }

      const data = await response.json();
      
      // Extrair resposta do N8N - prioriza o campo "output"
      let respostaTexto = '';
      
      if (data.output) {
        respostaTexto = typeof data.output === 'string' ? data.output : String(data.output);
      } else if (typeof data === 'string') {
        respostaTexto = data;
      } else if (data.response) {
        respostaTexto = typeof data.response === 'string' ? data.response : String(data.response);
      } else if (data.text) {
        respostaTexto = typeof data.text === 'string' ? data.text : String(data.text);
      } else if (data.message) {
        respostaTexto = typeof data.message === 'string' ? data.message : String(data.message);
      } else if (data.answer) {
        respostaTexto = typeof data.answer === 'string' ? data.answer : String(data.answer);
      } else if (data.data) {
        respostaTexto = typeof data.data === 'string' ? data.data : String(data.data);
      } else if (Array.isArray(data) && data.length > 0) {
        respostaTexto = typeof data[0] === 'string' ? data[0] : String(data[0]);
      } else {
        respostaTexto = JSON.stringify(data);
      }
      
      // Limpar markdown e caracteres de escape
      respostaTexto = respostaTexto
        .replace(/\\n/g, '\n') // Converter \n para quebra de linha real
        .replace(/\\"/g, '"') // Converter \" para "
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remover **bold**
        .replace(/\*(.*?)\*/g, '$1') // Remover *italic*
        .replace(/_(.*?)_/g, '$1') // Remover _underline_
        .replace(/`(.*?)`/g, '$1') // Remover `code`
        .replace(/```[\s\S]*?```/g, '') // Remover blocos de código
        .replace(/#{1,6}\s/g, '') // Remover headers markdown
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remover links markdown [text](url)
        .trim();
      
      const resposta: Mensagem = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: respostaTexto,
        timestamp: new Date(),
      };
      
      setMensagens((prev) => [...prev, resposta]);
    } catch (error) {
      console.error('Erro ao comunicar com o agente de IA:', error);
      
      const resposta: Mensagem = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente em alguns instantes.',
        timestamp: new Date(),
      };
      
      setMensagens((prev) => [...prev, resposta]);
    } finally {
      setEnviando(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviarMensagem();
    }
  };

  const formatarHora = (data: Date) => {
    return data.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user) return null;

  return (
    <>
      <div className="min-h-screen bg-[#0A0A0A] pb-20 lg:pb-8 flex flex-col">
        <Navbar />
        
        <div className="flex-1 flex flex-col pt-16 max-w-4xl mx-auto w-full px-4">
          {/* Cabeçalho */}
          <div className="py-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">🤖 Robô Oculto</h1>
                <p className="text-sm text-gray-400">
                  Seu assistente místico de IA
                </p>
              </div>
            </div>
          </div>

          {/* Área de Mensagens */}
          <div className="flex-1 overflow-y-auto py-6 space-y-6">
            {mensagens.map((mensagem) => (
              <div
                key={mensagem.id}
                className={`flex gap-4 ${
                  mensagem.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {mensagem.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] md:max-w-[70%] ${
                    mensagem.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-[#1A1A1A] text-gray-100 border border-gray-800'
                  } rounded-lg px-4 py-3`}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {mensagem.content}
                  </div>
                  <div
                    className={`text-xs mt-2 ${
                      mensagem.role === 'user' ? 'text-purple-200' : 'text-gray-500'
                    }`}
                  >
                    {formatarHora(mensagem.timestamp)}
                  </div>
                </div>

                {mensagem.role === 'user' && (
                  <img
                    src={user?.foto_perfil_url || 'https://via.placeholder.com/32'}
                    alt="Você"
                    className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                  />
                )}
              </div>
            ))}

            {/* Indicador de "digitando..." */}
            {enviando && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-[#1A1A1A] border border-gray-800 rounded-lg px-4 py-3">
                  <div className="flex gap-1">
                    <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                    <span className="text-gray-400 text-sm">Digitando...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Área de Input */}
          <div className="border-t border-gray-800 py-4">
            <div className="flex gap-3">
              <Textarea
                ref={textareaRef}
                value={inputMensagem}
                onChange={(e) => setInputMensagem(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)"
                className="flex-1 bg-[#1A1A1A] border-gray-700 text-white placeholder:text-gray-500 resize-none focus:border-purple-500"
                rows={1}
                disabled={enviando}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />
              <Button
                onClick={handleEnviarMensagem}
                disabled={!inputMensagem.trim() || enviando}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed px-6"
              >
                {enviando ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Conectado ao Robô Oculto
            </p>
          </div>
        </div>
      </div>
      <BottomNav />
    </>
  );
};

export default RoboOculto;

