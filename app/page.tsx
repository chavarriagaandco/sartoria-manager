"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

type TabKey = "dashboard" | "clienti" | "misure" | "ordini" | "preventivi";

type ClientRecord = {
  id?: string | number;
  created_at?: string;
  name?: string;
  full_name?: string;
  nome?: string;
  city?: string;
  citta?: string;
  phone?: string;
  telefono?: string;
  email?: string;
  notes?: string;
  note?: string;
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
  id?: string | number;
  created_at?: string;
  status?: string;
  total?: number;
  amount?: number;
  value?: number;
  acconto?: number;
  deposit?: number;
  [key: string]: unknown;
};

type QuoteRecord = {
  id?: string | number;
  created_at?: string;
  total?: number;
  amount?: number;
  value?: number;
  [key: string]: unknown;
};

type FormState = {
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

const initialForm: FormState = {
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

function getClientName(client: ClientRecord) {
  return String(client.name || client.full_name || client.nome || "Nuovo cliente");
}

function getClientCity(client: ClientRecord) {
  return String(client.city || client.citta || "");
}

function getClientPhone(client: ClientRecord) {
  return String(client.phone || client.telefono || "");
}

function getClientEmail(client: ClientRecord) {
  return String(client.email || "");
}

function getClientNotes(client: ClientRecord) {
  return String(client.notes || client.note || "");
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
  const [savingClient, setSavingClient] = useState(false);
  const [error, setError] = useState("");
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);
  const [showClientEditor, setShowClientEditor] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [form, setForm] = useState<FormState>(initialForm);
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
      const message = err instanceof Error ? err.message : "Caricamento non riuscito.";
      setError(`Errore: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  function openNewClient() {
    setSelectedClient(null);
    setForm(initialForm);
    setShowClientEditor(true);
    setActiveTab("clienti");
  }

  function openClient(client: ClientRecord) {
    setSelectedClient(client);
    setForm({
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
      name: form.name.trim() || "Cliente senza nome",
      city: form.city.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      notes: form.notes.trim() || null,
      chest: form.chest.trim() || null,
      waist: form.waist.trim() || null,
      hip: form.hip.trim() || null,
      shoulder: form.shoulder.trim() || null,
      sleeve: form.sleeve.trim() || null,
      neck: form.neck.trim() || null,
      inseam: form.inseam.trim() || null,
      outseam: form.outseam.trim() || null,
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
      const message = err instanceof Error ? err.message : "Salvataggio non riuscito.";
      setError(`Errore: ${message}`);
    } finally {
      setSavingClient(false);
    }
  }

  const filteredClients = clients.filter((client) => {
    const haystack = `${getClientName(client)} ${getClientCity(client)} ${getClientPhone(client)} ${getClientEmail(client)}`
      .toLowerCase()
      .trim();
    return haystack.includes(clientSearch.toLowerCase().trim());
  });

  const openOrdersCount = orders.filter(isOrderOpen).length;
  const totalOrderValue = orders.reduce((sum, order) => {
    const value = Number(order.total ?? order.amount ?? order.value ?? 0);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

  const totalDeposits = orders.reduce((sum, order) => {
    const value = Number(order.acconto ?? order.deposit ?? 0);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

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
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>
                    Ordine #{String(order.id ?? index + 1)}
                  </div>
                  <div style={styles.helper}>
                    Stato: {String(order.status || "Aperto")}
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
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome cliente"
                />
              </div>

              <div style={styles.fieldBlock}>
                <label style={styles.label}>Città</label>
                <input
                  style={styles.input}
                  value={form.city}
                  onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder="Città"
                />
              </div>

              <div style={styles.fieldBlock}>
                <label style={styles.label}>Telefono</label>
                <input
                  style={styles.input}
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="Telefono"
                />
              </div>

              <div style={styles.fieldBlock}>
                <label style={styles.label}>Email</label>
                <input
                  style={styles.input}
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="Email"
                />
              </div>
            </div>

            <div style={styles.fieldBlock}>
              <label style={styles.label}>Note</label>
              <textarea
                style={styles.textarea}
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
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
                    value={form[key as keyof FormState]}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                    placeholder={label}
                  />
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
                marginTop: 24,
                flexWrap: "wrap",
              }}
            >
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

              <button
                style={{
                  ...styles.button,
                  width: isMobile ? "100%" : "auto",
                }}
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
                );
              })
            )}
          </div>
        </div>

        {renderClientEditor()}
      </div>
    );
  }

  function renderSimplePanel(title: string, rows: Array<{ title: string; meta?: string }>) {
    return (
      <div style={styles.panel}>
        <h2 style={styles.panelTitle}>{title}</h2>
        <div style={styles.list}>
          {rows.length === 0 ? (
            <div style={styles.muted}>Nessun elemento disponibile.</div>
          ) : (
            rows.map((row, idx) => (
              <div key={`${row.title}-${idx}`} style={styles.clientItem}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{row.title}</div>
                {row.meta ? <div style={styles.helper}>{row.meta}</div> : null}
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
            <div style={styles.subtitle}>Versione premium sincronizzata con Supabase.</div>
          </div>

          <button style={styles.button} onClick={() => void loadAllData(true)} disabled={loading}>
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
        {activeTab === "misure" &&
          renderSimplePanel(
            "Misure",
            clients.map((client) => ({
              title: getClientName(client),
              meta: [
                client.chest ? `Chest ${client.chest}` : "",
                client.waist ? `Waist ${client.waist}` : "",
                client.hip ? `Hip ${client.hip}` : "",
                client.outseam ? `Outseam ${client.outseam}` : "",
              ]
                .filter(Boolean)
                .join(" · "),
            }))
          )}
        {activeTab === "ordini" &&
          renderSimplePanel(
            "Ordini",
            orders.map((order, idx) => ({
              title: `Ordine #${String(order.id ?? idx + 1)}`,
              meta: `Stato: ${String(order.status || "Aperto")}`,
            }))
          )}
        {activeTab === "preventivi" &&
          renderSimplePanel(
            "Preventivi",
            quotes.map((quote, idx) => ({
              title: `Preventivo #${String(quote.id ?? idx + 1)}`,
              meta: `Valore: ${euro(Number(quote.total ?? quote.amount ?? quote.value ?? 0))}`,
            }))
          )}
      </div>
    </main>
  );
}