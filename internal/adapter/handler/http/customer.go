package http

import (
	"strings"
	"time"

	"github.com/bagashiz/go-pos/internal/core/domain"
	"github.com/bagashiz/go-pos/internal/core/port"
	"github.com/gin-gonic/gin"
)

// CustomerHandler represents the HTTP handler for customer-related requests
type CustomerHandler struct {
	svc port.CustomerService
}

// NewCustomerHandler creates a new CustomerHandler instance
func NewCustomerHandler(svc port.CustomerService) *CustomerHandler {
	return &CustomerHandler{
		svc: svc,
	}
}

// createCustomerRequest represents a request body for creating a customer
type createCustomerRequest struct {
	Name    string `json:"name" binding:"required" example:"John Doe"`
	Phone   string `json:"phone" binding:"omitempty" example:"0812-3344-2211"`
	Email   string `json:"email" binding:"omitempty,email" example:"john@example.com"`
	Address string `json:"address" binding:"omitempty" example:"Jl. Merdeka No. 45, Bandung"`
	Tier    string `json:"tier" binding:"omitempty" example:"gold"`
	Notes   string `json:"notes" binding:"omitempty" example:"Langganan"`
}

// updateCustomerRequest represents a request body for updating a customer
type updateCustomerRequest struct {
	Name     string `json:"name" binding:"omitempty,required" example:"John Doe"`
	Phone    string `json:"phone" binding:"omitempty" example:"0812-3344-2211"`
	Email    string `json:"email" binding:"omitempty,email" example:"john@example.com"`
	Address  string `json:"address" binding:"omitempty" example:"Jl. Merdeka No. 45, Bandung"`
	Tier     string `json:"tier" binding:"omitempty" example:"gold"`
	Notes    string `json:"notes" binding:"omitempty" example:"Langganan"`
	Password string `json:"password" binding:"omitempty,min=8" example:"TempPass123"`
}

// getCustomerRequest represents a request params for retrieving a customer
type getCustomerRequest struct {
	ID uint64 `uri:"id" binding:"required,min=1" example:"1"`
}

// deleteCustomerRequest represents a request params for deleting a customer
type deleteCustomerRequest struct {
	ID uint64 `uri:"id" binding:"required,min=1" example:"1"`
}

// listCustomersRequest represents a request body for listing customers
type listCustomersRequest struct {
	Skip  uint64 `form:"skip" binding:"omitempty,min=0" example:"0"`
	Limit uint64 `form:"limit" binding:"omitempty,min=5" example:"10"`
}

type findCustomerRequest struct {
	Phone string `form:"phone" binding:"omitempty" example:"0812-3344-2211"`
	Email string `form:"email" binding:"omitempty,email" example:"john@example.com"`
}

type customerResponse struct {
	ID           uint64 `json:"id" example:"1"`
	Name         string `json:"name" example:"John Doe"`
	Phone        string `json:"phone" example:"0812-3344-2211"`
	Email        string `json:"email" example:"john@example.com"`
	Address      string `json:"address" example:"Jl. Merdeka No. 45, Bandung"`
	Tier         string `json:"tier" example:"gold"`
	Notes        string `json:"notes" example:"Langganan"`
	AvatarURL    string `json:"avatar_url" example:"https://lh3.googleusercontent.com/a/example"`
	AuthProvider string `json:"auth_provider" example:"password"`
	CreatedAt    string `json:"created_at" example:"1970-01-01T00:00:00Z"`
	UpdatedAt    string `json:"updated_at" example:"1970-01-01T00:00:00Z"`
}

func newCustomerResponse(customer *domain.Customer) customerResponse {
	return customerResponse{
		ID:           customer.ID,
		Name:         customer.Name,
		Phone:        customer.Phone,
		Email:        customer.Email,
		Address:      customer.Address,
		Tier:         customer.Tier,
		Notes:        customer.Notes,
		AvatarURL:    customer.AvatarURL,
		AuthProvider: customer.AuthProvider,
		CreatedAt:    customer.CreatedAt.Format(time.RFC3339),
		UpdatedAt:    customer.UpdatedAt.Format(time.RFC3339),
	}
}

