package http

import (
	"net/http"
	"net/url"
	"strings"

	"github.com/bagashiz/go-pos/internal/core/domain"
	"github.com/bagashiz/go-pos/internal/core/port"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type StoreAuthHandler struct {
	svc port.StoreAuthService
}

const (
	storeGoogleStateCookieKey    = "store_google_oauth_state"
	storeGoogleRedirectCookieKey = "store_google_oauth_redirect"
)

func NewStoreAuthHandler(svc port.StoreAuthService) *StoreAuthHandler {
	return &StoreAuthHandler{svc: svc}
}

type storeRegisterRequest struct {
	Name     string `json:"name" binding:"required" example:"John Doe"`
	Phone    string `json:"phone" binding:"omitempty" example:"0812-3344-2211"`
	Email    string `json:"email" binding:"omitempty,email" example:"john@example.com"`
	Address  string `json:"address" binding:"omitempty" example:"Jl. Merdeka No. 45, Bandung"`
	Password string `json:"password" binding:"required,min=8" example:"12345678"`
}

type storeLoginRequest struct {
	Login    string `json:"login" binding:"required" example:"john@example.com"`
	Password string `json:"password" binding:"required,min=8" example:"12345678"`
}

type storeGoogleStartRequest struct {
	Redirect string `form:"redirect" binding:"omitempty" example:"/store/account"`
}

func (sah *StoreAuthHandler) Register(ctx *gin.Context) {
	var req storeRegisterRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		validationError(ctx, err)
		return
	}
	if strings.TrimSpace(req.Email) == "" && strings.TrimSpace(req.Phone) == "" {
		validationError(ctx, domain.ErrNoUpdatedData)
		return
	}

	customer := &domain.Customer{
		Name:         req.Name,
		Phone:        req.Phone,
		Email:        req.Email,
		Address:      req.Address,
		AuthProvider: "password",
	}

	created, token, err := sah.svc.Register(ctx, customer, req.Password)
	if err != nil {
		handleError(ctx, err)
		return
	}

	handleSuccess(ctx, map[string]any{
		"token":    token,
		"customer": newCustomerResponse(created),
	})
}

func (sah *StoreAuthHandler) Options(ctx *gin.Context) {
	handleSuccess(ctx, gin.H{
		"google_enabled": sah.svc.IsGoogleOAuthEnabled(),
	})
}

func (sah *StoreAuthHandler) Login(ctx *gin.Context) {
	var req storeLoginRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		validationError(ctx, err)
		return
	}

	token, err := sah.svc.Login(ctx, req.Login, req.Password)
	if err != nil {
		handleError(ctx, err)
		return
	}

	handleSuccess(ctx, newAuthResponse(token))
}

func (sah *StoreAuthHandler) GetMe(ctx *gin.Context) {
	payload := getAuthPayload(ctx, customerAuthorizationPayloadKey)

	customer, err := sah.svc.GetMe(ctx, payload.CustomerID)
	if err != nil {
		handleError(ctx, err)
		return
	}

	handleSuccess(ctx, newCustomerResponse(customer))
}

func (sah *StoreAuthHandler) GoogleStart(ctx *gin.Context) {
	if !sah.svc.IsGoogleOAuthEnabled() {
		handleError(ctx, domain.ErrFeatureDisabled)
		return
	}

	var req storeGoogleStartRequest
	if err := ctx.ShouldBindQuery(&req); err != nil {
		validationError(ctx, err)
		return
	}

	redirect := strings.TrimSpace(req.Redirect)
	if redirect == "" {
		redirect = "/store/account"
	}

	state := uuid.NewString()
	authURL, err := sah.svc.GetGoogleAuthURL(state)
	if err != nil {
		handleError(ctx, err)
		return
	}

	ctx.SetSameSite(http.SameSiteLaxMode)
	ctx.SetCookie(storeGoogleStateCookieKey, state, 600, "/", "", false, true)
	ctx.SetCookie(storeGoogleRedirectCookieKey, redirect, 600, "/", "", false, true)
	ctx.Redirect(http.StatusTemporaryRedirect, authURL)
}

func (sah *StoreAuthHandler) GoogleCallback(ctx *gin.Context) {
	if !sah.svc.IsGoogleOAuthEnabled() {
		handleError(ctx, domain.ErrFeatureDisabled)
		return
	}

	state := strings.TrimSpace(ctx.Query("state"))
	code := strings.TrimSpace(ctx.Query("code"))
	if state == "" || code == "" {
		handleError(ctx, domain.ErrInvalidCredentials)
		return
	}

	expectedState, err := ctx.Cookie(storeGoogleStateCookieKey)
	if err != nil || expectedState != state {
		handleError(ctx, domain.ErrUnauthorized)
		return
	}

	_, token, err := sah.svc.LoginWithGoogle(ctx, code)
	if err != nil {
		handleError(ctx, err)
		return
	}

	redirect := sah.svc.GoogleFrontendRedirect(token)
	if redirect == "" {
		handleError(ctx, domain.ErrInternal)
		return
	}

	if redirectHint, err := ctx.Cookie(storeGoogleRedirectCookieKey); err == nil && strings.TrimSpace(redirectHint) != "" {
		redirect = appendStoreGoogleRedirect(redirect, redirectHint)
	}

	ctx.SetSameSite(http.SameSiteLaxMode)
	ctx.SetCookie(storeGoogleStateCookieKey, "", -1, "/", "", false, true)
	ctx.SetCookie(storeGoogleRedirectCookieKey, "", -1, "/", "", false, true)
	ctx.Redirect(http.StatusTemporaryRedirect, redirect)
}

func appendStoreGoogleRedirect(baseURL, next string) string {
	parsed, err := url.Parse(baseURL)
	if err != nil {
		return baseURL
	}

	query := parsed.Query()
	query.Set("redirect", next)
	parsed.RawQuery = query.Encode()
	return parsed.String()
}
