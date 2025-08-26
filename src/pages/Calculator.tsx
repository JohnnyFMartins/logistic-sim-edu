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
  model: string;
  plate: string;
  consumption: number;
  maintenance_cost: number;
  capacity: number;
}

interface RouteData {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distance: number;
  estimated_time: number;
}

interface Cargo {
  id: string;
  name: string;
  weight: number;
  value: number;
  type: string;
}

interface CostCalculation {
  fuelCost: number;
  maintenanceCost: number;
  totalDistance: number;
  totalTime: number;
  cargoWeight: number;
  cargoValue: number;
  totalCost: number;
  costPerKm: number;
  costPerKg: number;
}

export default function Calculator() {
  const { user } = useAuth();
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [selectedRoute, setSelectedRoute] = useState<string>("");
  const [selectedCargo, setSelectedCargo] = useState<string>("");
  const [fuelPrice, setFuelPrice] = useState("5.50");
  const [calculation, setCalculation] = useState<CostCalculation | null>(null);

  // Fetch vehicles
  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("model");
      
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
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("name");
      
      if (error) throw error;
      return data as RouteData[];
    },
    enabled: !!user?.id,
  });

  // Fetch cargo
  const { data: cargo = [] } = useQuery({
    queryKey: ["cargo"],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("cargo")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("name");
      
      if (error) throw error;
      return data as Cargo[];
    },
    enabled: !!user?.id,
  });

  // Calculate costs when selections change
  useEffect(() => {
    if (selectedVehicle && selectedRoute && selectedCargo && fuelPrice) {
      calculateCosts();
    }
  }, [selectedVehicle, selectedRoute, selectedCargo, fuelPrice]);

  const calculateCosts = () => {
    const vehicle = vehicles.find(v => v.id === selectedVehicle);
    const route = routes.find(r => r.id === selectedRoute);
    const cargoItem = cargo.find(c => c.id === selectedCargo);
    
    if (!vehicle || !route || !cargoItem) return;

    const fuelPriceNum = parseFloat(fuelPrice);
    const distance = Number(route.distance);
    const consumption = Number(vehicle.consumption);
    const maintenanceCostPerKm = Number(vehicle.maintenance_cost);
    
    // Calculate fuel consumption (liters needed)
    const fuelNeeded = distance / consumption;
    const fuelCost = fuelNeeded * fuelPriceNum;
    
    // Calculate maintenance cost
    const maintenanceCost = (maintenanceCostPerKm / 100) * distance;
    
    // Total cost
    const totalCost = fuelCost + maintenanceCost;
    
    const result: CostCalculation = {
      fuelCost,
      maintenanceCost,
      totalDistance: distance,
      totalTime: Number(route.estimated_time),
      cargoWeight: Number(cargoItem.weight),
      cargoValue: Number(cargoItem.value),
      totalCost,
      costPerKm: totalCost / distance,
      costPerKg: totalCost / Number(cargoItem.weight),
    };
    
    setCalculation(result);
  };

  const handleCalculate = () => {
    if (!selectedVehicle || !selectedRoute || !selectedCargo) {
      toast({
        title: "Seleções incompletas",
        description: "Por favor, selecione um veículo, rota e carga para calcular.",
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
    setSelectedCargo("");
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
                          {vehicle.model} - {vehicle.plate} ({vehicle.consumption} km/L)
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
                          {route.name} - {route.distance} km
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Cargo Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Carga
                </Label>
                <Select value={selectedCargo} onValueChange={setSelectedCargo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma carga" />
                  </SelectTrigger>
                  <SelectContent>
                    {cargo.length === 0 ? (
                      <SelectItem value="none" disabled>
                        Nenhuma carga disponível
                      </SelectItem>
                    ) : (
                      cargo.map((cargoItem) => (
                        <SelectItem key={cargoItem.id} value={cargoItem.id}>
                          {cargoItem.name} - {cargoItem.weight} kg
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Fuel Price */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Fuel className="h-4 w-4" />
                  Preço do Combustível (R$/L)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={fuelPrice}
                  onChange={(e) => setFuelPrice(e.target.value)}
                  placeholder="Ex: 5.50"
                />
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
          {(selectedVehicle || selectedRoute || selectedCargo) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo da Simulação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedVehicle && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Veículo:</span>
                    <span className="font-medium">
                      {vehicles.find(v => v.id === selectedVehicle)?.model}
                    </span>
                  </div>
                )}
                {selectedRoute && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rota:</span>
                    <span className="font-medium">
                      {routes.find(r => r.id === selectedRoute)?.name}
                    </span>
                  </div>
                )}
                {selectedCargo && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Carga:</span>
                    <span className="font-medium">
                      {cargo.find(c => c.id === selectedCargo)?.name}
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
                      <span className="text-muted-foreground">Custo de Combustível:</span>
                      <span className="font-medium">
                        R$ {calculation.fuelCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Custo de Manutenção:</span>
                      <span className="font-medium">
                        R$ {calculation.maintenanceCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <Separator />

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Distância Total:</span>
                      <span className="font-medium">{calculation.totalDistance} km</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tempo Estimado:</span>
                      <span className="font-medium">{calculation.totalTime}h</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Peso da Carga:</span>
                      <span className="font-medium">{calculation.cargoWeight} kg</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor da Carga:</span>
                      <span className="font-medium">
                        R$ {calculation.cargoValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  {/* KPIs */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Indicadores</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-accent/50 rounded-lg">
                        <div className="text-sm text-muted-foreground">Custo por km</div>
                        <div className="font-medium">
                          R$ {calculation.costPerKm.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      
                      <div className="p-3 bg-accent/50 rounded-lg">
                        <div className="text-sm text-muted-foreground">Custo por kg</div>
                        <div className="font-medium">
                          R$ {calculation.costPerKg.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Analysis Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Análise do Transporte</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      Eficiência: {calculation.costPerKm < 2 ? "Alta" : calculation.costPerKm < 4 ? "Média" : "Baixa"}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {calculation.costPerKm < 2 
                      ? "Excelente custo-benefício para esta simulação de transporte."
                      : calculation.costPerKm < 4 
                      ? "Custo razoável, considere otimizações na rota ou veículo."
                      : "Custo elevado, revise as configurações para maior eficiência."
                    }
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
                      Selecione um veículo, rota e carga para ver os custos calculados
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