package service_test

import (
	"context"
	"testing"
	"time"

	"github.com/bagashiz/go-pos/internal/core/domain"
	"github.com/bagashiz/go-pos/internal/core/port"
	"github.com/bagashiz/go-pos/internal/core/service"
	"github.com/stretchr/testify/assert"
)

type stubStoreConversationRepo struct {
	getByCustomerIDFn           func(ctx context.Context, customerID uint64) (*domain.StoreConversation, error)
	getByIDFn                   func(ctx context.Context, id uint64) (*domain.StoreConversation, error)
	createFn                    func(ctx context.Context, conversation *domain.StoreConversation) (*domain.StoreConversation, error)
	listFn                      func(ctx context.Context, filter port.StoreConversationListFilter, skip, limit uint64) ([]domain.StoreConversation, error)
	updateConversationSummaryFn func(ctx context.Context, input port.StoreConversationSummaryInput) (*domain.StoreConversation, error)
}

func (s *stubStoreConversationRepo) GetByCustomerID(ctx context.Context, customerID uint64) (*domain.StoreConversation, error) {
	return s.getByCustomerIDFn(ctx, customerID)
}

func (s *stubStoreConversationRepo) GetByID(ctx context.Context, id uint64) (*domain.StoreConversation, error) {
	return s.getByIDFn(ctx, id)
}

func (s *stubStoreConversationRepo) Create(ctx context.Context, conversation *domain.StoreConversation) (*domain.StoreConversation, error) {
	return s.createFn(ctx, conversation)
}

func (s *stubStoreConversationRepo) List(ctx context.Context, filter port.StoreConversationListFilter, skip, limit uint64) ([]domain.StoreConversation, error) {
	return s.listFn(ctx, filter, skip, limit)
}

func (s *stubStoreConversationRepo) UpdateConversationSummary(ctx context.Context, input port.StoreConversationSummaryInput) (*domain.StoreConversation, error) {
	return s.updateConversationSummaryFn(ctx, input)
}

func (s *stubStoreConversationRepo) IncrementUnreadForAdmin(ctx context.Context, conversationID uint64) error {
	return nil
}

func (s *stubStoreConversationRepo) IncrementUnreadForCustomer(ctx context.Context, conversationID uint64) error {
	return nil
}

func (s *stubStoreConversationRepo) ResetUnreadForAdmin(ctx context.Context, conversationID uint64) error {
	return nil
}

func (s *stubStoreConversationRepo) ResetUnreadForCustomer(ctx context.Context, conversationID uint64) error {
	return nil
}

type stubStoreMessageRepo struct {
	createFn               func(ctx context.Context, message *domain.StoreMessage) (*domain.StoreMessage, error)
	listByConversationIDFn func(ctx context.Context, conversationID, skip, limit uint64) ([]domain.StoreMessage, error)
}

func (s *stubStoreMessageRepo) Create(ctx context.Context, message *domain.StoreMessage) (*domain.StoreMessage, error) {
	return s.createFn(ctx, message)
}

func (s *stubStoreMessageRepo) ListByConversationID(ctx context.Context, conversationID, skip, limit uint64) ([]domain.StoreMessage, error) {
	return s.listByConversationIDFn(ctx, conversationID, skip, limit)
}

type stubUserRepo struct {
	getUserByIDFn func(ctx context.Context, id uint64) (*domain.User, error)
}

func (s *stubUserRepo) CreateUser(ctx context.Context, user *domain.User) (*domain.User, error) {
	panic("unexpected call")
}

func (s *stubUserRepo) GetUserByID(ctx context.Context, id uint64) (*domain.User, error) {
	return s.getUserByIDFn(ctx, id)
}

func (s *stubUserRepo) GetUserByEmail(ctx context.Context, email string) (*domain.User, error) {
	panic("unexpected call")
}

func (s *stubUserRepo) GetUserByUsername(ctx context.Context, username string) (*domain.User, error) {
	panic("unexpected call")
}

func (s *stubUserRepo) ListUsers(ctx context.Context, skip, limit uint64) ([]domain.User, error) {
	panic("unexpected call")
}

func (s *stubUserRepo) UpdateUser(ctx context.Context, user *domain.User) (*domain.User, error) {
	panic("unexpected call")
}

func (s *stubUserRepo) DeleteUser(ctx context.Context, id uint64) error {
	panic("unexpected call")
}

