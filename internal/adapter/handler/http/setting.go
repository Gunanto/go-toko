package http

import (
	"errors"

	"github.com/bagashiz/go-pos/internal/core/domain"
	"github.com/bagashiz/go-pos/internal/core/port"
	"github.com/gin-gonic/gin"
)

// SettingHandler represents the HTTP handler for settings requests.
type SettingHandler struct {
	svc port.SettingService
}

// NewSettingHandler creates a new SettingHandler instance.
func NewSettingHandler(svc port.SettingService) *SettingHandler {
	return &SettingHandler{svc: svc}
}

type updateSettingsRequest struct {
	StoreName              string   `json:"store_name" binding:"required" example:"GEZY Commerce"`
	StoreAddress           string   `json:"store_address" binding:"required" example:"Jl. Merdeka No. 45, Bandung"`
	StoreContact           string   `json:"store_contact" binding:"required" example:"+62 812 3344 2211"`
	StorefrontBadge        string   `json:"storefront_badge" binding:"required" example:"Etalase Resmi GEZY Commerce"`
	StorefrontHeroTitle    string   `json:"storefront_hero_title" binding:"required" example:"Temukan produk pilihan dan nikmati pengalaman belanja yang cepat, praktis, dan nyaman."`
	StorefrontHeroBody     string   `json:"storefront_hero_body" binding:"required" example:"Selamat datang di etalase resmi kami, tempat produk pilihan siap Anda pesan tanpa ribet."`
	StorefrontFeatureTitle string   `json:"storefront_feature_title" binding:"required" example:"Belanja Lebih Mudah"`
	StorefrontFeatureItem1 string   `json:"storefront_feature_item_1" binding:"required" example:"Temukan produk favoritmu lewat pencarian atau kategori pilihan."`
	StorefrontFeatureItem2 string   `json:"storefront_feature_item_2" binding:"required" example:"Masukkan ke keranjang dalam beberapa klik dari etalase atau halaman detail."`
	StorefrontFeatureItem3 string   `json:"storefront_feature_item_3" binding:"required" example:"Selesaikan pembayaran dengan cepat lalu pantau status pesananmu dengan mudah."`
	TaxName                string   `json:"tax_name" binding:"required" example:"PPN"`
	TaxRate                *float64 `json:"tax_rate" binding:"min=0,max=100" example:"11"`
	ServiceFeeName         string   `json:"service_fee_name" binding:"required" example:"Biaya Layanan"`
	ServiceFeeRate         *float64 `json:"service_fee_rate" binding:"min=0,max=100" example:"2"`
	PurchaseDiscountName   string   `json:"purchase_discount_name" binding:"required" example:"Diskon Pembelian"`
	PurchaseDiscountRate   *float64 `json:"purchase_discount_rate" binding:"min=0,max=100" example:"5"`
}

// GetSettings godoc
//
//	@Summary		Get application settings
//	@Description	get current store and tax settings
//	@Tags			Settings
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	settingResponse	"Settings retrieved"
//	@Failure		401	{object}	errorResponse	"Unauthorized error"
//	@Failure		404	{object}	errorResponse	"Data not found error"
//	@Failure		500	{object}	errorResponse	"Internal server error"
//	@Router			/settings [get]
//	@Security		BearerAuth
func (sh *SettingHandler) GetSettings(ctx *gin.Context) {
	setting, err := sh.svc.GetSettings(ctx)
	if err != nil {
		handleError(ctx, err)
		return
	}

	handleSuccess(ctx, newSettingResponse(setting))
}

// UpdateSettings godoc
//
//	@Summary		Update application settings
//	@Description	update store and tax settings
//	@Tags			Settings
//	@Accept			json
//	@Produce		json
//	@Param			updateSettingsRequest	body		updateSettingsRequest	true	"Update settings request"
//	@Success		200					{object}	settingResponse			"Settings updated"
//	@Failure		400					{object}	errorResponse			"Validation error"
//	@Failure		401					{object}	errorResponse			"Unauthorized error"
//	@Failure		403					{object}	errorResponse			"Forbidden error"
//	@Failure		500					{object}	errorResponse			"Internal server error"
//	@Router			/settings [put]
//	@Security		BearerAuth
func (sh *SettingHandler) UpdateSettings(ctx *gin.Context) {
	var req updateSettingsRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		validationError(ctx, err)
		return
	}
	if req.TaxRate == nil {
		validationError(ctx, errors.New("tax_rate is required"))
		return
	}
	if req.ServiceFeeRate == nil {
		validationError(ctx, errors.New("service_fee_rate is required"))
		return
	}
	if req.PurchaseDiscountRate == nil {
		validationError(ctx, errors.New("purchase_discount_rate is required"))
		return
	}

	setting := domain.Setting{
		StoreName:              req.StoreName,
		StoreAddress:           req.StoreAddress,
		StoreContact:           req.StoreContact,
		StorefrontBadge:        req.StorefrontBadge,
		StorefrontHeroTitle:    req.StorefrontHeroTitle,
		StorefrontHeroBody:     req.StorefrontHeroBody,
		StorefrontFeatureTitle: req.StorefrontFeatureTitle,
		StorefrontFeatureItem1: req.StorefrontFeatureItem1,
		StorefrontFeatureItem2: req.StorefrontFeatureItem2,
		StorefrontFeatureItem3: req.StorefrontFeatureItem3,
		TaxName:                req.TaxName,
		TaxRate:                *req.TaxRate,
		ServiceFeeName:         req.ServiceFeeName,
		ServiceFeeRate:         *req.ServiceFeeRate,
		PurchaseDiscountName:   req.PurchaseDiscountName,
		PurchaseDiscountRate:   *req.PurchaseDiscountRate,
	}

	updated, err := sh.svc.UpdateSettings(ctx, &setting)
	if err != nil {
		handleError(ctx, err)
		return
	}

	handleSuccess(ctx, newSettingResponse(updated))
}
