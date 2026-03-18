package http

import (
	"strings"

	"github.com/bagashiz/go-pos/internal/core/domain"
	"github.com/bagashiz/go-pos/internal/core/port"
	"github.com/gin-gonic/gin"
)

// ProductHandler represents the HTTP handler for product-related requests
type ProductHandler struct {
	svc port.ProductService
}

// NewProductHandler creates a new ProductHandler instance
func NewProductHandler(svc port.ProductService) *ProductHandler {
	return &ProductHandler{
		svc,
	}
}

// createProductRequest represents a request body for creating a new product
type createProductRequest struct {
	CategoryID    uint64   `json:"category_id" binding:"required,min=1" example:"1"`
	Name          string   `json:"name" binding:"required" example:"Chiki Ball"`
	Slug          string   `json:"slug" binding:"omitempty" example:"chiki-ball"`
	Description   string   `json:"description" binding:"omitempty" example:"Snack ringan untuk jualan harian"`
	Image         string   `json:"image" binding:"required" example:"https://example.com/chiki-ball.png"`
	GalleryImages []string `json:"gallery_images" binding:"omitempty" example:"https://example.com/chiki-ball.png"`
	Price         float64  `json:"price" binding:"required,min=0" example:"5000"`
	Cost          float64  `json:"cost" binding:"omitempty,min=0" example:"3000"`
	Stock         int64    `json:"stock" binding:"required,min=0" example:"100"`
	Status        string   `json:"status" binding:"omitempty,oneof=draft published" example:"published"`
	PromoLabel    string   `json:"promo_label" binding:"omitempty" example:"Best Seller"`
}

// bulkCreateProductsRequest represents a request body for creating products in bulk
type bulkCreateProductsRequest struct {
	Products []createProductRequest `json:"products" binding:"required,min=1,dive"`
}

// CreateProduct godoc
//
//	@Summary		Create a new product
//	@Description	create a new product with name, image, price, and stock
//	@Tags			Products
//	@Accept			json
//	@Produce		json
//	@Param			createProductRequest	body		createProductRequest	true	"Create product request"
//	@Success		200						{object}	productResponse			"Product created"
//	@Failure		400						{object}	errorResponse			"Validation error"
//	@Failure		401						{object}	errorResponse			"Unauthorized error"
//	@Failure		403						{object}	errorResponse			"Forbidden error"
//	@Failure		404						{object}	errorResponse			"Data not found error"
//	@Failure		409						{object}	errorResponse			"Data conflict error"
//	@Failure		500						{object}	errorResponse			"Internal server error"
//	@Router			/products [post]
//	@Security		BearerAuth
func (ph *ProductHandler) CreateProduct(ctx *gin.Context) {
	var req createProductRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		validationError(ctx, err)
		return
	}

	product := domain.Product{
		CategoryID:    req.CategoryID,
		Name:          req.Name,
		Slug:          req.Slug,
		Description:   req.Description,
		Image:         req.Image,
		GalleryImages: req.GalleryImages,
		Price:         req.Price,
		Cost:          req.Cost,
		Stock:         req.Stock,
		Status:        req.Status,
		PromoLabel:    req.PromoLabel,
	}

	_, err := ph.svc.CreateProduct(ctx, &product)
	if err != nil {
		handleError(ctx, err)
		return
	}

	rsp := newProductResponse(&product)

	handleSuccess(ctx, rsp)
}

// BulkCreateProducts godoc
//
//	@Summary		Bulk create products
//	@Description	create multiple products in a single request
//	@Tags			Products
//	@Accept			json
//	@Produce		json
//	@Param			bulkCreateProductsRequest	body		bulkCreateProductsRequest	true	"Bulk create products request"
//	@Success		200							{object}	meta							"Products created"
//	@Failure		400							{object}	errorResponse					"Validation error"
//	@Failure		401							{object}	errorResponse					"Unauthorized error"
//	@Failure		403							{object}	errorResponse					"Forbidden error"
//	@Failure		500							{object}	errorResponse					"Internal server error"
//	@Router			/products/bulk [post]
//	@Security		BearerAuth
func (ph *ProductHandler) BulkCreateProducts(ctx *gin.Context) {
	var req bulkCreateProductsRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		validationError(ctx, err)
		return
	}

	var created []productResponse
	var failed int

	for _, item := range req.Products {
		product := domain.Product{
			CategoryID:    item.CategoryID,
			Name:          item.Name,
			Slug:          item.Slug,
			Description:   item.Description,
			Image:         item.Image,
			GalleryImages: item.GalleryImages,
			Price:         item.Price,
			Cost:          item.Cost,
			Stock:         item.Stock,
			Status:        item.Status,
			PromoLabel:    item.PromoLabel,
		}

		_, err := ph.svc.CreateProduct(ctx, &product)
		if err != nil {
			failed++
			continue
		}

		created = append(created, newProductResponse(&product))
	}

	rsp := gin.H{
		"products": created,
		"failed":   failed,
		"total":    len(req.Products),
	}

	handleSuccess(ctx, rsp)
}

