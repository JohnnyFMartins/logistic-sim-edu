import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cargasApi, Carga, CargaInput } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Package, Plus, Edit, Trash2 } from "lucide-react";

export default function Cargo() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCargo, setEditingCargo] = useState<Carga | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    peso: "",
    valor: "",
    descricao: "",
    tipo: "Geral",
    status: "Ativo"
  });

  // Fetch cargas
  const { data: cargas = [], isLoading } = useQuery({
    queryKey: ["cargas"],
    queryFn: cargasApi.getAll,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: cargasApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cargas"] });
      toast({ title: "Carga criada com sucesso!" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao criar carga", description: error.message, variant: "destructive" });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CargaInput }) => cargasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cargas"] });
      toast({ title: "Carga atualizada com sucesso!" });
      resetForm();
      setIsDialogOpen(false);
      setEditingCargo(null);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar carga", description: error.message, variant: "destructive" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: cargasApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cargas"] });
      toast({ title: "Carga excluída com sucesso!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao excluir carga", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      nome: "",
      peso: "",
      valor: "",
      descricao: "",
      tipo: "Geral",
      status: "Ativo"
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.peso) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o nome e o peso da carga.",
        variant: "destructive",
      });
      return;
    }

    const cargaData: CargaInput = {
      nome: formData.nome,
      peso: parseFloat(formData.peso),
      valor: parseFloat(formData.valor) || 0,
      descricao: formData.descricao,
      tipo: formData.tipo,
      status: formData.status,
    };

    if (editingCargo) {
      updateMutation.mutate({ id: editingCargo.id, data: cargaData });
    } else {
      createMutation.mutate(cargaData);
    }
  };

  const handleEdit = (cargo: Carga) => {
    setEditingCargo(cargo);
    setFormData({
      nome: cargo.nome,
      peso: cargo.peso.toString(),
      valor: cargo.valor.toString(),
      descricao: cargo.descricao || "",
      tipo: cargo.tipo,
      status: cargo.status
    });
    setIsDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingCargo(null);
      resetForm();
    }
  };

  const getStatusColor = (status: string) => {
    return status === "Ativo" ? "default" : "secondary";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            Cargas
          </h1>
          <p className="text-muted-foreground">
            Gerencie as cargas do sistema.
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Carga
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingCargo ? "Editar Carga" : "Nova Carga"}
                </DialogTitle>
                <DialogDescription>
                  {editingCargo 
                    ? "Atualize as informações da carga." 
                    : "Preencha os dados para cadastrar uma nova carga."
                  }
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="nome" className="text-right">
                    Nome *
                  </Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="col-span-3"
                    placeholder="Ex: Eletrônicos"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="peso" className="text-right">
                    Peso (kg) *
                  </Label>
                  <Input
                    id="peso"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.peso}
                    onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                    className="col-span-3"
                    placeholder="0.00"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="valor" className="text-right">
                    Valor (R$)
                  </Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    className="col-span-3"
                    placeholder="0.00"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tipo" className="text-right">
                    Tipo
                  </Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Geral">Geral</SelectItem>
                      <SelectItem value="Frágil">Frágil</SelectItem>
                      <SelectItem value="Perecível">Perecível</SelectItem>
                      <SelectItem value="Perigosa">Perigosa</SelectItem>
                      <SelectItem value="Refrigerada">Refrigerada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
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
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="descricao" className="text-right pt-2">
                    Descrição
                  </Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="col-span-3"
                    placeholder="Informações adicionais sobre a carga..."
                    rows={3}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingCargo ? "Atualizar" : "Cadastrar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cargo Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Peso (kg)</TableHead>
              <TableHead>Valor (R$)</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Carregando cargas...
                </TableCell>
              </TableRow>
            ) : cargas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">Nenhuma carga cadastrada</p>
                    <p className="text-sm text-muted-foreground">
                      Clique em "Nova Carga" para começar
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              cargas.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.nome}</TableCell>
                  <TableCell>{Number(item.peso || 0).toLocaleString('pt-BR')} kg</TableCell>
                  <TableCell>R$ {Number(item.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell>{item.tipo}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {item.descricao || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(item.id)}
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
