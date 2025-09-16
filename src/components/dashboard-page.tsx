"use client";

import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import type { RequestData } from "@/lib/types";
import { calculateDueDate, getComplianceStatus, readFileAsDataURL, calculateBusinessDays, addBusinessDays, parseDate, format } from "@/lib/utils";
import { extractPdfData } from "@/ai/flows/extract-pdf-data";
import { Logo } from "@/components/logo";
import { SummaryCards } from "@/components/summary-cards";
import { RequestTable } from "@/components/request-table";
import { UserProfile } from "@/components/user-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, Search, ArrowDownUp, Download } from "lucide-react";
import { useAuth } from "@/context/auth-context";

type SortDirection = 'asc' | 'desc';

export function DashboardPage() {
  const { user, loading } = useAuth();
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [displayedRequests, setDisplayedRequests] = useState<RequestData[]>([]);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'requests' && event.newValue) {
        try {
          const newRequests = JSON.parse(event.newValue).map((req: any) => ({
            ...req,
            cierre: req.cierre ? new Date(req.cierre) : undefined,
            fechaVencimientoActualizada: req.fechaVencimientoActualizada ? new Date(req.fechaVencimientoActualizada) : undefined,
            fechaEnvio: req.fechaEnvio ? new Date(req.fechaEnvio) : undefined,
            fechaEnvioDepto: req.fechaEnvioDepto ? new Date(req.fechaEnvioDepto) : undefined,
          }));
          setRequests(newRequests);
        } catch (error) {
          console.error("Failed to parse requests from storage event", error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    try {
      const storedRequests = localStorage.getItem('requests');
      if (storedRequests) {
        let parsedRequests: RequestData[] = JSON.parse(storedRequests).map((req: any) => ({
          ...req,
          cierre: req.cierre ? new Date(req.cierre) : undefined,
          fechaVencimientoActualizada: req.fechaVencimientoActualizada ? new Date(req.fechaVencimientoActualizada) : undefined,
          fechaEnvio: req.fechaEnvio ? new Date(req.fechaEnvio) : undefined,
          fechaEnvioDepto: req.fechaEnvioDepto ? new Date(req.fechaEnvioDepto) : undefined,
        }));

        const correctedRequests = parsedRequests.map(req => {
          if (req.tipoRespuesta === 'Derivación') {
            return { ...req, departamentoResponsable: 'Of. Partes' };
          }
          return req;
        });

        setRequests(correctedRequests);
      }
    } catch (error) {
      console.error("Failed to parse requests from localStorage", error);
    }
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
        if (requests.length > 0) {
            isInitialMount.current = false;
        }
        return;
    }
    try {
      localStorage.setItem('requests', JSON.stringify(requests));
    } catch (error) {
      console.error("Failed to save requests to localStorage", error);
    }
  }, [requests]);


  useEffect(() => {
    const getRequestNumber = (solicitud: string): number => {
      if (!solicitud || typeof solicitud !== 'string') {
        return 0;
      }
      // Extracts the last sequence of digits from the string
      const match = solicitud.match(/\d+$/);
      if (!match) return 0;
      return parseInt(match[0], 10);
    };

    let sorted = [...requests];
    
    sorted.sort((a, b) => {
        const aNum = getRequestNumber(a.numeroSolicitud);
        const bNum = getRequestNumber(b.numeroSolicitud);
        
        if (sortDirection === 'asc') {
            return aNum - bNum;
        } else {
            return bNum - aNum;
        }
    });

    let filtered = sorted;
    if (filter) {
        filtered = sorted.filter(req =>
            Object.values(req).some(val =>
                String(val).toLowerCase().includes(filter.toLowerCase())
            )
        );
    }
    
    setDisplayedRequests(filtered);
}, [requests, filter, sortDirection]);

  const handleSort = () => {
    setSortDirection(prev => (prev === 'desc' ? 'asc' : 'desc'));
  };

  const updateRequest = (id: string, newValues: Partial<RequestData>) => {
    setRequests(prev => prev.map(req => {
      if (req.id === id) {
        const originalReq = { ...req };
        const updatedReq = { ...req, ...newValues };
        
        if (newValues.tipoRespuesta === 'Derivación') {
            updatedReq.departamentoResponsable = 'Of. Partes';
        }

        if ('fechaEnvioDepto' in newValues) {
            const baseDate = updatedReq.fechaEnvioDepto ? (typeof updatedReq.fechaEnvioDepto === 'string' ? parseDate(updatedReq.fechaEnvioDepto) : updatedReq.fechaEnvioDepto as Date) : null;
            if(baseDate) {
              updatedReq.fechaVencimientoActualizada = calculateDueDate(baseDate);
            } else {
              updatedReq.fechaVencimientoActualizada = undefined;
            }
        }
        
        if ('oposicion' in newValues || 'subsanacion' in newValues || 'prorroga' in newValues || 'fechaEnvio' in newValues) {
          const baseDate = updatedReq.fechaEnvio ? (typeof updatedReq.fechaEnvio === 'string' ? parseDate(updatedReq.fechaEnvio) : updatedReq.fechaEnvio as Date) : null;
      
          if (baseDate) {
              let extraDays = 0;
              if (updatedReq.oposicion) extraDays += 3;
              if (updatedReq.subsanacion) extraDays += 5;
              if (updatedReq.prorroga) extraDays += 10;
              
              if (extraDays > 0) {
                  const newDueDate = addBusinessDays(baseDate, extraDays);
                  updatedReq.fechaVencimientoModificada = format(newDueDate, 'dd/MM/yyyy');
              } else {
                  updatedReq.fechaVencimientoModificada = undefined;
              }
          } else {
              updatedReq.fechaVencimientoModificada = undefined;
          }
        }
        
        if ('cierre' in newValues && newValues.cierre) {
            const parsedCierre = newValues.cierre instanceof Date ? newValues.cierre : (typeof newValues.cierre === 'string' ? parseDate(newValues.cierre) : null);
            if (parsedCierre && !isNaN(parsedCierre.getTime())) {
              updatedReq.dias = calculateBusinessDays(updatedReq.fechaIngreso, parsedCierre);
              if (updatedReq.dias !== undefined) {
                updatedReq.complianceStatus = getComplianceStatus(updatedReq.dias);
              }
            } else {
              updatedReq.dias = undefined;
              updatedReq.complianceStatus = undefined;
            }
        } else if ('cierre' in newValues && !newValues.cierre) {
            updatedReq.dias = undefined;
            updatedReq.complianceStatus = undefined;
        }

        return updatedReq;
      }
      return req;
    }));
  };

  const deleteRequest = (id: string) => {
    setRequests(prev => prev.filter(req => req.id !== id));
    toast({
      title: "Solicitud eliminada",
      description: "La solicitud ha sido eliminada de la tabla.",
    });
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const pdfDataUri = await readFileAsDataURL(file);
      const extractedData = await extractPdfData({ pdfDataUri });

      const newRequest: RequestData = {
        id: crypto.randomUUID(),
        ...extractedData,
        pdfDataUri: pdfDataUri,
        tipoRespuesta: 'En revisión',
        oposicion: false,
        subsanacion: false,
        prorroga: false,
        etiqueta: '',
      };

      setRequests(prev => [newRequest, ...prev]);
      toast({
        title: "Éxito",
        description: "Datos extraídos del PDF y agregados a la tabla.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error extracting PDF data:", error);
      toast({
        title: "Error de Extracción",
        description: "No se pudieron extraer los datos del PDF. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDownloadReport = () => {
    if (displayedRequests.length === 0) {
      toast({
        title: "No hay datos para exportar",
        description: "Cargue solicitudes antes de descargar el reporte.",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "N° Solicitud", "Nombre y Apellidos", "Etiqueta", "Fecha Ingreso", "Vencimiento",
      "Tipo Respuesta", "Responsable", "Envío Depto.", "Entrega Depto.", "Oposición", "Subsanación", "Prórroga", "Fecha Envío",
      "Estado", "Cierre", "Días", "Cumplimiento"
    ];

    const formatForCsv = (value: any) => {
      if (value === null || value === undefined) return '';
      if (value instanceof Date) return format(value, 'dd/MM/yyyy');
      
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const csvContent = [
      headers.join(','),
      ...displayedRequests.map(req => [
        formatForCsv(req.numeroSolicitud),
        formatForCsv(req.nombreApellido),
        formatForCsv(req.etiqueta),
        formatForCsv(req.fechaIngreso),
        formatForCsv(req.fechaVencimientoModificada || req.fechaVencimientoInicial),
        formatForCsv(req.tipoRespuesta),
        formatForCsv(req.departamentoResponsable),
        req.fechaEnvioDepto ? format(new Date(req.fechaEnvioDepto), 'dd/MM/yyyy') : '',
        req.fechaVencimientoActualizada ? format(new Date(req.fechaVencimientoActualizada), 'dd/MM/yyyy') : '',
        formatForCsv(req.oposicion ? 'Sí' : 'No'),
        formatForCsv(req.subsanacion ? 'Sí' : 'No'),
        formatForCsv(req.prorroga ? 'Sí' : 'No'),
        req.fechaEnvio ? format(new Date(req.fechaEnvio), 'dd/MM/yyyy') : '',
        formatForCsv(req.estado),
        req.cierre ? format(new Date(req.cierre), 'dd/MM/yyyy') : '',
        formatForCsv(req.dias),
        formatForCsv(req.complianceStatus),
      ].join(','))
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'reporte_solicitudes.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
        title: "Reporte generado",
        description: "La descarga de su reporte ha comenzado.",
    });
  };
  
  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  if (!user) return null;
  const isAuditor = user.role === 'Auditor';

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 md:p-6 flex justify-between items-start">
        <Logo />
        <UserProfile />
      </header>
      <main className="flex-grow p-4 md:p-6 space-y-6">
        <SummaryCards requests={requests} />
        
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <CardTitle>Gestión de Solicitudes</CardTitle>
              <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Filtrar solicitudes..." 
                    className="pl-9"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                </div>
                <Button variant="outline" onClick={handleSort}>
                    <ArrowDownUp className="mr-2 h-4 w-4" />
                    Ordenar ({sortDirection === 'desc' ? 'Desc' : 'Asc'})
                </Button>
                <Button onClick={handleDownloadReport}>
                    <Download className="mr-2 h-4 w-4" />
                    Descargar Reporte
                </Button>
                {!isAuditor && (
                  <form onSubmit={(e: FormEvent) => e.preventDefault()}>
                    <Button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="bg-accent hover:bg-accent/90">
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      Cargar PDF
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept="application/pdf"
                      disabled={isLoading}
                    />
                  </form>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <RequestTable 
              requests={displayedRequests}
              updateRequest={updateRequest}
              deleteRequest={deleteRequest}
              isReadOnly={isAuditor}
            />
          </CardContent>
        </Card>
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground">
        © {new Date().getFullYear()} Ministerio de Hacienda. Todos los derechos reservados.
      </footer>
    </div>
  );
}
