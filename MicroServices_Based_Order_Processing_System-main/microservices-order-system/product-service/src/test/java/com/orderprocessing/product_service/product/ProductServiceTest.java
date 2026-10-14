package com.orderprocessing.product_service.product;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.orderprocessing.product_service.util.NotFoundException;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;


@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ProductService productService;

    @Test
    void reduceStock_whenSufficientStock_subtractsQuantityAndSaves() {
        final Product product = product(1L, 10);

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(productRepository.save(product)).thenReturn(product);

        productService.reduceStock(1L, 4);

        assertEquals(6, product.getStock());
        verify(productRepository).save(product);
    }

    @Test
    void reduceStock_whenProductMissing_throwsNotFoundException() {
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> productService.reduceStock(99L, 1));

        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void reduceStock_whenQuantityExceedsStock_throwsIllegalArgumentException() {
        final Product product = product(1L, 2);
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        assertThrows(IllegalArgumentException.class, () -> productService.reduceStock(1L, 5));

        assertEquals(2, product.getStock());
        verify(productRepository, never()).save(any(Product.class));
    }

    private Product product(final Long id, final Integer stock) {
        final Product product = new Product();
        product.setId(id);
        product.setName("Widget");
        product.setPrice(new BigDecimal("9.99"));
        product.setStock(stock);
        return product;
    }

}
