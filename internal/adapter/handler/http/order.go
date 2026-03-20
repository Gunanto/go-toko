package http

import (
	"errors"
	"strings"
	"time"

	"github.com/bagashiz/go-pos/internal/core/domain"
	"github.com/bagashiz/go-pos/internal/core/port"
	"github.com/gin-gonic/gin"
)

// OrderHandler represents the HTTP handler for order-related requests
type OrderHandler struct {
	svc port.OrderService
}

// NewOrderHandler creates a new OrderHandler instance
func NewOrderHandler(svc port.OrderService) *OrderHandler {
	return &OrderHandler{
		svc,
	}
}

// orderProductRequest represents an order product request body
type orderProductRequest struct {
	ProductID uint64 `json:"product_id" binding:"required,min=1" example:"1"`
	Quantity  int64  `json:"qty" binding:"required,min=1" example:"1"`
}

// createOrderRequest represents a request body for creating a new order
type createOrderRequest struct {
	PaymentID       uint64                `json:"payment_id" binding:"required,min=1" example:"1"`
	CustomerID      *uint64               `json:"customer_id" binding:"omitempty,min=1" example:"1"`
	CustomerName    string                `json:"customer_name" binding:"required" example:"John Doe"`
	SpecialDiscount float64               `json:"special_discount" binding:"min=0" example:"10000"`
	TotalPaid       int64                 `json:"total_paid" binding:"required,min=0" example:"100000"`
	Channel         string                `json:"channel" binding:"omitempty,oneof=pos manual" example:"pos"`
	Products        []orderProductRequest `json:"products" binding:"required,min=1,dive"`
}

type createStoreOrderRequest struct {
	PaymentID       uint64                `json:"payment_id" binding:"required,min=1" example:"1"`
	CustomerID      *uint64               `json:"customer_id" binding:"omitempty,min=1" example:"1"`
	CustomerName    string                `json:"customer_name" binding:"required" example:"John Doe"`
	CustomerPhone   string                `json:"customer_phone" binding:"omitempty" example:"+628123456789"`
	CustomerEmail   string                `json:"customer_email" binding:"omitempty,email" example:"john@example.com"`
	ShippingAddress string                `json:"shipping_address" binding:"omitempty" example:"Jl. Merdeka No. 45, Bandung"`
	CustomerNote    string                `json:"customer_note" binding:"omitempty" example:"Antar sore hari"`
	Products        []orderProductRequest `json:"products" binding:"required,min=1,dive"`
}

type payOrderRequest struct {
	TotalPaid float64 `json:"total_paid" binding:"required,min=0" example:"100000"`
}

// CreateOrder godoc
//
//	@Summary		Create a new order
//	@Description	Create a new order and return the order data with purchase details
//	@Tags			Orders
//	@Accept			json
//	@Produce		json
//	@Param			createOrderRequest	body		createOrderRequest	true	"Create order request"
//	@Success		200					{object}	orderResponse		"Order created"
//	@Failure		400					{object}	errorResponse		"Validation error"
//	@Failure		404					{object}	errorResponse		"Data not found error"
//	@Failure		409					{object}	errorResponse		"Data conflict error"
//	@Failure		500					{object}	errorResponse		"Internal server error"
//	@Router			/orders [post]
//	@Security		BearerAuth
func (oh *OrderHandler) CreateOrder(ctx *gin.Context) {
	var req createOrderRequest
	var products []domain.OrderProduct

	if err := ctx.ShouldBindJSON(&req); err != nil {
		validationError(ctx, err)
		return
	}

	for _, product := range req.Products {
		products = append(products, domain.OrderProduct{
			ProductID: product.ProductID,
			Quantity:  product.Quantity,
		})
	}

	authPayload := getAuthPayload(ctx, authorizationPayloadKey)

	order := domain.Order{
		UserID:          authPayload.UserID,
		PaymentID:       req.PaymentID,
		CustomerID:      req.CustomerID,
		CustomerName:    req.CustomerName,
		SpecialDiscount: req.SpecialDiscount,
		TotalPaid:       float64(req.TotalPaid),
		Channel:         domain.OrderChannel(req.Channel),
		Products:        products,
	}

	_, err := oh.svc.CreateOrder(ctx, &order)
	if err != nil {
		handleError(ctx, err)
		return
	}

	rsp := newOrderResponse(&order)

	handleSuccess(ctx, rsp)
}