func TestStoreChatService_SendCustomerMessage(t *testing.T) {
	ctx := context.Background()
	now := time.Now().UTC()
	customerID := uint64(10)
	conversationID := uint64(99)
	var updatedInput port.StoreConversationSummaryInput

	conversationRepo := &stubStoreConversationRepo{
		getByCustomerIDFn: func(ctx context.Context, gotCustomerID uint64) (*domain.StoreConversation, error) {
			assert.Equal(t, customerID, gotCustomerID)
			return &domain.StoreConversation{
				ID:               conversationID,
				CustomerID:       customerID,
				Status:           domain.StoreConversationStatusOpen,
				AdminUnreadCount: 4,
				CreatedAt:        now,
				UpdatedAt:        now,
			}, nil
		},
		getByIDFn: func(ctx context.Context, id uint64) (*domain.StoreConversation, error) {
			panic("unexpected call")
		},
		createFn: func(ctx context.Context, conversation *domain.StoreConversation) (*domain.StoreConversation, error) {
			panic("unexpected call")
		},
		listFn: func(ctx context.Context, filter port.StoreConversationListFilter, skip, limit uint64) ([]domain.StoreConversation, error) {
			panic("unexpected call")
		},
		updateConversationSummaryFn: func(ctx context.Context, input port.StoreConversationSummaryInput) (*domain.StoreConversation, error) {
			updatedInput = input
			return &domain.StoreConversation{ID: conversationID}, nil
		},
	}

	messageRepo := &stubStoreMessageRepo{
		createFn: func(ctx context.Context, message *domain.StoreMessage) (*domain.StoreMessage, error) {
			assert.Equal(t, conversationID, message.ConversationID)
			assert.Equal(t, domain.StoreMessageSenderCustomer, message.SenderType)
			assert.Equal(t, "halo admin", message.Body)
			assert.NotNil(t, message.SenderCustomerID)
			assert.Equal(t, customerID, *message.SenderCustomerID)

			return &domain.StoreMessage{
				ID:               1,
				ConversationID:   conversationID,
				SenderType:       domain.StoreMessageSenderCustomer,
				SenderCustomerID: &customerID,
				Body:             message.Body,
				CreatedAt:        now,
			}, nil
		},
		listByConversationIDFn: func(ctx context.Context, conversationID, skip, limit uint64) ([]domain.StoreMessage, error) {
			panic("unexpected call")
		},
	}

	userRepo := &stubUserRepo{
		getUserByIDFn: func(ctx context.Context, id uint64) (*domain.User, error) {
			panic("unexpected call")
		},
	}

	svc := service.NewStoreChatService(conversationRepo, messageRepo, userRepo)
	message, err := svc.SendCustomerMessage(ctx, customerID, "  halo admin  ")

	assert.NoError(t, err)
	assert.NotNil(t, message)
	assert.Equal(t, uint64(1), message.ID)
	assert.Equal(t, conversationID, updatedInput.ConversationID)
	assert.Equal(t, "halo admin", updatedInput.LastMessagePreview)
	assert.Equal(t, uint64(0), updatedInput.CustomerUnreadCount)
	assert.Equal(t, uint64(5), updatedInput.AdminUnreadCount)
}

func TestStoreChatService_SendAdminMessageRejectsNonAdmin(t *testing.T) {
	ctx := context.Background()

	conversationRepo := &stubStoreConversationRepo{
		getByCustomerIDFn: func(ctx context.Context, customerID uint64) (*domain.StoreConversation, error) {
			panic("unexpected call")
		},
		getByIDFn: func(ctx context.Context, id uint64) (*domain.StoreConversation, error) {
			panic("unexpected call")
		},
		createFn: func(ctx context.Context, conversation *domain.StoreConversation) (*domain.StoreConversation, error) {
			panic("unexpected call")
		},
		listFn: func(ctx context.Context, filter port.StoreConversationListFilter, skip, limit uint64) ([]domain.StoreConversation, error) {
			panic("unexpected call")
		},
		updateConversationSummaryFn: func(ctx context.Context, input port.StoreConversationSummaryInput) (*domain.StoreConversation, error) {
			panic("unexpected call")
		},
	}
	messageRepo := &stubStoreMessageRepo{
		createFn: func(ctx context.Context, message *domain.StoreMessage) (*domain.StoreMessage, error) {
			panic("unexpected call")
		},
		listByConversationIDFn: func(ctx context.Context, conversationID, skip, limit uint64) ([]domain.StoreMessage, error) {
			panic("unexpected call")
		},
	}
	userRepo := &stubUserRepo{
		getUserByIDFn: func(ctx context.Context, id uint64) (*domain.User, error) {
			return &domain.User{ID: id, Role: domain.Cashier}, nil
		},
	}

	svc := service.NewStoreChatService(conversationRepo, messageRepo, userRepo)
	message, err := svc.SendAdminMessage(ctx, 1, 2, "test")

	assert.ErrorIs(t, err, domain.ErrForbidden)
	assert.Nil(t, message)
}

