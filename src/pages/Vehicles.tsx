import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Truck, Plus, Edit, Trash2, Search, Filter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { veiculosApi, Veiculo, VeiculoInput } from "@/lib/api"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

const VehicleForm = ({ 
  formData, 
  setFormData, 
  onSubmit, 
  onCancel, 
  isEdit = false,
  isLoading = false
}: { 
  formData: { placa: string; modelo: string; tipoVeiculo: string; capacidadePeso: string; custoPorKm: string; status: string }
  setFormData: (data: any) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  isEdit?: boolean
  isLoading?: boolean
}) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="placa">Placa</Label>
        <Input
          id="placa"
          placeholder="ABC-1234"
          value={formData.placa}
          onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="modelo">Modelo</Label>
        <Input
          id="modelo"
          placeholder="Ex: Volvo FH"
          value={formData.modelo}
          onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
          required
        />
      </div>
    </div>

    <div className="space-y-2">
      <Label htmlFor="tipoVeiculo">Tipo de Veículo</Label>
      <Input
        id="tipoVeiculo"
        placeholder="Ex: Caminhão, Van, Carreta"
        value={formData.tipoVeiculo}
        onChange={(e) => setFormData({ ...formData, tipoVeiculo: e.target.value })}
        required
      />
    </div>
    
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="capacidadePeso">Capacidade (kg)</Label>
        <Input
          id="capacidadePeso"
          type="number"
          step="0.01"
          min="0"
          placeholder="40000"
          value={formData.capacidadePeso}
          onChange={(e) => setFormData({ ...formData, capacidadePeso: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="custoPorKm">Custo por Km (R$)</Label>
        <Input
          id="custoPorKm"
          type="number"
          step="0.01"
          min="0"
          placeholder="3.50"
          value={formData.custoPorKm}
          onChange={(e) => setFormData({ ...formData, custoPorKm: e.target.value })}
          required
        />
      </div>
    </div>

    <div className="space-y-2">
      <Label htmlFor="status">Status</Label>
      <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione o status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Disponível">Disponível</SelectItem>
          <SelectItem value="Em_Manutenção">Em Manutenção</SelectItem>
          <SelectItem value="Em_Uso">Em Uso</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <DialogFooter>
      <Button type="button" variant="secondary" onClick={onCancel}>
        Cancelar
      </Button>
      <Button type="submit" disabled={isLoading}>
        {isEdit ? 'Atualizar' : 'Cadastrar'} Veículo
      </Button>
    </DialogFooter>
  </form>
)

const Vehicles = () => {
  const [filteredVehicles, setFilteredVehicles] = useState<Veiculo[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Veiculo | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [formData, setFormData] = useState({
    placa: '',
    modelo: '',
    tipoVeiculo: '',
    capacidadePeso: '',
    custoPorKm: '',
    status: 'Disponível'
  })
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch vehicles
  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: veiculosApi.getAll,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: veiculosApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      resetForm()
      setIsDialogOpen(false)
      toast({ title: "Veículo cadastrado com sucesso!" })
    },
    onError: (error: any) => {
      toast({ title: "Erro ao cadastrar veículo", description: error.message, variant: "destructive" })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: VeiculoInput }) => veiculosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      resetForm()
      setIsEditDialogOpen(false)
      setEditingVehicle(null)
      toast({ title: "Veículo atualizado com sucesso!" })
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar veículo", description: error.message, variant: "destructive" })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: veiculosApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      toast({ title: "Veículo removido com sucesso!" })
    },
    onError: (error: any) => {
      toast({ title: "Erro ao remover veículo", description: error.message, variant: "destructive" })
    },
  })

  useEffect(() => {
    filterVehicles()
  }, [vehicles, searchTerm, statusFilter])

  const filterVehicles = () => {
    let filtered = vehicles

    if (searchTerm) {
      filtered = filtered.filter(vehicle =>
        vehicle.tipoVeiculo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.modelo.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter) {
      filtered = filtered.filter(vehicle => vehicle.status === statusFilter)
    }

    setFilteredVehicles(filtered)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const vehicleData: VeiculoInput = {
      placa: formData.placa,
      modelo: formData.modelo,
      tipoVeiculo: formData.tipoVeiculo,
      capacidadePeso: parseFloat(formData.capacidadePeso),
      custoPorKm: parseFloat(formData.custoPorKm),
      status: formData.status
    }

    createMutation.mutate(vehicleData)
  }

  const handleEdit = (vehicle: Veiculo) => {
    setEditingVehicle(vehicle)
    setFormData({
      placa: vehicle.placa,
      modelo: vehicle.modelo,
      tipoVeiculo: vehicle.tipoVeiculo,
      capacidadePeso: vehicle.capacidadePeso.toString(),
      custoPorKm: vehicle.custoPorKm.toString(),
      status: vehicle.status
    })
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingVehicle) return

    const vehicleData: VeiculoInput = {
      placa: formData.placa,
      modelo: formData.modelo,
      tipoVeiculo: formData.tipoVeiculo,
      capacidadePeso: parseFloat(formData.capacidadePeso),
      custoPorKm: parseFloat(formData.custoPorKm),
      status: formData.status
    }

    updateMutation.mutate({ id: editingVehicle.id, data: vehicleData })
  }

  const resetForm = () => {
    setFormData({
      placa: '',
      modelo: '',
      tipoVeiculo: '',
      capacidadePeso: '',
      custoPorKm: '',
      status: 'Disponível'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Disponível':
        return <Badge className="bg-success/20 text-success-foreground border-success/30">Disponível</Badge>
      case 'Em_Manutenção':
        return <Badge variant="destructive">Em Manutenção</Badge>
      case 'Em_Uso':
        return <Badge variant="secondary">Em Uso</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handleCancelForm = () => {
    resetForm()
    setIsDialogOpen(false)
    setIsEditDialogOpen(false)
    setEditingVehicle(null)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Truck className="h-8 w-8 text-primary" />
            Gestão de Veículos
          </h1>
          <p className="text-muted-foreground">Carregando veículos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between min-h-[80px]">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Truck className="h-8 w-8 text-primary" />
              Gestão de Veículos
            </h1>
            <p className="text-muted-foreground">
              Cadastre e gerencie a frota de veículos.
            </p>
          </div>
          
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Veículo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cadastrar Novo Veículo</DialogTitle>
                  <DialogDescription>
                    Preencha as informações do veículo para adicionar à frota.
                  </DialogDescription>
                </DialogHeader>
                <VehicleForm 
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

        {/* Search and filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por placa, modelo ou tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="Disponível">Disponível</SelectItem>
              <SelectItem value="Em_Manutenção">Em Manutenção</SelectItem>
              <SelectItem value="Em_Uso">Em Uso</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Vehicle list */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredVehicles.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Truck className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              {vehicles.length === 0 ? 'Nenhum veículo cadastrado' : 'Nenhum veículo encontrado'}
            </h3>
            <p className="text-muted-foreground">
              {vehicles.length === 0 
                ? 'Clique em "Novo Veículo" para começar.' 
                : 'Tente ajustar os filtros de busca.'
              }
            </p>
          </div>
        ) : (
          filteredVehicles.map((vehicle) => (
            <Card key={vehicle.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{vehicle.placa}</CardTitle>
                    <CardDescription>{vehicle.modelo}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(vehicle)}>
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
                            Tem certeza que deseja remover o veículo {vehicle.placa}?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(vehicle.id)}>
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span>{vehicle.tipoVeiculo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Capacidade:</span>
                    <span>{vehicle.capacidadePeso.toLocaleString('pt-BR')} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Custo/Km:</span>
                    <span>R$ {vehicle.custoPorKm.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status:</span>
                    {getStatusBadge(vehicle.status)}
                  </div>
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
            <DialogTitle>Editar Veículo</DialogTitle>
            <DialogDescription>
              Atualize as informações do veículo.
            </DialogDescription>
          </DialogHeader>
          <VehicleForm 
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

export default Vehicles
