import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  PlayCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Trip {
  id: string;
  user_id: string;
  vehicle_id: string;
  route_id: string;
  start_date: string;
  end_date: string;
  status: 'planned' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

interface Vehicle {
  id: string;
  model: string;
  vehicle_type: string;
  plate: string;
}

interface Route {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distance: number;
  estimated_time: number;
}

export default function TripPlanning() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const [formData, setFormData] = useState<{
    vehicle_id: string;
    route_id: string;
    start_date: string;
    end_date: string;
    status: 'planned' | 'in_progress' | 'completed';
  }>({
    vehicle_id: "",
    route_id: "",
    start_date: "",
    end_date: "",
    status: "planned",
  });

  // Fetch trips
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

  // Fetch vehicles for dropdown
  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, model, vehicle_type, plate")
        .eq("user_id", user.id)
        .eq("status", "available")
        .order("model");
      
      if (error) throw error;
      return data as Vehicle[];
    },
    enabled: !!user?.id,
  });

  // Fetch routes for dropdown
  const { data: routes = [] } = useQuery({
    queryKey: ["routes"],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("routes")
        .select("id, name, origin, destination, distance, estimated_time")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("name");
      
      if (error) throw error;
      return data as Route[];
    },
    enabled: !!user?.id,
  });

  // Create trip mutation
  const createTripMutation = useMutation({
    mutationFn: async (tripData: typeof formData) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from("trips")
        .insert([{ ...tripData, user_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      resetForm();
      setIsDialogOpen(false);
      toast({
        title: "Viagem criada",
        description: "A viagem foi planejada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar viagem",
        description: "Não foi possível planejar a viagem.",
        variant: "destructive",
      });
      console.error("Error creating trip:", error);
    },
  });

  // Update trip mutation
  const updateTripMutation = useMutation({
    mutationFn: async ({ id, ...tripData }: { id: string } & typeof formData) => {
      const { data, error } = await supabase
        .from("trips")
        .update(tripData)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      resetForm();
      setIsDialogOpen(false);
      toast({
        title: "Viagem atualizada",
        description: "A viagem foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar viagem",
        description: "Não foi possível atualizar a viagem.",
        variant: "destructive",
      });
      console.error("Error updating trip:", error);
    },
  });

  // Delete trip mutation
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
    onError: (error) => {
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
      status: "planned",
    });
    setEditingTrip(null);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (trip: Trip) => {
    setEditingTrip(trip);
    setFormData({
      vehicle_id: trip.vehicle_id,
      route_id: trip.route_id,
      start_date: trip.start_date,
      end_date: trip.end_date,
      status: trip.status,
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

    if (editingTrip) {
      updateTripMutation.mutate({ id: editingTrip.id, ...formData });
    } else {
      createTripMutation.mutate(formData);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planned':
        return <Clock className="h-4 w-4" />;
      case 'in_progress':
        return <PlayCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planned':
        return 'Planejada';
      case 'in_progress':
        return 'Em Andamento';
      case 'completed':
        return 'Concluída';
      default:
        return 'Desconhecido';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'planned':
        return 'secondary' as const;
      case 'in_progress':
        return 'default' as const;
      case 'completed':
        return 'outline' as const;
      default:
        return 'secondary' as const;
    }
  };

  const getVehicleName = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.vehicle_type} ${vehicle.model} - ${vehicle.plate}` : 'Veículo não encontrado';
  };

  const getRouteName = (routeId: string) => {
    const route = routes.find(r => r.id === routeId);
    return route ? route.name : 'Rota não encontrada';
  };

  if (isLoading) {
    return <div>Carregando...</div>;
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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Viagem
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
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
                          {vehicle.vehicle_type} {vehicle.model} - {vehicle.plate}
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
                          {route.name} ({route.distance} km - {(route.estimated_time / 60).toFixed(1)}h)
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

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

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: 'planned' | 'in_progress' | 'completed') => 
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planejada</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                  </SelectContent>
                </Select>
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

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Viagens</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trips.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planejadas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trips.filter(trip => trip.status === 'planned').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trips.filter(trip => trip.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trips.filter(trip => trip.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trips Table */}
      <Card>
        <CardHeader>
          <CardTitle>Viagens Planejadas</CardTitle>
          <CardDescription>
            Lista de todas as viagens planejadas e em execução
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trips.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Nenhuma viagem planejada</h3>
              <p className="text-muted-foreground mt-2">
                Comece planejando sua primeira viagem clicando em "Nova Viagem"
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID da Viagem</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Rota</TableHead>
                  <TableHead>Data de Início</TableHead>
                  <TableHead>Data de Término</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trips.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell className="font-mono text-sm">
                      {trip.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        {getVehicleName(trip.vehicle_id)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {getRouteName(trip.route_id)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(trip.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {format(new Date(trip.end_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(trip.status)} className="flex items-center gap-1 w-fit">
                        {getStatusIcon(trip.status)}
                        {getStatusLabel(trip.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(trip)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTripMutation.mutate(trip.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}