import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function FunctionsMenu() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>O que vamos fazer?</Text>
      
      <View style={styles.grid}>
        {/* Exemplo de futuro botão */}
        <TouchableOpacity style={styles.card} onPress={() => alert("Em breve: Lista de Mercado")}>
          <Ionicons name="cart" size={32} color="#007AFF" />
          <Text style={styles.cardText}>Mercado</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => alert("Em breve: Escala de Limpeza")}>
          <Ionicons name="sparkles" size={32} color="#FF9500" />
          <Text style={styles.cardText}>Limpeza</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.card} onPress={() => alert("Em breve: Escala de Tarefas")}>
          <Ionicons name="document-text" size={32} color="#4CD964" />
          <Text style={styles.cardText}>Tarefas</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.card} onPress={() => alert("Em breve: Lista de Manutenções")}>
          <Ionicons name="construct" size={32} color="#ff0000" />
          <Text style={styles.cardText}>Manutenções</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, alignContent: 'center', justifyContent: 'center' },
  card: { 
    width: '47%', 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
    elevation: 2, // Sombra Android
    shadowColor: '#000', // Sombra iOS
    shadowOffset: {width:0, height:2},
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  cardText: { marginTop: 10, fontWeight: '600', color: '#555' }
});