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
import { useState } from 'react';

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

const DatePickerCell = ({ date, onUpdate, isReadOnly }: { date?: Date | string | null, onUpdate: (date: Date | null) => void, isReadOnly: boolean }) => {
  const [open, setOpen] = useState(false);
  
  const dateValue = date ? (date instanceof Date ? date : parseDate(String(date))) : null;
  const [inputValue, setInputValue] = useState(dateValue && isValid(dateValue) ? format(dateValue, 'dd/MM/yyyy') : '');

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    const parsedDate = parseDate(e.target.value);
    if (parsedDate && isValid(parsedDate)) {
      onUpdate(parsedDate);
    } else if (e.target.value === '') {
      onUpdate(null);
    }
  };

  const handleSelectDate = (selectedDate?: Date) => {
    if (selectedDate) {
      onUpdate(selectedDate);
      setInputValue(format(selectedDate, 'dd/MM/yyyy'));
    } else {
      onUpdate(null);
      setInputValue('');
    }
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild disabled={isReadOnly}>
            <div className="relative">
                <Input 
                    value={inputValue}
                    onChange={handleManualChange}
                    onBlur={() => {
                        const parsedDate = parseDate(inputValue);
                        if (!parsedDate || !isValid(parsedDate)) {
                           onUpdate(null);
                           setInputValue('');
                        }
                    }}
                    placeholder="dd/MM/yyyy"
                    className={cn("w-[150px] h-8", !dateValue && "text-muted-foreground")}
                    readOnly={isReadOnly}
                />
                <CalendarIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
            <Calendar
                mode="single"
                selected={dateValue && isValid(dateValue) ? dateValue : undefined}
                onSelect={handleSelectDate}
                initialFocus
            />
        </PopoverContent>
    </Popover>
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
                  <DatePickerCell 
                    date={req.fechaEnvioDepto}
                    onUpdate={(date) => updateRequest(req.id, { fechaEnvioDepto: date })}
                    isReadOnly={isReadOnly}
                  />
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
                <DatePickerCell 
                  date={req.fechaEnvio}
                  onUpdate={(date) => updateRequest(req.id, { fechaEnvio: date })}
                  isReadOnly={isReadOnly}
                />
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
                <DatePickerCell 
                  date={req.cierre}
                  onUpdate={(date) => updateRequest(req.id, { cierre: date })}
                  isReadOnly={isReadOnly}
                />
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
