package com.odessi.api.service;

import com.odessi.api.dto.admin.AdminCategoryRequest;
import com.odessi.api.dto.admin.AdminCollectionRequest;
import com.odessi.api.dto.response.CategoryResponse;
import com.odessi.api.dto.response.CollectionResponse;
import com.odessi.api.entity.Role;
import com.odessi.api.entity.User;
import com.odessi.api.exception.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class AdminCategoryCollectionServiceTest {

    @Autowired
    private AdminService adminService;

    private User admin;

    @BeforeEach
    void setUp() {
        admin = new User("Admin", "CatCol", "admin.catcol@test.com", "hash");
        admin.setRole(Role.ADMIN);
    }

    @Test
    void createCategory_succeedsAndPreventsDuplicateSlug() {
        AdminCategoryRequest req = new AdminCategoryRequest("Sweaters", "sweaters", "Cozy sweaters", null, true);
        CategoryResponse res = adminService.createCategory(admin, req);

        assertEquals("Sweaters", res.name());
        assertEquals("sweaters", res.slug());

        assertThrows(BadRequestException.class, () ->
            adminService.createCategory(admin, req)
        );
    }

    @Test
    void createCollection_succeedsAndPreventsDuplicateSlug() {
        AdminCollectionRequest req = new AdminCollectionRequest("Summer Drop", "summer-drop", "Summer Edit", null, true, true);
        CollectionResponse res = adminService.createCollection(admin, req);

        assertEquals("Summer Drop", res.name());
        assertEquals("summer-drop", res.slug());

        assertThrows(BadRequestException.class, () ->
            adminService.createCollection(admin, req)
        );
    }
}
