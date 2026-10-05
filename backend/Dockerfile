# Build stage
FROM golang:1.26-alpine AS builder

WORKDIR /app

# Install git and build essentials
RUN apk add --no-cache git gcc musl-dev

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /smartlock-server ./cmd/server

# Final runtime image
FROM alpine:3.20

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata
ENV TZ=Asia/Pontianak

COPY --from=builder /smartlock-server /app/smartlock-server
COPY --from=builder /app/internal/database/init.sql /app/init.sql

EXPOSE 8080

CMD ["/app/smartlock-server"]
