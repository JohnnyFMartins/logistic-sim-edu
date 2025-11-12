import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Calendar, 
  MapPin, 
  Truck,
  CheckCircle2,
  Clock,
  PlayCircle,
  Eye,
  Weight,
  Package,
  Download,
  FileText,
  DollarSign
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface Trip {
  id: string;
  user_id: string;
  vehicle_id: string;
  route_id: string;
  start_date: string;
  end_date: string;
  status: 'Planejada' | 'Em_Andamento' | 'Concluída';
  peso_ton?: number;
  volume_m3?: number;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

interface Vehicle {
  id: string;
  tipo: string;
  capacidade_ton: number;
  status: string;
}

interface Route {
  id: string;
  origem: string;
  destino: string;
  distancia_km: number;
  tempo_estimado_h: number;
}

export default function Viagens() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const [formData, setFormData] = useState<{
    vehicle_id: string;
    route_id: string;
    start_date: string;
    end_date: string;
    status: 'Planejada' | 'Em_Andamento' | 'Concluída';
    peso_ton: string;
    volume_m3: string;
    custo_extra: string;
    custo_extra_descricao: string;
    observacoes: string;
  }>({
    vehicle_id: "",
    route_id: "",
    start_date: "",
    end_date: "",
    status: "Planejada",
    peso_ton: "",
    volume_m3: "",
    custo_extra: "",
    custo_extra_descricao: "",
    observacoes: "",
  });

  // Buscar viagens
  const { data: trips = [], isLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("user_id", user.id)
        .order("start_date", { ascending: false });
      
      if (error) throw error;
      return data as Trip[];
    },
    enabled: !!user?.id,
  });

  // Buscar veículos para dropdown
  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, tipo, capacidade_ton, status")
        .eq("user_id", user.id)
        .eq("status", "Disponível")
        .order("tipo");
      
      if (error) throw error;
      return data as Vehicle[];
    },
    enabled: !!user?.id,
  });

  // Buscar rotas para dropdown
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
      return data as Route[];
    },
    enabled: !!user?.id,
  });

  // Mutation para criar viagem
  const createTripMutation = useMutation({
    mutationFn: async (tripData: typeof formData) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const payload = {
        vehicle_id: tripData.vehicle_id,
        route_id: tripData.route_id,
        start_date: tripData.start_date,
        end_date: tripData.end_date,
        status: tripData.status,
        peso_ton: tripData.peso_ton ? parseFloat(tripData.peso_ton) : null,
        volume_m3: tripData.volume_m3 ? parseFloat(tripData.volume_m3) : null,
        custo_extra: tripData.custo_extra ? parseFloat(tripData.custo_extra) : 0,
        custo_extra_descricao: tripData.custo_extra_descricao || null,
        observacoes: tripData.observacoes || null,
        user_id: user.id
      };
      
      const { data, error } = await supabase
        .from("trips")
        .insert([payload])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      // Calcular custos da viagem automaticamente
      try {
        await supabase.functions.invoke('recalcular-custos-viagem', {
          body: { viagemId: data.id }
        });
      } catch (error) {
        console.error('Erro ao calcular custos automaticamente:', error);
        // Não mostrar erro ao usuário, pois a viagem foi criada com sucesso
      }
      
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      resetForm();
      setIsDialogOpen(false);
      toast({
        title: "Viagem criada",
        description: "A viagem foi planejada com sucesso e os custos foram calculados.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar viagem",
        description: error.message || "Não foi possível planejar a viagem.",
        variant: "destructive",
      });
      console.error("Error creating trip:", error);
    },
  });

  // Mutation para atualizar viagem
  const updateTripMutation = useMutation({
    mutationFn: async ({ id, ...tripData }: { id: string } & typeof formData) => {
      const payload = {
        vehicle_id: tripData.vehicle_id,
        route_id: tripData.route_id,
        start_date: tripData.start_date,
        end_date: tripData.end_date,
        status: tripData.status,
        peso_ton: tripData.peso_ton ? parseFloat(tripData.peso_ton) : null,
        volume_m3: tripData.volume_m3 ? parseFloat(tripData.volume_m3) : null,
        custo_extra: tripData.custo_extra ? parseFloat(tripData.custo_extra) : 0,
        custo_extra_descricao: tripData.custo_extra_descricao || null,
        observacoes: tripData.observacoes || null,
      };

      const { data, error } = await supabase
        .from("trips")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      // Recalcular custos da viagem automaticamente após atualização
      try {
        await supabase.functions.invoke('recalcular-custos-viagem', {
          body: { viagemId: data.id }
        });
      } catch (error) {
        console.error('Erro ao recalcular custos automaticamente:', error);
      }
      
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      resetForm();
      setIsDialogOpen(false);
      toast({
        title: "Viagem atualizada",
        description: "A viagem foi atualizada com sucesso e os custos foram recalculados.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar viagem",
        description: error.message || "Não foi possível atualizar a viagem.",
        variant: "destructive",
      });
      console.error("Error updating trip:", error);
    },
  });

  // Mutation para deletar viagem
  const deleteTripMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("trips")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      toast({
        title: "Viagem excluída",
        description: "A viagem foi removida com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir viagem",
        description: "Não foi possível remover a viagem.",
        variant: "destructive",
      });
      console.error("Error deleting trip:", error);
    },
  });

  const resetForm = () => {
    setFormData({
      vehicle_id: "",
      route_id: "",
      start_date: "",
      end_date: "",
      status: "Planejada",
      peso_ton: "",
      volume_m3: "",
      custo_extra: "",
      custo_extra_descricao: "",
      observacoes: "",
    });
    setEditingTrip(null);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (trip: Trip) => {
    if (trip.status === 'Concluída') {
      toast({
        title: "Viagem concluída",
        description: "Viagens concluídas não podem ser editadas.",
        variant: "destructive",
      });
      return;
    }
    
    setEditingTrip(trip);
    setFormData({
      vehicle_id: trip.vehicle_id,
      route_id: trip.route_id,
      start_date: trip.start_date,
      end_date: trip.end_date,
      status: trip.status,
      peso_ton: trip.peso_ton?.toString() || "",
      volume_m3: trip.volume_m3?.toString() || "",
      custo_extra: (trip as any).custo_extra?.toString() || "",
      custo_extra_descricao: (trip as any).custo_extra_descricao || "",
      observacoes: trip.observacoes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vehicle_id || !formData.route_id || !formData.start_date || !formData.end_date) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      toast({
        title: "Datas inválidas",
        description: "A data de início deve ser anterior à data de término.",
        variant: "destructive",
      });
      return;
    }

    // Validar peso não negativo
    if (formData.peso_ton && parseFloat(formData.peso_ton) < 0) {
      toast({
        title: "Valor inválido",
        description: "O peso não pode ser negativo.",
        variant: "destructive",
      });
      return;
    }

    // Validar volume não negativo
    if (formData.volume_m3 && parseFloat(formData.volume_m3) < 0) {
      toast({
        title: "Valor inválido",
        description: "O volume não pode ser negativo.",
        variant: "destructive",
      });
      return;
    }

    // Validar capacidade de peso
    if (formData.peso_ton) {
      const peso = parseFloat(formData.peso_ton);
      const vehicle = vehicles.find(v => v.id === formData.vehicle_id);
      if (vehicle && peso > vehicle.capacidade_ton) {
        toast({
          title: "Peso excede capacidade",
          description: `O peso da carga (${peso}t) excede a capacidade do veículo (${vehicle.capacidade_ton}t).`,
          variant: "destructive",
        });
        return;
      }
    }

    // Validar custo extra não negativo
    if (formData.custo_extra && parseFloat(formData.custo_extra) < 0) {
      toast({
        title: "Valor inválido",
        description: "O custo extra não pode ser negativo.",
        variant: "destructive",
      });
      return;
    }

    if (editingTrip) {
      updateTripMutation.mutate({ id: editingTrip.id, ...formData });
    } else {
      createTripMutation.mutate(formData);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Planejada':
        return <Clock className="h-4 w-4" />;
      case 'Em_Andamento':
        return <PlayCircle className="h-4 w-4" />;
      case 'Concluída':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    return status;
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Planejada':
        return 'secondary' as const;
      case 'Em_Andamento':
        return 'default' as const;
      case 'Concluída':
        return 'outline' as const;
      default:
        return 'secondary' as const;
    }
  };

  const getVehicleName = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.tipo} (${vehicle.capacidade_ton}t)` : 'Veículo não encontrado';
  };

  const getRouteName = (routeId: string) => {
    const route = routes.find(r => r.id === routeId);
    return route ? `${route.origem} → ${route.destino}` : 'Rota não encontrada';
  };

  const exportToCSV = () => {
    if (trips.length === 0) {
      toast({
        title: "Nenhum dado",
        description: "Não há viagens para exportar.",
        variant: "destructive",
      });
      return;
    }

    const headers = ['Data Início', 'Data Fim', 'Veículo', 'Rota', 'Status', 'Peso (ton)', 'Volume (m³)', 'Observações'];
    const rows = trips.map(trip => [
      trip.start_date,
      trip.end_date,
      getVehicleName(trip.vehicle_id),
      getRouteName(trip.route_id),
      getStatusLabel(trip.status),
      trip.peso_ton || '',
      trip.volume_m3 || '',
      trip.observacoes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `viagens_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Exportado com sucesso",
      description: "Arquivo CSV baixado.",
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Planejamento de Viagens</h1>
          <p className="text-muted-foreground">
            Gerencie e planeje suas operações de transporte
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Viagem
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingTrip ? 'Editar Viagem' : 'Nova Viagem'}
              </DialogTitle>
              <DialogDescription>
                {editingTrip 
                  ? 'Edite as informações da viagem selecionada.'
                  : 'Preencha as informações para planejar uma nova viagem.'
                }
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Vehicle Selection */}
                <div className="space-y-2">
                  <Label htmlFor="vehicle_id">Veículo *</Label>
                  <Select 
                    value={formData.vehicle_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, vehicle_id: value }))}
                  >
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
                  <Label htmlFor="route_id">Rota *</Label>
                  <Select 
                    value={formData.route_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, route_id: value }))}
                  >
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
                            {route.origem} → {route.destino}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Start Date */}
                <div className="space-y-2">
                  <Label htmlFor="start_date">Data de Início *</Label>
                  <Input
                    type="date"
                    id="start_date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    required
                  />
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <Label htmlFor="end_date">Data de Término *</Label>
                  <Input
                    type="date"
                    id="end_date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {/* Weight */}
                <div className="space-y-2">
                  <Label htmlFor="peso_ton" className="flex items-center space-x-1">
                    <Weight className="h-4 w-4" />
                    <span>Peso (ton)</span>
                  </Label>
                  <Input
                    type="number"
                    id="peso_ton"
                    step="0.01"
                    min="0"
                    value={formData.peso_ton}
                    onChange={(e) => setFormData(prev => ({ ...prev, peso_ton: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>

                {/* Volume */}
                <div className="space-y-2">
                  <Label htmlFor="volume_m3" className="flex items-center space-x-1">
                    <Package className="h-4 w-4" />
                    <span>Volume (m³)</span>
                  </Label>
                  <Input
                    type="number"
                    id="volume_m3"
                    step="0.01"
                    min="0"
                    value={formData.volume_m3}
                    onChange={(e) => setFormData(prev => ({ ...prev, volume_m3: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>

                {/* Custo Extra */}
                <div className="space-y-2">
                  <Label htmlFor="custo_extra" className="flex items-center space-x-1">
                    <DollarSign className="h-4 w-4" />
                    <span>Custo Extra (R$)</span>
                  </Label>
                  <Input
                    type="number"
                    id="custo_extra"
                    step="0.01"
                    min="0"
                    value={formData.custo_extra}
                    onChange={(e) => setFormData(prev => ({ ...prev, custo_extra: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value: 'Planejada' | 'Em_Andamento' | 'Concluída') => 
                      setFormData(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Planejada">Planejada</SelectItem>
                      <SelectItem value="Em_Andamento">Em Andamento</SelectItem>
                      <SelectItem value="Concluída">Concluída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Extra Cost Description */}
              {formData.custo_extra && parseFloat(formData.custo_extra) > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="custo_extra_descricao">Descrição do Custo Extra</Label>
                  <Textarea
                    id="custo_extra_descricao"
                    value={formData.custo_extra_descricao}
                    onChange={(e) => setFormData(prev => ({ ...prev, custo_extra_descricao: e.target.value }))}
                    placeholder="Ex: Despesas de alimentação, hospedagem, taxa de urgência..."
                    rows={2}
                  />
                </div>
              )}

              {/* Observations */}
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Informações adicionais sobre a viagem..."
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingTrip ? 'Atualizar' : 'Criar'} Viagem
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Trips Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Viagens</CardTitle>
          <CardDescription>
            Gerencie todas as suas viagens planejadas, em andamento e concluídas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Veículo</TableHead>
                <TableHead>Rota</TableHead>
                <TableHead>Data Início</TableHead>
                <TableHead>Data Término</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Peso</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhuma viagem encontrada
                  </TableCell>
                </TableRow>
              ) : (
                trips.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span>{getVehicleName(trip.vehicle_id)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{getRouteName(trip.route_id)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(trip.start_date), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {format(new Date(trip.end_date), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(trip.status)} className="flex items-center space-x-1 w-fit">
                        {getStatusIcon(trip.status)}
                        <span>{getStatusLabel(trip.status)}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {trip.peso_ton ? `${trip.peso_ton}t` : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/viagens/${trip.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {trip.status !== 'Concluída' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(trip)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTripMutation.mutate(trip.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}