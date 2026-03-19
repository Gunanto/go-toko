package http

import (
	"log/slog"
	"strings"

	"github.com/bagashiz/go-pos/internal/adapter/config"
	"github.com/bagashiz/go-pos/internal/core/port"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
	sloggin "github.com/samber/slog-gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// Router is a wrapper for HTTP router
type Router struct {
	*gin.Engine
}

// NewRouter creates a new HTTP router
func NewRouter(
	config *config.HTTP,
	token port.TokenService,
	userHandler UserHandler,
	authHandler AuthHandler,
	storeAuthHandler StoreAuthHandler,
	paymentHandler PaymentHandler,
	categoryHandler CategoryHandler,
	productHandler ProductHandler,
	orderHandler OrderHandler,
	customerHandler CustomerHandler,
	settingHandler SettingHandler,
) (*Router, error) {
	// Disable debug mode in production
	if config.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// CORS
	ginConfig := cors.DefaultConfig()
	allowedOrigins := strings.TrimSpace(config.AllowedOrigins)
	if allowedOrigins == "" {
		// Development-friendly default when HTTP_ALLOWED_ORIGINS is not set.
		ginConfig.AllowAllOrigins = true
	} else {
		originsList := strings.Split(allowedOrigins, ",")
		cleanOrigins := make([]string, 0, len(originsList))
		for _, origin := range originsList {
			origin = strings.TrimSpace(origin)
			if origin != "" {
				cleanOrigins = append(cleanOrigins, origin)
			}
		}
		ginConfig.AllowOrigins = cleanOrigins
	}
	ginConfig.AllowHeaders = []string{
		"Origin",
		"Content-Type",
		"Accept",
		"Authorization",
		"authorization",
		"X-Requested-With",
	}
	ginConfig.AllowMethods = []string{
		"GET",
		"POST",
		"PUT",
		"PATCH",
		"DELETE",
		"OPTIONS",
	}

	router := gin.New()
	router.Use(sloggin.New(slog.Default()), gin.Recovery(), cors.New(ginConfig))

	// Custom validators
	v, ok := binding.Validator.Engine().(*validator.Validate)
	if ok {
		if err := v.RegisterValidation("user_role", userRoleValidator); err != nil {
			return nil, err
		}

		if err := v.RegisterValidation("payment_type", paymentTypeValidator); err != nil {
			return nil, err
		}

	}

	// Swagger
	router.GET("/docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	v1 := router.Group("/v1")
	{
		store := v1.Group("/store")
		{
			storeAuth := store.Group("/auth")
			{
				storeAuth.GET("/options", storeAuthHandler.Options)
				storeAuth.POST("/register", storeAuthHandler.Register)
				storeAuth.POST("/login", storeAuthHandler.Login)
				storeAuth.GET("/google/start", storeAuthHandler.GoogleStart)
				storeAuth.GET("/google/callback", storeAuthHandler.GoogleCallback)
				storeAuthProtected := storeAuth.Group("/")
				storeAuthProtected.Use(customerAuthMiddleware(token))
				{
					storeAuthProtected.GET("/me", storeAuthHandler.GetMe)
				}
			}
			store.GET("/settings", settingHandler.GetSettings)
			store.GET("/payments", paymentHandler.ListPayments)
			store.GET("/products", productHandler.ListPublishedProducts)
			store.GET("/products/:slug", productHandler.GetPublishedProductBySlug)
			store.GET("/customers/lookup", customerHandler.FindCustomer)
			store.GET("/orders/history", orderHandler.ListStoreOrdersByCustomer)
			store.GET("/orders/:receipt_code", orderHandler.GetStoreOrderByReceiptCode)
			store.POST("/orders", orderHandler.CreateStoreOrder)
		}
		user := v1.Group("/users")
		{
			user.POST("/login", authHandler.Login)

			authUser := user.Group("/")
			authUser.Use(authMiddleware(token))
			{
				authUser.GET("/me", userHandler.GetMe)

				admin := authUser.Group("/")
				admin.Use(adminMiddleware())
				{
					admin.POST("", userHandler.Register)
					admin.GET("", userHandler.ListUsers)
					admin.GET("/:id", userHandler.GetUser)
					admin.PUT("/:id", userHandler.UpdateUser)
					admin.DELETE("/:id", userHandler.DeleteUser)
				}
			}
		}
		payment := v1.Group("/payments")
		payment.Use(authMiddleware(token))
		{
			payment.GET("", paymentHandler.ListPayments)
			payment.GET("/:id", paymentHandler.GetPayment)

			admin := payment.Group("/")
			admin.Use(adminMiddleware())
			{
				admin.POST("", paymentHandler.CreatePayment)
				admin.PUT("/:id", paymentHandler.UpdatePayment)
				admin.DELETE("/:id", paymentHandler.DeletePayment)
			}
		}
		category := v1.Group("/categories")
		category.Use(authMiddleware(token))
		{
			category.GET("", categoryHandler.ListCategories)
			category.GET("/:id", categoryHandler.GetCategory)

			admin := category.Group("/")
			admin.Use(adminMiddleware())
			{
				admin.POST("", categoryHandler.CreateCategory)
				admin.PUT("/:id", categoryHandler.UpdateCategory)
				admin.DELETE("/:id", categoryHandler.DeleteCategory)
			}
		}
		product := v1.Group("/products")
		product.Use(authMiddleware(token))
		{
			product.GET("", productHandler.ListProducts)
			product.GET("/:id", productHandler.GetProduct)

			admin := product.Group("/")
			admin.Use(adminMiddleware())
			{
				admin.POST("", productHandler.CreateProduct)
				admin.POST("/bulk", productHandler.BulkCreateProducts)
				admin.PUT("/:id", productHandler.UpdateProduct)
				admin.DELETE("/:id", productHandler.DeleteProduct)
			}
		}
		order := v1.Group("/orders")
		order.Use(authMiddleware(token))
		{
			order.POST("", orderHandler.CreateOrder)
			order.GET("", orderHandler.ListOrders)
			order.GET("/:id", orderHandler.GetOrder)
			order.PUT("/:id/pay", orderHandler.PayOrder)
		}
		customer := v1.Group("/customers")
		customer.Use(authMiddleware(token))
		{
			customer.GET("", customerHandler.ListCustomers)
			customer.GET("/:id", customerHandler.GetCustomer)

			admin := customer.Group("/")
			admin.Use(adminMiddleware())
			{
				admin.POST("", customerHandler.CreateCustomer)
				admin.PUT("/:id", customerHandler.UpdateCustomer)
				admin.DELETE("/:id", customerHandler.DeleteCustomer)
			}
		}
		settings := v1.Group("/settings")
		settings.Use(authMiddleware(token))
		{
			settings.GET("", settingHandler.GetSettings)

			admin := settings.Group("/")
			admin.Use(adminMiddleware())
			{
				admin.PUT("", settingHandler.UpdateSettings)
			}
		}
	}

	return &Router{
		router,
	}, nil
}

// Serve starts the HTTP server
func (r *Router) Serve(listenAddr string) error {
	return r.Run(listenAddr)
}
