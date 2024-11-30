import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AlignLeft } from "lucide-react";

export function MobileSidebar(props: { children: React.ReactNode }) {
  const { children } = props;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="w-fit" variant="outline">
          <AlignLeft size={14} />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[250px]" side={"left"}>
        {children}
      </SheetContent>
    </Sheet>
  );
}
