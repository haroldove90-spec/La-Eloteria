export type ModuleId = 'metricas' | 'productos' | 'empleados' | 'perfil';

export interface NavigationItem {
  id: ModuleId;
  label: string;
  icon: string; // Icon name from lucide-react represented as string
}
