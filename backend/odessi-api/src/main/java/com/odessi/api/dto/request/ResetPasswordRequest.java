package com.odessi.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class ResetPasswordRequest {

    private String token;
    private String resetToken;

    @NotBlank(message = "Password cannot be blank")
    @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
    @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).*$", 
             message = "Password must contain at least one digit, one lowercase, one uppercase, and one special character")
    private String newPassword;

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getResetToken() { return resetToken; }
    public void setResetToken(String resetToken) { this.resetToken = resetToken; }

    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }

    public String getEffectiveToken() {
        if (resetToken != null && !resetToken.isBlank()) {
            return resetToken.trim();
        }
        return token != null ? token.trim() : null;
    }
}
