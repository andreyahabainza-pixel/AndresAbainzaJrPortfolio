import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Barcode,
  Box,
  Calculator,
  Download,
  History,
  LogOut,
  Minus,
  PackagePlus,
  Plus,
  Printer,
  Receipt,
  Search,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  UserRound,
  WifiOff,
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });
const dateFmt = new Intl.DateTimeFormat("en-PH", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

type Product = Database["public"]["Tables"]["products"]["Row"];
type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
type TransactionItem = Database["public"]["Tables"]["transaction_items"]["Row"];
type Role = "admin" | "cashier";
type CartItem = Product & { quantity: number };
type Profile = { full_name: string; username: string; user_id: string };

type QueuedSale = { id: string; items: { product_id: string; quantity: number }[]; payment: number };


const productSchema = z.object({
  name: z.string().trim().min(1).max(120),
  barcode: z.string().trim().min(3).max(80),
  price: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0),
});

const readQueue = (): QueuedSale[] => {
  try {
    return JSON.parse(localStorage.getItem("pos-offline-sales") || "[]");
  } catch {
    return [];
  }
};

const writeQueue = (queue: QueuedSale[]) => localStorage.setItem("pos-offline-sales", JSON.stringify(queue));

const Index = () => {
  const { toast } = useToast();
  const [sessionReady, setSessionReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authForm, setAuthForm] = useState({ email: "", password: "" });
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionItems, setTransactionItems] = useState<TransactionItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [preview, setPreview] = useState<Product | null>(null);
  const [scanError, setScanError] = useState("");
  const [payment, setPayment] = useState("");
  const [period, setPeriod] = useState("daily");
  const [activeTab, setActiveTab] = useState("pos");
  const [productForm, setProductForm] = useState({ name: "", barcode: "", price: "", stock: "" });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [receiptTxn, setReceiptTxn] = useState<Transaction | null>(null);
  const [queuedSales, setQueuedSales] = useState<QueuedSale[]>(readQueue());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const barcodeRef = useRef<HTMLInputElement>(null);

  const total = useMemo(() => cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0), [cart]);
  const change = Math.max((Number(payment) || 0) - total, 0);

  const playBeep = useCallback(() => {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.08);
  }, []);

  const loadData = useCallback(async () => {
    const [{ data: productRows }, { data: transactionRows }, { data: itemRows }] = await Promise.all([
      supabase.from("products").select("*").order("name"),
      supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("transaction_items").select("*").order("created_at", { ascending: false }).limit(300),
    ]);
    setProducts(productRows || []);
    setTransactions(transactionRows || []);
    setTransactionItems(itemRows || []);
  }, []);

  const loadAccount = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    setUserId(user?.id || null);
    if (!user) {
      setRole(null);
      setProfile(null);
      setSessionReady(true);
      return;
    }

    const [{ data: roles }, { data: profiles }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", user.id),
      supabase.from("staff_profiles").select("user_id, username, full_name").eq("user_id", user.id).maybeSingle(),
    ]);

    const userRole: Role | null =
  roles?.some((row) => row.role === "admin")
    ? "admin"
    : (roles?.[0]?.role as Role) || null;

setRole(userRole);
setProfile(profiles || null);
setSessionReady(true);

