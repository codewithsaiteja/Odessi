package com.odessi.api.service.impl;

import com.odessi.api.dto.admin.AdminReferralResponse;
import com.odessi.api.dto.response.ReferralResponse;
import com.odessi.api.entity.Order;
import com.odessi.api.entity.PaymentStatus;
import com.odessi.api.entity.Referral;
import com.odessi.api.entity.ReferralCode;
import com.odessi.api.entity.ReferralStatus;
import com.odessi.api.entity.User;
import com.odessi.api.exception.BadRequestException;
import com.odessi.api.repository.ReferralCodeRepository;
import com.odessi.api.repository.ReferralRepository;
import com.odessi.api.service.ReferralService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class ReferralServiceImpl implements ReferralService {

    private final ReferralCodeRepository codeRepository;
    private final ReferralRepository referralRepository;

    public ReferralServiceImpl(ReferralCodeRepository codeRepository, ReferralRepository referralRepository) {
        this.codeRepository = codeRepository;
        this.referralRepository = referralRepository;
    }

    @Override
    @Transactional
    public ReferralResponse getMyReferralCode(User user) {
        if (user == null || user.getId() == null) {
            throw new BadRequestException("USER_REQUIRED", "Authenticated user required");
        }

        ReferralCode refCode = codeRepository.findByUserId(user.getId())
            .orElseGet(() -> {
                String uniqueCode = "ODESSI-REF-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
                return codeRepository.save(new ReferralCode(user, uniqueCode));
            });

        long totalCount = referralRepository.findByReferrerId(user.getId()).size();
        long qualifiedCount = referralRepository.countByReferrerIdAndStatus(user.getId(), ReferralStatus.QUALIFIED);

        String shareUrl = "http://localhost:3000/register?ref=" + refCode.getCode();

        return new ReferralResponse(
            refCode.getCode(),
            shareUrl,
            totalCount,
            qualifiedCount,
            refCode.getCreatedAt()
        );
    }

    @Override
    @Transactional
    public void recordReferral(User referee, String rawCode) {
        if (referee == null || rawCode == null || rawCode.isBlank()) return;

        String code = rawCode.trim().toUpperCase();
        Optional<ReferralCode> refCodeOpt = codeRepository.findByCode(code);
        if (refCodeOpt.isEmpty()) return;

        User referrer = refCodeOpt.get().getUser();

        // Prevent self-referral
        if (referrer.getId().equals(referee.getId())) {
            throw new BadRequestException("INVALID_REFERRAL", "Self-referral is not allowed");
        }

        // Check if referee already has a referral
        if (referralRepository.findByRefereeId(referee.getId()).isPresent()) {
            return;
        }

        Referral referral = new Referral(referrer, referee, code);
        referralRepository.save(referral);
    }

    @Override
    @Transactional
    public void processQualifyingOrder(User referee, Order order) {
        if (referee == null || order == null) return;

        // Check payment status — must be CAPTURED or PAID
        if (order.getPaymentStatus() != PaymentStatus.CAPTURED && order.getPaymentStatus() != PaymentStatus.PAID) {
            return;
        }

        Optional<Referral> refOpt = referralRepository.findByRefereeId(referee.getId());
        if (refOpt.isEmpty()) return;

        Referral referral = refOpt.get();
        if (referral.getStatus() == ReferralStatus.QUALIFIED) return;

        referral.setStatus(ReferralStatus.QUALIFIED);
        referral.setQualifyingOrder(order);
        referralRepository.save(referral);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminReferralResponse> getReferralsForAdmin(Pageable pageable) {
        return referralRepository.findAll(pageable).map(AdminReferralResponse::fromEntity);
    }
}
