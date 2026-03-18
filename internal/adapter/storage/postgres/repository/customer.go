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

const customerColumns = "id, name, phone, email, address, tier, notes, password, google_id, avatar_url, auth_provider, last_login_at, created_at, updated_at"

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
	var address sql.NullString
	var notes sql.NullString
	var password sql.NullString
	var googleID sql.NullString
	var avatarURL sql.NullString
	var lastLoginAt sql.NullTime
	authProvider := customer.AuthProvider
	if authProvider == "" {
		authProvider = "guest"
	}

	query := cr.db.QueryBuilder.Insert("customers").
		Columns("name", "phone", "email", "address", "tier", "notes", "password", "google_id", "avatar_url", "auth_provider", "last_login_at").
		Values(customer.Name, nullIfEmpty(customer.Phone), nullIfEmpty(customer.Email), nullIfEmpty(customer.Address), customer.Tier, nullIfEmpty(customer.Notes), nullIfEmpty(customer.Password), nullIfEmpty(customer.GoogleID), nullIfEmpty(customer.AvatarURL), authProvider, customer.LastLoginAt).
		Suffix("RETURNING " + customerColumns)

	sql, args, err := query.ToSql()
	if err != nil {
		return nil, err
	}

	err = cr.db.QueryRow(ctx, sql, args...).Scan(
		&customer.ID,
		&customer.Name,
		&phone,
		&email,
		&address,
		&customer.Tier,
		&notes,
		&password,
		&googleID,
		&avatarURL,
		&customer.AuthProvider,
		&lastLoginAt,
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
	customer.Address = address.String
	customer.Notes = notes.String
	customer.Password = password.String
	customer.GoogleID = googleID.String
	customer.AvatarURL = avatarURL.String
	customer.LastLoginAt = nullTimePtr(lastLoginAt)

	return customer, nil
}

// GetCustomerByID retrieves a customer record by id
func (cr *CustomerRepository) GetCustomerByID(ctx context.Context, id uint64) (*domain.Customer, error) {
	var customer domain.Customer
	var phone sql.NullString
	var email sql.NullString
	var address sql.NullString
	var notes sql.NullString
	var password sql.NullString
	var googleID sql.NullString
	var avatarURL sql.NullString
	var lastLoginAt sql.NullTime

	query := cr.db.QueryBuilder.Select(customerColumns).
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
		&address,
		&customer.Tier,
		&notes,
		&password,
		&googleID,
		&avatarURL,
		&customer.AuthProvider,
		&lastLoginAt,
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
	customer.Address = address.String
	customer.Notes = notes.String
	customer.Password = password.String
	customer.GoogleID = googleID.String
	customer.AvatarURL = avatarURL.String
	customer.LastLoginAt = nullTimePtr(lastLoginAt)

	return &customer, nil
}

// GetCustomerByPhone retrieves a customer record by phone.
func (cr *CustomerRepository) GetCustomerByPhone(ctx context.Context, phone string) (*domain.Customer, error) {
	return cr.getCustomerByField(ctx, "phone", phone)
}

// GetCustomerByEmail retrieves a customer record by email.
func (cr *CustomerRepository) GetCustomerByEmail(ctx context.Context, email string) (*domain.Customer, error) {
	return cr.getCustomerByField(ctx, "email", email)
}

// ListCustomers retrieves a list of customers from the database
func (cr *CustomerRepository) ListCustomers(ctx context.Context, skip, limit uint64) ([]domain.Customer, error) {
	var customer domain.Customer
	var customers []domain.Customer
	var phone sql.NullString
	var email sql.NullString
	var address sql.NullString
	var notes sql.NullString
	var password sql.NullString
	var googleID sql.NullString
	var avatarURL sql.NullString
	var lastLoginAt sql.NullTime

	query := cr.db.QueryBuilder.Select(customerColumns).
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
			&address,
			&customer.Tier,
			&notes,
			&password,
			&googleID,
			&avatarURL,
			&customer.AuthProvider,
			&lastLoginAt,
			&customer.CreatedAt,
			&customer.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		customer.Phone = phone.String
		customer.Email = email.String
		customer.Address = address.String
		customer.Notes = notes.String
		customer.Password = password.String
		customer.GoogleID = googleID.String
		customer.AvatarURL = avatarURL.String
		customer.LastLoginAt = nullTimePtr(lastLoginAt)

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
	var address sql.NullString
	var notes sql.NullString
	var password sql.NullString
	var googleID sql.NullString
	var avatarURL sql.NullString
	var lastLoginAt sql.NullTime

	query := cr.db.QueryBuilder.Update("customers").
		Set("name", customer.Name).
		Set("phone", nullIfEmpty(customer.Phone)).
		Set("email", nullIfEmpty(customer.Email)).
		Set("address", nullIfEmpty(customer.Address)).
		Set("tier", customer.Tier).
		Set("notes", nullIfEmpty(customer.Notes)).
		Set("updated_at", time.Now()).
		Where(sq.Eq{"id": customer.ID}).
		Suffix("RETURNING " + customerColumns)

	if customer.Password != "" {
		query = query.Set("password", customer.Password)
	}
	if customer.GoogleID != "" {
		query = query.Set("google_id", customer.GoogleID)
	}
	if customer.AvatarURL != "" {
		query = query.Set("avatar_url", customer.AvatarURL)
	}
	if customer.AuthProvider != "" {
		query = query.Set("auth_provider", customer.AuthProvider)
	}
	if customer.LastLoginAt != nil {
		query = query.Set("last_login_at", customer.LastLoginAt)
	}

	sql, args, err := query.ToSql()
	if err != nil {
		return nil, err
	}

	err = cr.db.QueryRow(ctx, sql, args...).Scan(
		&customer.ID,
		&customer.Name,
		&phone,
		&email,
		&address,
		&customer.Tier,
		&notes,
		&password,
		&googleID,
		&avatarURL,
		&customer.AuthProvider,
		&lastLoginAt,
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
	customer.Address = address.String
	customer.Notes = notes.String
	customer.Password = password.String
	customer.GoogleID = googleID.String
	customer.AvatarURL = avatarURL.String
	customer.LastLoginAt = nullTimePtr(lastLoginAt)

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

func (cr *CustomerRepository) getCustomerByField(ctx context.Context, field, value string) (*domain.Customer, error) {
	var customer domain.Customer
	var phone sql.NullString
	var email sql.NullString
	var address sql.NullString
	var notes sql.NullString
	var password sql.NullString
	var googleID sql.NullString
	var avatarURL sql.NullString
	var lastLoginAt sql.NullTime

	query := cr.db.QueryBuilder.Select(customerColumns).
		From("customers").
		Where(sq.Eq{field: value}).
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
		&address,
		&customer.Tier,
		&notes,
		&password,
		&googleID,
		&avatarURL,
		&customer.AuthProvider,
		&lastLoginAt,
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
	customer.Address = address.String
	customer.Notes = notes.String
	customer.Password = password.String
	customer.GoogleID = googleID.String
	customer.AvatarURL = avatarURL.String
	customer.LastLoginAt = nullTimePtr(lastLoginAt)

	return &customer, nil
}

func nullTimePtr(value sql.NullTime) *time.Time {
	if !value.Valid {
		return nil
	}
	parsed := value.Time
	return &parsed
}
