"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openCrispChat } from "@/components/analytics/crisp-chat";

export function OpenLiveChatButton() {
  return (
    <Button
      type="button"
      className="mt-6 w-full rounded-full"
      onClick={() => openCrispChat()}
    >
      <MessageCircle className="mr-2 h-4 w-4" />
      Open live chat
    </Button>
  );
}