func TestStoreChatService_OpenConversationForCustomerCreatesOnDemand(t *testing.T) {
	ctx := context.Background()
	now := time.Now().UTC()
	customerID := uint64(21)
	conversationID := uint64(201)
	createCalled := false

	conversationRepo := &stubStoreConversationRepo{
		getByCustomerIDFn: func(ctx context.Context, gotCustomerID uint64) (*domain.StoreConversation, error) {
			assert.Equal(t, customerID, gotCustomerID)
			if createCalled {
				return &domain.StoreConversation{
					ID:         conversationID,
					CustomerID: customerID,
					Status:     domain.StoreConversationStatusOpen,
					CreatedAt:  now,
					UpdatedAt:  now,
				}, nil
			}
			return nil, domain.ErrDataNotFound
		},
		getByIDFn: func(ctx context.Context, id uint64) (*domain.StoreConversation, error) {
			assert.Equal(t, conversationID, id)
			return &domain.StoreConversation{
				ID:         conversationID,
				CustomerID: customerID,
				Status:     domain.StoreConversationStatusOpen,
				CreatedAt:  now,
				UpdatedAt:  now,
			}, nil
		},
		createFn: func(ctx context.Context, conversation *domain.StoreConversation) (*domain.StoreConversation, error) {
			createCalled = true
			assert.Equal(t, customerID, conversation.CustomerID)
			assert.Equal(t, domain.StoreConversationStatusOpen, conversation.Status)
			return &domain.StoreConversation{
				ID:         conversationID,
				CustomerID: customerID,
				Status:     domain.StoreConversationStatusOpen,
				CreatedAt:  now,
				UpdatedAt:  now,
			}, nil
		},
		listFn: func(ctx context.Context, filter port.StoreConversationListFilter, skip, limit uint64) ([]domain.StoreConversation, error) {
			panic("unexpected call")
		},
		updateConversationSummaryFn: func(ctx context.Context, input port.StoreConversationSummaryInput) (*domain.StoreConversation, error) {
			panic("unexpected call")
		},
	}
	messageRepo := &stubStoreMessageRepo{
		createFn: func(ctx context.Context, message *domain.StoreMessage) (*domain.StoreMessage, error) {
			panic("unexpected call")
		},
		listByConversationIDFn: func(ctx context.Context, conversationID, skip, limit uint64) ([]domain.StoreMessage, error) {
			panic("unexpected call")
		},
	}
	userRepo := &stubUserRepo{
		getUserByIDFn: func(ctx context.Context, id uint64) (*domain.User, error) {
			panic("unexpected call")
		},
	}

	svc := service.NewStoreChatService(conversationRepo, messageRepo, userRepo)
	conversation, err := svc.OpenConversationForCustomer(ctx, customerID)

	assert.NoError(t, err)
	assert.True(t, createCalled)
	assert.NotNil(t, conversation)
	assert.Equal(t, conversationID, conversation.ID)
}

func TestStoreChatService_SendAdminMessageUpdatesUnreadSummary(t *testing.T) {
	ctx := context.Background()
	now := time.Now().UTC()
	userID := uint64(7)
	conversationID := uint64(301)
	var updatedInput port.StoreConversationSummaryInput

	conversationRepo := &stubStoreConversationRepo{
		getByCustomerIDFn: func(ctx context.Context, customerID uint64) (*domain.StoreConversation, error) {
			panic("unexpected call")
		},
		getByIDFn: func(ctx context.Context, id uint64) (*domain.StoreConversation, error) {
			assert.Equal(t, conversationID, id)
			return &domain.StoreConversation{
				ID:                  conversationID,
				CustomerID:          11,
				Status:              domain.StoreConversationStatusOpen,
				CustomerUnreadCount: 2,
				AdminUnreadCount:    3,
				CreatedAt:           now,
				UpdatedAt:           now,
			}, nil
		},
		createFn: func(ctx context.Context, conversation *domain.StoreConversation) (*domain.StoreConversation, error) {
			panic("unexpected call")
		},
		listFn: func(ctx context.Context, filter port.StoreConversationListFilter, skip, limit uint64) ([]domain.StoreConversation, error) {
			panic("unexpected call")
		},
		updateConversationSummaryFn: func(ctx context.Context, input port.StoreConversationSummaryInput) (*domain.StoreConversation, error) {
			updatedInput = input
			return &domain.StoreConversation{ID: conversationID}, nil
		},
	}
	messageRepo := &stubStoreMessageRepo{
		createFn: func(ctx context.Context, message *domain.StoreMessage) (*domain.StoreMessage, error) {
			assert.Equal(t, domain.StoreMessageSenderAdmin, message.SenderType)
			assert.NotNil(t, message.SenderUserID)
			assert.Equal(t, userID, *message.SenderUserID)
			assert.Equal(t, "siap diproses", message.Body)
			return &domain.StoreMessage{
				ID:             401,
				ConversationID: conversationID,
				SenderType:     domain.StoreMessageSenderAdmin,
				SenderUserID:   &userID,
				Body:           message.Body,
				CreatedAt:      now,
			}, nil
		},
		listByConversationIDFn: func(ctx context.Context, conversationID, skip, limit uint64) ([]domain.StoreMessage, error) {
			panic("unexpected call")
		},
	}
	userRepo := &stubUserRepo{
		getUserByIDFn: func(ctx context.Context, id uint64) (*domain.User, error) {
			assert.Equal(t, userID, id)
			return &domain.User{ID: userID, Role: domain.Admin}, nil
		},
	}

	svc := service.NewStoreChatService(conversationRepo, messageRepo, userRepo)
	message, err := svc.SendAdminMessage(ctx, userID, conversationID, "  siap diproses  ")

	assert.NoError(t, err)
	assert.NotNil(t, message)
	assert.Equal(t, uint64(401), message.ID)
	assert.Equal(t, conversationID, updatedInput.ConversationID)
	assert.Equal(t, "siap diproses", updatedInput.LastMessagePreview)
	assert.Equal(t, uint64(3), updatedInput.CustomerUnreadCount)
	assert.Equal(t, uint64(0), updatedInput.AdminUnreadCount)
}

