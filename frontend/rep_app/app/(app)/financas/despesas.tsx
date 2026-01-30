import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, RefreshControl, Alert, Modal, TextInput 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../../src/services/api';
import { useAuth } from '../../../src/context/AuthContext';

export default function ExpensesScreen() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // States do Modal de Pagamento
  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  const [payValue, setPayValue] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const loadExpenses = useCallback(async () => {
    try {
      // DICA: Certifique-se que esta rota retorna o nome do usuário (user_name) 
      // e os detalhes da despesa (expense_description) para o Admin.
      const response = await api.get('/financas/despesas'); 
      setExpenses(response.data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar as despesas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  // --- FUNÇÃO PARA ABRIR O MODAL ---
  function openPayModal(item: any) {
    setSelectedDebt(item);
    // Calcula o que falta: Valor Total - Valor já Pago
    const restante = item.value - (item.paid_amount || 0);
    setPayValue(restante.toFixed(2));
    setModalVisible(true);
  }

  // --- FUNÇÃO PARA CONFIRMAR O PAGAMENTO ---
  async function handleConfirmPayment() {
    if (!selectedDebt || !payValue) return;

    const amount = parseFloat(payValue.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      return Alert.alert("Erro", "Insira um valor válido.");
    }

    try {
      await api.post('/financas/pagar-divida', {
        user_expense_id: selectedDebt.id,
        amount: amount
      });

      Alert.alert("Sucesso", "Pagamento registrado com sucesso!");
      setModalVisible(false);
      loadExpenses(); // Recarrega para atualizar os valores na lista
    } catch (error) {
      Alert.alert("Erro", "Não foi possível registrar o pagamento.");
    }
  }

  const renderItem = ({ item }: { item: any }) => {
    const isPaid = item.is_paid;
    const paidAmount = item.paid_amount || 0;
    const totalValue = item.value;
    const progress = (paidAmount / totalValue) * 100;
    const isAdmin = user?.role_tag === 'admin' || user?.role_tag === 'admin_finance';

    return (
      <View style={styles.card}>
        <View style={styles.cardMain}>
          <View style={[styles.statusIcon, isPaid ? styles.bgSuccess : styles.bgWarning]}>
            <Ionicons name={isPaid ? "checkmark" : "time-outline"} size={20} color="#fff" />
          </View>

          <View style={{ flex: 1, marginLeft: 10 }}>
            {/* Se for admin, mostra de quem é a conta */}
            {isAdmin && item.user_name && (
              <Text style={styles.userName}>👤 {item.user_name}</Text>
            )}
            <Text style={styles.description}>{item.expense_description || "Despesa"}</Text>
            <Text style={styles.date}>Vencimento: {item.due_date || "--/--"}</Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.totalValue}>R$ {totalValue.toFixed(2)}</Text>
            <Text style={[styles.statusText, { color: isPaid ? '#4caf50' : '#ff9800' }]}>
              {isPaid ? 'PAGO' : paidAmount > 0 ? 'PARCIAL' : 'PENDENTE'}
            </Text>
          </View>
        </View>

        {/* Barra de progresso visual para pagamentos parciais */}
        {!isPaid && (
          <View style={styles.progressSection}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressLabel}>
              Pago: R$ {paidAmount.toFixed(2)} / Falta: R$ {(totalValue - paidAmount).toFixed(2)}
            </Text>
          </View>
        )}

        {/* Botão de Quitar (Apenas para Admin e se não estiver pago) */}
        {isAdmin && !isPaid && (
          <TouchableOpacity style={styles.payActionBtn} onPress={() => openPayModal(item)}>
            <Ionicons name="cash-outline" size={18} color="#fff" />
            <Text style={styles.payActionText}>Baixar Pagamento</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={expenses}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadExpenses(); }} />}
        contentContainerStyle={{ padding: 15 }}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma despesa pendente.</Text>}
      />

      {/* MODAL DE BAIXA DE PAGAMENTO */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmar Recebimento</Text>
            <Text style={styles.modalSub}>Quanto você recebeu de {selectedDebt?.user_name}?</Text>
            
            <View style={styles.inputWrapper}>
              <Text style={styles.currencyPrefix}>R$</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={payValue}
                onChangeText={setPayValue}
                autoFocus
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.mBtn, styles.mBtnCancel]} onPress={() => setModalVisible(false)}>
                <Text style={styles.mBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.mBtn, styles.mBtnConfirm]} onPress={handleConfirmPayment}>
                <Text style={styles.mBtnText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 12, elevation: 2 },
  cardMain: { flexDirection: 'row', alignItems: 'center' },
  statusIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  bgSuccess: { backgroundColor: '#4caf50' },
  bgWarning: { backgroundColor: '#ff9800' },
  userName: { fontSize: 11, fontWeight: 'bold', color: '#007AFF', textTransform: 'uppercase' },
  description: { fontSize: 16, fontWeight: '600', color: '#333' },
  date: { fontSize: 12, color: '#888' },
  totalValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  statusText: { fontSize: 10, fontWeight: 'bold', marginTop: 2 },
  
  // Progresso
  progressSection: { marginTop: 12 },
  progressBarBg: { height: 6, backgroundColor: '#eee', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#ff9800' },
  progressLabel: { fontSize: 10, color: '#666', marginTop: 4, textAlign: 'center' },

  // Botão de ação
  payActionBtn: { 
    flexDirection: 'row', backgroundColor: '#007AFF', marginTop: 15, 
    padding: 10, borderRadius: 8, justifyContent: 'center', alignItems: 'center' 
  },
  payActionText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  modalSub: { fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderColor: '#007AFF', marginBottom: 30 },
  currencyPrefix: { fontSize: 20, fontWeight: 'bold', color: '#333', marginRight: 5 },
  input: { fontSize: 24, fontWeight: 'bold', color: '#333', minWidth: 100, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', gap: 10 },
  mBtn: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center' },
  mBtnCancel: { backgroundColor: '#f44336' },
  mBtnConfirm: { backgroundColor: '#4caf50' },
  mBtnText: { color: '#fff', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#999' }
});