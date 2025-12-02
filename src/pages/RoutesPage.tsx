import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { Plus, Edit, Trash2, MapPin, Clock, Search, Route } from 'lucide-react'
import { rotasApi, Rota, RotaInput } from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const RouteForm = ({ 
  formData, 
  setFormData, 
  onSubmit, 
  onCancel,
  isEdit = false,
  isLoading = false
}: { 
  formData: { origem: string; destino: string; distancia: string; tempoEstimadoHoras: string; valorPedagios: string }
  setFormData: (data: any) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  isEdit?: boolean
  isLoading?: boolean
}) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="origem">Origem</Label>
      <Input
        id="origem"
        placeholder="Ex: São Paulo"
        value={formData.origem}
        onChange={(e) => setFormData({ ...formData, origem: e.target.value })}
        required
      />
    </div>
    
    <div className="space-y-2">
      <Label htmlFor="destino">Destino</Label>
      <Input
        id="destino"
        placeholder="Ex: Rio de Janeiro"
        value={formData.destino}
        onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
        required
      />
    </div>
    
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="distancia">Distância (km)</Label>
        <Input
          id="distancia"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="430"
          value={formData.distancia}
          onChange={(e) => setFormData({ ...formData, distancia: e.target.value })}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="tempoEstimadoHoras">Tempo estimado (horas)</Label>
        <Input
          id="tempoEstimadoHoras"
          type="number"
          step="0.5"
          min="0.5"
          placeholder="5"
          value={formData.tempoEstimadoHoras}
          onChange={(e) => setFormData({ ...formData, tempoEstimadoHoras: e.target.value })}
          required
        />
      </div>
    </div>

    <div className="space-y-2">
      <Label htmlFor="valorPedagios">Valor dos Pedágios (R$)</Label>
      <Input
        id="valorPedagios"
        type="number"
        step="0.01"
        min="0"
        placeholder="150.00"
        value={formData.valorPedagios}
        onChange={(e) => setFormData({ ...formData, valorPedagios: e.target.value })}
      />
    </div>
    
    <DialogFooter>
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancelar
      </Button>
      <Button type="submit" disabled={isLoading}>
        {isEdit ? 'Atualizar' : 'Criar'} Rota
      </Button>
    </DialogFooter>
  </form>
)

export default function RoutesPage() {
  const [filteredRoutes, setFilteredRoutes] = useState<Rota[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingRoute, setEditingRoute] = useState<Rota | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    origem: '',
    destino: '',
    distancia: '',
    tempoEstimadoHoras: '',
    valorPedagios: '0'
  })
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch routes
  const { data: routes = [], isLoading } = useQuery({
    queryKey: ['routes'],
    queryFn: rotasApi.getAll,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: rotasApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] })
      resetForm()
      setIsDialogOpen(false)
      toast({ title: 'Rota criada com sucesso!' })
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao criar rota', description: error.message, variant: 'destructive' })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: RotaInput }) => rotasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] })
      resetForm()
      setIsEditDialogOpen(false)
      setEditingRoute(null)
      toast({ title: 'Rota atualizada com sucesso!' })
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar rota', description: error.message, variant: 'destructive' })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: rotasApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] })
      toast({ title: 'Rota excluída com sucesso!' })
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao excluir rota', description: error.message, variant: 'destructive' })
    },
  })

  useEffect(() => {
    filterRoutes()
  }, [routes, searchTerm])

  const filterRoutes = () => {
    let filtered = routes

    if (searchTerm) {
      filtered = filtered.filter(route =>
        route.origem.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.destino.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredRoutes(filtered)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const routeData: RotaInput = {
      origem: formData.origem,
      destino: formData.destino,
      distancia: parseFloat(formData.distancia),
      tempoEstimadoHoras: parseInt(formData.tempoEstimadoHoras),
      valorPedagios: parseFloat(formData.valorPedagios) || 0
    }

    createMutation.mutate(routeData)
  }

  const handleEdit = (route: Rota) => {
    setEditingRoute(route)
    setFormData({
      origem: route.origem,
      destino: route.destino,
      distancia: route.distancia.toString(),
      tempoEstimadoHoras: route.tempoEstimadoHoras.toString(),
      valorPedagios: (route.valorPedagios || 0).toString()
    })
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRoute) return

    const routeData: RotaInput = {
      origem: formData.origem,
      destino: formData.destino,
      distancia: parseFloat(formData.distancia),
      tempoEstimadoHoras: parseInt(formData.tempoEstimadoHoras),
      valorPedagios: parseFloat(formData.valorPedagios) || 0
    }

    updateMutation.mutate({ id: editingRoute.id, data: routeData })
  }

  const resetForm = () => {
    setFormData({
      origem: '',
      destino: '',
      distancia: '',
      tempoEstimadoHoras: '',
      valorPedagios: '0'
    })
  }

  const handleCancelForm = () => {
    resetForm()
    setIsDialogOpen(false)
    setIsEditDialogOpen(false)
    setEditingRoute(null)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Route className="h-8 w-8 text-primary" />
            Gestão de Rotas
          </h1>
          <p className="text-muted-foreground">Carregando rotas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center min-h-[80px]">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Route className="h-8 w-8 text-primary" />
              Gestão de Rotas
            </h1>
            <p className="text-muted-foreground">
              Gerencie as rotas de transporte.
            </p>
          </div>
          
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Rota
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Rota</DialogTitle>
                  <DialogDescription>
                    Adicione uma nova rota ao sistema.
                  </DialogDescription>
                </DialogHeader>
                <RouteForm 
                  formData={formData}
                  setFormData={setFormData}
                  onSubmit={handleSubmit}
                  onCancel={handleCancelForm}
                  isLoading={createMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por origem ou destino..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Route list */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredRoutes.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              {routes.length === 0 ? 'Nenhuma rota cadastrada' : 'Nenhuma rota encontrada'}
            </h3>
            <p className="text-muted-foreground">
              {routes.length === 0 
                ? 'Clique em "Nova Rota" para começar.' 
                : 'Tente ajustar o termo de busca.'
              }
            </p>
          </div>
        ) : (
          filteredRoutes.map((route) => (
            <Card key={route.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">
                    {route.origem} → {route.destino}
                  </CardTitle>
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
                            Deseja realmente excluir a rota {route.origem} → {route.destino}?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(route.id)}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{route.distancia} km</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{route.tempoEstimadoHoras} horas</span>
                  </div>
                  {route.valorPedagios && route.valorPedagios > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Pedágios:</span>
                      <span>R$ {route.valorPedagios.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Rota</DialogTitle>
            <DialogDescription>
              Atualize as informações da rota.
            </DialogDescription>
          </DialogHeader>
          <RouteForm 
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleEditSubmit}
            onCancel={handleCancelForm}
            isEdit
            isLoading={updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