// FindCustomer godoc
//
//	@Summary		Find a customer
//	@Description	Find a customer by phone or email for storefront checkout
//	@Tags			Storefront
//	@Accept			json
//	@Produce		json
//	@Param			phone	query		string			false	"Customer phone"
//	@Param			email	query		string			false	"Customer email"
//	@Success		200		{object}	customerResponse	"Customer found"
//	@Failure		400		{object}	errorResponse	"Validation error"
//	@Failure		404		{object}	errorResponse	"Data not found error"
//	@Failure		500		{object}	errorResponse	"Internal server error"
//	@Router			/store/customers/lookup [get]
func (ch *CustomerHandler) FindCustomer(ctx *gin.Context) {
	var req findCustomerRequest
	if err := ctx.ShouldBindQuery(&req); err != nil {
		validationError(ctx, err)
		return
	}

	if strings.TrimSpace(req.Phone) == "" && strings.TrimSpace(req.Email) == "" {
		validationError(ctx, domain.ErrNoUpdatedData)
		return
	}

	customer, err := ch.svc.FindCustomer(ctx, req.Phone, req.Email)
	if err != nil {
		handleError(ctx, err)
		return
	}

	handleSuccess(ctx, newCustomerResponse(customer))
}

// CreateCustomer godoc
//
//	@Summary		Create a new customer
//	@Description	Create a new customer
//	@Tags			Customers
//	@Accept			json
//	@Produce		json
//	@Param			createCustomerRequest	body		createCustomerRequest	true	"Create customer request"
//	@Success		200					{object}	customerResponse	"Customer created"
//	@Failure		400					{object}	errorResponse		"Validation error"
//	@Failure		401					{object}	errorResponse		"Unauthorized error"
//	@Failure		403					{object}	errorResponse		"Forbidden error"
//	@Failure		409					{object}	errorResponse		"Data conflict error"
//	@Failure		500					{object}	errorResponse		"Internal server error"
//	@Router			/customers [post]
//	@Security		BearerAuth
func (ch *CustomerHandler) CreateCustomer(ctx *gin.Context) {
	var req createCustomerRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		validationError(ctx, err)
		return
	}

	customer := domain.Customer{
		Name:    req.Name,
		Phone:   req.Phone,
		Email:   req.Email,
		Address: req.Address,
		Tier:    req.Tier,
		Notes:   req.Notes,
	}

	if customer.Tier == "" {
		customer.Tier = "bronze"
	}

	created, err := ch.svc.CreateCustomer(ctx, &customer)
	if err != nil {
		handleError(ctx, err)
		return
	}

	handleSuccess(ctx, newCustomerResponse(created))
}

// GetCustomer godoc
//
//	@Summary		Get a customer
//	@Description	Get a customer by id
//	@Tags			Customers
//	@Accept			json
//	@Produce		json
//	@Param			id	path		uint64			true	"Customer ID"
//	@Success		200	{object}	customerResponse	"Customer retrieved"
//	@Failure		400	{object}	errorResponse	"Validation error"
//	@Failure		401	{object}	errorResponse	"Unauthorized error"
//	@Failure		404	{object}	errorResponse	"Data not found error"
//	@Failure		500	{object}	errorResponse	"Internal server error"
//	@Router			/customers/{id} [get]
//	@Security		BearerAuth
func (ch *CustomerHandler) GetCustomer(ctx *gin.Context) {
	var req getCustomerRequest
	if err := ctx.ShouldBindUri(&req); err != nil {
		validationError(ctx, err)
		return
	}

	customer, err := ch.svc.GetCustomer(ctx, req.ID)
	if err != nil {
		handleError(ctx, err)
		return
	}

	handleSuccess(ctx, newCustomerResponse(customer))
}

