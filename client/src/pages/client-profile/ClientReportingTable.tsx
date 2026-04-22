import { useMemo } from "react";
import type { Client } from "@/types/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buildReportingRows, formatCurrency } from "./reportingUtils";

export function ClientReportingTable({ client }: { client: Client }) {
  const rows = useMemo(() => buildReportingRows(client), [client]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border/60 bg-muted/20 px-6 py-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Placement Detail</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Account-level reporting for recent placements tied to {client.companyName}.
        </p>
      </div>

      <Table className="min-w-[980px]">
        <TableHeader className="bg-muted/10">
          <TableRow className="hover:bg-transparent">
            <TableHead className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Debtor name</TableHead>
            <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Acct #</TableHead>
            <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Apt #</TableHead>
            <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Date placed</TableHead>
            <TableHead className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider">IQS</TableHead>
            <TableHead className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider">Placed amount</TableHead>
            <TableHead className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider">Collected amount</TableHead>
            <TableHead className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider">Balance amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="px-6 py-4 font-semibold text-foreground">{row.debtorName}</TableCell>
              <TableCell className="px-4 py-4 font-medium text-foreground">{row.accountNumber}</TableCell>
              <TableCell className="px-4 py-4 text-muted-foreground">{row.apartmentNumber}</TableCell>
              <TableCell className="px-4 py-4 text-muted-foreground">{row.datePlaced}</TableCell>
              <TableCell className="px-4 py-4 text-right font-medium text-foreground">{row.iqs}</TableCell>
              <TableCell className="px-4 py-4 text-right font-medium text-foreground">
                {formatCurrency(row.placedAmount)}
              </TableCell>
              <TableCell className="px-4 py-4 text-right font-medium text-emerald-700">
                {formatCurrency(row.collectedAmount)}
              </TableCell>
              <TableCell className="px-6 py-4 text-right font-medium text-foreground">
                {formatCurrency(row.balanceAmount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
