# Build stage
FROM golang:1.21-alpine AS builder

# Install necessary packages
RUN apk add --no-cache git ca-certificates tzdata

# Set working directory
WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o stock-refresh .

# Final stage
FROM alpine:latest

# Install ca-certificates for HTTPS requests and tzdata for timezone
RUN apk --no-cache add ca-certificates tzdata

# Set working directory
WORKDIR /app

# Copy the binary from builder stage
COPY --from=builder /app/stock-refresh .

# Copy .env file if it exists (for local development)
COPY --from=builder /app/../../.env* ./

# Make it executable
RUN chmod +x ./stock-refresh

# Set default timezone (can be overridden with TZ env var)
ENV TZ=America/New_York

# Run the binary
CMD ["./stock-refresh"]