// ListCustomers godoc
//
//	@Summary		List customers
//	@Description	List customers
//	@Tags			Customers
//	@Accept			json
//	@Produce		json
//	@Param			skip	query		uint64			true	"Skip records"
//	@Param			limit	query		uint64			true	"Limit records"
//	@Success		200		{object}	meta			"Customers displayed"
//	@Failure		400		{object}	errorResponse	"Validation error"
//	@Failure		401		{object}	errorResponse	"Unauthorized error"
//	@Failure		500		{object}	errorResponse	"Internal server error"
//	@Router			/customers [get]
//	@Security		BearerAuth
func (ch *CustomerHandler) ListCustomers(ctx *gin.Context) {
	var req listCustomersRequest

	if err := ctx.ShouldBindQuery(&req); err != nil {
		validationError(ctx, err)
		return
	}
	if req.Limit == 0 {
		req.Limit = 20
	}

	customers, total, err := ch.svc.ListCustomers(ctx, req.Skip, req.Limit)
	if err != nil {
		handleError(ctx, err)
		return
	}

	var customersList []customerResponse
	for _, customer := range customers {
		customerCopy := customer
		customersList = append(customersList, newCustomerResponse(&customerCopy))
	}

	meta := newMeta(total, req.Limit, req.Skip)
	rsp := toMap(meta, customersList, "customers")

	handleSuccess(ctx, rsp)
}

// UpdateCustomer godoc
//
//	@Summary		Update a customer
//	@Description	Update a customer by id
//	@Tags			Customers
//	@Accept			json
//	@Produce		json
//	@Param			id	path		uint64			true	"Customer ID"
//	@Param			updateCustomerRequest	body		updateCustomerRequest	true	"Update customer request"
//	@Success		200	{object}	customerResponse	"Customer updated"
//	@Failure		400	{object}	errorResponse	"Validation error"
//	@Failure		401	{object}	errorResponse	"Unauthorized error"
//	@Failure		403	{object}	errorResponse	"Forbidden error"
//	@Failure		404	{object}	errorResponse	"Data not found error"
//	@Failure		500	{object}	errorResponse	"Internal server error"
//	@Router			/customers/{id} [put]
//	@Security		BearerAuth
func (ch *CustomerHandler) UpdateCustomer(ctx *gin.Context) {
	var req updateCustomerRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		validationError(ctx, err)
		return
	}

	idStr := ctx.Param("id")
	id, err := stringToUint64(idStr)
	if err != nil {
		validationError(ctx, err)
		return
	}

	customer := domain.Customer{
		ID:       id,
		Name:     req.Name,
		Phone:    req.Phone,
		Email:    req.Email,
		Address:  req.Address,
		Tier:     req.Tier,
		Notes:    req.Notes,
		Password: req.Password,
	}

	updated, err := ch.svc.UpdateCustomer(ctx, &customer)
	if err != nil {
		handleError(ctx, err)
		return
	}

	handleSuccess(ctx, newCustomerResponse(updated))
}

// DeleteCustomer godoc
//
//	@Summary		Delete a customer
//	@Description	Delete a customer by id
//	@Tags			Customers
//	@Accept			json
//	@Produce		json
//	@Param			id	path		uint64			true	"Customer ID"
//	@Success		200	{object}	meta			"Customer deleted"
//	@Failure		400	{object}	errorResponse	"Validation error"
//	@Failure		401	{object}	errorResponse	"Unauthorized error"
//	@Failure		403	{object}	errorResponse	"Forbidden error"
//	@Failure		500	{object}	errorResponse	"Internal server error"
//	@Router			/customers/{id} [delete]
//	@Security		BearerAuth
func (ch *CustomerHandler) DeleteCustomer(ctx *gin.Context) {
	var req deleteCustomerRequest
	if err := ctx.ShouldBindUri(&req); err != nil {
		validationError(ctx, err)
		return
	}

	err := ch.svc.DeleteCustomer(ctx, req.ID)
	if err != nil {
		handleError(ctx, err)
		return
	}

	handleSuccess(ctx, gin.H{"deleted": true})
}
