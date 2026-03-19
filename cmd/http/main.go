package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"strings"

	"github.com/bagashiz/go-pos/docs"
	"github.com/bagashiz/go-pos/internal/adapter/auth/paseto"
	"github.com/bagashiz/go-pos/internal/adapter/config"
	"github.com/bagashiz/go-pos/internal/adapter/handler/http"
	"github.com/bagashiz/go-pos/internal/adapter/logger"
	objectstorage "github.com/bagashiz/go-pos/internal/adapter/storage/object"
	"github.com/bagashiz/go-pos/internal/adapter/storage/postgres"
	"github.com/bagashiz/go-pos/internal/adapter/storage/postgres/repository"
	"github.com/bagashiz/go-pos/internal/adapter/storage/redis"
	"github.com/bagashiz/go-pos/internal/core/port"
	"github.com/bagashiz/go-pos/internal/core/service"
)

// @title						Go POS (Point of Sale) API
// @version					1.0
// @description				This is a simple RESTful Point of Sale (POS) Service API written in Go using Gin web framework, PostgreSQL database, and Redis cache.
//
// @contact.name				Bagas Hizbullah
// @contact.url				https://github.com/bagashiz/go-pos
// @contact.email				bagash.office@simplelogin.com
//
// @license.name				MIT
// @license.url				https://github.com/bagashiz/go-pos/blob/main/LICENSE
//
// @host						gopos.bagashiz.me
// @BasePath					/v1
// @schemes					http https
//
// @securityDefinitions.apikey	BearerAuth
// @in							header
// @name						Authorization
// @description				Type "Bearer" followed by a space and the access token.
func main() {
	// Load environment variables
	config, err := config.New()
	if err != nil {
		slog.Error("Error loading environment variables", "error", err)
		os.Exit(1)
	}

	// Override swagger host/base path for local use.
	if config.HTTP != nil && config.HTTP.URL != "" {
		host := config.HTTP.URL
		if host == "0.0.0.0" || host == "127.0.0.1" || host == "localhost" {
			host = "localhost"
		}
		docs.SwaggerInfo.Host = fmt.Sprintf("%s:%s", host, config.HTTP.Port)
		docs.SwaggerInfo.BasePath = "/v1"
		docs.SwaggerInfo.Schemes = []string{"http"}
		if strings.HasPrefix(config.HTTP.URL, "https") {
			docs.SwaggerInfo.Schemes = []string{"https"}
		}
	}

	// Set logger
	logger.Set(config.App)

	slog.Info("Starting the application", "app", config.App.Name, "env", config.App.Env)

	// Init database
	ctx := context.Background()
	db, err := postgres.New(ctx, config.DB)
	if err != nil {
		slog.Error("Error initializing database connection", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	slog.Info("Successfully connected to the database", "db", config.DB.Connection)

	// Migrate database
	err = db.Migrate()
	if err != nil {
		slog.Error("Error migrating database", "error", err)
		os.Exit(1)
	}

	slog.Info("Successfully migrated the database")

	// Init cache service
	cache, err := redis.New(ctx, config.Redis)
	if err != nil {
		slog.Error("Error initializing cache connection", "error", err)
		os.Exit(1)
	}
	defer cache.Close()

	slog.Info("Successfully connected to the cache server")

	var objectStorage port.ObjectStorage
	if config.Storage != nil && strings.TrimSpace(config.Storage.Driver) != "" {
		objectStorage, err = objectstorage.NewMinIO(config.Storage)
		if err != nil {
			slog.Error("Error initializing object storage", "error", err)
			os.Exit(1)
		}

		slog.Info(
			"Successfully initialized object storage",
			"driver", config.Storage.Driver,
			"bucket", config.Storage.Bucket,
		)
	}

	// Init token service
	token, err := paseto.New(config.Token)
	if err != nil {
		slog.Error("Error initializing token service", "error", err)
		os.Exit(1)
	}

	// Dependency injection
	// User
	userRepo := repository.NewUserRepository(db)
	userService := service.NewUserService(userRepo, cache)
	userHandler := http.NewUserHandler(userService)

	// Payment
	paymentRepo := repository.NewPaymentRepository(db)
	paymentService := service.NewPaymentService(paymentRepo, cache)
	paymentHandler := http.NewPaymentHandler(paymentService)

	// Category
	categoryRepo := repository.NewCategoryRepository(db)
	categoryService := service.NewCategoryService(categoryRepo, cache)
	categoryHandler := http.NewCategoryHandler(categoryService)

	// Product
	productRepo := repository.NewProductRepository(db)
	productService := service.NewProductService(productRepo, categoryRepo, cache)
	productHandler := http.NewProductHandler(productService)

	// Customer
	customerRepo := repository.NewCustomerRepository(db)
	customerService := service.NewCustomerService(customerRepo, cache)
	customerHandler := http.NewCustomerHandler(customerService)

	// Auth
	authService := service.NewAuthService(userRepo, token)
	authHandler := http.NewAuthHandler(authService)

	// Store auth
	storeGoogleConfig := service.StoreGoogleConfig{
		ClientID:         config.StoreGoogle.ClientID,
		ClientSecret:     config.StoreGoogle.ClientSecret,
		RedirectURL:      config.StoreGoogle.RedirectURL,
		FrontendRedirect: config.StoreGoogle.FrontendRedirect,
	}
	storeAuthService := service.NewStoreAuthService(customerRepo, cache, token, storeGoogleConfig)
	storeAuthHandler := http.NewStoreAuthHandler(storeAuthService)

	storeConversationRepo := repository.NewStoreConversationRepository(db)
	storeMessageRepo := repository.NewStoreMessageRepository(db)
	storeChatService := service.NewStoreChatService(storeConversationRepo, storeMessageRepo, userRepo)
	storeChatHandler := http.NewStoreChatHandler(storeChatService)

	// Order
	orderRepo := repository.NewOrderRepository(db)
	orderService := service.NewOrderService(orderRepo, productRepo, categoryRepo, customerRepo, userRepo, paymentRepo, cache)
	orderHandler := http.NewOrderHandler(orderService)

	// Settings
	settingRepo := repository.NewSettingRepository(db)
	settingService := service.NewSettingService(settingRepo, cache)
	settingHandler := http.NewSettingHandler(settingService)
	uploadHandler := http.NewUploadHandler(objectStorage)

	// Init router
	router, err := http.NewRouter(
		config.HTTP,
		token,
		*userHandler,
		*authHandler,
		*storeAuthHandler,
		*storeChatHandler,
		*paymentHandler,
		*categoryHandler,
		*productHandler,
		*orderHandler,
		*customerHandler,
		*settingHandler,
		*uploadHandler,
	)
	if err != nil {
		slog.Error("Error initializing router", "error", err)
		os.Exit(1)
	}

	// Start server
	listenAddr := fmt.Sprintf("%s:%s", config.HTTP.URL, config.HTTP.Port)
	slog.Info("Starting the HTTP server", "listen_address", listenAddr)
	err = router.Serve(listenAddr)
	if err != nil {
		slog.Error("Error starting the HTTP server", "error", err)
		os.Exit(1)
	}
}
