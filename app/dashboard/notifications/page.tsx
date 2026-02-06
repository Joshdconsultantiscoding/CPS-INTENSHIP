import { getAuthUser } from "@/lib/auth";
import NotificationsPageContent from "./notifications-page-content";

export const metadata = {
  title: "Notifications",
};

export default async function NotificationsPage() {
  const user = await getAuthUser();

  return <NotificationsPageContent userId={user.id} />;
}
