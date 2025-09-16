export type ResponseType = 'En revisión' | 'Derivación';
export type Department = 'Jurídica' | 'Personas' | 'Operaciones' | 'Finanzas' | 'Informática' | 'Comunicaciones' | 'Of. Partes';
export type ComplianceStatus = 'green' | 'red';
export type StatusType = 'Entregada' | 'Derivada' | 'Denegada' | 'Desistida';

export interface RequestData {
  id: string;
  numeroSolicitud: string;
  nombreApellido: string;
  fechaIngreso: string; // from PDF, format "dd/MM/yyyy"
  fechaVencimientoInicial: string; // from PDF, format- "dd/MM/yyyy"
  fechaVencimientoModificada?: string; // calculated
  tipoRespuesta?: ResponseType;
  departamentoResponsable?: Department;
  fechaEnvioDepto?: Date | string; // New field for department dispatch date
  fechaVencimientoActualizada?: Date | string; // calculated
  oposicion?: boolean;
  subsanacion?: boolean;
  prorroga?: boolean;
  fechaEnvio?: Date | string;
  complianceStatus?: ComplianceStatus; // calculated
  estado?: StatusType;
  cierre?: Date | string;
  dias?: number;
  etiqueta?: string;
  pdfDataUri?: string;
}
