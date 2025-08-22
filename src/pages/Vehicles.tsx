import { useState } from "react"
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
import { Truck, Plus, Edit, Trash2, Fuel, Weight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Vehicle {
  id: string
  plate: string
  model: string
  year: number
  consumption: number // km/l
  capacity: number // kg
  maintenanceCost: number // R$/km
  status: 'active' | 'maintenance' | 'inactive'
}

const mockVehicles: Vehicle[] = [
  {
    id: '1',
    plate: 'ABC-1234',
    model: 'Volvo FH-460',
    year: 2020,
    consumption: 3.2,
    capacity: 40000,
    maintenanceCost: 0.85,
    status: 'active'
  },
  {
    id: '2',
    plate: 'DEF-5678',
    model: 'Scania R450',
    year: 2019,
    consumption: 3.0,
    capacity: 35000,
    maintenanceCost: 0.92,
    status: 'active'
  },
  {
    id: '3',
    plate: 'GHI-9012',
    model: 'Mercedes Actros',
    year: 2021,
    consumption: 3.4,
    capacity: 42000,
    maintenanceCost: 0.78,
    status: 'maintenance'
  }
]

const Vehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [formData, setFormData] = useState({
    plate: '',
    model: '',
    year: '',
    consumption: '',
    capacity: '',
    maintenanceCost: ''
  })
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newVehicle: Vehicle = {
      id: Date.now().toString(),
      plate: formData.plate,
      model: formData.model,
      year: parseInt(formData.year),
      consumption: parseFloat(formData.consumption),
      capacity: parseInt(formData.capacity),
      maintenanceCost: parseFloat(formData.maintenanceCost),
      status: 'active'
    }
    setVehicles([...vehicles, newVehicle])
    setFormData({
      plate: '',
      model: '',
      year: '',
      consumption: '',
      capacity: '',
      maintenanceCost: ''
    })
    setIsDialogOpen(false)
    toast({
      title: "Veículo cadastrado",
      description: "O veículo foi adicionado com sucesso à frota.",
    })
  }

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setFormData({
      plate: vehicle.plate,
      model: vehicle.model,
      year: vehicle.year.toString(),
      consumption: vehicle.consumption.toString(),
      capacity: vehicle.capacity.toString(),
      maintenanceCost: vehicle.maintenanceCost.toString()
    })
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingVehicle) return
    
    const updatedVehicle: Vehicle = {
      ...editingVehicle,
      plate: formData.plate,
      model: formData.model,
      year: parseInt(formData.year),
      consumption: parseFloat(formData.consumption),
      capacity: parseInt(formData.capacity),
      maintenanceCost: parseFloat(formData.maintenanceCost)
    }
    
    setVehicles(vehicles.map(v => v.id === editingVehicle.id ? updatedVehicle : v))
    setFormData({
      plate: '',
      model: '',
      year: '',
      consumption: '',
      capacity: '',
      maintenanceCost: ''
    })
    setIsEditDialogOpen(false)
    setEditingVehicle(null)
    toast({
      title: "Veículo atualizado",
      description: "As informações do veículo foram atualizadas com sucesso.",
    })
  }

  const handleDelete = (vehicleId: string) => {
    setVehicles(vehicles.filter(v => v.id !== vehicleId))
    toast({
      title: "Veículo removido",
      description: "O veículo foi removido da frota.",
      variant: "destructive",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-success text-success-foreground">Ativo</Badge>
      case 'maintenance':
        return <Badge variant="destructive">Manutenção</Badge>
      case 'inactive':
        return <Badge variant="secondary">Inativo</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Truck className="h-8 w-8 text-primary" />
            Gestão de Veículos
          </h1>
          <p className="text-muted-foreground">
            Cadastre e gerencie a frota de veículos para suas simulações de transporte.
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Veículo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Veículo</DialogTitle>
              <DialogDescription>
                Preencha as informações do veículo para adicionar à frota.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plate">Placa</Label>
                  <Input
                    id="plate"
                    placeholder="ABC-1234"
                    value={formData.plate}
                    onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Ano</Label>
                  <Input
                    id="year"
                    type="number"
                    min="1990"
                    max="2024"
                    placeholder="2020"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Modelo</Label>
                <Input
                  id="model"
                  placeholder="Volvo FH-460"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="consumption">Consumo (km/l)</Label>
                  <Input
                    id="consumption"
                    type="number"
                    step="0.1"
                    min="1"
                    placeholder="3.2"
                    value={formData.consumption}
                    onChange={(e) => setFormData({ ...formData, consumption: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacidade (kg)</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1000"
                    placeholder="40000"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maintenanceCost">Manutenção (R$/km)</Label>
                  <Input
                    id="maintenanceCost"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.85"
                    value={formData.maintenanceCost}
                    onChange={(e) => setFormData({ ...formData, maintenanceCost: e.target.value })}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Cadastrar Veículo
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Editar Veículo</DialogTitle>
              <DialogDescription>
                Altere as informações do veículo {editingVehicle?.plate}.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-plate">Placa</Label>
                  <Input
                    id="edit-plate"
                    placeholder="ABC-1234"
                    value={formData.plate}
                    onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-year">Ano</Label>
                  <Input
                    id="edit-year"
                    type="number"
                    min="1990"
                    max="2024"
                    placeholder="2020"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-model">Modelo</Label>
                <Input
                  id="edit-model"
                  placeholder="Volvo FH-460"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-consumption">Consumo (km/l)</Label>
                  <Input
                    id="edit-consumption"
                    type="number"
                    step="0.1"
                    min="1"
                    placeholder="3.2"
                    value={formData.consumption}
                    onChange={(e) => setFormData({ ...formData, consumption: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-capacity">Capacidade (kg)</Label>
                  <Input
                    id="edit-capacity"
                    type="number"
                    min="1000"
                    placeholder="40000"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-maintenanceCost">Manutenção (R$/km)</Label>
                  <Input
                    id="edit-maintenanceCost"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.85"
                    value={formData.maintenanceCost}
                    onChange={(e) => setFormData({ ...formData, maintenanceCost: e.target.value })}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Vehicle Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((vehicle) => (
          <Card key={vehicle.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">
                  {vehicle.plate}
                </CardTitle>
                {getStatusBadge(vehicle.status)}
              </div>
              <CardDescription className="font-medium text-base">
                {vehicle.model} • {vehicle.year}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Fuel className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-muted-foreground">Consumo</p>
                    <p className="font-medium">{vehicle.consumption} km/l</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Weight className="h-4 w-4 text-success" />
                  <div>
                    <p className="text-muted-foreground">Capacidade</p>
                    <p className="font-medium">{vehicle.capacity.toLocaleString()} kg</p>
                  </div>
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Custo manutenção:</span>
                  <span className="font-medium">R$ {vehicle.maintenanceCost}/km</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleEdit(vehicle)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir o veículo {vehicle.plate}? 
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(vehicle.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Educational Notes */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">💡 Dica Educacional</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            <strong>Consumo de combustível:</strong> Um fator crucial nos custos operacionais. 
            Veículos mais novos tendem a ter melhor eficiência energética. 
            <br /><br />
            <strong>Capacidade de carga:</strong> Determine a quantidade máxima de mercadoria que pode ser transportada. 
            Considere sempre o peso bruto total combinado (PBTC) do veículo.
            <br /><br />
            <strong>Custo de manutenção:</strong> Varia conforme idade, marca e tipo de operação. 
            Inclui peças, mão de obra, pneus e revisões preventivas.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default Vehicles