import React, { useState, useCallback } from 'react';
import { 
  Platform, KeyboardAvoidingView, View, Text, StyleSheet, 
  TextInput, TouchableOpacity, Alert, FlatList, ActivityIndicator, 
  Share, ScrollView, RefreshControl, Modal
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { User } from '../../src/types';

// Interface para os dados completos que vêm da API
interface RepublicDetail {
  id: number;
  name: string;
  address: string;
  invite_code: string;
  users: User[]; // Lista de moradores
}

export default function RepublicScreen() {
  const { user, refreshUser } = useAuth(); // signIn aqui serve para recarregar o user se precisarmos (hack rápido) ou usamos uma função de refresh
  const [republicData, setRepublicData] = useState<RepublicDetail | null>(null);
  const [loading, setLoading] = useState(false);

  // States para formulários de Entrar/Criar
  const [inviteCode, setInviteCode] = useState('');
  const [newRepName, setNewRepName] = useState('');
  const [newRepAddress, setNewRepAddress] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // 1. Função que busca os dados se o usuário tiver ID
  const fetchRepublicDetails = async () => {
    // Se o contexto diz que não tem ID, nem tenta buscar
    if (!user?.republic_id) {
      setRepublicData(null);
      return;
    }

    try {
      setLoading(true);
      // Usamos a rota que criamos no backend que retorna a rep + moradores
      const response = await api.get('/republicas/moradores'); 
      setRepublicData(response.data);
    } catch (error) {
      console.log(error);
      Alert.alert('Erro', 'Não foi possível carregar os dados da república.');
    } finally {
      setLoading(false);
    }
  };

  // Carrega sempre que a tela ganha foco (útil se ele acabou de entrar)
  useFocusEffect(
    useCallback(() => {
      fetchRepublicDetails();
    }, [user?.republic_id]) // Reexecuta se o ID mudar
  );

  // --- AÇÕES ---

  function handleEditRole(user: User) {
    setSelectedUser(user);
    setModalVisible(true);
  }

  async function saveRole(newRole: string) {
    if (!selectedUser) return;
    try {
      await api.put('/republicas/promover-admin', {
        user_id: selectedUser.id,
        new_role: newRole
      });
      Alert.alert("Sucesso", `Cargo atualizado para ${newRole}`);
      setModalVisible(false);
      fetchRepublicDetails(); // Recarrega a lista
    } catch (error) {
      Alert.alert("Erro", "Você não tem permissão para isso.");
    }
  }

  async function handleJoinRepublic() {
    try {
      await api.post(`/republicas/entrar/?invite_code=${inviteCode}`);
      Alert.alert('Sucesso', 'Bem-vindo à república!');
      
      await refreshUser(); // Atualiza o user no contexto para refletir a nova república
      
    } catch (error) {
      Alert.alert('Erro', 'Código inválido.');
    }
  }

  async function handleCreateRepublic() {
    if (!newRepName.trim() || !newRepAddress.trim()) {
      Alert.alert('Atenção', 'Por favor, preencha o nome e o endereço da república.');
      return; // Para a execução aqui, não chama a API
    }
    try {
      const response = await api.post('/republicas/', {
        name: newRepName,
        address: newRepAddress
      });

    if (Platform.OS === 'web') {
        window.alert(`República "${newRepName}" criada!`);
    } else {
        Alert.alert('Parabéns!', `República "${newRepName}" criada!`);
    }       

      await refreshUser();
      
    } catch (error) {
      Alert.alert('Erro', 'Falha ao criar república.');
    }

  }
  async function performExit() {
  try {
    console.log("Chamando API de sair...");
    await api.delete('/republicas/sair');

    // Sucesso
    if (Platform.OS === 'web') {
      window.alert("Você saiu da república com sucesso!");
    } else {
      Alert.alert("Sucesso", "Você saiu da república com sucesso!");
    }

    // Atualiza o contexto
    await refreshUser();

  } catch (error) {
    console.error(error);
    if (Platform.OS === 'web') {
      window.alert("Erro: Não foi possível sair.");
    } else {
      Alert.alert("Erro", "Não foi possível sair.");
    }
  }
}

	async function handleLeaveRepublic() {
		// LÓGICA PARA WEB (Navegador)
		if (Platform.OS === 'web') {
			const confirm = window.confirm("Tem certeza que deseja sair da república?");
			if (confirm) {
				await performExit();
			}
		} 
		// LÓGICA PARA MOBILE (Android/iOS)
		else {
			Alert.alert(
				"Sair da República",
				"Tem certeza que deseja sair?",
				[
					{ text: "Cancelar", style: "cancel" },
					{ 
						text: "Sair", 
						style: 'destructive',
						onPress: async () => {
							await performExit();
						}
					}
				]
			);
		}
	}
	
  const shareCode = async () => {
    if (republicData?.invite_code) {
      await Share.share({
        message: `Venha morar na minha república! Código de convite: ${republicData.invite_code}`,
      });
    }
  };

  // --- RENDERIZAÇÃO ---

  if (!user?.republic_id) {
    return (
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.scrollContent} // Estilo interno para centralizar/espaçar
          showsVerticalScrollIndicator={true} // Força mostrar a barra (opcional, pois é padrão)
        >
          <Text style={styles.title}>Você está sem teto! 🏠</Text>
          <Text style={styles.subtitle}>Entre em uma república existente ou crie a sua.</Text>

          {/* CARD DE ENTRAR */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Entrar com Código</Text>
            <TextInput 
              placeholder="Ex: REP-1234" 
              style={styles.input} 
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.btn} onPress={handleJoinRepublic}>
              <Text style={styles.btnText}>Entrar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider}><Text style={{color:'#aaa'}}>OU</Text></View>

          {/* CARD DE CRIAR */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Criar Nova República</Text>
            <TextInput 
              placeholder="Nome da República" 
              style={styles.input} 
              value={newRepName}
              onChangeText={setNewRepName}
            />
             <TextInput 
              placeholder="Endereço" 
              style={styles.input} 
              value={newRepAddress}
              onChangeText={setNewRepAddress}
            />
            <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={handleCreateRepublic}>
              <Text style={[styles.btnText, {color: '#007AFF'}]}>Criar Casa</Text>
            </TouchableOpacity>
          </View>
          
          {/* Espaço extra no final para garantir que o scroll desça até o fim */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

// CENÁRIO: COM REPÚBLICA (DASHBOARD)
  return (
    <View style={styles.container}>
      {/* Header com Nome e Botão Sair */}
      <View style={styles.header}>
        <View style={{flex: 1}}>
          <Text style={styles.repName}>{republicData?.name || "Carregando..."}</Text>
          <Text style={styles.repAddress}>{republicData?.address}</Text>
        </View>
        <TouchableOpacity onPress={handleLeaveRepublic} style={{padding: 5}}>
          <Ionicons name="exit-outline" size={30} color="red" />
        </TouchableOpacity>
      </View>

      <View style={styles.inviteCard}>
        <View>
          <Text style={styles.inviteLabel}>Código de Convite:</Text>
          <Text style={styles.code}>{republicData?.invite_code}</Text>
        </View>
        <TouchableOpacity onPress={shareCode}>
          <Ionicons name="share-social" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Moradores ({republicData?.users.length || 0})</Text>
      
      <FlatList
        data={republicData?.users}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchRepublicDetails}/>}
        renderItem={({ item }) => (
          <View style={styles.memberRow}>
            {/* Avatar */}
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            
            {/* Dados do Usuário */}
            <View>
              <Text style={styles.memberName}>
                {item.name} {item.id === user.id && '(Você)'}
              </Text>
              {/* Mostra o nome do cargo por extenso para facilitar leitura */}
              <Text style={{fontSize: 10, color: '#666'}}>
                {item.role_tag === 'admin' ? 'Admin' : 
                 item.role_tag === 'admin_finance' ? 'Financeiro' : 
                 item.role_tag === 'morador' ? 'Morador' : ''}
              </Text>
            </View>

            {/* ÁREA DE ÍCONES (Status + Edição) */}
            {/* Agrupei em uma View com marginLeft: 'auto' para alinhar tudo à direita juntos */}
            <View style={{flexDirection: 'row', alignItems: 'center', marginLeft: 'auto'}}>
                
                {/* Seus ícones originais (apenas adicionei margin right para não grudar no lápis) */}
                {item.role_tag === 'admin_finance' && (
                  <Ionicons name="cash" size={20} color="green" style={{marginRight: 8}} />
                )}
                {item.role_tag === 'admin' && (
                  <Ionicons name="people" size={20} color="blue" style={{marginRight: 8}} />
                )}
                {item.role_tag === 'admin_func' && (
                  <Ionicons name="newspaper" size={20} color="blue" style={{marginRight: 8}} />
                )}

                {/* NOVO: Botão de Editar (Apenas se VOCÊ for Admin) */}
                {user?.role_tag === 'admin' && (
                    <TouchableOpacity onPress={() => handleEditRole(item)} style={{padding: 5}}>
                        <Ionicons name="pencil" size={20} color="orange" />
                    </TouchableOpacity>
                )}
            </View>
          </View>
        )}
      />

      {/* NOVO: MODAL DE EDIÇÃO DE CARGO */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Alterar Cargo de {selectedUser?.name}</Text>
            
            <TouchableOpacity style={styles.roleOption} onPress={() => saveRole('admin')}>
              <Text style={styles.roleText}>Admin Geral</Text>
              <Text style={styles.roleDesc}>Acesso total (Cuidado!)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.roleOption} onPress={() => saveRole('admin_finance')}>
              <Text style={styles.roleText}>Financeiro</Text>
              <Text style={styles.roleDesc}>Gerencia contas e pagamentos.</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.roleOption} onPress={() => saveRole('morador')}>
              <Text style={styles.roleText}>Morador</Text>
              <Text style={styles.roleDesc}>Apenas visualiza e paga.</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.roleOption, {backgroundColor: '#ff5252', marginTop: 15, borderBottomWidth: 0, borderRadius: 8}]} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.roleText, {color: '#fff', textAlign: 'center'}]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  scrollContent: { padding: 20, flexGrow: 1, justifyContent: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  subtitle: { textAlign: 'center', color: '#666', marginBottom: 20 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 10, elevation: 2, marginBottom: 10 },
  cardTitle: { fontWeight: 'bold', marginBottom: 15 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15 },
  btn: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#007AFF' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  divider: { alignItems: 'center', marginVertical: 10 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  repName: { fontSize: 26, fontWeight: 'bold', color: '#333' },
  repAddress: { color: '#666' },
  inviteCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#e3f2fd', padding: 15, borderRadius: 10, marginBottom: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#90caf9' },
  inviteLabel: { fontSize: 12, color: '#555' },
  code: { fontSize: 20, fontWeight: 'bold', letterSpacing: 2, color: '#007AFF' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  memberRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontWeight: 'bold', fontSize: 16, color: '#555' },
  memberName: { fontWeight: 'bold', color: '#333' },
  memberRole: { fontSize: 12, color: '#888' },
  residentCard: { 
     flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
     backgroundColor: '#fff', padding: 15, marginBottom: 10, borderRadius: 10 
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 15, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  roleOption: { padding: 15, borderBottomWidth: 1, borderColor: '#eee', marginBottom: 5 },
  roleText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  roleDesc: { fontSize: 12, color: '#666' }
});