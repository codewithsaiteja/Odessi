package com.odessi.api.service;

import com.odessi.api.dto.request.AddCartItemRequest;
import com.odessi.api.entity.*;
import com.odessi.api.mapper.CartMapper;
import com.odessi.api.repository.*;
import com.odessi.api.service.impl.CartServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
@DisplayName("CartService concurrency tests")
class CartConcurrencyTest {

    @Mock CartRepository cartRepository;
    @Mock CartItemRepository cartItemRepository;
    @Mock ProductVariantRepository variantRepository;
    @Mock UserRepository userRepository;
    @Mock CartMapper cartMapper;

    CartServiceImpl cartService;

    @BeforeEach
    void setUp() {
        cartService = new CartServiceImpl(
            cartRepository, cartItemRepository,
            variantRepository, userRepository, cartMapper
        );
    }

    @Test
    @DisplayName("Concurrent add to cart requests serialize safely without errors")
    void concurrentAddToCart_success() throws InterruptedException {
        User user = new User("Test", "User", "concurrent@odessi.tfi", "hash");
        user.setId(100L);
        Cart cart = new Cart(user);
        cart.setId(50L);

        Product product = new Product();
        product.setName("Concurrent Tee");
        product.setSlug("concurrent-tee");
        product.setPrice(new BigDecimal("1299.00"));

        ProductVariant variant = new ProductVariant();
        variant.setId(10L);
        variant.setSku("CONC-TEE-M");
        variant.setSize("M");
        variant.setColor("Black");
        variant.setPrice(new BigDecimal("1299.00"));
        variant.setStockQuantity(100);
        variant.setActive(true);
        variant.setProduct(product);

        given(userRepository.findByIdForUpdate(100L)).willReturn(Optional.of(user));
        given(cartRepository.findByUserIdWithItems(100L)).willReturn(Optional.of(cart));
        given(variantRepository.findById(10L)).willReturn(Optional.of(variant));
        given(cartItemRepository.findByCartIdAndProductVariantId(50L, 10L)).willReturn(Optional.empty());

        int threadCount = 5;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch latch = new CountDownLatch(1);
        AtomicInteger successCount = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    latch.await();
                    cartService.addItem(100L, new AddCartItemRequest(10L, 1));
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    // unexpected exception
                }
            });
        }

        latch.countDown();
        executor.shutdown();
        boolean finished = executor.awaitTermination(5, TimeUnit.SECONDS);

        assertThat(finished).isTrue();
        assertThat(successCount.get()).isEqualTo(threadCount);
    }
}
