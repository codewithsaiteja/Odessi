package com.odessi.api.entity;

/**
 * User roles in the Odessi system.
 *
 * <p>Structured as an enum so the JPA column stores the string name.
 * Additional roles (e.g. MODERATOR, WAREHOUSE_STAFF) can be added here
 * and referenced without a schema migration.
 */
public enum Role {

    /** Regular customer — can browse, cart, wishlist, order. */
    CUSTOMER,

    /** Admin — full back-office access (Phase 4+). */
    ADMIN
}
