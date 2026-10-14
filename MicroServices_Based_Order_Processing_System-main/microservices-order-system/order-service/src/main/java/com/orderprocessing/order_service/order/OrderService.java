package com.orderprocessing.order_service.order;

import com.orderprocessing.order_service.util.NotFoundException;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;


@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final RestClient customerServiceRestClient;
    private final RestClient productServiceRestClient;
    private final RestClient notificationServiceRestClient;

    public OrderService(final OrderRepository orderRepository,
            @Qualifier("customerServiceRestClient") final RestClient customerServiceRestClient,
            @Qualifier("productServiceRestClient") final RestClient productServiceRestClient,
            @Qualifier("notificationServiceRestClient") final RestClient notificationServiceRestClient) {
        this.orderRepository = orderRepository;
        this.customerServiceRestClient = customerServiceRestClient;
        this.productServiceRestClient = productServiceRestClient;
        this.notificationServiceRestClient = notificationServiceRestClient;
    }

    public List<OrderDTO> findAll() {
        final List<Order> orders = orderRepository.findAll(Sort.by("id"));
        return orders.stream()
                .map(order -> mapToDTO(order, new OrderDTO()))
                .toList();
    }

    public OrderDTO get(final Long id) {
        return orderRepository.findById(id)
                .map(order -> mapToDTO(order, new OrderDTO()))
                .orElseThrow(NotFoundException::new);
    }

    @Transactional(rollbackFor = Exception.class)
    public Long create(final OrderDTO orderDTO) {
        final CustomerResponse customer = getRequired(
                customerServiceRestClient,
                "/api/customers/{id}",
                orderDTO.getCustomerId(),
                CustomerResponse.class,
                "Customer");
        final ProductResponse product = getRequired(
                productServiceRestClient,
                "/api/products/{id}",
                orderDTO.getProductId(),
                ProductResponse.class,
                "Product");

        if (product.stock() == null || orderDTO.getQuantity() > product.stock()) {
            throw new IllegalArgumentException("Insufficient stock for product " + orderDTO.getProductId());
        }

        final Order order = new Order();
        mapToEntity(orderDTO, order);
        order.setTotalPrice(product.price().multiply(BigDecimal.valueOf(orderDTO.getQuantity())));
        order.setStatus("COMPLETED");

        productServiceRestClient.put()
                .uri("/api/products/{id}/reduce-stock?quantity={quantity}",
                        orderDTO.getProductId(), orderDTO.getQuantity())
                .retrieve()
                .toBodilessEntity();

        try {
            final Order savedOrder = orderRepository.save(order);

            final String recipient = customer.email() != null ? customer.email() : customer.name();
            notificationServiceRestClient.post()
                    .uri("/api/notifications")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "recipient", recipient,
                            "message", "Order confirmation: your order #" + savedOrder.getId()
                                    + " has been completed.",
                            "status", "SENT"))
                    .retrieve()
                    .toBodilessEntity();

            return savedOrder.getId();
        } catch (final RuntimeException ex) {
            restoreStock(orderDTO.getProductId(), orderDTO.getQuantity(), ex);
            throw ex;
        }
    }

    public void update(final Long id, final OrderDTO orderDTO) {
        final Order order = orderRepository.findById(id)
                .orElseThrow(NotFoundException::new);
        mapToEntity(orderDTO, order);
        orderRepository.save(order);
    }

    public void delete(final Long id) {
        final Order order = orderRepository.findById(id)
                .orElseThrow(NotFoundException::new);
        orderRepository.delete(order);
    }

    private <T> T getRequired(final RestClient restClient, final String uri, final Long id,
            final Class<T> bodyType, final String entityName) {
        try {
            final T body = restClient.get()
                    .uri(uri, id)
                    .retrieve()
                    .body(bodyType);
            if (body == null) {
                throw new NotFoundException(entityName + " not found: " + id);
            }
            return body;
        } catch (final RestClientResponseException ex) {
            if (ex.getStatusCode().value() == 404) {
                throw new NotFoundException(entityName + " not found: " + id);
            }
            throw ex;
        }
    }

    private void restoreStock(final Long productId, final Integer quantity,
            final RuntimeException original) {
        try {
            productServiceRestClient.put()
                    .uri("/api/products/{id}/increase-stock?quantity={quantity}",
                            productId, quantity)
                    .retrieve()
                    .toBodilessEntity();
        } catch (final RuntimeException compensationFailure) {
            original.addSuppressed(compensationFailure);
        }
    }

    private OrderDTO mapToDTO(final Order order, final OrderDTO orderDTO) {
        orderDTO.setId(order.getId());
        orderDTO.setCustomerId(order.getCustomerId());
        orderDTO.setProductId(order.getProductId());
        orderDTO.setQuantity(order.getQuantity());
        orderDTO.setTotalPrice(order.getTotalPrice());
        orderDTO.setStatus(order.getStatus());
        return orderDTO;
    }

    private Order mapToEntity(final OrderDTO orderDTO, final Order order) {
        order.setCustomerId(orderDTO.getCustomerId());
        order.setProductId(orderDTO.getProductId());
        order.setQuantity(orderDTO.getQuantity());
        order.setTotalPrice(orderDTO.getTotalPrice());
        order.setStatus(orderDTO.getStatus());
        return order;
    }

    record CustomerResponse(Long id, String name, String email, String phone, String address) {
    }

    record ProductResponse(Long id, String name, BigDecimal price, Integer stock) {
    }

}
