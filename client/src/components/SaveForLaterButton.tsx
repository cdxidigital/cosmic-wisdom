import React from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export type SavedContent = {
  contentKey: string;
  contentType: "natal" | "numerology" | "tarot" | "palmistry" | "compatibility" | "daily_quote";
  title: string;
  summary: string;
  href: string;
};

export function SaveForLaterButton({ item, inverse = false }: { item: SavedContent; inverse?: boolean }) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const savedQuery = trpc.cosmic.listSavedItems.useQuery(undefined, { enabled: isAuthenticated });
  const isSaved = savedQuery.data?.some(saved => saved.contentKey === item.contentKey) ?? false;
  const toggle = trpc.cosmic.toggleSavedItem.useMutation({
    onSuccess: result => {
      void utils.cosmic.listSavedItems.invalidate();
      toast(result.saved ? "Saved for later" : "Removed from saved", { description: result.saved ? `${item.title} is in your private saved list.` : `${item.title} was removed from your private saved list.` });
    },
    onError: error => toast("We couldn’t update your saved list", { description: error.message }),
  });
  const save = () => {
    if (!isAuthenticated) {
      toast("Sign in to save this", { description: "Saved content stays private to your member account." });
      window.location.href = "/account";
      return;
    }
    toggle.mutate(item);
  };
  return <button type="button" onClick={save} disabled={toggle.isPending} aria-pressed={isSaved} className={`inline-flex items-center gap-2 font-mono text-[8px] font-semibold tracking-[.13em] transition-colors disabled:opacity-55 ${inverse ? "text-[#E3DAEA] hover:text-white" : "text-[#55707d] hover:text-[#EF5D3F]"}`}><span>{isSaved ? "SAVED" : "SAVE FOR LATER"}</span>{isSaved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}</button>;
}
