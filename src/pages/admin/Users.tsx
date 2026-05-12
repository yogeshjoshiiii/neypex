import { useEffect, useState } from "react";
import { allUsers, allPurchases, type PurchaseRow } from "@/lib/library";
import { npr } from "@/lib/format";
import { Mail, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

type UserRow = { email: string; clerk_user_id: string; purchases: number; spent: number; lastSeen: number; devices: number };

const Users = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);

  useEffect(() => {
    allUsers().then(setUsers);
    allPurchases().then(setPurchases);
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-6 animate-fade-in">
        <h3 className="font-semibold mb-4">All users</h3>
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground">No users have purchased yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Clerk ID</th>
                  <th className="py-2 pr-4">Purchases</th>
                  <th className="py-2 pr-4">Spent</th>
                  <th className="py-2 pr-4">Devices</th>
                  <th className="py-2 pr-4">Last active</th>
                  <th className="py-2 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map(u => (
                  <tr key={u.clerk_user_id} className="hover:bg-secondary/30">
                    <td className="py-3 pr-4 font-medium">{u.email}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">{u.clerk_user_id.slice(0, 12)}…</td>
                    <td className="py-3 pr-4">{u.purchases}</td>
                    <td className="py-3 pr-4 text-primary">{npr(u.spent)}</td>
                    <td className="py-3 pr-4">{u.devices}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{new Date(u.lastSeen).toLocaleString()}</td>
                    <td className="py-3 pr-4">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => toast({ title: "Email drafted", description: `Compose to ${u.email}` })}>
                          <Mail className="w-3.5 h-3.5" /> Email
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => toast({ title: "User suspended", description: u.email, variant: "destructive" })}>
                          <Ban className="w-3.5 h-3.5" /> Suspend
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl p-6 animate-fade-in">
        <h3 className="font-semibold mb-4">Recent activity</h3>
        <ul className="divide-y divide-border text-sm">
          {purchases.slice(0, 15).map((p) => (
            <li key={p.id} className="py-2 flex items-center gap-3 flex-wrap">
              <span className="font-mono text-xs text-muted-foreground">{new Date(p.purchased_at).toLocaleString()}</span>
              <span className="font-medium">{p.email}</span>
              <span className="text-muted-foreground">bought</span>
              <span className="font-mono text-xs">{p.movie_id.slice(0, 8)}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary">{p.device_label}</span>
              <span className="ml-auto text-primary">{npr(p.price_paid)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Users;
