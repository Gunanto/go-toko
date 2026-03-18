package domain

import (
	"time"

	"github.com/google/uuid"
)

// Product is an entity that represents a product
type Product struct {
	ID            uint64
	CategoryID    uint64
	SKU           uuid.UUID
	Name          string
	Slug          string
	Description   string
	Stock         int64
	Price         float64
	Cost          float64
	Image         string
	GalleryImages []string
	Status        string
	PromoLabel    string
	CreatedAt     time.Time
	UpdatedAt     time.Time
	Category      *Category
}