// CreateStoreOrder godoc
//
//	@Summary		Create a storefront order
//	@Description	Create a public storefront order using an internal store user
//	@Tags			Storefront
//	@Accept			json
//	@Produce		json
//	@Param			createStoreOrderRequest	body		createStoreOrderRequest	true	"Create storefront order request"
//	@Success		200						{object}	orderResponse			"Order created"
//	@Failure		400						{object}	errorResponse			"Validation error"
//	@Failure		404						{object}	errorResponse			"Data not found error"
//	@Failure		409						{object}	errorResponse			"Data conflict error"
//	@Failure		500						{object}	errorResponse			"Internal server error"
//	@Router			/store/orders [post]
func (oh *OrderHandler) CreateStoreOrder(ctx *gin.Context) {
	var req createStoreOrderRequest
	var products []domain.OrderProduct

	if err := ctx.ShouldBindJSON(&req); err != nil {
		validationError(ctx, err)
		return
	}

	for _, product := range req.Products {
		products = append(products, domain.OrderProduct{
			ProductID: product.ProductID,
			Quantity:  product.Quantity,
		})
	}

	order := domain.Order{
		PaymentID:       req.PaymentID,
		CustomerID:      req.CustomerID,
		CustomerName:    strings.TrimSpace(req.CustomerName),
		CustomerPhone:   strings.TrimSpace(req.CustomerPhone),
		CustomerEmail:   strings.TrimSpace(req.CustomerEmail),
		ShippingAddress: strings.TrimSpace(req.ShippingAddress),
		CustomerNote:    strings.TrimSpace(req.CustomerNote),
		Products:        products,
	}

	created, err := oh.svc.CreateStoreOrder(ctx, &order)
	if err != nil {
		handleError(ctx, err)
		return
	}

	handleSuccess(ctx, newOrderResponse(created))
}

// PayOrder godoc
//
//	@Summary		Pay a pending order
//	@Description	mark a pending order as paid
//	@Tags			Orders
//	@Accept			json
//	@Produce		json
//	@Param			id				path		uint64			true	"Order ID"
//	@Param			payOrderRequest	body		payOrderRequest	true	"Pay order request"
//	@Success		200				{object}	orderResponse	"Order updated"
//	@Failure		400				{object}	errorResponse	"Validation error"
//	@Failure		401				{object}	errorResponse	"Unauthorized error"
//	@Failure		404				{object}	errorResponse	"Data not found error"
//	@Failure		500				{object}	errorResponse	"Internal server error"
//	@Router			/orders/{id}/pay [put]
//	@Security		BearerAuth
func (oh *OrderHandler) PayOrder(ctx *gin.Context) {
	var req payOrderRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		validationError(ctx, err)
		return
	}

	id, err := stringToUint64(ctx.Param("id"))
	if err != nil {
		validationError(ctx, err)
		return
	}

	order, err := oh.svc.PayOrder(ctx, id, req.TotalPaid)
	if err != nil {
		handleError(ctx, err)
		return
	}

	handleSuccess(ctx, newOrderResponse(order))
}

// getOrderRequest represents a request body for retrieving an order
type getOrderRequest struct {
	ID uint64 `uri:"id" binding:"required,min=1" example:"1"`
}

type getStoreOrderByReceiptRequest struct {
	ReceiptCode string `uri:"receipt_code" binding:"required" example:"4979cf6e-d215-4ff8-9d0d-b3e99bcc7750"`
}

