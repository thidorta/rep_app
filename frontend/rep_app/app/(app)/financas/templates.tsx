import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Modal, TextInput, Alert, ActivityIndicator, 
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../../src/services/api';
import { ExpenseTemplate } from '../../../src/types';

export default function TemplatesScreen() {
  const [templates, setTemplates] = useState<ExpenseTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  // States do Formulário
  const [desc, setDesc] = useState('');
  const [val, setVal] = useState('');
  const [category, setCategory] = useState('fixa');
  
  const [editDescription, setEditDescription] = useState('');
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    setLoading(true);
    try {
      const res = await api.get('/financas/templates');
      setTemplates(res.data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os templates.');
    } finally {
      setLoading(false);
    }
  }

  // --- ADICIONAR ---
  async function handleAddTemplate() {
    if (!desc || !val) return Alert.alert('Erro', 'Preencha descrição e valor.');

    try {
      const parsedVal = parseFloat(val.replace(',', '.'));
      if (isNaN(parsedVal)) return Alert.alert("Erro", "Valor inválido");

      await api.post('/financas/templates', {
        description: desc,
        base_value: parsedVal,
        category: category
      });
      Alert.alert('Sucesso', 'Template salvo!');
      setModalVisible(false);
      setDesc('');
      setVal('');
      loadTemplates();
    } catch (error) {
      Alert.alert('Erro', 'Falha ao criar template.');
    }
  }

  // --- EDITAR ---
  function openEditModal(template: any) {
    setSelectedTemplate(template);
    setEditDescription(template.description);
    setEditValue(String(template.base_value));
    setEditModalVisible(true);
  }

  async function handleUpdateTemplate() {
    try {
      const parsedVal = parseFloat(editValue.replace(',', '.'));
      if (isNaN(parsedVal)) return Alert.alert("Erro", "Valor inválido");

      await api.put(`/financas/templates/${selectedTemplate.id}`, {
        description: editDescription,
        base_value: parsedVal,
      });

      Alert.alert("Sucesso", "Template atualizado!");
      setEditModalVisible(false);
      loadTemplates();
    } catch (error) {
      Alert.alert("Erro", "Falha ao atualizar template.");
    }
  }

  // --- GERAR MENSALIDADE ---
  async function handleGenerateMonthly() {
    const processAction = async () => {
      try {
        setLoading(true);
        const res = await api.post('/financas/gerar-mensalidade');
        Alert.alert("Sucesso", res.data.detail);
      } catch (error) {
        Alert.alert("Erro", "Falha ao gerar mensalidade.");
      } finally {
        setLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm("Criar as despesas oficiais deste mês para todos?")) {
        processAction();
      }
    } else {
      Alert.alert(
        "Gerar Mensalidade",
        "Isso vai criar as despesas oficiais deste mês para todos os moradores. Continuar?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Sim, Gerar", onPress: processAction }
        ]
      );
    }
  }
  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const proximoMes = meses[(new Date().getMonth())]; // Ou (month + 1) se estiver gerando adiantado
  return (
    <View style={styles.container}>
      
      <View style={styles.actionHeader}>
        <Text style={styles.infoText}>
          {templates?.length === 1 ? "1 conta configurada." : `${templates?.length} contas configuradas.`}
        </Text>
        <TouchableOpacity style={styles.runBtn} onPress={handleGenerateMonthly}>
          <Ionicons name="flash" size={20} color="#fff" />
          <Text style={styles.runBtnText}>GERAR CONTAS DE {proximoMes.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="large" color="#007AFF" style={{ marginBottom: 10 }} />}

      <FlatList
        data={templates}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 80 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.iconBox}>
              <Ionicons name="repeat" size={24} color="#007AFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.description}</Text>
              <Text style={styles.cardCat}>{item.category}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', marginRight: 10 }}>
                <Text style={styles.cardValue}>R$ {item.base_value.toFixed(2)}</Text>
            </View>
            
            {/* Lápis de Edição isolado na direita */}
            <TouchableOpacity onPress={() => openEditModal(item)} style={styles.editBtn}>
              <Ionicons name="pencil" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* MODAL DE CADASTRO */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Novo Template</Text>
            <Text style={styles.modalSubtitle}>Essa conta se repetirá todo mês.</Text>
            
            <TextInput 
              placeholder="Descrição (ex: Internet Vivo)" 
              style={styles.input} 
              value={desc} 
              onChangeText={setDesc} 
            />
            <TextInput 
              placeholder="Valor Base (R$)" 
              keyboardType="numeric" 
              style={styles.input} 
              value={val} 
              onChangeText={setVal} 
            />
            
            <View style={styles.row}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.btn, styles.btnCancel]}>
                <Text style={styles.btnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddTemplate} style={[styles.btn, styles.btnSave]}>
                <Text style={styles.btnText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL DE EDIÇÃO */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Conta Base</Text>
            
            <Text style={styles.label}>Nome da Conta:</Text>
            <TextInput
              style={styles.input}
              value={editDescription}
              onChangeText={setEditDescription}
            />

            <Text style={styles.label}>Valor Base (R$):</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={editValue}
              onChangeText={setEditValue}
            />

            <View style={styles.row}>
              <TouchableOpacity 
                style={[styles.btn, styles.btnCancel]} 
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.btnText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.btn, styles.btnConfirm]} 
                onPress={handleUpdateTemplate}
              >
                <Text style={styles.btnText}>Salvar</Text>
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
  actionHeader: { marginBottom: 20 },
  infoText: { color: '#666', marginBottom: 10 },
  runBtn: { backgroundColor: '#FF9500', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 10, elevation: 2 },
  runBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },

  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 1 },
  iconBox: { width: 40, height: 40, backgroundColor: '#e3f2fd', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardTitle: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  cardCat: { color: '#888', fontSize: 12, textTransform: 'capitalize' },
  cardValue: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  editBtn: { padding: 10, borderLeftWidth: 1, borderLeftColor: '#eee', marginLeft: 5 },

  fab: { position: 'absolute', bottom: 20, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#007AFF', alignItems: 'center', justifyContent: 'center', elevation: 5 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  modalSubtitle: { textAlign: 'center', color: '#666', marginBottom: 20 },
  label: { fontSize: 14, color: '#333', marginBottom: 5, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, marginBottom: 15, fontSize: 16 },
  row: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center' },
  btnCancel: { backgroundColor: '#ff5252' },
  btnSave: { backgroundColor: '#007AFF' },
  btnConfirm: { backgroundColor: '#4CD964' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});