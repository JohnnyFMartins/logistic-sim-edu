import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, MapPin, Clock } from 'lucide-react';

const routeFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  origin: z.string().min(1, 'Origem é obrigatória'),
  destination: z.string().min(1, 'Destino é obrigatório'),
  distance: z.string().min(1, 'Distância é obrigatória').refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Distância deve ser um número positivo'),
  estimated_time: z.string().min(1, 'Tempo estimado é obrigatório').refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Tempo deve ser um número positivo'),
  status: z.enum(['active', 'inactive'])
});

type RouteFormData = z.infer<typeof routeFormSchema>;

interface Route {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distance: number;
  estimated_time: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<RouteFormData>({
    resolver: zodResolver(routeFormSchema),
    defaultValues: {
      name: '',
      origin: '',
      destination: '',
      distance: '',
      estimated_time: '',
      status: 'active'
    }
  });

  const fetchRoutes = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRoutes((data || []) as Route[]);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar rotas',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, [user]);

  const handleSubmit = async (data: RouteFormData) => {
    if (!user) return;

    try {
      const routeData = {
        name: data.name,
        origin: data.origin,
        destination: data.destination,
        distance: parseFloat(data.distance),
        estimated_time: parseInt(data.estimated_time),
        status: data.status,
        user_id: user.id
      };

      if (editingRoute) {
        const { error } = await supabase
          .from('routes')
          .update(routeData)
          .eq('id', editingRoute.id)
          .eq('user_id', user.id);

        if (error) throw error;

        toast({
          title: 'Rota atualizada!',
          description: 'A rota foi atualizada com sucesso.'
        });
      } else {
        const { error } = await supabase
          .from('routes')
          .insert(routeData);

        if (error) throw error;

        toast({
          title: 'Rota criada!',
          description: 'A nova rota foi criada com sucesso.'
        });
      }

      setIsDialogOpen(false);
      setEditingRoute(null);
      form.reset();
      fetchRoutes();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar rota',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (route: Route) => {
    setEditingRoute(route);
    form.setValue('name', route.name);
    form.setValue('origin', route.origin);
    form.setValue('destination', route.destination);
    form.setValue('distance', route.distance.toString());
    form.setValue('estimated_time', route.estimated_time.toString());
    form.setValue('status', route.status);
    setIsDialogOpen(true);
  };

  const handleDelete = async (routeId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('routes')
        .delete()
        .eq('id', routeId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Rota excluída!',
        description: 'A rota foi excluída com sucesso.'
      });

      fetchRoutes();
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir rota',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRoute(null);
    form.reset();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Rotas</h1>
          <p className="text-muted-foreground">Carregando rotas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Rotas</h1>
          <p className="text-muted-foreground">
            Gerencie as rotas de transporte da sua frota.
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Rota
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingRoute ? 'Editar Rota' : 'Nova Rota'}</DialogTitle>
              <DialogDescription>
                {editingRoute ? 'Edite as informações da rota.' : 'Adicione uma nova rota ao sistema.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Rota</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Rota Centro-Sul" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="origin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Origem</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Centro da cidade" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destino</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Zona Sul" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="distance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Distância (km)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="15.5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="estimated_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tempo (min)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="45" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Ativa</SelectItem>
                          <SelectItem value="inactive">Inativa</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingRoute ? 'Atualizar' : 'Criar'} Rota
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {routes.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Nenhuma rota cadastrada</h3>
            <p className="text-muted-foreground">Clique em "Nova Rota" para começar.</p>
          </div>
        ) : (
          routes.map((route) => (
            <Card key={route.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{route.name}</CardTitle>
                    <Badge variant={route.status === 'active' ? 'default' : 'secondary'}>
                      {route.status === 'active' ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(route)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir a rota "{route.name}"? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(route.id)}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">De:</span>
                    <span>{route.origin}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Para:</span>
                    <span>{route.destination}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{route.distance}</p>
                    <p className="text-xs text-muted-foreground">km</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="text-2xl font-bold text-primary">{route.estimated_time}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">min</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}