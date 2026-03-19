package repository

import (
	"context"
	"database/sql"

	sq "github.com/Masterminds/squirrel"
	"github.com/bagashiz/go-pos/internal/adapter/storage/postgres"
	"github.com/bagashiz/go-pos/internal/core/domain"
)

const storeMessageColumns = "id, conversation_id, sender_type, sender_customer_id, sender_user_id, body, created_at"

type StoreMessageRepository struct {
	db *postgres.DB
}

func NewStoreMessageRepository(db *postgres.DB) *StoreMessageRepository {
	return &StoreMessageRepository{db: db}
}

func (r *StoreMessageRepository) Create(ctx context.Context, message *domain.StoreMessage) (*domain.StoreMessage, error) {
	query := r.db.QueryBuilder.Insert("store_messages").
		Columns("conversation_id", "sender_type", "sender_customer_id", "sender_user_id", "body").
		Values(message.ConversationID, message.SenderType, nullUint64Ptr(message.SenderCustomerID), nullUint64Ptr(message.SenderUserID), message.Body).
		Suffix("RETURNING " + storeMessageColumns)

	sqlStr, args, err := query.ToSql()
	if err != nil {
		return nil, err
	}

	return r.scanCreated(ctx, sqlStr, args...)
}

func (r *StoreMessageRepository) ListByConversationID(ctx context.Context, conversationID, skip, limit uint64) ([]domain.StoreMessage, error) {
	query := r.db.QueryBuilder.Select(storeMessageColumns).
		From("store_messages").
		Where(sq.Eq{"conversation_id": conversationID}).
		OrderBy("id ASC").
		Offset(skip)

	if limit > 0 {
		query = query.Limit(limit)
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

	var messages []domain.StoreMessage
	for rows.Next() {
		message, err := scanStoreMessage(rows)
		if err != nil {
			return nil, err
		}
		messages = append(messages, *message)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return messages, nil
}

func (r *StoreMessageRepository) scanCreated(ctx context.Context, sqlStr string, args ...any) (*domain.StoreMessage, error) {
	row := r.db.QueryRow(ctx, sqlStr, args...)
	return scanStoreMessage(row)
}

func scanStoreMessage(scanner rowScanner) (*domain.StoreMessage, error) {
	var message domain.StoreMessage
	var senderCustomerID sql.NullInt64
	var senderUserID sql.NullInt64

	err := scanner.Scan(
		&message.ID,
		&message.ConversationID,
		&message.SenderType,
		&senderCustomerID,
		&senderUserID,
		&message.Body,
		&message.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	message.SenderCustomerID = nullUint64FromInt64(senderCustomerID)
	message.SenderUserID = nullUint64FromInt64(senderUserID)

	return &message, nil
}

func nullUint64Ptr(value *uint64) any {
	if value == nil || *value == 0 {
		return nil
	}
	return *value
}

func nullUint64FromInt64(value sql.NullInt64) *uint64 {
	if !value.Valid {
		return nil
	}
	parsed := uint64(value.Int64)
	return &parsed
}
