package service

import (
	"context"
	"strings"

	"github.com/bagashiz/go-pos/internal/core/domain"
	"github.com/bagashiz/go-pos/internal/core/port"
	"github.com/bagashiz/go-pos/internal/core/util"
)

/**
 * OrderService implements port.OrderService, port.ProductService,
 * port.UserService and port.PaymentService interfaces and provides
 * an access to the order, product, user and payment repositories
 * and cache service
 */
type OrderService struct {
	orderRepo    port.OrderRepository
	productRepo  port.ProductRepository
	categoryRepo port.CategoryRepository
	customerRepo port.CustomerRepository
	userRepo     port.UserRepository
	paymentRepo  port.PaymentRepository
	cache        port.CacheRepository
}

// NewOrderService creates a new order service instance
func NewOrderService(orderRepo port.OrderRepository, productRepo port.ProductRepository, categoryRepo port.CategoryRepository, customerRepo port.CustomerRepository, userRepo port.UserRepository, paymentRepo port.PaymentRepository, cache port.CacheRepository) *OrderService {
	return &OrderService{
		orderRepo,
		productRepo,
		categoryRepo,
		customerRepo,
		userRepo,
		paymentRepo,
		cache,
	}
}

// CreateOrder creates a new order
func (os *OrderService) CreateOrder(ctx context.Context, order *domain.Order) (*domain.Order, error) {
	order.Status = domain.OrderStatusPaid
	if order.Channel == "" {
		order.Channel = domain.OrderChannelPOS
	}

	order, err := os.prepareOrderForCreate(ctx, order, false)
	if err != nil {
		return nil, err
	}

	return os.persistOrder(ctx, order)
}

// CreateStoreOrder creates a storefront order using an internal cashier/admin user.
func (os *OrderService) CreateStoreOrder(ctx context.Context, order *domain.Order) (*domain.Order, error) {
	users, err := os.userRepo.ListUsers(ctx, 0, 100)
	if err != nil {
		return nil, domain.ErrInternal
	}

	for _, user := range users {
		if user.Role == domain.Cashier || user.Role == domain.Admin {
			order.UserID = user.ID
			break
		}
	}

	if order.UserID == 0 {
		return nil, domain.ErrDataNotFound
	}

	order.Status = domain.OrderStatusPending
	order.Channel = domain.OrderChannelStorefront

	if err := os.attachStorefrontCustomer(ctx, order); err != nil {
		return nil, err
	}

	order, err = os.prepareOrderForCreate(ctx, order, true)
	if err != nil {
		return nil, err
	}

	return os.persistOrder(ctx, order)
}

func (os *OrderService) attachStorefrontCustomer(ctx context.Context, order *domain.Order) error {
	if order.ShippingAddress == "" {
		order.ShippingAddress = "ambil di toko"
	}

	if order.CustomerID != nil {
		customer, err := os.customerRepo.GetCustomerByID(ctx, *order.CustomerID)
		if err != nil {
			if err == domain.ErrDataNotFound {
				return err
			}
			return domain.ErrInternal
		}
		order.CustomerName = customer.Name
		if order.CustomerPhone == "" {
			order.CustomerPhone = customer.Phone
		}
		if order.CustomerEmail == "" {
			order.CustomerEmail = customer.Email
		}
		if order.ShippingAddress == "" {
			order.ShippingAddress = customer.Address
		}
		return nil
	}

	var customer *domain.Customer
	var err error

	switch {
	case order.CustomerPhone != "":
		customer, err = os.customerRepo.GetCustomerByPhone(ctx, order.CustomerPhone)
	case order.CustomerEmail != "":
		customer, err = os.customerRepo.GetCustomerByEmail(ctx, order.CustomerEmail)
	}

	if err != nil && err != domain.ErrDataNotFound {
		return domain.ErrInternal
	}

	if customer == nil {
		customer = &domain.Customer{
			Name:    order.CustomerName,
			Phone:   order.CustomerPhone,
			Email:   order.CustomerEmail,
			Address: order.ShippingAddress,
			Tier:    "bronze",
		}
		customer, err = os.customerRepo.CreateCustomer(ctx, customer)
		if err != nil {
			return err
		}
		if err := os.invalidateCustomerCache(ctx, customer.ID); err != nil {
			return err
		}
	} else {
		shouldUpdate := false
		if order.CustomerName != "" && customer.Name != order.CustomerName {
			customer.Name = order.CustomerName
			shouldUpdate = true
		}
		if order.CustomerPhone != "" && customer.Phone != order.CustomerPhone {
			customer.Phone = order.CustomerPhone
			shouldUpdate = true
		}
		if order.CustomerEmail != "" && customer.Email != order.CustomerEmail {
			customer.Email = order.CustomerEmail
			shouldUpdate = true
		}
		if order.ShippingAddress != "" && customer.Address != order.ShippingAddress {
			customer.Address = order.ShippingAddress
			shouldUpdate = true
		}
		if shouldUpdate {
			customer, err = os.customerRepo.UpdateCustomer(ctx, customer)
			if err != nil {
				return err
			}
			if err := os.invalidateCustomerCache(ctx, customer.ID); err != nil {
				return err
			}
		}
	}

	order.CustomerID = &customer.ID
	order.CustomerName = customer.Name
	if order.CustomerPhone == "" {
		order.CustomerPhone = customer.Phone
	}
	if order.CustomerEmail == "" {
		order.CustomerEmail = customer.Email
	}
	if order.ShippingAddress == "" {
		order.ShippingAddress = customer.Address
	}

	return nil
}

