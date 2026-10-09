package com.odessi.api.repository;

import com.odessi.api.entity.Seller;
import com.odessi.api.entity.SellerStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SellerRepository extends JpaRepository<Seller, Long> {

    Optional<Seller> findByUserId(Long userId);

    Optional<Seller> findBySellerCode(String sellerCode);

    boolean existsByUserId(Long userId);

    boolean existsBySellerCode(String sellerCode);

    Page<Seller> findAllByStatus(SellerStatus status, Pageable pageable);

    @Query("SELECT s FROM Seller s WHERE " +
           "(:status IS NULL OR s.status = :status) AND " +
           "(:search IS NULL OR LOWER(s.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(s.sellerCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(s.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Seller> findSellersWithFilter(@Param("status") SellerStatus status,
                                       @Param("search") String search,
                                       Pageable pageable);

    long countByStatus(SellerStatus status);
}
