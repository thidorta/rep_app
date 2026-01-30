import { View, Text, StyleSheet, Button } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';

export default function Home() {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Olá, {user?.name}!</Text>
      <Text style={styles.subtitle}>Bem-vindo ao Rep App.</Text>
      
      <View style={{ marginTop: 20 }}>
        <Button title="Sair" onPress={signOut} color="red" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },
  welcome: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 16, color: '#666' }
});