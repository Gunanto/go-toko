package port

import (
	"context"

	"github.com/bagashiz/go-pos/internal/core/domain"
)

type StoreAuthService interface {
	Register(ctx context.Context, customer *domain.Customer, password string) (*domain.Customer, string, error)
	Login(ctx context.Context, login, password string) (string, error)
	GetMe(ctx context.Context, customerID uint64) (*domain.Customer, error)
	IsGoogleOAuthEnabled() bool
	GetGoogleAuthURL(state string) (string, error)
	LoginWithGoogle(ctx context.Context, code string) (*domain.Customer, string, error)
	GoogleFrontendRedirect(token string) string
}
