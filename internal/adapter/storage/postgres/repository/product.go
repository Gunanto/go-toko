package repository

import (
	"context"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/bagashiz/go-pos/internal/adapter/storage/postgres"
	"github.com/bagashiz/go-pos/internal/core/domain"
	"github.com/jackc/pgx/v5"
)

/**
 * ProductRepository implements port.ProductRepository interface
 * and provides an access to the postgres database
 */
type ProductRepository struct {
	db *postgres.DB
}

// NewProductRepository creates a new product repository instance
func NewProductRepository(db *postgres.DB) *ProductRepository {
	return &ProductRepository{
		db,
	}
}

// CreateProduct creates a new product record in the database
func (pr *ProductRepository) CreateProduct(ctx context.Context, product *domain.Product) (*domain.Product, error) {
	query := pr.db.QueryBuilder.Insert("products").
		Columns("category_id", "name", "image", "price", "cost", "stock").
		Values(product.CategoryID, product.Name, product.Image, product.Price, product.Cost, product.Stock).
		Suffix("RETURNING id, category_id, sku, name, stock, price, cost, image, created_at, updated_at")

	sql, args, err := query.ToSql()
	if err != nil {
		return nil, err
	}

	err = pr.db.QueryRow(ctx, sql, args...).Scan(
		&product.ID,
		&product.CategoryID,
		&product.SKU,
		&product.Name,
		&product.Stock,
		&product.Price,
		&product.Cost,
		&product.Image,
		&product.CreatedAt,
		&product.UpdatedAt,
	)
	if err != nil {
		if errCode := pr.db.ErrorCode(err); errCode == "23505" {
			return nil, domain.ErrConflictingData
		}
		return nil, err
	}

	return product, nil
}

// GetProductByID retrieves a product record from the database by id
func (pr *ProductRepository) GetProductByID(ctx context.Context, id uint64) (*domain.Product, error) {
	var product domain.Product

	query := pr.db.QueryBuilder.Select(
		"id",
		"category_id",
		"sku",
		"name",
		"stock",
		"price",
		"cost",
		"image",
		"created_at",
		"updated_at",
	).
		From("products").
		Where(sq.Eq{"id": id}).
		Limit(1)

	sql, args, err := query.ToSql()
	if err != nil {
		return nil, err
	}

	err = pr.db.QueryRow(ctx, sql, args...).Scan(
		&product.ID,
		&product.CategoryID,
		&product.SKU,
		&product.Name,
		&product.Stock,
		&product.Price,
		&product.Cost,
		&product.Image,
		&product.CreatedAt,
		&product.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, domain.ErrDataNotFound
		}
		return nil, err
	}

	return &product, nil
}

// ListProducts retrieves a list of products from the database
func (pr *ProductRepository) ListProducts(ctx context.Context, search string, categoryId, skip, limit uint64) ([]domain.Product, error) {
	var product domain.Product
	var products []domain.Product

	query := pr.db.QueryBuilder.Select(
		"id",
		"category_id",
		"sku",
		"name",
		"stock",
		"price",
		"cost",
		"image",
		"created_at",
		"updated_at",
	).
		From("products").
		OrderBy("id").
		Limit(limit).
		Offset(skip)

	if categoryId != 0 {
		query = query.Where(sq.Eq{"category_id": categoryId})
	}

	if search != "" {
		query = query.Where(sq.ILike{"name": "%" + search + "%"})
	}

	sql, args, err := query.ToSql()
	if err != nil {
		return nil, err
	}

	rows, err := pr.db.Query(ctx, sql, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		err := rows.Scan(
			&product.ID,
			&product.CategoryID,
			&product.SKU,
			&product.Name,
			&product.Stock,
			&product.Price,
			&product.Cost,
			&product.Image,
			&product.CreatedAt,
			&product.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		products = append(products, product)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return products, nil
}

// UpdateProduct updates a product record in the database
func (pr *ProductRepository) UpdateProduct(ctx context.Context, product *domain.Product) (*domain.Product, error) {
	categoryId := nullUint64(product.CategoryID)
	name := nullString(product.Name)
	image := nullString(product.Image)
	price := nullFloat64(product.Price)
	cost := nullFloat64(product.Cost)
	stock := nullInt64(product.Stock)

	query := pr.db.QueryBuilder.Update("products").
		Set("name", sq.Expr("COALESCE(?, name)", name)).
		Set("category_id", sq.Expr("COALESCE(?, category_id)", categoryId)).
		Set("image", sq.Expr("COALESCE(?, image)", image)).
		Set("price", sq.Expr("COALESCE(?, price)", price)).
		Set("cost", sq.Expr("COALESCE(?, cost)", cost)).
		Set("stock", sq.Expr("COALESCE(?, stock)", stock)).
		Set("updated_at", time.Now()).
		Where(sq.Eq{"id": product.ID}).
		Suffix("RETURNING id, category_id, sku, name, stock, price, cost, image, created_at, updated_at")

	sql, args, err := query.ToSql()
	if err != nil {
		return nil, err
	}

	err = pr.db.QueryRow(ctx, sql, args...).Scan(
		&product.ID,
		&product.CategoryID,
		&product.SKU,
		&product.Name,
		&product.Stock,
		&product.Price,
		&product.Cost,
		&product.Image,
		&product.CreatedAt,
		&product.UpdatedAt,
	)
	if err != nil {
		if errCode := pr.db.ErrorCode(err); errCode == "23505" {
			return nil, domain.ErrConflictingData
		}
		return nil, err
	}

	return product, nil
}

// DeleteProduct deletes a product record from the database by id
func (pr *ProductRepository) DeleteProduct(ctx context.Context, id uint64) error {
	query := pr.db.QueryBuilder.Delete("products").
		Where(sq.Eq{"id": id})

	sql, args, err := query.ToSql()
	if err != nil {
		return err
	}

	_, err = pr.db.Exec(ctx, sql, args...)
	if err != nil {
		return err
	}

	return nil
}
