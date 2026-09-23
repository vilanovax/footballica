import { redirect } from "next/navigation";

/**
 * Solo GotD retired from player Play — live formats only appear as Duel specials.
 * Old bookmarks / shares land on the online compete entry.
 */
export default function GridGotdRedirect() {
  redirect("/play/duel");
}
