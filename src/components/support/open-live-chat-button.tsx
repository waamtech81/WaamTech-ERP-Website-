"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openTawkChat } from "@/components/analytics/tawk-to-chat";

export function OpenLiveChatButton() {
  return (
    <Button
      type="button"
      className="mt-6 w-full rounded-full"
      onClick={() => openTawkChat()}
    >
      <MessageCircle className="mr-2 h-4 w-4" />
      Open live chat
    </Button>
  );
}
