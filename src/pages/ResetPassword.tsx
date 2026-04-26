import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ResetPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase auto-handles the recovery token in the URL hash and creates a session.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setEmail(session.user.email ?? null);
        setNewEmail(session.user.email ?? "");
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setEmail(data.session.user.email ?? null);
        setNewEmail(data.session.user.email ?? "");
      }
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleUpdate = async () => {
    if (!password || password.length < 6) {
      toast({ title: "Weak password", description: "Use at least 6 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setLoading(true);
    const updates: { password: string; email?: string } = { password };
    if (newEmail.trim() && newEmail.trim() !== email) {
      updates.email = newEmail.trim();
    }
    const { error } = await supabase.auth.updateUser(updates);
    setLoading(false);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Account updated",
      description: updates.email
        ? "Password changed. Check your new email inbox to confirm the email change."
        : "Password changed. You can now log in.",
    });
    await supabase.auth.signOut();
    navigate("/");
  };

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }

  if (!email) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Reset link invalid or expired</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Open the latest password reset email and click the link again, or request a new one from the login page.
            </p>
            <Button className="w-full" onClick={() => navigate("/")}>Back to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> Update Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="you@store.com"
            />
            <p className="text-xs text-muted-foreground">
              Changing email sends a confirmation to the new address.
            </p>
          </div>
          <div className="grid gap-2">
            <Label>New Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div className="grid gap-2">
            <Label>Confirm New Password</Label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              onKeyDown={(e) => { if (e.key === "Enter") handleUpdate(); }}
            />
          </div>
          <Button className="w-full" size="lg" onClick={handleUpdate} disabled={loading}>
            {loading ? "Saving…" : "Save Changes"}
          </Button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-full text-sm text-muted-foreground hover:underline"
          >
            Back to Login
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
