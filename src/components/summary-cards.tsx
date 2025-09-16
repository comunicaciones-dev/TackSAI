"use client"

import type { RequestData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle2, XCircle, GaugeCircle, Share2, Ban, FolderMinus, Shield, Users, FilePenLine, Hourglass } from 'lucide-react';
import { useMemo } from 'react';

interface SummaryCardsProps {
  requests: RequestData[];
}

export function SummaryCards({ requests }: SummaryCardsProps) {
  const summaryStats = useMemo(() => {
    const closedRequestsWithDays = requests.filter(r => typeof r.dias === 'number' && r.dias > 0);
    const totalDays = closedRequestsWithDays.reduce((sum, r) => sum + r.dias!, 0);
    
    return {
      total: requests.length,
      green: requests.filter(r => r.complianceStatus === 'green').length,
      red: requests.filter(r => r.complianceStatus === 'red').length,
      averageDays: closedRequestsWithDays.length > 0 ? (totalDays / closedRequestsWithDays.length).toFixed(1) : 'N/A',
      derivadas: requests.filter(r => r.estado === 'Derivada').length,
      denegadas: requests.filter(r => r.estado === 'Denegada').length,
      desistidas: requests.filter(r => r.estado === 'Desistida').length,
      oposicion: requests.filter(r => r.oposicion).length,
      subsanacion: requests.filter(r => r.subsanacion).length,
      prorroga: requests.filter(r => r.prorroga).length,
      juridica: requests.filter(r => r.departamentoResponsable === 'Jurídica').length,
      personas: requests.filter(r => r.departamentoResponsable === 'Personas').length,
      operaciones: requests.filter(r => r.departamentoResponsable === 'Operaciones').length,
      finanzas: requests.filter(r => r.departamentoResponsable === 'Finanzas').length,
      informatica: requests.filter(r => r.departamentoResponsable === 'Informática').length,
      comunicaciones: requests.filter(r => r.departamentoResponsable === 'Comunicaciones').length,
    }
  }, [requests]);

  const summaryData = [
    { title: 'Total de Solicitudes', value: summaryStats.total, icon: FileText, color: 'text-primary' },
    { title: 'Entregadas', value: summaryStats.green, icon: CheckCircle2, color: 'text-green-500' },
    { title: 'Vencido', value: summaryStats.red, icon: XCircle, color: 'text-red-500' },
    { title: 'Derivadas', value: summaryStats.derivadas, icon: Share2, color: 'text-blue-500' },
    { title: 'Denegadas', value: summaryStats.denegadas, icon: Ban, color: 'text-orange-500' },
    { title: 'Desistidas', value: summaryStats.desistidas, icon: FolderMinus, color: 'text-gray-500' },
    { title: 'Oposición', value: summaryStats.oposicion, icon: Shield, color: 'text-indigo-500' },
    { title: 'Subsanación', value: summaryStats.subsanacion, icon: FilePenLine, color: 'text-teal-500' },
    { title: 'Prórroga', value: summaryStats.prorroga, icon: Hourglass, color: 'text-purple-500' },
  ];

  const departmentData = [
    { title: 'Jurídica', value: summaryStats.juridica, icon: Users, color: 'text-cyan-500' },
    { title: 'Personas', value: summaryStats.personas, icon: Users, color: 'text-pink-500' },
    { title: 'Operaciones', value: summaryStats.operaciones, icon: Users, color: 'text-amber-500' },
    { title: 'Finanzas', value: summaryStats.finanzas, icon: Users, color: 'text-lime-500' },
    { title: 'Informática', value: summaryStats.informatica, icon: Users, color: 'text-sky-500' },
    { title: 'Comunicaciones', value: summaryStats.comunicaciones, icon: Users, color: 'text-violet-500' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-10">
        {summaryData.map((item, index) => (
          <Card key={index} className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{item.value}</div>
            </CardContent>
          </Card>
        ))}
        <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio Días Hábiles</CardTitle>
              <GaugeCircle className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summaryStats.averageDays}</div>
            </CardContent>
          </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {departmentData.map((item, index) => (
          <Card key={index} className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
