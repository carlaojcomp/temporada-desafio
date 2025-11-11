import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import PropertyCard from "@/components/PropertyCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Calendar, DollarSign, Home, Plus } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalProperties: 0,
    avgOccupancy: 0,
    projectedRevenue: 0,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Carregar imóveis do proprietário
      const { data: propertiesData, error: propertiesError } = await supabase
        .from("imoveis")
        .select("*")
        .eq("proprietario_id", user?.id);

      if (propertiesError) throw propertiesError;
      setProperties(propertiesData || []);

      // Calcular estatísticas (simuladas por enquanto)
      if (propertiesData && propertiesData.length > 0) {
        const avgPrice = propertiesData.reduce((sum, p) => sum + Number(p.preco_base), 0) / propertiesData.length;
        setStats({
          totalProperties: propertiesData.length,
          avgOccupancy: 65, // Simulado
          projectedRevenue: avgPrice * 30 * 0.65 * propertiesData.length, // 30 dias * 65% ocupação
        });
      }
    } catch (error: any) {
      toast.error("Erro ao carregar dados: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Painel do Proprietário</h1>
            <p className="text-muted-foreground">Acompanhe suas propriedades e receitas</p>
          </div>
          <Button onClick={() => window.open("https://carlaojcomp.app.n8n.cloud/form/af4d5671-cb72-4873-86a6-dcd7ca5571c2", "_blank")}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Imóvel
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Imóveis</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProperties}</div>
              <p className="text-xs text-muted-foreground">propriedades ativas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ocupação Média</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.avgOccupancy}%</div>
              <p className="text-xs text-muted-foreground">próximos 30 dias</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Receita Projetada</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                R$ {stats.projectedRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">próximos 30 dias</p>
            </CardContent>
          </Card>
        </div>

        {/* Properties List */}
        <Card>
          <CardHeader>
            <CardTitle>Meus Imóveis</CardTitle>
            <CardDescription>
              Gerencie suas propriedades e visualize o desempenho
            </CardDescription>
          </CardHeader>
          <CardContent>
            {properties.length === 0 ? (
              <div className="text-center py-12">
                <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Nenhum imóvel cadastrado</p>
                <p className="text-muted-foreground mb-4">
                  Comece adicionando seu primeiro imóvel para alugar por temporada
                </p>
                <Button onClick={() => window.open("https://carlaojcomp.app.n8n.cloud/form/af4d5671-cb72-4873-86a6-dcd7ca5571c2", "_blank")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Imóvel
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    ocupacao={65}
                    precoSugerido={Number(property.preco_base) * 1.2}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
