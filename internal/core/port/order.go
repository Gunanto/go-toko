package port

import (
	"context"
	"time"

	"github.com/bagashiz/go-pos/internal/core/domain"
)

// OrderListFilter represents available filters for listing orders
type OrderListFilter struct {
	Status   string
	DateFrom *time.Time
	DateTo   *time.Time
}

//go:generate mockgen -source=order.go -destination=mock/order.go -package=mock

// OrderRepository is an interface for interacting with order-related data
type OrderRepository interface {
	// CreateOrder inserts a new order into the database
	CreateOrder(ctx context.Context, order *domain.Order) (*domain.Order, error)
	// GetOrderByID selects an order by id
	GetOrderByID(ctx context.Context, id uint64) (*domain.Order, error)
	// ListOrders selects a list of orders with pagination
	ListOrders(ctx context.Context, filter OrderListFilter, skip, limit uint64) ([]domain.Order, error)
	// CountOrders returns total orders matching the filter
	CountOrders(ctx context.Context, filter OrderListFilter) (uint64, error)
}

// OrderService is an interface for interacting with order-related business logic
type OrderService interface {
	// CreateOrder creates a new order
	CreateOrder(ctx context.Context, order *domain.Order) (*domain.Order, error)
	// GetOrder returns an order by id
	GetOrder(ctx context.Context, id uint64) (*domain.Order, error)
	// ListOrders returns a list of orders with pagination
	ListOrders(ctx context.Context, filter OrderListFilter, skip, limit uint64) ([]domain.Order, uint64, error)
}
