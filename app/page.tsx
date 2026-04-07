"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type View = "dashboard" | "clienti" | "misure" | "ordini" | "preventivi";

type Client = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  notes: string | null;
  chest: string | null;
  waist: string | null;
  hip: string | null;
  shoulder: string | null;
  sleeve: string | null;
  neck: string | null;
  inseam: string | null;
  outseam: string | null;
  created_at?: string;
};

type Order = {
  id: string;
  client_id: string;
  garment: string | null;
  construction: string | null;
  status: string | null;
  price: number | null;
  advance: number | null;
  notes: string | null;
  due_date: string | null;
  created_at?: string;
};

type Quote = {
  id: string;
  client_id: string;
  garment: string | null;
  description: string | null;
  base_price: number | null;
  extras: number | null;
  deposit: number | null;
  total: number | null;
  status: string | null;
  created_at?: string;
};

type OrderReference = {
  id: string;
  order_id: string;
  type: string | null;
  url: string | null;
  note: string | null;
  stage: string | null;
  created_at?: string;
};

const bg = "#f2f1ed";
const card = "#fbfaf8";
const border = "#ded8cf";
const text = "#1a1a1a";
const muted = "#6b6660";

const orderStatuses = ["Preventivo", "In lavorazione", "Prova", "Consegnato"];
const quoteStatuses = ["Bozza", "Approvato", "Convertito"];
const referenceTypes = ["image", "link", "note"];
const referenceStages = ["idea", "fabric", "fitting", "final"];

const emptyClient = {
  name: "",
  phone: "",
  email: "",
  city: "",
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

const emptyOrder = {
  client_id: "",
  garment: "",
  construction: "Su misura",
  status: "Preventivo",
  price: "",
  advance: "",
  notes: "",
  due_date: "",
};

const emptyQuote = {
  client_id: "",
  garment: "",
  description: "",
  base_price: "",
  extras: "",
  deposit: "",
  status: "Bozza",
};

const emptyReference = {
  type: "image",
  url: "",
  note: "",
  stage: "idea",
};

function money(value: number | null | undefined) {
  return `€ ${Number(value || 0)}`;
}

function flashStyle(type: "ok" | "error") {
  return type === "error"
    ? {
        border: "1px solid #f0c6c6",
        background: "#fff3f3",
        color: "#a12626",
      }
    : {
        border: "1px solid #cce6d3",
        background: "#eef9f0",
        color: "#23623b",
      };
}

function badgeStyle(status: string | null | undefined): React.CSSProperties {
  const s = status || "—";
  const map: Record<string, string> = {
    Preventivo: "#efefef",
    "In lavorazione": "#fff1cc",
    Prova: "#dcecff",
    Consegnato: "#dff5e6",
    Bozza: "#efefef",
    Approvato: "#dff5e6",
    Convertito: "#efefef",
  };

  return {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: 999,
    border: `1px solid ${border}`,
    background: map[s] || "#efefef",
    fontSize: 12,
    whiteSpace: "nowrap",
  };
}

function AppButton({
  children,
  onClick,
  variant = "primary",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  type?: "button" | "submit";
}) {
  const styles =
    variant === "primary"
      ? { background: "#111", color: "#fff", border: "1px solid #111" }
      : variant === "danger"
      ? { background: "transparent", color: "#9f1d1d", border: "1px solid #efc7c7" }
      : { background: "transparent", color: text, border: `1px solid ${border}` };

  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        ...styles,
        borderRadius: 999,
        padding: "12px 18px",
        fontSize: 14,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: card,
        border: `1px solid ${border}`,
        borderRadius: 28,
        padding: 24,
        boxSizing: "border-box",
        minWidth: 0,
      }}
    >
      {children}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 16px",
        borderRadius: 999,
        border: `1px solid ${border}`,
        background: active ? "#111" : card,
        color: active ? "#fff" : muted,
        cursor: "pointer",
        fontSize: 14,
      }}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string | number | null | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
      <label style={{ fontSize: 12, color: "#7a756f" }}>{label}</label>
      <input
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          border: "none",
          borderBottom: `1px solid ${border}`,
          background: "transparent",
          padding: "8px 0",
          fontSize: 16,
          outline: "none",
        }}
      />
    </div>
  );
}

