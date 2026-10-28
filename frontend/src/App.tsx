import {
  Activity,
  BarChart3,
  Building,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Download,
  Eye,
  EyeOff,
  FileText,
  Key,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  Menu,
  MoreVertical,
  Phone,
  Plus,
  Printer,
  RotateCcw,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  FormEvent,
  ReactNode,
} from "react";

import jgLogo from "./assets/jg-logo.png";

/* =========================================================
   TYPES
========================================================= */

type UserRole =
  | "MANAGER"
  | "EXECUTIVE";

type InvoiceStatus =
  | "Paid"

  | "Partially Paid";


type PaymentMode =
  | "Cash"
  | "UPI"

  | "Other";

interface LoggedUser {
  id: number;
  name: string;
  username: string;
  role: UserRole;
}

interface Invoice {
  id: number;
  invoiceNumber: string;

  tenant: string;
  room: string;
  mobile: string;

  billingMonth: string;
  serviceDescription: string;

  quantity: number;
  rate: number;

  amount: number;
  received: number;
  balance: number;

  status: InvoiceStatus;
  paymentMode: PaymentMode;

  paymentDateTime: string;
  transactionId: string;

  notes: string;

  createdBy: string;
  createdAt: string;
}

interface Executive {
  id: number;
  name: string;
  mobile: string;
  username: string;
  password: string;
  active: boolean;
  createdAt: string;
}

/* =========================================================
   STORAGE
========================================================= */

const INVOICE_KEY = "jeevith_invoices";
const INVOICE_SEQUENCE_KEY = "jeevith_invoice_sequences";
const EXECUTIVE_KEY = "jeevith_executives";
const SESSION_KEY = "jeevith_session";
const MANAGER_PASSWORD_KEY = "jeevith_manager_password";
const MANAGER_ACCOUNT_KEY = "jeevith_manager_account";
const ACTIVITY_LOGS_KEY = "jeevith_activity_logs";
const SETTINGS_KEY = "jeevith_app_settings";

const INITIALIZED_KEY =
  "jeevith_empty_data_initialized_v5";

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  role: UserRole;
  action: string;
  details: string;
}

export interface AppSettings {
  businessName: string;
  address: string;
  mobile: string;
  email: string;
  signatoryTitle: string;
  signatoryName: string;
  terms: string[];
}

export interface ManagerAccount {
  name: string;
  mobile: string;
  username: string;
  password: string;
  createdAt: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  businessName: "Jeewith Gardens Hotel, Co-living & PG Gents/Ladies",
  address:
    "107, Jeevith Gardens, ITPL Main Road, Brookfield, Kundalahalli, Bengaluru, Karnataka",
  mobile: "+91 7411517788",
  email: "jeewithhotel@gmail.com",
  signatoryTitle: "Authorized Signatory",
  signatoryName: "Jeewith Gardens",
  terms: [
    "Payment must be made on or before the due date.",
    "Keep this invoice as proof of payment.",
    "Payment once processed is subject to the accommodation policy.",
  ],
};

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      terms: Array.isArray(parsed.terms) && parsed.terms.length > 0
        ? parsed.terms
        : DEFAULT_SETTINGS.terms,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(s: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch (err) {
    console.error('Failed to save settings', err);
  }
}

