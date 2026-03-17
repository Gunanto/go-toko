package repository

import (
	"context"
	"database/sql"
	"strings"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/bagashiz/go-pos/internal/adapter/storage/postgres"
	"github.com/bagashiz/go-pos/internal/core/domain"
	"github.com/bagashiz/go-pos/internal/core/port"
	"github.com/jackc/pgx/v5"
)

/**
 * OrderRepository implements port.OrderRepository interface
 * and provides an access to the postgres database
 */
type OrderRepository struct {
	db *postgres.DB
}

// ListCustomers aggregates customers based on orders
func (or *OrderRepository) ListCustomers(ctx context.Context, skip, limit uint64) ([]domain.CustomerSummary, error) {
	var customers []domain.CustomerSummary

	query := or.db.QueryBuilder.
		Select(
			"customer_name",
			"COUNT(*) AS total_orders",
			"SUM(total_price) AS total_spent",
			"MAX(created_at) AS last_order_at",
		).
		From("orders").
		GroupBy("customer_name").
		OrderBy("total_spent DESC").
		Limit(limit).
		Offset(skip)

	sql, args, err := query.ToSql()
	if err != nil {
		return nil, err
	}

	rows, err := or.db.Query(ctx, sql, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var summary domain.CustomerSummary
		err := rows.Scan(
			&summary.Name,
			&summary.TotalOrders,
			&summary.TotalSpent,
			&summary.LastOrderAt,
		)
		if err != nil {
			return nil, err
		}
		customers = append(customers, summary)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return customers, nil
}

// CountCustomers returns total distinct customers
func (or *OrderRepository) CountCustomers(ctx context.Context) (uint64, error) {
	var total uint64

	query := or.db.QueryBuilder.Select("COUNT(DISTINCT customer_name)").From("orders")
	sql, args, err := query.ToSql()
	if err != nil {
		return 0, err
	}

	err = or.db.QueryRow(ctx, sql, args...).Scan(&total)
	if err != nil {
		return 0, err
	}

	return total, nil
}

// NewOrderRepository creates a new order repository instance
func NewOrderRepository(db *postgres.DB) *OrderRepository {
	return &OrderRepository{
		db,
	}
}

// CreateOrder creates a new order in the database
func (or *OrderRepository) CreateOrder(ctx context.Context, order *domain.Order) (*domain.Order, error) {
	var product domain.Product
	var products []domain.OrderProduct
	var customerID sql.NullInt64

	orderQuery := or.db.QueryBuilder.Insert("orders").
		Columns("user_id", "payment_id", "customer_id", "customer_name", "total_price", "total_paid", "total_return").
		Values(
			order.UserID,
			order.PaymentID,
			nullableUint64(order.CustomerID),
			order.CustomerName,
			order.TotalPrice,
			order.TotalPaid,
			order.TotalReturn,
		).
		Suffix("RETURNING id, user_id, payment_id, customer_id, customer_name, total_price, total_paid, total_return, receipt_code, created_at, updated_at")

	err := pgx.BeginFunc(ctx, or.db, func(tx pgx.Tx) error {
		sql, args, err := orderQuery.ToSql()
		if err != nil {
			return err
		}

		err = tx.QueryRow(ctx, sql, args...).Scan(
			&order.ID,
			&order.UserID,
			&order.PaymentID,
			&customerID,
			&order.CustomerName,
			&order.TotalPrice,
			&order.TotalPaid,
			&order.TotalReturn,
			&order.ReceiptCode,
			&order.CreatedAt,
			&order.UpdatedAt,
		)
		if err != nil {
			return err
		}
		order.CustomerID = nullInt64ToUint64Ptr(customerID)

		for _, orderProduct := range order.Products {
			orderProductQuery := or.db.QueryBuilder.Insert("order_products").
				Columns("order_id", "product_id", "quantity", "total_price").
				Values(order.ID, orderProduct.ProductID, orderProduct.Quantity, orderProduct.TotalPrice).
				Suffix("RETURNING *")

			sql, args, err := orderProductQuery.ToSql()
			if err != nil {
				return err
			}

			err = tx.QueryRow(ctx, sql, args...).Scan(
				&orderProduct.ID,
				&orderProduct.OrderID,
				&orderProduct.ProductID,
				&orderProduct.Quantity,
				&orderProduct.TotalPrice,
				&orderProduct.CreatedAt,
				&orderProduct.UpdatedAt,
			)
			if err != nil {
				return err
			}

			products = append(products, orderProduct)

			productQuery := or.db.QueryBuilder.Update("products").
				Set("stock", sq.Expr("stock - ?", orderProduct.Quantity)).
				Set("updated_at", time.Now()).
				Where(sq.Eq{"id": orderProduct.ProductID}).
				Suffix("RETURNING stock")

			sql, args, err = productQuery.ToSql()
			if err != nil {
				return err
			}

			err = tx.QueryRow(ctx, sql, args...).Scan(
				&product.Stock,
			)
			if err != nil {
				return err
			}

			if product.Stock < 0 {
				return tx.Rollback(ctx)
			}
		}

		order.Products = products

		return nil
	})
	if err != nil {
		return nil, err
	}

	return order, err
}

// GetOrderByID gets an order by ID from the database
func (or *OrderRepository) GetOrderByID(ctx context.Context, id uint64) (*domain.Order, error) {
	var order domain.Order
	var orderProduct domain.OrderProduct
	var customerID sql.NullInt64

	orderQuery := or.db.QueryBuilder.Select(
		"id",
		"user_id",
		"payment_id",
		"customer_id",
		"customer_name",
		"total_price",
		"total_paid",
		"total_return",
		"receipt_code",
		"created_at",
		"updated_at",
	).
		From("orders").
		Where(sq.Eq{"id": id}).
		Limit(1)

	orderProductQuery := or.db.QueryBuilder.Select("*").
		From("order_products").
		Where(sq.Eq{"order_id": id})

	err := pgx.BeginFunc(ctx, or.db, func(tx pgx.Tx) error {

		sql, args, err := orderQuery.ToSql()
		if err != nil {
			return err
		}

		err = tx.QueryRow(ctx, sql, args...).Scan(
			&order.ID,
			&order.UserID,
			&order.PaymentID,
			&customerID,
			&order.CustomerName,
			&order.TotalPrice,
			&order.TotalPaid,
			&order.TotalReturn,
			&order.ReceiptCode,
			&order.CreatedAt,
			&order.UpdatedAt,
		)
		if err != nil {
			if err == pgx.ErrNoRows {
				return domain.ErrDataNotFound
			}
			return err
		}
		order.CustomerID = nullInt64ToUint64Ptr(customerID)

		sql, args, err = orderProductQuery.ToSql()
		if err != nil {
			return err
		}

		rows, err := tx.Query(ctx, sql, args...)
		if err != nil {
			return err
		}
		defer rows.Close()

		for rows.Next() {
			err = rows.Scan(
				&orderProduct.ID,
				&orderProduct.OrderID,
				&orderProduct.ProductID,
				&orderProduct.Quantity,
				&orderProduct.TotalPrice,
				&orderProduct.CreatedAt,
				&orderProduct.UpdatedAt,
			)
			if err != nil {
				return err
			}

			order.Products = append(order.Products, orderProduct)
		}

		if err := rows.Err(); err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return &order, nil
}

func applyOrderFilters(query sq.SelectBuilder, filter port.OrderListFilter) sq.SelectBuilder {
	if filter.Status != "" {
		switch strings.ToLower(filter.Status) {
		case "selesai", "completed", "paid":
			query = query.Where(sq.Expr("total_paid >= total_price"))
		case "menunggu", "pending", "unpaid":
			query = query.Where(sq.Expr("total_paid < total_price"))
		}
	}

	if filter.DateFrom != nil {
		query = query.Where(sq.GtOrEq{"created_at": *filter.DateFrom})
	}

	if filter.DateTo != nil {
		query = query.Where(sq.LtOrEq{"created_at": *filter.DateTo})
	}

	return query
}

// CountOrders counts orders from the database based on filters
func (or *OrderRepository) CountOrders(ctx context.Context, filter port.OrderListFilter) (uint64, error) {
	var total uint64

	countQuery := or.db.QueryBuilder.Select("COUNT(*)").
		From("orders")

	countQuery = applyOrderFilters(countQuery, filter)

	sql, args, err := countQuery.ToSql()
	if err != nil {
		return 0, err
	}

	err = or.db.QueryRow(ctx, sql, args...).Scan(&total)
	if err != nil {
		return 0, err
	}

	return total, nil
}

// ListOrders lists all orders from the database
func (or *OrderRepository) ListOrders(ctx context.Context, filter port.OrderListFilter, skip, limit uint64) ([]domain.Order, error) {
	var order domain.Order
	var orderProduct domain.OrderProduct
	var orders []domain.Order
	var customerID sql.NullInt64

	ordersQuery := or.db.QueryBuilder.Select(
		"id",
		"user_id",
		"payment_id",
		"customer_id",
		"customer_name",
		"total_price",
		"total_paid",
		"total_return",
		"receipt_code",
		"created_at",
		"updated_at",
	).
		From("orders").
		OrderBy("id").
		Limit(limit).
		Offset(skip)

	ordersQuery = applyOrderFilters(ordersQuery, filter)

	err := pgx.BeginFunc(ctx, or.db, func(tx pgx.Tx) error {
		sql, args, err := ordersQuery.ToSql()
		if err != nil {
			return err
		}

		rows, err := tx.Query(ctx, sql, args...)
		if err != nil {
			return err
		}
		defer rows.Close()

		for rows.Next() {
			err := rows.Scan(
				&order.ID,
				&order.UserID,
				&order.PaymentID,
				&customerID,
				&order.CustomerName,
				&order.TotalPrice,
				&order.TotalPaid,
				&order.TotalReturn,
				&order.ReceiptCode,
				&order.CreatedAt,
				&order.UpdatedAt,
			)
			if err != nil {
				return err
			}
			order.CustomerID = nullInt64ToUint64Ptr(customerID)

			orders = append(orders, order)
		}

		if err := rows.Err(); err != nil {
			return err
		}

		for i, order := range orders {
			orderProductQuery := or.db.QueryBuilder.Select("*").
				From("order_products").
				Where(sq.Eq{"order_id": order.ID})

			sql, args, err := orderProductQuery.ToSql()
			if err != nil {
				return err
			}

			err = func() error {
				rows, err := tx.Query(ctx, sql, args...)
				if err != nil {
					return err
				}
				defer rows.Close()

				for rows.Next() {
					err := rows.Scan(
						&orderProduct.ID,
						&orderProduct.OrderID,
						&orderProduct.ProductID,
						&orderProduct.Quantity,
						&orderProduct.TotalPrice,
						&orderProduct.CreatedAt,
						&orderProduct.UpdatedAt,
					)
					if err != nil {
						return err
					}

					orders[i].Products = append(orders[i].Products, orderProduct)
				}

				if err := rows.Err(); err != nil {
					return err
				}

				return nil
			}()
			if err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return orders, nil
}

func nullableUint64(value *uint64) any {
	if value == nil {
		return nil
	}
	return *value
}

func nullInt64ToUint64Ptr(value sql.NullInt64) *uint64 {
	if !value.Valid {
		return nil
	}
	parsed := uint64(value.Int64)
	return &parsed
}
