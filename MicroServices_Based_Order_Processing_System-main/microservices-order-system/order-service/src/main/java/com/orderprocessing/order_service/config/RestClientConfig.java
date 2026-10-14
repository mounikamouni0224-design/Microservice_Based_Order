package com.orderprocessing.order_service.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;


@Configuration
public class RestClientConfig {

    @Bean
    public RestClient customerServiceRestClient(
            @Value("${CUSTOMER_SERVICE_URL:http://localhost:8081}") final String baseUrl) {
        return RestClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

    @Bean
    public RestClient productServiceRestClient(
            @Value("${PRODUCT_SERVICE_URL:http://localhost:8082}") final String baseUrl) {
        return RestClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

    @Bean
    public RestClient notificationServiceRestClient(
            @Value("${NOTIFICATION_SERVICE_URL:http://localhost:8084}") final String baseUrl) {
        return RestClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

}