func (os *OrderService) invalidateCustomerCache(ctx context.Context, id uint64) error {
	cacheKey := util.GenerateCacheKey("customer", id)
	if err := os.cache.Delete(ctx, cacheKey); err != nil {
		return domain.ErrInternal
	}
	if err := os.cache.DeleteByPrefix(ctx, "customers:*"); err != nil {
		return domain.ErrInternal
	}
	return nil
}

func (os *OrderService) prepareOrderForCreate(ctx context.Context, order *domain.Order, allowAutoPaid bool) (*domain.Order, error) {
	var totalPrice float64
	for i, orderProduct := range order.Products {
		product, err := os.productRepo.GetProductByID(ctx, orderProduct.ProductID)
		if err != nil {
			if err == domain.ErrDataNotFound {
				return nil, err
			}
			return nil, domain.ErrInternal
		}

		if product.Stock < orderProduct.Quantity {
			return nil, domain.ErrInsufficientStock
		}

		order.Products[i].TotalPrice = product.Price * float64(orderProduct.Quantity)
		order.Products[i].CostAtSale = product.Cost
		totalPrice += order.Products[i].TotalPrice
	}

	if allowAutoPaid && order.TotalPaid == 0 && order.Status != domain.OrderStatusPending {
		order.TotalPaid = totalPrice
	}

	if order.Status != domain.OrderStatusPending && order.TotalPaid < totalPrice {
		return nil, domain.ErrInsufficientPayment
	}

	order.TotalPrice = totalPrice
	if order.Status == domain.OrderStatusPending {
		order.TotalPaid = 0
		order.TotalReturn = 0
	} else {
		order.TotalReturn = order.TotalPaid - order.TotalPrice
	}

	return order, nil
}

func (os *OrderService) persistOrder(ctx context.Context, order *domain.Order) (*domain.Order, error) {
	var err error
	order, err = os.orderRepo.CreateOrder(ctx, order)
	if err != nil {
		return nil, domain.ErrInternal
	}

	user, err := os.userRepo.GetUserByID(ctx, order.UserID)
	if err != nil {
		if err == domain.ErrDataNotFound {
			return nil, err
		}
		return nil, domain.ErrInternal
	}

	payment, err := os.paymentRepo.GetPaymentByID(ctx, order.PaymentID)
	if err != nil {
		if err == domain.ErrDataNotFound {
			return nil, err
		}
		return nil, domain.ErrInternal
	}

	order.User = user
	order.Payment = payment

	for i, orderProduct := range order.Products {
		product, err := os.productRepo.GetProductByID(ctx, orderProduct.ProductID)
		if err != nil {
			if err == domain.ErrDataNotFound {
				return nil, err
			}
			return nil, domain.ErrInternal
		}

		category, err := os.categoryRepo.GetCategoryByID(ctx, product.CategoryID)
		if err != nil {
			if err == domain.ErrDataNotFound {
				return nil, err
			}
			return nil, domain.ErrInternal
		}

		order.Products[i].Product = product
		order.Products[i].Product.Category = category
	}

	err = os.cache.DeleteByPrefix(ctx, "orders:*")
	if err != nil {
		return nil, domain.ErrInternal
	}
	err = os.cache.DeleteByPrefix(ctx, "products:*")
	if err != nil {
		return nil, domain.ErrInternal
	}

	cacheKey := util.GenerateCacheKey("order", order.ID)
	orderSerialized, err := util.Serialize(order)
	if err != nil {
		return nil, domain.ErrInternal
	}

	err = os.cache.Set(ctx, cacheKey, orderSerialized, 0)
	if err != nil {
		return nil, domain.ErrInternal
	}

	return order, nil
}

