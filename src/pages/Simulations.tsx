import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Save, FileText, Calculator } from "lucide-react";

export default function Simulations() {
  const [simulations] = useState([
    {
      id: 1,
      name: "Simulação - Rota SP-RJ",
      type: "cost",
      status: "completed",
      createdAt: "2024-01-15",
      results: {
        totalCost: 2850.50,
        distance: 450,
        duration: 8.5
      }
    },
    {
      id: 2,
      name: "Análise de Frota - Veículos Pesados",
      type: "fleet",
      status: "draft",
      createdAt: "2024-01-14",
      results: null
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'running':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'draft':
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluída';
      case 'running':
        return 'Em execução';
      case 'draft':
        return 'Rascunho';
      default:
        return status;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Simulações</h1>
          <p className="text-muted-foreground">
            Crie e execute simulações de transporte e custos
          </p>
        </div>
        <Button className="gap-2">
          <Play className="h-4 w-4" />
          Nova Simulação
        </Button>
      </div>

      {/* Simulação Rápida */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Cálculo de Custos</CardTitle>
            </div>
            <CardDescription>
              Simule custos de transporte para uma rota específica
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Iniciar Simulação
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Análise de Frota</CardTitle>
            </div>
            <CardDescription>
              Compare eficiência e custos da sua frota
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Iniciar Simulação
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Otimização de Rotas</CardTitle>
            </div>
            <CardDescription>
              Encontre as melhores rotas para suas entregas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Iniciar Simulação
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Simulações Salvas */}
      <Card>
        <CardHeader>
          <CardTitle>Simulações Salvas</CardTitle>
          <CardDescription>
            Histórico das suas simulações realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {simulations.map((simulation) => (
              <div
                key={simulation.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{simulation.name}</h3>
                    <Badge className={getStatusColor(simulation.status)}>
                      {getStatusText(simulation.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Criada em {new Date(simulation.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                  {simulation.results && (
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>Custo: R$ {simulation.results.totalCost.toFixed(2)}</span>
                      <span>Distância: {simulation.results.distance} km</span>
                      <span>Tempo: {simulation.results.duration}h</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}