function loadActivityLogs(): ActivityLog[] {
  try {
    const raw = localStorage.getItem(ACTIVITY_LOGS_KEY);
    if (!raw) {
      const initialLogs: ActivityLog[] = [
        {
          id: "log-init-1",
          timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
          user: "admin",
          role: "MANAGER",
          action: "SYSTEM_INITIALIZED",
          details: "Jeevith Gardens IMS initialized and audit logging enabled.",
        },
        {
          id: "log-init-2",
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          user: "admin",
          role: "MANAGER",
          action: "LOGIN",
          details: "Manager signed into the administrative dashboard.",
        },
      ];
      localStorage.setItem(ACTIVITY_LOGS_KEY, JSON.stringify(initialLogs));
      return initialLogs;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadData<T>(key: string): T[] {
  try {
    const value = localStorage.getItem(key);

    if (!value) {
      return [];
    }

    const parsed = JSON.parse(value);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function saveData<T>(
  key: string,
  value: T[]
) {
  localStorage.setItem(
    key,
    JSON.stringify(value)
  );
}

/* =========================================================
   APP
========================================================= */

export default function App() {
  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false);

  const [
    activePage,
    setActivePage,
  ] = useState("Dashboard");

  const [
    invoices,
    setInvoices,
  ] = useState<Invoice[]>(() =>
    loadData<Invoice>(INVOICE_KEY)
  );

  const [
    executives,
    setExecutives,
  ] = useState<Executive[]>(() =>
    loadData<Executive>(EXECUTIVE_KEY)
  );

  const [
    loggedUser,
    setLoggedUser,
  ] = useState<LoggedUser | null>(() => {
    try {
      const saved =
        localStorage.getItem(
          SESSION_KEY
        );

      return saved
        ? JSON.parse(saved)
        : null;
    } catch {
      return null;
    }
  });

  const [
    showInvoiceModal,
    setShowInvoiceModal,
  ] = useState(false);

  const [
    showExecutiveModal,
    setShowExecutiveModal,
  ] = useState(false);

  const [
    passwordModalExecutive,
    setPasswordModalExecutive,
  ] = useState<Executive | null>(null);

  const [
    previewInvoice,
    setPreviewInvoice,
  ] = useState<Invoice | null>(null);

  const [
    activityLogs,
    setActivityLogs,
  ] = useState<ActivityLog[]>(() =>
    loadActivityLogs()
  );

  const [
    settings,
    setSettings,
  ] = useState<AppSettings>(() =>
    loadSettings()
  );

  function recordActivity(
    action: string,
    details: string,
    user?: string,
    role?: UserRole
  ) {
    const newLog: ActivityLog = {
      id: "log-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      user: user || (loggedUser ? loggedUser.name : "Manager"),
      role: role || (loggedUser ? loggedUser.role : "MANAGER"),
      action,
      details,
    };
    setActivityLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 500);
      try {
        localStorage.setItem(ACTIVITY_LOGS_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to save activity logs", err);
      }
      return updated;
    });
  }

  function clearActivityLogs() {
    if (window.confirm("Are you sure you want to clear all activity logs? This cannot be undone.")) {
      setActivityLogs([]);
      localStorage.removeItem(ACTIVITY_LOGS_KEY);
    }
  }

  function handleSaveSettings(updated: AppSettings) {
    setSettings(updated);
    saveSettings(updated);
    recordActivity("SETTINGS_UPDATED", "Business details, contact info, or invoice terms updated");
    alert("Settings saved successfully!");
  }

  function handleResetDemoData() {
    if (
      window.confirm(
        "Warning: This will clear all local invoices, executive staff, activity logs, and reset settings to default. Proceed?"
      )
    ) {
      localStorage.clear();
      window.location.reload();
    }
  }

  function handleExportBackup() {
    const backupData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      invoices,
      executives,
      settings,
      activityLogs,
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `jeevith_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    recordActivity("BACKUP_EXPORTED", "Full system JSON backup downloaded");
  }

  function handleUpdateManagerPassword(newPass: string) {
    localStorage.setItem(MANAGER_PASSWORD_KEY, newPass);
    recordActivity("PASSWORD_RESET", "Manager password updated directly from Settings");
    alert("Manager password updated successfully!");
  }

  /* =======================================================
     REMOVE OLD DEMO DATA ONLY ONCE
  ======================================================= */

  useEffect(() => {
    const initialized =
      localStorage.getItem(
        INITIALIZED_KEY
      );

    if (!initialized) {
      localStorage.removeItem(
        INVOICE_KEY
      );

      localStorage.removeItem(
        EXECUTIVE_KEY
      );

      localStorage.setItem(
        INITIALIZED_KEY,
        "true"
      );
    }
  }, []);

  /* =======================================================
     SAVE DATA
  ======================================================= */

  useEffect(() => {
    saveData(
      INVOICE_KEY,
      invoices
    );
  }, [invoices]);

  useEffect(() => {
    saveData(
      EXECUTIVE_KEY,
      executives
    );
  }, [executives]);

  /* =======================================================
     LOGIN
  ======================================================= */

  function handleLogin(
    user: LoggedUser
  ) {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify(user)
    );

    setLoggedUser(user);
    setActivePage("Dashboard");
  }

  /* =======================================================
     LOGOUT
  ======================================================= */

  function handleLogout() {
    if (loggedUser) {
      recordActivity("LOGOUT", `${loggedUser.name} signed out`);
    }
    localStorage.removeItem(
      SESSION_KEY
    );

    setLoggedUser(null);
    setSidebarOpen(false);
    setActivePage("Dashboard");
  }

  /* =======================================================
     CREATE INVOICE
  ======================================================= */

  function addInvoice(
    invoice: Invoice
  ) {
    setInvoices(
      current => [
        invoice,
        ...current,
      ]
    );

    setShowInvoiceModal(false);

    setPreviewInvoice(invoice);

    recordActivity(
      "INVOICE_CREATED",
      `Created invoice ${invoice.invoiceNumber} for ${invoice.tenant} (Room: ${invoice.room}, ₹${invoice.amount})`
    );
  }

  /* =======================================================
     DELETE INVOICE
     MANAGER ONLY
  ======================================================= */

  function deleteInvoice(
    id: number
  ) {
    if (
      loggedUser?.role !==
      "MANAGER"
    ) {
      return;
    }

    const invoice =
      invoices.find(
        item =>
          item.id === id
      );

    if (!invoice) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete invoice ${invoice.invoiceNumber}?`
      );

    if (!confirmed) {
      return;
    }

    setInvoices(
      current =>
        current.filter(
          item =>
            item.id !== id
        )
    );

    recordActivity(
      "INVOICE_DELETED",
      `Deleted invoice ${invoice.invoiceNumber} for ${invoice.tenant}`
    );
  }

  /* =======================================================
     EXECUTIVES
  ======================================================= */

  function addExecutive(
    executive: Executive
  ) {
    setExecutives(
      current => [
        executive,
        ...current,
      ]
    );

    setShowExecutiveModal(false);

    recordActivity(
      "EXECUTIVE_ADDED",
      `Added staff account ${executive.name} (@${executive.username})`
    );
  }

  function updateExecutiveStatus(
    id: number,
    active: boolean
  ) {
    if (
      loggedUser?.role !==
      "MANAGER"
    ) {
      return;
    }

    const exec = executives.find(item => item.id === id);

    setExecutives(
      current =>
        current.map(
          item =>
            item.id === id
              ? {
                ...item,
                active,
              }
              : item
        )
    );

    recordActivity(
      "EXECUTIVE_STATUS",
      `Staff member ${exec ? exec.name : id} status set to ${active ? "Active" : "Inactive"}`
    );
  }

  function deleteExecutive(
    id: number
  ) {
    if (
      loggedUser?.role !==
      "MANAGER"
    ) {
      return;
    }

    const executive =
      executives.find(
        item =>
          item.id === id
      );

    if (!executive) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete executive "${executive.name}"?`
      );

    if (!confirmed) {
      return;
    }

    setExecutives(
      current =>
        current.filter(
          item =>
            item.id !== id
        )
    );

    recordActivity(
      "EXECUTIVE_DELETED",
      `Deleted staff account ${executive.name} (@${executive.username})`
    );
  }

  function updateExecutivePassword(
    id: number,
    newPassword: string
  ) {
    if (
      loggedUser?.role !==
      "MANAGER"
    ) {
      return;
    }

    const exec = executives.find(item => item.id === id);

    setExecutives(
      current =>
        current.map(
          item =>
            item.id === id
              ? {
                ...item,
                password:
                  newPassword,
              }
              : item
        )
    );

    recordActivity(
      "EXECUTIVE_PASSWORD_UPDATED",
      `Password changed for staff member ${exec ? exec.name : id}`
    );
  }

  /* =======================================================
     MENU
  ======================================================= */

  const menu =
    loggedUser?.role ===
      "MANAGER"
      ? [
        {
          title: "MAIN",
          items: [
            {
              label: "Dashboard",
              icon: LayoutDashboard,
            },
          ],
        },
        {
          title:
            "INVOICE MANAGEMENT",
          items: [
            {
              label: "Invoices",
              icon: FileText,
            },
            {
              label:
                "Create Invoice",
              icon: Plus,
            },
          ],
        },
        {
          title: "MANAGEMENT",
          items: [
            {
              label:
                "Executives",
              icon: Users,
            },
          ],
        },
        {
          title: "REPORTS",
          items: [
            {
              label: "Reports",
              icon: BarChart3,
            },
          ],
        },
        {
          title: "SYSTEM",
          items: [
            {
              label:
                "Activity Logs",
              icon: Activity,
            },
            {
              label: "Settings",
              icon: Settings,
            },
          ],
        },
      ]
      : [
        {
          title: "MAIN",
          items: [
            {
              label: "Dashboard",
              icon: LayoutDashboard,
            },
          ],
        },
        {
          title:
            "INVOICE MANAGEMENT",
          items: [
            {
              label:
                "Create Invoice",
              icon: Plus,
            },
            {
              label:
                "My Invoices",
              icon: FileText,
            },
          ],
        },
        {
          title: "ACCOUNT",
          items: [
            {
              label: "Profile",
              icon: Users,
            },
          ],
        },
      ];

  /* =======================================================
     LOGIN
  ======================================================= */

  if (!loggedUser) {
    return (
      <LoginPage
        executives={executives}
        settings={settings}
        onLogin={handleLogin}
        onLogActivity={recordActivity}
      />
    );
  }

  /* =======================================================
     ROLE BASED INVOICES
  ======================================================= */

  const visibleInvoices =
    loggedUser.role ===
      "MANAGER"
      ? invoices
      : invoices.filter(
        invoice =>
          invoice.createdBy ===
          loggedUser.username
      );

  /* =======================================================
     MAIN UI
  ======================================================= */

  return (
    <div className="app-shell">

      {sidebarOpen && (
        <div
          className="mobile-overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`sidebar ${sidebarOpen
          ? "sidebar-open"
          : ""
          }`}
      >

        <div className="brand">

          <div className="brand-logo">
            JG
          </div>

          <div>
            <h1>
              Jeevith
            </h1>

            <span>
              Gardens
            </span>
          </div>

          <button
            type="button"
            className="mobile-close"
            onClick={() =>
              setSidebarOpen(
                false
              )
            }
          >
            <X size={18} />
          </button>

        </div>

        <div className="sidebar-scroll">

          {menu.map(section => (
            <div
              className="menu-section"
              key={section.title}
            >

              <div className="menu-title">
                {section.title}
              </div>

              {section.items.map(
                item => {
                  const Icon =
                    item.icon;

                  return (
                    <button
                      type="button"
                      key={item.label}
                      className={`menu-item ${activePage ===
                        item.label
                        ? "active"
                        : ""
                        }`}
                      onClick={() => {

                        if (
                          item.label ===
                          "Create Invoice"
                        ) {
                          setShowInvoiceModal(
                            true
                          );

                          setSidebarOpen(
                            false
                          );

                          return;
                        }

                        setActivePage(
                          item.label
                        );

                        setSidebarOpen(
                          false
                        );
                      }}
                    >

                      <Icon
                        size={16}
                      />

                      <span>
                        {item.label}
                      </span>

                      {item.label ===
                        "Executives" && (
                          <ChevronRight
                            size={14}
                            className="menu-arrow"
                          />
                        )}

                    </button>
                  );
                }
              )}

            </div>
          ))}

        </div>

        <div className="sidebar-bottom">

          <button
            type="button"
            className="menu-item logout"
            onClick={
              handleLogout
            }
          >
            <LogOut size={16} />

            <span>
              Logout
            </span>
          </button>

        </div>

      </aside>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="main-content">

        <header className="topbar">

          <div className="topbar-left">

            <button
              type="button"
              className="mobile-menu"
              onClick={() =>
                setSidebarOpen(
                  true
                )
              }
            >
              <Menu size={21} />
            </button>

            <div className="breadcrumb">
              Home

              <ChevronRight
                size={13}
              />

              <strong>
                {activePage}
              </strong>
            </div>

          </div>

          {/* SEARCH AND NOTIFICATION REMOVED */}

          <div className="topbar-right">

            <div className="profile">

              <div className="avatar">
                {loggedUser.name
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="profile-info">

                <strong>
                  {loggedUser.name}
                </strong>

                <span>
                  {loggedUser.role ===
                    "MANAGER"
                    ? "Administrator"
                    : "Executive"}
                </span>

              </div>

              <ChevronDown
                size={15}
              />

            </div>

          </div>

        </header>

        {/* =================================================
            DASHBOARD
        ================================================= */}

        {activePage ===
          "Dashboard" && (
            <Dashboard
              invoices={
                visibleInvoices
              }
              executives={
                loggedUser.role ===
                  "MANAGER"
                  ? executives
                  : []
              }
              userRole={
                loggedUser.role
              }
              onNewInvoice={() =>
                setShowInvoiceModal(
                  true
                )
              }
              onViewInvoices={() =>
                setActivePage(
                  loggedUser.role ===
                    "MANAGER"
                    ? "Invoices"
                    : "My Invoices"
                )
              }
              onPreviewInvoice={
                setPreviewInvoice
              }
            />
          )}

        {/* =================================================
            MANAGER INVOICES
        ================================================= */}

        {activePage ===
          "Invoices" &&
          loggedUser.role ===
          "MANAGER" && (
            <InvoicesPage
              invoices={
                visibleInvoices
              }
              userRole={
                loggedUser.role
              }
              onNewInvoice={() =>
                setShowInvoiceModal(
                  true
                )
              }
              onDelete={
                deleteInvoice
              }
              onPreview={
                setPreviewInvoice
              }
            />
          )}

        {/* =================================================
            EXECUTIVE INVOICES
        ================================================= */}

        {activePage ===
          "My Invoices" && (
            <InvoicesPage
              invoices={
                visibleInvoices
              }
              userRole={
                loggedUser.role
              }
              onNewInvoice={() =>
                setShowInvoiceModal(
                  true
                )
              }
              onPreview={
                setPreviewInvoice
              }
            />
          )}

        {/* =================================================
            EXECUTIVES
        ================================================= */}

        {activePage ===
          "Executives" &&
          loggedUser.role ===
          "MANAGER" && (
            <ExecutivesPage
              executives={
                executives
              }
              onAdd={() =>
                setShowExecutiveModal(
                  true
                )
              }
              onToggle={
                updateExecutiveStatus
              }
              onDelete={
                deleteExecutive
              }
              onSetPassword={
                setPasswordModalExecutive
              }
              invoices={
                invoices
              }
            />
          )}

        {/* =================================================
            REPORTS
        ================================================= */}

        {activePage ===
          "Reports" &&
          loggedUser.role ===
          "MANAGER" && (
            <ReportsPage
              invoices={
                invoices
              }
              onPreview={
                setPreviewInvoice
              }
            />
          )}

        {/* =================================================
            ACTIVITY LOGS
        ================================================= */}

        {activePage ===
          "Activity Logs" &&
          loggedUser.role ===
          "MANAGER" && (
            <ActivityLogsPage
              logs={activityLogs}
              onClearLogs={clearActivityLogs}
            />
          )}

        {/* =================================================
            SETTINGS
        ================================================= */}

        {activePage ===
          "Settings" &&
          loggedUser.role ===
          "MANAGER" && (
            <SettingsPage
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onResetDemoData={handleResetDemoData}
              onExportBackup={handleExportBackup}
              onUpdateManagerPassword={handleUpdateManagerPassword}
            />
          )}

        {/* =================================================
            PROFILE
        ================================================= */}

        {activePage ===
          "Profile" && (
            <ProfilePage
              user={loggedUser}
            />
          )}

      </main>

      {/* ===================================================
          CREATE INVOICE
      =================================================== */}

      {showInvoiceModal && (
        <InvoiceModal
          user={loggedUser}
          invoices={invoices}
          onClose={() =>
            setShowInvoiceModal(
              false
            )
          }
          onSave={addInvoice}
        />
      )}

      {/* ===================================================
          ADD EXECUTIVE
      =================================================== */}

      {showExecutiveModal &&
        loggedUser.role ===
        "MANAGER" && (
          <ExecutiveModal
            executives={
              executives
            }
            onClose={() =>
              setShowExecutiveModal(
                false
              )
            }
            onSave={
              addExecutive
            }
          />
        )}

      {/* ===================================================
          SET EXECUTIVE PASSWORD (MANAGER ONLY)
      =================================================== */}

      {passwordModalExecutive &&
        loggedUser.role ===
        "MANAGER" && (
          <SetExecutivePasswordModal
            executive={
              passwordModalExecutive
            }
            onClose={() =>
              setPasswordModalExecutive(
                null
              )
            }
            onSave={
              updateExecutivePassword
            }
          />
        )}

      {/* ===================================================
          INVOICE PREVIEW
      =================================================== */}

      {previewInvoice && (
        <InvoicePreviewModal
          invoice={
            previewInvoice
          }
          settings={settings}
          onClose={() =>
            setPreviewInvoice(
              null
            )
          }
        />
      )}

    </div>
  );
}

/* =========================================================
   LOGIN
========================================================= */

function LoginPage({
  executives,
  settings,
  onLogin,
  onLogActivity,
}: {
  executives: Executive[];
  settings: AppSettings;
  onLogin: (
    user: LoggedUser
  ) => void;
  onLogActivity: (action: string, details: string) => void;
}) {
  const [
    mode,
    setMode,
  ] = useState<
    "login" | "forgot" | "create_account"
  >("login");

  // Registration state
  const [regStep, setRegStep] = useState<"details" | "otp">("details");
  const [regName, setRegName] = useState("");
  const [regMobile, setRegMobile] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regOtp, setRegOtp] = useState("");
  const [regGeneratedOtp, setRegGeneratedOtp] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  const [
    role,
    setRole,
  ] = useState<UserRole>(
    "MANAGER"
  );

  const [
    username,
    setUsername,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    forgotMobile,
    setForgotMobile,
  ] = useState("");

  const [
    otp,
    setOtp,
  ] = useState("");

  const [
    generatedOtp,
    setGeneratedOtp,
  ] = useState("");

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showNewPassword,
    setShowNewPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [
    forgotStep,
    setForgotStep,
  ] = useState<
    "mobile" |
    "otp" |
    "password"
  >("mobile");

  function submitLogin(
    e: FormEvent
  ) {
    e.preventDefault();
    setError("");

    const cleanUsername =
      username
        .trim()
        .toLowerCase();

    if (!cleanUsername) {
      setError(
        "Enter your username."
      );
      return;
    }

    if (!password) {
      setError(
        "Enter your password."
      );
      return;
    }

    if (
      role === "MANAGER"
    ) {
      const storedPassword =
        localStorage.getItem(
          MANAGER_PASSWORD_KEY
        );

      let storedAccount: ManagerAccount | null = null;
      try {
        const raw = localStorage.getItem(MANAGER_ACCOUNT_KEY);
        if (raw) storedAccount = JSON.parse(raw);
      } catch {}

      const validUsername = storedAccount ? storedAccount.username.toLowerCase() : "admin";
      const validPassword = storedPassword || storedAccount?.password || "admin123";
      const validName = storedAccount?.name || "Manager";

      if (
        (cleanUsername === "admin" || cleanUsername === validUsername) &&
        password === validPassword
      ) {
        onLogActivity("LOGIN", `Manager '${validName}' (@${cleanUsername}) logged in successfully`);
        onLogin({
          id: 1,
          name: validName,
          username: cleanUsername,
          role: "MANAGER",
        });

        return;
      }

      setError(
        "Invalid administrator username or password."
      );

      return;
    }

    const executive =
      executives.find(
        item =>
          item.username
            .trim()
            .toLowerCase() ===
          cleanUsername &&
          item.password ===
          password &&
          item.active
      );

    if (!executive) {
      setError(
        "Invalid executive credentials or inactive account."
      );
      return;
    }

    onLogActivity("LOGIN", `Executive '${executive.name}' (@${executive.username}) logged in successfully`);
    onLogin({
      id: executive.id,
      name: executive.name,
      username:
        executive.username,
      role: "EXECUTIVE",
    });
  }

  function sendOtp(
    e: FormEvent
  ) {
    e.preventDefault();
    setError("");

    const mobile =
      forgotMobile.trim();

    if (
      !/^\d{10}$/.test(
        mobile
      )
    ) {
      setError(
        "Enter a valid 10-digit mobile number."
      );
      return;
    }

    let storedAccount: ManagerAccount | null = null;
    try {
      const raw = localStorage.getItem(MANAGER_ACCOUNT_KEY);
      if (raw) storedAccount = JSON.parse(raw);
    } catch {}

    const cleanSettingsMobile = (settings.mobile || "").replace(/\D/g, "").slice(-10);
    const cleanAccountMobile = (storedAccount?.mobile || "").replace(/\D/g, "").slice(-10);

    const validMobiles = ["7411517788", cleanSettingsMobile, cleanAccountMobile].filter(Boolean);

    if (!validMobiles.includes(mobile)) {
      setError(
        "This mobile number is not registered for the Manager account."
      );
      return;
    }

    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();

    setGeneratedOtp(
      randomOtp
    );

    setForgotStep(
      "otp"
    );

    window.alert(
      `Manager Password Reset OTP: ${randomOtp}\n(Sent to registered mobile +91 ${mobile})`
    );
  }

  function verifyOtp(
    e: FormEvent
  ) {
    e.preventDefault();
    setError("");

    if (
      otp.trim() !==
      generatedOtp
    ) {
      setError(
        "Invalid OTP."
      );
      return;
    }

    setForgotStep(
      "password"
    );
  }

  function sendRegistrationOtp(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!regName.trim()) {
      setError("Enter manager name.");
      return;
    }
    const cleanMob = regMobile.trim().replace(/\D/g, "");
    if (!/^\d{10}$/.test(cleanMob)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    if (regUsername.trim().length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (regPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setRegGeneratedOtp(code);
    setRegStep("otp");
    window.alert(`Manager Account Creation OTP: ${code}\n(Sent to mobile +91 ${cleanMob})`);
  }

  function verifyRegistrationOtp(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (regOtp.trim() !== regGeneratedOtp) {
      setError("Invalid OTP. Please check the 6-digit code.");
      return;
    }

    const cleanMob = regMobile.trim().replace(/\D/g, "");
    const newAccount: ManagerAccount = {
      name: regName.trim(),
      mobile: cleanMob,
      username: regUsername.trim().toLowerCase(),
      password: regPassword,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(MANAGER_ACCOUNT_KEY, JSON.stringify(newAccount));
    localStorage.setItem(MANAGER_PASSWORD_KEY, regPassword);

    onLogActivity("ACCOUNT_CREATED", `Created new Manager account for ${newAccount.name} (@${newAccount.username}) with mobile +91 ${cleanMob}`);

    window.alert(`Manager account created successfully for @${newAccount.username}! Please log in.`);

    setMode("login");
    setRole("MANAGER");
    setUsername(newAccount.username);
    setPassword("");
    setRegStep("details");
    setRegName("");
    setRegMobile("");
    setRegUsername("");
    setRegPassword("");
    setRegConfirmPassword("");
    setRegOtp("");
    setRegGeneratedOtp("");
  }

  function resetPassword(
    e: FormEvent
  ) {
    e.preventDefault();
    setError("");

    if (
      newPassword.length <
      6
    ) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    localStorage.setItem(
      MANAGER_PASSWORD_KEY,
      newPassword
    );

    try {
      const raw = localStorage.getItem(MANAGER_ACCOUNT_KEY);
      if (raw) {
        const acc = JSON.parse(raw);
        acc.password = newPassword;
        localStorage.setItem(MANAGER_ACCOUNT_KEY, JSON.stringify(acc));
      }
    } catch {}

    onLogActivity("PASSWORD_RESET", "Manager password was reset successfully via OTP verification");

    window.alert(
      "Administrator password reset successfully! You can now log in."
    );

    setMode("login");
    setForgotStep(
      "mobile"
    );
    setForgotMobile("");
    setOtp("");
    setGeneratedOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setPassword("");
    setError("");
  }

  if (
    mode === "login"
  ) {
    return (
      <div className="login-page">

        <div className="login-card">

          <div className="login-brand">

            <div className="login-logo">
              JG
            </div>

            <div>
              <h1>
                Jeevith
              </h1>

              <span>
                Gardens
              </span>
            </div>

          </div>

          <div className="login-heading">
            <h2>
              Welcome back
            </h2>

            <p>
              Sign in to Jeevith
              Gardens Management
              System.
            </p>
          </div>

          <form
            onSubmit={
              submitLogin
            }
          >

            <label className="login-field">
              <span>
                Login As
              </span>

              <select
                value={role}
                onChange={e => {
                  setRole(
                    e.target
                      .value as
                    UserRole
                  );
                  setError("");
                }}
              >
                <option value="MANAGER">
                  Administrator / Manager
                </option>

                <option value="EXECUTIVE">
                  Executive
                </option>
              </select>
            </label>

            <label className="login-field">
              <span>
                Username
              </span>

              <input
                value={username}
                onChange={e => {
                  setUsername(
                    e.target.value
                  );
                  setError("");
                }}
                placeholder="Enter username"
              />
            </label>

            <label className="login-field">
              <span>
                Password
              </span>

              <PasswordInput
                value={password}
                show={
                  showPassword
                }
                onChange={
                  setPassword
                }
                onToggle={() =>
                  setShowPassword(
                    v => !v
                  )
                }
                placeholder="Enter password"
              />
            </label>

            {role === "MANAGER" ? (
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  marginTop: "-4px",
                  marginBottom:
                    "14px",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setMode(
                      "create_account"
                    );
                    setRegStep(
                      "details"
                    );
                    setError("");
                  }}
                  style={{
                    border: "none",
                    background:
                      "transparent",
                    color: "#6366f1",
                    fontSize: "10.5px",
                    fontWeight: 700,
                    cursor:
                      "pointer",
                  }}
                >
                  + Create Manager Acc
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode(
                      "forgot"
                    );
                    setForgotStep(
                      "mobile"
                    );
                    setError("");
                  }}
                  style={{
                    border: "none",
                    background:
                      "transparent",
                    color: "#6366f1",
                    fontSize: "10.5px",
                    fontWeight: 600,
                    cursor:
                      "pointer",
                  }}
                >
                  Forgot Password?
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "flex-end",
                  marginTop: "-4px",
                  marginBottom:
                    "12px",
                }}
              >
                <span
                  style={{
                    color: "#64748b",
                    fontSize: "10px",
                  }}
                >
                  Password setting is managed by the manager.
                </span>
              </div>
            )}

            {error && (
              <ErrorMessage
                message={error}
              />
            )}

            <button
              className="login-button"
              type="submit"
            >
              Login
            </button>

          </form>

          <p className="login-footer">
            Jeevith Gardens Hotel,
            Co-living & PG
          </p>

        </div>

      </div>
    );
  }

  if (mode === "create_account") {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-brand">
            <div className="login-logo">JG</div>
            <div>
              <h1>Jeevith</h1>
              <span>Gardens</span>
            </div>
          </div>

          <div className="login-heading">
            <h2>Create Manager Account</h2>
            <p>Register administrative credentials with mobile OTP verification.</p>
          </div>

          {regStep === "details" && (
            <form onSubmit={sendRegistrationOtp}>
              <label className="login-field">
                <span>Manager Full Name</span>
                <input
                  value={regName}
                  onChange={e => { setRegName(e.target.value); setError(""); }}
                  placeholder="e.g. John Doe (Manager)"
                  required
                />
              </label>

              <label className="login-field">
                <span>10-Digit Mobile Number</span>
                <input
                  type="tel"
                  value={regMobile}
                  onChange={e => { setRegMobile(e.target.value); setError(""); }}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  required
                />
              </label>

              <label className="login-field">
                <span>Username</span>
                <input
                  value={regUsername}
                  onChange={e => { setRegUsername(e.target.value); setError(""); }}
                  placeholder="e.g. manager1 or admin"
                  required
                />
              </label>

              <label className="login-field">
                <span>Password (min 6 chars)</span>
                <PasswordInput
                  value={regPassword}
                  show={showRegPassword}
                  onChange={setRegPassword}
                  onToggle={() => setShowRegPassword(v => !v)}
                  placeholder="Create password"
                />
              </label>

              <label className="login-field">
                <span>Confirm Password</span>
                <PasswordInput
                  value={regConfirmPassword}
                  show={showRegConfirmPassword}
                  onChange={setRegConfirmPassword}
                  onToggle={() => setShowRegConfirmPassword(v => !v)}
                  placeholder="Confirm password"
                />
              </label>

              {error && <ErrorMessage message={error} />}

              <button type="submit" className="login-button">
                Send Verification OTP
              </button>

              <button
                type="button"
                className="back-link"
                onClick={() => { setMode("login"); setError(""); }}
              >
                ← Back to Login
              </button>
            </form>
          )}

          {regStep === "otp" && (
            <form onSubmit={verifyRegistrationOtp}>
              <div className="otp-dev-banner">
                <span>Registration OTP sent to +91 {regMobile}:</span>
                <strong>{regGeneratedOtp}</strong>
              </div>

              <label className="login-field">
                <span>Enter 6-Digit OTP</span>
                <input
                  value={regOtp}
                  onChange={e => setRegOtp(e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  required
                />
              </label>

              {error && <ErrorMessage message={error} />}

              <button type="submit" className="login-button">
                Verify OTP & Create Account
              </button>

              <button
                type="button"
                className="back-link"
                onClick={() => { setRegStep("details"); setError(""); }}
              >
                ← Change Details
              </button>
            </form>
          )}

          <p className="login-footer">Jeevith Gardens Hotel, Co-living & PG</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">

      <div className="login-card">

        <div className="login-brand">

          <div className="login-logo">
            JG
          </div>

          <div>
            <h1>
              Jeevith
            </h1>

            <span>
              Gardens
            </span>
          </div>

        </div>

        <div className="login-heading">
          <h2>
            Forgot Password?
          </h2>

          <p>
            Reset your account
            password.
          </p>
        </div>

        {forgotStep ===
          "mobile" && (
            <form
              onSubmit={
                sendOtp
              }
            >

              <label className="login-field">
                <span>
                  Account Type
                </span>

                <select
                  value="MANAGER"
                  disabled
                >
                  <option value="MANAGER">
                    Administrator / Manager
                  </option>
                </select>
              </label>

              <label className="login-field">
                <span>
                  Registered Mobile
                </span>

                <input
                  type="tel"
                  value={
                    forgotMobile
                  }
                  onChange={e => {
                    setForgotMobile(
                      e.target.value
                    );
                    setError("");
                  }}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                />
              </label>

              {error && (
                <ErrorMessage
                  message={error}
                />
              )}

              <button
                type="submit"
                className="login-button"
              >
                Send OTP
              </button>

            </form>
          )}

        {forgotStep ===
          "otp" && (
            <form
              onSubmit={
                verifyOtp
              }
            >

              <label className="login-field">
                <span>
                  Enter OTP
                </span>

                <input
                  value={otp}
                  onChange={e =>
                    setOtp(
                      e.target.value.replace(
                        /\D/g,
                        ""
                      )
                    )
                  }
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit OTP"
                />
              </label>

              <div className="otp-dev-banner">
                <span>OTP sent to +91 {forgotMobile}:</span>
                <strong>{generatedOtp}</strong>
              </div>

              {error && (
                <ErrorMessage
                  message={error}
                />
              )}

              <button
                type="submit"
                className="login-button"
              >
                Verify OTP
              </button>

              <button
                type="button"
                onClick={() =>
                  setForgotStep(
                    "mobile"
                  )
                }
                className="back-link"
              >
                Change mobile number
              </button>

            </form>
          )}

        {forgotStep ===
          "password" && (
            <form
              onSubmit={
                resetPassword
              }
            >

              <label className="login-field">
                <span>
                  New Password
                </span>

                <PasswordInput
                  value={
                    newPassword
                  }
                  show={
                    showNewPassword
                  }
                  onChange={
                    setNewPassword
                  }
                  onToggle={() =>
                    setShowNewPassword(
                      v => !v
                    )
                  }
                  placeholder="Enter new password"
                />
              </label>

              <label className="login-field">
                <span>
                  Confirm Password
                </span>

                <PasswordInput
                  value={
                    confirmPassword
                  }
                  show={
                    showConfirmPassword
                  }
                  onChange={
                    setConfirmPassword
                  }
                  onToggle={() =>
                    setShowConfirmPassword(
                      v => !v
                    )
                  }
                  placeholder="Confirm password"
                />
              </label>

              {error && (
                <ErrorMessage
                  message={error}
                />
              )}

              <button
                type="submit"
                className="login-button"
              >
                Reset Password
              </button>

            </form>
          )}

        <button
          type="button"
          className="back-link"
          onClick={() => {
            setMode("login");
            setError("");
          }}
        >
          ← Back to Login
        </button>

        <p className="login-footer">
          Jeevith Gardens Hotel,
          Co-living & PG
        </p>

      </div>

    </div>
  );
}

/* =========================================================
   PASSWORD INPUT
========================================================= */

function PasswordInput({
  value,
  show,
  onChange,
  onToggle,
  placeholder,
}: {
  value: string;
  show: boolean;
  onChange: (
    value: string
  ) => void;
  onToggle: () => void;
  placeholder: string;
}) {
  return (
    <div
      style={{
        position:
          "relative",
      }}
    >
      <input
        type={
          show
            ? "text"
            : "password"
        }
        value={value}
        onChange={e =>
          onChange(
            e.target.value
          )
        }
        placeholder={
          placeholder
        }
        style={{
          width: "100%",
          paddingRight:
            "44px",
        }}
      />

      <button
        type="button"
        onClick={onToggle}
        style={{
          position:
            "absolute",
          right: "10px",
          top: "50%",
          transform:
            "translateY(-50%)",
          border: "none",
          background:
            "transparent",
          cursor:
            "pointer",
          color: "#777",
          padding: "5px",
        }}
      >
        {show ? (
          <EyeOff
            size={17}
          />
        ) : (
          <Eye
            size={17}
          />
        )}
      </button>
    </div>
  );
}

/* =========================================================
   ERROR
========================================================= */

function ErrorMessage({
  message,
}: {
  message: string;
}) {
  return (
    <div
      style={{
        color: "#d95353",
        background:
          "#fff0f0",
        border:
          "1px solid #ffd7d7",
        padding: "9px",
        borderRadius: "6px",
        fontSize: "10px",
        marginBottom:
          "12px",
      }}
    >
      {message}
    </div>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard({
  invoices,
  executives,
  userRole,
  onNewInvoice,
  onViewInvoices,
  onPreviewInvoice,
}: {
  invoices: Invoice[];
  executives: Executive[];
  userRole: UserRole;
  onNewInvoice: () => void;
  onViewInvoices: () => void;
  onPreviewInvoice: (
    invoice: Invoice
  ) => void;
}) {
  /*
   * TOTAL REVENUE
   * = invoice value
   * excluding cancelled invoices.
   */
  const totalRevenue =
    invoices
      .filter(
        invoice =>
          (invoice.status as string) !==
          "Cancelled"
      )
      .reduce(
        (sum, invoice) =>
          sum + (Number(invoice.amount) || 0),
        0
      );

  /*
   * PAID REVENUE
   * = actual money received.
   * If Paid, full amount is received. If Partially Paid, received amount is used.
   */
  const paidRevenue =
    invoices
      .filter(
        invoice =>
          (invoice.status as string) !==
          "Cancelled"
      )
      .reduce(
        (sum, invoice) => {
          const isPaid = invoice.status === "Paid";
          const totalVal = Number(invoice.amount) || 0;
          const rec = isPaid ? totalVal : (Number(invoice.received) || 0);
          return sum + rec;
        },
        0
      );

  /*
   * PENDING
   * = outstanding balance
   * on Partially Paid invoices. For Paid invoices, balance is always 0 dynamically.
   */
  const pendingRevenue =
    invoices
      .filter(
        invoice =>
          (invoice.status as string) !==
          "Cancelled"
      )
      .reduce(
        (sum, invoice) => {
          if (invoice.status === "Paid") return sum;
          const totalVal = Number(invoice.amount) || 0;
          const rec = Number(invoice.received) || 0;
          const bal = invoice.balance !== undefined ? Number(invoice.balance) : Math.max(totalVal - rec, 0);
          return sum + bal;
        },
        0
      );

  const paidInvoices =
    invoices.filter(
      invoice =>
        invoice.status ===
        "Paid"
    ).length;

  const activeExecutives =
    executives.filter(
      executive =>
        executive.active
    ).length;

  return (
    <div className="page">

      <div className="page-heading">

        <div>
          <h2>
            Dashboard
          </h2>

          <p>
            {userRole ===
              "MANAGER"
              ? "Overview of Jeevith Gardens invoice activity."
              : "Overview of your invoice activity."}
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={
            onNewInvoice
          }
        >
          <Plus size={16} />
          New Invoice
        </button>

      </div>

      {/* =================================================
          ONLY REQUIRED DASHBOARD CARDS
          NO OUTSTANDING
          NO CANCELLED
      ================================================= */}

      <div className="stat-grid dashboard-stat-grid">

        <StatCard
          title="Total Invoices"
          value={String(
            invoices.length
          )}
          icon={
            <FileText
              size={19}
            />
          }
          tone="purple"
        />

        <StatCard
          title="Paid Revenue"
          value={formatMoney(
            paidRevenue
          )}
          icon={
            <CircleDollarSign
              size={19}
            />
          }
          tone="green"
        />

        <StatCard
          title="Pending"
          value={formatMoney(
            pendingRevenue
          )}
          icon={
            <FileText
              size={19}
            />
          }
          tone="orange"
        />

        <StatCard
          title="Total Revenue"
          value={formatMoney(
            totalRevenue
          )}
          icon={
            <CircleDollarSign
              size={19}
            />
          }
          tone="green"
        />

        {userRole ===
          "MANAGER" && (
            <StatCard
              title="Active Executives"
              value={String(
                activeExecutives
              )}
              icon={
                <Users
                  size={19}
                />
              }
              tone="purple"
            />
          )}

        <StatCard
          title="Paid Invoices"
          value={String(
            paidInvoices
          )}
          icon={
            <FileText
              size={19}
            />
          }
          tone="green"
        />

      </div>

      {/* =================================================
          RECENT INVOICES
      ================================================= */}

      <div className="panel invoices-panel">

        <div className="panel-heading">

          <div>
            <h3>
              Recent Invoices
            </h3>

            <p>
              {invoices.length ===
                0
                ? "No invoices have been created yet."
                : "Latest invoice activity"}
            </p>
          </div>

          {invoices.length >
            0 && (
              <button
                type="button"
                className="text-button"
                onClick={
                  onViewInvoices
                }
              >
                View all →
              </button>
            )}

        </div>

        {invoices.length ===
          0 ? (
          <EmptyTable
            message="Click New Invoice to create the first invoice."
          />
        ) : (
          <InvoiceTable
            data={invoices.slice(
              0,
              5
            )}
            onPreview={
              onPreviewInvoice
            }
            showDelete={false}
          />
        )}

      </div>

    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  icon,
  tone,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  tone: string;
}) {
  return (
    <div
      className={`stat-card ${tone}`}
    >

      <div className="stat-top">

        <span>
          {title}
        </span>

        <div className="stat-icon">
          {icon}
        </div>

      </div>

      <strong className="stat-value">
        {value}
      </strong>

      <div className="stat-change">
        <small>
          Live data
        </small>
      </div>

    </div>
  );
}

/* =========================================================
   INVOICES PAGE
========================================================= */

function InvoicesPage({
  invoices,
  userRole,
  onNewInvoice,
  onDelete,
  onPreview,
}: {
  invoices: Invoice[];
  userRole: UserRole;
  onNewInvoice: () => void;
  onDelete?: (
    id: number
  ) => void;
  onPreview: (
    invoice: Invoice
  ) => void;
}) {
  const [
    search,
    setSearch,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState<
    "All" | InvoiceStatus
  >("All");

  const filtered =
    invoices.filter(
      invoice => {
        const text =
          search
            .toLowerCase()
            .trim();

        const matchesSearch =
          !text ||
          invoice.tenant
            .toLowerCase()
            .includes(text) ||
          invoice.room
            .toLowerCase()
            .includes(text) ||
          invoice.invoiceNumber
            .toLowerCase()
            .includes(text) ||
          invoice.transactionId
            .toLowerCase()
            .includes(text);

        const matchesStatus =
          status === "All" ||
          invoice.status ===
          status;

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );

  return (
    <div className="page">

      <div className="page-heading">

        <div>
          <h2>
            {userRole ===
              "MANAGER"
              ? "Invoices"
              : "My Invoices"}
          </h2>

          <p>
            {userRole ===
              "MANAGER"
              ? "Manage all invoices."
              : "View your own invoices."}
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            type="button"
            className="filter-button"
            onClick={() => exportInvoicesCSV(filtered)}
            title="Export invoices to CSV"
          >
            <Download size={14} />
            Export CSV
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={
              onNewInvoice
            }
          >
            <Plus size={16} />
            New Invoice
          </button>
        </div>

      </div>

      <div className="panel invoices-panel">

        <div className="invoice-tabs">

          {[
            "All",
            "Paid",
            "Partially Paid",
          ].map(item => (
            <button
              type="button"
              key={item}
              className={
                status === item
                  ? "selected"
                  : ""
              }
              onClick={() =>
                setStatus(
                  item as
                  | "All"
                  | InvoiceStatus
                )
              }
            >
              {item}
            </button>
          ))}

        </div>

        <div className="table-toolbar">

          <div className="table-search">

            <input
              value={search}
              onChange={e =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search invoice, tenant, room..."
            />

          </div>

        </div>

        {filtered.length ===
          0 ? (
          <EmptyTable
            message="No invoices match your search."
          />
        ) : (
          <InvoiceTable
            data={filtered}
            onPreview={
              onPreview
            }
            onDelete={
              onDelete
            }
            showDelete={
              userRole ===
              "MANAGER"
            }
          />
        )}

      </div>

    </div>
  );
}

/* =========================================================
   INVOICE TABLE
========================================================= */

function InvoiceTable({
  data,
  onPreview,
  onDelete,
  showDelete = false,
}: {
  data: Invoice[];
  onPreview: (
    invoice: Invoice
  ) => void;
  onDelete?: (
    id: number
  ) => void;
  showDelete?: boolean;
}) {
  return (
    <div className="table-container">

      <table>

        <thead>
          <tr>
            <th>
              Invoice
            </th>

            <th>
              Tenant
            </th>

            <th>
              Room
            </th>

            <th>
              Amount
            </th>

            <th>
              Received
            </th>

            <th>
              Balance
            </th>

            <th>
              Status
            </th>

            <th>
              Payment
            </th>

            <th>
              Date
            </th>

            <th>
              Preview
            </th>

            {showDelete && (
              <th>
                Action
              </th>
            )}

          </tr>
        </thead>

        <tbody>

          {data.map(invoice => (
            <tr
              key={
                invoice.id
              }
            >

              <td>
                <strong>
                  {
                    invoice.invoiceNumber
                  }
                </strong>
              </td>

              <td>
                <div className="tenant-cell">

                  <div className="tenant-avatar">
                    {invoice.tenant
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <span>
                    {
                      invoice.tenant
                    }
                  </span>

                </div>
              </td>

              <td>
                {
                  invoice.room
                }
              </td>

              <td>
                <strong>
                  {formatMoney(
                    invoice.amount
                  )}
                </strong>
              </td>

              <td>
                {formatMoney(
                  invoice.status === "Paid"
                    ? invoice.amount
                    : invoice.received
                )}
              </td>

              <td>
                {formatMoney(
                  invoice.status === "Paid"
                    ? 0
                    : invoice.balance
                )}
              </td>

              <td>
                <StatusBadge
                  status={
                    invoice.status
                  }
                />
              </td>

              <td>
                {
                  invoice.paymentMode
                }
              </td>

              <td>
                {new Date(
                  invoice.createdAt
                ).toLocaleDateString(
                  "en-IN"
                )}
              </td>

              <td>
                <button
                  type="button"
                  className="more-button"
                  title="Preview invoice"
                  onClick={() =>
                    onPreview(
                      invoice
                    )
                  }
                >
                  <Eye
                    size={16}
                  />
                </button>
              </td>

              {showDelete && (
                <td>
                  <button
                    type="button"
                    className="more-button"
                    title="Delete invoice"
                    onClick={() =>
                      onDelete?.(
                        invoice.id
                      )
                    }
                  >
                    <MoreVertical
                      size={16}
                    />
                  </button>
                </td>
              )}

            </tr>
          ))}

        </tbody>

      </table>

    </div>
  );
}

/* =========================================================
   STATUS
========================================================= */

function StatusBadge({
  status,
}: {
  status: InvoiceStatus;
}) {
  const className =
    status === "Paid"
      ? "paid"
      : (status as string) ===
        "Cancelled"
        ? "cancelled"
        : status ===
          "Partially Paid"
          ? "partial"
          : "pending";

  return (
    <span
      className={`status-badge ${className}`}
    >
      <i />
      {status}
    </span>
  );
}

/* =========================================================
   CREATE INVOICE
========================================================= */

function InvoiceModal({
  user,
  invoices,
  onClose,
  onSave,
}: {
  user: LoggedUser;
  invoices: Invoice[];
  onClose: () => void;
  onSave: (
    invoice: Invoice
  ) => void;
}) {
  const [
    tenant,
    setTenant,
  ] = useState("");

  const [
    room,
    setRoom,
  ] = useState("");

  const [
    paymentMode,
    setPaymentMode,
  ] = useState<PaymentMode>(
    "UPI"
  );

  const [
    amount,
    setAmount,
  ] = useState("");

  const [
    paidAmount,
    setPaidAmount,
  ] = useState("");

  const [
    billingMonth,
    setBillingMonth,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState<InvoiceStatus>(
    "Paid"
  );

  const [
    paymentDateTime,
    setPaymentDateTime,
  ] = useState("");

  const [
    description,
    setDescription,
  ] = useState(
    "Accommodation Rent"
  );

  const [
    transactionId,
    setTransactionId,
  ] = useState("");

  const [
    notes,
    setNotes,
  ] = useState("");

  function resetForm() {
    setTenant("");
    setRoom("");
    setPaymentMode(
      "UPI"
    );
    setAmount("");
    setPaidAmount("");
    setBillingMonth("");
    setStatus("Paid");
    setPaymentDateTime(
      ""
    );
    setDescription(
      "Accommodation Rent"
    );
    setTransactionId("");
    setNotes("");
  }

  function submit(
    e: FormEvent
  ) {
    e.preventDefault();

    if (!tenant.trim()) {
      window.alert(
        "Enter tenant name."
      );
      return;
    }

    if (!room.trim()) {
      window.alert(
        "Enter room number."
      );
      return;
    }

    const total =
      Number(amount);

    if (
      !Number.isFinite(
        total
      ) ||
      total <= 0
    ) {
      window.alert(
        status === "Partially Paid"
          ? "Enter a valid total amount."
          : "Enter a valid amount."
      );
      return;
    }

    let received = total;
    let balance = 0;

    if (status === "Partially Paid") {
      const paid = Number(paidAmount);
      if (!Number.isFinite(paid) || paid <= 0) {
        window.alert("Enter a valid paid amount.");
        return;
      }
      if (paid >= total) {
        window.alert(
          "For Partially Paid status, the paid amount must be less than the total amount. If full amount was paid, select 'Paid'."
        );
        return;
      }
      received = paid;
      balance = Math.round((total - paid) * 100) / 100;
    }

    if (!billingMonth) {
      window.alert(
        "Select billing month and year."
      );
      return;
    }

    if (!paymentDateTime) {
      window.alert(
        "Select payment date and time."
      );
      return;
    }

    if (!description.trim()) {
      window.alert(
        "Enter service description."
      );
      return;
    }

    if (!transactionId.trim()) {
      window.alert(
        "Transaction ID is mandatory."
      );
      return;
    }

    const now =
      new Date();

    const billingMonthLabel =
      new Date(
        `${billingMonth}-01T00:00:00`
      ).toLocaleDateString(
        "en-IN",
        {
          month:
            "long",
          year:
            "numeric",
        }
      );

    const invoice: Invoice = {
      id: Date.now(),

      invoiceNumber:
        generateInvoiceNumber(
          now,
          invoices
        ),

      tenant:
        tenant.trim(),

      room:
        room.trim(),

      mobile: "",

      billingMonth:
        billingMonthLabel,

      serviceDescription:
        description.trim(),

      quantity: 1,

      rate: total,

      amount: total,

      received,

      balance,

      status,

      paymentMode,

      paymentDateTime,

      transactionId:
        transactionId.trim(),

      notes:
        notes.trim(),

      createdBy:
        user.username,

      createdAt:
        now.toISOString(),
    };

    onSave(invoice);

    resetForm();
  }

  return (
    <Modal
      title="Generate New Invoice"
      onClose={onClose}
    >

      <form
        onSubmit={submit}
      >

        <div className="invoice-generator-grid">

          <Field
            label="Tenant Name"
            value={tenant}
            onChange={
              setTenant
            }
            placeholder="Enter tenant name"
            required
          />

          <Field
            label="Room Number"
            value={room}
            onChange={
              setRoom
            }
            placeholder="Enter room number"
            required
          />

          <label className="form-field">
            <span>
              Transaction Mode
            </span>

            <select
              value={
                paymentMode
              }
              onChange={e =>
                setPaymentMode(
                  e.target
                    .value as
                  PaymentMode
                )
              }
            >
              <option value="UPI">
                UPI
              </option>

              <option value="Cash">
                Cash
              </option>

              <option value="Other">
                Other
              </option>
            </select>
          </label>

          <label className="form-field">
            <span>
              Payment Status
            </span>

            <select
              value={status}
              onChange={e =>
                setStatus(
                  e.target
                    .value as
                  InvoiceStatus
                )
              }
            >
              <option value="Paid">
                Paid
              </option>

              <option value="Partially Paid">
                Partially Paid
              </option>
            </select>
          </label>

          {status === "Partially Paid" ? (
            <>
              <Field
                label="Total Amount"
                value={amount}
                onChange={setAmount}
                type="number"
                required
                placeholder="Enter total amount"
              />

              <Field
                label="Paid Amount"
                value={paidAmount}
                onChange={setPaidAmount}
                type="number"
                required
                placeholder="Enter paid amount"
              />

              <div className="form-field">
                <span>Calculated Balance</span>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={formatMoney(
                    Math.max(
                      (Number(amount) || 0) - (Number(paidAmount) || 0),
                      0
                    )
                  )}
                  style={{
                    backgroundColor: "#f8fafc",
                    fontWeight: 700,
                    color: "#dc2626",
                    cursor: "not-allowed",
                  }}
                />
              </div>
            </>
          ) : (
            <Field
              label="Amount"
              value={amount}
              onChange={setAmount}
              type="number"
              required
              placeholder="Enter amount"
            />
          )}

          <Field
            label="Billing Month & Year"
            value={
              billingMonth
            }
            onChange={
              setBillingMonth
            }
            type="month"
            required
          />

          <Field
            label="Payment Date & Time"
            value={
              paymentDateTime
            }
            onChange={
              setPaymentDateTime
            }
            type="datetime-local"
            required
          />

          <Field
            label="Description"
            value={
              description
            }
            onChange={
              setDescription
            }
            required
            placeholder="Accommodation Rent"
          />

          <Field
            label="Transaction ID"
            value={
              transactionId
            }
            onChange={
              setTransactionId
            }
            required
            placeholder="Enter transaction ID"
          />

          <div
            className="form-field"
            style={{
              gridColumn:
                "1 / -1",
            }}
          >
            <span>
              Note (Optional)
            </span>

            <textarea
              value={notes}
              onChange={e =>
                setNotes(
                  e.target.value
                )
              }
              placeholder="Optional note"
              rows={3}
            />
          </div>

        </div>

        <div className="invoice-summary-box">

          <div>
            <span>
              Total Amount
            </span>

            <strong>
              {formatMoney(
                Number(
                  amount
                ) || 0
              )}
            </strong>
          </div>

          {status === "Partially Paid" && (
            <>
              <div>
                <span>
                  Paid Amount
                </span>

                <strong style={{ color: "#16a34a" }}>
                  {formatMoney(
                    Number(
                      paidAmount
                    ) || 0
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Balance Due
                </span>

                <strong style={{ color: "#dc2626" }}>
                  {formatMoney(
                    Math.max(
                      (Number(amount) || 0) -
                      (Number(paidAmount) || 0),
                      0
                    )
                  )}
                </strong>
              </div>
            </>
          )}

          <div>
            <span>
              Payment Status
            </span>

            <strong>
              {status}
            </strong>
          </div>

        </div>

        <ModalActions
          onClose={onClose}
          label="Generate Invoice"
        />

      </form>

    </Modal>
  );
}

/* =========================================================
   EXECUTIVES
========================================================= */

function ExecutivesPage({
  executives,
  onAdd,
  onToggle,
  onDelete,
  onSetPassword,
  invoices,
}: {
  executives: Executive[];
  onAdd: () => void;
  onToggle: (
    id: number,
    active: boolean
  ) => void;
  onDelete: (
    id: number
  ) => void;
  onSetPassword: (
    executive: Executive
  ) => void;
  invoices: Invoice[];
}) {
  return (
    <div className="page">

      <div className="page-heading">

        <div>
          <h2>
            Executives
          </h2>

          <p>
            Manage executive
            accounts.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={onAdd}
        >
          <UserPlus size={16} />
          Add Executive
        </button>

      </div>

      <div className="panel invoices-panel">

        {executives.length ===
          0 ? (
          <EmptyTable
            message="No executives have been added yet."
          />
        ) : (
          <div className="table-container">

            <table>

              <thead>
                <tr>
                  <th>
                    Executive
                  </th>

                  <th>
                    Mobile
                  </th>

                  <th>
                    Username
                  </th>

                  <th>
                    Invoices
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Created
                  </th>

                  <th>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>

                {executives.map(
                  executive => {
                    const invoiceCount =
                      invoices.filter(
                        invoice =>
                          invoice.createdBy ===
                          executive.username
                      ).length;

                    return (
                      <tr
                        key={
                          executive.id
                        }
                      >

                        <td>
                          <div className="tenant-cell">

                            <div className="tenant-avatar">
                              {executive.name
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <strong>
                              {
                                executive.name
                              }
                            </strong>

                          </div>
                        </td>

                        <td>
                          {
                            executive.mobile
                          }
                        </td>

                        <td>
                          {
                            executive.username
                          }
                        </td>

                        <td>
                          {
                            invoiceCount
                          }
                        </td>

                        <td>

                          <button
                            type="button"
                            className={`status-badge ${executive.active
                              ? "paid"
                              : "pending"
                              }`}
                            onClick={() =>
                              onToggle(
                                executive.id,
                                !executive.active
                              )
                            }
                          >
                            <i />

                            {executive.active
                              ? "Active"
                              : "Inactive"}
                          </button>

                        </td>

                        <td>
                          {new Date(
                            executive.createdAt
                          ).toLocaleDateString(
                            "en-IN"
                          )}
                        </td>

                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <button
                              type="button"
                              className="filter-button"
                              style={{
                                padding: "4px 8px",
                                fontSize: "11px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                whiteSpace: "nowrap",
                              }}
                              title="Set Password"
                              onClick={() =>
                                onSetPassword(
                                  executive
                                )
                              }
                            >
                              <Key size={13} />
                              Password
                            </button>
                            <button
                              type="button"
                              className="more-button"
                              title="Delete executive"
                              onClick={() =>
                                onDelete(
                                  executive.id
                                )
                              }
                            >
                              <MoreVertical
                                size={16}
                              />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}

/* =========================================================
   EXECUTIVE MODAL
========================================================= */

function ExecutiveModal({
  executives,
  onClose,
  onSave,
}: {
  executives: Executive[];
  onClose: () => void;
  onSave: (
    executive: Executive
  ) => void;
}) {
  const [
    name,
    setName,
  ] = useState("");

  const [
    mobile,
    setMobile,
  ] = useState("");

  const [
    username,
    setUsername,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  function submit(
    e: FormEvent
  ) {
    e.preventDefault();

    if (!name.trim()) {
      alert(
        "Enter executive name."
      );
      return;
    }

    if (
      !/^\d{10}$/.test(
        mobile.trim()
      )
    ) {
      alert(
        "Enter a valid 10-digit mobile number."
      );
      return;
    }

    if (!username.trim()) {
      alert(
        "Enter username."
      );
      return;
    }

    if (
      executives.some(
        item =>
          item.username
            .toLowerCase() ===
          username
            .trim()
            .toLowerCase()
      )
    ) {
      alert(
        "Username already exists."
      );
      return;
    }

    if (
      password.length <
      6
    ) {
      alert(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      alert(
        "Passwords do not match."
      );
      return;
    }

    onSave({
      id: Date.now(),
      name:
        name.trim(),
      mobile:
        mobile.trim(),
      username:
        username.trim(),
      password,
      active: true,
      createdAt:
        new Date().toISOString(),
    });
  }

  return (
    <Modal
      title="Add Executive"
      onClose={onClose}
    >

      <form
        onSubmit={submit}
      >

        <div className="form-grid">

          <Field
            label="Full Name"
            value={name}
            onChange={setName}
            required
            placeholder="Executive full name"
          />

          <Field
            label="Mobile"
            value={mobile}
            onChange={setMobile}
            required
            placeholder="10-digit mobile"
          />

          <Field
            label="Username"
            value={
              username
            }
            onChange={
              setUsername
            }
            required
            placeholder="Username"
          />

          <Field
            label="Password"
            value={password}
            onChange={
              setPassword
            }
            type="password"
            required
            placeholder="Password"
          />

          <Field
            label="Confirm Password"
            value={
              confirmPassword
            }
            onChange={
              setConfirmPassword
            }
            type="password"
            required
            placeholder="Confirm password"
          />

        </div>

        <ModalActions
          onClose={onClose}
          label="Add Executive"
        />

      </form>

    </Modal>
  );
}

/* =========================================================
   SET EXECUTIVE PASSWORD MODAL (MANAGER ONLY)
========================================================= */

function SetExecutivePasswordModal({
  executive,
  onClose,
  onSave,
}: {
  executive: Executive;
  onClose: () => void;
  onSave: (id: number, newPassword: string) => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    onSave(executive.id, newPassword);
    window.alert(`Password updated successfully for ${executive.name}.`);
    onClose();
  }

  return (
    <Modal
      title={`Set Password - ${executive.name}`}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div
          style={{
            marginBottom: "16px",
            padding: "12px",
            background: "#f8fafc",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ fontSize: "11px", color: "#64748b" }}>
            Setting password for executive:
          </div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: "700",
              color: "#0f172a",
              marginTop: "2px",
            }}
          >
            {executive.name} (@{executive.username})
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
            Mobile: {executive.mobile}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <label className="form-field">
            <span>New Password</span>
            <PasswordInput
              value={newPassword}
              show={showPassword}
              onChange={setNewPassword}
              onToggle={() => setShowPassword(v => !v)}
              placeholder="Enter new password (min 6 characters)"
            />
          </label>

          <label className="form-field">
            <span>Confirm New Password</span>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              required
            />
          </label>
        </div>

        {error && (
          <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "10px" }}>
            {error}
          </div>
        )}

        <ModalActions
          onClose={onClose}
          label="Save Password"
        />
      </form>
    </Modal>
  );
}

/* =========================================================
   REPORTS
========================================================= */

function ReportsPage({
  invoices,
  onPreview,
}: {
  invoices: Invoice[];
  onPreview: (invoice: Invoice) => void;
}) {
  const totalRevenue =
    invoices
      .filter(
        invoice =>
          (invoice.status as string) !==
          "Cancelled"
      )
      .reduce(
        (sum, invoice) =>
          sum + (Number(invoice.amount) || 0),
        0
      );

  const paidRevenue =
    invoices
      .filter(
        invoice =>
          (invoice.status as string) !==
          "Cancelled"
      )
      .reduce(
        (sum, invoice) => {
          const isPaid = invoice.status === "Paid";
          const totalVal = Number(invoice.amount) || 0;
          const rec = isPaid ? totalVal : (Number(invoice.received) || 0);
          return sum + rec;
        },
        0
      );

  const pendingRevenue =
    invoices
      .filter(
        invoice =>
          (invoice.status as string) !==
          "Cancelled"
      )
      .reduce(
        (sum, invoice) => {
          if (invoice.status === "Paid") return sum;
          const totalVal = Number(invoice.amount) || 0;
          const rec = Number(invoice.received) || 0;
          const bal = invoice.balance !== undefined ? Number(invoice.balance) : Math.max(totalVal - rec, 0);
          return sum + bal;
        },
        0
      );

  function exportCSV() {
    exportInvoicesCSV(invoices);
  }

  return (
    <div className="page">

      <div className="page-heading">

        <div>
          <h2>
            Reports
          </h2>

          <p>
            Administrator-only
            financial reports.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={
            exportCSV
          }
        >
          <Download
            size={14}
          />
          Export CSV
        </button>

      </div>

      <div className="stat-grid">

        <StatCard
          title="Total Invoices"
          value={String(
            invoices.length
          )}
          icon={
            <FileText
              size={19}
            />
          }
          tone="purple"
        />

        <StatCard
          title="Paid Revenue"
          value={formatMoney(
            paidRevenue
          )}
          icon={
            <CircleDollarSign
              size={19}
            />
          }
          tone="green"
        />

        <StatCard
          title="Pending"
          value={formatMoney(
            pendingRevenue
          )}
          icon={
            <FileText
              size={19}
            />
          }
          tone="orange"
        />

        <StatCard
          title="Total Revenue"
          value={formatMoney(
            totalRevenue
          )}
          icon={
            <CircleDollarSign
              size={19}
            />
          }
          tone="green"
        />

      </div>

      <div className="panel invoices-panel">

        <div className="panel-heading">

          <div>
            <h3>
              All Invoice Report
            </h3>

            <p>
              All invoices entered
              by all executives.
            </p>
          </div>

        </div>

        {invoices.length ===
          0 ? (
          <EmptyTable
            message="No invoices are available."
          />
        ) : (
          <InvoiceTable
            data={invoices}
            onPreview={onPreview}
            showDelete={false}
          />
        )}

      </div>

    </div>
  );
}

/* =========================================================
   PROFILE
========================================================= */

function ProfilePage({
  user,
}: {
  user: LoggedUser;
}) {
  return (
    <div className="page">

      <div className="page-heading">

        <div>
          <h2>
            Profile
          </h2>

          <p>
            Your account
            information.
          </p>
        </div>

      </div>

      <div
        className="panel"
        style={{
          padding:
            "25px",
        }}
      >

        <div className="form-grid">

          <Field
            label="Name"
            value={
              user.name
            }
            onChange={() => { }}
          />

          <Field
            label="Username"
            value={
              user.username
            }
            onChange={() => { }}
          />

          <Field
            label="Role"
            value={
              user.role ===
                "MANAGER"
                ? "Administrator / Manager"
                : "Executive"
            }
            onChange={() => { }}
          />

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   ACTIVITY LOGS PAGE
========================================================= */

function ActivityLogsPage({
  logs,
  onClearLogs,
}: {
  logs: ActivityLog[];
  onClearLogs: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<
    "ALL" | "AUTH" | "INVOICES" | "STAFF" | "SETTINGS"
  >("ALL");

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Category filter
      if (activeCategory === "AUTH") {
        if (!["LOGIN", "LOGOUT", "PASSWORD_RESET", "ACCOUNT_CREATED"].includes(log.action)) {
          return false;
        }
      } else if (activeCategory === "INVOICES") {
        if (!["INVOICE_CREATED", "INVOICE_DELETED"].includes(log.action)) {
          return false;
        }
      } else if (activeCategory === "STAFF") {
        if (!["EXECUTIVE_ADDED", "EXECUTIVE_STATUS", "EXECUTIVE_DELETED", "EXECUTIVE_PASSWORD_UPDATED"].includes(log.action)) {
          return false;
        }
      } else if (activeCategory === "SETTINGS") {
        if (!["SETTINGS_UPDATED", "SYSTEM_INITIALIZED", "BACKUP_EXPORTED"].includes(log.action)) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchAction = log.action.toLowerCase().includes(q);
        const matchDetails = log.details.toLowerCase().includes(q);
        const matchUser = log.user.toLowerCase().includes(q);
        const matchRole = log.role.toLowerCase().includes(q);
        return matchAction || matchDetails || matchUser || matchRole;
      }

      return true;
    });
  }, [logs, activeCategory, searchQuery]);

  function exportLogsCSV() {
    if (logs.length === 0) {
      alert("No activity logs to export.");
      return;
    }
    const headers = ["Log ID", "Date & Time", "User", "Role", "Action", "Details"];
    const rows = logs.map(l => [
      l.id,
      formatLogTime(l.timestamp),
      l.user,
      l.role,
      l.action,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `jeevith_activity_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function formatLogTime(isoStr: string) {
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    } catch {
      return isoStr;
    }
  }

  function getActionBadge(action: string) {
    switch (action) {
      case "INVOICE_CREATED":
        return <span className="log-action-badge log-action-invoice"><FileText size={11} /> Invoice Created</span>;
      case "INVOICE_DELETED":
        return <span className="log-action-badge log-action-delete"><Trash2 size={11} /> Invoice Deleted</span>;
      case "LOGIN":
        return <span className="log-action-badge log-action-login"><UserCheck size={11} /> Signed In</span>;
      case "LOGOUT":
        return <span className="log-action-badge log-action-login"><LogOut size={11} /> Signed Out</span>;
      case "ACCOUNT_CREATED":
        return <span className="log-action-badge log-action-security"><UserPlus size={11} /> Account Created</span>;
      case "PASSWORD_RESET":
        return <span className="log-action-badge log-action-security"><Key size={11} /> Password Reset</span>;
      case "EXECUTIVE_ADDED":
        return <span className="log-action-badge log-action-exec"><UserPlus size={11} /> Staff Added</span>;
      case "EXECUTIVE_STATUS":
        return <span className="log-action-badge log-action-exec"><Shield size={11} /> Staff Status</span>;
      case "EXECUTIVE_DELETED":
        return <span className="log-action-badge log-action-delete"><Trash2 size={11} /> Staff Deleted</span>;
      case "EXECUTIVE_PASSWORD_UPDATED":
        return <span className="log-action-badge log-action-security"><Key size={11} /> Staff Password</span>;
      case "SETTINGS_UPDATED":
        return <span className="log-action-badge log-action-settings"><Settings size={11} /> Settings Saved</span>;
      case "BACKUP_EXPORTED":
        return <span className="log-action-badge log-action-settings"><Download size={11} /> Backup Export</span>;
      case "SYSTEM_INITIALIZED":
        return <span className="log-action-badge log-action-settings"><RotateCcw size={11} /> Initialized</span>;
      default:
        return <span className="log-action-badge log-action-login">{action}</span>;
    }
  }

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <h2>Activity Logs</h2>
          <p>Real-time audit trail and system security history</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            type="button"
            className="filter-button"
            onClick={exportLogsCSV}
            title="Download CSV report"
          >
            <Download size={15} />
            Export CSV
          </button>
          <button
            type="button"
            className="filter-button"
            style={{ color: "#ef4444", borderColor: "#fecaca" }}
            onClick={onClearLogs}
            title="Clear all activity history"
          >
            <Trash2 size={15} />
            Clear Logs
          </button>
        </div>
      </div>

      <div className="activity-toolbar">
        <div className="activity-search-box">
          <Search size={15} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search logs by action, details, user..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <X size={14} color="#94a3b8" />
            </button>
          )}
        </div>

        <div className="activity-tabs">
          <button
            type="button"
            className={`activity-tab-btn ${activeCategory === "ALL" ? "active" : ""}`}
            onClick={() => setActiveCategory("ALL")}
          >
            All Logs ({logs.length})
          </button>
          <button
            type="button"
            className={`activity-tab-btn ${activeCategory === "AUTH" ? "active" : ""}`}
            onClick={() => setActiveCategory("AUTH")}
          >
            Auth &amp; Logins
          </button>
          <button
            type="button"
            className={`activity-tab-btn ${activeCategory === "INVOICES" ? "active" : ""}`}
            onClick={() => setActiveCategory("INVOICES")}
          >
            Invoices
          </button>
          <button
            type="button"
            className={`activity-tab-btn ${activeCategory === "STAFF" ? "active" : ""}`}
            onClick={() => setActiveCategory("STAFF")}
          >
            Staff &amp; Executives
          </button>
          <button
            type="button"
            className={`activity-tab-btn ${activeCategory === "SETTINGS" ? "active" : ""}`}
            onClick={() => setActiveCategory("SETTINGS")}
          >
            Settings &amp; System
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "190px" }}>Timestamp</th>
                <th style={{ width: "160px" }}>User &amp; Role</th>
                <th style={{ width: "170px" }}>Event</th>
                <th>Activity Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ color: "#64748b", fontSize: "13px" }}>
                      No activity logs match your filter criteria.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontSize: "11px", color: "#64748b", whiteSpace: "nowrap" }}>
                      {formatLogTime(log.timestamp)}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontWeight: 600, fontSize: "12px", color: "#0f172a" }}>
                          {log.user}
                        </span>
                        <span
                          className={`role-pill ${
                            log.role === "MANAGER"
                              ? "role-pill-manager"
                              : "role-pill-executive"
                          }`}
                        >
                          {log.role}
                        </span>
                      </div>
                    </td>
                    <td>{getActionBadge(log.action)}</td>
                    <td style={{ fontSize: "12px", color: "#334155", lineHeight: "1.4" }}>
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SETTINGS PAGE
========================================================= */

