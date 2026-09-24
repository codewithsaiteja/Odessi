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
    void createCategory_withImageReference_persistsImage() {
        String imageRef = "/api/media/categories/cat-12345-abcdef01.jpg";
        AdminCategoryRequest req = new AdminCategoryRequest("Jackets", "jackets", "Premium jackets", imageRef, true);
        CategoryResponse res = adminService.createCategory(admin, req);

        assertEquals("Jackets", res.name());
        assertEquals(imageRef, res.image());
    }

    @Test
    void updateCategory_withImageReference_updatesImage() {
        AdminCategoryRequest create = new AdminCategoryRequest("Caps", "caps", "Headwear", null, true);
        CategoryResponse created = adminService.createCategory(admin, create);
        assertNull(created.image());

        String imageRef = "/api/media/categories/cat-99999-deadbeef.jpg";
        AdminCategoryRequest update = new AdminCategoryRequest("Caps", "caps", "Headwear updated", imageRef, true);
        CategoryResponse updated = adminService.updateCategory(admin, created.id(), update);

        assertEquals(imageRef, updated.image());
        assertEquals("Headwear updated", updated.description());
    }

    @Test
    void updateCategory_removeImage_clearsImageField() {
        String imageRef = "/api/media/categories/cat-77777-feed1234.jpg";
        AdminCategoryRequest create = new AdminCategoryRequest("Shorts", "shorts", "Summer shorts", imageRef, true);
        CategoryResponse created = adminService.createCategory(admin, create);
        assertEquals(imageRef, created.image());

        AdminCategoryRequest update = new AdminCategoryRequest("Shorts", "shorts", "Summer shorts", null, true);
        CategoryResponse updated = adminService.updateCategory(admin, created.id(), update);

        assertNull(updated.image());
    }

    @Test
    void createCategory_apiResponseContainsImageField() {
        String imageRef = "/api/media/categories/cat-11111-cafebabe.webp";
        AdminCategoryRequest req = new AdminCategoryRequest("Active Wear", "active-wear", "Sports gear", imageRef, true);
        CategoryResponse res = adminService.createCategory(admin, req);

        // Verify all expected fields are present in the response
        assertNotNull(res.id());
        assertEquals("Active Wear", res.name());
        assertEquals("active-wear", res.slug());
        assertEquals(imageRef, res.image());
        assertTrue(res.active());
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
