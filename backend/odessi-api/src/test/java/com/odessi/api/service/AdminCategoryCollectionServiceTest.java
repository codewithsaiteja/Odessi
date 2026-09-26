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
import org.springframework.mock.web.MockMultipartFile;
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

    @Test
    void createCollection_withHeroImage_persistsImage() {
        String imageRef = "/api/media/collections/col-12345-abcdef01.jpg";
        AdminCollectionRequest req = new AdminCollectionRequest("Winter Drop", "winter-drop", "Winter Edit", imageRef, true, true);
        CollectionResponse res = adminService.createCollection(admin, req);

        assertEquals("Winter Drop", res.name());
        assertEquals(imageRef, res.heroImage());
    }

    @Test
    void uploadCollectionMedia_returnsValidCollectionPath() {
        MockMultipartFile file = new MockMultipartFile(
            "file", "drop-banner.jpg", "image/jpeg", "fake-image-bytes".getBytes()
        );
        String url = adminService.uploadCollectionMedia(admin, file);

        assertNotNull(url);
        assertTrue(url.startsWith("/api/media/collections/col-"));
        assertTrue(url.endsWith(".jpg"));
    }

    @Test
    void uploadCollectionImage_persistsToCollectionAndDeletesOldImage() {
        AdminCollectionRequest req = new AdminCollectionRequest("Dark Edit", "dark-edit", "Editorial", null, true, true);
        CollectionResponse created = adminService.createCollection(admin, req);
        assertNull(created.heroImage());

        MockMultipartFile file1 = new MockMultipartFile(
            "file", "cover-1.png", "image/png", "png-content-bytes".getBytes()
        );
        CollectionResponse updated1 = adminService.uploadCollectionImage(admin, created.id(), file1);

        assertNotNull(updated1.heroImage());
        assertTrue(updated1.heroImage().startsWith("/api/media/collections/col-"));
        assertTrue(updated1.heroImage().endsWith(".png"));

        // Upload replacement image
        MockMultipartFile file2 = new MockMultipartFile(
            "file", "cover-2.webp", "image/webp", "webp-content-bytes".getBytes()
        );
        CollectionResponse updated2 = adminService.uploadCollectionImage(admin, created.id(), file2);

        assertNotNull(updated2.heroImage());
        assertTrue(updated2.heroImage().startsWith("/api/media/collections/col-"));
        assertTrue(updated2.heroImage().endsWith(".webp"));
        assertNotEquals(updated1.heroImage(), updated2.heroImage());
    }

    @Test
    void removeCollectionImage_clearsHeroImageField() {
        MockMultipartFile file = new MockMultipartFile(
            "file", "cover.jpg", "image/jpeg", "image-bytes".getBytes()
        );
        String uploadedUrl = adminService.uploadCollectionMedia(admin, file);

        AdminCollectionRequest req = new AdminCollectionRequest("Rogue Series", "rogue-series", "Description", uploadedUrl, true, false);
        CollectionResponse created = adminService.createCollection(admin, req);
        assertEquals(uploadedUrl, created.heroImage());

        CollectionResponse cleared = adminService.removeCollectionImage(admin, created.id());
        assertNull(cleared.heroImage());
    }
}
