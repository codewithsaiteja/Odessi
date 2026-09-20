package com.odessi.api.service;

import com.odessi.api.dto.request.AddCartItemRequest;
import com.odessi.api.dto.request.UpdateCartItemRequest;
import com.odessi.api.entity.*;
import com.odessi.api.exception.BusinessException;
import com.odessi.api.exception.ResourceNotFoundException;
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

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CartService unit tests")
class CartServiceTest {

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

    // ── addItem: stock validation ─────────────────────────────────

    @Test
    @DisplayName("addItem — throws INSUFFICIENT_STOCK when quantity exceeds stock")
    void addItem_insufficientStock() {
        User user = buildUser(1L);
        // buildCart sets an ID so cartItemRepository.findByCartIdAndProductVariantId can be called
        Cart cart = buildCart(1L, user);
        ProductVariant variant = buildVariant(1L, "SST-WB-M", 5);  // only 5 in stock, active=true

        given(cartRepository.findByUserIdWithItems(1L)).willReturn(Optional.of(cart));
        given(variantRepository.findById(1L)).willReturn(Optional.of(variant));
        // The stock check (quantity=10 > stockQty=5) is hit AFTER the active check passes,
        // but BEFORE cartItemRepository is queried — so no stub needed here.
        AddCartItemRequest request = new AddCartItemRequest(1L, 10);  // request 10 > stock 5

        assertThatThrownBy(() -> cartService.addItem(1L, request))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("SST-WB-M");
    }

    @Test
    @DisplayName("addItem — throws VARIANT_UNAVAILABLE for inactive variant")
    void addItem_variantUnavailable() {
        User user = buildUser(1L);
        Cart cart = new Cart(user);
        ProductVariant variant = buildVariant(1L, "SST-WB-XXL", 0);  // out of stock
        variant.setActive(false);

        given(cartRepository.findByUserIdWithItems(1L)).willReturn(Optional.of(cart));
        given(variantRepository.findById(1L)).willReturn(Optional.of(variant));

        AddCartItemRequest request = new AddCartItemRequest(1L, 1);

        assertThatThrownBy(() -> cartService.addItem(1L, request))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("SST-WB-XXL");  // message = "Product variant is not available: SST-WB-XXL"
    }

    @Test
    @DisplayName("addItem — throws VARIANT_UNAVAILABLE when stockQuantity is 0")
    void addItem_zeroStock() {
        User user = buildUser(1L);
        Cart cart = new Cart(user);
        ProductVariant variant = buildVariant(1L, "SST-WB-XL", 0);  // zero stock, active

        given(cartRepository.findByUserIdWithItems(1L)).willReturn(Optional.of(cart));
        given(variantRepository.findById(1L)).willReturn(Optional.of(variant));

        AddCartItemRequest request = new AddCartItemRequest(1L, 1);

        assertThatThrownBy(() -> cartService.addItem(1L, request))
            .isInstanceOf(BusinessException.class);
    }

    // ── updateItem: stock validation ──────────────────────────────

    @Test
    @DisplayName("updateItem — throws INSUFFICIENT_STOCK when new quantity exceeds stock")
    void updateItem_insufficientStock() {
        User user = buildUser(1L);
        // Must use buildCart so cart.getId() != null (ownership check at CartServiceImpl:97)
        Cart cart = buildCart(1L, user);

        ProductVariant variant = buildVariant(1L, "MH-ON-M", 3);
        CartItem item = new CartItem(cart, variant, 2);

        given(cartRepository.findByUserId(1L)).willReturn(Optional.of(cart));
        given(cartItemRepository.findById(1L)).willReturn(Optional.of(item));

        UpdateCartItemRequest request = new UpdateCartItemRequest(5);  // only 3 in stock

        assertThatThrownBy(() -> cartService.updateItem(1L, 1L, request))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("MH-ON-M");
    }

    // ── removeItem: ownership check ───────────────────────────────

    @Test
    @DisplayName("removeItem — throws NOT_FOUND when item belongs to another cart")
    void removeItem_wrongCart() {
        User user1 = buildUser(1L);
        User user2 = buildUser(2L);
        Cart cart1 = buildCart(10L, user1);
        Cart cart2 = buildCart(20L, user2);

        ProductVariant variant = buildVariant(1L, "DVH-EB-M", 10);
        CartItem item = new CartItem(cart2, variant, 1);  // item in user2's cart

        given(cartRepository.findByUserId(1L)).willReturn(Optional.of(cart1));
        given(cartItemRepository.findById(1L)).willReturn(Optional.of(item));

        assertThatThrownBy(() -> cartService.removeItem(1L, 1L))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    // ── Helpers ───────────────────────────────────────────────────

    private User buildUser(Long id) {
        User u = new User("Test", "User", "test" + id + "@odessi.tfi", "hash");
        u.setId(id);
        return u;
    }

    private Cart buildCart(Long id, User user) {
        Cart c = new Cart(user);
        c.setId(id);
        return c;
    }

    private ProductVariant buildVariant(Long id, String sku, int stock) {
        Product product = new Product();
        product.setName("Test Product");
        product.setSlug("test-product");
        product.setPrice(new BigDecimal("999.00"));
        product.setCurrency("INR");

        ProductVariant v = new ProductVariant();
        v.setId(id);
        v.setSku(sku);
        v.setSize("M");
        v.setColor("Black");
        v.setPrice(new BigDecimal("999.00"));
        v.setStockQuantity(stock);
        v.setActive(stock > 0);
        v.setProduct(product);
        return v;
    }
}
