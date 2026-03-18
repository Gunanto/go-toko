package service

import (
	"context"

	"github.com/bagashiz/go-pos/internal/core/domain"
	"github.com/bagashiz/go-pos/internal/core/port"
	"github.com/bagashiz/go-pos/internal/core/util"
)

// SettingService implements port.SettingService.
type SettingService struct {
	repo  port.SettingRepository
	cache port.CacheRepository
}

// NewSettingService creates a new setting service instance.
func NewSettingService(repo port.SettingRepository, cache port.CacheRepository) *SettingService {
	return &SettingService{
		repo:  repo,
		cache: cache,
	}
}

// GetSettings returns current application settings.
func (ss *SettingService) GetSettings(ctx context.Context) (*domain.Setting, error) {
	cacheKey := util.GenerateCacheKey("settings", "global")
	cached, err := ss.cache.Get(ctx, cacheKey)
	if err == nil {
		var setting domain.Setting
		if err := util.Deserialize(cached, &setting); err != nil {
			return nil, domain.ErrInternal
		}
		return &setting, nil
	}

	setting, err := ss.repo.GetSettings(ctx)
	if err != nil {
		return nil, err
	}

	serialized, err := util.Serialize(setting)
	if err != nil {
		return nil, domain.ErrInternal
	}
	if err := ss.cache.Set(ctx, cacheKey, serialized, 0); err != nil {
		return nil, domain.ErrInternal
	}

	return setting, nil
}

// UpdateSettings updates current application settings.
func (ss *SettingService) UpdateSettings(ctx context.Context, setting *domain.Setting) (*domain.Setting, error) {
	updated, err := ss.repo.UpsertSettings(ctx, setting)
	if err != nil {
		return nil, err
	}

	cacheKey := util.GenerateCacheKey("settings", "global")
	if err := ss.cache.Delete(ctx, cacheKey); err != nil {
		return nil, domain.ErrInternal
	}

	return updated, nil
}
