package service

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/bagashiz/go-pos/internal/core/domain"
)

type googleTokenResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
}

type googleUserInfo struct {
	Sub           string `json:"sub"`
	Name          string `json:"name"`
	Email         string `json:"email"`
	EmailVerified bool   `json:"email_verified"`
	Picture       string `json:"picture"`
}

func (sas *StoreAuthService) GetGoogleAuthURL(state string) (string, error) {
	if !sas.IsGoogleOAuthEnabled() {
		return "", domain.ErrFeatureDisabled
	}

	values := url.Values{}
	values.Set("client_id", sas.google.ClientID)
	values.Set("redirect_uri", sas.google.RedirectURL)
	values.Set("response_type", "code")
	values.Set("scope", "openid email profile")
	values.Set("access_type", "online")
	values.Set("include_granted_scopes", "true")
	values.Set("prompt", "select_account")
	values.Set("state", state)

	return "https://accounts.google.com/o/oauth2/v2/auth?" + values.Encode(), nil
}

func (sas *StoreAuthService) LoginWithGoogle(ctx context.Context, code string) (*domain.Customer, string, error) {
	if !sas.IsGoogleOAuthEnabled() {
		return nil, "", domain.ErrFeatureDisabled
	}

	tokenResponse, err := sas.exchangeGoogleCode(ctx, code)
	if err != nil {
		return nil, "", err
	}

	profile, err := sas.fetchGoogleProfile(ctx, tokenResponse.AccessToken)
	if err != nil {
		return nil, "", err
	}
	if profile.Email == "" || !profile.EmailVerified {
		return nil, "", domain.ErrInvalidCredentials
	}

	customer, err := sas.upsertGoogleCustomer(ctx, profile)
	if err != nil {
		return nil, "", err
	}

	token, err := sas.token.CreateCustomerToken(customer)
	if err != nil {
		return nil, "", domain.ErrTokenCreation
	}

	return customer, token, nil
}

func (sas *StoreAuthService) exchangeGoogleCode(ctx context.Context, code string) (*googleTokenResponse, error) {
	form := url.Values{}
	form.Set("code", code)
	form.Set("client_id", sas.google.ClientID)
	form.Set("client_secret", sas.google.ClientSecret)
	form.Set("redirect_uri", sas.google.RedirectURL)
	form.Set("grant_type", "authorization_code")

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		"https://oauth2.googleapis.com/token",
		strings.NewReader(form.Encode()),
	)
	if err != nil {
		return nil, domain.ErrInternal
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := sas.httpClient.Do(req)
	if err != nil {
		return nil, domain.ErrInternal
	}
	defer resp.Body.Close()

	if resp.StatusCode >= http.StatusBadRequest {
		return nil, domain.ErrInvalidCredentials
	}

	var tokenResp googleTokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return nil, domain.ErrInternal
	}
	if tokenResp.AccessToken == "" {
		return nil, domain.ErrInvalidCredentials
	}

	return &tokenResp, nil
}

func (sas *StoreAuthService) fetchGoogleProfile(ctx context.Context, accessToken string) (*googleUserInfo, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://openidconnect.googleapis.com/v1/userinfo", nil)
	if err != nil {
		return nil, domain.ErrInternal
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := sas.httpClient.Do(req)
	if err != nil {
		return nil, domain.ErrInternal
	}
	defer resp.Body.Close()

	if resp.StatusCode >= http.StatusBadRequest {
		return nil, domain.ErrInvalidCredentials
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, domain.ErrInternal
	}

	var profile googleUserInfo
	if err := json.Unmarshal(body, &profile); err != nil {
		return nil, domain.ErrInternal
	}

	return &profile, nil
}

func (sas *StoreAuthService) upsertGoogleCustomer(ctx context.Context, profile *googleUserInfo) (*domain.Customer, error) {
	now := time.Now().UTC()

	existing, err := sas.repo.GetCustomerByEmail(ctx, strings.TrimSpace(strings.ToLower(profile.Email)))
	if err != nil && err != domain.ErrDataNotFound {
		return nil, domain.ErrInternal
	}

	if existing != nil {
		existing.Name = strings.TrimSpace(profile.Name)
		existing.Email = strings.TrimSpace(strings.ToLower(profile.Email))
		existing.GoogleID = strings.TrimSpace(profile.Sub)
		existing.AvatarURL = strings.TrimSpace(profile.Picture)
		existing.AuthProvider = "google"
		existing.LastLoginAt = &now

		updated, err := sas.repo.UpdateCustomer(ctx, existing)
		if err != nil {
			return nil, err
		}
		if err := sas.invalidateCustomerCache(ctx, updated.ID); err != nil {
			return nil, err
		}
		return updated, nil
	}

	customer := &domain.Customer{
		Name:         strings.TrimSpace(profile.Name),
		Email:        strings.TrimSpace(strings.ToLower(profile.Email)),
		Tier:         "bronze",
		GoogleID:     strings.TrimSpace(profile.Sub),
		AvatarURL:    strings.TrimSpace(profile.Picture),
		AuthProvider: "google",
		LastLoginAt:  &now,
	}

	created, err := sas.repo.CreateCustomer(ctx, customer)
	if err != nil {
		return nil, err
	}
	if err := sas.invalidateCustomerCache(ctx, created.ID); err != nil {
		return nil, err
	}

	return created, nil
}

func (sas *StoreAuthService) GoogleFrontendRedirect(token string) string {
	base := strings.TrimSpace(sas.google.FrontendRedirect)
	if base == "" {
		return ""
	}

	parsed, err := url.Parse(base)
	if err != nil {
		return fmt.Sprintf("%s?token=%s", base, url.QueryEscape(token))
	}

	query := parsed.Query()
	query.Set("token", token)
	parsed.RawQuery = query.Encode()
	return parsed.String()
}
