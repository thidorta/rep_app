import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { User } from '../types';
import { router } from 'expo-router';

interface AuthContextData {
  user: User | null;
  signIn: (email: string, pass: string) => Promise<void>;
  signOut: () => void;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStorage();
  }, []);

  async function loadStorage() {
    const token = await AsyncStorage.getItem('@token');
    if (token) {
      try {
        const response = await api.get('/usuarios/me'); 
        setUser(response.data);
      } catch {
        await AsyncStorage.removeItem('@token');
      }
    }
    setIsLoading(false);
  }

  async function signIn(username: string, password: string) {
    setIsLoading(true);
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await api.post('/login', formData.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token } = response.data;
    await AsyncStorage.setItem('@token', access_token);

    // Busca dados do usuário após login
    const userResp = await api.get('/usuarios/me');
    setUser(userResp.data);

    // Redireciona para a área principal (home)
    try {
      router.replace('/(app)');
    } finally {
      setIsLoading(false);
    }
  }

  function signOut() {
    setIsLoading(true);
    AsyncStorage.removeItem('@token');
    setUser(null);
    try {
      router.replace('/(auth)/login');
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshUser() {
    try {
      // Chama a rota que retorna os dados do usuário logado
      const response = await api.get('/usuarios/me');
      
      // Atualiza o estado global 'user'. 
      // O React percebe a mudança e redesenha as telas automaticamente!
      setUser(response.data); 
    } catch (error) {
      console.log("Erro ao atualizar dados do usuário:", error);
    }
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, isLoading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);