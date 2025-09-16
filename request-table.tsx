"use client"

import type { RequestData, ResponseType, Department, ComplianceStatus, StatusType } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarIcon, Trash2, Mail, Bell } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import { cn, parseDate } from "@/lib/utils";

interface RequestTableProps {
  requests: RequestData[];
  updateRequest: (id: string, newValues: Partial<RequestData>) => void;
  deleteRequest: (id: string) => void;
  isReadOnly: boolean;
}

const responseTypes: ResponseType[] = ['En revisión', 'Derivación'];
const departments: Department[] = ['Jurídica', 'Personas', 'Operaciones', 'Finanzas', 'Informática', 'Comunicaciones', 'Of. Partes'];
const statusTypes: StatusType[] = ['Entregada', 'Derivada', 'Denegada', 'Desistida'];

const ComplianceDot = ({ status }: { status?: ComplianceStatus }) => {
  const statusConfig = {
    green: { color: 'bg-green-500', label: 'En plazo' },
    red: { color: 'bg-red-500', label: 'Vencido' },
  };
  
  if (!status || !statusConfig[status]) {
    return <span className="text-muted-foreground text-xs">N/A</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`h-3 w-3 rounded-full ${statusConfig[status].color}`} />
      <span className="hidden md:inline">{statusConfig[status].label}</span>
    </div>
  );
};

