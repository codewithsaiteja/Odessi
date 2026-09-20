package com.odessi.api.repository;

import com.odessi.api.dto.request.ProductFilterRequest;
import com.odessi.api.entity.Product;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/**
 * Dynamic JPA Specification for product filtering.
 * All filters are additive (AND logic).
 * Only active products are returned by default.
 */
public class ProductSpecification implements Specification<Product> {

    private final ProductFilterRequest filter;

    public ProductSpecification(ProductFilterRequest filter) {
        this.filter = filter;
    }

    @Override
    public Predicate toPredicate(Root<Product> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
        List<Predicate> predicates = new ArrayList<>();

        // Always filter to active products
        predicates.add(cb.isTrue(root.get("active")));

        if (filter.category() != null && !filter.category().isBlank()) {
            Join<Object, Object> categoryJoin = root.join("category", JoinType.LEFT);
            predicates.add(cb.equal(categoryJoin.get("slug"), filter.category()));
        }

        if (filter.collection() != null && !filter.collection().isBlank()) {
            Join<Object, Object> collectionJoin = root.join("collection", JoinType.LEFT);
            predicates.add(cb.equal(collectionJoin.get("slug"), filter.collection()));
        }

        if (filter.minPrice() != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("price"), filter.minPrice()));
        }

        if (filter.maxPrice() != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("price"), filter.maxPrice()));
        }

        if (Boolean.TRUE.equals(filter.featured())) {
            predicates.add(cb.isTrue(root.get("featured")));
        }

        if (Boolean.TRUE.equals(filter.bestseller())) {
            predicates.add(cb.isTrue(root.get("bestseller")));
        }

        if (Boolean.TRUE.equals(filter.newArrival())) {
            predicates.add(cb.isTrue(root.get("newArrival")));
        }

        if (filter.search() != null && !filter.search().isBlank()) {
            String pattern = "%" + filter.search().toLowerCase() + "%";
            Predicate nameLike = cb.like(cb.lower(root.get("name")), pattern);
            Predicate descLike = cb.like(cb.lower(root.get("description")), pattern);
            predicates.add(cb.or(nameLike, descLike));
        }

        // Size/color filters: join to variants
        if ((filter.clothingSize() != null && !filter.clothingSize().isBlank()) ||
            (filter.color() != null && !filter.color().isBlank()) ||
            Boolean.TRUE.equals(filter.available())) {

            Subquery<Long> variantSubquery = query.subquery(Long.class);
            Root<com.odessi.api.entity.ProductVariant> vRoot = variantSubquery.from(com.odessi.api.entity.ProductVariant.class);
            variantSubquery.select(vRoot.get("product").get("id"));

            List<Predicate> variantPredicates = new ArrayList<>();
            variantPredicates.add(cb.isTrue(vRoot.get("active")));

            if (filter.clothingSize() != null && !filter.clothingSize().isBlank()) {
                variantPredicates.add(cb.equal(cb.lower(vRoot.get("size")), filter.clothingSize().toLowerCase()));
            }

            if (filter.color() != null && !filter.color().isBlank()) {
                variantPredicates.add(cb.like(
                    cb.lower(vRoot.get("color")),
                    "%" + filter.color().toLowerCase() + "%"
                ));
            }

            if (Boolean.TRUE.equals(filter.available())) {
                variantPredicates.add(cb.greaterThan(vRoot.get("stockQuantity"), 0));
            }

            variantSubquery.where(variantPredicates.toArray(new Predicate[0]));
            predicates.add(root.get("id").in(variantSubquery));
        }

        return cb.and(predicates.toArray(new Predicate[0]));
    }
}
