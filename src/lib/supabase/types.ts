export type UserRole = 'admin' | 'profesor' | 'alumno'

export interface Profile {
  id: string
  user_id: string
  role: UserRole
  nombre: string
  apellido: string
  email: string
  telefono?: string
  created_at: string
  updated_at: string
}

export interface Alumno {
  id: string
  user_id?: string
  nombre: string
  apellido: string
  email: string
  telefono?: string
  fecha_ingreso: string
  objetivo?: string
  observaciones?: string
  profesor_id?: string
  created_at: string
  updated_at: string
  profesor?: Profesor
}

export interface Profesor {
  id: string
  user_id?: string
  nombre: string
  apellido: string
  especialidad?: string
  email: string
  telefono?: string
  created_at: string
  updated_at: string
}

export interface Ejercicio {
  id: string
  rutina_id: string
  nombre: string
  series: number
  repeticiones: string
  descanso?: string
  observaciones?: string
  orden: number
  created_at: string
}

export interface Rutina {
  id: string
  nombre: string
  objetivo?: string
  dias_por_semana: number
  created_by: string
  created_at: string
  updated_at: string
  ejercicios?: Ejercicio[]
  creator?: Profile
}

export interface Asignacion {
  id: string
  rutina_id: string
  alumno_id: string
  fecha_asignacion: string
  activa: boolean
  created_at: string
  rutina?: Rutina
  alumno?: Alumno
}

export interface Progreso {
  id: string
  asignacion_id: string
  ejercicio_id: string
  alumno_id: string
  completado: boolean
  fecha: string
  created_at: string
}

export interface DashboardStats {
  total_alumnos: number
  total_profesores: number
  rutinas_activas: number
  ultimos_registros: Alumno[]
}
