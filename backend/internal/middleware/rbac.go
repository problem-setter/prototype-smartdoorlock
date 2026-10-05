package middleware

import (
	"net/http"

	"github.com/personalism/smart-door-lock/backend/internal/models"
)

func RequireRole(roles ...models.UserRole) func(http.Handler) http.Handler {
	allowedRoles := make(map[models.UserRole]bool)
	for _, r := range roles {
		allowedRoles[r] = true
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := GetUserFromContext(r.Context())
			if !ok || claims == nil {
				http.Error(w, `{"error":"Unauthorized access"}`, http.StatusUnauthorized)
				return
			}

			// Superadmin always has full access
			if claims.Role == models.RoleSuperadmin {
				next.ServeHTTP(w, r)
				return
			}

			if !allowedRoles[claims.Role] {
				http.Error(w, `{"error":"Forbidden: insufficient permissions"}`, http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
