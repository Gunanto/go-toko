package object

import (
	"context"
	"fmt"
	"net/url"
	"path"
	"strings"
	"time"

	"github.com/bagashiz/go-pos/internal/adapter/config"
	"github.com/bagashiz/go-pos/internal/core/port"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type MinIO struct {
	client        *minio.Client
	endpoint      string
	bucket        string
	useSSL        bool
	publicBaseURL string
}

func NewMinIO(cfg *config.Storage) (*MinIO, error) {
	if cfg == nil || strings.TrimSpace(cfg.Driver) == "" {
		return nil, nil
	}
	if strings.TrimSpace(cfg.Driver) != "minio" {
		return nil, fmt.Errorf("unsupported storage driver: %s", cfg.Driver)
	}
	if strings.TrimSpace(cfg.Endpoint) == "" ||
		strings.TrimSpace(cfg.AccessKey) == "" ||
		strings.TrimSpace(cfg.SecretKey) == "" ||
		strings.TrimSpace(cfg.Bucket) == "" {
		return nil, fmt.Errorf("minio storage config is incomplete")
	}

	client, err := minio.New(cfg.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.AccessKey, cfg.SecretKey, ""),
		Secure: cfg.UseSSL,
	})
	if err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	exists, err := client.BucketExists(ctx, cfg.Bucket)
	if err != nil {
		return nil, err
	}
	if !exists {
		if err := client.MakeBucket(ctx, cfg.Bucket, minio.MakeBucketOptions{}); err != nil {
			return nil, err
		}
	}

	return &MinIO{
		client:        client,
		endpoint:      cfg.Endpoint,
		bucket:        cfg.Bucket,
		useSSL:        cfg.UseSSL,
		publicBaseURL: strings.TrimSpace(cfg.PublicBaseURL),
	}, nil
}

func (m *MinIO) Enabled() bool {
	return m != nil && m.client != nil
}

func (m *MinIO) Upload(ctx context.Context, input port.ObjectUploadInput) (*port.ObjectUploadResult, error) {
	if !m.Enabled() {
		return nil, fmt.Errorf("object storage is not configured")
	}

	info, err := m.client.PutObject(ctx, m.bucket, input.ObjectKey, input.Reader, input.Size, minio.PutObjectOptions{
		ContentType: input.ContentType,
	})
	if err != nil {
		return nil, err
	}

	return &port.ObjectUploadResult{
		ObjectKey:   input.ObjectKey,
		URL:         m.publicURL(input.ObjectKey),
		ContentType: input.ContentType,
		Size:        info.Size,
	}, nil
}

func (m *MinIO) publicURL(objectKey string) string {
	if m.publicBaseURL != "" {
		return strings.TrimRight(m.publicBaseURL, "/") + "/" + strings.TrimLeft(objectKey, "/")
	}

	scheme := "http"
	if m.useSSL {
		scheme = "https"
	}

	u := &url.URL{
		Scheme: scheme,
		Host:   m.endpoint,
		Path:   "/" + path.Join(m.bucket, objectKey),
	}

	return u.String()
}
