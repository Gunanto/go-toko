package port

import (
	"context"
	"io"
)

type ObjectUploadInput struct {
	ObjectKey   string
	ContentType string
	Reader      io.Reader
	Size        int64
}

type ObjectUploadResult struct {
	ObjectKey   string
	URL         string
	ContentType string
	Size        int64
}

type ObjectStorage interface {
	Upload(ctx context.Context, input ObjectUploadInput) (*ObjectUploadResult, error)
	Enabled() bool
}
