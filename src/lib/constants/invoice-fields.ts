/**
 * Catálogos SAT y definiciones de campos para solicitudes de factura
 * Basado en CFDI 4.0
 */

// --- Uso CFDI ---
export const USO_CFDI_OPTIONS = [
  { value: "G01", label: "G01 — Adquisición de mercancías" },
  { value: "G02", label: "G02 — Devoluciones, descuentos o bonificaciones" },
  { value: "G03", label: "G03 — Gastos en general" },
  { value: "I01", label: "I01 — Construcciones" },
  { value: "I02", label: "I02 — Mobiliario y equipo de oficina" },
  { value: "I03", label: "I03 — Equipo de transporte" },
  { value: "I04", label: "I04 — Equipo de cómputo" },
  { value: "I08", label: "I08 — Otra maquinaria y equipo" },
  { value: "D01", label: "D01 — Honorarios médicos y gastos hospitalarios" },
  { value: "D02", label: "D02 — Gastos médicos por incapacidad" },
  { value: "D03", label: "D03 — Gastos funerales" },
  { value: "D04", label: "D04 — Donativos" },
  { value: "D05", label: "D05 — Intereses por créditos hipotecarios" },
  { value: "D06", label: "D06 — Aportaciones voluntarias al SAR" },
  { value: "D07", label: "D07 — Primas por seguros de gastos médicos" },
  { value: "D08", label: "D08 — Gastos de transportación escolar" },
  { value: "D10", label: "D10 — Pagos por servicios educativos" },
  { value: "P01", label: "P01 — Por definir" },
  { value: "S01", label: "S01 — Sin efectos fiscales" },
  { value: "CP01", label: "CP01 — Pagos" },
] as const

// --- Forma de Pago ---
export const FORMA_PAGO_OPTIONS = [
  { value: "01", label: "01 — Efectivo" },
  { value: "02", label: "02 — Cheque nominativo" },
  { value: "03", label: "03 — Transferencia electrónica" },
  { value: "04", label: "04 — Tarjeta de crédito" },
  { value: "06", label: "06 — Dinero electrónico" },
  { value: "08", label: "08 — Vales de despensa" },
  { value: "28", label: "28 — Tarjeta de débito" },
  { value: "29", label: "29 — Tarjeta de servicios" },
  { value: "99", label: "99 — Por definir" },
] as const

// --- Método de Pago ---
export const METODO_PAGO_OPTIONS = [
  { value: "PUE", label: "PUE — Pago en Una sola Exhibición" },
  { value: "PPD", label: "PPD — Pago en Parcialidades o Diferido" },
] as const

// --- Régimen Fiscal ---
export const REGIMEN_FISCAL_OPTIONS = [
  { value: "601", label: "601 — General de Ley" },
  { value: "603", label: "603 — Personas Morales sin fines de lucro" },
  { value: "605", label: "605 — Sueldos y Salarios" },
  { value: "606", label: "606 — Arrendamiento" },
  { value: "607", label: "607 — Régimen de Enajenación o Adquisición de Bienes" },
  { value: "608", label: "608 — Demás ingresos" },
  { value: "610", label: "610 — Residentes en el Extranjero" },
  { value: "611", label: "611 — Ingresos por Dividendos" },
  { value: "612", label: "612 — Personas Físicas con Actividades Empresariales" },
  { value: "614", label: "614 — Ingresos por intereses" },
  { value: "616", label: "616 — Sin obligaciones fiscales" },
  { value: "620", label: "620 — Sociedades Cooperativas de Producción" },
  { value: "621", label: "621 — Incorporación Fiscal" },
  { value: "622", label: "622 — Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras" },
  { value: "623", label: "623 — Opcional para Grupos de Sociedades" },
  { value: "624", label: "624 — Coordinados" },
  { value: "625", label: "625 — Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas" },
  { value: "626", label: "626 — Régimen Simplificado de Confianza (RESICO)" },
] as const

// --- Unidades comunes ---
export const UNIDAD_OPTIONS = [
  { value: "E48", label: "Servicio" },
  { value: "H87", label: "Pieza" },
  { value: "KGM", label: "Kilogramo" },
  { value: "LTR", label: "Litro" },
  { value: "XBX", label: "Caja" },
  { value: "MTR", label: "Metro" },
  { value: "ACT", label: "Actividad" },
  { value: "MON", label: "Mes" },
  { value: "HUR", label: "Hora" },
  { value: "DAY", label: "Día" },
] as const

// --- Motivos de cancelación ---
export const MOTIVO_CANCELACION_OPTIONS = [
  { value: "01", label: "01 — Comprobante emitido con errores con relación" },
  { value: "02", label: "02 — Comprobante emitido con errores sin relación" },
  { value: "03", label: "03 — No se llevó a cabo la operación" },
  { value: "04", label: "04 — Operación nominativa relacionada en factura global" },
] as const

// --- Types ---
export interface InvoiceConcept {
  description: string
  quantity: number
  unit: string
  unitPrice: number
}

export interface InvoiceData {
  // Receptor
  rfcReceptor: string
  nombreReceptor: string
  regimenFiscal: string
  domicilioFiscalCp: string
  usoCfdi: string
  // Pago
  formaPago: string
  metodoPago: string
  // Conceptos
  conceptos: InvoiceConcept[]
  // Notas
  notas: string
  // Cancelación
  uuidCancelar?: string
  motivoCancelacion?: string
  // Nota de crédito
  uuidRelacionada?: string
}

// --- Tipos de factura que usan formulario dinámico ---
export const INVOICE_FORM_TYPES = [
  "factura_pf",
  "factura_pm",
  "factura_resico",
  "factura_otro",
  "cancelacion",
  "nota_credito",
] as const

export type InvoiceFormType = (typeof INVOICE_FORM_TYPES)[number]

export function isInvoiceFormType(type: string): type is InvoiceFormType {
  return INVOICE_FORM_TYPES.includes(type as InvoiceFormType)
}

// --- Labels for types ---
export const INVOICE_TYPE_LABELS: Record<InvoiceFormType, string> = {
  factura_pf: "Factura — Persona Física",
  factura_pm: "Factura — Persona Moral",
  factura_resico: "Factura — RESICO",
  factura_otro: "Factura — Otro tipo",
  cancelacion: "Cancelación de factura",
  nota_credito: "Nota de crédito",
}

// Whether a type needs the full CFDI form or a simplified one
export function needsFullForm(type: InvoiceFormType): boolean {
  return type === "factura_pf" || type === "factura_pm" || type === "factura_resico" || type === "factura_otro"
}

export function needsCancelForm(type: InvoiceFormType): boolean {
  return type === "cancelacion"
}

export function needsCreditNoteForm(type: InvoiceFormType): boolean {
  return type === "nota_credito"
}

export function createEmptyInvoiceData(): InvoiceData {
  return {
    rfcReceptor: "",
    nombreReceptor: "",
    regimenFiscal: "",
    domicilioFiscalCp: "",
    usoCfdi: "",
    formaPago: "",
    metodoPago: "",
    conceptos: [{ description: "", quantity: 1, unit: "E48", unitPrice: 0 }],
    notas: "",
  }
}
