package config

import (
	"os"
	"strings"

	"github.com/joho/godotenv"
)

// Container contains environment variables for the application, database, cache, token, and http server
type (
	Container struct {
		App         *App
		Token       *Token
		Redis       *Redis
		DB          *DB
		HTTP        *HTTP
		StoreGoogle *StoreGoogle
		Storage     *Storage
	}
	// App contains all the environment variables for the application
	App struct {
		Name string
		Env  string
	}
	// Token contains all the environment variables for the token service
	Token struct {
		Duration string
		Key      string
	}
	// Redis contains all the environment variables for the cache service
	Redis struct {
		Addr     string
		Password string
	}
	// Database contains all the environment variables for the database
	DB struct {
		Connection string
		Host       string
		Port       string
		User       string
		Password   string
		Name       string
	}
	// HTTP contains all the environment variables for the http server
	HTTP struct {
		Env            string
		URL            string
		Port           string
		AllowedOrigins string
	}
	StoreGoogle struct {
		ClientID         string
		ClientSecret     string
		RedirectURL      string
		FrontendRedirect string
	}
	Storage struct {
		Driver        string
		Endpoint      string
		AccessKey     string
		SecretKey     string
		Bucket        string
		UseSSL        bool
		PublicBaseURL string
	}
)

// New creates a new container instance
func New() (*Container, error) {
	if os.Getenv("APP_ENV") != "production" {
		err := godotenv.Load()
		if err != nil {
			return nil, err
		}
	}

	app := &App{
		Name: os.Getenv("APP_NAME"),
		Env:  os.Getenv("APP_ENV"),
	}

	token := &Token{
		Duration: os.Getenv("TOKEN_DURATION"),
		Key:      os.Getenv("TOKEN_KEY_HEX"),
	}

	redis := &Redis{
		Addr:     os.Getenv("REDIS_ADDR"),
		Password: os.Getenv("REDIS_PASSWORD"),
	}

	db := &DB{
		Connection: os.Getenv("DB_CONNECTION"),
		Host:       os.Getenv("DB_HOST"),
		Port:       os.Getenv("DB_PORT"),
		User:       os.Getenv("DB_USER"),
		Password:   os.Getenv("DB_PASSWORD"),
		Name:       os.Getenv("DB_NAME"),
	}

	http := &HTTP{
		Env:            os.Getenv("APP_ENV"),
		URL:            os.Getenv("HTTP_URL"),
		Port:           os.Getenv("HTTP_PORT"),
		AllowedOrigins: os.Getenv("HTTP_ALLOWED_ORIGINS"),
	}

	storeGoogle := &StoreGoogle{
		ClientID:         os.Getenv("STORE_GOOGLE_CLIENT_ID"),
		ClientSecret:     os.Getenv("STORE_GOOGLE_CLIENT_SECRET"),
		RedirectURL:      os.Getenv("STORE_GOOGLE_REDIRECT_URL"),
		FrontendRedirect: os.Getenv("STORE_GOOGLE_FRONTEND_REDIRECT"),
	}

	storage := &Storage{
		Driver:        os.Getenv("STORAGE_DRIVER"),
		Endpoint:      os.Getenv("STORAGE_ENDPOINT"),
		AccessKey:     os.Getenv("STORAGE_ACCESS_KEY"),
		SecretKey:     os.Getenv("STORAGE_SECRET_KEY"),
		Bucket:        os.Getenv("STORAGE_BUCKET"),
		UseSSL:        strings.EqualFold(os.Getenv("STORAGE_USE_SSL"), "true"),
		PublicBaseURL: os.Getenv("STORAGE_PUBLIC_BASE_URL"),
	}

	return &Container{
		App:         app,
		Token:       token,
		Redis:       redis,
		DB:          db,
		HTTP:        http,
		StoreGoogle: storeGoogle,
		Storage:     storage,
	}, nil
}
