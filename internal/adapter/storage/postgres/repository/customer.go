package repository

import (
	"context"
	"database/sql"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/bagashiz/go-pos/internal/adapter/storage/postgres"
	"github.com/bagashiz/go-pos/internal/core/domain"
	"github.com/jackc/pgx/v5"
)

// CustomerRepository implements port.CustomerRepository interface
type CustomerRepository struct {
	db *postgres.DB
}

// NewCustomerRepository creates a new customer repository instance
func NewCustomerRepository(db *postgres.DB) *CustomerRepository {
	return &CustomerRepository{db: db}
}

// CreateCustomer creates a new customer record in the database
func (cr *CustomerRepository) CreateCustomer(ctx context.Context, customer *domain.Customer) (*domain.Customer, error) {
	var phone sql.NullString
	var email sql.NullString
	var notes sql.NullString

	query := cr.db.QueryBuilder.Insert("customers").
		Columns("name", "phone", "email", "tier", "notes").
		Values(customer.Name, nullIfEmpty(customer.Phone), nullIfEmpty(customer.Email), customer.Tier, nullIfEmpty(customer.Notes)).
		Suffix("RETURNING *")

	sql, args, err := query.ToSql()
	if err != nil {
		return nil, err
	}

	err = cr.db.QueryRow(ctx, sql, args...).Scan(
		&customer.ID,
		&customer.Name,
		&phone,
		&email,
		&customer.Tier,
		&notes,
		&customer.CreatedAt,
		&customer.UpdatedAt,
	)
	if err != nil {
		if errCode := cr.db.ErrorCode(err); errCode == "23505" {
			return nil, domain.ErrConflictingData
		}
		return nil, err
	}

	customer.Phone = phone.String
	customer.Email = email.String
	customer.Notes = notes.String

	return customer, nil
}

// GetCustomerByID retrieves a customer record by id
func (cr *CustomerRepository) GetCustomerByID(ctx context.Context, id uint64) (*domain.Customer, error) {
	var customer domain.Customer
	var phone sql.NullString
	var email sql.NullString
	var notes sql.NullString

	query := cr.db.QueryBuilder.Select("*").
		From("customers").
		Where(sq.Eq{"id": id}).
		Limit(1)

	sql, args, err := query.ToSql()
	if err != nil {
		return nil, err
	}

	err = cr.db.QueryRow(ctx, sql, args...).Scan(
		&customer.ID,
		&customer.Name,
		&phone,
		&email,
		&customer.Tier,
		&notes,
		&customer.CreatedAt,
		&customer.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, domain.ErrDataNotFound
		}
		return nil, err
	}

	customer.Phone = phone.String
	customer.Email = email.String
	customer.Notes = notes.String

	return &customer, nil
}

// ListCustomers retrieves a list of customers from the database
func (cr *CustomerRepository) ListCustomers(ctx context.Context, skip, limit uint64) ([]domain.Customer, error) {
	var customer domain.Customer
	var customers []domain.Customer
	var phone sql.NullString
	var email sql.NullString
	var notes sql.NullString

	query := cr.db.QueryBuilder.Select("*").
		From("customers").
		OrderBy("id").
		Limit(limit).
		Offset(skip)

	sql, args, err := query.ToSql()
	if err != nil {
		return nil, err
	}

	rows, err := cr.db.Query(ctx, sql, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		err := rows.Scan(
			&customer.ID,
			&customer.Name,
			&phone,
			&email,
			&customer.Tier,
			&notes,
			&customer.CreatedAt,
			&customer.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		customer.Phone = phone.String
		customer.Email = email.String
		customer.Notes = notes.String

		customers = append(customers, customer)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return customers, nil
}

// UpdateCustomer updates a customer record in the database
func (cr *CustomerRepository) UpdateCustomer(ctx context.Context, customer *domain.Customer) (*domain.Customer, error) {
	var phone sql.NullString
	var email sql.NullString
	var notes sql.NullString

	query := cr.db.QueryBuilder.Update("customers").
		Set("name", customer.Name).
		Set("phone", nullIfEmpty(customer.Phone)).
		Set("email", nullIfEmpty(customer.Email)).
		Set("tier", customer.Tier).
		Set("notes", nullIfEmpty(customer.Notes)).
		Set("updated_at", time.Now()).
		Where(sq.Eq{"id": customer.ID}).
		Suffix("RETURNING *")

	sql, args, err := query.ToSql()
	if err != nil {
		return nil, err
	}

	err = cr.db.QueryRow(ctx, sql, args...).Scan(
		&customer.ID,
		&customer.Name,
		&phone,
		&email,
		&customer.Tier,
		&notes,
		&customer.CreatedAt,
		&customer.UpdatedAt,
	)
	if err != nil {
		if errCode := cr.db.ErrorCode(err); errCode == "23505" {
			return nil, domain.ErrConflictingData
		}
		return nil, err
	}

	customer.Phone = phone.String
	customer.Email = email.String
	customer.Notes = notes.String

	return customer, nil
}

// DeleteCustomer deletes a customer record from the database by id
func (cr *CustomerRepository) DeleteCustomer(ctx context.Context, id uint64) error {
	query := cr.db.QueryBuilder.Delete("customers").
		Where(sq.Eq{"id": id})

	sql, args, err := query.ToSql()
	if err != nil {
		return err
	}

	_, err = cr.db.Exec(ctx, sql, args...)
	return err
}

// CountCustomers returns total customers
func (cr *CustomerRepository) CountCustomers(ctx context.Context) (uint64, error) {
	var total uint64
	query := cr.db.QueryBuilder.Select("COUNT(*)").From("customers")
	sql, args, err := query.ToSql()
	if err != nil {
		return 0, err
	}
	err = cr.db.QueryRow(ctx, sql, args...).Scan(&total)
	if err != nil {
		return 0, err
	}
	return total, nil
}

func nullIfEmpty(value string) any {
	if value == "" {
		return nil
	}
	return value
}
