export type ModuleId = 'metricas' | 'productos' | 'empleados' | 'perfil';

export interface NavigationItem {
  id: ModuleId;
  label: string;
  icon: string; // Icon name from lucide-react represented as string
}

export interface Product {
  id: string;
  name: string;
  price: number;
  items: string[];
  isActive: boolean;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  branch: string;
  status: 'Activo' | 'Inactivo';
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  role: string;
  photoUrl: string;
  branch: string;
}

