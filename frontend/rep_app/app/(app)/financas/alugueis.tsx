import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TextInput, 
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform 
} from 'react-native';
import { api } from '../../../src/services/api';
import { User } from '../../../src/types';

export default function RentScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Armazena as mudanças locais antes de salvar
  const [updates, setUpdates] = useState<{[key: number]: string}>({});

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const res = await api.get('/financas/alugueis-fixos');
      setUsers(res.data);
      
      // Inicializa os inputs com os valores atuais
      const initialUpdates: any = {};
      res.data.forEach((u: User) => {
        initialUpdates[u.id] = u.fixed_rent ? String(u.fixed_rent) : '0';
      });
      setUpdates(initialUpdates);

    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os moradores.');
    }
  }

  function handleInputChange(userId: number, text: string) {
    // Permite apenas números e ponto
    const validText = text.replace(',', '.');
    setUpdates(prev => ({ ...prev, [userId]: validText }));
  }

  async function handleSave() {
    setLoading(true);
    try {
      // Prepara o payload para a API
      const payload = Object.keys(updates).map(userId => ({
        user_id: parseInt(userId),
        fixed_rent: parseFloat(updates[parseInt(userId)]) || 0
      }));

      await api.put('/financas/alugueis-fixos', payload);
      Alert.alert('Sucesso', 'Valores de aluguel atualizados!');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao salvar alterações.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Definir Aluguéis</Text>
        <Text style={styles.subtitle}>Quanto cada um paga de base (Aluguel + IPTU)?</Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
            <View style={styles.card}>
                {/* 1. Wrapper do texto com flex: 1 para ocupar o espaço sobrando e não ser esmagado */}
                <View style={styles.infoContainer}>
                    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
                </View>
                
                {/* 2. Container do Input com largura fixa */}
                <View style={styles.inputWrapper}>
                    <Text style={styles.currency}>R$</Text>
                    <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    maxLength={8} // 3. Trava para não digitar infinitamente (ex: 99999.99)
                    placeholder="0.00"
                    value={updates[item.id]}
                    onChangeText={(text) => handleInputChange(item.id, text)}
                />
            </View>
        </View>
        )}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          <Text style={styles.saveText}>{loading ? 'Salvando...' : 'Salvar Alterações'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  title: { fontSize: 22, fontWeight: 'bold' },
  subtitle: { color: '#666', marginTop: 5 },
  
  card: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    backgroundColor: '#fff', 
    marginHorizontal: 20, 
    marginTop: 10, 
    padding: 15, 
    borderRadius: 10,
    elevation: 2 
  },

  // NOVO: Container para Nome e Email
  infoContainer: {
    flex: 1, // Ocupa todo o espaço disponível à esquerda
    marginRight: 10, // Dá um respiro para o input
  },
  
  name: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  
  email: { 
    fontSize: 12, 
    color: '#888' 
  },
  
  // ATUALIZADO: Container do Input
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderBottomWidth: 1, 
    borderColor: '#ccc', 
    width: 100, // Largura fixa: O input nunca passará desse tamanho
    justifyContent: 'flex-end'
  },

  currency: { 
    fontSize: 16, 
    color: '#333', 
    marginRight: 5 
  },

  input: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#007AFF', 
    flex: 1, // Preenche a largura do inputWrapper
    textAlign: 'right', 
    paddingVertical: 5 
  },

  footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee' },
  saveBtn: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});