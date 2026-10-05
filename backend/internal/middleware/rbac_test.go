package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/personalism/smart-door-lock/backend/internal/models"
)

func TestRequireRole(t *testing.T) {
	adminOnlyHandler := RequireRole(models.RoleAdmin)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	}))

	// Case 1: Superadmin should always have access even if not explicitly listed
	reqSuperadmin := httptest.NewRequest(http.MethodGet, "/admin", nil)
	ctxSuperadmin := context.WithValue(reqSuperadmin.Context(), UserContextKey, &JWTClaims{
		UserID: "super-1",
		Role:   models.RoleSuperadmin,
	})
	recSuperadmin := httptest.NewRecorder()
	adminOnlyHandler.ServeHTTP(recSuperadmin, reqSuperadmin.WithContext(ctxSuperadmin))
	if recSuperadmin.Code != http.StatusOK {
		t.Errorf("expected superadmin status 200, got %d", recSuperadmin.Code)
	}

	// Case 2: Admin should have access
	reqAdmin := httptest.NewRequest(http.MethodGet, "/admin", nil)
	ctxAdmin := context.WithValue(reqAdmin.Context(), UserContextKey, &JWTClaims{
		UserID: "admin-1",
		Role:   models.RoleAdmin,
	})
	recAdmin := httptest.NewRecorder()
	adminOnlyHandler.ServeHTTP(recAdmin, reqAdmin.WithContext(ctxAdmin))
	if recAdmin.Code != http.StatusOK {
		t.Errorf("expected admin status 200, got %d", recAdmin.Code)
	}

	// Case 3: Regular User should be forbidden (Scenario 10)
	reqUser := httptest.NewRequest(http.MethodGet, "/admin", nil)
	ctxUser := context.WithValue(reqUser.Context(), UserContextKey, &JWTClaims{
		UserID: "user-1",
		Role:   models.RoleUser,
	})
	recUser := httptest.NewRecorder()
	adminOnlyHandler.ServeHTTP(recUser, reqUser.WithContext(ctxUser))
	if recUser.Code != http.StatusForbidden {
		t.Errorf("expected user status 403 Forbidden, got %d", recUser.Code)
	}

	// Case 4: Unauthenticated should be 401
	reqUnauth := httptest.NewRequest(http.MethodGet, "/admin", nil)
	recUnauth := httptest.NewRecorder()
	adminOnlyHandler.ServeHTTP(recUnauth, reqUnauth)
	if recUnauth.Code != http.StatusUnauthorized {
		t.Errorf("expected unauth status 401, got %d", recUnauth.Code)
	}
}
