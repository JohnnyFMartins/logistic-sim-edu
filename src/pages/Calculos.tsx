import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { RoleProtectedRoute } from '@/components/RoleProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Vehicle {
  id: string;
  tipo: string;
  custo_por_km: number;
}

interface Route {
  id: string;
  origem: string;
  destino: string;
  distancia_km: number;
}

interface Calculo {
  id: string;
  veiculo_id: string;
  rota_id: string;
  distancia_km: number;
  custo_por_km: number;
  entregas_na_rota: number;
  custo_total: number;
  custo_por_entrega: number;
  vehicles?: Vehicle;
  routes?: Route;
}

export default function Calculos() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [calculos, setCalculos] = useState<Calculo[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCalculo, setEditingCalculo] = useState<Calculo | null>(null);
  const [formData, setFormData] = useState({
    veiculo_id: '',
    rota_id: '',
    entregas_na_rota: 1
  });

  useEffect(() => {
    fetchCalculos();
    fetchVehicles();
    fetchRoutes();
  }, [user]);

  const fetchCalculos = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('calculos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar cálculos",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Fetch related data separately
    if (data && data.length > 0) {
      const vehicleIds = [...new Set(data.map(c => c.veiculo_id))];
      const routeIds = [...new Set(data.map(c => c.rota_id))];

      const [vehiclesResult, routesResult] = await Promise.all([
        supabase.from('vehicles').select('id, tipo, custo_por_km').in('id', vehicleIds),
        supabase.from('routes').select('id, origem, destino, distancia_km').in('id', routeIds)
      ]);

      const vehiclesMap = new Map(vehiclesResult.data?.map(v => [v.id, v]) || []);
      const routesMap = new Map(routesResult.data?.map(r => [r.id, r]) || []);

      const calculosWithRelations = data.map(calculo => ({
        ...calculo,
        vehicles: vehiclesMap.get(calculo.veiculo_id),
        routes: routesMap.get(calculo.rota_id)
      }));

      setCalculos(calculosWithRelations);
    } else {
      setCalculos([]);
    }
    
    setLoading(false);
  };

  const fetchVehicles = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('vehicles')
      .select('id, tipo, custo_por_km')
      .eq('user_id', user.id)
      .eq('status', 'Disponível');

    if (error) {
      console.error('Error fetching vehicles:', error);
      return;
    }

    setVehicles(data || []);
  };

  const fetchRoutes = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('routes')
      .select('id, origem, destino, distancia_km')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching routes:', error);
      return;
    }

    setRoutes(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const calculoData = {
      user_id: user.id,
      veiculo_id: formData.veiculo_id,
      rota_id: formData.rota_id,
      entregas_na_rota: formData.entregas_na_rota
    };

    if (editingCalculo) {
      const { error } = await supabase
        .from('calculos')
        .update(calculoData)
        .eq('id', editingCalculo.id);

      if (error) {
        toast({
          title: "Erro ao atualizar cálculo",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Cálculo atualizado com sucesso!",
      });
    } else {
      const { error } = await supabase
        .from('calculos')
        .insert([calculoData]);

      if (error) {
        toast({
          title: "Erro ao criar cálculo",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Cálculo criado com sucesso!",
      });
    }

    setIsDialogOpen(false);
    setEditingCalculo(null);
    setFormData({
      veiculo_id: '',
      rota_id: '',
      entregas_na_rota: 1
    });
    fetchCalculos();
  };

  const handleEdit = (calculo: Calculo) => {
    setEditingCalculo(calculo);
    setFormData({
      veiculo_id: calculo.veiculo_id,
      rota_id: calculo.rota_id,
      entregas_na_rota: calculo.entregas_na_rota
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('calculos')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro ao excluir cálculo",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Cálculo excluído com sucesso!",
    });
    fetchCalculos();
  };

  const openNewCalculoDialog = () => {
    setEditingCalculo(null);
    setFormData({
      veiculo_id: '',
      rota_id: '',
      entregas_na_rota: 1
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cálculos de Custos</h1>
          <p className="text-muted-foreground">
            Calcule custos de transporte relacionando veículos e rotas
          </p>
        </div>

        <RoleProtectedRoute requiredPermission={{ action: 'create', entity: 'calculos' }}>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewCalculoDialog}>
                <Calculator className="mr-2 h-4 w-4" />
                Calcular
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingCalculo ? 'Editar Cálculo' : 'Novo Cálculo'}
                </DialogTitle>
                <DialogDescription>
                  {editingCalculo ? 'Edite os dados do cálculo.' : 'Crie um novo cálculo de custos.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="veiculo_id">Veículo</Label>
                  <Select
                    value={formData.veiculo_id}
                    onValueChange={(value) => setFormData({ ...formData, veiculo_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um veículo" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.tipo} - R$ {vehicle.custo_por_km}/km
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rota_id">Rota</Label>
                  <Select
                    value={formData.rota_id}
                    onValueChange={(value) => setFormData({ ...formData, rota_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma rota" />
                    </SelectTrigger>
                    <SelectContent>
                      {routes.map((route) => (
                        <SelectItem key={route.id} value={route.id}>
                          {route.origem} → {route.destino} ({route.distancia_km}km)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entregas_na_rota">Entregas na Rota</Label>
                  <Input
                    id="entregas_na_rota"
                    type="number"
                    min="1"
                    value={formData.entregas_na_rota}
                    onChange={(e) => setFormData({ ...formData, entregas_na_rota: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  {editingCalculo ? 'Atualizar' : 'Calcular'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </RoleProtectedRoute>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cálculos Realizados</CardTitle>
          <CardDescription>
            Lista de todos os cálculos de custos realizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {calculos.length === 0 ? (
            <div className="text-center py-8">
              <Calculator className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhum cálculo encontrado</h3>
              <p className="text-muted-foreground">
                Comece criando seu primeiro cálculo de custos.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Rota</TableHead>
                  <TableHead>Distância</TableHead>
                  <TableHead>Custo/km</TableHead>
                  <TableHead>Entregas</TableHead>
                  <TableHead>Custo Total</TableHead>
                  <TableHead>Custo/Entrega</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculos.map((calculo) => (
                  <TableRow key={calculo.id}>
                    <TableCell>
                      {calculo.vehicles?.tipo || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {calculo.routes ? `${calculo.routes.origem} → ${calculo.routes.destino}` : 'N/A'}
                    </TableCell>
                    <TableCell>{calculo.distancia_km}km</TableCell>
                    <TableCell>R$ {calculo.custo_por_km.toFixed(2)}</TableCell>
                    <TableCell>{calculo.entregas_na_rota}</TableCell>
                    <TableCell>R$ {calculo.custo_total.toFixed(2)}</TableCell>
                    <TableCell>R$ {calculo.custo_por_entrega.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <RoleProtectedRoute requiredPermission={{ action: 'update', entity: 'calculos' }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(calculo)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </RoleProtectedRoute>
                        <RoleProtectedRoute requiredPermission={{ action: 'delete', entity: 'calculos' }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(calculo.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </RoleProtectedRoute>
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