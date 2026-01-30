import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../../src/services/api';

export default function ReceiveScreen() {
  const [debtors, setDebtors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States do Modal
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [payValue, setPayValue] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const loadDebtors = useCallback(async () => {
    setLoading(true);
    try {
      // Esta rota deve retornar: { id, name, total_owed }
      const res = await api.get('/financas/devedores');
      setDebtors(res.data);
    } catch (error) {
      Alert.alert("Erro", "Falha ao carregar devedores.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDebtors(); }, [loadDebtors]);

  function openModal(user: any) {
    setSelectedUser(user);
    setPayValue(user.total_owed.toFixed(2)); // Sugere o total que ele deve
    setModalVisible(true);
  }

  async function handleConfirmPayment() {
    const amount = parseFloat(payValue.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) return Alert.alert("Erro", "Valor inválido");

    try {
      // AJUSTE: Usando a rota híbrida que criamos
      await api.post('/financas/pagar-divida', {
        user_id: selectedUser.id, // Ao passar user_id (e não o user_expense_id), o backend ativa o Smart Pay
        amount: amount
      });
      
      Alert.alert(
        "Sucesso", 
        `O valor de R$ ${amount.toFixed(2)} foi abatido das contas de ${selectedUser.name}`
      );
      
      setModalVisible(false);
      loadDebtors(); // Recarrega a lista para atualizar os saldos
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Não foi possível processar o pagamento.");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Receber Pagamentos</Text>
      {/*Se não tem devedor, retorna texto dizendo que não há devedores no momento */}
      {debtors.length === 0 && !loading && (
        <Text style={styles.noDebtorsText}>Não há devedores no momento.</Text>
      )}
      {loading ? <ActivityIndicator size="large" /> : (
        <FlatList
          data={debtors}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => openModal(item)}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name[0]}</Text>
              </View>
              <View style={{flex: 1, marginLeft: 15}}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.sub}>Total Pendente</Text>
              </View>
              <Text style={styles.debtValue}>R$ {item.total_owed.toFixed(2)}</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          )}
        />
      )}

      {/* MODAL DE PAGAMENTO TOTAL */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Receber de {selectedUser?.name}</Text>
            <Text style={styles.modalLabel}>Valor Total Recebido (PIX/Dinheiro):</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.currency}>R$</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={payValue}
                onChangeText={setPayValue}
                autoFocus
              />
            </View>

            <View style={styles.row}>
              <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnConfirm]} onPress={handleConfirmPayment}>
                <Text style={styles.btnText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  card: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', 
    padding: 15, borderRadius: 12, marginBottom: 10, elevation: 2 
  },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  name: { fontSize: 18, fontWeight: 'bold' },
  sub: { color: '#888', fontSize: 12 },
  debtValue: { fontSize: 18, fontWeight: 'bold', color: '#ff5252', marginRight: 10 },
  
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: '#fff', borderRadius: 20, padding: 25, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  modalLabel: { color: '#666', marginBottom: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderColor: '#007AFF', marginBottom: 30 },
  currency: { fontSize: 24, fontWeight: 'bold', marginRight: 10 },
  input: { fontSize: 32, fontWeight: 'bold', color: '#333', minWidth: 120, textAlign: 'center' },
  row: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center' },
  btnCancel: { backgroundColor: '#ff5252' },
  btnConfirm: { backgroundColor: '#4CD964' },
  btnText: { color: '#fff', fontWeight: 'bold' },
    noDebtorsText: { textAlign: 'center', color: '#000000', marginTop: 100, fontSize: 20}
});