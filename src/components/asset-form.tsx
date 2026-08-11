"use client";

import { useActionState, useRef, useTransition } from "react";
import { toast } from "sonner";
import type { Activity, Department, Location } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, toDateInputValue } from "@/lib/format";
import type { FormState } from "@/actions/assets";
import { getNextAdditionTag } from "@/actions/assets";
import { INHERIT_ACTIVITY_VALUE } from "@/lib/schemas";

type Category = {
  id: string;
  name: string;
  capitalizationThreshold: string | null;
};

function categoryLabel(category: Category): string {
  if (category.capitalizationThreshold == null) return category.name;
  return `${category.name} (min ${formatCurrency(category.capitalizationThreshold)})`;
}

type Asset = {
  assetTag: string;
  name: string;
  description: string | null;
  categoryId: string;
  departmentId: string;
  locationId: string;
  purchaseDate: Date;
  inServiceDate: Date;
  originalCost: string;
  salvageValue: string;
  usefulLifeMonths: number;
  activityId: string | null;
  parentAssetTag: string | null;
};

export function AssetForm({
  action,
  categories,
  departments,
  locations,
  activities,
  asset,
}: {
  action: (state: FormState | undefined, formData: FormData) => Promise<FormState>;
  categories: Category[];
  departments: Department[];
  locations: Location[];
  activities: Activity[];
  asset?: Asset;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const assetTagRef = useRef<HTMLInputElement>(null);
  const [tagLookupPending, startTagLookup] = useTransition();

  const handleParentTagBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (asset) return; // only auto-assign when creating a new asset
    const parentTag = e.target.value.trim();
    if (!parentTag || assetTagRef.current?.value) return;

    startTagLookup(async () => {
      const result = await getNextAdditionTag(parentTag);
      if ("tag" in result) {
        if (assetTagRef.current && !assetTagRef.current.value) {
          assetTagRef.current.value = result.tag;
        }
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <form action={formAction} className="grid max-w-2xl gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="assetTag">Asset Tag</Label>
          <Input
            ref={assetTagRef}
            id="assetTag"
            name="assetTag"
            defaultValue={asset?.assetTag}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={asset?.name} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={asset?.description ?? ""} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="categoryId">Category</Label>
          <Select
            name="categoryId"
            defaultValue={asset?.categoryId}
            items={categories.map((c) => ({ value: c.id, label: categoryLabel(c) }))}
          >
            <SelectTrigger id="categoryId" className="w-full">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {categoryLabel(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="departmentId">Department</Label>
          <Select
            name="departmentId"
            defaultValue={asset?.departmentId}
            items={departments.map((d) => ({ value: d.id, label: d.name }))}
          >
            <SelectTrigger id="departmentId" className="w-full">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="locationId">Location</Label>
          <Select
            name="locationId"
            defaultValue={asset?.locationId}
            items={locations.map((l) => ({ value: l.id, label: l.name }))}
          >
            <SelectTrigger id="locationId" className="w-full">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="activityId">GASB Activity (override)</Label>
        <Select
          name="activityId"
          defaultValue={asset?.activityId ?? INHERIT_ACTIVITY_VALUE}
          items={[
            { value: INHERIT_ACTIVITY_VALUE, label: "Inherit from department" },
            ...activities.map((a) => ({ value: a.id, label: `${a.function} — ${a.activity}` })),
          ]}
        >
          <SelectTrigger id="activityId" className="w-full">
            <SelectValue placeholder="Inherit from department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={INHERIT_ACTIVITY_VALUE}>Inherit from department</SelectItem>
            {activities.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.function} — {a.activity}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="parentAssetTag">Addition to Existing Asset (optional)</Label>
        <Input
          id="parentAssetTag"
          name="parentAssetTag"
          placeholder="e.g. 9071 — leave blank if this isn't an addition"
          defaultValue={asset?.parentAssetTag ?? ""}
          onBlur={handleParentTagBlur}
        />
        <p className="text-xs text-muted-foreground">
          Link this as a capitalized addition to an existing asset (e.g. an FY addition to
          a building) instead of tracking it as its own unrelated facility.
          {!asset &&
            " Leave Asset Tag blank and the next addition number (e.g. 9071-01) fills in automatically."}
          {tagLookupPending && " Looking up the next available number…"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="purchaseDate">Purchase Date</Label>
          <Input
            id="purchaseDate"
            name="purchaseDate"
            type="date"
            defaultValue={asset ? toDateInputValue(asset.purchaseDate) : undefined}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="inServiceDate">In-Service Date</Label>
          <Input
            id="inServiceDate"
            name="inServiceDate"
            type="date"
            defaultValue={asset ? toDateInputValue(asset.inServiceDate) : undefined}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="originalCost">Original Cost</Label>
          <Input
            id="originalCost"
            name="originalCost"
            type="number"
            step="0.01"
            min="0"
            defaultValue={asset ? String(asset.originalCost) : undefined}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="salvageValue">Salvage Value</Label>
          <Input
            id="salvageValue"
            name="salvageValue"
            type="number"
            step="0.01"
            min="0"
            defaultValue={asset ? String(asset.salvageValue) : "0"}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="usefulLifeMonths">Useful Life (months)</Label>
          <Input
            id="usefulLifeMonths"
            name="usefulLifeMonths"
            type="number"
            min="0"
            defaultValue={asset?.usefulLifeMonths}
            required
          />
        </div>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : asset ? "Save Changes" : "Create Asset"}
        </Button>
      </div>
    </form>
  );
}
