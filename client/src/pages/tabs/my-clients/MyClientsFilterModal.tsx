import CustomSelect from "@/components/shared/CustomSelect";
import { ModalContainer } from "@/components/shared/ModalContainer";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { ClientIntegration } from "@/types/api";

export type MyClientsFilters = {
  minUnitCount: number | null;
  bucket: "all" | "1" | "2" | "3";
  settledInFull: "all" | "active" | "inactive";
  integration: "all" | ClientIntegration | "none";
  integrationSetup: "all" | "yes" | "no";
  taxCampaign: "all" | "yes" | "no";
  flagged: "all" | "yes" | "no";
  minRecoveryRate: number | null;
};

type MyClientsFilterModalProps = {
  open: boolean;
  filters: MyClientsFilters;
  onChange: (filters: MyClientsFilters) => void;
  onOpenChange: (open: boolean) => void;
  onApply: () => void;
  onReset: () => void;
};

const INTEGRATION_OPTIONS: ClientIntegration[] = [
  "YARDI",
  "ENTRATA",
  "ONESITE",
  "RESMAN",
  "RENT_MANAGER",
];

function formatIntegrationLabel(value: ClientIntegration) {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function toInputValue(value: number | null) {
  return value === null ? "" : value.toString();
}

export function MyClientsFilterModal({
  open,
  filters,
  onChange,
  onOpenChange,
  onApply,
  onReset,
}: MyClientsFilterModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl border-none bg-transparent p-0 shadow-none [&>button]:hidden">
        <ModalContainer
          title="Filter My Clients"
          description="Narrow the table by account size, bucket, settlement activity, integrations, campaign flags, and recovery performance."
          onClose={() => onOpenChange(false)}
          primaryAction={{ label: "Apply filters", onClick: onApply }}
          secondaryAction={{ label: "Reset", onClick: onReset }}
          titleClassName="text-2xl"
          bodyClassName="space-y-6 pt-0"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-foreground">Minimum Unit Count</span>
              <input
                type="number"
                min="0"
                step="1"
                value={toInputValue(filters.minUnitCount)}
                onChange={(event) => onChange({
                  ...filters,
                  minUnitCount: event.target.value === "" ? null : Number(event.target.value),
                })}
                placeholder="Any unit count"
                className="h-[46px] w-full rounded-xl border-2 border-border bg-background px-3.5 py-2.5 text-sm shadow-none transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-foreground">Minimum Recovery Rate</span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={toInputValue(filters.minRecoveryRate)}
                onChange={(event) => onChange({
                  ...filters,
                  minRecoveryRate: event.target.value === "" ? null : Number(event.target.value),
                })}
                placeholder="Any recovery rate"
                className="h-[46px] w-full rounded-xl border-2 border-border bg-background px-3.5 py-2.5 text-sm shadow-none transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
              />
            </label>

            <div className="space-y-2">
              <span className="text-sm font-semibold text-foreground">Bucket</span>
              <CustomSelect
                value={filters.bucket}
                onChange={(value) => onChange({ ...filters, bucket: value as MyClientsFilters["bucket"] })}
                options={[
                  { value: "all", label: "All buckets" },
                  { value: "1", label: "Bucket 1" },
                  { value: "2", label: "Bucket 2" },
                  { value: "3", label: "Bucket 3" },
                ]}
                placeholder="All buckets"
              />
            </div>

            <div className="space-y-2">
              <span className="text-sm font-semibold text-foreground">Settled In Full</span>
              <CustomSelect
                value={filters.settledInFull}
                onChange={(value) => onChange({ ...filters, settledInFull: value as MyClientsFilters["settledInFull"] })}
                options={[
                  { value: "all", label: "All statuses" },
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
                placeholder="All statuses"
              />
            </div>

            <div className="space-y-2">
              <span className="text-sm font-semibold text-foreground">Integration</span>
              <CustomSelect
                value={filters.integration}
                onChange={(value) => onChange({ ...filters, integration: value as MyClientsFilters["integration"] })}
                options={[
                  { value: "all", label: "All integrations" },
                  { value: "none", label: "No integration" },
                  ...INTEGRATION_OPTIONS.map((integration) => ({
                    value: integration,
                    label: formatIntegrationLabel(integration),
                  })),
                ]}
                placeholder="All integrations"
              />
            </div>

            <div className="space-y-2">
              <span className="text-sm font-semibold text-foreground">Integration Setup</span>
              <CustomSelect
                value={filters.integrationSetup}
                onChange={(value) => onChange({ ...filters, integrationSetup: value as MyClientsFilters["integrationSetup"] })}
                options={[
                  { value: "all", label: "All values" },
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                ]}
                placeholder="All values"
              />
            </div>

            <div className="space-y-2">
              <span className="text-sm font-semibold text-foreground">Tax Campaign</span>
              <CustomSelect
                value={filters.taxCampaign}
                onChange={(value) => onChange({ ...filters, taxCampaign: value as MyClientsFilters["taxCampaign"] })}
                options={[
                  { value: "all", label: "All values" },
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                ]}
                placeholder="All values"
              />
            </div>

            <div className="space-y-2">
              <span className="text-sm font-semibold text-foreground">Flagged</span>
              <CustomSelect
                value={filters.flagged}
                onChange={(value) => onChange({ ...filters, flagged: value as MyClientsFilters["flagged"] })}
                options={[
                  { value: "all", label: "All values" },
                  { value: "yes", label: "Flagged" },
                  { value: "no", label: "Not flagged" },
                ]}
                placeholder="All values"
              />
            </div>
          </div>
        </ModalContainer>
      </DialogContent>
    </Dialog>
  );
}
