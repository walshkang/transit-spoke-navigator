import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

interface MethodologyDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MethodologyDrawer = ({ open, onOpenChange }: MethodologyDrawerProps) => {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[85vh] animate-slide-in-right">
        <DrawerHeader>
          <DrawerTitle>Methodology</DrawerTitle>
          <DrawerDescription>
            How we compute each route variant and the assumptions involved.
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-4 space-y-6 overflow-y-auto">
          <section>
            <h3 className="text-lg font-semibold mb-2">Standard</h3>
            <p className="text-sm text-muted-foreground">
              Transit directions from Google Maps (may include buses) with walking access/egress. No bike substitution.
            </p>
          </section>
          <section>
            <h3 className="text-lg font-semibold mb-2">Enhanced (Hybrid)</h3>
            <p className="text-sm text-muted-foreground">
              If initial/final walking exceeds a threshold, we substitute first/last mile with Citi Bike using GBFS station availability.
            </p>
          </section>
          <section>
            <h3 className="text-lg font-semibold mb-2">No Bus (Transit‑only)</h3>
            <p className="text-sm text-muted-foreground">
              Transit directions excluding buses by restricting modes to subway/train/tram/rail.
              If no such route exists, this option is not shown.
            </p>
          </section>
          <section>
            <h3 className="text-lg font-semibold mb-2">No Bus + Bike</h3>
            <p className="text-sm text-muted-foreground">
              Applies the same long‑walk substitution to the No Bus baseline, adding bike segments when viable stations are available.
            </p>
          </section>
          <section>
            <h3 className="text-lg font-semibold mb-2">Assumptions & Fallbacks</h3>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>Long‑walk threshold ≈ 5 minutes (subject to tuning).</li>
              <li>Station selection prioritizes nearest available bikes/docks within ~500m.</li>
              <li>Variants are hidden when prerequisites aren’t met (e.g., no non‑bus transit, no stations).</li>
            </ul>
          </section>
        </div>
        <DrawerFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default MethodologyDrawer;