// GetOrder godoc
//
//	@Summary		Get an order
//	@Description	Get an order by id and return the order data with purchase details
//	@Tags			Orders
//	@Accept			json
//	@Produce		json
//	@Param			id	path		uint64			true	"Order ID"
//	@Success		200	{object}	orderResponse	"Order displayed"
//	@Failure		400	{object}	errorResponse	"Validation error"
//	@Failure		404	{object}	errorResponse	"Data not found error"
//	@Failure		500	{object}	errorResponse	"Internal server error"
//	@Router			/orders/{id} [get]
//	@Security		BearerAuth
func (oh *OrderHandler) GetOrder(ctx *gin.Context) {
	var req getOrderRequest
	if err := ctx.ShouldBindUri(&req); err != nil {
		validationError(ctx, err)
		return
	}

	order, err := oh.svc.GetOrder(ctx, req.ID)
	if err != nil {
		handleError(ctx, err)
		return
	}

	rsp := newOrderResponse(order)

	handleSuccess(ctx, rsp)
}

// GetStoreOrderByReceiptCode godoc
//
//	@Summary		Get storefront order by receipt code
//	@Description	Get a storefront order by receipt code
//	@Tags			Storefront
//	@Accept			json
//	@Produce		json
//	@Param			receipt_code	path		string			true	"Receipt code"
//	@Success		200				{object}	orderResponse	"Order displayed"
//	@Failure		400				{object}	errorResponse	"Validation error"
//	@Failure		404				{object}	errorResponse	"Data not found error"
//	@Failure		500				{object}	errorResponse	"Internal server error"
//	@Router			/store/orders/{receipt_code} [get]
func (oh *OrderHandler) GetStoreOrderByReceiptCode(ctx *gin.Context) {
	var req getStoreOrderByReceiptRequest
	if err := ctx.ShouldBindUri(&req); err != nil {
		validationError(ctx, err)
		return
	}

	order, err := oh.svc.GetStoreOrderByReceiptCode(ctx, req.ReceiptCode)
	if err != nil {
		handleError(ctx, err)
		return
	}

	handleSuccess(ctx, newOrderResponse(order))
}

// listOrdersRequest represents a request body for listing orders
type listOrdersRequest struct {
	Skip     uint64 `form:"skip" binding:"omitempty,min=0" example:"0"`
	Limit    uint64 `form:"limit" binding:"omitempty,min=5" example:"5"`
	Status   string `form:"status" binding:"omitempty" example:"selesai"`
	DateFrom string `form:"date_from" binding:"omitempty" example:"2026-03-01"`
	DateTo   string `form:"date_to" binding:"omitempty" example:"2026-03-31"`
}

type storeOrderHistoryRequest struct {
	Skip  uint64 `form:"skip" binding:"omitempty,min=0" example:"0"`
	Limit uint64 `form:"limit" binding:"omitempty,min=1" example:"10"`
	Phone string `form:"phone" binding:"omitempty" example:"0812-3344-2211"`
	Email string `form:"email" binding:"omitempty,email" example:"john@example.com"`
}

