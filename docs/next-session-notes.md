# Next Session Notes

## Current State

- Storefront checkout now creates orders in backend via `POST /v1/store/orders`.
- Orders now persist explicit `status` values: `pending` or `paid`.
- Storefront orders are created as `pending`.
- POS/manual orders are created as `paid`.
- Admin can mark pending orders as paid from:
  - `web/src/pages/OrderDetail.jsx`
  - `web/src/pages/Orders.jsx`
- Migration `000015_add_status_to_orders` has already been applied locally (`migrate ... up` returned `no change`).

## Verified

- `go test ./...` passed
- `cd web && npm run lint` passed

## Good Next Steps

### 1. Add explicit order channel

Problem:
- UI currently infers channel mostly from payment label.
- There is no explicit `channel` field such as `storefront`, `pos`, or `manual`.

Suggested work:
- Add `channel` to `domain.Order`
- Add DB migration for `orders.channel`
- Set `channel = storefront` in `CreateStoreOrder`
- Set `channel = pos` for cashier flow and `manual` if needed for admin-created orders
- Expose it in `orderResponse`
- Show it in `Orders.jsx` and `OrderDetail.jsx`

### 2. Support manual paid amount when paying pending orders

Problem:
- Current pay action always sends full `total_price`.
- No UI for partial/actual payment input.

Suggested work:
- Add input/modal for `total_paid` in `Orders.jsx` and `OrderDetail.jsx`
- Reuse existing `PUT /v1/orders/:id/pay`
- Keep validation in service:
  - reject if `total_paid < total_price`
  - reject if order already `paid`

## Important Files

- `internal/core/service/order.go`
- `internal/adapter/storage/postgres/repository/order.go`
- `internal/adapter/handler/http/order.go`
- `internal/adapter/handler/http/router.go`
- `internal/adapter/handler/http/response.go`
- `web/src/lib/api.js`
- `web/src/pages/StoreCart.jsx`
- `web/src/pages/Orders.jsx`
- `web/src/pages/OrderDetail.jsx`

## Notes

- Public storefront payments are loaded from `GET /v1/store/payments`.
- Storefront checkout currently uses the first internal `cashier` or `admin` user as fallback `UserID` for order creation.
- If that fallback becomes a problem, introduce a dedicated system/storefront user strategy instead of relying on first-match user selection.
