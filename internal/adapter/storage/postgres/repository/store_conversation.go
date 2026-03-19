package repository

import (
	"context"
	"database/sql"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/bagashiz/go-pos/internal/adapter/storage/postgres"
	"github.com/bagashiz/go-pos/internal/core/domain"
	"github.com/bagashiz/go-pos/internal/core/port"
	"github.com/jackc/pgx/v5"
)

const storeConversationColumns = "" +
	"sc.id, sc.customer_id, sc.status, sc.last_message_at, sc.last_message_preview, " +
	"sc.customer_unread_count, sc.admin_unread_count, c.name, c.phone, c.email, sc.created_at, sc.updated_at"

type StoreConversationRepository struct {
	db *postgres.DB
}

func NewStoreConversationRepository(db *postgres.DB) *StoreConversationRepository {
	return &StoreConversationRepository{db: db}
}

func (r *StoreConversationRepository) GetByCustomerID(ctx context.Context, customerID uint64) (*domain.StoreConversation, error) {
	query := r.baseSelect().
		Where(sq.Eq{"sc.customer_id": customerID}).
		Limit(1)

	return r.getOne(ctx, query)
}

func (r *StoreConversationRepository) GetByID(ctx context.Context, id uint64) (*domain.StoreConversation, error) {
	query := r.baseSelect().
		Where(sq.Eq{"sc.id": id}).
		Limit(1)

	return r.getOne(ctx, query)
}

func (r *StoreConversationRepository) Create(ctx context.Context, conversation *domain.StoreConversation) (*domain.StoreConversation, error) {
	status := conversation.Status
	if status == "" {
		status = domain.StoreConversationStatusOpen
	}

	query := r.db.QueryBuilder.Insert("store_conversations").
		Columns("customer_id", "status", "last_message_at", "last_message_preview", "customer_unread_count", "admin_unread_count").
		Values(conversation.CustomerID, status, conversation.LastMessageAt, nullIfEmpty(conversation.LastMessagePreview), conversation.CustomerUnreadCount, conversation.AdminUnreadCount).
		Suffix("RETURNING id, customer_id, status, last_message_at, last_message_preview, customer_unread_count, admin_unread_count, created_at, updated_at")

	sqlStr, args, err := query.ToSql()
	if err != nil {
		return nil, err
	}

	var lastMessageAt sql.NullTime
	var lastMessagePreview sql.NullString
	var customerUnreadCount int64
	var adminUnreadCount int64
	err = r.db.QueryRow(ctx, sqlStr, args...).Scan(
		&conversation.ID,
		&conversation.CustomerID,
		&conversation.Status,
		&lastMessageAt,
		&lastMessagePreview,
		&customerUnreadCount,
		&adminUnreadCount,
		&conversation.CreatedAt,
		&conversation.UpdatedAt,
	)
	if err != nil {
		if r.db.ErrorCode(err) == "23505" {
			return nil, domain.ErrConflictingData
		}
		return nil, err
	}

	conversation.LastMessageAt = nullTimePtr(lastMessageAt)
	conversation.LastMessagePreview = lastMessagePreview.String
	conversation.CustomerUnreadCount = uint64(customerUnreadCount)
	conversation.AdminUnreadCount = uint64(adminUnreadCount)

	return r.GetByID(ctx, conversation.ID)
}

