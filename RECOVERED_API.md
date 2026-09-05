# Recovered production API map (current APK)

Base URL found in the current APK:

`https://api.sellandrepair.co.uk`

The following route/operation names are visible in the compiled Hermes bundle and are treated as evidence, not guesses:

- `get_all_stores?pageNumber=1&pageSize=1000`
- `get_all_suppliers`
- `lookup_suppliers?`
- `get_all_products`
- `get_all_categories`
- `get_all_brands`
- `get_case_series`
- `get_case_types`
- `ProductStocks/variant-stocks?`
- `ProductStocks/batches-with-variant?`
- `ProductStocks/logs?`
- `Purchases/TransferLogs?`
- `get_all_purchases`
- `get_all_transactions`
- `reports/dashboard?storeId=`
- `Reports/WeeklySales?storeId=`
- `get_reports/SingleDaySales?date=`
- `Reports/SalesExcel?fromDate=`
- `Products/Export?platform=`
- `Transactions/Export?startDate=`

The APK also contains `access_token`, `Basic`, `Bearer`, `Login Response:` and session-expiry/login handling strings. This strongly indicates token-based authentication, but the exact login route, request body, header choice and response schema have not yet been proven. For safety, live reads and writes remain disabled in `src/config/backend.ts`.

## Authentication contract recovered from Hermes bytecode

The current APK defines:

- API root: `https://api.sellandrepair.co.uk/api/v1`
- Login route: `account/Login`
- Login method: POST (the APK's `postData` wrapper calls `client.post(route, data)`)
- Login fields observed in the login UI/action: `email`, `password`
- Successful login fields read by the app:
  - `data.access_token`
  - `data.refresh_token`
  - `data.user`
- Session storage keys visible in the APK:
  - `@token`
  - `@user`
- Authenticated request header:
  - `Authorization: Bearer <access_token>`

The editable foundation now implements this contract in `src/services/auth.ts`.
Production stock/sale writes remain disabled.

## Read-only catalogue integration

The editable reconstruction now enables authenticated GET requests for these recovered routes:
- `get_all_products`
- `get_all_categories`
- `get_case_series`
- `get_case_types`

Responses are passed through tolerant normalisers that accept direct arrays, `data`, `items`, `results`, `records`, and common paged envelopes. Unrecognised fields remain attached to `Product.raw` so future mapping can be improved without losing production response data.

### Variant stock query
The production Hermes string table contains `ProductStocks/variant-stocks?` together with query fragments including `storeId` and `variantId` (and product identifiers are present elsewhere in the same stock flow). The reconstruction therefore exposes an explicit read-only query builder for `productId`, `storeId`, and `variantId`, but will not issue a stock request unless at least one real identifier is supplied.

All POST/PUT/PATCH/DELETE stock and sale operations remain disabled.

## Store and variant contract recovered from current APK

The current production Hermes bundle shows the following relationships directly in the UI/action code:

- Dashboard reads `user_info.storeId`.
- Store details are loaded through the store-by-ID action; the URL string table contains the prefix `stores/`.
- The product menu calls `get_variant_stocks` for the selected product.
- The variant-stock request builds `ProductStocks/variant-stocks?productId=<product id>`.
- The response handling reads `response.data.result` before iterating variant rows.
- Variant rows referenced by the current till include:
  - `id`
  - `productId`
  - `variantId`
  - `name`
  - `modelName`
  - `modelNumber`
  - `colorName`
  - `totalStock`

The editable reconstruction now stores the user's `storeId` in the session, reads the current store via `stores/<storeId>`, and provides lazy read-only per-product variant stock lookup. Where the stock endpoint accepts it, the current store ID is also included as a filter. No stock mutation calls are enabled.

## Checkout / receipt recovery

Recovered from the current production Hermes bundle:

- Checkout UI supports `Cash`, `Card`, parked sales, void order and `Confirm Order`.
- Order/payment state references: `totalDiscount`, `cardAmount`, `cashAmount`, `paymentMethod`, `receiptNotes`, `orderNumber`, `OrderItemId`.
- Redux/action names include `add_order`, `submitOrder`, `saveOrder` and `add_transaction`.
- Read routes include `orders/`, `orders?`, `orders/details?number=`, `transactions/`, `transactions?`.
- The receipt builder prints Order Number, Placed By, Date, VAT Number, Items, Sub Total, Discount, Total, Card Amount, Cash Amount, Tendered Amount, Change Due, Refund Amount and THANK YOU.
- Native printer integration references `EpsonNetworkPrinterModule`, `printerService`, `printText`, `printerIp`, and `stores/setPrinterIp`.

The exact production POST URL/body used by `add_order` is NOT yet treated as verified. The editable project therefore builds a recovered payload preview but hard-blocks submission and printer writes while `liveWritesEnabled` is false.

## Order creation contract recovered from current APK

The current checkout imports `add_order`, which resolves to a POST through the app's `postData` helper. The route table under `URLS.orders` contains:

- Create: `orders/`
- List/search: `orders?`
- Details by order number: `orders/details?number=`

The order object assembled immediately before `add_order(...)` includes these recovered fields:

- `subTotal`
- `discount`
- `discountAmount`
- `itemDiscountAmount`
- `totalDiscount`
- `grandTotal`
- `cardAmount`
- `cashAmount`
- `changeDueAmount`
- `tenderedAmount`
- `paymentMethod`
- `notes` (the production checkout uses `Generated via POS`)
- `status`
- `items`

Each mapped item includes the product `id`, `name`, `description`, `purchasedPrice`, `sellPrice`, `quantity`, `totalPrice`, `variantId`, `discount`, and `totalDiscount` where available.

### Safety state

`liveWritesEnabled` remains `false`. The editable project can build and validate the recovered payload but will not create a live order until an isolated production test is explicitly enabled. No production order was submitted during reconstruction.

## Post-sale workflow reconstruction

The editable checkout now models the production-success sequence without enabling live writes:

1. `POST orders/` returns an order response.
2. The response is normalised defensively from common `data`, `result`, `order`, or root envelopes.
3. The returned order number is read from `orderNumber`, `order_number`, `number`, `invoiceNumber`, or `invoiceNo` when present.
4. The receipt is rebuilt with the real returned order number rather than `PENDING`.
5. Every sold product is re-fetched through `ProductStocks/variant-stocks?productId=...&storeId=...` to refresh visible live stock.
6. The UI clears the basket only after the order and post-sale refresh sequence completes.
7. Epson `printText(printerIp, receiptText)` is wired at the boundary, but remains blocked while `liveWritesEnabled` is `false`.

This deliberately avoids fabricating an order number if the API response does not contain one.
