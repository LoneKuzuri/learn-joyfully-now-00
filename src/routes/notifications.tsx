import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — LearnHub" }] }),
  component: NotificationsPage,
});

const items = [
  { title: "New course assigned", body: "Workplace Compliance Essentials is due June 30.", time: "2h ago", unread: true },
  { title: "Deadline approaching", body: "Product Onboarding 2026 is due in 14 days.", time: "Yesterday", unread: true },
  { title: "Certificate ready", body: "Your Cybersecurity Awareness certificate is available.", time: "3 days ago", unread: false },
  { title: "Cohort message", body: "Marco posted in Leadership Foundations discussion.", time: "1 week ago", unread: false },
];

function NotificationsPage() {
  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground">Updates from your learning activity</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Inbox</CardTitle></CardHeader>
        <CardContent className="divide-y">
          {items.map((n, i) => (
            <div key={i} className="flex gap-3 py-3">
              <div className={`mt-1 p-2 rounded-md ${n.unread ? "bg-primary/10" : "bg-muted"}`}>
                {n.unread ? <Bell className="h-4 w-4 text-primary" /> : <CheckCircle2 className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between gap-3">
                  <div className="font-medium text-sm">{n.title}</div>
                  <div className="text-xs text-muted-foreground">{n.time}</div>
                </div>
                <div className="text-sm text-muted-foreground">{n.body}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
