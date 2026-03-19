package port

import (
	"context"
	"time"

	"github.com/bagashiz/go-pos/internal/core/domain"
)

type StoreConversationListFilter struct {
	Status string
}

type StoreConversationSummaryInput struct {
	ConversationID      uint64
	LastMessageAt       time.Time
	LastMessagePreview  string
	CustomerUnreadCount uint64
	AdminUnreadCount    uint64
}

type StoreConversationRepository interface {
	GetByCustomerID(ctx context.Context, customerID uint64) (*domain.StoreConversation, error)
	GetByID(ctx context.Context, id uint64) (*domain.StoreConversation, error)
	Create(ctx context.Context, conversation *domain.StoreConversation) (*domain.StoreConversation, error)
	List(ctx context.Context, filter StoreConversationListFilter, skip, limit uint64) ([]domain.StoreConversation, error)
	UpdateConversationSummary(ctx context.Context, input StoreConversationSummaryInput) (*domain.StoreConversation, error)
	IncrementUnreadForAdmin(ctx context.Context, conversationID uint64) error
	IncrementUnreadForCustomer(ctx context.Context, conversationID uint64) error
	ResetUnreadForAdmin(ctx context.Context, conversationID uint64) error
	ResetUnreadForCustomer(ctx context.Context, conversationID uint64) error
}

type StoreMessageRepository interface {
	Create(ctx context.Context, message *domain.StoreMessage) (*domain.StoreMessage, error)
	ListByConversationID(ctx context.Context, conversationID, skip, limit uint64) ([]domain.StoreMessage, error)
}

type StoreChatService interface {
	OpenConversationForCustomer(ctx context.Context, customerID uint64) (*domain.StoreConversation, error)
	ListCustomerMessages(ctx context.Context, customerID, skip, limit uint64) ([]domain.StoreMessage, error)
	SendCustomerMessage(ctx context.Context, customerID uint64, body string) (*domain.StoreMessage, error)
	ListAdminConversations(ctx context.Context, skip, limit uint64, status string) ([]domain.StoreConversation, error)
	ListAdminMessages(ctx context.Context, conversationID, skip, limit uint64) ([]domain.StoreMessage, error)
	SendAdminMessage(ctx context.Context, userID, conversationID uint64, body string) (*domain.StoreMessage, error)
	MarkCustomerRead(ctx context.Context, customerID uint64) error
	MarkAdminRead(ctx context.Context, conversationID uint64) error
}
