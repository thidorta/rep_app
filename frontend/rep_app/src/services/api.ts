import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Lógica inteligente para escolher o endereço
const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return BASE_URL; // No navegador, localhost funciona
  }
  
  if (Platform.OS === 'android') {
    // Se for emulador: 'http://10.0.2.2:8000'
    // Se for celular físico: use seu IP da rede
    return ; 
  }
  
  return ; // iOS Simulator
};

export const api = axios.create({
  baseURL: getBaseUrl(),
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@token');
  if (token && config && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});