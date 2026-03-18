package port

import (
	"context"
	"time"

	"github.com/bagashiz/go-pos/internal/core/domain"
)

// OrderListFilter represents available filters for listing orders
type OrderListFilter struct {
	Status     string
	Channel    string
	CustomerID *uint64
	DateFrom   *time.Time
	DateTo     *time.Time
}

//go:generate mockgen -source=order.go -destination=mock/order.go -package=mock

// OrderRepository is an interface for interacting with order-related data
type OrderRepository interface {
	// CreateOrder inserts a new order into the database
	CreateOrder(ctx context.Context, order *domain.Order) (*domain.Order, error)
	// UpdateOrderPayment updates payment amounts and status for an order
	UpdateOrderPayment(ctx context.Context, order *domain.Order) (*domain.Order, error)
	// GetOrderByID selects an order by id
	GetOrderByID(ctx context.Context, id uint64) (*domain.Order, error)
	// GetOrderByReceiptCode selects an order by receipt code
	GetOrderByReceiptCode(ctx context.Context, receiptCode string) (*domain.Order, error)
	// ListOrders selects a list of orders with pagination
	ListOrders(ctx context.Context, filter OrderListFilter, skip, limit uint64) ([]domain.Order, error)
	// CountOrders returns total orders matching the filter
	CountOrders(ctx context.Context, filter OrderListFilter) (uint64, error)
}

// OrderService is an interface for interacting with order-related business logic
type OrderService interface {
	// CreateOrder creates a new order
	CreateOrder(ctx context.Context, order *domain.Order) (*domain.Order, error)
	// CreateStoreOrder creates a public storefront order
	CreateStoreOrder(ctx context.Context, order *domain.Order) (*domain.Order, error)
	// PayOrder marks a pending order as paid
	PayOrder(ctx context.Context, id uint64, totalPaid float64) (*domain.Order, error)
	// GetOrder returns an order by id
	GetOrder(ctx context.Context, id uint64) (*domain.Order, error)
	// GetStoreOrderByReceiptCode returns a storefront order by receipt code
	GetStoreOrderByReceiptCode(ctx context.Context, receiptCode string) (*domain.Order, error)
	// ListOrders returns a list of orders with pagination
	ListOrders(ctx context.Context, filter OrderListFilter, skip, limit uint64) ([]domain.Order, uint64, error)
	// ListStoreOrdersByCustomer returns storefront orders for a customer identified by phone/email
	ListStoreOrdersByCustomer(ctx context.Context, phone, email string, skip, limit uint64) ([]domain.Order, uint64, error)
}
