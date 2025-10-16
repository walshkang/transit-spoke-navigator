import { Clock, Train, Bike, Footprints } from "lucide-react";

interface RouteCardProps {
  duration: number;
  bikeMinutes: number;
  subwayMinutes: number;
  walkingMinutes: number;
  onClick: () => void;
  // New: visually distinguish enhanced route
  isEnhanced?: boolean;
}

const RouteCard = ({ duration, bikeMinutes, subwayMinutes, walkingMinutes, onClick, isEnhanced = false }: RouteCardProps) => {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl cursor-pointer transition-aero active:scale-[0.98] group ${
        isEnhanced
          ? "p-[1.5px] bg-gradient-to-r from-blue-400/40 via-cyan-400/40 to-blue-400/40 hover:shadow-glow"
          : ""
      }`}
    >
      <div
        className={`glass p-6 md:p-7 lg:p-8 rounded-2xl shadow-aero hover:shadow-glow hover:scale-[1.02] ${
          isEnhanced ? "bg-background" : ""
        }`}
      >
        <div className="flex items-center justify-between mb-4 md:mb-5">
          <div className="flex items-center space-x-3 md:space-x-4">
            <div className="p-2 md:p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-aero">
              <Clock className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            </div>
            <span className="font-bold text-xl md:text-2xl lg:text-3xl">{duration} min</span>
          </div>
        </div>
        <div className="flex gap-4 md:gap-5 flex-wrap">
          {bikeMinutes > 0 && (
            isEnhanced ? (
              <div className="p-[1.5px] rounded-xl bg-gradient-to-r from-blue-400/40 via-cyan-400/40 to-blue-400/40">
                <div className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl bg-accent/10">
                  <Bike className="h-4 w-4 md:h-5 md:w-5 text-accent" />
                  <span className="text-sm md:text-base font-medium text-foreground">{bikeMinutes} min</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl bg-accent/10">
                <Bike className="h-4 w-4 md:h-5 md:w-5 text-accent" />
                <span className="text-sm md:text-base font-medium text-foreground">{bikeMinutes} min</span>
              </div>
            )
          )}

          {isEnhanced ? (
            <div className="p-[1.5px] rounded-xl bg-gradient-to-r from-blue-400/40 via-cyan-400/40 to-blue-400/40">
              <div className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl bg-primary/10">
                <Train className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                <span className="text-sm md:text-base font-medium text-foreground">{subwayMinutes} min</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl bg-primary/10">
              <Train className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              <span className="text-sm md:text-base font-medium text-foreground">{subwayMinutes} min</span>
            </div>
          )}

          {isEnhanced ? (
            <div className="p-[1.5px] rounded-xl bg-gradient-to-r from-blue-400/40 via-cyan-400/40 to-blue-400/40">
              <div className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl bg-muted">
                <Footprints className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                <span className="text-sm md:text-base font-medium text-foreground">{walkingMinutes} min</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl bg-muted">
              <Footprints className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
              <span className="text-sm md:text-base font-medium text-foreground">{walkingMinutes} min</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RouteCard;