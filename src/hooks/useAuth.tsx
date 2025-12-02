import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi, setToken, removeToken, isAuthenticated, getUserIdFromToken, decodeToken } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface User {
  id: number;
  nome: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      if (isAuthenticated()) {
        const userId = getUserIdFromToken();
        if (userId) {
          // Check if token is expired
          const token = localStorage.getItem('token');
          if (token) {
            const decoded = decodeToken(token);
            if (decoded && decoded.exp * 1000 < Date.now()) {
              // Token expired
              removeToken();
              setUser(null);
              setLoading(false);
              return;
            }
          }

          // Fetch user profile
          try {
            const profile = await authApi.getProfile(userId);
            setUser({
              id: userId,
              nome: profile.nome,
              email: profile.email,
            });
          } catch (error) {
            // If profile fetch fails, still keep user logged in with minimal info
            setUser({
              id: userId,
              nome: '',
              email: '',
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      await authApi.register(fullName, email, password);
      
      toast({
        title: "Cadastro realizado!",
        description: "Sua conta foi criada. Faça login para continuar.",
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Não foi possível criar a conta.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      setToken(response.token);
      
      const userId = getUserIdFromToken();
      if (userId) {
        try {
          const profile = await authApi.getProfile(userId);
          setUser({
            id: userId,
            nome: profile.nome,
            email: profile.email,
          });
        } catch {
          setUser({
            id: userId,
            nome: '',
            email: email,
          });
        }
      }

      toast({
        title: "Login realizado!",
        description: "Bem-vindo ao NEXUS.",
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message || "Email ou senha incorretos.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    removeToken();
    setUser(null);
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado.",
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signUp,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
