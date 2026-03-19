package service

import (
	"context"
	"strings"
	"time"

	"github.com/bagashiz/go-pos/internal/core/domain"
	"github.com/bagashiz/go-pos/internal/core/port"
)

const maxStoreChatMessageLength = 2000

type StoreChatService struct {
	conversationRepo port.StoreConversationRepository
	messageRepo      port.StoreMessageRepository
	userRepo         port.UserRepository
}

func NewStoreChatService(conversationRepo port.StoreConversationRepository, messageRepo port.StoreMessageRepository, userRepo port.UserRepository) *StoreChatService {
	return &StoreChatService{
		conversationRepo: conversationRepo,
		messageRepo:      messageRepo,
		userRepo:         userRepo,
	}
}

func (s *StoreChatService) OpenConversationForCustomer(ctx context.Context, customerID uint64) (*domain.StoreConversation, error) {
	conversation, err := s.conversationRepo.GetByCustomerID(ctx, customerID)
	if err == nil {
		return conversation, nil
	}
	if err != domain.ErrDataNotFound {
		return nil, domain.ErrInternal
	}

	created, err := s.conversationRepo.Create(ctx, &domain.StoreConversation{
		CustomerID: customerID,
		Status:     domain.StoreConversationStatusOpen,
	})
	if err != nil {
		if err == domain.ErrConflictingData {
			return s.conversationRepo.GetByCustomerID(ctx, customerID)
		}
		return nil, domain.ErrInternal
	}

	return created, nil
}

func (s *StoreChatService) ListCustomerMessages(ctx context.Context, customerID, skip, limit uint64) ([]domain.StoreMessage, error) {
	conversation, err := s.OpenConversationForCustomer(ctx, customerID)
	if err != nil {
		return nil, err
	}

	messages, err := s.messageRepo.ListByConversationID(ctx, conversation.ID, skip, limit)
	if err != nil {
		return nil, domain.ErrInternal
	}

	return messages, nil
}

func (s *StoreChatService) SendCustomerMessage(ctx context.Context, customerID uint64, body string) (*domain.StoreMessage, error) {
	conversation, err := s.OpenConversationForCustomer(ctx, customerID)
	if err != nil {
		return nil, err
	}

	body, err = sanitizeStoreMessageBody(body)
	if err != nil {
		return nil, err
	}

	message := &domain.StoreMessage{
		ConversationID:   conversation.ID,
		SenderType:       domain.StoreMessageSenderCustomer,
		SenderCustomerID: &customerID,
		Body:             body,
	}

	created, err := s.messageRepo.Create(ctx, message)
	if err != nil {
		return nil, domain.ErrInternal
	}

	_, err = s.conversationRepo.UpdateConversationSummary(ctx, port.StoreConversationSummaryInput{
		ConversationID:      conversation.ID,
		LastMessageAt:       created.CreatedAt,
		LastMessagePreview:  body,
		CustomerUnreadCount: 0,
		AdminUnreadCount:    conversation.AdminUnreadCount + 1,
	})
	if err != nil {
		return nil, domain.ErrInternal
	}

	return created, nil
}

func (s *StoreChatService) ListAdminConversations(ctx context.Context, skip, limit uint64, status string) ([]domain.StoreConversation, error) {
	filter := port.StoreConversationListFilter{
		Status: strings.TrimSpace(status),
	}
	if filter.Status == string(domain.StoreConversationStatusOpen) || filter.Status == "" {
	} else {
		filter.Status = strings.TrimSpace(status)
	}

	conversations, err := s.conversationRepo.List(ctx, filter, skip, limit)
	if err != nil {
		return nil, domain.ErrInternal
	}

	return conversations, nil
}

func (s *StoreChatService) ListAdminMessages(ctx context.Context, conversationID, skip, limit uint64) ([]domain.StoreMessage, error) {
	_, err := s.conversationRepo.GetByID(ctx, conversationID)
	if err != nil {
		if err == domain.ErrDataNotFound {
			return nil, err
		}
		return nil, domain.ErrInternal
	}

	messages, err := s.messageRepo.ListByConversationID(ctx, conversationID, skip, limit)
	if err != nil {
		return nil, domain.ErrInternal
	}

	return messages, nil
}

func (s *StoreChatService) SendAdminMessage(ctx context.Context, userID, conversationID uint64, body string) (*domain.StoreMessage, error) {
	user, err := s.userRepo.GetUserByID(ctx, userID)
	if err != nil {
		if err == domain.ErrDataNotFound {
			return nil, err
		}
		return nil, domain.ErrInternal
	}
	if user.Role != domain.Admin {
		return nil, domain.ErrForbidden
	}

	conversation, err := s.conversationRepo.GetByID(ctx, conversationID)
	if err != nil {
		if err == domain.ErrDataNotFound {
			return nil, err
		}
		return nil, domain.ErrInternal
	}

	body, err = sanitizeStoreMessageBody(body)
	if err != nil {
		return nil, err
	}

	message := &domain.StoreMessage{
		ConversationID: conversationID,
		SenderType:     domain.StoreMessageSenderAdmin,
		SenderUserID:   &userID,
		Body:           body,
	}

	created, err := s.messageRepo.Create(ctx, message)
	if err != nil {
		return nil, domain.ErrInternal
	}

	_, err = s.conversationRepo.UpdateConversationSummary(ctx, port.StoreConversationSummaryInput{
		ConversationID:      conversation.ID,
		LastMessageAt:       created.CreatedAt,
		LastMessagePreview:  body,
		CustomerUnreadCount: conversation.CustomerUnreadCount + 1,
		AdminUnreadCount:    0,
	})
	if err != nil {
		return nil, domain.ErrInternal
	}

	return created, nil
}

func (s *StoreChatService) MarkCustomerRead(ctx context.Context, customerID uint64) error {
	conversation, err := s.OpenConversationForCustomer(ctx, customerID)
	if err != nil {
		return err
	}

	_, err = s.conversationRepo.UpdateConversationSummary(ctx, port.StoreConversationSummaryInput{
		ConversationID:      conversation.ID,
		LastMessageAt:       lastMessageTime(conversation),
		LastMessagePreview:  conversation.LastMessagePreview,
		CustomerUnreadCount: 0,
		AdminUnreadCount:    conversation.AdminUnreadCount,
	})
	if err != nil {
		return domain.ErrInternal
	}

	return nil
}

func (s *StoreChatService) MarkAdminRead(ctx context.Context, conversationID uint64) error {
	conversation, err := s.conversationRepo.GetByID(ctx, conversationID)
	if err != nil {
		if err == domain.ErrDataNotFound {
			return err
		}
		return domain.ErrInternal
	}

	_, err = s.conversationRepo.UpdateConversationSummary(ctx, port.StoreConversationSummaryInput{
		ConversationID:      conversation.ID,
		LastMessageAt:       lastMessageTime(conversation),
		LastMessagePreview:  conversation.LastMessagePreview,
		CustomerUnreadCount: conversation.CustomerUnreadCount,
		AdminUnreadCount:    0,
	})
	if err != nil {
		return domain.ErrInternal
	}

	return nil
}

func sanitizeStoreMessageBody(body string) (string, error) {
	body = strings.TrimSpace(body)
	if body == "" {
		return "", domain.ErrNoUpdatedData
	}
	if len(body) > maxStoreChatMessageLength {
		return "", domain.ErrNoUpdatedData
	}
	return body, nil
}

func lastMessageTime(conversation *domain.StoreConversation) time.Time {
	if conversation.LastMessageAt != nil {
		return *conversation.LastMessageAt
	}
	return conversation.UpdatedAt
}