// ListOrders godoc
//
//	@Summary		List orders
//	@Description	List orders and return an array of order data with purchase details
//	@Tags			Orders
//	@Accept			json
//	@Produce		json
//	@Param			skip	query		uint64			true	"Skip records"
//	@Param			limit	query		uint64			true	"Limit records"
//	@Param			status	query		string			false	"Status (selesai|menunggu)"
//	@Param			date_from	query		string			false	"Start date (YYYY-MM-DD)"
//	@Param			date_to	query		string			false	"End date (YYYY-MM-DD)"
//	@Success		200		{object}	meta			"Orders displayed"
//	@Failure		400		{object}	errorResponse	"Validation error"
//	@Failure		401		{object}	errorResponse	"Unauthorized error"
//	@Failure		500		{object}	errorResponse	"Internal server error"
//	@Router			/orders [get]
//	@Security		BearerAuth
func (oh *OrderHandler) ListOrders(ctx *gin.Context) {
	var req listOrdersRequest
	var ordersList []orderResponse

	if err := ctx.ShouldBindQuery(&req); err != nil {
		validationError(ctx, err)
		return
	}
	if req.Limit == 0 {
		req.Limit = 20
	}

	filter := port.OrderListFilter{
		Status: req.Status,
	}

	if req.DateFrom != "" {
		parsed, _, err := parseOrderDateInput(req.DateFrom)
		if err != nil {
			validationError(ctx, err)
			return
		}
		filter.DateFrom = &parsed
	}

	if req.DateTo != "" {
		parsed, dateOnly, err := parseOrderDateInput(req.DateTo)
		if err != nil {
			validationError(ctx, err)
			return
		}
		if dateOnly {
			parsed = parsed.Add(23*time.Hour + 59*time.Minute + 59*time.Second + 999*time.Millisecond)
		}
		filter.DateTo = &parsed
	}

	if filter.DateFrom != nil && filter.DateTo != nil && filter.DateFrom.After(*filter.DateTo) {
		validationError(ctx, errors.New("date_from must be before or equal to date_to"))
		return
	}

	orders, total, err := oh.svc.ListOrders(ctx, filter, req.Skip, req.Limit)
	if err != nil {
		handleError(ctx, err)
		return
	}

	for _, order := range orders {
		ordersList = append(ordersList, newOrderResponse(&order))
	}

	meta := newMeta(total, req.Limit, req.Skip)
	rsp := toMap(meta, ordersList, "orders")

	handleSuccess(ctx, rsp)
}

// ListStoreOrdersByCustomer godoc
//
//	@Summary		List storefront orders by customer
//	@Description	List storefront orders for a customer identified by phone or email
//	@Tags			Storefront
//	@Accept			json
//	@Produce		json
//	@Param			skip	query		uint64			false	"Skip records"
//	@Param			limit	query		uint64			false	"Limit records"
//	@Param			phone	query		string			false	"Customer phone"
//	@Param			email	query		string			false	"Customer email"
//	@Success		200		{object}	meta			"Orders displayed"
//	@Failure		400		{object}	errorResponse	"Validation error"
//	@Failure		404		{object}	errorResponse	"Data not found error"
//	@Failure		500		{object}	errorResponse	"Internal server error"
//	@Router			/store/orders/history [get]
func (oh *OrderHandler) ListStoreOrdersByCustomer(ctx *gin.Context) {
	var req storeOrderHistoryRequest
	var ordersList []orderResponse

	if err := ctx.ShouldBindQuery(&req); err != nil {
		validationError(ctx, err)
		return
	}
	if req.Limit == 0 {
		req.Limit = 10
	}
	if strings.TrimSpace(req.Phone) == "" && strings.TrimSpace(req.Email) == "" {
		validationError(ctx, errors.New("phone or email is required"))
		return
	}

	orders, total, err := oh.svc.ListStoreOrdersByCustomer(ctx, req.Phone, req.Email, req.Skip, req.Limit)
	if err != nil {
		handleError(ctx, err)
		return
	}

	for _, order := range orders {
		ordersList = append(ordersList, newOrderResponse(&order))
	}

	meta := newMeta(total, req.Limit, req.Skip)
	rsp := toMap(meta, ordersList, "orders")

	handleSuccess(ctx, rsp)
}

func parseOrderDateInput(value string) (time.Time, bool, error) {
	normalized := strings.TrimSpace(value)
	if strings.Contains(normalized, "T") && strings.Contains(normalized, " ") {
		normalized = strings.ReplaceAll(normalized, " ", "+")
	}

	parsed, err := time.Parse(time.RFC3339, normalized)
	if err == nil {
		return parsed, false, nil
	}

	parsed, err = time.ParseInLocation("2006-01-02", normalized, time.Local)
	if err != nil {
		return time.Time{}, false, err
	}

	return parsed, true, nil
}
