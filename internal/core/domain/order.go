package domain

import (
	"time"

	"github.com/google/uuid"
)

type OrderStatus string

const (
	OrderStatusPending OrderStatus = "pending"
	OrderStatusPaid    OrderStatus = "paid"
)

type OrderChannel string

const (
	OrderChannelStorefront OrderChannel = "storefront"
	OrderChannelPOS        OrderChannel = "pos"
	OrderChannelManual     OrderChannel = "manual"
)

// Order is an entity that represents an order
type Order struct {
	ID              uint64
	UserID          uint64
	PaymentID       uint64
	CustomerID      *uint64
	CustomerName    string
	CustomerPhone   string
	CustomerEmail   string
	ShippingAddress string
	CustomerNote    string
	SpecialDiscount float64
	TotalPrice      float64
	TotalPaid       float64
	TotalReturn     float64
	Status          OrderStatus
	Channel         OrderChannel
	ReceiptCode     uuid.UUID
	CreatedAt       time.Time
	UpdatedAt       time.Time
	User            *User
	Payment         *Payment
	Products        []OrderProduct
}