func TestStoreChatService_MarkReadResetsUnreadCounter(t *testing.T) {
	ctx := context.Background()
	now := time.Now().UTC()
	customerID := uint64(15)
	conversationID := uint64(501)
	lastMessageAt := now.Add(-5 * time.Minute)
	var customerReadInput port.StoreConversationSummaryInput
	var adminReadInput port.StoreConversationSummaryInput

	conversationRepo := &stubStoreConversationRepo{
		getByCustomerIDFn: func(ctx context.Context, gotCustomerID uint64) (*domain.StoreConversation, error) {
			assert.Equal(t, customerID, gotCustomerID)
			return &domain.StoreConversation{
				ID:                  conversationID,
				CustomerID:          customerID,
				Status:              domain.StoreConversationStatusOpen,
				LastMessageAt:       &lastMessageAt,
				LastMessagePreview:  "halo",
				CustomerUnreadCount: 4,
				AdminUnreadCount:    1,
				CreatedAt:           now,
				UpdatedAt:           now,
			}, nil
		},
		getByIDFn: func(ctx context.Context, id uint64) (*domain.StoreConversation, error) {
			assert.Equal(t, conversationID, id)
			return &domain.StoreConversation{
				ID:                  conversationID,
				CustomerID:          customerID,
				Status:              domain.StoreConversationStatusOpen,
				LastMessageAt:       &lastMessageAt,
				LastMessagePreview:  "halo",
				CustomerUnreadCount: 2,
				AdminUnreadCount:    5,
				CreatedAt:           now,
				UpdatedAt:           now,
			}, nil
		},
		createFn: func(ctx context.Context, conversation *domain.StoreConversation) (*domain.StoreConversation, error) {
			panic("unexpected call")
		},
		listFn: func(ctx context.Context, filter port.StoreConversationListFilter, skip, limit uint64) ([]domain.StoreConversation, error) {
			panic("unexpected call")
		},
		updateConversationSummaryFn: func(ctx context.Context, input port.StoreConversationSummaryInput) (*domain.StoreConversation, error) {
			if input.AdminUnreadCount == 1 {
				customerReadInput = input
			} else {
				adminReadInput = input
			}
			return &domain.StoreConversation{ID: input.ConversationID}, nil
		},
	}
	messageRepo := &stubStoreMessageRepo{
		createFn: func(ctx context.Context, message *domain.StoreMessage) (*domain.StoreMessage, error) {
			panic("unexpected call")
		},
		listByConversationIDFn: func(ctx context.Context, conversationID, skip, limit uint64) ([]domain.StoreMessage, error) {
			panic("unexpected call")
		},
	}
	userRepo := &stubUserRepo{
		getUserByIDFn: func(ctx context.Context, id uint64) (*domain.User, error) {
			panic("unexpected call")
		},
	}

	svc := service.NewStoreChatService(conversationRepo, messageRepo, userRepo)

	err := svc.MarkCustomerRead(ctx, customerID)
	assert.NoError(t, err)
	assert.Equal(t, uint64(0), customerReadInput.CustomerUnreadCount)
	assert.Equal(t, uint64(1), customerReadInput.AdminUnreadCount)
	assert.Equal(t, "halo", customerReadInput.LastMessagePreview)

	err = svc.MarkAdminRead(ctx, conversationID)
	assert.NoError(t, err)
	assert.Equal(t, uint64(2), adminReadInput.CustomerUnreadCount)
	assert.Equal(t, uint64(0), adminReadInput.AdminUnreadCount)
	assert.Equal(t, "halo", adminReadInput.LastMessagePreview)
}
