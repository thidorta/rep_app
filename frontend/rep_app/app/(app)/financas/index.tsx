import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { api } from '../../../src/services/api';
import { DashboardData } from '../../../src/types';
import { useAuth } from '../../../src/context/AuthContext';

export default function FinanceDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/financas/dashboard');
      setData(response.data);
    } catch (err) {
      console.log(err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [])
  );

  // Atalho para verificar se tem permissão administrativa
  const isAdmin = user?.role_tag === 'admin' || user?.role_tag === 'admin_finance';
  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const mesAtual = meses[new Date().getMonth()];

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchDashboard} />}
    >
      {/* CARD PRINCIPAL */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sua Fatura de {mesAtual}</Text>
        <Text style={styles.bigValue}>R$ {data?.total_to_pay.toFixed(2)}</Text>

        <Text style={styles.detail}>Saldo Pendente: R$ {data?.variable_debts.toFixed(2)}</Text>
        <Text style={styles.credit}>Créditos Acumulados: - R$ {data?.my_credits.toFixed(2)}</Text>
        
        <View style={styles.divider} />
        
        <Text style={styles.detail}>Aluguel Fixo: R$ {data?.fixed_rent_base.toFixed(2)}</Text>
      </View>

      {/* CARD DO CAIXA */}
      <View style={[styles.card, { backgroundColor: '#e8f5e9' }]}>
        <Text style={styles.cardTitle}>Saldo do Caixa da República</Text>
        <Text style={[styles.bigValue, { color: '#2e7d32' }]}>
          R$ {data?.cashbox_balance.toFixed(2)}
        </Text>
      </View>

      {/* GRID DE AÇÕES */}
      <View style={styles.grid}>
        {isAdmin && (
          <>
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: '#6200ea' }]} 
              onPress={() => router.push('/financas/templates')}
            >
              <Text style={styles.btnText}>Configurar Contas</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: '#4caf50' }]} 
              onPress={() => router.push('/financas/receber_contas')}
            >
              <Text style={styles.btnText}>Receber Contas</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={() => router.push('/financas/alugueis')}>
              <Text style={styles.btnText}>Editar Aluguéis</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={() => router.push('/financas/caixa')}>
               <Text style={styles.btnText}>Gerenciar Caixa</Text>
            </TouchableOpacity>
          </>
        )}   

        <TouchableOpacity style={styles.button} onPress={() => router.push('/financas/despesas')}>
          <Text style={styles.btnText}>Ver Despesas</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.btnOutline]} onPress={() => router.push('/financas/compras')}>
           <Text style={styles.btnTextOutline}>Lançar Compras</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 15, elevation: 3 },
  cardTitle: { fontSize: 14, color: '#666', marginBottom: 5, fontWeight: '600' },
  bigValue: { fontSize: 32, fontWeight: 'bold', color: '#333' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
  detail: { fontSize: 14, color: '#555', marginTop: 4 },
  credit: { fontSize: 14, color: '#2e7d32', marginTop: 8, fontWeight: 'bold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  button: { width: '48%', backgroundColor: '#007AFF', padding: 15, borderRadius: 10, marginBottom: 12, alignItems: 'center', justifyContent: 'center', minHeight: 60 },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#007AFF' },
  btnText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  btnTextOutline: { color: '#007AFF', fontWeight: 'bold' }
});