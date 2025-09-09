import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft,
  Calendar, 
  MapPin, 
  Truck,
  Weight,
  Package,
  FileText,
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

export default function ViagemDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch trip details
  const { data: trip, isLoading } = useQuery({
    queryKey: ["trip", id],
    queryFn: async () => {
      if (!user?.id || !id) return null;
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
      
      if (error) throw error;
      return data as Trip;
    },
    enabled: !!user?.id && !!id,
  });

  // Fetch vehicle details
  const { data: vehicle } = useQuery({
    queryKey: ["vehicle", trip?.vehicle_id],
    queryFn: async () => {
      if (!trip?.vehicle_id) return null;
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("id", trip.vehicle_id)
        .single();
      
      if (error) throw error;
      return data as Vehicle;
    },
    enabled: !!trip?.vehicle_id,
  });

  // Fetch route details
  const { data: route } = useQuery({
    queryKey: ["route", trip?.route_id],
    queryFn: async () => {
      if (!trip?.route_id) return null;
      const { data, error } = await supabase
        .from("routes")
        .select("*")
        .eq("id", trip.route_id)
        .single();
      
      if (error) throw error;
      return data as Route;
    },
    enabled: !!trip?.route_id,
  });

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

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  if (!trip) {
    return <div className="text-center p-8">
      <h2 className="text-2xl font-bold text-muted-foreground">Viagem não encontrada</h2>
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/viagens')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Detalhes da Viagem</h1>
          <p className="text-muted-foreground">
            Informações completas da viagem selecionada
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Trip Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Informações da Viagem</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Status:</span>
              <Badge variant={getStatusVariant(trip.status)} className="flex items-center space-x-1">
                {getStatusIcon(trip.status)}
                <span>{trip.status}</span>
              </Badge>
            </div>
            
            <Separator />
            
            <div>
              <span className="font-medium">Data de Início:</span>
              <p className="text-muted-foreground">
                {format(new Date(trip.start_date), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
            
            <div>
              <span className="font-medium">Data de Término:</span>
              <p className="text-muted-foreground">
                {format(new Date(trip.end_date), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>

            {trip.peso_ton && (
              <div className="flex items-center space-x-2">
                <Weight className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Peso:</span>
                <span className="text-muted-foreground">{trip.peso_ton} toneladas</span>
              </div>
            )}

            {trip.volume_m3 && (
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Volume:</span>
                <span className="text-muted-foreground">{trip.volume_m3} m³</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vehicle Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Truck className="h-5 w-5" />
              <span>Veículo</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {vehicle ? (
              <>
                <div>
                  <span className="font-medium">Tipo:</span>
                  <p className="text-muted-foreground">{vehicle.tipo}</p>
                </div>
                <div>
                  <span className="font-medium">Capacidade:</span>
                  <p className="text-muted-foreground">{vehicle.capacidade_ton} toneladas</p>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <p className="text-muted-foreground">{vehicle.status}</p>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Carregando informações do veículo...</p>
            )}
          </CardContent>
        </Card>

        {/* Route Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Rota</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {route ? (
              <>
                <div>
                  <span className="font-medium">Origem:</span>
                  <p className="text-muted-foreground">{route.origem}</p>
                </div>
                <div>
                  <span className="font-medium">Destino:</span>
                  <p className="text-muted-foreground">{route.destino}</p>
                </div>
                <div>
                  <span className="font-medium">Distância:</span>
                  <p className="text-muted-foreground">{route.distancia_km} km</p>
                </div>
                <div>
                  <span className="font-medium">Tempo Estimado:</span>
                  <p className="text-muted-foreground">{route.tempo_estimado_h} horas</p>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Carregando informações da rota...</p>
            )}
          </CardContent>
        </Card>

        {/* Observations */}
        {trip.observacoes && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Observações</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{trip.observacoes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        <Button onClick={() => navigate('/viagens')}>
          Voltar à Lista
        </Button>
        {trip.status !== 'Concluída' && (
          <Button 
            variant="outline"
            onClick={() => navigate(`/viagens/editar/${trip.id}`)}
          >
            Editar Viagem
          </Button>
        )}
      </div>
    </div>
  );
}