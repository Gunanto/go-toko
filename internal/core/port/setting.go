package port

import (
	"context"

	"github.com/bagashiz/go-pos/internal/core/domain"
)

// SettingRepository is an interface for interacting with settings storage.
type SettingRepository interface {
	GetSettings(ctx context.Context) (*domain.Setting, error)
	UpsertSettings(ctx context.Context, setting *domain.Setting) (*domain.Setting, error)
}

// SettingService is an interface for interacting with settings business logic.
type SettingService interface {
	GetSettings(ctx context.Context) (*domain.Setting, error)
	UpdateSettings(ctx context.Context, setting *domain.Setting) (*domain.Setting, error)
}
