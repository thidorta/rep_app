import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { api } from '../../../src/services/api';
import { useRouter } from 'expo-router';

export default function LaunchPurchase() {
  const [desc, setDesc] = useState('');
  const [val, setVal] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSave() {
    if (!desc || !val) return Alert.alert("Erro", "Preencha tudo.");
    
    setLoading(true);
    try {
      const amount = parseFloat(val.replace(',', '.'));
      await api.post('/financas/compras-moradores', { 
        description: desc, 
        value: amount
      });
      
      Alert.alert("Sucesso", "Sua compra foi registrada e gerou crédito!");
      router.back(); // Volta para o Dashboard
    } catch (error) {
      Alert.alert("Erro", "Falha ao registrar compra.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lançar Compra</Text>
      <Text style={styles.subtitle}>O que você comprou para a casa?</Text>

      <TextInput 
        style={styles.input} 
        placeholder="Ex: Detergente e Bucha" 
        value={desc} 
        onChangeText={setDesc} 
      />

      <View style={styles.valueRow}>
        <Text style={styles.currency}>R$</Text>
        <TextInput 
          style={styles.valueInput} 
          placeholder="0.00" 
          keyboardType="numeric" 
          value={val} 
          onChangeText={setVal} 
        />
      </View>

      <TouchableOpacity 
        style={[styles.btn, loading && { opacity: 0.5 }]} 
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.btnText}>{loading ? "Salvando..." : "Confirmar Crédito"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, backgroundColor: '#fff', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { textAlign: 'center', color: '#666', marginBottom: 30 },
  input: { borderBottomWidth: 1, borderColor: '#ccc', padding: 10, fontSize: 18, marginBottom: 20 },
  valueRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', marginBottom: 40 },
  currency: { fontSize: 24, fontWeight: 'bold', marginRight: 10 },
  valueInput: { fontSize: 40, fontWeight: 'bold', color: '#4CD964', minWidth: 120 },
  btn: { backgroundColor: '#007AFF', padding: 20, borderRadius: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});