// getProductRequest represents a request body for retrieving a product
type getProductRequest struct {
	ID uint64 `uri:"id" binding:"required,min=1" example:"1"`
}

// GetProduct godoc
//
//	@Summary		Get a product
//	@Description	get a product by id with its category
//	@Tags			Products
//	@Accept			json
//	@Produce		json
//	@Param			id	path		uint64			true	"Product ID"
//	@Success		200	{object}	productResponse	"Product retrieved"
//	@Failure		400	{object}	errorResponse	"Validation error"
//	@Failure		404	{object}	errorResponse	"Data not found error"
//	@Failure		500	{object}	errorResponse	"Internal server error"
//	@Router			/products/{id} [get]
//	@Security		BearerAuth
func (ph *ProductHandler) GetProduct(ctx *gin.Context) {
	var req getProductRequest
	if err := ctx.ShouldBindUri(&req); err != nil {
		validationError(ctx, err)
		return
	}

	product, err := ph.svc.GetProduct(ctx, req.ID)
	if err != nil {
		handleError(ctx, err)
		return
	}

	rsp := newProductResponse(product)

	handleSuccess(ctx, rsp)
}

// listProductsRequest represents a request body for listing products
type listProductsRequest struct {
	CategoryID uint64 `form:"category_id" binding:"omitempty,min=1" example:"1"`
	Query      string `form:"q" binding:"omitempty" example:"Chiki"`
	Skip       uint64 `form:"skip" binding:"omitempty,min=0" example:"0"`
	Limit      uint64 `form:"limit" binding:"omitempty,min=1" example:"10"`
}

// ListProducts godoc
//
//	@Summary		List products
//	@Description	List products with pagination
//	@Tags			Products
//	@Accept			json
//	@Produce		json
//	@Param			category_id	query		uint64			false	"Category ID"
//	@Param			q			query		string			false	"Query"
//	@Param			skip		query		uint64			true	"Skip"
//	@Param			limit		query		uint64			true	"Limit"
//	@Success		200			{object}	meta			"Products retrieved"
//	@Failure		400			{object}	errorResponse	"Validation error"
//	@Failure		500			{object}	errorResponse	"Internal server error"
//	@Router			/products [get]
//	@Security		BearerAuth
func (ph *ProductHandler) ListProducts(ctx *gin.Context) {
	var req listProductsRequest
	var productsList []productResponse

	if err := ctx.ShouldBindQuery(&req); err != nil {
		validationError(ctx, err)
		return
	}
	if req.Limit == 0 {
		req.Limit = 200
	}

	products, err := ph.svc.ListProducts(ctx, req.Query, req.CategoryID, req.Skip, req.Limit)
	if err != nil {
		handleError(ctx, err)
		return
	}

	for _, product := range products {
		productsList = append(productsList, newProductResponse(&product))
	}

	total := uint64(len(productsList))
	meta := newMeta(total, req.Limit, req.Skip)
	rsp := toMap(meta, productsList, "products")

	handleSuccess(ctx, rsp)
}

// ListPublishedProducts godoc
//
//	@Summary		List published products
//	@Description	list published products for storefront/catalog
//	@Tags			Storefront
//	@Accept			json
//	@Produce		json
//	@Param			category_id	query		uint64			false	"Category ID"
//	@Param			q			query		string			false	"Query"
//	@Param			skip		query		uint64			true	"Skip"
//	@Param			limit		query		uint64			true	"Limit"
//	@Success		200			{object}	meta			"Published products retrieved"
//	@Failure		400			{object}	errorResponse	"Validation error"
//	@Failure		500			{object}	errorResponse	"Internal server error"
//	@Router			/store/products [get]
func (ph *ProductHandler) ListPublishedProducts(ctx *gin.Context) {
	var req listProductsRequest
	var productsList []productResponse

	if err := ctx.ShouldBindQuery(&req); err != nil {
		validationError(ctx, err)
		return
	}
	if req.Limit == 0 {
		req.Limit = 200
	}

	products, err := ph.svc.ListPublishedProducts(ctx, req.Query, req.CategoryID, req.Skip, req.Limit)
	if err != nil {
		handleError(ctx, err)
		return
	}

	for _, product := range products {
		productsList = append(productsList, newProductResponse(&product))
	}

	total := uint64(len(productsList))
	meta := newMeta(total, req.Limit, req.Skip)
	rsp := toMap(meta, productsList, "products")

	handleSuccess(ctx, rsp)
}

