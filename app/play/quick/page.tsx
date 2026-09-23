import { redirect } from "next/navigation";

/**
 * Quick Match retired — fold into Penalty as the sole fixed-length solo.
 * Keep this route so old bookmarks / deep links still land somewhere playable.
 */
export default function QuickPageRedirect() {
  redirect("/play/penalty");
}