func (r *StoreConversationRepository) List(ctx context.Context, filter port.StoreConversationListFilter, skip, limit uint64) ([]domain.StoreConversation, error) {
	query := r.baseSelect().
		OrderBy("sc.last_message_at DESC NULLS LAST", "sc.id DESC").
		Offset(skip)

	if limit > 0 {
		query = query.Limit(limit)
	}
	if filter.Status != "" {
		query = query.Where(sq.Eq{"sc.status": filter.Status})
	}

	sqlStr, args, err := query.ToSql()
	if err != nil {
		return nil, err
	}

	rows, err := r.db.Query(ctx, sqlStr, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var conversations []domain.StoreConversation
	for rows.Next() {
		conversation, err := scanStoreConversation(rows)
		if err != nil {
			return nil, err
		}
		conversations = append(conversations, *conversation)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return conversations, nil
}

func (r *StoreConversationRepository) UpdateConversationSummary(ctx context.Context, input port.StoreConversationSummaryInput) (*domain.StoreConversation, error) {
	query := r.db.QueryBuilder.Update("store_conversations").
		Set("last_message_at", input.LastMessageAt).
		Set("last_message_preview", nullIfEmpty(input.LastMessagePreview)).
		Set("customer_unread_count", input.CustomerUnreadCount).
		Set("admin_unread_count", input.AdminUnreadCount).
		Set("updated_at", time.Now().UTC()).
		Where(sq.Eq{"id": input.ConversationID})

	sqlStr, args, err := query.ToSql()
	if err != nil {
		return nil, err
	}

	tag, err := r.db.Exec(ctx, sqlStr, args...)
	if err != nil {
		return nil, err
	}
	if tag.RowsAffected() == 0 {
		return nil, domain.ErrDataNotFound
	}

	return r.GetByID(ctx, input.ConversationID)
}

func (r *StoreConversationRepository) IncrementUnreadForAdmin(ctx context.Context, conversationID uint64) error {
	return r.execUnreadUpdate(ctx, conversationID, "admin_unread_count = admin_unread_count + 1")
}

func (r *StoreConversationRepository) IncrementUnreadForCustomer(ctx context.Context, conversationID uint64) error {
	return r.execUnreadUpdate(ctx, conversationID, "customer_unread_count = customer_unread_count + 1")
}

func (r *StoreConversationRepository) ResetUnreadForAdmin(ctx context.Context, conversationID uint64) error {
	return r.execUnreadUpdate(ctx, conversationID, "admin_unread_count = 0")
}

func (r *StoreConversationRepository) ResetUnreadForCustomer(ctx context.Context, conversationID uint64) error {
	return r.execUnreadUpdate(ctx, conversationID, "customer_unread_count = 0")
}

func (r *StoreConversationRepository) baseSelect() sq.SelectBuilder {
	return r.db.QueryBuilder.Select(storeConversationColumns).
		From("store_conversations sc").
		Join("customers c ON c.id = sc.customer_id")
}

func (r *StoreConversationRepository) getOne(ctx context.Context, query sq.SelectBuilder) (*domain.StoreConversation, error) {
	sqlStr, args, err := query.ToSql()
	if err != nil {
		return nil, err
	}

	row := r.db.QueryRow(ctx, sqlStr, args...)
	conversation, err := scanStoreConversation(row)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, domain.ErrDataNotFound
		}
		return nil, err
	}

	return conversation, nil
}

func (r *StoreConversationRepository) execUnreadUpdate(ctx context.Context, conversationID uint64, assignment string) error {
	sqlStr := "UPDATE store_conversations SET " + assignment + ", updated_at = NOW() WHERE id = $1"
	tag, err := r.db.Exec(ctx, sqlStr, conversationID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrDataNotFound
	}
	return nil
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanStoreConversation(scanner rowScanner) (*domain.StoreConversation, error) {
	var conversation domain.StoreConversation
	var lastMessageAt sql.NullTime
	var lastMessagePreview sql.NullString
	var customerPhone sql.NullString
	var customerEmail sql.NullString
	var customerUnreadCount int64
	var adminUnreadCount int64

	err := scanner.Scan(
		&conversation.ID,
		&conversation.CustomerID,
		&conversation.Status,
		&lastMessageAt,
		&lastMessagePreview,
		&customerUnreadCount,
		&adminUnreadCount,
		&conversation.CustomerName,
		&customerPhone,
		&customerEmail,
		&conversation.CreatedAt,
		&conversation.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	conversation.LastMessageAt = nullTimePtr(lastMessageAt)
	conversation.LastMessagePreview = lastMessagePreview.String
	conversation.CustomerUnreadCount = uint64(customerUnreadCount)
	conversation.AdminUnreadCount = uint64(adminUnreadCount)
	conversation.CustomerPhone = customerPhone.String
	conversation.CustomerEmail = customerEmail.String

	return &conversation, nil
}
