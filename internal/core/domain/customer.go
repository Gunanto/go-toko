package domain

import "time"

// Customer represents a customer record
type Customer struct {
	ID           uint64
	Name         string
	Phone        string
	Email        string
	Address      string
	Tier         string
	Notes        string
	Password     string
	GoogleID     string
	AvatarURL    string
	AuthProvider string
	LastLoginAt  *time.Time
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

// CustomerSummary represents aggregated customer statistics from orders.
type CustomerSummary struct {
	Name        string
	TotalOrders uint64
	TotalSpent  float64
	LastOrderAt time.Time
}
