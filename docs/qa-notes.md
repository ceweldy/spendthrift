# QA Notes

## Inventory / Activity reliability sanity checklist

1. Start a new run, add 1–2 products, complete checkout in **round N**.
2. Confirm app advances to **round N+1** and hand redraws.
3. Switch to **Inventory** tab:
   - Purchased items from round N are present.
   - Quantity and totals reflect the checkout.
4. Switch to **Activity** tab:
   - Checkout completion entry appears.
   - Inventory update entry appears.
   - Round transition entry appears.
5. Rapidly click tabs (`Shop/Game` ⇄ `Inventory` ⇄ `Activity`) 5–10 times:
   - Panel always changes and renders (no blank/stuck panel).
6. Reload the page:
   - Inventory remains populated.
   - Activity still shows recent entries (or fallback from history).
7. Migration fallback test (dev):
   - In localStorage persisted state, clear `inventory` but keep `purchaseHistory`.
   - Reload and verify inventory reconstructs from purchase history.
