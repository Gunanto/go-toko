package http

import (
	"bytes"
	"errors"
	"fmt"
	"io"
	"net/http"
	"path"
	"strings"
	"time"

	"github.com/bagashiz/go-pos/internal/core/domain"
	"github.com/bagashiz/go-pos/internal/core/port"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const maxProductImageSize = 10 << 20

type UploadHandler struct {
	storage port.ObjectStorage
}

type uploadResponse struct {
	URL         string `json:"url" example:"https://files.example.com/products/2026/03/uuid.webp"`
	ObjectKey   string `json:"object_key" example:"products/2026/03/uuid.webp"`
	ContentType string `json:"content_type" example:"image/webp"`
	Size        int64  `json:"size" example:"524288"`
}

func NewUploadHandler(storage port.ObjectStorage) *UploadHandler {
	return &UploadHandler{storage: storage}
}

func (uh *UploadHandler) UploadProductImage(ctx *gin.Context) {
	if uh.storage == nil || !uh.storage.Enabled() {
		handleError(ctx, domain.ErrFeatureDisabled)
		return
	}

	fileHeader, err := ctx.FormFile("file")
	if err != nil {
		validationError(ctx, errors.New("product image file is required"))
		return
	}
	if fileHeader.Size <= 0 {
		validationError(ctx, errors.New("product image file is empty"))
		return
	}
	if fileHeader.Size > maxProductImageSize {
		validationError(ctx, errors.New("product image must be 10MB or smaller"))
		return
	}

	file, err := fileHeader.Open()
	if err != nil {
		handleError(ctx, domain.ErrInternal)
		return
	}
	defer file.Close()

	payload, err := io.ReadAll(io.LimitReader(file, maxProductImageSize+1))
	if err != nil {
		handleError(ctx, domain.ErrInternal)
		return
	}
	if int64(len(payload)) > maxProductImageSize {
		validationError(ctx, errors.New("product image must be 10MB or smaller"))
		return
	}

	contentType := http.DetectContentType(payload)
	ext, ok := allowedImageExtensions[contentType]
	if !ok {
		validationError(ctx, errors.New("supported formats are jpg, png, webp, and gif"))
		return
	}

	objectKey := fmt.Sprintf(
		"products/%s/%s%s",
		time.Now().Format("2006/01"),
		uuid.NewString(),
		normalizedFileExtension(fileHeader.Filename, ext),
	)

	result, err := uh.storage.Upload(ctx, port.ObjectUploadInput{
		ObjectKey:   objectKey,
		ContentType: contentType,
		Reader:      bytes.NewReader(payload),
		Size:        int64(len(payload)),
	})
	if err != nil {
		handleError(ctx, domain.ErrInternal)
		return
	}

	handleSuccess(ctx, uploadResponse{
		URL:         result.URL,
		ObjectKey:   result.ObjectKey,
		ContentType: result.ContentType,
		Size:        result.Size,
	})
}

var allowedImageExtensions = map[string]string{
	"image/gif":  ".gif",
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/webp": ".webp",
}

func normalizedFileExtension(filename, fallback string) string {
	ext := strings.ToLower(path.Ext(strings.TrimSpace(filename)))
	switch ext {
	case ".gif", ".jpeg", ".jpg", ".png", ".webp":
		if ext == ".jpeg" {
			return ".jpg"
		}
		return ext
	default:
		return fallback
	}
}
