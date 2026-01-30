import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { router } from 'expo-router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    try {
      setLoading(true);
      await signIn(email, password);
    } catch (error: any) {
      Alert.alert('Erro', error?.response?.data?.detail || 'Falha no login. Verifique seus dados.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>RepApp</Text>
      <TextInput 
        placeholder="E-mail" 
        style={styles.input} 
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput 
        placeholder="Senha" 
        style={styles.input} 
        secureTextEntry 
        value={password}
        onChangeText={setPassword}
      />
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button title="Entrar" onPress={handleLogin} />
      )}
      <TouchableOpacity onPress={() => router.push('./register')} style={styles.registerLink}>
        <Text style={styles.registerText}>Ainda não tem conta? Registre-se</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 40, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 15, marginBottom: 15, borderRadius: 5 },
  registerLink: { marginTop: 16, alignItems: 'center' },
  registerText: { color: '#2b6cb0' }
});