"use client";

import { useMemo, useState } from "react";
import { Download, Printer, Search, X } from "lucide-react";
import { usePortalContext } from "@/components/portal/portal-data-provider";
import { formatPortalDate, formatPortalDateTime } from "@/components/portal/use-portal-data";
import {
  PortalDataRow,
  PortalEmptyState,
  PortalStatusBadge,
} from "@/components/portal/portal-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PortalInvoice } from "@/lib/portal/dashboard";
import { cn } from "@/lib/utils";

type InvoiceStatusFilter =
  | "all"
  | "open"
  | "paid"
  | "overdue"
  | "partial"
  | "sent"
  | "cancelled";

const STATUS_FILTERS: { key: InvoiceStatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "sent", label: "Sent" },
  { key: "paid", label: "Paid" },
  { key: "overdue", label: "Overdue" },
  { key: "partial", label: "Partial" },
  { key: "cancelled", label: "Cancelled" },
];

function normalize(value?: string | null) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function formatMoney(
  amount: number | string | null | undefined,
  currency?: string | null
) {
  if (amount == null || amount === "") return "—";
  const num = Number(amount);
  if (Number.isNaN(num)) return String(amount);
  return `${currency || "USD"} ${num.toFixed(2)}`;
}

function matchesStatusFilter(invoice: PortalInvoice, filter: InvoiceStatusFilter) {
  if (filter === "all") return true;
  const status = normalize(invoice.status);
  const payment = normalize(invoice.paymentStatus);
  if (filter === "paid") {
    return payment === "paid" || status === "paid";
  }
  return status === filter || payment === filter;
}

function isInvoicePaid(invoice: PortalInvoice) {
  return (
    normalize(invoice.paymentStatus) === "paid" || normalize(invoice.status) === "paid"
  );
}

function printInvoice(documentUrl: string) {
  const win = window.open(documentUrl, "_blank", "noopener,noreferrer");
  if (!win) return;
  win.addEventListener("load", () => {
    win.focus();
    win.print();
  });
}

