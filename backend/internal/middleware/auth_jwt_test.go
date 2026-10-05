package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/personalism/smart-door-lock/backend/internal/models"
)

func TestGenerateAndParseJWT(t *testing.T) {
	secret := "test-secret-key-12345"
	user := &models.User{
		ID:    "user-1",
		Email: "user@untan.ac.id",
		Name:  "Test User",
		Role:  models.RoleUser,
	}

	token, err := GenerateJWT(user, secret, 1*time.Hour)
	if err != nil {
		t.Fatalf("GenerateJWT failed: %v", err)
	}
	if token == "" {
		t.Fatal("expected non-empty token")
	}

	claims, err := ParseJWT(token, secret)
	if err != nil {
		t.Fatalf("ParseJWT failed: %v", err)
	}

	if claims.UserID != user.ID {
		t.Errorf("expected UserID %s, got %s", user.ID, claims.UserID)
	}
	if claims.Email != user.Email {
		t.Errorf("expected Email %s, got %s", user.Email, claims.Email)
	}
	if claims.Role != user.Role {
		t.Errorf("expected Role %s, got %s", user.Role, claims.Role)
	}
}

func TestParseJWT_InvalidSecret(t *testing.T) {
	secret := "test-secret-key-12345"
	user := &models.User{
		ID:    "user-1",
		Email: "user@untan.ac.id",
		Role:  models.RoleUser,
	}

	token, _ := GenerateJWT(user, secret, 1*time.Hour)

	_, err := ParseJWT(token, "wrong-secret")
	if err == nil {
		t.Fatal("expected error parsing JWT with wrong secret, got nil")
	}
}

func TestAuthMiddleware(t *testing.T) {
	secret := "test-secret-key-12345"
	user := &models.User{
		ID:    "user-admin",
		Email: "admin@untan.ac.id",
		Name:  "Admin FT",
		Role:  models.RoleAdmin,
	}
	token, _ := GenerateJWT(user, secret, 1*time.Hour)

	authMiddleware := AuthMiddleware(secret)

	handler := authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims, ok := GetUserFromContext(r.Context())
		if !ok || claims == nil {
			t.Fatal("expected user claims in context")
		}
		if claims.UserID != user.ID {
			t.Errorf("expected user ID %s, got %s", user.ID, claims.UserID)
		}
		w.WriteHeader(http.StatusOK)
	}))

	// Case 1: Valid Bearer Token
	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", rec.Code)
	}

	// Case 2: Missing Token
	reqNoAuth := httptest.NewRequest(http.MethodGet, "/test", nil)
	recNoAuth := httptest.NewRecorder()
	handler.ServeHTTP(recNoAuth, reqNoAuth)
	if recNoAuth.Code != http.StatusUnauthorized {
		t.Errorf("expected status 401, got %d", recNoAuth.Code)
	}

	// Case 3: Invalid Token
	reqInvalid := httptest.NewRequest(http.MethodGet, "/test", nil)
	reqInvalid.Header.Set("Authorization", "Bearer invalid-token-string")
	recInvalid := httptest.NewRecorder()
	handler.ServeHTTP(recInvalid, reqInvalid)
	if recInvalid.Code != http.StatusUnauthorized {
		t.Errorf("expected status 401, got %d", recInvalid.Code)
	}
}
