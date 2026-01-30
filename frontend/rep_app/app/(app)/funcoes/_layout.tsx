import { Stack } from 'expo-router';

export default function FuncoesLayout() {
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: '#f5f5f5' } }}>
      <Stack.Screen name="index" options={{ title: 'Funções da Casa' }} />
      {/* Futuras telas serão registradas automaticamente aqui */}
    </Stack>
  );
}