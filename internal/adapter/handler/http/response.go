package http

import (
	"errors"
	"log/slog"
	"net/http"
	"time"

	"github.com/bagashiz/go-pos/internal/core/domain"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

// response represents a response body format
type response struct {
	Success bool   `json:"success" example:"true"`
	Message string `json:"message" example:"Success"`
	Data    any    `json:"data,omitempty"`
}

// newResponse is a helper function to create a response body
func newResponse(success bool, message string, data any) response {
	return response{
		Success: success,
		Message: message,
		Data:    data,
	}
}

// meta represents metadata for a paginated response
type meta struct {
	Total uint64 `json:"total" example:"100"`
	Limit uint64 `json:"limit" example:"10"`
	Skip  uint64 `json:"skip" example:"0"`
}

// newMeta is a helper function to create metadata for a paginated response
func newMeta(total, limit, skip uint64) meta {
	return meta{
		Total: total,
		Limit: limit,
		Skip:  skip,
	}
}

// authResponse represents an authentication response body
type authResponse struct {
	AccessToken string `json:"token" example:"v2.local.Gdh5kiOTyyaQ3_bNykYDeYHO21Jg2..."`
}

// newAuthResponse is a helper function to create a response body for handling authentication data
func newAuthResponse(token string) authResponse {
	return authResponse{
		AccessToken: token,
	}
}

// userResponse represents a user response body
type userResponse struct {
	ID        uint64          `json:"id" example:"1"`
	Name      string          `json:"name" example:"John Doe"`
	Username  string          `json:"username" example:"john_doe"`
	Email     string          `json:"email" example:"test@example.com"`
	Role      domain.UserRole `json:"role" example:"admin"`
	CreatedAt time.Time       `json:"created_at" example:"1970-01-01T00:00:00Z"`
	UpdatedAt time.Time       `json:"updated_at" example:"1970-01-01T00:00:00Z"`
}

// newUserResponse is a helper function to create a response body for handling user data
func newUserResponse(user *domain.User) userResponse {
	return userResponse{
		ID:        user.ID,
		Name:      user.Name,
		Username:  user.Username,
		Email:     user.Email,
		Role:      user.Role,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
	}
}

// paymentResponse represents a payment response body
type paymentResponse struct {
	ID   uint64             `json:"id" example:"1"`
	Name string             `json:"name" example:"Tunai"`
	Type domain.PaymentType `json:"type" example:"CASH"`
	Logo string             `json:"logo" example:"https://example.com/cash.png"`
}

// newPaymentResponse is a helper function to create a response body for handling payment data
func newPaymentResponse(payment *domain.Payment) paymentResponse {
	return paymentResponse{
		ID:   payment.ID,
		Name: payment.Name,
		Type: payment.Type,
		Logo: payment.Logo,
	}
}

// categoryResponse represents a category response body
type categoryResponse struct {
	ID   uint64 `json:"id" example:"1"`
	Name string `json:"name" example:"Foods"`
}

// newCategoryResponse is a helper function to create a response body for handling category data
func newCategoryResponse(category *domain.Category) categoryResponse {
	return categoryResponse{
		ID:   category.ID,
		Name: category.Name,
	}
}

// productResponse represents a product response body
type productResponse struct {
	ID            uint64           `json:"id" example:"1"`
	SKU           string           `json:"sku" example:"9a4c25d3-9786-492c-b084-85cb75c1ee3e"`
	Name          string           `json:"name" example:"Chiki Ball"`
	Slug          string           `json:"slug" example:"chiki-ball"`
	Description   string           `json:"description" example:"Snack ringan untuk jualan harian"`
	Stock         int64            `json:"stock" example:"100"`
	Price         float64          `json:"price" example:"5000"`
	Cost          float64          `json:"cost" example:"3000"`
	Image         string           `json:"image" example:"https://example.com/chiki-ball.png"`
	GalleryImages []string         `json:"gallery_images"`
	Status        string           `json:"status" example:"published"`
	PromoLabel    string           `json:"promo_label" example:"Best Seller"`
	Category      categoryResponse `json:"category"`
	CreatedAt     time.Time        `json:"created_at" example:"1970-01-01T00:00:00Z"`
	UpdatedAt     time.Time        `json:"updated_at" example:"1970-01-01T00:00:00Z"`
}

// newProductResponse is a helper function to create a response body for handling product data
func newProductResponse(product *domain.Product) productResponse {
	return productResponse{
		ID:            product.ID,
		SKU:           product.SKU.String(),
		Name:          product.Name,
		Slug:          product.Slug,
		Description:   product.Description,
		Stock:         product.Stock,
		Price:         product.Price,
		Cost:          product.Cost,
		Image:         product.Image,
		GalleryImages: product.GalleryImages,
		Status:        product.Status,
		PromoLabel:    product.PromoLabel,
		Category:      newCategoryResponse(product.Category),
		CreatedAt:     product.CreatedAt,
		UpdatedAt:     product.UpdatedAt,
	}
}

// settingResponse represents a setting response body.
type settingResponse struct {
	ID                     uint64    `json:"id" example:"1"`
	StoreName              string    `json:"store_name" example:"GEZY Commerce"`
	StoreAddress           string    `json:"store_address" example:"Jl. Merdeka No. 45, Bandung"`
	StoreContact           string    `json:"store_contact" example:"+62 812 3344 2211"`
	StorefrontBadge        string    `json:"storefront_badge" example:"Etalase Resmi GEZY Commerce"`
	StorefrontHeroTitle    string    `json:"storefront_hero_title" example:"Temukan produk pilihan dan nikmati pengalaman belanja yang cepat, praktis, dan nyaman."`
	StorefrontHeroBody     string    `json:"storefront_hero_body" example:"Selamat datang di etalase resmi kami, tempat produk pilihan siap Anda pesan tanpa ribet."`
	StorefrontFeatureTitle string    `json:"storefront_feature_title" example:"Belanja Lebih Mudah"`
	StorefrontFeatureItem1 string    `json:"storefront_feature_item_1" example:"Temukan produk favoritmu lewat pencarian atau kategori pilihan."`
	StorefrontFeatureItem2 string    `json:"storefront_feature_item_2" example:"Masukkan ke keranjang dalam beberapa klik dari etalase atau halaman detail."`
	StorefrontFeatureItem3 string    `json:"storefront_feature_item_3" example:"Selesaikan pembayaran dengan cepat lalu pantau status pesananmu dengan mudah."`
	TaxName                string    `json:"tax_name" example:"PPN"`
	TaxRate                float64   `json:"tax_rate" example:"11"`
	ServiceFeeName         string    `json:"service_fee_name" example:"Biaya Layanan"`
	ServiceFeeRate         float64   `json:"service_fee_rate" example:"2"`
	PurchaseDiscountName   string    `json:"purchase_discount_name" example:"Diskon Pembelian"`
	PurchaseDiscountRate   float64   `json:"purchase_discount_rate" example:"5"`
	CreatedAt              time.Time `json:"created_at" example:"1970-01-01T00:00:00Z"`
	UpdatedAt              time.Time `json:"updated_at" example:"1970-01-01T00:00:00Z"`
}

func newSettingResponse(setting *domain.Setting) settingResponse {
	return settingResponse{
		ID:                     setting.ID,
		StoreName:              setting.StoreName,
		StoreAddress:           setting.StoreAddress,
		StoreContact:           setting.StoreContact,
		StorefrontBadge:        setting.StorefrontBadge,
		StorefrontHeroTitle:    setting.StorefrontHeroTitle,
		StorefrontHeroBody:     setting.StorefrontHeroBody,
		StorefrontFeatureTitle: setting.StorefrontFeatureTitle,
		StorefrontFeatureItem1: setting.StorefrontFeatureItem1,
		StorefrontFeatureItem2: setting.StorefrontFeatureItem2,
		StorefrontFeatureItem3: setting.StorefrontFeatureItem3,
		TaxName:                setting.TaxName,
		TaxRate:                setting.TaxRate,
		ServiceFeeName:         setting.ServiceFeeName,
		ServiceFeeRate:         setting.ServiceFeeRate,
		PurchaseDiscountName:   setting.PurchaseDiscountName,
		PurchaseDiscountRate:   setting.PurchaseDiscountRate,
		CreatedAt:              setting.CreatedAt,
		UpdatedAt:              setting.UpdatedAt,
	}
}

// orderResponse represents an order response body
type orderResponse struct {
	ID              uint64                 `json:"id" example:"1"`
	UserID          uint64                 `json:"user_id" example:"1"`
	User            *userResponse          `json:"user,omitempty"`
	PaymentID       uint64                 `json:"payment_type_id" example:"1"`
	CustomerID      *uint64                `json:"customer_id,omitempty" example:"1"`
	CustomerName    string                 `json:"customer_name" example:"John Doe"`
	CustomerPhone   string                 `json:"customer_phone" example:"0812-3344-2211"`
	CustomerEmail   string                 `json:"customer_email" example:"john@example.com"`
	ShippingAddress string                 `json:"shipping_address" example:"Jl. Merdeka No. 45, Bandung"`
	CustomerNote    string                 `json:"customer_note" example:"Antar sore hari"`
	TotalPrice      float64                `json:"total_price" example:"100000"`
	TotalPaid       float64                `json:"total_paid" example:"100000"`
	TotalReturn     float64                `json:"total_return" example:"0"`
	Status          string                 `json:"status" example:"paid"`
	Channel         string                 `json:"channel" example:"pos"`
	ReceiptCode     string                 `json:"receipt_id" example:"4979cf6e-d215-4ff8-9d0d-b3e99bcc7750"`
	Products        []orderProductResponse `json:"products"`
	PaymentType     paymentResponse        `json:"payment_type"`
	CreatedAt       time.Time              `json:"created_at" example:"1970-01-01T00:00:00Z"`
	UpdatedAt       time.Time              `json:"updated_at" example:"1970-01-01T00:00:00Z"`
}

// newOrderResponse is a helper function to create a response body for handling order data
func newOrderResponse(order *domain.Order) orderResponse {
	var user *userResponse
	if order.User != nil {
		parsed := newUserResponse(order.User)
		user = &parsed
	}
	return orderResponse{
		ID:              order.ID,
		UserID:          order.UserID,
		User:            user,
		PaymentID:       order.PaymentID,
		CustomerID:      order.CustomerID,
		CustomerName:    order.CustomerName,
		CustomerPhone:   order.CustomerPhone,
		CustomerEmail:   order.CustomerEmail,
		ShippingAddress: order.ShippingAddress,
		CustomerNote:    order.CustomerNote,
		TotalPrice:      order.TotalPrice,
		TotalPaid:       order.TotalPaid,
		TotalReturn:     order.TotalReturn,
		Status:          string(order.Status),
		Channel:         string(order.Channel),
		ReceiptCode:     order.ReceiptCode.String(),
		Products:        newOrderProductResponse(order.Products),
		PaymentType:     newPaymentResponse(order.Payment),
		CreatedAt:       order.CreatedAt,
		UpdatedAt:       order.UpdatedAt,
	}
}

// orderProductResponse represents an order product response body
type orderProductResponse struct {
	ID               uint64          `json:"id" example:"1"`
	OrderID          uint64          `json:"order_id" example:"1"`
	ProductID        uint64          `json:"product_id" example:"1"`
	Quantity         int64           `json:"qty" example:"1"`
	Price            float64         `json:"price" example:"100000"`
	CostAtSale       float64         `json:"cost_at_sale" example:"70000"`
	TotalNormalPrice float64         `json:"total_normal_price" example:"100000"`
	TotalFinalPrice  float64         `json:"total_final_price" example:"100000"`
	TotalCost        float64         `json:"total_cost" example:"70000"`
	Product          productResponse `json:"product"`
	CreatedAt        time.Time       `json:"created_at" example:"1970-01-01T00:00:00Z"`
	UpdatedAt        time.Time       `json:"updated_at" example:"1970-01-01T00:00:00Z"`
}

// newOrderProductResponse is a helper function to create a response body for handling order product data
func newOrderProductResponse(orderProduct []domain.OrderProduct) []orderProductResponse {
	var orderProductResponses []orderProductResponse

	for _, orderProduct := range orderProduct {
		orderProductResponses = append(orderProductResponses, orderProductResponse{
			ID:               orderProduct.ID,
			OrderID:          orderProduct.OrderID,
			ProductID:        orderProduct.ProductID,
			Quantity:         orderProduct.Quantity,
			Price:            orderProduct.Product.Price,
			CostAtSale:       orderProduct.CostAtSale,
			TotalNormalPrice: orderProduct.TotalPrice,
			TotalFinalPrice:  orderProduct.TotalPrice,
			TotalCost:        orderProduct.CostAtSale * float64(orderProduct.Quantity),
			Product:          newProductResponse(orderProduct.Product),
			CreatedAt:        orderProduct.CreatedAt,
			UpdatedAt:        orderProduct.UpdatedAt,
		})
	}

	return orderProductResponses
}

// errorStatusMap is a map of defined error messages and their corresponding http status codes
var errorStatusMap = map[error]int{
	domain.ErrInternal:                   http.StatusInternalServerError,
	domain.ErrDataNotFound:               http.StatusNotFound,
	domain.ErrConflictingData:            http.StatusConflict,
	domain.ErrInvalidCredentials:         http.StatusUnauthorized,
	domain.ErrUnauthorized:               http.StatusUnauthorized,
	domain.ErrEmptyAuthorizationHeader:   http.StatusUnauthorized,
	domain.ErrInvalidAuthorizationHeader: http.StatusUnauthorized,
	domain.ErrInvalidAuthorizationType:   http.StatusUnauthorized,
	domain.ErrInvalidToken:               http.StatusUnauthorized,
	domain.ErrExpiredToken:               http.StatusUnauthorized,
	domain.ErrForbidden:                  http.StatusForbidden,
	domain.ErrFeatureDisabled:            http.StatusServiceUnavailable,
	domain.ErrNoUpdatedData:              http.StatusBadRequest,
	domain.ErrInsufficientStock:          http.StatusBadRequest,
	domain.ErrInsufficientPayment:        http.StatusBadRequest,
}

// validationError sends an error response for some specific request validation error
func validationError(ctx *gin.Context, err error) {
	errMsgs := parseError(err)
	errRsp := newErrorResponse(errMsgs)
	ctx.JSON(http.StatusBadRequest, errRsp)
}

// handleError determines the status code of an error and returns a JSON response with the error message and status code
func handleError(ctx *gin.Context, err error) {
	statusCode, ok := errorStatusMap[err]
	if !ok {
		statusCode = http.StatusInternalServerError
	}

	slog.Error("error handled", "error", err, "status_code", statusCode)

	errMsg := parseError(err)
	errRsp := newErrorResponse(errMsg)
	ctx.JSON(statusCode, errRsp)
}

// handleAbort sends an error response and aborts the request with the specified status code and error message
func handleAbort(ctx *gin.Context, err error) {
	statusCode, ok := errorStatusMap[err]
	if !ok {
		statusCode = http.StatusInternalServerError
	}

	errMsg := parseError(err)
	errRsp := newErrorResponse(errMsg)
	ctx.AbortWithStatusJSON(statusCode, errRsp)
}

// parseError parses error messages from the error object and returns a slice of error messages
func parseError(err error) []string {
	var errMsgs []string

	if errors.As(err, &validator.ValidationErrors{}) {
		for _, err := range err.(validator.ValidationErrors) {
			errMsgs = append(errMsgs, err.Error())
		}
	} else {
		errMsgs = append(errMsgs, err.Error())
	}

	return errMsgs
}

// errorResponse represents an error response body format
type errorResponse struct {
	Success  bool     `json:"success" example:"false"`
	Messages []string `json:"messages" example:"Error message 1, Error message 2"`
}

// newErrorResponse is a helper function to create an error response body
func newErrorResponse(errMsgs []string) errorResponse {
	return errorResponse{
		Success:  false,
		Messages: errMsgs,
	}
}

// handleSuccess sends a success response with the specified status code and optional data
func handleSuccess(ctx *gin.Context, data any) {
	rsp := newResponse(true, "Success", data)
	ctx.JSON(http.StatusOK, rsp)
}