function SettingsPage({
  settings,
  onSaveSettings,
  onResetDemoData,
  onExportBackup,
  onUpdateManagerPassword,
}: {
  settings: AppSettings;
  onSaveSettings: (updated: AppSettings) => void;
  onResetDemoData: () => void;
  onExportBackup: () => void;
  onUpdateManagerPassword: (newPass: string) => void;
}) {
  const [businessName, setBusinessName] = useState(settings.businessName);
  const [address, setAddress] = useState(settings.address);
  const [mobile, setMobile] = useState(settings.mobile);
  const [email, setEmail] = useState(settings.email);
  const [signatoryTitle, setSignatoryTitle] = useState(settings.signatoryTitle || "Authorized Signatory");
  const [signatoryName, setSignatoryName] = useState(settings.signatoryName || "Jeewith Gardens");

  const [terms, setTerms] = useState<string[]>(() => [...settings.terms]);
  const [newTerm, setNewTerm] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  function handleSaveBusiness(e: FormEvent) {
    e.preventDefault();
    if (!businessName.trim()) {
      alert("Please enter business name.");
      return;
    }
    onSaveSettings({
      ...settings,
      businessName: businessName.trim(),
      address: address.trim(),
      mobile: mobile.trim(),
      email: email.trim(),
      signatoryTitle: signatoryTitle.trim(),
      signatoryName: signatoryName.trim(),
      terms,
    });
  }

  function handleTermChange(index: number, val: string) {
    setTerms(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  }

  function handleDeleteTerm(index: number) {
    setTerms(prev => prev.filter((_, i) => i !== index));
  }

  function handleAddTerm(e: FormEvent) {
    e.preventDefault();
    if (!newTerm.trim()) return;
    setTerms(prev => [...prev, newTerm.trim()]);
    setNewTerm("");
  }

  function handleSaveTerms() {
    const validTerms = terms.map(t => t.trim()).filter(Boolean);
    if (validTerms.length === 0) {
      alert("At least one term or condition is required.");
      return;
    }
    onSaveSettings({
      ...settings,
      businessName,
      address,
      mobile,
      email,
      signatoryTitle,
      signatoryName,
      terms: validTerms,
    });
    setTerms(validTerms);
  }

  function handleResetDefaultTerms() {
    if (window.confirm("Reset terms to the original Jeevith Gardens default invoice terms?")) {
      setTerms([...DEFAULT_SETTINGS.terms]);
    }
  }

  function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordError("");
    if (!newPassword) {
      setPasswordError("Please enter a new password.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    onUpdateManagerPassword(newPassword);
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <h2>Settings</h2>
          <p>Manage business details, invoice defaults, security, and data backups</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* CARD 1: BUSINESS PROFILE & INVOICE HEADER */}
        <div className="settings-card">
          <div className="settings-card-title">
            <Building size={18} color="#2563eb" />
            <span>Property &amp; Business Profile</span>
          </div>

          <form onSubmit={handleSaveBusiness} className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
            <Field
              label="Business / Property Name"
              value={businessName}
              onChange={setBusinessName}
              required
              placeholder="e.g. Jeewith Gardens Hotel, Co-living & PG"
            />

            <Field
              label="Property Address"
              value={address}
              onChange={setAddress}
              required
              placeholder="Full address line"
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <Field
                label="Mobile / Phone Number"
                value={mobile}
                onChange={setMobile}
                required
                placeholder="+91 7411517788"
              />

              <Field
                label="Email Address"
                value={email}
                onChange={setEmail}
                required
                placeholder="jeewithhotel@gmail.com"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <Field
                label="Signatory Title"
                value={signatoryTitle}
                onChange={setSignatoryTitle}
                required
                placeholder="Authorized Signatory"
              />

              <Field
                label="Signatory Name / Establishment"
                value={signatoryName}
                onChange={setSignatoryName}
                required
                placeholder="Jeewith Gardens"
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
              <button type="submit" className="primary-button" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <Check size={16} />
                Save Business Profile
              </button>
            </div>
          </form>
        </div>

        {/* CARD 2: INVOICE TERMS & CONDITIONS */}
        <div className="settings-card">
          <div className="settings-card-title">
            <FileText size={18} color="#059669" />
            <span>Invoice Terms &amp; Conditions</span>
          </div>

          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            These terms appear at the bottom of printed and previewed A5 landscape invoices.
          </p>

          <div className="terms-list">
            {terms.map((term, index) => (
              <div key={index} className="term-item">
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", width: "18px" }}>
                  {index + 1}.
                </span>
                <input
                  type="text"
                  value={term}
                  onChange={e => handleTermChange(index, e.target.value)}
                  placeholder={`Term #${index + 1}`}
                />
                <button
                  type="button"
                  className="term-delete-btn"
                  onClick={() => handleDeleteTerm(index)}
                  title="Remove condition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddTerm} style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <input
              type="text"
              value={newTerm}
              onChange={e => setNewTerm(e.target.value)}
              placeholder="Add new term or condition..."
              style={{
                flex: 1,
                padding: "8px 12px",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                fontSize: "12px",
                outline: "none",
              }}
            />
            <button
              type="submit"
              className="filter-button"
              style={{ whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: "5px" }}
            >
              <Plus size={15} />
              Add
            </button>
          </form>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
            <button
              type="button"
              className="filter-button"
              onClick={handleResetDefaultTerms}
              style={{ fontSize: "11px" }}
            >
              <RotateCcw size={13} />
              Reset Defaults
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={handleSaveTerms}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Check size={16} />
              Save Terms
            </button>
          </div>
        </div>

        {/* CARD 3: MANAGER PASSWORD & SECURITY */}
        <div className="settings-card">
          <div className="settings-card-title">
            <Lock size={18} color="#d97706" />
            <span>Manager Password &amp; Security</span>
          </div>

          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            Update the manager administrative login password directly. You can also reset via mobile OTP on the sign-in page.
          </p>

          <form onSubmit={handlePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {passwordError && (
              <div style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", padding: "8px 12px", borderRadius: "6px", fontSize: "12px" }}>
                {passwordError}
              </div>
            )}

            <label className="form-field">
              <span>New Password (min 6 characters)</span>
              <div style={{ position: "relative" }}>
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new manager password"
                  style={{ width: "100%", paddingRight: "36px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: "#94a3b8",
                  }}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <label className="form-field">
              <span>Confirm New Password</span>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new manager password"
                  style={{ width: "100%", paddingRight: "36px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: "#94a3b8",
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
              <button
                type="submit"
                className="primary-button"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Key size={15} />
                Update Password
              </button>
            </div>
          </form>
        </div>

        {/* CARD 4: DATA BACKUP & SYSTEM RECOVERY */}
        <div className="settings-card">
          <div className="settings-card-title">
            <ShieldCheck size={18} color="#7c3aed" />
            <span>Data Backup &amp; Maintenance</span>
          </div>

          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            Safely download all system records including generated invoices, executive staff accounts, settings, and audit logs.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px" }}>
              <div style={{ fontWeight: 600, fontSize: "12px", color: "#0f172a", marginBottom: "4px" }}>
                Full System Backup
              </div>
              <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 10px" }}>
                Export an instant JSON file containing all invoices, staff details, settings, and audit trail logs.
              </p>
              <button
                type="button"
                className="filter-button"
                onClick={onExportBackup}
                style={{ width: "100%", display: "inline-flex", justifyContent: "center", alignItems: "center", gap: "6px" }}
              >
                <Download size={15} />
                Download System Backup (.json)
              </button>
            </div>

            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px" }}>
              <div style={{ fontWeight: 600, fontSize: "12px", color: "#dc2626", marginBottom: "4px" }}>
                Reset Local Storage
              </div>
              <p style={{ fontSize: "11px", color: "#991b1b", margin: "0 0 10px" }}>
                Clears all local storage records, cache, and resets application state to fresh defaults.
              </p>
              <button
                type="button"
                className="filter-button"
                onClick={onResetDemoData}
                style={{ width: "100%", color: "#dc2626", borderColor: "#fca5a5", display: "inline-flex", justifyContent: "center", alignItems: "center", gap: "6px" }}
              >
                <RotateCcw size={15} />
                Reset Application Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


/* =========================================================
   A5 INVOICE PREVIEW
========================================================= */

function formatInvoiceDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  let hours = d.getHours();
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12 || 12;
  const hoursStr = String(hours).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  const secs = String(d.getSeconds()).padStart(2, "0");
  return `${day}/${month}/${year} ${hoursStr}:${mins}:${secs} ${ampm}`;
}

function InvoicePreviewModal({
  invoice,
  settings,
  onClose,
}: {
  invoice: Invoice;
  settings: AppSettings;
  onClose: () => void;
}) {
  const dateTimeStr = formatInvoiceDateTime(invoice.createdAt);
  const isPartial = invoice.status === "Partially Paid";
  const totalAmountStr = formatMoney(invoice.amount);
  const paidAmountStr = formatMoney(isPartial ? invoice.received : invoice.amount);
  const balanceStr = formatMoney(
    isPartial
      ? (invoice.balance ?? Math.max(invoice.amount - invoice.received, 0))
      : 0
  );

  const esc = (value: unknown) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  function printInvoice() {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth <= 768;
    if (isMobile) {
      window.print();
      return;
    }

    const printWindow = window.open("", "_blank", "width=1100,height=800");

    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${esc(invoice.invoiceNumber)} - Jeevith Gardens</title>
  <style>
    @page {
      size: A5 landscape;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 210mm;
      height: 148mm;
      background: #ffffff;
      font-family: Arial, Helvetica, sans-serif;
      color: #1e293b;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .invoice-wrapper {
      width: 210mm;
      height: 148mm;
      max-height: 148mm;
      padding: 8mm 10mm 7mm;
      background: #ffffff;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand-col {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .logo-img {
      width: 46px;
      height: 46px;
      object-fit: contain;
      flex-shrink: 0;
    }
    .brand-col h1 {
      margin: 0 0 3px;
      font-size: 15.5px;
      line-height: 18px;
      font-weight: 800;
      color: #0b132b;
      letter-spacing: -0.1px;
    }
    .brand-col p {
      margin: 1.5px 0;
      font-size: 8.5px;
      line-height: 12px;
      color: #475569;
    }
    .invoice-pill {
      background: #edf5fe;
      color: #0b1a3d;
      font-size: 13px;
      font-weight: 800;
      padding: 8px 18px;
      border-radius: 6px;
      white-space: nowrap;
      letter-spacing: 0.3px;
    }
    .line-divider {
      height: 1px;
      background: #e2e8f0;
      margin: 3.2mm 0;
    }
    .bill-meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 3.2mm;
    }
    .bill-to {
      flex: 1;
    }
    .section-badge {
      background: #edf5fe;
      color: #0b1a3d;
      font-size: 9px;
      font-weight: 700;
      padding: 3px 9px;
      border-radius: 4px;
      display: inline-block;
      margin-bottom: 3px;
    }
    .bill-to .bill-name {
      font-size: 15px;
      font-weight: 800;
      color: #0b132b;
      margin-bottom: 2px;
    }
    .bill-to .bill-room {
      font-size: 9px;
      color: #374151;
    }
    .bill-to .bill-room strong {
      font-weight: 700;
      color: #0b132b;
    }
    .vertical-divider {
      width: 1px;
      height: 42px;
      background: #e2e8f0;
      margin: 0 20px;
      flex-shrink: 0;
    }
    .meta-details {
      font-size: 9px;
      line-height: 16px;
      color: #374151;
      text-align: right;
    }
    .meta-details strong {
      font-weight: 700;
      color: #0b132b;
    }
    .table-frame {
      border: 1px solid #cce2fd;
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 3.5mm;
    }
    .inv-table-modern {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    .inv-table-modern th {
      background: #dff0fe;
      color: #0b1a3d;
      font-weight: 700;
      font-size: 9px;
      padding: 8px 12px;
      border-right: 1px solid #cce2fd;
      border-bottom: 1px solid #cce2fd;
      text-transform: none;
    }
    .inv-table-modern th:last-child {
      border-right: none;
    }
    .inv-table-modern td {
      background: #ffffff;
      color: #1e293b;
      font-size: 9px;
      padding: 10px 12px;
      border-right: 1px solid #cce2fd;
      vertical-align: middle;
    }
    .inv-table-modern td:last-child {
      border-right: none;
    }
    .payment-summary-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2.5mm;
    }
    .payment-info-block {
      font-size: 9px;
      line-height: 16px;
      color: #374151;
    }
    .payment-info-block strong {
      color: #0b132b;
      font-weight: 700;
    }
    .note-box {
      margin-top: 6px;
      padding: 5px 12px;
      border: 1px solid #c7dcf7;
      background: #f0f7fe;
      border-radius: 5px;
      display: inline-flex;
      align-items: baseline;
      gap: 6px;
      font-size: 9px;
      max-width: 400px;
      word-break: break-word;
    }
    .note-box strong {
      color: #0b1a3d;
      font-weight: 700;
    }
    .note-box span {
      color: #1e293b;
      font-weight: 600;
    }
    .total-card {
      background: #dff0fe;
      border-radius: 6px;
      padding: 10px 24px;
      text-align: center;
      min-width: 160px;
    }
    .total-title {
      font-size: 8.5px;
      font-weight: 800;
      color: #0b1a3d;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
    }
    .total-val {
      font-size: 24px;
      font-weight: 800;
      color: #091125;
      line-height: 1.1;
    }
    .terms-sign-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 3.5mm;
      margin-bottom: 2mm;
    }
    .terms-col {
      flex: 1;
    }
    .terms-col ol {
      margin: 4px 0 0;
      padding-left: 15px;
    }
    .terms-col li {
      font-size: 8px;
      line-height: 12.5px;
      color: #374151;
      margin-bottom: 1.5px;
    }
    .sign-col {
      text-align: right;
    }
    .sign-lbl {
      font-size: 9.5px;
      font-weight: 800;
      color: #0b1a3d;
      margin-bottom: 3px;
      white-space: nowrap;
    }
    .sign-name {
      font-size: 8.5px;
      color: #475569;
    }
    .footer-text {
      text-align: center;
      font-size: 7.5px;
      color: #94a3b8;
      margin-top: 3mm;
    }
  </style>
</head>
<body>
  <div class="invoice-wrapper">
    <div class="header-row">
      <div class="brand-col">
        <img src="${jgLogo}" class="logo-img" alt="JG Logo" />
        <div>
          <h1>${esc(settings.businessName)}</h1>
          <p>${esc(settings.address)}</p>
          <p>Mobile: ${esc(settings.mobile)} | Email: ${esc(settings.email)}</p>
        </div>
      </div>
      <div class="invoice-pill">
        <strong>INVOICE :</strong> ${esc(invoice.invoiceNumber)}
      </div>
    </div>

    <div class="line-divider"></div>

    <div class="bill-meta-row">
      <div class="bill-to">
        <span class="section-badge">Bill To:</span>
        <div class="bill-name">${esc(invoice.tenant)}</div>
        <div class="bill-room">Room No: <strong>${esc(invoice.room)}</strong></div>
      </div>
      <div class="vertical-divider"></div>
      <div class="meta-details">
        <div><strong>Invoice Date:</strong> ${esc(dateTimeStr)}</div>
        <div><strong>Billing Month:</strong> ${esc(invoice.billingMonth)}</div>
      </div>
    </div>

    <div class="table-frame">
      <table class="inv-table-modern">
        <colgroup>
          <col style="width: 10%" />
          <col style="width: 42%" />
          <col style="width: 14%" />
          <col style="width: 18%" />
          <col style="width: 16%" />
        </colgroup>
        <thead>
          <tr>
            <th style="text-align: center;">S.No.</th>
            <th>Service / Description</th>
            <th style="text-align: center;">Room</th>
            <th style="text-align: center;">Month</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="text-align: center;">1</td>
            <td>${esc(invoice.serviceDescription)}</td>
            <td style="text-align: center;">${esc(invoice.room)}</td>
            <td style="text-align: center;">${esc(invoice.billingMonth)}</td>
            <td style="text-align: right; font-weight: 700;">${esc(paidAmountStr)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="payment-summary-row">
      <div class="payment-info-block">
        <div>Transaction Mode: <strong>${esc(invoice.paymentMode)}</strong></div>
        <div>Payment Status: <strong>${esc(invoice.status)}</strong></div>
        ${isPartial ? `
        <div>Paid Amount: <strong>${esc(paidAmountStr)}</strong></div>
        <div>Balance Due: <strong>${esc(balanceStr)}</strong></div>
        ` : ""}
        ${invoice.notes?.trim() ? `<div class="note-box"><strong>Note:</strong> <span>${esc(invoice.notes.trim())}</span></div>` : ""}
      </div>
      <div class="total-card">
        <div class="total-title">TOTAL AMOUNT</div>
        <div class="total-val">${esc(totalAmountStr)}</div>
      </div>
    </div>

    <div class="line-divider" style="margin: 3.5mm 0 3mm;"></div>

    <div class="terms-sign-row">
      <div class="terms-col">
        <span class="section-badge">Terms &amp; Conditions</span>
        <ol>
          ${settings.terms.map(t => `<li>${esc(t)}</li>`).join("")}
        </ol>
      </div>
      <div class="vertical-divider" style="height: 52px;"></div>
      <div class="sign-col">
        <div class="sign-lbl">${esc(settings.signatoryTitle || "Authorized Signatory")}</div>
        <div class="sign-name">${esc(settings.signatoryName || "Jeewith Gardens")}</div>
      </div>
    </div>

    <div class="footer-text">This is a computer-generated invoice.</div>
  </div>
</body>
</html>`);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };

    printWindow.onafterprint = () => {
      printWindow.close();
    };
  }

  return (
    <div className="invoice-preview-overlay">
      <style>{`
        .invoice-preview-overlay .invoice-paper-a5 {
          width: 210mm !important;
          min-width: 210mm !important;
          max-width: 210mm !important;
          height: 148mm !important;
          min-height: 148mm !important;
          max-height: 148mm !important;
          padding: 8mm 10mm 7mm !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
          font-family: Arial, Helvetica, sans-serif !important;
          color: #1e293b !important;
          background: #ffffff !important;
          box-shadow: 0 10px 28px rgba(25, 35, 50, 0.15) !important;
          border: 1px solid #d1d5db !important;
          display: flex !important;
          flex-direction: column !important;
        }

        .invoice-preview-overlay .header-row {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
        }

        .invoice-preview-overlay .brand-col {
          display: flex !important;
          gap: 12px !important;
          align-items: center !important;
        }

        .invoice-preview-overlay .logo-img {
          width: 46px !important;
          height: 46px !important;
          object-fit: contain !important;
          flex-shrink: 0 !important;
        }

        .invoice-preview-overlay .brand-col h1 {
          margin: 0 0 3px !important;
          font-size: 15.5px !important;
          line-height: 18px !important;
          font-weight: 800 !important;
          color: #0b132b !important;
          letter-spacing: -0.1px !important;
        }

        .invoice-preview-overlay .brand-col p {
          margin: 1.5px 0 !important;
          font-size: 8.5px !important;
          line-height: 12px !important;
          color: #475569 !important;
        }

        .invoice-preview-overlay .invoice-pill {
          background: #edf5fe !important;
          color: #0b1a3d !important;
          font-size: 13px !important;
          font-weight: 800 !important;
          padding: 8px 18px !important;
          border-radius: 6px !important;
          white-space: nowrap !important;
          letter-spacing: 0.3px !important;
        }

        .invoice-preview-overlay .line-divider {
          height: 1px !important;
          background: #e2e8f0 !important;
          margin: 3.2mm 0 !important;
        }

        .invoice-preview-overlay .bill-meta-row {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          margin-bottom: 3.2mm !important;
        }

        .invoice-preview-overlay .bill-to {
          flex: 1 !important;
        }

        .invoice-preview-overlay .section-badge {
          background: #edf5fe !important;
          color: #0b1a3d !important;
          font-size: 9px !important;
          font-weight: 700 !important;
          padding: 3px 9px !important;
          border-radius: 4px !important;
          display: inline-block !important;
          margin-bottom: 3px !important;
        }

        .invoice-preview-overlay .bill-to .bill-name {
          font-size: 15px !important;
          font-weight: 800 !important;
          color: #0b132b !important;
          margin-bottom: 2px !important;
        }

        .invoice-preview-overlay .bill-to .bill-room {
          font-size: 9px !important;
          color: #374151 !important;
        }

        .invoice-preview-overlay .bill-to .bill-room strong {
          font-weight: 700 !important;
          color: #0b132b !important;
        }

        .invoice-preview-overlay .vertical-divider {
          width: 1px !important;
          height: 42px !important;
          background: #e2e8f0 !important;
          margin: 0 20px !important;
          flex-shrink: 0 !important;
        }

        .invoice-preview-overlay .meta-details {
          font-size: 9px !important;
          line-height: 16px !important;
          color: #374151 !important;
          text-align: right !important;
        }

        .invoice-preview-overlay .meta-details strong {
          font-weight: 700 !important;
          color: #0b132b !important;
        }

        .invoice-preview-overlay .table-frame {
          border: 1px solid #cce2fd !important;
          border-radius: 6px !important;
          overflow: hidden !important;
          margin-bottom: 3.5mm !important;
        }

        .invoice-preview-overlay .inv-table-modern {
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
          border-collapse: collapse !important;
          table-layout: fixed !important;
        }

        .invoice-preview-overlay .inv-table-modern th {
          background: #dff0fe !important;
          color: #0b1a3d !important;
          font-weight: 700 !important;
          font-size: 9px !important;
          padding: 8px 12px !important;
          border-right: 1px solid #cce2fd !important;
          border-bottom: 1px solid #cce2fd !important;
          text-transform: none !important;
          height: auto !important;
        }

        .invoice-preview-overlay .inv-table-modern th:last-child {
          border-right: none !important;
        }

        .invoice-preview-overlay .inv-table-modern td {
          background: #ffffff !important;
          color: #1e293b !important;
          font-size: 9px !important;
          padding: 10px 12px !important;
          border-right: 1px solid #cce2fd !important;
          vertical-align: middle !important;
          height: auto !important;
        }

        .invoice-preview-overlay .inv-table-modern td:last-child {
          border-right: none !important;
        }

        .invoice-preview-overlay .payment-summary-row {
          display: flex !important;
          justify-content: space-between !important;
          align-items: flex-start !important;
          margin-bottom: 2.5mm !important;
        }

        .invoice-preview-overlay .payment-info-block {
          font-size: 9px !important;
          line-height: 16px !important;
          color: #374151 !important;
        }

        .invoice-preview-overlay .payment-info-block strong {
          color: #0b132b !important;
          font-weight: 700 !important;
        }

        .invoice-preview-overlay .note-box {
          margin-top: 6px !important;
          padding: 5px 12px !important;
          border: 1px solid #c7dcf7 !important;
          background: #f0f7fe !important;
          border-radius: 5px !important;
          display: inline-flex !important;
          align-items: baseline !important;
          gap: 6px !important;
          font-size: 9px !important;
          max-width: 400px !important;
          word-break: break-word !important;
        }

        .invoice-preview-overlay .note-box strong {
          color: #0b1a3d !important;
          font-weight: 700 !important;
        }

        .invoice-preview-overlay .note-box span {
          color: #1e293b !important;
          font-weight: 600 !important;
        }

        .invoice-preview-overlay .total-card {
          background: #dff0fe !important;
          border-radius: 6px !important;
          padding: 10px 24px !important;
          text-align: center !important;
          min-width: 160px !important;
        }

        .invoice-preview-overlay .total-title {
          font-size: 8.5px !important;
          font-weight: 800 !important;
          color: #0b1a3d !important;
          letter-spacing: 0.5px !important;
          margin-bottom: 3px !important;
        }

        .invoice-preview-overlay .total-val {
          font-size: 24px !important;
          font-weight: 800 !important;
          color: #091125 !important;
          line-height: 1.1 !important;
        }

        .invoice-preview-overlay .terms-sign-row {
          display: flex !important;
          justify-content: space-between !important;
          align-items: flex-end !important;
          margin-top: 3.5mm !important;
          margin-bottom: 2mm !important;
        }

        .invoice-preview-overlay .terms-col {
          flex: 1 !important;
        }

        .invoice-preview-overlay .terms-col ol {
          margin: 4px 0 0 !important;
          padding-left: 15px !important;
        }

        .invoice-preview-overlay .terms-col li {
          font-size: 8px !important;
          line-height: 12.5px !important;
          color: #374151 !important;
          margin-bottom: 1.5px !important;
        }

        .invoice-preview-overlay .sign-col {
          text-align: right !important;
        }

        .invoice-preview-overlay .sign-lbl {
          font-size: 9.5px !important;
          font-weight: 800 !important;
          color: #0b1a3d !important;
          margin-bottom: 3px !important;
          white-space: nowrap !important;
        }

        .invoice-preview-overlay .sign-name {
          font-size: 8.5px !important;
          color: #475569 !important;
        }

        .invoice-preview-overlay .footer-text {
          text-align: center !important;
          font-size: 7.5px !important;
          color: #94a3b8 !important;
          margin-top: 3mm !important;
        }

        /* Print styles handled in index.css */
      `}</style>

      <div className="invoice-preview-toolbar">
        <button
          type="button"
          className="filter-button"
          onClick={onClose}
        >
          ← Back
        </button>

        <div className="invoice-preview-title">
          <strong>Invoice Preview</strong>
          <span>{invoice.invoiceNumber}</span>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={printInvoice}
        >
          <Printer size={14} />
          Print Invoice
        </button>
      </div>

      <div className="invoice-preview-scroll">
        <div className="mobile-preview-hint"><span>👈 Swipe horizontally to view full A5 invoice • Tap Print to save as PDF 👉</span></div>
        <div
          id="invoice-print-area"
          className="invoice-paper-a5"
        >
          <div className="header-row">
            <div className="brand-col">
              <img src={jgLogo} className="logo-img" alt="JG Logo" />
              <div>
                <h1>{settings.businessName}</h1>
                <p>{settings.address}</p>
                <p>Mobile: {settings.mobile} | Email: {settings.email}</p>
              </div>
            </div>
            <div className="invoice-pill">
              <strong>INVOICE :</strong> {invoice.invoiceNumber}
            </div>
          </div>

          <div className="line-divider" />

          <div className="bill-meta-row">
            <div className="bill-to">
              <span className="section-badge">Bill To:</span>
              <div className="bill-name">{invoice.tenant}</div>
              <div className="bill-room">Room No: <strong>{invoice.room}</strong></div>
            </div>
            <div className="vertical-divider" />
            <div className="meta-details">
              <div><strong>Invoice Date:</strong> {dateTimeStr}</div>
              <div><strong>Billing Month:</strong> {invoice.billingMonth}</div>
            </div>
          </div>

          <div className="table-frame">
            <table className="inv-table-modern">
              <colgroup>
                <col style={{ width: "10%" }} />
                <col style={{ width: "42%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "16%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={{ textAlign: "center" }}>S.No.</th>
                  <th>Service / Description</th>
                  <th style={{ textAlign: "center" }}>Room</th>
                  <th style={{ textAlign: "center" }}>Month</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ textAlign: "center" }}>1</td>
                  <td>{invoice.serviceDescription}</td>
                  <td style={{ textAlign: "center" }}>{invoice.room}</td>
                  <td style={{ textAlign: "center" }}>{invoice.billingMonth}</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>{paidAmountStr}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="payment-summary-row">
            <div className="payment-info-block">
              <div>Transaction Mode: <strong>{invoice.paymentMode}</strong></div>
              <div>Payment Status: <strong>{invoice.status}</strong></div>
              {isPartial && (
                <>
                  <div>Paid Amount: <strong>{paidAmountStr}</strong></div>
                  <div>Balance Due: <strong>{balanceStr}</strong></div>
                </>
              )}
              {invoice.notes?.trim() && (
                <div className="note-box">
                  <strong>Note:</strong>
                  <span>{invoice.notes.trim()}</span>
                </div>
              )}
            </div>
            <div className="total-card">
              <div className="total-title">TOTAL AMOUNT</div>
              <div className="total-val">{totalAmountStr}</div>
            </div>
          </div>

          <div className="line-divider" style={{ margin: "3.5mm 0 3mm" }} />

          <div className="terms-sign-row">
            <div className="terms-col">
              <span className="section-badge">Terms &amp; Conditions</span>
              <ol>
                {settings.terms.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ol>
            </div>
            <div className="vertical-divider" style={{ height: "52px" }} />
            <div className="sign-col">
              <div className="sign-lbl">{settings.signatoryTitle || "Authorized Signatory"}</div>
              <div className="sign-name">{settings.signatoryName || "Jeewith Gardens"}</div>
            </div>
          </div>

          <div className="footer-text">This is a computer-generated invoice.</div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MODAL
========================================================= */

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="modal-overlay"
      onMouseDown={onClose}
    >

      <div
        className="modal"
        onMouseDown={e =>
          e.stopPropagation()
        }
      >

        <div className="modal-header">

          <div>

            <h3>
              {title}
            </h3>

            <p>
              Enter the required
              information.
            </p>

          </div>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
          >
            <X size={18} />
          </button>

        </div>

        {children}

      </div>

    </div>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="form-field">

      <span>
        {label}
      </span>

      <input
        type={type}
        value={value}
        required={required}
        placeholder={
          placeholder
        }
        onChange={e =>
          onChange(
            e.target.value
          )
        }
      />

    </label>
  );
}

/* =========================================================
   MODAL ACTIONS
========================================================= */

function ModalActions({
  onClose,
  label = "Save",
}: {
  onClose: () => void;
  label?: string;
}) {
  return (
    <div className="modal-actions">

      <button
        type="button"
        className="filter-button"
        onClick={onClose}
      >
        Cancel
      </button>

      <button
        type="submit"
        className="primary-button"
      >
        {label}
      </button>

    </div>
  );
}

/* =========================================================
   EMPTY
========================================================= */

function EmptyTable({
  message,
}: {
  message: string;
}) {
  return (
    <div className="empty-state">

      <FileText
        size={34}
      />

      <strong>
        No data
      </strong>

      <p>
        {message}
      </p>

    </div>
  );
}

function EmptyPage({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="page">

      <div className="page-heading">

        <div>

          <h2>
            {title}
          </h2>

          <p>
            {description}
          </p>

        </div>

      </div>

      <div className="panel">

        <div className="empty-state">

          {icon}

          <strong>
            {title}
          </strong>

          <p>
            {description}
          </p>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   CONTINUOUS INVOICE NUMBER
   Format: JG-YYYYMM-XXXX

   The sequence is stored separately from invoice records.
   Deleting an invoice therefore never reuses its number.
========================================================= */

function loadInvoiceSequences(): Record<string, number> {
  try {
    const value = localStorage.getItem(
      INVOICE_SEQUENCE_KEY
    );

    if (!value) {
      return {};
    }

    const parsed = JSON.parse(value);

    if (
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, number>;
    }

    return {};
  } catch {
    return {};
  }
}

function generateInvoiceNumber(date: Date, allInvoices: Invoice[] = []): string {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const period = `${year}${month}`;
  const sequences = loadInvoiceSequences();

  let maxSeq = Number(sequences[period] || 0);

  // Check all existing invoices in memory for this period
  const periodPrefix = `JG-${period}-`;
  for (const inv of allInvoices) {
    if (inv.invoiceNumber && inv.invoiceNumber.startsWith(periodPrefix)) {
      const suffix = inv.invoiceNumber.substring(periodPrefix.length);
      const num = parseInt(suffix, 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  // Also check stored invoices in localStorage in case passed array didn't have latest
  const storedInvoices = loadData<Invoice>(INVOICE_KEY);
  for (const inv of storedInvoices) {
    if (inv.invoiceNumber && inv.invoiceNumber.startsWith(periodPrefix)) {
      const suffix = inv.invoiceNumber.substring(periodPrefix.length);
      const num = parseInt(suffix, 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  let nextNumber = maxSeq + 1;
  let candidate = `JG-${period}-${String(nextNumber).padStart(4, "0")}`;

  // Collision safety loop: guarantee uniqueness under all circumstances
  while (
    allInvoices.some(inv => inv.invoiceNumber === candidate) ||
    storedInvoices.some(inv => inv.invoiceNumber === candidate)
  ) {
    nextNumber++;
    candidate = `JG-${period}-${String(nextNumber).padStart(4, "0")}`;
  }

  sequences[period] = nextNumber;

  localStorage.setItem(
    INVOICE_SEQUENCE_KEY,
    JSON.stringify(sequences)
  );

  return candidate;
}

/* =========================================================
   EXPORT INVOICES CSV
========================================================= */

function exportInvoicesCSV(invoices: Invoice[]) {
  const headers = [
    "Invoice Number",
    "Tenant",
    "Room",
    "Billing Month",
    "Service",
    "Total Amount",
    "Paid Amount",
    "Balance",
    "Status",
    "Payment Mode",
    "Payment Date & Time",
    "Transaction ID",
    "Note",
    "Created By",
    "Created At",
  ];

  const rows = invoices.map(invoice => {
    const isPaid = invoice.status === "Paid";
    const totalVal = Number(invoice.amount) || 0;
    const paidVal = isPaid ? totalVal : (Number(invoice.received) || 0);
    // Dynamically enter 0 for Paid, and total - paid for Partially Paid
    const balanceVal = isPaid ? 0 : Math.max(totalVal - paidVal, 0);

    return [
      invoice.invoiceNumber,
      invoice.tenant,
      invoice.room,
      invoice.billingMonth,
      invoice.serviceDescription,
      totalVal,
      paidVal,
      balanceVal,
      invoice.status,
      invoice.paymentMode,
      invoice.paymentDateTime,
      invoice.transactionId,
      invoice.notes || "",
      invoice.createdBy,
      invoice.createdAt,
    ];
  });

  const csv = [headers, ...rows]
    .map(row =>
      row
        .map(value => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  downloadBlob(
    csv,
    "jeevith-gardens-all-invoices.csv",
    "text/csv;charset=utf-8"
  );
}

/* =========================================================
   DOWNLOAD CSV
========================================================= */

function downloadBlob(
  content: string,
  filename: string,
  type: string
) {
  const blob =
    new Blob(
      [content],
      { type }
    );

  const url =
    URL.createObjectURL(
      blob
    );

  const anchor =
    document.createElement(
      "a"
    );

  anchor.href = url;
  anchor.download =
    filename;

  document.body.appendChild(
    anchor
  );

  anchor.click();

  anchor.remove();

  URL.revokeObjectURL(
    url
  );
}

/* =========================================================
   MONEY
========================================================= */

function formatMoney(
  value: number
) {
  const safeValue =
    Number.isFinite(value)
      ? value
      : 0;

  return `₹${safeValue.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits:
        2,
      maximumFractionDigits:
        2,
    }
  )}`;
}