import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { 
  Calculator as CalculatorIcon, 
  Truck, 
  Route, 
  Package, 
  Fuel,
  DollarSign,
  Settings,
  TrendingUp
} from "lucide-react";

interface Vehicle {
  id: string;
  tipo: string;
  capacidade_ton: number;
  custo_por_km: number;
  km_por_litro: number;
  status: string;
}

interface RouteData {
  id: string;
  origem: string;
  destino: string;
  distancia_km: number;
  tempo_estimado_h: number;
}

interface Cargo {
  id: string;
  name: string;
  weight: number;
  value: number;
  type: string;
}

interface CostCalculation {
  id: string;
  vehicleId: string;
  routeId: string;
  distance: number;
  costPerKm: number;
  totalCost: number;
  calculatedAt: Date;
}

export default function Calculator() {
  const { user } = useAuth();
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [selectedRoute, setSelectedRoute] = useState<string>("");
  const [calculation, setCalculation] = useState<CostCalculation | null>(null);

  // Fetch vehicles
  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, tipo, capacidade_ton, custo_por_km, km_por_litro, status")
        .eq("user_id", user.id)
        .eq("status", "Disponível")
        .order("tipo");
      
      if (error) throw error;
      return data as Vehicle[];
    },
    enabled: !!user?.id,
  });

  // Fetch routes
  const { data: routes = [] } = useQuery({
    queryKey: ["routes"],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("routes")
        .select("id, origem, destino, distancia_km, tempo_estimado_h")
        .eq("user_id", user.id)
        .order("origem");
      
      if (error) throw error;
      return data as RouteData[];
    },
    enabled: !!user?.id,
  });


  // Calculate costs when selections change
  useEffect(() => {
    if (selectedVehicle && selectedRoute) {
      calculateCosts();
    }
  }, [selectedVehicle, selectedRoute]);

  const calculateCosts = () => {
    const vehicle = vehicles.find(v => v.id === selectedVehicle);
    const route = routes.find(r => r.id === selectedRoute);
    
    if (!vehicle || !route) return;

    const distance = Number(route.distancia_km);
    const costPerKm = Number(vehicle.custo_por_km);
    
    // Cálculo simples: distância × custo por km
    const totalCost = distance * costPerKm;
    
    const result: CostCalculation = {
      id: crypto.randomUUID(),
      vehicleId: selectedVehicle,
      routeId: selectedRoute,
      distance,
      costPerKm,
      totalCost,
      calculatedAt: new Date(),
    };
    
    setCalculation(result);
  };

  const handleCalculate = () => {
    if (!selectedVehicle || !selectedRoute) {
      toast({
        title: "Seleções incompletas",
        description: "Por favor, selecione um veículo e rota para calcular.",
        variant: "destructive",
      });
      return;
    }
    
    calculateCosts();
    toast({
      title: "Cálculo realizado",
      description: "Os custos foram calculados com sucesso.",
    });
  };

  const resetCalculation = () => {
    setSelectedVehicle("");
    setSelectedRoute("");
    setCalculation(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Calculadora de Custos</h1>
        <p className="text-muted-foreground">
          Simule custos de transporte baseados em seus veículos, rotas e cargas cadastradas.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações do Cálculo
              </CardTitle>
              <CardDescription>
                Configure os parâmetros para a simulação de custos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Vehicle Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Veículo
                </Label>
                <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um veículo" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.length === 0 ? (
                      <SelectItem value="none" disabled>
                        Nenhum veículo disponível
                      </SelectItem>
                    ) : (
                      vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.tipo} ({vehicle.capacidade_ton}t)
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Route Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Route className="h-4 w-4" />
                  Rota
                </Label>
                <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma rota" />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.length === 0 ? (
                      <SelectItem value="none" disabled>
                        Nenhuma rota disponível
                      </SelectItem>
                    ) : (
                      routes.map((route) => (
                        <SelectItem key={route.id} value={route.id}>
                          {route.origem} → {route.destino} ({route.distancia_km} km - {route.tempo_estimado_h}h)
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>


              <Separator />

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button onClick={handleCalculate} className="flex-1">
                  <CalculatorIcon className="h-4 w-4 mr-2" />
                  Calcular Custos
                </Button>
                <Button variant="outline" onClick={resetCalculation}>
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Info */}
          {(selectedVehicle || selectedRoute) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo da Simulação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedVehicle && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Veículo:</span>
                    <span className="font-medium">
                      {vehicles.find(v => v.id === selectedVehicle)?.tipo}
                    </span>
                  </div>
                )}
                {selectedRoute && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rota:</span>
                    <span className="font-medium">
                      {(() => {
                        const route = routes.find(r => r.id === selectedRoute);
                        return route ? `${route.origem} → ${route.destino}` : '';
                      })()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          {calculation ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Resultado do Cálculo
                  </CardTitle>
                  <CardDescription>
                    Detalhamento dos custos calculados
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Calculation ID */}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">ID do Cálculo</div>
                    <div className="font-mono text-sm">{calculation.id}</div>
                  </div>

                  {/* Total Cost - Highlight */}
                  <div className="p-4 bg-primary/10 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium">Custo Total</span>
                      <span className="text-2xl font-bold text-primary">
                        R$ {calculation.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  {/* Detailed Breakdown */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ID do Veículo:</span>
                      <span className="font-mono text-sm">{calculation.vehicleId}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ID da Rota:</span>
                      <span className="font-mono text-sm">{calculation.routeId}</span>
                    </div>

                    <Separator />

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Distância (km):</span>
                      <span className="font-medium">{calculation.distance} km</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Custo por km:</span>
                      <span className="font-medium">
                        R$ {calculation.costPerKm.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Calculado em:</span>
                      <span className="font-medium">
                        {calculation.calculatedAt.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  {/* Formula Display */}
                  <div className="p-3 bg-accent/50 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-2">Fórmula</div>
                    <div className="font-medium">
                      {calculation.distance} km × R$ {calculation.costPerKm.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} = R$ {calculation.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Analysis Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Análise do Cálculo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      Custo: {calculation.costPerKm < 1 ? "Baixo" : calculation.costPerKm < 3 ? "Médio" : "Alto"}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    Cálculo baseado na fórmula: Distância × Custo por km do veículo selecionado.
                  </p>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <CalculatorIcon className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="font-medium">Pronto para Calcular</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Selecione um veículo e rota para ver os custos calculados
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}