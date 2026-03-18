package http

import (
	"strings"

	"github.com/bagashiz/go-pos/internal/core/domain"
	"github.com/bagashiz/go-pos/internal/core/port"
	"github.com/gin-gonic/gin"
)

const (
	// authorizationHeaderKey is the key for authorization header in the request
	authorizationHeaderKey = "authorization"
	// authorizationType is the accepted authorization type
	authorizationType = "bearer"
	// authorizationPayloadKey is the key for authorization payload in the context
	authorizationPayloadKey         = "authorization_payload"
	customerAuthorizationPayloadKey = "customer_authorization_payload"
)

// authMiddleware is a middleware to check if the user is authenticated
func authMiddleware(token port.TokenService) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		authorizationHeader := ctx.GetHeader(authorizationHeaderKey)

		isEmpty := len(authorizationHeader) == 0
		if isEmpty {
			err := domain.ErrEmptyAuthorizationHeader
			handleAbort(ctx, err)
			return
		}

		fields := strings.Fields(authorizationHeader)
		isValid := len(fields) == 2
		if !isValid {
			err := domain.ErrInvalidAuthorizationHeader
			handleAbort(ctx, err)
			return
		}

		currentAuthorizationType := strings.ToLower(fields[0])
		if currentAuthorizationType != authorizationType {
			err := domain.ErrInvalidAuthorizationType
			handleAbort(ctx, err)
			return
		}

		accessToken := fields[1]
		payload, err := token.VerifyToken(accessToken)
		if err != nil {
			handleAbort(ctx, err)
			return
		}
		if payload.Subject != "user" {
			handleAbort(ctx, domain.ErrUnauthorized)
			return
		}

		ctx.Set(authorizationPayloadKey, payload)
		ctx.Next()
	}
}

func customerAuthMiddleware(token port.TokenService) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		authorizationHeader := ctx.GetHeader(authorizationHeaderKey)
		if len(authorizationHeader) == 0 {
			handleAbort(ctx, domain.ErrEmptyAuthorizationHeader)
			return
		}

		fields := strings.Fields(authorizationHeader)
		if len(fields) != 2 {
			handleAbort(ctx, domain.ErrInvalidAuthorizationHeader)
			return
		}

		if strings.ToLower(fields[0]) != authorizationType {
			handleAbort(ctx, domain.ErrInvalidAuthorizationType)
			return
		}

		payload, err := token.VerifyToken(fields[1])
		if err != nil {
			handleAbort(ctx, err)
			return
		}
		if payload.Subject != "customer" || payload.CustomerID == 0 {
			handleAbort(ctx, domain.ErrUnauthorized)
			return
		}

		ctx.Set(customerAuthorizationPayloadKey, payload)
		ctx.Next()
	}
}

// adminMiddleware is a middleware to check if the user is an admin
func adminMiddleware() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		payload := getAuthPayload(ctx, authorizationPayloadKey)

		isAdmin := payload.Role == domain.Admin
		if !isAdmin {
			err := domain.ErrForbidden
			handleAbort(ctx, err)
			return
		}

		ctx.Next()
	}
}