function Area({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null | undefined;
  onChange: (value: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={{ fontSize: 12, color: "#7a756f" }}>{label}</label>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          minHeight: 90,
          border: `1px solid ${border}`,
          borderRadius: 20,
          padding: 14,
          resize: "vertical",
          background: card,
          fontSize: 15,
          outline: "none",
        }}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  labels,
}: {
  label: string;
  value: string | null | undefined;
  options: string[];
  onChange: (value: string) => void;
  labels?: Record<string, string>;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
      <label style={{ fontSize: 12, color: "#7a756f" }}>{label}</label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          border: `1px solid ${border}`,
          borderRadius: 999,
          padding: "12px 16px",
          background: "#fff",
          fontSize: 15,
          outline: "none",
        }}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {labels?.[option] || option}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function Page() {
  const [view, setView] = useState<View>("dashboard");

  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [references, setReferences] = useState<OrderReference[]>([]);

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);

  const [clientForm, setClientForm] = useState(emptyClient);
  const [orderForm, setOrderForm] = useState(emptyOrder);
  const [quoteForm, setQuoteForm] = useState(emptyQuote);
  const [referenceForm, setReferenceForm] = useState(emptyReference);

  const [openClientForm, setOpenClientForm] = useState(false);
  const [openOrderForm, setOpenOrderForm] = useState(false);
  const [openQuoteForm, setOpenQuoteForm] = useState(false);
  const [openReferenceForm, setOpenReferenceForm] = useState(false);

  const [searchClient, setSearchClient] = useState("");
  const [searchOrder, setSearchOrder] = useState("");

  const [todoText, setTodoText] = useState("");
  const [todos, setTodos] = useState([
    { id: "1", text: "Controllare gli ordini in stato Prova", done: false },
    { id: "2", text: "Registrare gli acconti ricevuti", done: false },
  ]);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"ok" | "error">("ok");
  const [loading, setLoading] = useState(true);

  const selectedClient = clients.find((c) => c.id === selectedClientId) || null;
  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || null;
  const selectedQuote = quotes.find((q) => q.id === selectedQuoteId) || null;
  const selectedOrderClient = selectedOrder ? clients.find((c) => c.id === selectedOrder.client_id) : null;

  const selectedOrderReferences = useMemo(
    () => references.filter((r) => r.order_id === selectedOrderId),
    [references, selectedOrderId]
  );

  const clientOptions = clients.map((c) => c.id);
  const clientLabels = Object.fromEntries(clients.map((c) => [c.id, c.name]));

  const filteredClients = useMemo(() => {
    return clients.filter((c) =>
      `${c.name || ""} ${c.city || ""} ${c.email || ""}`
        .toLowerCase()
        .includes(searchClient.toLowerCase())
    );
  }, [clients, searchClient]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) =>
      `${o.garment || ""} ${o.status || ""}`
        .toLowerCase()
        .includes(searchOrder.toLowerCase())
    );
  }, [orders, searchOrder]);

  const totalOrdersValue = orders.reduce((sum, o) => sum + Number(o.price || 0), 0);
  const totalAdvance = orders.reduce((sum, o) => sum + Number(o.advance || 0), 0);
  const openOrders = orders.filter((o) => (o.status || "") !== "Consegnato").length;

  const flash = (msg: string, type: "ok" | "error" = "ok") => {
    setMessage(msg);
    setMessageType(type);
    window.setTimeout(() => setMessage(""), 2500);
  };

  const loadAll = async () => {
    setLoading(true);

    const [clientsRes, ordersRes, quotesRes, refsRes] = await Promise.all([
      supabase.from("clients").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("quotes").select("*").order("created_at", { ascending: false }),
      supabase.from("order_references").select("*").order("created_at", { ascending: true }),
    ]);

    const firstError = clientsRes.error || ordersRes.error || quotesRes.error || refsRes.error;

    if (firstError) {
      flash(`Errore: ${firstError.message}`, "error");
      setLoading(false);
      return;
    }

    const c = (clientsRes.data || []) as Client[];
    const o = (ordersRes.data || []) as Order[];
    const q = (quotesRes.data || []) as Quote[];
    const r = (refsRes.data || []) as OrderReference[];

    setClients(c);
    setOrders(o);
    setQuotes(q);
    setReferences(r);

    setSelectedClientId((prev) => prev ?? c[0]?.id ?? null);
    setSelectedOrderId((prev) => prev ?? o[0]?.id ?? null);
    setSelectedQuoteId((prev) => prev ?? q[0]?.id ?? null);

    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const createClient = async () => {
    if (!clientForm.name.trim()) return;
    const { error } = await supabase.from("clients").insert([clientForm]);
    if (error) return flash(`Errore: ${error.message}`, "error");
    setClientForm(emptyClient);
    setOpenClientForm(false);
    flash("Cliente salvato.");
    loadAll();
  };

  const updateClientField = async (field: keyof Client, value: string) => {
    if (!selectedClient) return;
    setClients((prev) => prev.map((c) => (c.id === selectedClient.id ? { ...c, [field]: value } : c)));
    const { error } = await supabase.from("clients").update({ [field]: value }).eq("id", selectedClient.id);
    if (error) flash(`Errore: ${error.message}`, "error");
  };

  const deleteClient = async () => {
    if (!selectedClient) return;
    const hasOpenOrders = orders.some((o) => o.client_id === selectedClient.id && o.status !== "Consegnato");
    if (hasOpenOrders) return flash("Questo cliente ha ancora ordini non consegnati.", "error");
    await supabase.from("quotes").delete().eq("client_id", selectedClient.id);
    await supabase.from("orders").delete().eq("client_id", selectedClient.id);
    const { error } = await supabase.from("clients").delete().eq("id", selectedClient.id);
    if (error) return flash(`Errore: ${error.message}`, "error");
    setSelectedClientId(null);
    flash("Cliente eliminato.");
    loadAll();
  };

  const createOrder = async () => {
    if (!orderForm.client_id || !orderForm.garment.trim()) return;
    const payload = {
      ...orderForm,
      price: Number(orderForm.price || 0),
      advance: Number(orderForm.advance || 0),
    };
    const { error } = await supabase.from("orders").insert([payload]);
    if (error) return flash(`Errore: ${error.message}`, "error");
    setOrderForm(emptyOrder);
    setOpenOrderForm(false);
    flash("Ordine creato.");
    loadAll();
  };

  const updateOrderField = async (field: keyof Order, value: string) => {
    if (!selectedOrder) return;
    setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? { ...o, [field]: value } : o)));
    const payload = field === "price" || field === "advance" ? { [field]: Number(value || 0) } : { [field]: value };
    const { error } = await supabase.from("orders").update(payload).eq("id", selectedOrder.id);
    if (error) flash(`Errore: ${error.message}`, "error");
  };

  const deleteOrder = async () => {
    if (!selectedOrder) return;
    await supabase.from("order_references").delete().eq("order_id", selectedOrder.id);
    const { error } = await supabase.from("orders").delete().eq("id", selectedOrder.id);
    if (error) return flash(`Errore: ${error.message}`, "error");
    setSelectedOrderId(null);
    flash("Ordine eliminato.");
    loadAll();
  };

  const createQuote = async () => {
    if (!quoteForm.client_id || !quoteForm.garment.trim()) return;
    const total = Number(quoteForm.base_price || 0) + Number(quoteForm.extras || 0);
    const payload = {
      ...quoteForm,
      base_price: Number(quoteForm.base_price || 0),
      extras: Number(quoteForm.extras || 0),
      deposit: Number(quoteForm.deposit || 0),
      total,
    };
    const { error } = await supabase.from("quotes").insert([payload]);
    if (error) return flash(`Errore: ${error.message}`, "error");
    setQuoteForm(emptyQuote);
    setOpenQuoteForm(false);
    flash("Preventivo creato.");
    loadAll();
  };

  const updateQuoteField = async (field: keyof Quote, value: string) => {
    if (!selectedQuote) return;
    const next = { ...selectedQuote, [field]: value } as Quote;
    const total = Number(next.base_price || 0) + Number(next.extras || 0);
    setQuotes((prev) => prev.map((q) => (q.id === selectedQuote.id ? { ...next, total } : q)));
    const payload: Record<string, any> = {
      [field]: field === "base_price" || field === "extras" || field === "deposit" ? Number(value || 0) : value,
      total,
    };
    const { error } = await supabase.from("quotes").update(payload).eq("id", selectedQuote.id);
    if (error) flash(`Errore: ${error.message}`, "error");
  };

  const deleteQuote = async () => {
    if (!selectedQuote) return;
    const { error } = await supabase.from("quotes").delete().eq("id", selectedQuote.id);
    if (error) return flash(`Errore: ${error.message}`, "error");
    setSelectedQuoteId(null);
    flash("Preventivo eliminato.");
    loadAll();
  };

  const convertQuoteToOrder = async () => {
    if (!selectedQuote) return;
    const payload = {
      client_id: selectedQuote.client_id,
      garment: selectedQuote.garment,
      construction: "Su misura",
      status: "Preventivo",
      price: Number(selectedQuote.total || 0),
      advance: Number(selectedQuote.deposit || 0),
      notes: selectedQuote.description || "",
      due_date: null,
    };
    const { error } = await supabase.from("orders").insert([payload]);
    if (error) return flash(`Errore: ${error.message}`, "error");
    await supabase.from("quotes").update({ status: "Convertito" }).eq("id", selectedQuote.id);
    flash("Preventivo convertito in ordine.");
    loadAll();
  };

  const createReference = async () => {
    if (!selectedOrder || (!referenceForm.url.trim() && !referenceForm.note.trim())) return;
    const payload = {
      order_id: selectedOrder.id,
      type: referenceForm.type,
      url: referenceForm.url,
      note: referenceForm.note,
      stage: referenceForm.stage,
    };
    const { error } = await supabase.from("order_references").insert([payload]);
    if (error) return flash(`Errore: ${error.message}`, "error");
    setReferenceForm(emptyReference);
    setOpenReferenceForm(false);
    flash("Reference aggiunta.");
    loadAll();
  };

  const deleteReference = async (id: string) => {
    const { error } = await supabase.from("order_references").delete().eq("id", id);
    if (error) return flash(`Errore: ${error.message}`, "error");
    flash("Reference eliminata.");
    loadAll();
  };

  const addTodo = () => {
    if (!todoText.trim()) return;
    setTodos((prev) => [{ id: crypto.randomUUID(), text: todoText, done: false }, ...prev]);
    setTodoText("");
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  if (loading) {
    return <div style={{ minHeight: "100vh", background: bg, color: text, padding: 40, fontFamily: "Arial, sans-serif" }}>Caricamento…</div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: bg, color: text, padding: 40, fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 20, flexWrap: "wrap" }}>
          <div>
            <p style={{ fontSize: 12, letterSpacing: "0.34em", textTransform: "uppercase", color: "#7a756f", marginBottom: 10 }}>Chavarriaga</p>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 60, lineHeight: 1, margin: 0 }}>Sartoria Manager</h1>
            <p style={{ color: muted, marginTop: 18, fontSize: 18 }}>Versione premium sincronizzata con Supabase.</p>
          </div>
          <AppButton variant="secondary" onClick={loadAll}>Ricarica dati</AppButton>
        </div>

        {message ? <div style={{ marginBottom: 20, borderRadius: 20, padding: 16, ...flashStyle(messageType) }}>{message}</div> : null}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16, marginBottom: 28, alignItems: "stretch" }}>
          <CardShell><div style={{ fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: "#7a756f", marginBottom: 14 }}>Clienti</div><div style={{ fontSize: 46, fontWeight: 700 }}>{clients.length}</div></CardShell>
          <CardShell><div style={{ fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: "#7a756f", marginBottom: 14 }}>Ordini aperti</div><div style={{ fontSize: 46, fontWeight: 700 }}>{openOrders}</div></CardShell>
          <CardShell><div style={{ fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: "#7a756f", marginBottom: 14 }}>Valore ordini</div><div style={{ fontSize: 46, fontWeight: 700 }}>{money(totalOrdersValue)}</div></CardShell>
          <CardShell><div style={{ fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: "#7a756f", marginBottom: 14 }}>Acconti</div><div style={{ fontSize: 46, fontWeight: 700 }}>{money(totalAdvance)}</div></CardShell>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
          <TabButton active={view === "dashboard"} onClick={() => setView("dashboard")}>Dashboard</TabButton>
          <TabButton active={view === "clienti"} onClick={() => setView("clienti")}>Clienti</TabButton>
          <TabButton active={view === "misure"} onClick={() => setView("misure")}>Misure</TabButton>
          <TabButton active={view === "ordini"} onClick={() => setView("ordini")}>Ordini</TabButton>
          <TabButton active={view === "preventivi"} onClick={() => setView("preventivi")}>Preventivi</TabButton>
        </div>

        {view === "dashboard" && (
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 20, alignItems: "stretch" }}>
            <CardShell>
              <h2 style={{ marginTop: 0, marginBottom: 20 }}>Lavori in corso</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {orders.map((o) => {
                  const client = clients.find((c) => c.id === o.client_id);
                  return (
                    <div key={o.id} onClick={() => { setSelectedOrderId(o.id); setView("ordini"); }} style={{ borderBottom: `1px solid ${border}`, paddingBottom: 14, cursor: "pointer" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 6 }}>{o.garment || "—"}</div>
                          <div style={{ color: muted, fontSize: 15 }}>{client?.name || "—"}</div>
                        </div>
                        <span style={badgeStyle(o.status)}>{o.status || "—"}</span>
                      </div>
                      <div style={{ marginTop: 10, color: muted, fontSize: 14 }}>Consegna — {o.due_date || "—"}</div>
                    </div>
                  );
                })}
              </div>
            </CardShell>

            <CardShell>
              <h2 style={{ marginTop: 0, marginBottom: 20 }}>Focus di oggi</h2>
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <input value={todoText} onChange={(e) => setTodoText(e.target.value)} placeholder="Scrivi una task" style={{ flex: 1, width: "100%", boxSizing: "border-box", border: `1px solid ${border}`, background: "#fff", borderRadius: 999, padding: "12px 16px", fontSize: 15, outline: "none" }} />
                <AppButton onClick={addTodo}>Aggiungi</AppButton>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {todos.map((todo) => (
                  <div key={todo.id} style={{ display: "flex", alignItems: "center", gap: 12, border: `1px solid ${border}`, background: card, borderRadius: 22, padding: 14 }}>
                    <button onClick={() => toggleTodo(todo.id)} style={{ width: 22, height: 22, borderRadius: 999, border: todo.done ? "1px solid #111" : `1px solid ${border}`, background: todo.done ? "#111" : "#fff", color: "#fff", cursor: "pointer" }}>✓</button>
                    <div style={{ flex: 1, fontSize: 15, color: todo.done ? "#8a837b" : text, textDecoration: todo.done ? "line-through" : "none" }}>{todo.text}</div>
                    <button onClick={() => deleteTodo(todo.id)} style={{ border: "none", background: "transparent", color: "#9f1d1d", cursor: "pointer", fontSize: 14 }}>Elimina</button>
                  </div>
                ))}
              </div>
            </CardShell>
          </div>
        )}

        {view === "clienti" && (
          <div style={{ display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: 20, alignItems: "stretch" }}>
            <CardShell>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
                <h2 style={{ margin: 0 }}>Clienti</h2>
                <AppButton onClick={() => setOpenClientForm((v) => !v)}>{openClientForm ? "Chiudi" : "Nuovo"}</AppButton>
              </div>
              <input value={searchClient} onChange={(e) => setSearchClient(e.target.value)} placeholder="Cerca cliente" style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${border}`, background: "#fff", borderRadius: 999, padding: "12px 16px", fontSize: 15, outline: "none", marginBottom: 18 }} />
              {openClientForm && (
                <div style={{ marginBottom: 24, border: `1px solid ${border}`, borderRadius: 22, padding: 18, background: "#fffdfb" }}>
                  <div style={{ fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: "#7a756f", marginBottom: 14 }}>Nuovo cliente</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
                    <Field label="Nome" value={clientForm.name} onChange={(v) => setClientForm({ ...clientForm, name: v })} />
                    <Field label="Città" value={clientForm.city} onChange={(v) => setClientForm({ ...clientForm, city: v })} />
                    <Field label="Telefono" value={clientForm.phone} onChange={(v) => setClientForm({ ...clientForm, phone: v })} />
                    <Field label="Email" value={clientForm.email} onChange={(v) => setClientForm({ ...clientForm, email: v })} />
                  </div>
                  <Area label="Note" value={clientForm.notes} onChange={(v) => setClientForm({ ...clientForm, notes: v })} />
                  <div style={{ height: 16 }} />
                  <div style={{ fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: "#7a756f", marginBottom: 14 }}>Misure base</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                    {(["chest", "waist", "hip", "shoulder", "sleeve", "neck", "inseam", "outseam"] as const).map((k) => (
                      <Field key={k} label={k} value={clientForm[k]} onChange={(v) => setClientForm({ ...clientForm, [k]: v })} />
                    ))}
                  </div>
                  <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}><AppButton onClick={createClient}>Salva cliente</AppButton></div>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {filteredClients.map((client) => (
                  <div key={client.id} onClick={() => setSelectedClientId(client.id)} style={{ borderBottom: selectedClientId === client.id ? "1px solid #111" : `1px solid ${border}`, paddingBottom: 14, cursor: "pointer" }}>
                    <div style={{ fontSize: 20, fontWeight: 600 }}>{client.name}</div>
                    <div style={{ color: muted, marginTop: 4 }}>{client.city || "—"}</div>
                  </div>
                ))}
              </div>
            </CardShell>

            <CardShell>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 18 }}>
                <h2 style={{ margin: 0 }}>Scheda cliente</h2>
                {selectedClient ? <AppButton variant="danger" onClick={deleteClient}>Elimina cliente</AppButton> : null}
              </div>
              {selectedClient ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                    <Field label="Nome" value={selectedClient.name} onChange={(v) => updateClientField("name", v)} />
                    <Field label="Città" value={selectedClient.city} onChange={(v) => updateClientField("city", v)} />
                    <Field label="Telefono" value={selectedClient.phone} onChange={(v) => updateClientField("phone", v)} />
                    <Field label="Email" value={selectedClient.email} onChange={(v) => updateClientField("email", v)} />
                  </div>
                  <Area label="Note" value={selectedClient.notes} onChange={(v) => updateClientField("notes", v)} />
                </div>
              ) : <p style={{ color: muted }}>Seleziona un cliente.</p>}
            </CardShell>
          </div>
        )}

        {view === "misure" && (
          <div style={{ display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: 20, alignItems: "stretch" }}>
            <CardShell>
              <h2 style={{ marginTop: 0, marginBottom: 18 }}>Clienti</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {clients.map((client) => (
                  <div key={client.id} onClick={() => setSelectedClientId(client.id)} style={{ borderBottom: selectedClientId === client.id ? "1px solid #111" : `1px solid ${border}`, paddingBottom: 14, cursor: "pointer" }}>
                    <div style={{ fontSize: 20, fontWeight: 600 }}>{client.name}</div>
                    <div style={{ color: muted, marginTop: 4 }}>{client.city || "—"}</div>
                  </div>
                ))}
              </div>
            </CardShell>
            <CardShell>
              <h2 style={{ marginTop: 0, marginBottom: 18 }}>Scheda misure</h2>
              {selectedClient ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
                  {(["chest", "waist", "hip", "shoulder", "sleeve", "neck", "inseam", "outseam"] as const).map((k) => (
                    <Field key={k} label={k} value={selectedClient[k]} onChange={(v) => updateClientField(k, v)} />
                  ))}
                </div>
              ) : <p style={{ color: muted }}>Seleziona un cliente.</p>}
            </CardShell>
          </div>
        )}

        {view === "ordini" && (
          <div style={{ display: "grid", gridTemplateColumns: "0.82fr 1.18fr", gap: 20, alignItems: "stretch" }}>
            <CardShell>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
                <h2 style={{ margin: 0 }}>Ordini</h2>
                <AppButton onClick={() => setOpenOrderForm((v) => !v)}>{openOrderForm ? "Chiudi" : "Nuovo"}</AppButton>
              </div>
              <input value={searchOrder} onChange={(e) => setSearchOrder(e.target.value)} placeholder="Cerca ordine" style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${border}`, background: "#fff", borderRadius: 999, padding: "12px 16px", fontSize: 15, outline: "none", marginBottom: 18 }} />
              {openOrderForm && (
                <div style={{ marginBottom: 24, border: `1px solid ${border}`, borderRadius: 22, padding: 18, background: "#fffdfb" }}>
                  <div style={{ fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: "#7a756f", marginBottom: 14 }}>Nuovo ordine</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
                    <SelectField label="Cliente" value={orderForm.client_id} options={["", ...clientOptions]} labels={clientLabels} onChange={(v) => setOrderForm({ ...orderForm, client_id: v })} />
                    <Field label="Prenda" value={orderForm.garment} onChange={(v) => setOrderForm({ ...orderForm, garment: v })} />
                    <Field label="Costruzione" value={orderForm.construction} onChange={(v) => setOrderForm({ ...orderForm, construction: v })} />
                    <SelectField label="Stato" value={orderForm.status} options={orderStatuses} onChange={(v) => setOrderForm({ ...orderForm, status: v })} />
                    <Field label="Prezzo" value={orderForm.price} onChange={(v) => setOrderForm({ ...orderForm, price: v })} />
                    <Field label="Acconto" value={orderForm.advance} onChange={(v) => setOrderForm({ ...orderForm, advance: v })} />
                    <Field type="date" label="Consegna" value={orderForm.due_date} onChange={(v) => setOrderForm({ ...orderForm, due_date: v })} />
                  </div>
                  <Area label="Note" value={orderForm.notes} onChange={(v) => setOrderForm({ ...orderForm, notes: v })} />
                  <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}><AppButton onClick={createOrder}>Crea ordine</AppButton></div>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {filteredOrders.map((order) => {
                  const client = clients.find((c) => c.id === order.client_id);
                  return (
                    <div key={order.id} onClick={() => setSelectedOrderId(order.id)} style={{ borderBottom: selectedOrderId === order.id ? "1px solid #111" : `1px solid ${border}`, paddingBottom: 14, cursor: "pointer" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontSize: 20, fontWeight: 600 }}>{order.garment || "—"}</div>
                          <div style={{ color: muted, marginTop: 4 }}>{client?.name || "—"}</div>
                        </div>
                        <span style={badgeStyle(order.status)}>{order.status || "—"}</span>
                      </div>
                      <div style={{ color: muted, marginTop: 10, fontSize: 14 }}>Consegna — {order.due_date || "—"}</div>
                    </div>
                  );
                })}
              </div>
            </CardShell>

            <CardShell>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 18 }}>
                <h2 style={{ margin: 0 }}>Dettaglio ordine</h2>
                {selectedOrder ? <AppButton variant="danger" onClick={deleteOrder}>Elimina ordine</AppButton> : null}
              </div>

              {selectedOrder && selectedOrderClient ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: "#7a756f", marginBottom: 14 }}>Ordine</div>
                    <h3 style={{ fontSize: 32, margin: 0, marginBottom: 8 }}>{selectedOrder.garment}</h3>
                    <p style={{ color: muted, margin: 0 }}>{selectedOrderClient.name}</p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                    <Field label="Prenda" value={selectedOrder.garment} onChange={(v) => updateOrderField("garment", v)} />
                    <Field label="Costruzione" value={selectedOrder.construction} onChange={(v) => updateOrderField("construction", v)} />
                    <SelectField label="Stato" value={selectedOrder.status} options={orderStatuses} onChange={(v) => updateOrderField("status", v)} />
                    <Field type="date" label="Consegna" value={selectedOrder.due_date} onChange={(v) => updateOrderField("due_date", v)} />
                    <Field label="Prezzo" value={selectedOrder.price} onChange={(v) => updateOrderField("price", v)} />
                    <Field label="Acconto" value={selectedOrder.advance} onChange={(v) => updateOrderField("advance", v)} />
                  </div>

                  <Area label="Note ordine" value={selectedOrder.notes} onChange={(v) => updateOrderField("notes", v)} />

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
                      <div style={{ fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: "#7a756f" }}>References</div>
                      <AppButton variant="secondary" onClick={() => setOpenReferenceForm((v) => !v)}>
                        {openReferenceForm ? "Chiudi" : "Nuova reference"}
                      </AppButton>
                    </div>

                    {openReferenceForm && (
                      <div style={{ marginBottom: 18, border: `1px solid ${border}`, borderRadius: 22, padding: 18, background: "#fffdfb" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
                          <SelectField label="Tipo" value={referenceForm.type} options={referenceTypes} onChange={(v) => setReferenceForm({ ...referenceForm, type: v })} />
                          <SelectField label="Stage" value={referenceForm.stage} options={referenceStages} onChange={(v) => setReferenceForm({ ...referenceForm, stage: v })} />
                          <Field label="URL" value={referenceForm.url} onChange={(v) => setReferenceForm({ ...referenceForm, url: v })} />
                        </div>
                        <Area label="Nota" value={referenceForm.note} onChange={(v) => setReferenceForm({ ...referenceForm, note: v })} />
                        <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}><AppButton onClick={createReference}>Aggiungi reference</AppButton></div>
                      </div>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {selectedOrderReferences.length === 0 ? (
                        <div style={{ color: muted }}>Nessuna reference per questo ordine.</div>
                      ) : (
                        selectedOrderReferences.map((ref) => (
                          <div key={ref.id} style={{ border: `1px solid ${border}`, borderRadius: 18, background: card, padding: 16 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                              <div>
                                <div style={{ fontWeight: 600, marginBottom: 6 }}>{ref.stage || "—"}</div>
                                <div style={{ color: muted, fontSize: 13 }}>{ref.type || "—"}</div>
                              </div>
                              <AppButton variant="danger" onClick={() => deleteReference(ref.id)}>Elimina</AppButton>
                            </div>
                            {ref.url ? (
                              <div style={{ marginTop: 12 }}>
                                <a href={ref.url} target="_blank" rel="noreferrer" style={{ color: "#333", wordBreak: "break-all" }}>
                                  {ref.url}
                                </a>
                              </div>
                            ) : null}
                            {ref.note ? <div style={{ marginTop: 10, color: text }}>{ref.note}</div> : null}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : <p style={{ color: muted }}>Seleziona un ordine.</p>}
            </CardShell>
          </div>
        )}

        {view === "preventivi" && (
          <div style={{ display: "grid", gridTemplateColumns: "0.82fr 1.18fr", gap: 20, alignItems: "stretch" }}>
            <CardShell>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
                <h2 style={{ margin: 0 }}>Preventivi</h2>
                <AppButton onClick={() => setOpenQuoteForm((v) => !v)}>{openQuoteForm ? "Chiudi" : "Nuovo"}</AppButton>
              </div>
              {openQuoteForm && (
                <div style={{ marginBottom: 24, border: `1px solid ${border}`, borderRadius: 22, padding: 18, background: "#fffdfb" }}>
                  <div style={{ fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: "#7a756f", marginBottom: 14 }}>Nuovo preventivo</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
                    <SelectField label="Cliente" value={quoteForm.client_id} options={["", ...clientOptions]} labels={clientLabels} onChange={(v) => setQuoteForm({ ...quoteForm, client_id: v })} />
                    <Field label="Prenda" value={quoteForm.garment} onChange={(v) => setQuoteForm({ ...quoteForm, garment: v })} />
                    <Field label="Prezzo base" value={quoteForm.base_price} onChange={(v) => setQuoteForm({ ...quoteForm, base_price: v })} />
                    <Field label="Extra" value={quoteForm.extras} onChange={(v) => setQuoteForm({ ...quoteForm, extras: v })} />
                    <Field label="Acconto" value={quoteForm.deposit} onChange={(v) => setQuoteForm({ ...quoteForm, deposit: v })} />
                    <SelectField label="Stato" value={quoteForm.status} options={quoteStatuses} onChange={(v) => setQuoteForm({ ...quoteForm, status: v })} />
                  </div>
                  <Area label="Descrizione" value={quoteForm.description} onChange={(v) => setQuoteForm({ ...quoteForm, description: v })} />
                  <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}><AppButton onClick={createQuote}>Crea preventivo</AppButton></div>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {quotes.map((q) => {
                  const client = clients.find((c) => c.id === q.client_id);
                  return (
                    <div key={q.id} onClick={() => setSelectedQuoteId(q.id)} style={{ border: selectedQuoteId === q.id ? "1px solid #111" : `1px solid ${border}`, borderRadius: 22, background: card, padding: 16, cursor: "pointer" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontSize: 20, fontWeight: 600 }}>{q.garment || "—"}</div>
                          <div style={{ color: muted, marginTop: 4 }}>{client?.name || "—"}</div>
                        </div>
                        <span style={badgeStyle(q.status)}>{q.status || "—"}</span>
                      </div>
                      <div style={{ marginTop: 12, color: muted, fontSize: 14 }}>{q.description || "—"}</div>
                    </div>
                  );
                })}
              </div>
            </CardShell>

            <CardShell>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 18 }}>
                <h2 style={{ margin: 0 }}>Dettaglio preventivo</h2>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {selectedQuote ? <AppButton variant="secondary" onClick={convertQuoteToOrder}>Converti in ordine</AppButton> : null}
                  {selectedQuote ? <AppButton variant="danger" onClick={deleteQuote}>Elimina</AppButton> : null}
                </div>
              </div>
              {selectedQuote ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                    <Field label="Prenda" value={selectedQuote.garment} onChange={(v) => updateQuoteField("garment", v)} />
                    <SelectField label="Stato" value={selectedQuote.status} options={quoteStatuses} onChange={(v) => updateQuoteField("status", v)} />
                    <Field label="Prezzo base" value={selectedQuote.base_price} onChange={(v) => updateQuoteField("base_price", v)} />
                    <Field label="Extra" value={selectedQuote.extras} onChange={(v) => updateQuoteField("extras", v)} />
                    <Field label="Acconto" value={selectedQuote.deposit} onChange={(v) => updateQuoteField("deposit", v)} />
                  </div>
                  <Area label="Descrizione" value={selectedQuote.description} onChange={(v) => updateQuoteField("description", v)} />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                    <div style={{ border: `1px solid ${border}`, borderRadius: 18, background: card, padding: 16 }}>Base — {money(selectedQuote.base_price)}</div>
                    <div style={{ border: `1px solid ${border}`, borderRadius: 18, background: card, padding: 16 }}>Extra — {money(selectedQuote.extras)}</div>
                    <div style={{ border: `1px solid ${border}`, borderRadius: 18, background: card, padding: 16, fontWeight: 600 }}>Totale — {money(selectedQuote.total)}</div>
                  </div>
                </div>
              ) : <p style={{ color: muted }}>Seleziona un preventivo.</p>}
            </CardShell>
          </div>
        )}
      </div>
    </div>
  );
}