// PayOrder marks a pending order as paid.
func (os *OrderService) PayOrder(ctx context.Context, id uint64, totalPaid float64) (*domain.Order, error) {
	order, err := os.orderRepo.GetOrderByID(ctx, id)
	if err != nil {
		if err == domain.ErrDataNotFound {
			return nil, err
		}
		return nil, domain.ErrInternal
	}

	if order.Status == domain.OrderStatusPaid {
		return nil, domain.ErrNoUpdatedData
	}

	if totalPaid < order.TotalPrice {
		return nil, domain.ErrInsufficientPayment
	}

	order.TotalPaid = totalPaid
	order.TotalReturn = totalPaid - order.TotalPrice
	order.Status = domain.OrderStatusPaid

	order, err = os.orderRepo.UpdateOrderPayment(ctx, order)
	if err != nil {
		return nil, domain.ErrInternal
	}

	cacheKey := util.GenerateCacheKey("order", order.ID)
	if err := os.cache.Delete(ctx, cacheKey); err != nil {
		return nil, domain.ErrInternal
	}
	if err := os.cache.DeleteByPrefix(ctx, "orders:*"); err != nil {
		return nil, domain.ErrInternal
	}

	return os.GetOrder(ctx, id)
}

// GetOrder gets an order by ID
func (os *OrderService) GetOrder(ctx context.Context, id uint64) (*domain.Order, error) {
	var order *domain.Order

	cacheKey := util.GenerateCacheKey("order", id)
	cachedOrder, err := os.cache.Get(ctx, cacheKey)
	if err == nil {
		err := util.Deserialize(cachedOrder, &order)
		if err != nil {
			return nil, domain.ErrInternal
		}
		return order, nil
	}

	order, err = os.orderRepo.GetOrderByID(ctx, id)
	if err != nil {
		if err == domain.ErrDataNotFound {
			return nil, err
		}
		return nil, domain.ErrInternal
	}

	user, err := os.userRepo.GetUserByID(ctx, order.UserID)
	if err != nil {
		if err == domain.ErrDataNotFound {
			return nil, err
		}
		return nil, domain.ErrInternal
	}

	payment, err := os.paymentRepo.GetPaymentByID(ctx, order.PaymentID)
	if err != nil {
		if err == domain.ErrDataNotFound {
			return nil, err
		}
		return nil, domain.ErrInternal
	}

	order.User = user
	order.Payment = payment

	for i, orderProduct := range order.Products {
		product, err := os.productRepo.GetProductByID(ctx, orderProduct.ProductID)
		if err != nil {
			if err == domain.ErrDataNotFound {
				return nil, err
			}
			return nil, domain.ErrInternal
		}

		category, err := os.categoryRepo.GetCategoryByID(ctx, product.CategoryID)
		if err != nil {
			if err == domain.ErrDataNotFound {
				return nil, err
			}
			return nil, domain.ErrInternal
		}

		order.Products[i].Product = product
		order.Products[i].Product.Category = category
	}

	orderSerialized, err := util.Serialize(order)
	if err != nil {
		return nil, domain.ErrInternal
	}

	err = os.cache.Set(ctx, cacheKey, orderSerialized, 0)
	if err != nil {
		return nil, domain.ErrInternal
	}

	return order, nil
}

// GetStoreOrderByReceiptCode gets a storefront order by receipt code.
func (os *OrderService) GetStoreOrderByReceiptCode(ctx context.Context, receiptCode string) (*domain.Order, error) {
	order, err := os.orderRepo.GetOrderByReceiptCode(ctx, receiptCode)
	if err != nil {
		if err == domain.ErrDataNotFound {
			return nil, err
		}
		return nil, domain.ErrInternal
	}

	if order.Channel != domain.OrderChannelStorefront {
		return nil, domain.ErrDataNotFound
	}

	return os.enrichOrder(ctx, order)
}