if (userRole) await loadData();
    setRole(userRole);
    setProfile(profiles || null);
    setSessionReady(true);
    if (userRole) await loadData();
  }, [loadData]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(() => {
      setTimeout(loadAccount, 0);
    });
    loadAccount();
    return () => data.subscription.unsubscribe();
  }, [loadAccount]);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    let timeout: number;
    const reset = () => {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => supabase.auth.signOut(), 15 * 60 * 1000);
    };
    ["mousemove", "keydown", "click", "touchstart"].forEach((event) => window.addEventListener(event, reset));
    reset();
    return () => {
      window.clearTimeout(timeout);
      ["mousemove", "keydown", "click", "touchstart"].forEach((event) => window.removeEventListener(event, reset));
    };
  }, [userId]);

  const syncQueuedSales = useCallback(async () => {
    if (!isOnline || queuedSales.length === 0 || !role) return;
    const remaining: QueuedSale[] = [];
    for (const sale of queuedSales) {
      const { error } = await (supabase.rpc as unknown as (fn: string, args: Record<string, unknown>) => Promise<{ data: string | null; error: Error | null }>)("complete_sale", {
        _items: sale.items,
        _payment: sale.payment,
      });
      if (error) remaining.push(sale);
    }
    setQueuedSales(remaining);
    writeQueue(remaining);
    if (remaining.length === 0) {
      toast({ title: "Offline sales synced", description: "Queued sales were uploaded successfully." });
      await loadData();
    }
  }, [isOnline, loadData, queuedSales, role, toast]);

  useEffect(() => {
    syncQueuedSales();
  }, [syncQueuedSales]);

  const handleAuth = async () => {
    const email = authForm.email.trim();
    const password = authForm.password;
    if (!email || !password) {
      toast({ title: "Missing credentials", description: "Enter email and password.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast({ title: "Login failed", description: error.message, variant: "destructive" });
  };

  const handleForgotPassword = async () => {
    const email = authForm.email.trim();
    if (!email) {
      toast({ title: "Email required", description: "Enter your email above first, then click Forgot password.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: "Reset failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Reset email sent", description: `Check ${email} for a link to set a new password.` });
    }
  };

const scanBarcode = () => {
  const code = barcodeInput.trim().toLowerCase();
  if (!code) return;

  const product = products.find(
    (item) =>
      (
        item.barcode.toLowerCase() === code ||
        item.name.toLowerCase().includes(code)
      )
  );

  if (!product) {
    setPreview(null);
    setScanError("Product not found (try barcode or name search).");
    toast({
      title: "Product not found",
      description: code,
      variant: "destructive",
    });
    return;
  }

  setPreview(product);
  setScanError("");
  playBeep();
};

  const addToCart = (product = preview) => {
    if (!product) return;
    const existing = cart.find((item) => item.id === product.id);
    const nextQuantity = (existing?.quantity || 0) + 1;
    if (product.stock <= 0 || nextQuantity > product.stock) {
      toast({ title: "Out of stock", description: `${product.name} has no available stock.`, variant: "destructive" });
      return;
    }
    setCart((current) => {
      if (current.some((item) => item.id === product.id)) return current.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      return [...current, { ...product, quantity: 1 }];
    });
    setBarcodeInput("");
    barcodeRef.current?.focus();
  };

  const requestRemove = (productId: string) => {
    setCart((current) =>
      current
        .map((item) => (item.id === productId ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0),
    );
  };

  const checkout = async () => {
    if (cart.length === 0) {
      toast({ title: "Cart is empty", description: "Scan and add products before SOLD.", variant: "destructive" });
      return;
    }
    if ((Number(payment) || 0) < total) {
      toast({ title: "Payment too low", description: "Customer payment must cover the total.", variant: "destructive" });
      return;
    }
    const items = cart.map((item) => ({ product_id: item.id, quantity: item.quantity }));

    if (!navigator.onLine) {
      const nextQueue = [...queuedSales, { id: crypto.randomUUID(), items, payment: Number(payment) }];
      setQueuedSales(nextQueue);
      writeQueue(nextQueue);
      setCart([]);
      setPayment("");
      toast({ title: "Saved offline", description: "Sale will sync when internet returns." });
      return;
    }

    const { data, error } = await (supabase.rpc as unknown as (fn: string, args: Record<string, unknown>) => Promise<{ data: string | null; error: Error | null }>)("complete_sale", {
      _items: items,
      _payment: Number(payment),
    });
    if (error) {
      toast({ title: "Checkout failed", description: error.message, variant: "destructive" });
      return;
    }
    setCart([]);
    setPayment("");
    await loadData();
    const txn = (await supabase.from("transactions").select("*").eq("id", data || "").maybeSingle()).data;
    if (txn) setReceiptTxn(txn);
    toast({ title: "Sale completed", description: "Stock deducted and transaction saved." });
  };

  const saveProduct = async () => {
    const parsed = productSchema.safeParse(productForm);
    if (!parsed.success) {
      toast({ title: "Invalid product", description: "Complete product name, unique barcode, price, and stock.", variant: "destructive" });
      return;
    }
    const payload = {
      name: parsed.data.name as string,
      barcode: parsed.data.barcode as string,
      price: parsed.data.price as number,
      stock: parsed.data.stock as number,
    };
    const request = editingProduct
      ? supabase.from("products").update(payload).eq("id", editingProduct.id)
      : supabase.from("products").insert(payload);
    const { error } = await request;
    if (error) {
      toast({ title: "Product not saved", description: error.message, variant: "destructive" });
      return;
    }
    setProductForm({ name: "", barcode: "", price: "", stock: "" });
    setEditingProduct(null);
    await loadData();
    toast({ title: editingProduct ? "Product updated" : "Product added" });
  };

  const editProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({ name: product.name, barcode: product.barcode, price: String(product.price), stock: String(product.stock) });
  };

  const deleteProduct = async (productId: string) => {
    const { error } = await supabase.from("products").delete().eq("id", productId);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else {
      await loadData();
      toast({ title: "Product deleted" });
    }
  };

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return products;
    return products.filter((product) => product.name.toLowerCase().includes(term) || product.barcode.toLowerCase().includes(term));
  }, [products, searchTerm]);

  const periodStart = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    if (period === "daily") start.setHours(0, 0, 0, 0);
    if (period === "weekly") start.setDate(now.getDate() - 7);
    if (period === "monthly") start.setMonth(now.getMonth() - 1);
    if (period === "yearly") start.setFullYear(now.getFullYear() - 1);
    return start;
  }, [period]);

  const scopedTransactions = useMemo(() => transactions.filter((txn) => new Date(txn.created_at) >= periodStart), [periodStart, transactions]);
  const scopedIds = useMemo(() => new Set(scopedTransactions.map((txn) => txn.id)), [scopedTransactions]);
  const scopedItems = useMemo(() => transactionItems.filter((item) => scopedIds.has(item.transaction_id)), [scopedIds, transactionItems]);

  const stats = useMemo(() => {
    const income = scopedTransactions.reduce((sum, txn) => sum + Number(txn.total), 0);
    const itemsSold = scopedItems.reduce((sum, item) => sum + item.quantity, 0);
    const stock = products.reduce((sum, product) => sum + product.stock, 0);
    return { sales: scopedTransactions.length, income, itemsSold, stock };
  }, [products, scopedItems, scopedTransactions]);

  const salesByDay = useMemo(() => {
    const grouped = new Map<string, number>();
    scopedTransactions.forEach((txn) => {
      const key = new Date(txn.created_at).toLocaleDateString("en-PH", { month: "short", day: "2-digit" });
      grouped.set(key, (grouped.get(key) || 0) + Number(txn.total));
    });
    return Array.from(grouped, ([date, totalValue]) => ({ date, total: totalValue })).reverse();
  }, [scopedTransactions]);

  const topProducts = useMemo(() => {
    const grouped = new Map<string, number>();
    scopedItems.forEach((item) => grouped.set(item.product_name, (grouped.get(item.product_name) || 0) + item.quantity));
    return Array.from(grouped, ([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [scopedItems]);

  const exportCsv = () => {
    const rows = [["Date", "Transaction No", "Cashier", "Total", "Payment", "Change"]].concat(
      transactions.map((txn) => [dateFmt.format(new Date(txn.created_at)), txn.transaction_no, txn.cashier_name, String(txn.total), String(txn.payment), String(txn.change_amount)]),
    );
    const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "pos-transactions.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const receiptItems = useMemo(() => transactionItems.filter((item) => item.transaction_id === receiptTxn?.id), [receiptTxn, transactionItems]);

  if (!sessionReady) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-foreground">Loading POS...</div>;
  }

  if (!userId || !role) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <section className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-between border-b border-border p-6 lg:border-b-0 lg:border-r lg:p-10">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Barcode className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-normal">Smart Barcode POS</h1>
                <p className="text-sm text-muted-foreground">Inventory, sales, and dashboard control.</p>
              </div>
            </div>
            <div className="my-12 max-w-2xl space-y-6">
              <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">Real-world store workflow</Badge>
              <h2 className="text-4xl font-bold tracking-normal md:text-6xl">Fast barcode checkout with stock control.</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {["Manual ADD to cart", "Secure SOLD checkout", "Low stock alerts"].map((item) => (
                  <div key={item} className="rounded-md border border-border bg-card p-4 text-sm font-medium text-card-foreground">{item}</div>
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Staff accounts are provisioned by the Administrator. Use your assigned email and password to log in.</p>
          </div>

          <div className="flex items-center justify-center p-6 lg:p-10">
            <Card className="w-full max-w-md card-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Staff Login</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} placeholder="staff@store.com" />
                </div>
                <div className="grid gap-2">
                  <Label>Password</Label>
                  <Input type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") handleAuth(); }} placeholder="••••••••" />
                </div>
                <Button className="w-full" size="lg" onClick={handleAuth}>Login</Button>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="w-full text-sm text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between gap-4 px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground"><Barcode className="h-6 w-6" /></div>
            <div>
              <h1 className="text-lg font-bold tracking-normal">Smart Barcode POS & Inventory</h1>
              <p className="text-xs text-muted-foreground">{profile?.full_name || "Staff"} · {role.toUpperCase()} {isOnline ? "" : "· Offline"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {queuedSales.length > 0 && <Badge variant="secondary"><WifiOff className="mr-1 h-3 w-3" /> {queuedSales.length} queued</Badge>}
            <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}><LogOut className="h-4 w-4" /> Logout</Button>
          </div>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 py-4 lg:px-6">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 md:grid-cols-5">
          <TabsTrigger value="pos"><ShoppingCart className="mr-2 h-4 w-4" /> POS</TabsTrigger>
          <TabsTrigger value="products"><Box className="mr-2 h-4 w-4" /> Products</TabsTrigger>
          <TabsTrigger value="dashboard"><BarChart3 className="mr-2 h-4 w-4" /> Dashboard</TabsTrigger>
          <TabsTrigger value="history"><History className="mr-2 h-4 w-4" /> History</TabsTrigger>
          <TabsTrigger value="account"><UserRound className="mr-2 h-4 w-4" /> Account</TabsTrigger>
        </TabsList>

        <TabsContent value="pos" className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="space-y-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><Barcode className="h-5 w-5 text-primary" /> Barcode and Name Scanner</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input ref={barcodeRef} value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") preview ? addToCart() : scanBarcode(); }} placeholder="Scan or type barcode, then Enter" className="h-14 text-lg" />
                  <Button size="lg" onClick={scanBarcode}><Search className="h-5 w-5" /> Scan</Button>
                </div>
                {scanError && <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{scanError}</div>}
                
              </CardContent>
            </Card>

            <Card className="min-h-[220px]">
              <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><PackagePlus className="h-5 w-5 text-primary" /> Product Preview</CardTitle></CardHeader>
              <CardContent>
                {preview ? (
                  <div className="space-y-4">
                    <div className="rounded-md border border-border bg-secondary p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-2xl font-bold">{preview.name}</p>
                          <p className="text-sm text-muted-foreground">Barcode: {preview.barcode}</p>
                        </div>
                        {preview.stock < 10 && <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" /> Low stock</Badge>}
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-md bg-background p-3"><p className="text-xs text-muted-foreground">Price</p><p className="text-xl font-bold text-primary">{peso.format(Number(preview.price))}</p></div>
                        <div className="rounded-md bg-background p-3"><p className="text-xs text-muted-foreground">Stock</p><p className="text-xl font-bold">{preview.stock}</p></div>
                      </div>
                    </div>
                    <Button className="h-14 w-full text-base" onClick={() => addToCart()} disabled={preview.stock <= 0}><Plus className="h-5 w-5" /> ADD</Button>
                  </div>
                ) : (
                  <div className="flex min-h-[150px] items-center justify-center rounded-md border border-dashed border-border text-center text-muted-foreground">Scan a barcode to preview the product.</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle>Search Results</CardTitle></CardHeader>
              <CardContent className="max-h-64 space-y-2 overflow-auto">
                {filteredProducts.slice(0, 8).map((product) => (
                  <button key={product.id} onClick={() => setPreview(product)} className="flex w-full items-center justify-between rounded-md border border-border bg-card p-3 text-left transition-colors hover:bg-secondary">
                    <span><span className="font-medium">{product.name}</span><span className="block text-xs text-muted-foreground">{product.barcode}</span></span>
                    <span className="text-sm font-semibold">{peso.format(Number(product.price))}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <Card className="xl:min-h-[620px]">
              <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-primary" /> Cart List</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="min-h-[300px] space-y-3">
                  {cart.length === 0 ? <div className="flex min-h-[260px] items-center justify-center rounded-md border border-dashed border-border text-muted-foreground">Cart is empty.</div> : cart.map((item) => (
                    <div key={item.id} className="grid grid-cols-[1fr_auto] gap-3 rounded-md border border-border bg-card p-4">
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{peso.format(Number(item.price))} x {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="min-w-20 text-right font-bold">{peso.format(Number(item.price) * item.quantity)}</p>
                        <Button variant="outline" size="icon" onClick={() => requestRemove(item.id)}><Minus className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-md border border-border bg-secondary p-4">
                  <div className="flex items-center justify-between text-lg font-bold"><span>TOTAL</span><span className="text-primary">{peso.format(total)}</span></div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-2"><Label>Cash Payment</Label><Input inputMode="decimal" value={payment} onChange={(e) => setPayment(e.target.value)} placeholder="0.00" /></div>
                    <div className="rounded-md bg-background p-3"><p className="text-xs text-muted-foreground">Change</p><p className="text-xl font-bold">{peso.format(change)}</p></div>
                  </div>
                  <Button className="mt-4 h-14 w-full text-base" onClick={checkout}><Calculator className="h-5 w-5" /> SOLD</Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </TabsContent>

        <TabsContent value="products" className="mt-4 grid gap-4 xl:grid-cols-[420px_1fr]">
          <Card>
            <CardHeader><CardTitle>{editingProduct ? "Edit Product" : "Add Product"}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {role !== "admin" && <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">Admin only can add, edit, or delete products.</div>}
              <div className="grid gap-2"><Label>Product Name</Label><Input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Barcode</Label><Input value={productForm.barcode} onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2"><Label>Price</Label><Input inputMode="decimal" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} /></div>
                <div className="grid gap-2"><Label>Stock</Label><Input inputMode="numeric" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} /></div>
              </div>
              <Button className="w-full" onClick={saveProduct} disabled={role !== "admin"}>{editingProduct ? "Update Product" : "Save Product"}</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>All Products</CardTitle></CardHeader>
            <CardContent className="overflow-auto">
              <div className="min-w-[720px] divide-y divide-border rounded-md border border-border">
                {products.map((product) => (
                  <div key={product.id} className="grid grid-cols-[1.3fr_1fr_0.7fr_0.6fr_auto] items-center gap-3 p-3">
                    <div><p className="font-medium">{product.name}</p><p className="text-xs text-muted-foreground">{product.barcode}</p></div>
                    <p>{peso.format(Number(product.price))}</p>
                    <Badge variant={product.stock < 10 ? "destructive" : "secondary"}>{product.stock} stock</Badge>
                    <Button variant="outline" size="sm" onClick={() => editProduct(product)} disabled={role !== "admin"}>Edit</Button>
                    <Button variant="destructive" size="icon" onClick={() => deleteProduct(product.id)} disabled={role !== "admin"}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold tracking-normal">Admin Dashboard</h2>
            <Select value={period} onValueChange={setPeriod}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="yearly">Yearly</SelectItem></SelectContent></Select>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {[{ label: "Total Sales", value: stats.sales }, { label: "Total Income", value: peso.format(stats.income) }, { label: "Items Sold", value: stats.itemsSold }, { label: "Remaining Stock", value: stats.stock }].map((stat) => <Card key={stat.label}><CardContent className="p-5"><p className="text-sm text-muted-foreground">{stat.label}</p><p className="mt-2 text-2xl font-bold">{stat.value}</p></CardContent></Card>)}
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <Card><CardHeader><CardTitle>Sales per Day</CardTitle></CardHeader><CardContent className="h-80"><ResponsiveContainer><AreaChart data={salesByDay}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" /><YAxis stroke="hsl(var(--muted-foreground))" /><Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} /><Area dataKey="total" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" /></AreaChart></ResponsiveContainer></CardContent></Card>
            <Card><CardHeader><CardTitle>Top-selling Products</CardTitle></CardHeader><CardContent className="h-80"><ResponsiveContainer><BarChart data={topProducts}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" /><YAxis stroke="hsl(var(--muted-foreground))" /><Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} /><Bar dataKey="qty" fill="hsl(var(--accent))" /></BarChart></ResponsiveContainer></CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-bold tracking-normal">Transaction History</h2><Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4" /> Export CSV</Button></div>
          <Card><CardContent className="overflow-auto p-0"><div className="min-w-[820px] divide-y divide-border">{transactions.map((txn) => <button key={txn.id} onClick={() => setReceiptTxn(txn)} className="grid w-full grid-cols-[1fr_1fr_1fr_1fr_auto] items-center gap-4 p-4 text-left hover:bg-secondary"><span>{dateFmt.format(new Date(txn.created_at))}</span><span>{txn.transaction_no}</span><span>{txn.cashier_name}</span><span className="font-bold text-primary">{peso.format(Number(txn.total))}</span><Receipt className="h-4 w-4" /></button>)}</div></CardContent></Card>
        </TabsContent>

        <TabsContent value="account" className="mt-4 grid gap-4 md:grid-cols-2">
          <Card><CardHeader><CardTitle>Staff Account</CardTitle></CardHeader><CardContent className="space-y-3"><p><span className="text-muted-foreground">Name:</span> {profile?.full_name}</p><p><span className="text-muted-foreground">Username:</span> {profile?.username}</p><p><span className="text-muted-foreground">Role:</span> {role}</p><p><span className="text-muted-foreground">Auto logout:</span> 15 minutes inactive</p></CardContent></Card>
          <Card><CardHeader><CardTitle>System Status</CardTitle></CardHeader><CardContent className="space-y-3"><p><span className="text-muted-foreground">Connection:</span> {isOnline ? "Online" : "Offline mode"}</p><p><span className="text-muted-foreground">Queued sales:</span> {queuedSales.length}</p><Button variant="outline" onClick={syncQueuedSales}>Sync Now</Button></CardContent></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!receiptTxn} onOpenChange={(open) => !open && setReceiptTxn(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Printable Receipt</DialogTitle><DialogDescription>{receiptTxn?.transaction_no}</DialogDescription></DialogHeader>
          {receiptTxn && <div className="space-y-3 rounded-md border border-border p-4"><div className="text-center"><p className="font-bold">Smart Barcode POS</p><p className="text-xs text-muted-foreground">{dateFmt.format(new Date(receiptTxn.created_at))}</p><p className="text-xs text-muted-foreground">Cashier: {receiptTxn.cashier_name}</p></div><div className="divide-y divide-border">{receiptItems.map((item) => <div key={item.id} className="flex justify-between py-2 text-sm"><span>{item.product_name} x{item.quantity}</span><span>{peso.format(Number(item.price) * item.quantity)}</span></div>)}</div><div className="space-y-1 border-t border-border pt-3 text-sm"><div className="flex justify-between font-bold"><span>Total</span><span>{peso.format(Number(receiptTxn.total))}</span></div><div className="flex justify-between"><span>Payment</span><span>{peso.format(Number(receiptTxn.payment))}</span></div><div className="flex justify-between"><span>Change</span><span>{peso.format(Number(receiptTxn.change_amount))}</span></div></div></div>}
          <DialogFooter><Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Index;
