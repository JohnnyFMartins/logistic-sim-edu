import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { pedidosApi, veiculosApi, rotasApi, cargasApi, PedidoTransporte, Veiculo, Rota, Carga } from "@/lib/api";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, MapPin, Truck, Package, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Pedidos() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPedido, setEditingPedido] = useState<PedidoTransporte | null>(null);

  const [formData, setFormData] = useState({
    veiculoId: "",
    rotaId: "",
    cargaId: "",
    dataInicio: "",
    dataFim: "",
    status: "Pendente",
  });

  // Fetch pedidos
  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ["pedidos"],
    queryFn: pedidosApi.getAll,
  });

  // Fetch veiculos for dropdown
  const { data: veiculos = [] } = useQuery({
    queryKey: ["veiculos"],
    queryFn: veiculosApi.getAll,
  });

  // Fetch rotas for dropdown
  const { data: rotas = [] } = useQuery({
    queryKey: ["rotas"],
    queryFn: rotasApi.getAll,
  });

  // Fetch cargas for dropdown
  const { data: cargas = [] } = useQuery({
    queryKey: ["cargas"],
    queryFn: cargasApi.getAll,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: pedidosApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      toast({ title: "Pedido criado com sucesso!" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao criar pedido", description: error.message, variant: "destructive" });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => pedidosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      toast({ title: "Pedido atualizado com sucesso!" });
      resetForm();
      setIsDialogOpen(false);
      setEditingPedido(null);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar pedido", description: error.message, variant: "destructive" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: pedidosApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      toast({ title: "Pedido excluído com sucesso!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao excluir pedido", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      veiculoId: "",
      rotaId: "",
      cargaId: "",
      dataInicio: "",
      dataFim: "",
      status: "Pendente",
    });
  };

  const handleEdit = (pedido: PedidoTransporte) => {
    setEditingPedido(pedido);
    setFormData({
      veiculoId: pedido.veiculo.id.toString(),
      rotaId: pedido.rota.id.toString(),
      cargaId: pedido.carga.id.toString(),
      dataInicio: pedido.dataInicio,
      dataFim: pedido.dataFim,
      status: pedido.status,
    });
    setIsDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingPedido(null);
      resetForm();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.veiculoId || !formData.rotaId || !formData.cargaId || !formData.dataInicio || !formData.dataFim) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (editingPedido) {
      updateMutation.mutate({
        id: editingPedido.id,
        data: {
          veiculo: { id: parseInt(formData.veiculoId) },
          rota: { id: parseInt(formData.rotaId) },
          dataInicio: formData.dataInicio,
          dataFim: formData.dataFim,
          status: formData.status,
        },
      });
    } else {
      createMutation.mutate({
        veiculoId: parseInt(formData.veiculoId),
        rotaId: parseInt(formData.rotaId),
        cargaId: parseInt(formData.cargaId),
        dataInicio: formData.dataInicio,
        dataFim: formData.dataFim,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Concluído":
        return <Badge className="bg-success/20 text-success-foreground">Concluído</Badge>;
      case "Em_Andamento":
        return <Badge variant="secondary">Em Andamento</Badge>;
      case "Pendente":
        return <Badge variant="outline">Pendente</Badge>;
      case "Cancelado":
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <MapPin className="h-8 w-8 text-primary" />
            Pedidos de Transporte
          </h1>
          <p className="text-muted-foreground">
            Gerencie os pedidos de transporte do sistema.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Pedido
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingPedido ? "Editar Pedido" : "Novo Pedido"}
                </DialogTitle>
                <DialogDescription>
                  {editingPedido
                    ? "Atualize as informações do pedido."
                    : "Preencha os dados para criar um novo pedido de transporte."}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="veiculo" className="text-right">
                    Veículo *
                  </Label>
                  <Select
                    value={formData.veiculoId}
                    onValueChange={(value) => setFormData({ ...formData, veiculoId: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione um veículo" />
                    </SelectTrigger>
                    <SelectContent>
                      {veiculos.map((v) => (
                        <SelectItem key={v.id} value={v.id.toString()}>
                          {v.placa} - {v.modelo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="rota" className="text-right">
                    Rota *
                  </Label>
                  <Select
                    value={formData.rotaId}
                    onValueChange={(value) => setFormData({ ...formData, rotaId: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione uma rota" />
                    </SelectTrigger>
                    <SelectContent>
                      {rotas.map((r) => (
                        <SelectItem key={r.id} value={r.id.toString()}>
                          {r.origem} → {r.destino}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="carga" className="text-right">
                    Carga *
                  </Label>
                  <Select
                    value={formData.cargaId}
                    onValueChange={(value) => setFormData({ ...formData, cargaId: value })}
                    disabled={!!editingPedido}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione uma carga" />
                    </SelectTrigger>
                    <SelectContent>
                      {cargas.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.nome} - {c.peso}kg
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dataInicio" className="text-right">
                    Data Início *
                  </Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={formData.dataInicio}
                    onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                    className="col-span-3"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dataFim" className="text-right">
                    Data Fim *
                  </Label>
                  <Input
                    id="dataFim"
                    type="date"
                    value={formData.dataFim}
                    onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })}
                    className="col-span-3"
                  />
                </div>

                {editingPedido && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="status" className="text-right">
                      Status
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Em_Andamento">Em Andamento</SelectItem>
                        <SelectItem value="Concluído">Concluído</SelectItem>
                        <SelectItem value="Cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingPedido ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Veículo</TableHead>
              <TableHead>Rota</TableHead>
              <TableHead>Carga</TableHead>
              <TableHead>Data Início</TableHead>
              <TableHead>Data Fim</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Custo Total</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  Carregando pedidos...
                </TableCell>
              </TableRow>
            ) : pedidos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <MapPin className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">Nenhum pedido cadastrado</p>
                    <p className="text-sm text-muted-foreground">
                      Clique em "Novo Pedido" para começar
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              pedidos.map((pedido) => (
                <TableRow key={pedido.id}>
                  <TableCell className="font-medium">#{pedido.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      {pedido.veiculo?.placa || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    {pedido.rota?.origem} → {pedido.rota?.destino}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      {pedido.carga?.nome || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {pedido.dataInicio ? format(new Date(pedido.dataInicio), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    {pedido.dataFim ? format(new Date(pedido.dataFim), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                  </TableCell>
                  <TableCell>{getStatusBadge(pedido.status)}</TableCell>
                  <TableCell>{formatCurrency(pedido.custoTotal || 0)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(pedido)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(pedido.id)}
                        disabled={deleteMutation.isPending}
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
      </div>
    </div>
  );
}
