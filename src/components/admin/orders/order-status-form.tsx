"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui";
import { Select } from "@/components/admin/fields";
import { FormMessage } from "@/components/admin/form-message";
import { ORDER_STATUS_LABELS, ORDER_STATUSES } from "@/lib/order-constants";
import { changeOrderStatus } from "@/lib/actions/orders";
import type { OrderStatus } from "@/generated/prisma/enums";

export function OrderStatusForm({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const [state, formAction, pending] = useActionState(changeOrderStatus, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="orderId" value={orderId} />
      <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
        Statut
        <Select name="status" defaultValue={currentStatus}>
          {ORDER_STATUSES.map((value) => (
            <option key={value} value={value}>
              {ORDER_STATUS_LABELS[value]}
            </option>
          ))}
        </Select>
      </label>
      <FormMessage state={state} successLabel="Statut mis à jour." />
      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Mettre à jour"}
      </Button>
    </form>
  );
}
