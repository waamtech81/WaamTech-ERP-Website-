import type { FaqItem } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export function FaqAccordionList({
  items,
  className,
  triggerClassName,
}: {
  items: FaqItem[];
  className?: string;
  triggerClassName?: string;
}) {
  return (
    <Accordion type="single" collapsible className={cn("w-full", className)}>
      {items.map((faq) => (
        <AccordionItem key={faq.id} value={faq.id}>
          <AccordionTrigger className={triggerClassName}>
            <span className="flex flex-1 items-center justify-between gap-3 pr-2">
              <span className="text-left">{faq.question}</span>
              <Badge variant="muted" className="shrink-0">
                {faq.category}
              </Badge>
            </span>
          </AccordionTrigger>
          <AccordionContent>{faq.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
