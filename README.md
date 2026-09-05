# Sell & Repair POS – Editable Reconstruction

This project is an editable React Native reconstruction based on the current production APK supplied by the owner.

## Implemented
- Production login contract recovered from APK (`account/Login`)
- Bearer access-token session handling
- Authenticated **read-only** catalogue connection
- Products, categories, case series and case types recovered as live GET routes
- Defensive API response normalisation for common envelope/paging shapes
- Product/category UI with retry state
- Phone-case upsell prompt: **Ask the customer if they would like a screen protector**
- Screen protector filter / model search handoff
- Safe variant-stock query builder prepared for real `productId`, `storeId`, `variantId`

## Production safety
- `liveAuthEnabled: true`
- `liveReadsEnabled: true`
- `liveWritesEnabled: false`

The app can authenticate and read catalogue data, but this reconstruction intentionally cannot create/update/delete stock, products, purchases or sales yet.

## Recovered backend
`https://api.sellandrepair.co.uk/api/v1`

See `RECOVERED_API.md` for route and contract notes.

## Current reconstruction status: store + live variant stock

The editable sales screen can now resolve the logged-in user's store from `user.storeId`, load the store record read-only, and lazily query live product variants/stock. Product rows show a live stock status after lookup and `View variants` displays the recovered variant fields (model/name/colour and `totalStock`).

The stock lookup is intentionally lazy rather than requesting every product at startup, to avoid hammering the production API. Product, category, store, and stock reads are enabled; production POST/PUT/PATCH/DELETE operations remain disabled.

## Checkout reconstruction status

The editable sales screen now supports variant-aware basket lines and an editable checkout modal. It models the production POS concepts recovered from the APK: percentage discount, Cash/Card/Split tender, tendered amount, change due, payment method, receipt notes and a receipt-text preview. It also prepares a recovered order payload including product/variant IDs.

For safety, `Confirm Order` currently demonstrates validation and then stops at the production-write guard. It does not create an order, reduce stock, create a transaction, or print to the Epson printer. The Epson native bridge is represented in `src/services/printerService.ts`, but is also write-gated.

## Checkout write reconstruction

The production `add_order` path and checkout payload shape have now been recovered from the current APK. `src/services/orderService.ts` builds the recovered order object, validates it, and contains the authenticated POST implementation for `orders/`.

**Production writes are still hard-disabled (`liveWritesEnabled: false`).** This is intentional: the next safe milestone is an isolated live test with a controlled low-value/test transaction, after which success-response handling, cart clearing, receipt printing, and stock refresh can be enabled in sequence.

### Post-sale flow now reconstructed

The foundation now includes a guarded post-sale workflow: successful order responses are normalised for order ID/number, the final receipt is rebuilt with that number, sold product variants are re-fetched to refresh live stock, and the basket clears only after completion. Epson receipt printing is wired through the recovered native `printText` bridge but remains disabled by the production write safety switch.
