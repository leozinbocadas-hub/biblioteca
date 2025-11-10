import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

type ModuleCardProps = {
  title: string;
  orderNumber: number;
  isLocked: boolean;
  daysUntilUnlock?: number;
  coverImageUrl?: string | null;
  onClick: () => void;
};

export const ModuleCard = ({
  title,
  orderNumber,
  isLocked,
  daysUntilUnlock,
  coverImageUrl,
  onClick,
}: ModuleCardProps) => {
  return (
    <div
      onClick={!isLocked ? onClick : undefined}
      className={cn(
        "group relative aspect-[3/4] rounded-lg overflow-hidden transition-all duration-300",
        "bg-gradient-to-br from-card to-card/80 border border-border",
        !isLocked && "cursor-pointer hover:scale-105 hover:shadow-glow",
        isLocked && "opacity-50 grayscale cursor-not-allowed"
      )}
    >
      {/* Background Image */}
      {coverImageUrl && (
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${coverImageUrl})` }}
        />
      )}
      {/* Module Number Badge */}
      <div className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30 flex items-center justify-center">
        <span className="text-xs font-bold text-primary">{orderNumber}</span>
      </div>

      {/* Lock Badge */}
      {isLocked && daysUntilUnlock !== undefined && (
        <div className="absolute top-3 right-3 z-10 px-2 py-1 rounded-full bg-destructive/20 backdrop-blur-sm border border-destructive/30 flex items-center gap-1">
          <Lock className="w-3 h-3 text-destructive" />
          <span className="text-xs font-medium text-destructive">
            {daysUntilUnlock}d
          </span>
        </div>
      )}

      {/* Content */}
      <div className="absolute inset-0 p-6 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        {isLocked && (
          <div className="mb-2">
            <Lock className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        <h3 className="text-lg font-bold text-foreground line-clamp-2">
          {title}
        </h3>
        {isLocked && (
          <p className="text-xs text-muted-foreground mt-1">
            Disponível em {daysUntilUnlock} {daysUntilUnlock === 1 ? 'dia' : 'dias'}
          </p>
        )}
      </div>

      {/* Hover Glow Effect */}
      {!isLocked && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-primary/20 to-transparent pointer-events-none" />
      )}
    </div>
  );
};
