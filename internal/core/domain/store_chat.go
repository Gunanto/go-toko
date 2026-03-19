package domain

import "time"

type StoreConversationStatus string

const (
	StoreConversationStatusOpen StoreConversationStatus = "open"
)

type StoreMessageSenderType string

const (
	StoreMessageSenderCustomer StoreMessageSenderType = "customer"
	StoreMessageSenderAdmin    StoreMessageSenderType = "admin"
)

type StoreConversation struct {
	ID                  uint64
	CustomerID          uint64
	Status              StoreConversationStatus
	LastMessageAt       *time.Time
	LastMessagePreview  string
	CustomerUnreadCount uint64
	AdminUnreadCount    uint64
	CustomerName        string
	CustomerPhone       string
	CustomerEmail       string
	CreatedAt           time.Time
	UpdatedAt           time.Time
}

type StoreMessage struct {
	ID               uint64
	ConversationID   uint64
	SenderType       StoreMessageSenderType
	SenderCustomerID *uint64
	SenderUserID     *uint64
	Body             string
	CreatedAt        time.Time
}
