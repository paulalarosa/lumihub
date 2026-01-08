import { Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FeatureLockedCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onUnlock: () => void;
}

const FeatureLockedCard = ({ title, description, icon, onUnlock }: FeatureLockedCardProps) => {
  return (
    <Card className="relative overflow-hidden border-dashed">
      <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted/80 backdrop-blur-[1px]" />
      <CardContent className="relative p-6 flex flex-col items-center text-center">
        <div className="relative mb-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            {icon}
          </div>
          <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-3 w-3 text-primary" />
          </div>
        </div>
        
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        
        <Button variant="outline" size="sm" onClick={onUnlock}>
          <Lock className="mr-2 h-3 w-3" />
          Desbloquear
        </Button>
      </CardContent>
    </Card>
  );
};

export default FeatureLockedCard;