export function PortalInvoicesView() {
  const { data } = usePortalContext();
  const invoices = data?.invoices ?? [];
  const payments = data?.payments ?? [];

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>("all");
  const [selected, setSelected] = useState<PortalInvoice | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (!matchesStatusFilter(inv, statusFilter)) return false;
      if (!q) return true;
      return (
        normalize(inv.number).includes(q) ||
        normalize(inv.status).includes(q) ||
        normalize(inv.paymentStatus).includes(q)
      );
    });
  }, [invoices, query, statusFilter]);

  const invoicePayments = useMemo(() => {
    if (!selected) return [];
    return payments.filter(
      (p) =>
        p.invoice_id === selected.id ||
        (p.invoice_number && p.invoice_number === selected.number)
    );
  }, [payments, selected]);

  if (!invoices.length) {
    return (
      <div className="p-5 sm:p-6">
        <PortalEmptyState
          title="No invoices yet"
          description="Invoice history will appear when available for your identity session."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 px-5 pt-4 sm:px-6 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative w-full min-w-0 sm:max-w-sm sm:flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--portal-muted)]"
            aria-hidden
          />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by invoice number or status…"
            className="h-11 bg-[var(--portal-panel)] pl-10 focus-visible:border-[var(--portal-border)] focus-visible:ring-0"
            aria-label="Search invoices"
            autoComplete="off"
          />
        </div>
        <div
          className="flex w-full flex-wrap gap-1 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] p-1 sm:w-auto sm:shrink-0"
          role="tablist"
          aria-label="Filter invoices by status"
        >
          {STATUS_FILTERS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={statusFilter === tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-xs font-medium transition",
                statusFilter === tab.key
                  ? "bg-[var(--portal-panel)] text-[var(--portal-fg)] shadow-sm"
                  : "text-[var(--portal-muted)] hover:text-[var(--portal-fg)]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length ? (
        <div className="portal-table-wrap">
          <table className="portal-table">
            <thead>
              <tr>
                <th scope="col">Number</th>
                <th scope="col">Status</th>
                <th scope="col">Date</th>
                <th scope="col">Due</th>
                <th scope="col">Amount</th>
                <th scope="col">Payment</th>
                <th scope="col">Due amount</th>
                <th scope="col">Paid amount</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((invoice) => (
                <tr
                  key={invoice.id}
                  className={cn(selected?.id === invoice.id && "bg-[var(--portal-primary-soft)]/40")}
                >
                  <td className="whitespace-nowrap font-medium">{invoice.number}</td>
                  <td>
                    <PortalStatusBadge status={invoice.status} />
                  </td>
                  <td className="whitespace-nowrap">{formatPortalDate(invoice.date) || "—"}</td>
                  <td className="whitespace-nowrap">{formatPortalDate(invoice.dueDate) || "—"}</td>
                  <td className="whitespace-nowrap tabular-nums font-medium">
                    {invoice.amount ||
                      formatMoney(
                        invoice.total ?? invoice.amountPaid ?? invoice.amountDue,
                        invoice.currency
                      )}
                  </td>
                  <td>
                    <PortalStatusBadge status={invoice.paymentStatus} />
                  </td>
                  <td className="whitespace-nowrap tabular-nums">
                    {formatMoney(invoice.amountDue, invoice.currency)}
                  </td>
                  <td className="whitespace-nowrap tabular-nums">
                    {formatMoney(invoice.amountPaid, invoice.currency)}
                  </td>
                  <td>
                    <div className="flex flex-nowrap items-center justify-end gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 shrink-0 rounded-lg px-2"
                        onClick={() => setSelected(invoice)}
                      >
                        Preview
                      </Button>
                      {invoice.documentUrl ? (
                        <a
                          href={invoice.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-medium text-[var(--portal-primary)] hover:underline"
                        >
                          Open
                        </a>
                      ) : null}
                      {isInvoicePaid(invoice) && invoice.pdfUrl ? (
                        <a
                          href={invoice.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-medium text-[var(--portal-primary)] hover:underline"
                        >
                          <Download className="h-3.5 w-3.5" />
                          PDF
                        </a>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <PortalEmptyState
            title="No matching invoices"
            description="Adjust your search or status filter to see more results."
            action={
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  setQuery("");
                  setStatusFilter("all");
                }}
              >
                Clear filters
              </Button>
            }
          />
        </div>
      )}

      {selected ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40"
            aria-label="Close invoice details"
            onClick={() => setSelected(null)}
          />
          <aside
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-[var(--portal-border)] bg-[var(--portal-panel)] shadow-[var(--portal-shadow)]"
            aria-label="Invoice details"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[var(--portal-border)] px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--portal-fg)]">
                  Invoice {selected.number}
                </h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <PortalStatusBadge status={selected.status} />
                  <PortalStatusBadge status={selected.paymentStatus} />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg p-1.5 text-[var(--portal-muted)] hover:bg-[var(--portal-soft)]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {!isInvoicePaid(selected) ? (
                <div
                  role="status"
                  className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-black"
                >
                  Preview only with an <strong>UNPAID</strong> watermark. PDF download unlocks
                  after License Engine confirms payment.
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <PortalDataRow label="Invoice number" value={selected.number} />
                <PortalDataRow label="Status" value={selected.status} />
                <PortalDataRow label="Issue date" value={formatPortalDate(selected.date)} />
                <PortalDataRow label="Due date" value={formatPortalDate(selected.dueDate)} />
                <PortalDataRow label="Total amount" value={selected.amount} />
                <PortalDataRow
                  label="Amount due"
                  value={formatMoney(selected.amountDue, selected.currency)}
                />
                <PortalDataRow
                  label="Amount paid"
                  value={formatMoney(selected.amountPaid, selected.currency)}
                />
                <PortalDataRow label="Payment status" value={selected.paymentStatus} />
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-[var(--portal-fg)]">
                  Payment history
                </p>
                {invoicePayments.length ? (
                  <div className="space-y-2">
                    {invoicePayments.map((payment) => (
                      <div
                        key={payment.id}
                        className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3 text-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium">
                            {payment.transaction_id || payment.reference_number || payment.id}
                          </span>
                          <PortalStatusBadge status={payment.status} />
                        </div>
                        <p className="mt-1 tabular-nums text-[var(--portal-fg)]">
                          {payment.currency} {Number(payment.amount).toFixed(2)}
                        </p>
                        <p className="mt-1 text-xs text-[var(--portal-muted)]">
                          {formatPortalDateTime(payment.paid_date) || "—"}
                          {payment.gateway ? ` · ${payment.gateway}` : ""}
                          {payment.payment_method ? ` · ${payment.payment_method}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--portal-muted)]">
                    No payments recorded for this invoice.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-[var(--portal-border)] p-5">
              {selected.documentUrl ? (
                <Button asChild size="sm" variant="outline" className="rounded-xl">
                  <a href={selected.documentUrl} target="_blank" rel="noopener noreferrer">
                    Preview document
                  </a>
                </Button>
              ) : null}
              {isInvoicePaid(selected) && selected.pdfUrl ? (
                <Button asChild size="sm" className="rounded-xl">
                  <a href={selected.pdfUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" />
                    Download PDF
                  </a>
                </Button>
              ) : (
                <Button size="sm" className="rounded-xl" disabled title="Available after payment is confirmed">
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
              )}
              {selected.documentUrl ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => printInvoice(selected.documentUrl!)}
                >
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
              ) : null}
            </div>
          </aside>
        </>
      ) : null}
    </div>
  );
}
