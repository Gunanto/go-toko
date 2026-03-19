package http

import (
	"time"

	"github.com/bagashiz/go-pos/internal/core/domain"
	"github.com/bagashiz/go-pos/internal/core/port"
	"github.com/gin-gonic/gin"
)

type StoreChatHandler struct {
	svc port.StoreChatService
}

func NewStoreChatHandler(svc port.StoreChatService) *StoreChatHandler {
	return &StoreChatHandler{svc: svc}
}

type storeChatListRequest struct {
	Skip  uint64 `form:"skip" binding:"omitempty,min=0"`
	Limit uint64 `form:"limit" binding:"omitempty,min=1,max=100"`
}

type adminConversationListRequest struct {
	Skip   uint64 `form:"skip" binding:"omitempty,min=0"`
	Limit  uint64 `form:"limit" binding:"omitempty,min=1,max=100"`
	Status string `form:"status" binding:"omitempty"`
}

type storeChatMessageRequest struct {
	Message string `json:"message" binding:"required,max=2000"`
}

type storeConversationURIRequest struct {
	ID uint64 `uri:"id" binding:"required,min=1"`
}

type storeConversationResponse struct {
	ID                  uint64 `json:"id"`
	CustomerID          uint64 `json:"customer_id,omitempty"`
	Status              string `json:"status"`
	CustomerUnreadCount uint64 `json:"customer_unread_count"`
	AdminUnreadCount    uint64 `json:"admin_unread_count"`
	LastMessageAt       string `json:"last_message_at,omitempty"`
	LastMessagePreview  string `json:"last_message_preview"`
	CustomerName        string `json:"customer_name,omitempty"`
	CustomerPhone       string `json:"customer_phone,omitempty"`
	CustomerEmail       string `json:"customer_email,omitempty"`
	CreatedAt           string `json:"created_at"`
	UpdatedAt           string `json:"updated_at"`
}

type storeMessageResponse struct {
	ID             uint64 `json:"id"`
	ConversationID uint64 `json:"conversation_id"`
	SenderType     string `json:"sender_type"`
	Body           string `json:"body"`
	CreatedAt      string `json:"created_at"`
}

func newStoreConversationResponse(conversation *domain.StoreConversation) storeConversationResponse {
	response := storeConversationResponse{
		ID:                  conversation.ID,
		CustomerID:          conversation.CustomerID,
		Status:              string(conversation.Status),
		CustomerUnreadCount: conversation.CustomerUnreadCount,
		AdminUnreadCount:    conversation.AdminUnreadCount,
		LastMessagePreview:  conversation.LastMessagePreview,
		CustomerName:        conversation.CustomerName,
		CustomerPhone:       conversation.CustomerPhone,
		CustomerEmail:       conversation.CustomerEmail,
		CreatedAt:           conversation.CreatedAt.Format(time.RFC3339),
		UpdatedAt:           conversation.UpdatedAt.Format(time.RFC3339),
	}
	if conversation.LastMessageAt != nil {
		response.LastMessageAt = conversation.LastMessageAt.Format(time.RFC3339)
	}
	return response
}

func newStoreMessageResponse(message *domain.StoreMessage) storeMessageResponse {
	return storeMessageResponse{
		ID:             message.ID,
		ConversationID: message.ConversationID,
		SenderType:     string(message.SenderType),
		Body:           message.Body,
		CreatedAt:      message.CreatedAt.Format(time.RFC3339),
	}
}

func (h *StoreChatHandler) GetCustomerConversation(ctx *gin.Context) {
	payload := getAuthPayload(ctx, customerAuthorizationPayloadKey)

	conversation, err := h.svc.OpenConversationForCustomer(ctx, payload.CustomerID)
	if err != nil {
		handleError(ctx, err)
		return
	}

	handleSuccess(ctx, newStoreConversationResponse(conversation))
}

