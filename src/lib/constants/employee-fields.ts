/**
 * Definición de campos para solicitudes de Alta/Baja de empleados
 */

export interface EmployeeData {
  tipo: "alta" | "baja"
  nombre: string
  nss: string
  rfc: string
  curp: string
  fechaNacimiento: string
  puesto: string
  salario: number | ""
  fechaIngreso: string
  // Baja
  fechaBaja?: string
  motivoBaja?: string
  notas: string
}

export const EMPLOYEE_FORM_TYPES = [
  "alta_empleado",
  "baja_empleado",
] as const

export type EmployeeFormType = (typeof EMPLOYEE_FORM_TYPES)[number]

export function isEmployeeFormType(type: string): type is EmployeeFormType {
  return EMPLOYEE_FORM_TYPES.includes(type as EmployeeFormType)
}

export const MOTIVO_BAJA_OPTIONS = [
  { value: "renuncia", label: "Renuncia voluntaria" },
  { value: "despido", label: "Despido" },
  { value: "termino_contrato", label: "Término de contrato" },
  { value: "jubilacion", label: "Jubilación" },
  { value: "defuncion", label: "Defunción" },
  { value: "otro", label: "Otro" },
] as const

export function createEmptyEmployeeData(tipo: "alta" | "baja"): EmployeeData {
  return {
    tipo,
    nombre: "",
    nss: "",
    rfc: "",
    curp: "",
    fechaNacimiento: "",
    puesto: "",
    salario: "",
    fechaIngreso: "",
    fechaBaja: "",
    motivoBaja: "",
    notas: "",
  }
}