export function RequestTable({ requests, updateRequest, deleteRequest, isReadOnly }: RequestTableProps) {
  if (requests.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="font-semibold">No hay solicitudes cargadas</p>
        <p className="text-sm mt-1">Sube un PDF para comenzar a extraer datos.</p>
      </div>
    );
  }

  const generateMailtoLink = (req: RequestData, isReminder: boolean): string => {
    if (!req.departamentoResponsable || req.tipoRespuesta !== 'En revisión') return '';
    
    const departmentEmailMap: Record<Department, string> = {
        'Jurídica': 'ftrejo@atta.gov.cl',
        'Personas': 'jastudillo@atta.gov.cl',
        'Operaciones': 'ivillablanca@atta.gov.cl',
        'Finanzas': 'ovasquez@atta.gov.cl',
        'Informática': 'kbrito@atta.gov.cl',
        'Comunicaciones': 'fgonzalez@atta.gov.cl',
        'Of. Partes': 'ofpartes@atta.gov.cl',
    };
    
    const to = departmentEmailMap[req.departamentoResponsable];
    
    const entregaDeptoDate = req.fechaVencimientoActualizada 
        ? (req.fechaVencimientoActualizada instanceof Date ? req.fechaVencimientoActualizada : (typeof req.fechaVencimientoActualizada === 'string' ? parseISO(req.fechaVencimientoActualizada) : new Date(req.fechaVencimientoActualizada)))
        : null;

    const fechaEntrega = entregaDeptoDate && isValid(entregaDeptoDate) ? format(entregaDeptoDate, 'dd/MM/yyyy') : '[Fecha no disponible]';

    let subject: string;
    let body: string;

    if (isReminder) {
        subject = `Recordatorio: Colaboración en Solicitud de Acceso a la Información - ${req.numeroSolicitud}`;
        body = `Estimado(a),\n\nJunto con saludar, escribo para recordarte que el plazo original para la entrega ha vencido, y tu colaboración es fundamental para que podamos dar respuesta a tiempo. Agradecemos mucho tu ayuda.\n\nNúmero de Solicitud: ${req.numeroSolicitud}\n\nQuedo a tu disposición para lo que necesites.\n\nSaludos cordiales.`;
    } else {
        subject = `Nueva Solicitud de Acceso a la Información Asignada - ${req.numeroSolicitud}`;
        body = `Estimado(a),\n\nJunto con saludar, informo que el usuario Felipe González Parraguez, Encargado de Comunicaciones, Transparencia y Participación Ciudadana, le ha enviado una Solicitud de Acceso a la Información para colaborar con la respuesta.\n\nSe ruega entregar la información para dar respuesta, a más tardar, el ${fechaEntrega}.\n\nNúmero de Solicitud: ${req.numeroSolicitud}\n\nSaludos cordiales.`;
    }

    return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };


  return (
    <div className="overflow-x-auto">
      <Table className="min-w-full whitespace-nowrap">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[220px]">N° Solicitud</TableHead>
            <TableHead>Nombre y Apellidos</TableHead>
            <TableHead className="w-[180px]">Etiqueta</TableHead>
            <TableHead>Fecha Ingreso</TableHead>
            <TableHead>Vencimiento</TableHead>
            <TableHead>Tipo Respuesta</TableHead>
            <TableHead>Responsable</TableHead>
            <TableHead>Envío Depto.</TableHead>
            <TableHead>Entrega Depto.</TableHead>
            <TableHead>Oposición</TableHead>
            <TableHead>Subsanación</TableHead>
            <TableHead>Prórroga</TableHead>
            <TableHead>Envío</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Cierre</TableHead>
            <TableHead>Días</TableHead>
            <TableHead>Cumplimiento</TableHead>
            <TableHead className="w-[120px] text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((req) => {
            const cierreDate = req.cierre ? (req.cierre instanceof Date ? req.cierre : parseDate(req.cierre as string)) : null;
            const envioDate = req.fechaEnvio ? (req.fechaEnvio instanceof Date ? req.fechaEnvio : parseDate(req.fechaEnvio as string)) : null;
            const envioDeptoDate = req.fechaEnvioDepto ? (req.fechaEnvioDepto instanceof Date ? req.fechaEnvioDepto : parseDate(req.fechaEnvioDepto as string)) : null;
            const vencimientoActualizadaDate = req.fechaVencimientoActualizada 
                ? (req.fechaVencimientoActualizada instanceof Date ? req.fechaVencimientoActualizada : (typeof req.fechaVencimientoActualizada === 'string' ? parseISO(req.fechaVencimientoActualizada) : new Date(req.fechaVencimientoActualizada)))
                : null;
            const mailtoLink = generateMailtoLink(req, false);
            const reminderMailtoLink = generateMailtoLink(req, true);

            return (
            <TableRow key={req.id}>
              <TableCell>
                <Input
                  defaultValue={req.numeroSolicitud}
                  onBlur={(e) => updateRequest(req.id, { numeroSolicitud: e.target.value })}
                  className="h-8"
                  readOnly={isReadOnly}
                />
              </TableCell>
              <TableCell>
                <Input
                  defaultValue={req.nombreApellido}
                  onBlur={(e) => updateRequest(req.id, { nombreApellido: e.target.value })}
                  className="h-8"
                  readOnly={isReadOnly}
                />
              </TableCell>
              <TableCell>
                <Input
                  defaultValue={req.etiqueta}
                  onBlur={(e) => updateRequest(req.id, { etiqueta: e.target.value })}
                  className="h-8"
                  placeholder="Añadir etiqueta"
                  readOnly={isReadOnly}
                />
              </TableCell>
              <TableCell>{req.fechaIngreso}</TableCell>
              <TableCell className={cn(req.fechaVencimientoModificada && "text-red-500 font-bold")}>
                {req.fechaVencimientoModificada || req.fechaVencimientoInicial}
              </TableCell>
              <TableCell>
                <Select
                  value={req.tipoRespuesta}
                  onValueChange={(value: ResponseType) => updateRequest(req.id, { tipoRespuesta: value })}
                  disabled={isReadOnly}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {responseTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                {req.tipoRespuesta === 'En revisión' ? (
                  <Select
                    value={req.departamentoResponsable}
                    onValueChange={(value: Department) => updateRequest(req.id, { departamentoResponsable: value })}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  req.tipoRespuesta === 'Derivación' ? (
                    <span>{req.departamentoResponsable}</span>
                  ) : (
                    <span className="text-muted-foreground text-xs">No aplica</span>
                  )
                )}
              </TableCell>
              <TableCell>
                {req.tipoRespuesta === 'En revisión' || req.tipoRespuesta === 'Derivación' ? (
                  <Popover>
                      <PopoverTrigger asChild disabled={isReadOnly}>
                          <Button
                              variant={"outline"}
                              className={cn(
                                  "w-[150px] justify-start text-left font-normal h-8",
                                  !envioDeptoDate && "text-muted-foreground"
                              )}
                          >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {envioDeptoDate && isValid(envioDeptoDate) ? format(envioDeptoDate, "dd/MM/yyyy") : <span>Elegir fecha</span>}
                          </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                          <Calendar
                              mode="single"
                              selected={envioDeptoDate && isValid(envioDeptoDate) ? envioDeptoDate : undefined}
                              onSelect={(date) => updateRequest(req.id, { fechaEnvioDepto: date })}
                              initialFocus
                          />
                      </PopoverContent>
                  </Popover>
                ) : <span className="text-muted-foreground text-xs">No aplica</span>}
              </TableCell>
              <TableCell>
                {vencimientoActualizadaDate && isValid(vencimientoActualizadaDate) ? format(vencimientoActualizadaDate, 'dd/MM/yyyy') : 'N/A'}
              </TableCell>
              <TableCell>
                <Checkbox
                  checked={!!req.oposicion}
                  onCheckedChange={(checked) => updateRequest(req.id, { oposicion: !!checked })}
                  disabled={isReadOnly}
                />
              </TableCell>
              <TableCell>
                <Checkbox
                  checked={!!req.subsanacion}
                  onCheckedChange={(checked) => updateRequest(req.id, { subsanacion: !!checked })}
                  disabled={isReadOnly}
                />
              </TableCell>
              <TableCell>
                <Checkbox
                  checked={!!req.prorroga}
                  onCheckedChange={(checked) => updateRequest(req.id, { prorroga: !!checked })}
                  disabled={isReadOnly}
                />
              </TableCell>
              <TableCell>
                <Popover>
                    <PopoverTrigger asChild disabled={isReadOnly}>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-[150px] justify-start text-left font-normal h-8",
                                !envioDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {envioDate && isValid(envioDate) ? format(envioDate, "dd/MM/yyyy") : <span>Elegir fecha</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={envioDate && isValid(envioDate) ? envioDate : undefined}
                            onSelect={(date) => updateRequest(req.id, { fechaEnvio: date })}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
              </TableCell>
              <TableCell>
                <Select
                    value={req.estado}
                    onValueChange={(value: StatusType) => updateRequest(req.id, { estado: value })}
                    disabled={isReadOnly}
                >
                    <SelectTrigger className="h-8">
                        <SelectValue placeholder="Seleccionar..."/>
                    </SelectTrigger>
                    <SelectContent>
                        {statusTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Popover>
                    <PopoverTrigger asChild disabled={isReadOnly}>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-[150px] justify-start text-left font-normal h-8",
                                !cierreDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {cierreDate && isValid(cierreDate) ? format(cierreDate, "dd/MM/yyyy") : <span>Elegir fecha</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={cierreDate && isValid(cierreDate) ? cierreDate : undefined}
                            onSelect={(date) => updateRequest(req.id, { cierre: date })}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
              </TableCell>
               <TableCell>
                {req.dias !== undefined ? req.dias : 'N/A'}
              </TableCell>
              <TableCell>
                <ComplianceDot status={req.complianceStatus} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end items-center gap-1">
                  {!isReadOnly && (
                    <>
                      {mailtoLink && (
                        <a href={mailtoLink} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Enviar correo de asignación">
                            <Mail className="h-4 w-4 text-primary" />
                          </Button>
                        </a>
                      )}
                      {reminderMailtoLink && (
                        <a href={reminderMailtoLink} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Enviar recordatorio">
                            <Bell className="h-4 w-4 text-yellow-500" />
                          </Button>
                        </a>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => deleteRequest(req.id)} className="h-8 w-8" title="Eliminar solicitud">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )})}
        </TableBody>
      </Table>
    </div>
  );
}
