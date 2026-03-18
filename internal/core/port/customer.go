package port

import (
	"context"

	"github.com/bagashiz/go-pos/internal/core/domain"
)

// CustomerRepository is an interface for interacting with customer data
type CustomerRepository interface {
	// CreateCustomer inserts a new customer
	CreateCustomer(ctx context.Context, customer *domain.Customer) (*domain.Customer, error)
	// GetCustomerByID selects a customer by id
	GetCustomerByID(ctx context.Context, id uint64) (*domain.Customer, error)
	// GetCustomerByPhone selects a customer by phone
	GetCustomerByPhone(ctx context.Context, phone string) (*domain.Customer, error)
	// GetCustomerByEmail selects a customer by email
	GetCustomerByEmail(ctx context.Context, email string) (*domain.Customer, error)
	// ListCustomers selects a list of customers with pagination
	ListCustomers(ctx context.Context, skip, limit uint64) ([]domain.Customer, error)
	// UpdateCustomer updates a customer
	UpdateCustomer(ctx context.Context, customer *domain.Customer) (*domain.Customer, error)
	// DeleteCustomer deletes a customer by id
	DeleteCustomer(ctx context.Context, id uint64) error
	// CountCustomers returns total customers
	CountCustomers(ctx context.Context) (uint64, error)
}

// CustomerService is an interface for interacting with customer data
type CustomerService interface {
	// CreateCustomer creates a new customer
	CreateCustomer(ctx context.Context, customer *domain.Customer) (*domain.Customer, error)
	// GetCustomer returns a customer by id
	GetCustomer(ctx context.Context, id uint64) (*domain.Customer, error)
	// FindCustomer returns a customer by phone or email
	FindCustomer(ctx context.Context, phone, email string) (*domain.Customer, error)
	// ListCustomers returns a list of customers with pagination
	ListCustomers(ctx context.Context, skip, limit uint64) ([]domain.Customer, uint64, error)
	// UpdateCustomer updates a customer
	UpdateCustomer(ctx context.Context, customer *domain.Customer) (*domain.Customer, error)
	// DeleteCustomer deletes a customer by id
	DeleteCustomer(ctx context.Context, id uint64) error
}
