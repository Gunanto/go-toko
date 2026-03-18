package paseto

import (
	"strings"
	"time"

	"aidanwoods.dev/go-paseto"
	"github.com/bagashiz/go-pos/internal/adapter/config"
	"github.com/bagashiz/go-pos/internal/core/domain"
	"github.com/bagashiz/go-pos/internal/core/port"
	"github.com/google/uuid"
)

/**
 * PasetoToken implements port.TokenService interface
 * and provides an access to the paseto library
 */
type PasetoToken struct {
	key      *paseto.V4SymmetricKey
	parser   *paseto.Parser
	duration time.Duration
}

// New creates a new paseto instance
func New(config *config.Token) (port.TokenService, error) {
	durationStr := config.Duration
	duration, err := time.ParseDuration(durationStr)
	if err != nil {
		return nil, domain.ErrTokenDuration
	}

	if strings.TrimSpace(config.Key) == "" {
		return nil, domain.ErrTokenKey
	}
	key, err := paseto.V4SymmetricKeyFromHex(config.Key)
	if err != nil {
		return nil, domain.ErrTokenKey
	}
	parser := paseto.NewParser()

	return &PasetoToken{
		&key,
		&parser,
		duration,
	}, nil
}

// CreateToken creates a new paseto token
func (pt *PasetoToken) CreateToken(user *domain.User) (string, error) {
	id, err := uuid.NewRandom()
	if err != nil {
		return "", domain.ErrTokenCreation
	}

	payload := &domain.TokenPayload{
		ID:      id,
		Subject: "user",
		UserID:  user.ID,
		Role:    user.Role,
	}

	token := paseto.NewToken()
	err = token.Set("payload", payload)
	if err != nil {
		return "", domain.ErrTokenCreation
	}

	issuedAt := time.Now()
	expiredAt := issuedAt.Add(pt.duration)

	token.SetIssuedAt(issuedAt)
	token.SetNotBefore(issuedAt)
	token.SetExpiration(expiredAt)

	tokenStr := token.V4Encrypt(*pt.key, nil)

	return tokenStr, nil
}

func (pt *PasetoToken) CreateCustomerToken(customer *domain.Customer) (string, error) {
	id, err := uuid.NewRandom()
	if err != nil {
		return "", domain.ErrTokenCreation
	}

	payload := &domain.TokenPayload{
		ID:         id,
		Subject:    "customer",
		CustomerID: customer.ID,
	}

	token := paseto.NewToken()
	err = token.Set("payload", payload)
	if err != nil {
		return "", domain.ErrTokenCreation
	}

	issuedAt := time.Now()
	expiredAt := issuedAt.Add(pt.duration)

	token.SetIssuedAt(issuedAt)
	token.SetNotBefore(issuedAt)
	token.SetExpiration(expiredAt)

	return token.V4Encrypt(*pt.key, nil), nil
}

// VerifyToken verifies the paseto token
func (pt *PasetoToken) VerifyToken(token string) (*domain.TokenPayload, error) {
	var payload *domain.TokenPayload

	parsedToken, err := pt.parser.ParseV4Local(*pt.key, token, nil)
	if err != nil {
		if err.Error() == "this token has expired" {
			return nil, domain.ErrExpiredToken
		}
		return nil, domain.ErrInvalidToken
	}

	err = parsedToken.Get("payload", &payload)
	if err != nil {
		return nil, domain.ErrInvalidToken
	}

	return payload, nil
}
