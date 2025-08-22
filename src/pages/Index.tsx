
import { MetricCard } from "@/components/MetricCard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { 
  Truck, 
  Route, 
  Package, 
  DollarSign, 
  TrendingUp, 
  Users,
  Calendar,
  AlertCircle
} from "lucide-react"

const Index = () => {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Dashboard TMS Educacional
        </h1>
        <p className="text-muted-foreground">
          Sistema de gestão de transporte para fins educacionais - Acompanhe suas simulações e aprenda logística na prática.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Veículos Cadastrados"
          value={12}
          description="Total de veículos no sistema"
          icon={Truck}
          trend={{ value: 20, isPositive: true }}
        />
        <MetricCard
          title="Rotas Ativas"
          value={8}
          description="Rotas em operação"
          icon={Route}
          trend={{ value: 12.5, isPositive: true }}
          variant="success"
        />
        <MetricCard
          title="Cargas Processadas"
          value={45}
          description="Total este mês"
          icon={Package}
          trend={{ value: -2.1, isPositive: false }}
        />
        <MetricCard
          title="Custo Médio/km"
          value="R$ 2,35"
          description="Baseado nas últimas simulações"
          icon={DollarSign}
          variant="warning"
        />
      </div>

      {/* Action Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Cadastrar Veículo
            </CardTitle>
            <CardDescription>
              Adicione novos veículos para suas simulações de transporte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/vehicles')}>
              Novo Veículo
            </Button>
          </CardContent>
        </Card>

        <Card className="border-success/20 bg-success/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5 text-success" />
              Definir Rota
            </CardTitle>
            <CardDescription>
              Configure rotas com origem, destino e custos operacionais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" className="w-full" onClick={() => navigate('/routes')}>
              Nova Rota
            </Button>
          </CardContent>
        </Card>

        <Card className="border-warning/20 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-warning" />
              Calcular Custos
            </CardTitle>
            <CardDescription>
              Simule custos de transporte e compare diferentes cenários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" className="w-full" onClick={() => navigate('/calculator')}>
              Calcular
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Atividades Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/50">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Veículo Volvo FH-460 cadastrado</p>
                <p className="text-xs text-muted-foreground">Há 2 horas</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/50">
              <div className="w-2 h-2 bg-success rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Rota São Paulo → Rio simulada</p>
                <p className="text-xs text-muted-foreground">Há 4 horas</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/50">
              <div className="w-2 h-2 bg-warning rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Relatório de custos gerado</p>
                <p className="text-xs text-muted-foreground">Ontem</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Indicadores de Aprendizado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Simulações Completas</span>
                <span className="font-medium">15/20</span>
              </div>
              <div className="w-full bg-accent rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Exercícios de Cálculo</span>
                <span className="font-medium">8/12</span>
              </div>
              <div className="w-full bg-accent rounded-full h-2">
                <div className="bg-success h-2 rounded-full" style={{ width: '67%' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Relatórios Gerados</span>
                <span className="font-medium">5/8</span>
              </div>
              <div className="w-full bg-accent rounded-full h-2">
                <div className="bg-warning h-2 rounded-full" style={{ width: '62%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
