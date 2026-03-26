import { Trash2 } from "lucide-react";
import type { WebsitePromptSite } from "#/stores/promptsStore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "#/components/ui/alert-dialog";

interface RemoveWebsiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingSite: WebsitePromptSite | null;
  onConfirmRemove: () => void;
}

export function RemoveWebsiteDialog({
  open,
  onOpenChange,
  pendingSite,
  onConfirmRemove,
}: RemoveWebsiteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-muted/40">
            <Trash2 className="text-muted-foreground" />
          </AlertDialogMedia>
          <AlertDialogTitle className="text-[15px] font-semibold">
            {pendingSite?.domain?.trim()
              ? `Remove ${pendingSite.domain}?`
              : "Remove this website?"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            This removes the website rules for this site. Your saved prompts are
            not deleted. To delete a prompt, open it from the sidebar or use
            Edit prompt next to a rule, then delete it in the prompt editor.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmRemove}>
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
