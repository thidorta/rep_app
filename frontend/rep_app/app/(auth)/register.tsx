import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert, ActivityIndicator } from 'react-native';
import { api } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  async function handleRegister() {
    try {
      setLoading(true);
      await api.post('/usuarios', { name, email, password });
      // após criar, loga automaticamente
      await signIn(email, password);
    } catch (error: any) {
      Alert.alert('Erro', error?.response?.data?.detail || 'Falha no registro.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Criar Conta</Text>
      <TextInput placeholder="Nome" style={styles.input} value={name} onChangeText={setName} />
      <TextInput placeholder="E-mail" style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput placeholder="Senha" style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
      {loading ? <ActivityIndicator size="large" /> : <Button title="Registrar" onPress={handleRegister} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 12, borderRadius: 6 }
});
