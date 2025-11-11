import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Users, BedDouble, Bath, TrendingUp } from "lucide-react";

interface PropertyCardProps {
  property: {
    id: string;
    titulo: string;
    tipo: string;
    bairro: string;
    quartos: number;
    banheiros: number;
    capacidade: number;
    preco_base: number;
    imagens?: any;
  };
  ocupacao?: number;
  precoSugerido?: number;
}

const PropertyCard = ({ property, ocupacao, precoSugerido }: PropertyCardProps) => {
  const tipoLabels: Record<string, string> = {
    apartamento: "Apartamento",
    casa: "Casa",
    studio: "Studio",
    cobertura: "Cobertura",
    chalé: "Chalé",
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="h-48 bg-gradient-primary flex items-center justify-center">
        <Building2 className="h-20 w-20 text-white/30" />
      </div>
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg line-clamp-1">{property.titulo}</h3>
          <Badge variant="secondary">{tipoLabels[property.tipo]}</Badge>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground text-sm">
          <MapPin className="h-4 w-4" />
          <span>{property.bairro}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <BedDouble className="h-4 w-4 text-muted-foreground" />
            <span>{property.quartos}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="h-4 w-4 text-muted-foreground" />
            <span>{property.banheiros}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{property.capacidade}</span>
          </div>
        </div>

        {ocupacao !== undefined && (
          <div className="flex items-center justify-between py-2 border-t">
            <span className="text-sm text-muted-foreground">Ocupação</span>
            <Badge variant={ocupacao > 70 ? "default" : "secondary"} className="bg-success">
              {ocupacao}%
            </Badge>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-xs text-muted-foreground">Preço base/dia</p>
            <p className="text-lg font-bold text-primary">
              R$ {property.preco_base.toFixed(2)}
            </p>
          </div>
          {precoSugerido && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Sugerido
              </p>
              <p className="text-lg font-bold text-success">
                R$ {precoSugerido.toFixed(2)}
              </p>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <Button variant="outline" className="w-full">Ver detalhes</Button>
      </CardFooter>
    </Card>
  );
};

export default PropertyCard;
