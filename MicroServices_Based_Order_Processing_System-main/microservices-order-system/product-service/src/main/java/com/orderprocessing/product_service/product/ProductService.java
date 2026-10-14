package com.orderprocessing.product_service.product;

import com.orderprocessing.product_service.util.NotFoundException;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;


@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(final ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<ProductDTO> findAll() {
        final List<Product> products = productRepository.findAll(Sort.by("id"));
        return products.stream()
                .map(product -> mapToDTO(product, new ProductDTO()))
                .toList();
    }

    public ProductDTO get(final Long id) {
        return productRepository.findById(id)
                .map(product -> mapToDTO(product, new ProductDTO()))
                .orElseThrow(NotFoundException::new);
    }

    public Long create(final ProductDTO productDTO) {
        final Product product = new Product();
        mapToEntity(productDTO, product);
        return productRepository.save(product).getId();
    }

    public void update(final Long id, final ProductDTO productDTO) {
        final Product product = productRepository.findById(id)
                .orElseThrow(NotFoundException::new);
        mapToEntity(productDTO, product);
        productRepository.save(product);
    }

    public void delete(final Long id) {
        final Product product = productRepository.findById(id)
                .orElseThrow(NotFoundException::new);
        productRepository.delete(product);
    }

    public void reduceStock(final Long productId, final Integer quantity) {
        final Product product = productRepository.findById(productId)
                .orElseThrow(NotFoundException::new);
        if (product.getStock() < quantity) {
            throw new IllegalArgumentException("Insufficient stock for product " + productId);
        }
        product.setStock(product.getStock() - quantity);
        productRepository.save(product);
    }

    public void increaseStock(final Long productId, final Integer quantity) {
        final Product product = productRepository.findById(productId)
                .orElseThrow(NotFoundException::new);
        product.setStock(product.getStock() + quantity);
        productRepository.save(product);
    }

    private ProductDTO mapToDTO(final Product product, final ProductDTO productDTO) {
        productDTO.setId(product.getId());
        productDTO.setName(product.getName());
        productDTO.setPrice(product.getPrice());
        productDTO.setStock(product.getStock());
        return productDTO;
    }

    private Product mapToEntity(final ProductDTO productDTO, final Product product) {
        product.setName(productDTO.getName());
        product.setPrice(productDTO.getPrice());
        product.setStock(productDTO.getStock());
        return product;
    }

}
