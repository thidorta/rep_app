export interface User {
  id: number;
  name: string;
  email: string;
  republic_id?: number;
  role_tag: 'admin_finance' | 'admin_func' | 'morador' | 'admin';
  fixed_rent: number;
}

export interface DashboardData {
  fixed_rent_base: number;
  variable_debts: number;
  my_credits: number;
  total_to_pay: number;
  cashbox_balance: number;
}

export interface Expense {
  id: number;
  description: string;
  total_value: number;
  due_date: string;
  category: string;
}

export interface ExpenseTemplate {
  id: number;
  description: string;
  base_value: number;
  category: string;
  republic_id: number;
}