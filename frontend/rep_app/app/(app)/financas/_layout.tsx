import { Stack } from 'expo-router';

export default function FinancasLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Dashboard Financeiro' }} />
      <Stack.Screen name="despesas" options={{ title: 'Contas da Casa' }} />
      <Stack.Screen name="caixa" options={{ title: 'Fluxo de Caixa' }} />
      <Stack.Screen name="alugueis" options={{ title: 'Aluguéis Fixos' }} />
      <Stack.Screen name="receber_contas" options={{ title: 'Receber Contas' }} />
      <Stack.Screen name="compras" options={{ title: 'Lançar Compra' }} />
    </Stack>
  );
}