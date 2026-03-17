package domain

import "time"

// Customer represents a customer record
type Customer struct {
	ID        uint64
	Name      string
	Phone     string
	Email     string
	Tier      string
	Notes     string
	CreatedAt time.Time
	UpdatedAt time.Time
}

// CustomerSummary represents aggregated customer statistics from orders.
type CustomerSummary struct {
	Name        string
	TotalOrders uint64
	TotalSpent  float64
	LastOrderAt time.Time
}
