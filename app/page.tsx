"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

type TabKey = "dashboard" | "clienti" | "misure" | "ordini" | "preventivi";

type ClientRecord = {
  id?: string;
  created_at?: string;
  name?: string;
  city?: string;
  phone?: string;
  email?: string;
  notes?: string;
  chest?: string;
  waist?: string;
  hip?: string;
  shoulder?: string;
  sleeve?: string;
  neck?: string;
  inseam?: string;
  outseam?: string;
  [key: string]: unknown;
};

type OrderRecord = {
  id?: string;
  client_id?: string;
  garment?: string;
  construction?: string;
  status?: string;
  price?: number | null;
  advance?: number | null;
  notes?: string | null;
  due_date?: string | null;
  created_at?: string;
  [key: string]: unknown;
};

type QuoteRecord = {
  id?: string;
  client_id?: string;
  garment?: string;
  description?: string | null;
  base_price?: number | null;
  extras?: number | null;
  deposit?: number | null;
  total?: number | null;
  status?: string | null;
  created_at?: string;
  [key: string]: unknown;
};

type ClientFormState = {
  name: string;
  city: string;
  phone: string;
  email: string;
  notes: string;
  chest: string;
  waist: string;
  hip: string;
  shoulder: string;
  sleeve: string;
  neck: string;
  inseam: string;
  outseam: string;
};

type OrderFormState = {
  client_id: string;
  garment: string;
  construction: string;
  status: string;
  price: string;
  advance: string;
  notes: string;
  due_date: string;
};

type QuoteFormState = {
  client_id: string;
  garment: string;
  description: string;
  base_price: string;
  extras: string;
  deposit: string;
  total: string;
  status: string;
};

const initialClientForm: ClientFormState = {
  name: "",
  city: "",
  phone: "",
  email: "",
  notes: "",
  chest: "",
  waist: "",
  hip: "",
  shoulder: "",
  sleeve: "",
  neck: "",
  inseam: "",
  outseam: "",
};

const initialOrderForm: OrderFormState = {
  client_id: "",
  garment: "",
  construction: "",
  status: "Aperto",
  price: "",
  advance: "",
  notes: "",
  due_date: "",
};

const initialQuoteForm: QuoteFormState = {
  client_id: "",
  garment: "",
  description: "",
  base_price: "",
  extras: "",
  deposit: "",
  total: "",
  status: "Bozza",
};

const todayTasksDefault = [
  "Controllare gli ordini in stato Prova",
  "Registrare gli acconti ricevuti",
];

