package com.orderprocessing.customer_service;

import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
public class HomeResource {

    @GetMapping(value = "/", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, String> index() {
        return Map.of(
                "service", "customer-service",
                "message", "Customer service is running.",
                "apiBasePath", "/api/customers");
    }

}
