package service

import (
	"context"
	"strings"

	"github.com/bagashiz/go-pos/internal/core/domain"
	"github.com/bagashiz/go-pos/internal/core/port"
	"github.com/bagashiz/go-pos/internal/core/util"
)

// CustomerService implements port.CustomerService
type CustomerService struct {
	repo  port.CustomerRepository
	cache port.CacheRepository
}

// NewCustomerService creates a new customer service instance
func NewCustomerService(repo port.CustomerRepository, cache port.CacheRepository) *CustomerService {
	return &CustomerService{
		repo:  repo,
		cache: cache,
	}
}

// CreateCustomer creates a new customer
func (cs *CustomerService) CreateCustomer(ctx context.Context, customer *domain.Customer) (*domain.Customer, error) {
	created, err := cs.repo.CreateCustomer(ctx, customer)
	if err != nil {
		return nil, err
	}

	if err := cs.cache.DeleteByPrefix(ctx, "customers:*"); err != nil {
		return nil, domain.ErrInternal
	}

	return created, nil
}

// GetCustomer returns a customer by id
func (cs *CustomerService) GetCustomer(ctx context.Context, id uint64) (*domain.Customer, error) {
	params := util.GenerateCacheKeyParams(id)
	cacheKey := util.GenerateCacheKey("customer", params)

	cachedCustomer, err := cs.cache.Get(ctx, cacheKey)
	if err == nil {
		var customer domain.Customer
		if err := util.Deserialize(cachedCustomer, &customer); err != nil {
			return nil, domain.ErrInternal
		}
		return &customer, nil
	}

	customer, err := cs.repo.GetCustomerByID(ctx, id)
	if err != nil {
		return nil, err
	}

	serialized, err := util.Serialize(customer)
	if err != nil {
		return nil, domain.ErrInternal
	}
	if err := cs.cache.Set(ctx, cacheKey, serialized, 0); err != nil {
		return nil, domain.ErrInternal
	}

	return customer, nil
}

// FindCustomer returns a customer by phone first, then email.
func (cs *CustomerService) FindCustomer(ctx context.Context, phone, email string) (*domain.Customer, error) {
	phone = strings.TrimSpace(phone)
	email = strings.TrimSpace(email)

	if phone != "" {
		customer, err := cs.repo.GetCustomerByPhone(ctx, phone)
		if err == nil {
			return customer, nil
		}
		if err != domain.ErrDataNotFound {
			return nil, domain.ErrInternal
		}
	}

	if email != "" {
		customer, err := cs.repo.GetCustomerByEmail(ctx, email)
		if err == nil {
			return customer, nil
		}
		if err != domain.ErrDataNotFound {
			return nil, domain.ErrInternal
		}
	}

	return nil, domain.ErrDataNotFound
}

// ListCustomers returns customers with pagination
func (cs *CustomerService) ListCustomers(ctx context.Context, skip, limit uint64) ([]domain.Customer, uint64, error) {
	var customers []domain.Customer

	params := util.GenerateCacheKeyParams(skip, limit)
	cacheKey := util.GenerateCacheKey("customers", params)

	cachedCustomers, err := cs.cache.Get(ctx, cacheKey)
	if err == nil {
		if err := util.Deserialize(cachedCustomers, &customers); err != nil {
			return nil, 0, domain.ErrInternal
		}
	}

	total, err := cs.repo.CountCustomers(ctx)
	if err != nil {
		return nil, 0, domain.ErrInternal
	}

	if len(customers) == 0 {
		customers, err = cs.repo.ListCustomers(ctx, skip, limit)
		if err != nil {
			return nil, 0, domain.ErrInternal
		}

		customersSerialized, err := util.Serialize(customers)
		if err != nil {
			return nil, 0, domain.ErrInternal
		}

		if err := cs.cache.Set(ctx, cacheKey, customersSerialized, 0); err != nil {
			return nil, 0, domain.ErrInternal
		}
	}

	return customers, total, nil
}

// UpdateCustomer updates a customer
func (cs *CustomerService) UpdateCustomer(ctx context.Context, customer *domain.Customer) (*domain.Customer, error) {
	updated, err := cs.repo.UpdateCustomer(ctx, customer)
	if err != nil {
		return nil, err
	}

	cacheKey := util.GenerateCacheKey("customer", customer.ID)
	if err := cs.cache.Delete(ctx, cacheKey); err != nil {
		return nil, domain.ErrInternal
	}
	if err := cs.cache.DeleteByPrefix(ctx, "customers:*"); err != nil {
		return nil, domain.ErrInternal
	}

	return updated, nil
}

// DeleteCustomer deletes a customer by id
func (cs *CustomerService) DeleteCustomer(ctx context.Context, id uint64) error {
	if err := cs.repo.DeleteCustomer(ctx, id); err != nil {
		return err
	}

	cacheKey := util.GenerateCacheKey("customer", id)
	if err := cs.cache.Delete(ctx, cacheKey); err != nil {
		return domain.ErrInternal
	}
	if err := cs.cache.DeleteByPrefix(ctx, "customers:*"); err != nil {
		return domain.ErrInternal
	}

	return nil
}
