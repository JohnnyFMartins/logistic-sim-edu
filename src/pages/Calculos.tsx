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
import { Plus, Edit, Trash2, Calculator, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Vehicle {
  id: string;
  tipo: string;
  custo_por_km: number;
  km_por_litro: number;
}

interface Route {
  id: string;
  origem: string;
  destino: string;
  distancia_km: number;
}

interface ParametrosGlobais {
  preco_diesel_litro: number;
  velocidade_media_kmh: number;
}

interface CustoFixo {
  id: string;
  nome: string;
  valor_mensal: number;
}

interface CustoVariavel {
  id: string;
  nome: string;
  valor_por_km: number;
}

interface Pedagio {
  id: string;
  descricao: string;
  valor: number;
}

interface Calculo {
  id: string;
  veiculo_id: string;
  rota_id: string;
  nome_cenario?: string;
  distancia_km: number;
  custo_por_km: number;
  entregas_na_rota: number;
  consumo_combustivel_l: number;
  custo_combustivel: number;
  custo_variaveis: number;
  custo_pedagios: number;
  custo_fixo_rateado: number;
  tempo_estimado_h: number;
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
  const [parametrosGlobais, setParametrosGlobais] = useState<ParametrosGlobais | null>(null);
  const [custosFixos, setCustosFixos] = useState<CustoFixo[]>([]);
  const [custosVariaveis, setCustosVariaveis] = useState<CustoVariavel[]>([]);
  const [pedagiosRota, setPedagiosRota] = useState<Pedagio[]>([]);
  const [formData, setFormData] = useState({
    veiculo_id: '',
    rota_id: '',
    nome_cenario: '',
    entregas_na_rota: 1
  });

  useEffect(() => {
    fetchCalculos();
    fetchVehicles();
    fetchRoutes();
    fetchParametrosGlobais();
    fetchCustosFixos();
    fetchCustosVariaveis();
  }, [user]);

  useEffect(() => {
    if (formData.rota_id) {
      fetchPedagiosRota(formData.rota_id);
    }
  }, [formData.rota_id]);

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
        supabase.from('vehicles').select('id, tipo, custo_por_km, km_por_litro').in('id', vehicleIds),
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
      .select('id, tipo, custo_por_km, km_por_litro')
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

  const fetchParametrosGlobais = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('parametros_globais')
      .select('preco_diesel_litro, velocidade_media_kmh')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching parametros globais:', error);
      return;
    }

    setParametrosGlobais(data);
  };

  const fetchCustosFixos = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('custos_fixos')
      .select('id, nome, valor_mensal')
      .eq('user_id', user.id)
      .eq('ativo', true);

    if (error) {
      console.error('Error fetching custos fixos:', error);
      return;
    }

    setCustosFixos(data || []);
  };

  const fetchCustosVariaveis = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('custos_variaveis')
      .select('id, nome, valor_por_km')
      .eq('user_id', user.id)
      .eq('ativo', true);

    if (error) {
      console.error('Error fetching custos variaveis:', error);
      return;
    }

    setCustosVariaveis(data || []);
  };

  const fetchPedagiosRota = async (rotaId: string) => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('pedagios')
      .select('id, descricao, valor')
      .eq('user_id', user.id)
      .eq('rota_id', rotaId);

    if (error) {
      console.error('Error fetching pedagios:', error);
      return;
    }

    setPedagiosRota(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !parametrosGlobais) return;

    // Get vehicle and route data
    const vehicle = vehicles.find(v => v.id === formData.veiculo_id);
    const route = routes.find(r => r.id === formData.rota_id);

    if (!vehicle || !route) {
      toast({
        title: "Erro",
        description: "Veículo ou rota não encontrados",
        variant: "destructive",
      });
      return;
    }

    // Calculate detailed costs
    const distanciaKm = route.distancia_km;
    const consumoCombustivelL = distanciaKm / vehicle.km_por_litro;
    const custoCombustivel = consumoCombustivelL * parametrosGlobais.preco_diesel_litro;
    
    // Sum all variable costs
    const custoVariaveis = custosVariaveis.reduce((acc, cv) => acc + (cv.valor_por_km * distanciaKm), 0);
    
    // Sum all tolls for this route
    const custoPedagios = pedagiosRota.reduce((acc, p) => acc + p.valor, 0);
    
    // Calculate prorated fixed costs (monthly costs / 30 days)
    const custoFixoRateado = custosFixos.reduce((acc, cf) => acc + (cf.valor_mensal / 30), 0);
    
    // Calculate estimated time
    const tempoEstimadoH = distanciaKm / parametrosGlobais.velocidade_media_kmh;
    
    // Calculate total cost
    const custoTotal = custoCombustivel + custoVariaveis + custoPedagios + custoFixoRateado;
    const custoPorEntrega = custoTotal / formData.entregas_na_rota;

    const calculoData = {
      user_id: user.id,
      veiculo_id: formData.veiculo_id,
      rota_id: formData.rota_id,
      nome_cenario: formData.nome_cenario || null,
      entregas_na_rota: formData.entregas_na_rota,
      distancia_km: distanciaKm,
      custo_por_km: vehicle.custo_por_km,
      consumo_combustivel_l: consumoCombustivelL,
      custo_combustivel: custoCombustivel,
      custo_variaveis: custoVariaveis,
      custo_pedagios: custoPedagios,
      custo_fixo_rateado: custoFixoRateado,
      tempo_estimado_h: tempoEstimadoH,
      custo_total: custoTotal,
      custo_por_entrega: custoPorEntrega
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
      nome_cenario: '',
      entregas_na_rota: 1
    });
    fetchCalculos();
  };

  const handleEdit = (calculo: Calculo) => {
    setEditingCalculo(calculo);
    setFormData({
      veiculo_id: calculo.veiculo_id,
      rota_id: calculo.rota_id,
      nome_cenario: calculo.nome_cenario || '',
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
      nome_cenario: '',
      entregas_na_rota: 1
    });
    setIsDialogOpen(true);
  };

  const exportToCSV = () => {
    if (calculos.length === 0) {
      toast({
        title: "Nenhum dado",
        description: "Não há cálculos para exportar.",
        variant: "destructive",
      });
      return;
    }

    const headers = ['Cenário', 'Veículo', 'Rota', 'Distância (km)', 'Combustível (L)', 'Custo Combustível', 'Custos Variáveis', 'Pedágios', 'Custo Fixo Rateado', 'Tempo (h)', 'Custo Total', 'Custo/Entrega'];
    const rows = calculos.map(calculo => [
      calculo.nome_cenario || 'Sem nome',
      calculo.vehicles?.tipo || 'N/A',
      calculo.routes ? `${calculo.routes.origem} → ${calculo.routes.destino}` : 'N/A',
      calculo.distancia_km,
      calculo.consumo_combustivel_l.toFixed(2),
      calculo.custo_combustivel.toFixed(2),
      calculo.custo_variaveis.toFixed(2),
      calculo.custo_pedagios.toFixed(2),
      calculo.custo_fixo_rateado.toFixed(2),
      calculo.tempo_estimado_h.toFixed(2),
      calculo.custo_total.toFixed(2),
      calculo.custo_por_entrega.toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `calculos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Exportado com sucesso",
      description: "Arquivo CSV baixado.",
    });
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

        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
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
                    <Label htmlFor="nome_cenario">Nome do Cenário (Opcional)</Label>
                    <Input
                      id="nome_cenario"
                      type="text"
                      placeholder="Ex: Cenário Base, Cenário Otimizado..."
                      value={formData.nome_cenario}
                      onChange={(e) => setFormData({ ...formData, nome_cenario: e.target.value })}
                    />
                  </div>

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
                            {vehicle.tipo} ({vehicle.km_por_litro} km/L)
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

                  {pedagiosRota.length > 0 && (
                    <div className="space-y-2 p-3 bg-muted rounded-md">
                      <Label className="text-sm font-medium">Pedágios nesta rota:</Label>
                      {pedagiosRota.map(p => (
                        <div key={p.id} className="text-sm flex justify-between">
                          <span>{p.descricao}</span>
                          <span className="font-medium">R$ {p.valor.toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="text-sm font-bold flex justify-between border-t pt-2">
                        <span>Total Pedágios:</span>
                        <span>R$ {pedagiosRota.reduce((acc, p) => acc + p.valor, 0).toFixed(2)}</span>
                      </div>
                    </div>
                  )}

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

                  {parametrosGlobais && (
                    <div className="space-y-1 p-3 bg-muted rounded-md text-sm">
                      <div className="flex justify-between">
                        <span>Preço Diesel:</span>
                        <span className="font-medium">R$ {parametrosGlobais.preco_diesel_litro.toFixed(2)}/L</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Velocidade Média:</span>
                        <span className="font-medium">{parametrosGlobais.velocidade_media_kmh} km/h</span>
                      </div>
                      {custosVariaveis.length > 0 && (
                        <div className="flex justify-between">
                          <span>Custos Variáveis:</span>
                          <span className="font-medium">{custosVariaveis.length} cadastrados</span>
                        </div>
                      )}
                      {custosFixos.length > 0 && (
                        <div className="flex justify-between">
                          <span>Custos Fixos:</span>
                          <span className="font-medium">{custosFixos.length} cadastrados</span>
                        </div>
                      )}
                    </div>
                  )}

                  <Button type="submit" className="w-full">
                    {editingCalculo ? 'Atualizar' : 'Calcular'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </RoleProtectedRoute>
        </div>
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cenário</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Rota</TableHead>
                    <TableHead>Distância</TableHead>
                    <TableHead>Combustível</TableHead>
                    <TableHead>Custo Comb.</TableHead>
                    <TableHead>C. Variáveis</TableHead>
                    <TableHead>Pedágios</TableHead>
                    <TableHead>C. Fixo Rat.</TableHead>
                    <TableHead>Tempo</TableHead>
                    <TableHead>Entregas</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Por Entrega</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculos.map((calculo) => (
                    <TableRow key={calculo.id}>
                      <TableCell className="font-medium">
                        {calculo.nome_cenario || <span className="text-muted-foreground">Sem nome</span>}
                      </TableCell>
                      <TableCell>
                        {calculo.vehicles?.tipo || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {calculo.routes ? `${calculo.routes.origem} → ${calculo.routes.destino}` : 'N/A'}
                      </TableCell>
                      <TableCell>{calculo.distancia_km.toFixed(0)}km</TableCell>
                      <TableCell>{calculo.consumo_combustivel_l.toFixed(1)}L</TableCell>
                      <TableCell>R$ {calculo.custo_combustivel.toFixed(2)}</TableCell>
                      <TableCell>R$ {calculo.custo_variaveis.toFixed(2)}</TableCell>
                      <TableCell>R$ {calculo.custo_pedagios.toFixed(2)}</TableCell>
                      <TableCell>R$ {calculo.custo_fixo_rateado.toFixed(2)}</TableCell>
                      <TableCell>{calculo.tempo_estimado_h.toFixed(1)}h</TableCell>
                      <TableCell>{calculo.entregas_na_rota}</TableCell>
                      <TableCell className="font-bold">R$ {calculo.custo_total.toFixed(2)}</TableCell>
                      <TableCell className="font-medium">R$ {calculo.custo_por_entrega.toFixed(2)}</TableCell>
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}