// GetPublishedProductBySlug godoc
//
//	@Summary		Get published product by slug
//	@Description	get a published product by slug for storefront/catalog
//	@Tags			Storefront
//	@Accept			json
//	@Produce		json
//	@Param			slug	path		string			true	"Product slug"
//	@Success		200		{object}	productResponse	"Published product retrieved"
//	@Failure		404		{object}	errorResponse	"Data not found error"
//	@Failure		500		{object}	errorResponse	"Internal server error"
//	@Router			/store/products/{slug} [get]
func (ph *ProductHandler) GetPublishedProductBySlug(ctx *gin.Context) {
	slug := strings.TrimSpace(ctx.Param("slug"))
	if slug == "" {
		handleError(ctx, domain.ErrDataNotFound)
		return
	}

	product, err := ph.svc.GetPublishedProductBySlug(ctx, slug)
	if err != nil {
		handleError(ctx, err)
		return
	}

	handleSuccess(ctx, newProductResponse(product))
}

// updateProductRequest represents a request body for updating a product
type updateProductRequest struct {
	CategoryID    uint64   `json:"category_id" binding:"omitempty,required,min=1" example:"1"`
	Name          string   `json:"name" binding:"omitempty,required" example:"Nutrisari Jeruk"`
	Slug          string   `json:"slug" binding:"omitempty" example:"nutrisari-jeruk"`
	Description   string   `json:"description" binding:"omitempty" example:"Minuman serbuk rasa jeruk"`
	Image         string   `json:"image" binding:"omitempty,required" example:"https://example.com/nutrisari-jeruk.png"`
	GalleryImages []string `json:"gallery_images" binding:"omitempty"`
	Price         float64  `json:"price" binding:"omitempty,required,min=0" example:"2000"`
	Cost          float64  `json:"cost" binding:"omitempty,min=0" example:"1500"`
	Stock         int64    `json:"stock" binding:"omitempty,required,min=0" example:"200"`
	Status        string   `json:"status" binding:"omitempty,oneof=draft published" example:"draft"`
	PromoLabel    string   `json:"promo_label" binding:"omitempty" example:"Promo Ramadan"`
}

// UpdateProduct godoc
//
//	@Summary		Update a product
//	@Description	update a product's name, image, price, or stock by id
//	@Tags			Products
//	@Accept			json
//	@Produce		json
//	@Param			id						path		uint64					true	"Product ID"
//	@Param			updateProductRequest	body		updateProductRequest	true	"Update product request"
//	@Success		200						{object}	productResponse			"Product updated"
//	@Failure		400						{object}	errorResponse			"Validation error"
//	@Failure		401						{object}	errorResponse			"Unauthorized error"
//	@Failure		403						{object}	errorResponse			"Forbidden error"
//	@Failure		404						{object}	errorResponse			"Data not found error"
//	@Failure		409						{object}	errorResponse			"Data conflict error"
//	@Failure		500						{object}	errorResponse			"Internal server error"
//	@Router			/products/{id} [put]
//	@Security		BearerAuth
func (ph *ProductHandler) UpdateProduct(ctx *gin.Context) {
	var req updateProductRequest
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

	product := domain.Product{
		ID:            id,
		CategoryID:    req.CategoryID,
		Name:          req.Name,
		Slug:          req.Slug,
		Description:   req.Description,
		Image:         req.Image,
		GalleryImages: req.GalleryImages,
		Price:         req.Price,
		Cost:          req.Cost,
		Stock:         req.Stock,
		Status:        req.Status,
		PromoLabel:    req.PromoLabel,
	}

	_, err = ph.svc.UpdateProduct(ctx, &product)
	if err != nil {
		handleError(ctx, err)
		return
	}

	rsp := newProductResponse(&product)

	handleSuccess(ctx, rsp)
}

// deleteProductRequest represents a request body for deleting a product
type deleteProductRequest struct {
	ID uint64 `uri:"id" binding:"required,min=1" example:"1"`
}

// DeleteProduct godoc
//
//	@Summary		Delete a product
//	@Description	Delete a product by id
//	@Tags			Products
//	@Accept			json
//	@Produce		json
//	@Param			id	path		uint64			true	"Product ID"
//	@Success		200	{object}	response		"Product deleted"
//	@Failure		400	{object}	errorResponse	"Validation error"
//	@Failure		401	{object}	errorResponse	"Unauthorized error"
//	@Failure		403	{object}	errorResponse	"Forbidden error"
//	@Failure		404	{object}	errorResponse	"Data not found error"
//	@Failure		500	{object}	errorResponse	"Internal server error"
//	@Router			/products/{id} [delete]
//	@Security		BearerAuth
func (ph *ProductHandler) DeleteProduct(ctx *gin.Context) {
	var req deleteProductRequest
	if err := ctx.ShouldBindUri(&req); err != nil {
		validationError(ctx, err)
		return
	}

	err := ph.svc.DeleteProduct(ctx, req.ID)
	if err != nil {
		handleError(ctx, err)
		return
	}

	handleSuccess(ctx, nil)
}
