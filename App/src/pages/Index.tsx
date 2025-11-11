import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import PropertyCard from "@/components/PropertyCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const { user, loading } = useAuth();
  const [properties, setProperties] = useState<any[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    search: "",
    tipo: "all",
    bairro: "all",
  });

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, properties]);

  const loadProperties = async () => {
    try {
      const { data, error } = await supabase
        .from("imoveis")
        .select("*")
        .eq("ativo", true);

      if (error) throw error;
      setProperties(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar imóveis: " + error.message);
    }
  };

  const applyFilters = () => {
    let filtered = [...properties];

    if (filters.search) {
      filtered = filtered.filter((p) =>
        p.titulo.toLowerCase().includes(filters.search.toLowerCase()) ||
        p.bairro.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.tipo !== "all") {
      filtered = filtered.filter((p) => p.tipo === filters.tipo);
    }

    if (filters.bairro !== "all") {
      filtered = filtered.filter((p) => p.bairro === filters.bairro);
    }

    setFilteredProperties(filtered);
  };

  const uniqueBairros = Array.from(new Set(properties.map((p) => p.bairro)));

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

      {/* Hero Section */}
      <div className="bg-gradient-hero text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Encontre o imóvel perfeito para temporada
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8">
            Explore, compare e maximize seus ganhos com precificação inteligente
          </p>
          
          {!user && (
            <Button 
              size="lg" 
              variant="secondary"
              className="shadow-xl"
              onClick={() => window.location.href = "/auth"}
            >
              Começar agora
            </Button>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Explorar Imóveis</CardTitle>
            <CardDescription>
              Filtre por tipo, localização e disponibilidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou bairro..."
                    className="pl-9"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                </div>
              </div>
              
              <Select value={filters.tipo} onValueChange={(value) => setFilters({ ...filters, tipo: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de imóvel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="apartamento">Apartamento</SelectItem>
                  <SelectItem value="casa">Casa</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                  <SelectItem value="cobertura">Cobertura</SelectItem>
                  <SelectItem value="chalé">Chalé</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.bairro} onValueChange={(value) => setFilters({ ...filters, bairro: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Bairro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os bairros</SelectItem>
                  {uniqueBairros.map((bairro) => (
                    <SelectItem key={bairro} value={bairro}>
                      {bairro}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Properties Grid */}
        {filteredProperties.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Nenhum imóvel encontrado</p>
              <p className="text-muted-foreground">
                Tente ajustar os filtros para ver mais resultados
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                ocupacao={Math.floor(Math.random() * 40) + 50}
                precoSugerido={Number(property.preco_base) * (1 + Math.random() * 0.3)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
