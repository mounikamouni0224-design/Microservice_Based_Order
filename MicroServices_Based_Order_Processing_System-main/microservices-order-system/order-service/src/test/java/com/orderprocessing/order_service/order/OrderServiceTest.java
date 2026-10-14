package com.orderprocessing.order_service.order;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.RETURNS_SELF;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.orderprocessing.order_service.util.NotFoundException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private RestClient customerServiceRestClient;

    @Mock
    private RestClient productServiceRestClient;

    @Mock
    private RestClient notificationServiceRestClient;

    private OrderService orderService;

    private OrderDTO orderDTO;

    @BeforeEach
    void setUp() {
        orderService = new OrderService(orderRepository, customerServiceRestClient,
                productServiceRestClient, notificationServiceRestClient);
        orderDTO = new OrderDTO();
        orderDTO.setCustomerId(10L);
        orderDTO.setProductId(20L);
        orderDTO.setQuantity(2);
    }

    @Test
    void create_whenDependenciesSucceed_completesOrderAndReturnsId() {
        stubCustomerGet(new OrderService.CustomerResponse(
                10L, "Ada Lovelace", "ada@example.com", "555-0100", "London"));
        stubProductGet(new OrderService.ProductResponse(
                20L, "Keyboard", new BigDecimal("25.00"), 8));
        stubReduceStock();
        stubNotification();

        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            final Order order = invocation.getArgument(0);
            order.setId(42L);
            return order;
        });

        final Long createdId = orderService.create(orderDTO);

        assertEquals(42L, createdId);

        final ArgumentCaptor<Order> orderCaptor = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository).save(orderCaptor.capture());
        final Order saved = orderCaptor.getValue();
        assertEquals("COMPLETED", saved.getStatus());
        assertEquals(0, new BigDecimal("50.00").compareTo(saved.getTotalPrice()));
        assertEquals(10L, saved.getCustomerId());
        assertEquals(20L, saved.getProductId());
        assertEquals(2, saved.getQuantity());

        verify(productServiceRestClient).put();
        verify(notificationServiceRestClient).post();
    }

    @Test
    void create_whenCustomerNotFound_throwsNotFoundException() {
        stubCustomerGetNotFound();

        assertThrows(NotFoundException.class, () -> orderService.create(orderDTO));

        verify(productServiceRestClient, never()).get();
        verify(productServiceRestClient, never()).put();
        verify(orderRepository, never()).save(any(Order.class));
        verify(notificationServiceRestClient, never()).post();
    }

    @Test
    void create_whenQuantityExceedsStock_throwsIllegalArgumentException() {
        stubCustomerGet(new OrderService.CustomerResponse(
                10L, "Ada Lovelace", "ada@example.com", "555-0100", "London"));
        stubProductGet(new OrderService.ProductResponse(
                20L, "Keyboard", new BigDecimal("25.00"), 1));

        assertThrows(IllegalArgumentException.class, () -> orderService.create(orderDTO));

        verify(productServiceRestClient, never()).put();
        verify(orderRepository, never()).save(any(Order.class));
        verify(notificationServiceRestClient, never()).post();
    }

    private void stubCustomerGet(final OrderService.CustomerResponse body) {
        final RestClient.RequestHeadersUriSpec<?> getSpec =
                mock(RestClient.RequestHeadersUriSpec.class, RETURNS_SELF);
        final RestClient.ResponseSpec responseSpec = mock(RestClient.ResponseSpec.class);
        doReturn(getSpec).when(customerServiceRestClient).get();
        when(getSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.body(eq(OrderService.CustomerResponse.class))).thenReturn(body);
    }

    private void stubCustomerGetNotFound() {
        final RestClient.RequestHeadersUriSpec<?> getSpec =
                mock(RestClient.RequestHeadersUriSpec.class, RETURNS_SELF);
        final RestClient.ResponseSpec responseSpec = mock(RestClient.ResponseSpec.class);
        doReturn(getSpec).when(customerServiceRestClient).get();
        when(getSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.body(eq(OrderService.CustomerResponse.class))).thenThrow(HttpClientErrorException.create(
                HttpStatus.NOT_FOUND, "Not Found", HttpHeaders.EMPTY, new byte[0], StandardCharsets.UTF_8));
    }

    private void stubProductGet(final OrderService.ProductResponse body) {
        final RestClient.RequestHeadersUriSpec<?> getSpec =
                mock(RestClient.RequestHeadersUriSpec.class, RETURNS_SELF);
        final RestClient.ResponseSpec responseSpec = mock(RestClient.ResponseSpec.class);
        doReturn(getSpec).when(productServiceRestClient).get();
        when(getSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.body(eq(OrderService.ProductResponse.class))).thenReturn(body);
    }

    private void stubReduceStock() {
        final RestClient.RequestBodyUriSpec putSpec =
                mock(RestClient.RequestBodyUriSpec.class, RETURNS_SELF);
        final RestClient.ResponseSpec responseSpec = mock(RestClient.ResponseSpec.class);
        when(productServiceRestClient.put()).thenReturn(putSpec);
        when(putSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.toBodilessEntity()).thenReturn(ResponseEntity.ok().build());
    }

    private void stubNotification() {
        final RestClient.RequestBodyUriSpec postSpec =
                mock(RestClient.RequestBodyUriSpec.class, RETURNS_SELF);
        final RestClient.ResponseSpec responseSpec = mock(RestClient.ResponseSpec.class);
        when(notificationServiceRestClient.post()).thenReturn(postSpec);
        when(postSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.toBodilessEntity()).thenReturn(ResponseEntity.ok().build());
    }

}
