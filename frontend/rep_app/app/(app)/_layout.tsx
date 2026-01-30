import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AppLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#007AFF' }}>
      <Tabs.Screen 
        name="index" 
        options={{ title: 'Home', tabBarIcon: ({color}) => <Ionicons name="person" size={24} color={color} /> }} 
      />
      <Tabs.Screen 
        name="financas" 
        options={{ title: 'Finanças', headerShown: false, tabBarIcon: ({color}) => <Ionicons name="cash" size={24} color={color} /> }} 
      />
      <Tabs.Screen 
        name="funcoes" 
        options={{ title: 'Funções', tabBarIcon: ({color}) => <Ionicons name="newspaper-sharp" size={24} color={color} /> }} 
      />
      <Tabs.Screen 
        name="republica" 
        options={{ title: 'República', tabBarIcon: ({color}) => <Ionicons name="home-sharp" size={24} color={color} /> }} 
      />
    </Tabs>
  );
}