func (h *StoreChatHandler) ListCustomerMessages(ctx *gin.Context) {
	payload := getAuthPayload(ctx, customerAuthorizationPayloadKey)

	var req storeChatListRequest
	if err := ctx.ShouldBindQuery(&req); err != nil {
		validationError(ctx, err)
		return
	}
	if req.Limit == 0 {
		req.Limit = 50
	}

	messages, err := h.svc.ListCustomerMessages(ctx, payload.CustomerID, req.Skip, req.Limit)
	if err != nil {
		handleError(ctx, err)
		return
	}

	response := make([]storeMessageResponse, 0, len(messages))
	for _, message := range messages {
		messageCopy := message
		response = append(response, newStoreMessageResponse(&messageCopy))
	}

	handleSuccess(ctx, gin.H{"messages": response})
}

func (h *StoreChatHandler) SendCustomerMessage(ctx *gin.Context) {
	payload := getAuthPayload(ctx, customerAuthorizationPayloadKey)

	var req storeChatMessageRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		validationError(ctx, err)
		return
	}

	message, err := h.svc.SendCustomerMessage(ctx, payload.CustomerID, req.Message)
	if err != nil {
		handleError(ctx, err)
		return
	}

	handleSuccess(ctx, newStoreMessageResponse(message))
}

func (h *StoreChatHandler) MarkCustomerRead(ctx *gin.Context) {
	payload := getAuthPayload(ctx, customerAuthorizationPayloadKey)

	if err := h.svc.MarkCustomerRead(ctx, payload.CustomerID); err != nil {
		handleError(ctx, err)
		return
	}

	handleSuccess(ctx, gin.H{"ok": true})
}

func (h *StoreChatHandler) ListAdminConversations(ctx *gin.Context) {
	var req adminConversationListRequest
	if err := ctx.ShouldBindQuery(&req); err != nil {
		validationError(ctx, err)
		return
	}
	if req.Limit == 0 {
		req.Limit = 50
	}

	conversations, err := h.svc.ListAdminConversations(ctx, req.Skip, req.Limit, req.Status)
	if err != nil {
		handleError(ctx, err)
		return
	}

	response := make([]storeConversationResponse, 0, len(conversations))
	for _, conversation := range conversations {
		conversationCopy := conversation
		response = append(response, newStoreConversationResponse(&conversationCopy))
	}

	handleSuccess(ctx, gin.H{"conversations": response})
}

func (h *StoreChatHandler) ListAdminMessages(ctx *gin.Context) {
	var uriReq storeConversationURIRequest
	if err := ctx.ShouldBindUri(&uriReq); err != nil {
		validationError(ctx, err)
		return
	}

	var queryReq storeChatListRequest
	if err := ctx.ShouldBindQuery(&queryReq); err != nil {
		validationError(ctx, err)
		return
	}
	if queryReq.Limit == 0 {
		queryReq.Limit = 50
	}

	messages, err := h.svc.ListAdminMessages(ctx, uriReq.ID, queryReq.Skip, queryReq.Limit)
	if err != nil {
		handleError(ctx, err)
		return
	}

	response := make([]storeMessageResponse, 0, len(messages))
	for _, message := range messages {
		messageCopy := message
		response = append(response, newStoreMessageResponse(&messageCopy))
	}

	handleSuccess(ctx, gin.H{"messages": response})
}

func (h *StoreChatHandler) SendAdminMessage(ctx *gin.Context) {
	payload := getAuthPayload(ctx, authorizationPayloadKey)

	var uriReq storeConversationURIRequest
	if err := ctx.ShouldBindUri(&uriReq); err != nil {
		validationError(ctx, err)
		return
	}

	var req storeChatMessageRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		validationError(ctx, err)
		return
	}

	message, err := h.svc.SendAdminMessage(ctx, payload.UserID, uriReq.ID, req.Message)
	if err != nil {
		handleError(ctx, err)
		return
	}

	handleSuccess(ctx, newStoreMessageResponse(message))
}

func (h *StoreChatHandler) MarkAdminRead(ctx *gin.Context) {
	var uriReq storeConversationURIRequest
	if err := ctx.ShouldBindUri(&uriReq); err != nil {
		validationError(ctx, err)
		return
	}

	if err := h.svc.MarkAdminRead(ctx, uriReq.ID); err != nil {
		handleError(ctx, err)
		return
	}

	handleSuccess(ctx, gin.H{"ok": true})
}