// ListOrders lists all orders
func (os *OrderService) ListOrders(
	ctx context.Context,
	filter port.OrderListFilter,
	skip,
	limit uint64,
) ([]domain.Order, uint64, error) {
	var orders []domain.Order

	params := util.GenerateCacheKeyParams(skip, limit, filter.Status, filter.Channel, filter.CustomerID, filter.DateFrom, filter.DateTo)
	cacheKey := util.GenerateCacheKey("orders", params)

	cachedOrders, err := os.cache.Get(ctx, cacheKey)
	if err == nil {
		err := util.Deserialize(cachedOrders, &orders)
		if err != nil {
			return nil, 0, domain.ErrInternal
		}
	}

	total, err := os.orderRepo.CountOrders(ctx, filter)
	if err != nil {
		return nil, 0, domain.ErrInternal
	}

	if len(orders) == 0 {
		orders, err = os.orderRepo.ListOrders(ctx, filter, skip, limit)
		if err != nil {
			return nil, 0, domain.ErrInternal
		}
	}

	for i, order := range orders {
		user, err := os.userRepo.GetUserByID(ctx, order.UserID)
		if err != nil {
			if err == domain.ErrDataNotFound {
				return nil, 0, err
			}
			return nil, 0, domain.ErrInternal
		}

		payment, err := os.paymentRepo.GetPaymentByID(ctx, order.PaymentID)
		if err != nil {
			if err == domain.ErrDataNotFound {
				return nil, 0, err
			}
			return nil, 0, domain.ErrInternal
		}

		orders[i].User = user
		orders[i].Payment = payment
	}

	for i, order := range orders {
		for j, orderProduct := range order.Products {
			product, err := os.productRepo.GetProductByID(ctx, orderProduct.ProductID)
			if err != nil {
				if err == domain.ErrDataNotFound {
					return nil, 0, err
				}
				return nil, 0, domain.ErrInternal
			}

			category, err := os.categoryRepo.GetCategoryByID(ctx, product.CategoryID)
			if err != nil {
				if err == domain.ErrDataNotFound {
					return nil, 0, err
				}
				return nil, 0, domain.ErrInternal
			}

			orders[i].Products[j].Product = product
			orders[i].Products[j].Product.Category = category
		}
	}

	ordersSerialized, err := util.Serialize(orders)
	if err != nil {
		return nil, 0, domain.ErrInternal
	}

	err = os.cache.Set(ctx, cacheKey, ordersSerialized, 0)
	if err != nil {
		return nil, 0, domain.ErrInternal
	}

	return orders, total, nil
}

func (os *OrderService) enrichOrder(ctx context.Context, order *domain.Order) (*domain.Order, error) {
	user, err := os.userRepo.GetUserByID(ctx, order.UserID)
	if err != nil {
		if err == domain.ErrDataNotFound {
			return nil, err
		}
		return nil, domain.ErrInternal
	}

	payment, err := os.paymentRepo.GetPaymentByID(ctx, order.PaymentID)
	if err != nil {
		if err == domain.ErrDataNotFound {
			return nil, err
		}
		return nil, domain.ErrInternal
	}

	order.User = user
	order.Payment = payment

	for i, orderProduct := range order.Products {
		product, err := os.productRepo.GetProductByID(ctx, orderProduct.ProductID)
		if err != nil {
			if err == domain.ErrDataNotFound {
				return nil, err
			}
			return nil, domain.ErrInternal
		}

		category, err := os.categoryRepo.GetCategoryByID(ctx, product.CategoryID)
		if err != nil {
			if err == domain.ErrDataNotFound {
				return nil, err
			}
			return nil, domain.ErrInternal
		}

		order.Products[i].Product = product
		order.Products[i].Product.Category = category
	}

	return order, nil
}

// ListStoreOrdersByCustomer returns storefront orders for an existing customer.
func (os *OrderService) ListStoreOrdersByCustomer(ctx context.Context, phone, email string, skip, limit uint64) ([]domain.Order, uint64, error) {
	phone = strings.TrimSpace(phone)
	email = strings.TrimSpace(email)

	var customer *domain.Customer
	var err error

	if phone != "" {
		customer, err = os.customerRepo.GetCustomerByPhone(ctx, phone)
		if err != nil && err != domain.ErrDataNotFound {
			return nil, 0, domain.ErrInternal
		}
	}

	if customer == nil && email != "" {
		customer, err = os.customerRepo.GetCustomerByEmail(ctx, email)
		if err != nil {
			if err == domain.ErrDataNotFound {
				return nil, 0, err
			}
			return nil, 0, domain.ErrInternal
		}
	}

	if customer == nil {
		return nil, 0, domain.ErrDataNotFound
	}

	filter := port.OrderListFilter{
		Channel:    string(domain.OrderChannelStorefront),
		CustomerID: &customer.ID,
	}

	return os.ListOrders(ctx, filter, skip, limit)
}
