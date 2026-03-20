package domain

import "time"

// Setting represents global store and tax settings.
type Setting struct {
	ID                     uint64
	StoreName              string
	StoreAddress           string
	StoreContact           string
	StorefrontBadge        string
	StorefrontHeroTitle    string
	StorefrontHeroBody     string
	StorefrontFeatureTitle string
	StorefrontFeatureItem1 string
	StorefrontFeatureItem2 string
	StorefrontFeatureItem3 string
	TaxName                string
	TaxRate                float64
	ServiceFeeName         string
	ServiceFeeRate         float64
	PurchaseDiscountName   string
	PurchaseDiscountRate   float64
	CreatedAt              time.Time
	UpdatedAt              time.Time
}
