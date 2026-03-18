package repository

import (
	"context"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/bagashiz/go-pos/internal/adapter/storage/postgres"
	"github.com/bagashiz/go-pos/internal/core/domain"
	"github.com/jackc/pgx/v5"
)

// SettingRepository implements port.SettingRepository.
type SettingRepository struct {
	db *postgres.DB
}

// NewSettingRepository creates a new setting repository instance.
func NewSettingRepository(db *postgres.DB) *SettingRepository {
	return &SettingRepository{db: db}
}

// GetSettings returns the global settings row.
func (sr *SettingRepository) GetSettings(ctx context.Context) (*domain.Setting, error) {
	var setting domain.Setting

	query := sr.db.QueryBuilder.Select(
		"id",
		"store_name",
		"store_address",
		"store_contact",
		"tax_name",
		"tax_rate",
		"service_fee_name",
		"service_fee_rate",
		"created_at",
		"updated_at",
	).From("settings").Where(sq.Eq{"id": 1}).Limit(1)

	sql, args, err := query.ToSql()
	if err != nil {
		return nil, err
	}

	err = sr.db.QueryRow(ctx, sql, args...).Scan(
		&setting.ID,
		&setting.StoreName,
		&setting.StoreAddress,
		&setting.StoreContact,
		&setting.TaxName,
		&setting.TaxRate,
		&setting.ServiceFeeName,
		&setting.ServiceFeeRate,
		&setting.CreatedAt,
		&setting.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, domain.ErrDataNotFound
		}
		return nil, err
	}

	return &setting, nil
}

// UpsertSettings updates or inserts the global settings row.
func (sr *SettingRepository) UpsertSettings(ctx context.Context, setting *domain.Setting) (*domain.Setting, error) {
	now := time.Now()
	query := sr.db.QueryBuilder.Insert("settings").
		Columns(
			"id",
			"store_name",
			"store_address",
			"store_contact",
			"tax_name",
			"tax_rate",
			"service_fee_name",
			"service_fee_rate",
			"updated_at",
		).
		Values(
			1,
			setting.StoreName,
			setting.StoreAddress,
			setting.StoreContact,
			setting.TaxName,
			setting.TaxRate,
			setting.ServiceFeeName,
			setting.ServiceFeeRate,
			now,
		).
		Suffix(`
			ON CONFLICT (id) DO UPDATE SET
				store_name = EXCLUDED.store_name,
				store_address = EXCLUDED.store_address,
				store_contact = EXCLUDED.store_contact,
				tax_name = EXCLUDED.tax_name,
				tax_rate = EXCLUDED.tax_rate,
				service_fee_name = EXCLUDED.service_fee_name,
				service_fee_rate = EXCLUDED.service_fee_rate,
				updated_at = EXCLUDED.updated_at
			RETURNING id, store_name, store_address, store_contact, tax_name, tax_rate, service_fee_name, service_fee_rate, created_at, updated_at
		`)

	sql, args, err := query.ToSql()
	if err != nil {
		return nil, err
	}

	err = sr.db.QueryRow(ctx, sql, args...).Scan(
		&setting.ID,
		&setting.StoreName,
		&setting.StoreAddress,
		&setting.StoreContact,
		&setting.TaxName,
		&setting.TaxRate,
		&setting.ServiceFeeName,
		&setting.ServiceFeeRate,
		&setting.CreatedAt,
		&setting.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return setting, nil
}