function euro(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function toNumberOrNull(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isNaN(parsed) ? null : parsed;
}

function getClientName(client: ClientRecord) {
  return String(client.name || "Nuovo cliente");
}

function getClientCity(client: ClientRecord) {
  return String(client.city || "");
}

function getClientPhone(client: ClientRecord) {
  return String(client.phone || "");
}

function getClientEmail(client: ClientRecord) {
  return String(client.email || "");
}

function getClientNotes(client: ClientRecord) {
  return String(client.notes || "");
}

function getMeasure(client: ClientRecord, key: keyof ClientRecord) {
  const value = client[key];
  if (value === null || value === undefined) return "";
  return String(value);
}

function isOrderOpen(order: OrderRecord) {
  const status = String(order.status || "").toLowerCase();
  if (!status) return true;
  return !["consegnato", "chiuso", "closed", "delivered"].includes(status);
}

export default function Page() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  const supabase: SupabaseClient | null = useMemo(() => {
    if (!supabaseUrl || !supabaseAnonKey) return null;
    try {
      return createClient(supabaseUrl, supabaseAnonKey);
    } catch {
      return null;
    }
  }, [supabaseUrl, supabaseAnonKey]);

  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);

  const [savingClient, setSavingClient] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [savingQuote, setSavingQuote] = useState(false);

  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [deletingQuoteId, setDeletingQuoteId] = useState<string | null>(null);

  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);
  const [showClientEditor, setShowClientEditor] = useState(false);

  const [clientSearch, setClientSearch] = useState("");
  const [clientForm, setClientForm] = useState<ClientFormState>(initialClientForm);
  const [orderForm, setOrderForm] = useState<OrderFormState>(initialOrderForm);
  const [quoteForm, setQuoteForm] = useState<QuoteFormState>(initialQuoteForm);

  const [taskInput, setTaskInput] = useState("");
  const [tasks, setTasks] = useState<string[]>(todayTasksDefault);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 900);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setError("Configurazione Supabase mancante o non valida.");
      return;
    }
    void loadAllData(false);
  }, [supabase]);

  async function loadAllData(showSoftError: boolean) {
    if (!supabase) return;

    setLoading(true);
    if (!showSoftError) setError("");

    try {
      const [clientsRes, ordersRes, quotesRes] = await Promise.allSettled([
        supabase.from("clients").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("quotes").select("*").order("created_at", { ascending: false }),
      ]);

      const nextErrors: string[] = [];

      if (clientsRes.status === "fulfilled") {
        if (clientsRes.value.error) {
          nextErrors.push(`clients: ${clientsRes.value.error.message}`);
        } else {
          setClients((clientsRes.value.data as ClientRecord[]) || []);
        }
      } else {
        nextErrors.push("clients: Load failed");
      }

      if (ordersRes.status === "fulfilled") {
        if (ordersRes.value.error) {
          nextErrors.push(`orders: ${ordersRes.value.error.message}`);
        } else {
          setOrders((ordersRes.value.data as OrderRecord[]) || []);
        }
      } else {
        nextErrors.push("orders: Load failed");
      }

      if (quotesRes.status === "fulfilled") {
        if (quotesRes.value.error) {
          nextErrors.push(`quotes: ${quotesRes.value.error.message}`);
        } else {
          setQuotes((quotesRes.value.data as QuoteRecord[]) || []);
        }
      } else {
        nextErrors.push("quotes: Load failed");
      }

      if (nextErrors.length === 3) {
        setError(`Errore: ${nextErrors[0]}`);
      } else {
        setError("");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Caricamento non riuscito.";
      setError(`Errore: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  function openNewClient() {
    setSelectedClient(null);
    setClientForm(initialClientForm);
    setShowClientEditor(true);
    setActiveTab("clienti");
  }

  function openClient(client: ClientRecord) {
    setSelectedClient(client);
    setClientForm({
      name: getClientName(client),
      city: getClientCity(client),
      phone: getClientPhone(client),
      email: getClientEmail(client),
      notes: getClientNotes(client),
      chest: getMeasure(client, "chest"),
      waist: getMeasure(client, "waist"),
      hip: getMeasure(client, "hip"),
      shoulder: getMeasure(client, "shoulder"),
      sleeve: getMeasure(client, "sleeve"),
      neck: getMeasure(client, "neck"),
      inseam: getMeasure(client, "inseam"),
      outseam: getMeasure(client, "outseam"),
    });
    setShowClientEditor(true);
    setActiveTab("clienti");
  }

  async function saveClient() {
    if (!supabase) {
      setError("Supabase non configurato.");
      return;
    }

    setSavingClient(true);
    setError("");

    const payload = {
      name: clientForm.name.trim() || "Cliente senza nome",
      city: clientForm.city.trim() || null,
      phone: clientForm.phone.trim() || null,
      email: clientForm.email.trim() || null,
      notes: clientForm.notes.trim() || null,
      chest: clientForm.chest.trim() || null,
      waist: clientForm.waist.trim() || null,
      hip: clientForm.hip.trim() || null,
      shoulder: clientForm.shoulder.trim() || null,
      sleeve: clientForm.sleeve.trim() || null,
      neck: clientForm.neck.trim() || null,
      inseam: clientForm.inseam.trim() || null,
      outseam: clientForm.outseam.trim() || null,
    };

    try {
      let result;

      if (selectedClient?.id) {
        result = await supabase
          .from("clients")
          .update(payload)
          .eq("id", selectedClient.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from("clients")
          .insert(payload)
          .select()
          .single();
      }

      if (result.error) {
        console.error("Supabase save client error:", result.error);
        throw new Error(result.error.message);
      }

      await loadAllData(true);

      if (result.data) {
        openClient(result.data as ClientRecord);
      } else {
        setShowClientEditor(false);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Salvataggio non riuscito.";
      setError(`Errore: ${message}`);
    } finally {
      setSavingClient(false);
    }
  }

  async function saveOrder() {
    if (!supabase) {
      setError("Supabase non configurato.");
      return;
    }

    if (!orderForm.client_id) {
      setError("Seleziona un cliente per l'ordine.");
      return;
    }

    setSavingOrder(true);
    setError("");

    const payload = {
      client_id: orderForm.client_id,
      garment: orderForm.garment.trim() || null,
      construction: orderForm.construction.trim() || null,
      status: orderForm.status.trim() || null,
      price: toNumberOrNull(orderForm.price),
      advance: toNumberOrNull(orderForm.advance),
      notes: orderForm.notes.trim() || null,
      due_date: orderForm.due_date || null,
    };

    try {
      const result = await supabase.from("orders").insert(payload).select().single();

      if (result.error) {
        console.error("Supabase save order error:", result.error);
        throw new Error(result.error.message);
      }

      setOrderForm(initialOrderForm);
      await loadAllData(true);
      setActiveTab("ordini");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Salvataggio ordine non riuscito.";
      setError(`Errore: ${message}`);
    } finally {
      setSavingOrder(false);
    }
  }

  async function saveQuote() {
    if (!supabase) {
      setError("Supabase non configurato.");
      return;
    }

    if (!quoteForm.client_id) {
      setError("Seleziona un cliente per il preventivo.");
      return;
    }

    setSavingQuote(true);
    setError("");

    const payload = {
      client_id: quoteForm.client_id,
      garment: quoteForm.garment.trim() || null,
      description: quoteForm.description.trim() || null,
      base_price: toNumberOrNull(quoteForm.base_price),
      extras: toNumberOrNull(quoteForm.extras),
      deposit: toNumberOrNull(quoteForm.deposit),
      total: toNumberOrNull(quoteForm.total),
      status: quoteForm.status.trim() || null,
    };

    try {
      const result = await supabase.from("quotes").insert(payload).select().single();

      if (result.error) {
        console.error("Supabase save quote error:", result.error);
        throw new Error(result.error.message);
      }

      setQuoteForm(initialQuoteForm);
      await loadAllData(true);
      setActiveTab("preventivi");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Salvataggio preventivo non riuscito.";
      setError(`Errore: ${message}`);
    } finally {
      setSavingQuote(false);
    }
  }

  async function deleteClient(id?: string) {
    if (!supabase || !id) return;
    const confirmed = window.confirm("Vuoi eliminare questo cliente?");
    if (!confirmed) return;

    setDeletingClientId(id);
    setError("");

    try {
      const result = await supabase.from("clients").delete().eq("id", id);

      if (result.error) {
        console.error("Supabase delete client error:", result.error);
        throw new Error(result.error.message);
      }

      if (selectedClient?.id === id) {
        setSelectedClient(null);
        setShowClientEditor(false);
        setClientForm(initialClientForm);
      }

      await loadAllData(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Eliminazione cliente non riuscita.";
      setError(`Errore: ${message}`);
    } finally {
      setDeletingClientId(null);
    }
  }

  async function deleteOrder(id?: string) {
    if (!supabase || !id) return;
    const confirmed = window.confirm("Vuoi eliminare questo ordine?");
    if (!confirmed) return;

    setDeletingOrderId(id);
    setError("");

    try {
      const result = await supabase.from("orders").delete().eq("id", id);

      if (result.error) {
        console.error("Supabase delete order error:", result.error);
        throw new Error(result.error.message);
      }

      await loadAllData(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Eliminazione ordine non riuscita.";
      setError(`Errore: ${message}`);
    } finally {
      setDeletingOrderId(null);
    }
  }

  async function deleteQuote(id?: string) {
    if (!supabase || !id) return;
    const confirmed = window.confirm("Vuoi eliminare questo preventivo?");
    if (!confirmed) return;

    setDeletingQuoteId(id);
    setError("");

    try {
      const result = await supabase.from("quotes").delete().eq("id", id);

      if (result.error) {
        console.error("Supabase delete quote error:", result.error);
        throw new Error(result.error.message);
      }

      await loadAllData(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Eliminazione preventivo non riuscita.";
      setError(`Errore: ${message}`);
    } finally {
      setDeletingQuoteId(null);
    }
  }

  const filteredClients = clients.filter((client) => {
    const haystack =
      `${getClientName(client)} ${getClientCity(client)} ${getClientPhone(client)} ${getClientEmail(client)}`
        .toLowerCase()
        .trim();
    return haystack.includes(clientSearch.toLowerCase().trim());
  });

  const openOrdersCount = orders.filter(isOrderOpen).length;

  const totalOrderValue = orders.reduce((sum, order) => {
    const value = Number(order.price ?? 0);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

  const totalDeposits = orders.reduce((sum, order) => {
    const value = Number(order.advance ?? 0);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

  function clientNameById(id?: string) {
    if (!id) return "Cliente";
    const client = clients.find((c) => c.id === id);
    return client ? getClientName(client) : "Cliente";
  }

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#f2f1ed",
      color: "#1a1a1a",
      padding: isMobile ? "24px 16px 40px" : "40px",
      fontFamily: "Arial, sans-serif",
    } as const,
    shell: {
      maxWidth: 1320,
      margin: "0 auto",
    } as const,
    brand: {
      fontSize: 14,
      letterSpacing: "0.35em",
      color: "#6f6b66",
      marginBottom: 10,
    } as const,
    titleRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: isMobile ? "flex-start" : "flex-end",
      gap: 16,
      flexDirection: isMobile ? "column" : "row",
      marginBottom: 28,
    } as const,
    h1: {
      fontSize: isMobile ? 40 : 74,
      lineHeight: 0.95,
      margin: 0,
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontWeight: 700,
    } as const,
    subtitle: {
      fontSize: isMobile ? 16 : 18,
      color: "#6f6b66",
      marginTop: 10,
    } as const,
    button: {
      borderRadius: 999,
      border: "1px solid #d9d2c8",
      background: "#fff",
      color: "#1a1a1a",
      padding: "14px 22px",
      fontSize: 16,
      cursor: "pointer",
      whiteSpace: "nowrap" as const,
    },
    buttonDark: {
      borderRadius: 999,
      border: "1px solid #111",
      background: "#111",
      color: "#fff",
      padding: "14px 22px",
      fontSize: 16,
      cursor: "pointer",
      whiteSpace: "nowrap" as const,
    },
    buttonDanger: {
      borderRadius: 999,
      border: "1px solid #d8b1ad",
      background: "#fff",
      color: "#c44334",
      padding: "10px 16px",
      fontSize: 14,
      cursor: "pointer",
      whiteSpace: "nowrap" as const,
    },
    error: {
      marginBottom: 20,
      borderRadius: 24,
      border: "1px solid #efc3be",
      background: "#f8e8e6",
      color: "#c44334",
      padding: "16px 18px",
      fontSize: 15,
    } as const,
    cardGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))",
      gap: 16,
      marginBottom: 28,
    } as const,
    statCard: {
      border: "1px solid #ddd4c8",
      borderRadius: 28,
      background: "#faf9f6",
      padding: isMobile ? "18px 16px" : "22px 24px",
      minHeight: isMobile ? 120 : 130,
    } as const,
    statLabel: {
      fontSize: 13,
      letterSpacing: "0.24em",
      textTransform: "uppercase" as const,
      color: "#8c867f",
      marginBottom: 18,
    } as const,
    statValue: {
      fontSize: isMobile ? 28 : 54,
      lineHeight: 1,
      fontWeight: 700,
    } as const,
    tabs: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap" as const,
      marginBottom: 28,
    } as const,
    tab: {
      borderRadius: 999,
      border: "1px solid #ddd4c8",
      background: "#f7f5f1",
      color: "#6d6862",
      padding: "10px 18px",
      fontSize: 15,
      cursor: "pointer",
    } as const,
    tabActive: {
      borderRadius: 999,
      border: "1px solid #111",
      background: "#111",
      color: "#fff",
      padding: "10px 18px",
      fontSize: 15,
      cursor: "pointer",
    } as const,
    sectionGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1.15fr 0.85fr",
      gap: 20,
      alignItems: "start",
    } as const,
    panel: {
      border: "1px solid #ddd4c8",
      borderRadius: 36,
      background: "#faf9f6",
      padding: isMobile ? "20px 16px" : "26px",
      minHeight: 320,
    } as const,
    panelTitle: {
      fontSize: isMobile ? 26 : 32,
      lineHeight: 1.05,
      margin: "0 0 18px 0",
      fontWeight: 700,
    } as const,
    muted: {
      color: "#7e7872",
      fontSize: isMobile ? 16 : 18,
    } as const,
    input: {
      width: "100%",
      borderRadius: 999,
      border: "1px solid #ddd4c8",
      background: "#fff",
      padding: "14px 16px",
      fontSize: 16,
      outline: "none",
      color: "#1a1a1a",
      boxSizing: "border-box" as const,
    },
    textarea: {
      width: "100%",
      borderRadius: 24,
      border: "1px solid #ddd4c8",
      background: "#fff",
      padding: "14px 16px",
      fontSize: 16,
      outline: "none",
      color: "#1a1a1a",
      resize: "vertical" as const,
      boxSizing: "border-box" as const,
      minHeight: 110,
    },
    fieldGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: 14,
    } as const,
    measuresGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
      gap: 14,
    } as const,
    fieldBlock: {
      marginBottom: 14,
    } as const,
    label: {
      fontSize: 13,
      letterSpacing: "0.18em",
      textTransform: "uppercase" as const,
      color: "#8a847d",
      marginBottom: 8,
      display: "block",
    } as const,
    list: {
      display: "grid",
      gap: 12,
      marginTop: 14,
    } as const,
    clientItem: {
      border: "1px solid #ddd4c8",
      background: "#fff",
      borderRadius: 26,
      padding: "16px 18px",
      cursor: "pointer",
    } as const,
    clientItemActive: {
      border: "1px solid #111",
      background: "#fff",
      borderRadius: 26,
      padding: "16px 18px",
      cursor: "pointer",
      boxShadow: "0 0 0 2px rgba(17,17,17,0.04)",
    } as const,
    rowBetween: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap" as const,
    } as const,
    helper: {
      fontSize: 14,
      color: "#8a847d",
    } as const,
    select: {
      width: "100%",
      borderRadius: 999,
      border: "1px solid #ddd4c8",
      background: "#fff",
      padding: "14px 16px",
      fontSize: 16,
      outline: "none",
      color: "#1a1a1a",
      boxSizing: "border-box" as const,
      appearance: "none" as const,
    },
  };

  function renderDashboard() {
    return (
      <div style={styles.sectionGrid}>
        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>Lavori in corso</h2>
          <div style={styles.list}>
            {orders.filter(isOrderOpen).slice(0, 6).length === 0 ? (
              <div style={styles.muted}>Nessun ordine aperto al momento.</div>
            ) : (
              orders.filter(isOrderOpen).slice(0, 6).map((order, index) => (
                <div key={String(order.id ?? index)} style={styles.clientItem}>
                  <div style={styles.rowBetween}>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>
                        {String(order.garment || `Ordine #${index + 1}`)}
                      </div>
                      <div style={styles.helper}>
                        {clientNameById(order.client_id)} · {String(order.status || "Aperto")}
                      </div>
                    </div>
                    <button
                      style={styles.buttonDanger}
                      onClick={() => void deleteOrder(order.id)}
                    >
                      {deletingOrderId === order.id ? "Elimino..." : "Elimina"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>Focus di oggi</h2>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <input
              style={styles.input}
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="Scrivi una task"
            />
            <button
              style={styles.buttonDark}
              onClick={() => {
                if (!taskInput.trim()) return;
                setTasks((prev) => [...prev, taskInput.trim()]);
                setTaskInput("");
              }}
            >
              Aggiungi
            </button>
          </div>

          <div style={styles.list}>
            {tasks.map((task, idx) => (
              <div
                key={`${task}-${idx}`}
                style={{
                  ...styles.clientItem,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span>{task}</span>
                <button
                  onClick={() => setTasks((prev) => prev.filter((_, i) => i !== idx))}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#c44334",
                    cursor: "pointer",
                    fontSize: 15,
                  }}
                >
                  Elimina
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderClientEditor() {
    return (
      <div style={styles.panel}>
        <h2 style={styles.panelTitle}>Scheda cliente</h2>

        {!showClientEditor && !selectedClient ? (
          <div style={styles.muted}>Seleziona un cliente.</div>
        ) : (
          <>
            <div style={styles.fieldGrid}>
              <div style={styles.fieldBlock}>
                <label style={styles.label}>Nome</label>
                <input
                  style={styles.input}
                  value={clientForm.name}
                  onChange={(e) =>
                    setClientForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Nome cliente"
                />
              </div>

              <div style={styles.fieldBlock}>
                <label style={styles.label}>Città</label>
                <input
                  style={styles.input}
                  value={clientForm.city}
                  onChange={(e) =>
                    setClientForm((prev) => ({ ...prev, city: e.target.value }))
                  }
                  placeholder="Città"
                />
              </div>

              <div style={styles.fieldBlock}>
                <label style={styles.label}>Telefono</label>
                <input
                  style={styles.input}
                  value={clientForm.phone}
                  onChange={(e) =>
                    setClientForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="Telefono"
                />
              </div>

              <div style={styles.fieldBlock}>
                <label style={styles.label}>Email</label>
                <input
                  style={styles.input}
                  value={clientForm.email}
                  onChange={(e) =>
                    setClientForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="Email"
                />
              </div>
            </div>

            <div style={styles.fieldBlock}>
              <label style={styles.label}>Note</label>
              <textarea
                style={styles.textarea}
                value={clientForm.notes}
                onChange={(e) =>
                  setClientForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Note cliente"
              />
            </div>

            <h3
              style={{
                margin: "8px 0 14px 0",
                fontSize: 18,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#6f6b66",
              }}
            >
              Misure base
            </h3>

            <div style={styles.measuresGrid}>
              {[
                ["chest", "Chest"],
                ["waist", "Waist"],
                ["hip", "Hip"],
                ["shoulder", "Shoulder"],
                ["sleeve", "Sleeve"],
                ["neck", "Neck"],
                ["inseam", "Inseam"],
                ["outseam", "Outseam"],
              ].map(([key, label]) => (
                <div key={key} style={styles.fieldBlock}>
                  <label style={styles.label}>{label}</label>
                  <input
                    style={styles.input}
                    value={clientForm[key as keyof ClientFormState]}
                    onChange={(e) =>
                      setClientForm((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                    placeholder={label}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
              <button
                style={{
                  ...styles.buttonDark,
                  width: isMobile ? "100%" : "auto",
                  opacity: savingClient ? 0.7 : 1,
                }}
                onClick={() => void saveClient()}
                disabled={savingClient}
              >
                {savingClient ? "Salvataggio..." : "Salva cliente"}
              </button>

              {selectedClient?.id ? (
                <button
                  style={{
                    ...styles.buttonDanger,
                    width: isMobile ? "100%" : "auto",
                  }}
                  onClick={() => void deleteClient(selectedClient.id)}
                >
                  {deletingClientId === selectedClient.id ? "Elimino..." : "Elimina"}
                </button>
              ) : null}

              <button
                style={{ ...styles.button, width: isMobile ? "100%" : "auto" }}
                onClick={() => setShowClientEditor(false)}
              >
                Chiudi
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  function renderClienti() {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "0.92fr 1.08fr",
          gap: 20,
          alignItems: "start",
        }}
      >
        <div style={styles.panel}>
          <div style={styles.rowBetween}>
            <h2 style={styles.panelTitle}>Clienti</h2>
            <button style={styles.buttonDark} onClick={openNewClient}>
              Nuovo cliente
            </button>
          </div>

          <div style={{ marginBottom: 14 }}>
            <input
              style={styles.input}
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              placeholder="Cerca cliente"
            />
          </div>

          <div style={styles.list}>
            {filteredClients.length === 0 ? (
              <div style={styles.muted}>Nessun cliente trovato.</div>
            ) : (
              filteredClients.map((client, index) => {
                const active = selectedClient?.id === client.id;
                return (
                  <div
                    key={String(client.id ?? index)}
                    style={active ? styles.clientItemActive : styles.clientItem}
                    onClick={() => openClient(client)}
                  >
                    <div style={styles.rowBetween}>
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                            color: "#8a847d",
                            marginBottom: 8,
                          }}
                        >
                          Cliente
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
                          {getClientName(client)}
                        </div>
                        <div style={styles.helper}>
                          {[getClientCity(client), getClientPhone(client), getClientEmail(client)]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      </div>

                      <button
                        style={styles.buttonDanger}
                        onClick={(e) => {
                          e.stopPropagation();
                          void deleteClient(client.id);
                        }}
                      >
                        {deletingClientId === client.id ? "Elimino..." : "Elimina"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {renderClientEditor()}
      </div>
    );
  }

  function renderOrdini() {
    return (
      <div style={styles.sectionGrid}>
        <div style={styles.panel}>
          <div style={styles.rowBetween}>
            <h2 style={styles.panelTitle}>Nuovo ordine</h2>
          </div>

          <div style={styles.fieldBlock}>
            <label style={styles.label}>Cliente</label>
            <select
              style={styles.select}
              value={orderForm.client_id}
              onChange={(e) =>
                setOrderForm((prev) => ({ ...prev, client_id: e.target.value }))
              }
            >
              <option value="">Seleziona cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {getClientName(client)}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.fieldGrid}>
            <div style={styles.fieldBlock}>
              <label style={styles.label}>Garment</label>
              <input
                style={styles.input}
                value={orderForm.garment}
                onChange={(e) =>
                  setOrderForm((prev) => ({ ...prev, garment: e.target.value }))
                }
                placeholder="Es. Giacca"
              />
            </div>

            <div style={styles.fieldBlock}>
              <label style={styles.label}>Status</label>
              <input
                style={styles.input}
                value={orderForm.status}
                onChange={(e) =>
                  setOrderForm((prev) => ({ ...prev, status: e.target.value }))
                }
                placeholder="Aperto / Prova / Consegnato"
              />
            </div>

            <div style={styles.fieldBlock}>
              <label style={styles.label}>Construction</label>
              <input
                style={styles.input}
                value={orderForm.construction}
                onChange={(e) =>
                  setOrderForm((prev) => ({ ...prev, construction: e.target.value }))
                }
                placeholder="Es. Su misura"
              />
            </div>

            <div style={styles.fieldBlock}>
              <label style={styles.label}>Due date</label>
              <input
                type="date"
                style={styles.input}
                value={orderForm.due_date}
                onChange={(e) =>
                  setOrderForm((prev) => ({ ...prev, due_date: e.target.value }))
                }
              />
            </div>

            <div style={styles.fieldBlock}>
              <label style={styles.label}>Price</label>
              <input
                style={styles.input}
                value={orderForm.price}
                onChange={(e) =>
                  setOrderForm((prev) => ({ ...prev, price: e.target.value }))
                }
                placeholder="0"
              />
            </div>

            <div style={styles.fieldBlock}>
              <label style={styles.label}>Advance</label>
              <input
                style={styles.input}
                value={orderForm.advance}
                onChange={(e) =>
                  setOrderForm((prev) => ({ ...prev, advance: e.target.value }))
                }
                placeholder="0"
              />
            </div>
          </div>

          <div style={styles.fieldBlock}>
            <label style={styles.label}>Notes</label>
            <textarea
              style={styles.textarea}
              value={orderForm.notes}
              onChange={(e) =>
                setOrderForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Note ordine"
            />
          </div>

          <button
            style={{
              ...styles.buttonDark,
              width: isMobile ? "100%" : "auto",
              opacity: savingOrder ? 0.7 : 1,
            }}
            onClick={() => void saveOrder()}
            disabled={savingOrder}
          >
            {savingOrder ? "Salvataggio..." : "Salva ordine"}
          </button>
        </div>

        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>Ordini</h2>
          <div style={styles.list}>
            {orders.length === 0 ? (
              <div style={styles.muted}>Nessun elemento disponibile.</div>
            ) : (
              orders.map((order, idx) => (
                <div key={String(order.id ?? idx)} style={styles.clientItem}>
                  <div style={styles.rowBetween}>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>
                        {String(order.garment || `Ordine #${idx + 1}`)}
                      </div>
                      <div style={styles.helper}>
                        {clientNameById(order.client_id)} · {String(order.status || "Aperto")}
                      </div>
                      <div style={{ ...styles.helper, marginTop: 6 }}>
                        {euro(Number(order.price ?? 0))} · Acconto {euro(Number(order.advance ?? 0))}
                      </div>
                    </div>

                    <button
                      style={styles.buttonDanger}
                      onClick={() => void deleteOrder(order.id)}
                    >
                      {deletingOrderId === order.id ? "Elimino..." : "Elimina"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderPreventivi() {
    return (
      <div style={styles.sectionGrid}>
        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>Nuovo preventivo</h2>

          <div style={styles.fieldBlock}>
            <label style={styles.label}>Cliente</label>
            <select
              style={styles.select}
              value={quoteForm.client_id}
              onChange={(e) =>
                setQuoteForm((prev) => ({ ...prev, client_id: e.target.value }))
              }
            >
              <option value="">Seleziona cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {getClientName(client)}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.fieldGrid}>
            <div style={styles.fieldBlock}>
              <label style={styles.label}>Garment</label>
              <input
                style={styles.input}
                value={quoteForm.garment}
                onChange={(e) =>
                  setQuoteForm((prev) => ({ ...prev, garment: e.target.value }))
                }
                placeholder="Es. Cappotto"
              />
            </div>

            <div style={styles.fieldBlock}>
              <label style={styles.label}>Status</label>
              <input
                style={styles.input}
                value={quoteForm.status}
                onChange={(e) =>
                  setQuoteForm((prev) => ({ ...prev, status: e.target.value }))
                }
                placeholder="Bozza / Inviato / Accettato"
              />
            </div>

            <div style={styles.fieldBlock}>
              <label style={styles.label}>Base price</label>
              <input
                style={styles.input}
                value={quoteForm.base_price}
                onChange={(e) =>
                  setQuoteForm((prev) => ({ ...prev, base_price: e.target.value }))
                }
                placeholder="0"
              />
            </div>

            <div style={styles.fieldBlock}>
              <label style={styles.label}>Extras</label>
              <input
                style={styles.input}
                value={quoteForm.extras}
                onChange={(e) =>
                  setQuoteForm((prev) => ({ ...prev, extras: e.target.value }))
                }
                placeholder="0"
              />
            </div>

            <div style={styles.fieldBlock}>
              <label style={styles.label}>Deposit</label>
              <input
                style={styles.input}
                value={quoteForm.deposit}
                onChange={(e) =>
                  setQuoteForm((prev) => ({ ...prev, deposit: e.target.value }))
                }
                placeholder="0"
              />
            </div>

            <div style={styles.fieldBlock}>
              <label style={styles.label}>Total</label>
              <input
                style={styles.input}
                value={quoteForm.total}
                onChange={(e) =>
                  setQuoteForm((prev) => ({ ...prev, total: e.target.value }))
                }
                placeholder="0"
              />
            </div>
          </div>

          <div style={styles.fieldBlock}>
            <label style={styles.label}>Description</label>
            <textarea
              style={styles.textarea}
              value={quoteForm.description}
              onChange={(e) =>
                setQuoteForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Descrizione preventivo"
            />
          </div>

          <button
            style={{
              ...styles.buttonDark,
              width: isMobile ? "100%" : "auto",
              opacity: savingQuote ? 0.7 : 1,
            }}
            onClick={() => void saveQuote()}
            disabled={savingQuote}
          >
            {savingQuote ? "Salvataggio..." : "Salva preventivo"}
          </button>
        </div>

        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>Preventivi</h2>
          <div style={styles.list}>
            {quotes.length === 0 ? (
              <div style={styles.muted}>Nessun elemento disponibile.</div>
            ) : (
              quotes.map((quote, idx) => (
                <div key={String(quote.id ?? idx)} style={styles.clientItem}>
                  <div style={styles.rowBetween}>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>
                        {String(quote.garment || `Preventivo #${idx + 1}`)}
                      </div>
                      <div style={styles.helper}>
                        {clientNameById(quote.client_id)} · {String(quote.status || "Bozza")}
                      </div>
                      <div style={{ ...styles.helper, marginTop: 6 }}>
                        Totale {euro(Number(quote.total ?? 0))}
                      </div>
                    </div>

                    <button
                      style={styles.buttonDanger}
                      onClick={() => void deleteQuote(quote.id)}
                    >
                      {deletingQuoteId === quote.id ? "Elimino..." : "Elimina"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderMisure() {
    return (
      <div style={styles.panel}>
        <h2 style={styles.panelTitle}>Misure</h2>
        <div style={styles.list}>
          {clients.length === 0 ? (
            <div style={styles.muted}>Nessun elemento disponibile.</div>
          ) : (
            clients.map((client) => (
              <div key={String(client.id)} style={styles.clientItem}>
                <div style={styles.rowBetween}>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>{getClientName(client)}</div>
                    <div style={styles.helper}>
                      {[
                        client.chest ? `Chest ${client.chest}` : "",
                        client.waist ? `Waist ${client.waist}` : "",
                        client.hip ? `Hip ${client.hip}` : "",
                        client.outseam ? `Outseam ${client.outseam}` : "",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>

                  <button
                    style={styles.buttonDanger}
                    onClick={() => void deleteClient(client.id)}
                  >
                    {deletingClientId === client.id ? "Elimino..." : "Elimina"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.brand}>CHAVARRIAGA</div>

        <div style={styles.titleRow}>
          <div>
            <h1 style={styles.h1}>Sartoria Manager</h1>
            <div style={styles.subtitle}>
              Versione premium sincronizzata con Supabase.
            </div>
          </div>

          <button
            style={styles.button}
            onClick={() => void loadAllData(true)}
            disabled={loading}
          >
            {loading ? "Caricamento..." : "Ricarica dati"}
          </button>
        </div>

        {error && !loading ? <div style={styles.error}>{error}</div> : null}

        <div style={styles.cardGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Clienti</div>
            <div style={styles.statValue}>{clients.length}</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>Ordini aperti</div>
            <div style={styles.statValue}>{openOrdersCount}</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>Valore ordini</div>
            <div style={styles.statValue}>{euro(totalOrderValue)}</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>Acconti</div>
            <div style={styles.statValue}>{euro(totalDeposits)}</div>
          </div>
        </div>

        <div style={styles.tabs}>
          {[
            ["dashboard", "Dashboard"],
            ["clienti", "Clienti"],
            ["misure", "Misure"],
            ["ordini", "Ordini"],
            ["preventivi", "Preventivi"],
          ].map(([key, label]) => (
            <button
              key={key}
              style={activeTab === key ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab(key as TabKey)}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "clienti" && renderClienti()}
        {activeTab === "misure" && renderMisure()}
        {activeTab === "ordini" && renderOrdini()}
        {activeTab === "preventivi" && renderPreventivi()}
      </div>
    </main>
  );
}