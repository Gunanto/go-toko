package service

import (
	"context"
	"net/http"
	"regexp"
	"strings"

	"github.com/bagashiz/go-pos/internal/core/domain"
	"github.com/bagashiz/go-pos/internal/core/port"
	"github.com/bagashiz/go-pos/internal/core/util"
)

type StoreGoogleConfig struct {
	ClientID         string
	ClientSecret     string
	RedirectURL      string
	FrontendRedirect string
}

type StoreAuthService struct {
	repo       port.CustomerRepository
	cache      port.CacheRepository
	token      port.TokenService
	google     StoreGoogleConfig
	httpClient *http.Client
}

var storePhoneSanitizer = regexp.MustCompile(`\D+`)

func NewStoreAuthService(repo port.CustomerRepository, cache port.CacheRepository, token port.TokenService, google StoreGoogleConfig) *StoreAuthService {
	return &StoreAuthService{
		repo:       repo,
		cache:      cache,
		token:      token,
		google:     google,
		httpClient: http.DefaultClient,
	}
}

func (sas *StoreAuthService) Register(ctx context.Context, customer *domain.Customer, password string) (*domain.Customer, string, error) {
	customer.Name = strings.TrimSpace(customer.Name)
	customer.Phone = normalizeStorePhone(customer.Phone)
	customer.Email = strings.TrimSpace(strings.ToLower(customer.Email))
	customer.Address = strings.TrimSpace(customer.Address)
	password = strings.TrimSpace(password)

	if customer.Name == "" || password == "" {
		return nil, "", domain.ErrNoUpdatedData
	}
	if customer.Email == "" && customer.Phone == "" {
		return nil, "", domain.ErrNoUpdatedData
	}

	hashedPassword, err := util.HashPassword(password)
	if err != nil {
		return nil, "", domain.ErrInternal
	}

	existing, err := sas.findExistingCustomer(ctx, customer.Phone, customer.Email)
	if err != nil && err != domain.ErrDataNotFound {
		return nil, "", domain.ErrInternal
	}

	if existing != nil {
		if existing.Password != "" {
			return nil, "", domain.ErrConflictingData
		}

		existing.Name = customer.Name
		if customer.Phone != "" {
			existing.Phone = customer.Phone
		}
		if customer.Email != "" {
			existing.Email = customer.Email
		}
		if customer.Address != "" {
			existing.Address = customer.Address
		}
		existing.Password = hashedPassword
		existing.AuthProvider = "password"

		existing, err = sas.repo.UpdateCustomer(ctx, existing)
		if err != nil {
			return nil, "", err
		}
		if err := sas.invalidateCustomerCache(ctx, existing.ID); err != nil {
			return nil, "", err
		}

		token, err := sas.token.CreateCustomerToken(existing)
		if err != nil {
			return nil, "", domain.ErrTokenCreation
		}
		return existing, token, nil
	}

	customer.Tier = "bronze"
	customer.Password = hashedPassword
	customer.AuthProvider = "password"

	created, err := sas.repo.CreateCustomer(ctx, customer)
	if err != nil {
		return nil, "", err
	}
	if err := sas.invalidateCustomerCache(ctx, created.ID); err != nil {
		return nil, "", err
	}

	token, err := sas.token.CreateCustomerToken(created)
	if err != nil {
		return nil, "", domain.ErrTokenCreation
	}

	return created, token, nil
}

func (sas *StoreAuthService) Login(ctx context.Context, login, password string) (string, error) {
	login = strings.TrimSpace(strings.ToLower(login))
	password = strings.TrimSpace(password)
	if login == "" || password == "" {
		return "", domain.ErrInvalidCredentials
	}

	var customer *domain.Customer
	var err error
	if strings.Contains(login, "@") {
		customer, err = sas.repo.GetCustomerByEmail(ctx, login)
	} else {
		customer, err = sas.repo.GetCustomerByPhone(ctx, normalizeStorePhone(login))
	}
	if err != nil {
		if err == domain.ErrDataNotFound {
			return "", domain.ErrInvalidCredentials
		}
		return "", domain.ErrInternal
	}

	if customer.Password == "" || util.ComparePassword(password, customer.Password) != nil {
		return "", domain.ErrInvalidCredentials
	}

	token, err := sas.token.CreateCustomerToken(customer)
	if err != nil {
		return "", domain.ErrTokenCreation
	}

	return token, nil
}

func (sas *StoreAuthService) GetMe(ctx context.Context, customerID uint64) (*domain.Customer, error) {
	customer, err := sas.repo.GetCustomerByID(ctx, customerID)
	if err != nil {
		return nil, err
	}
	return customer, nil
}

func (sas *StoreAuthService) IsGoogleOAuthEnabled() bool {
	return strings.TrimSpace(sas.google.ClientID) != "" &&
		strings.TrimSpace(sas.google.ClientSecret) != "" &&
		strings.TrimSpace(sas.google.RedirectURL) != "" &&
		strings.TrimSpace(sas.google.FrontendRedirect) != ""
}

func (sas *StoreAuthService) findExistingCustomer(ctx context.Context, phone, email string) (*domain.Customer, error) {
	phone = normalizeStorePhone(phone)
	email = strings.TrimSpace(strings.ToLower(email))

	if phone != "" {
		customer, err := sas.repo.GetCustomerByPhone(ctx, phone)
		if err == nil {
			return customer, nil
		}
		if err != domain.ErrDataNotFound {
			return nil, err
		}
	}
	if email != "" {
		customer, err := sas.repo.GetCustomerByEmail(ctx, email)
		if err == nil {
			return customer, nil
		}
		if err != domain.ErrDataNotFound {
			return nil, err
		}
	}
	return nil, domain.ErrDataNotFound
}

func normalizeStorePhone(phone string) string {
	phone = strings.TrimSpace(phone)
	if phone == "" {
		return ""
	}
	return storePhoneSanitizer.ReplaceAllString(phone, "")
}

func (sas *StoreAuthService) invalidateCustomerCache(ctx context.Context, customerID uint64) error {
	if err := sas.cache.Delete(ctx, util.GenerateCacheKey("customer", customerID)); err != nil {
		return domain.ErrInternal
	}
	if err := sas.cache.DeleteByPrefix(ctx, "customers:*"); err != nil {
		return domain.ErrInternal
	}
	return nil
}
