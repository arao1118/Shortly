const swaggerDocument = {
  openapi: "3.0.0",

  info: {
    title: "Shortly API",
    version: "1.0.0",
    description:
      "REST API documentation for Shortly, a URL shortening service."
  },

  servers: [
    {
      url: "https://shortly-api-l2yj.onrender.com",
      description: "Production server"
    },
    {
      url: "http://localhost:4000",
      description: "Local development server"
    }
  ],

  tags: [
    {
      name: "Authentication",
      description: "User registration, login and account management"
    },
    {
      name: "URL Management",
      description: "Create, retrieve, redirect and delete shortened URLs"
    },
    {
      name: "User Resources",
      description: "Authenticated user's resources"
    },
    {
      name: "Testing",
      description: "API and rate-limit testing endpoints"
    }
  ],

  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "token",
        description:
          "JWT authentication token stored in an HTTP-only cookie."
      }
    },

    schemas: {
      UserInfo: {
        type: "object",
        properties: {
          _id: {
            type: "string",
            example: "66d123456789abcdef123456"
          },
          name: {
            type: "string",
            example: "Abhay rao"
          },
          email: {
            type: "string",
            format: "email",
            example: "abhay@example.com"
          }
        }
      },

      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: {
            type: "string",
            example: "Abhay rao"
          },
          email: {
            type: "string",
            format: "email",
            example: "abhay@example.com"
          },
          password: {
            type: "string",
            format: "password",
            minLength: 6,
            example: "secret123"
          }
        }
      },

      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "abhay@example.com"
          },
          password: {
            type: "string",
            format: "password",
            example: "secret123"
          }
        }
      },

      EmailRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "abhay@example.com"
          }
        }
      },

      VerifyRequest: {
        type: "object",
        required: ["email", "otp"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "abhay@example.com"
          },
          otp: {
            type: "integer",
            example: 123456
          }
        }
      },

      ResetPasswordRequest: {
        type: "object",
        required: ["email", "otp", "newPassword"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "abhay@example.com"
          },
          otp: {
            type: "integer",
            example: 123456
          },
          newPassword: {
            type: "string",
            example: "newSecret123"
          }
        }
      },

      DeleteUserRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "abhay@example.com"
          },
          password: {
            type: "string",
            format: "password",
            example: "secret123"
          }
        }
      },

      CreateUrlRequest: {
        type: "object",
        required: ["originalURL", "expirationDuration"],
        properties: {
          originalURL: {
            type: "string",
            example: "https://example.com/very/long/path"
          },
          expirationDuration: {
            type: "number",
            description: "Expiration duration in milliseconds.",
            example: 86400000
          }
        }
      },

      UserResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true
          },
          message: {
            type: "string",
            example: "User registered successfully."
          },
          userInfo: {
            $ref: "#/components/schemas/UserInfo"
          }
        }
      },

      Url: {
        type: "object",
        properties: {
          _id: {
            type: "string",
            example: "66d123456789abcdef123456"
          },
          originalURL: {
            type: "string",
            example: "https://example.com"
          },
          slug: {
            type: "string",
            example: "aB3xYz9"
          },
          user: {
            type: "string",
            example: "66d123456789abcdef123456"
          },
          expiresAt: {
            type: "string",
            format: "date-time",
            nullable: true,
            example: "2026-09-17T00:00:00.000Z"
          },
          status: {
            type: "string",
            enum: ["active", "expired", "disabled"],
            example: "active"
          },
          createdAt: {
            type: "string",
            format: "date-time"
          },
          updatedAt: {
            type: "string",
            format: "date-time"
          }
        }
      },

      SuccessResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true
          },
          message: {
            type: "string",
            example: "Request accepted"
          }
        }
      },

      ErrorResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: false
          },
          message: {
            type: "string",
            example: "Something went wrong."
          }
        }
      }
    }
  },

  paths: {

    // =========================
    // AUTHENTICATION
    // =========================

    "/api/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register a new user",
        description:
          "Creates a new user, hashes the password and sets the JWT authentication cookie.",

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/RegisterRequest"
              }
            }
          }
        },

        responses: {
          201: {
            description: "User registered successfully.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UserResponse"
                }
              }
            }
          },

          400: {
            description: "Missing or invalid fields."
          },

          409: {
            description: "User already exists.",
            content: {
              "application/json": {
                example: {
                  success: false,
                  message: "User already exists."
                }
              }
            }
          },

          500: {
            description: "Internal server error."
          }
        }
      }
    },

    "/api/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Login user",
        description:
          "Authenticates an existing verified user and sets the JWT authentication cookie.",

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/LoginRequest"
              }
            }
          }
        },

        responses: {
          200: {
            description: "Login successful.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UserResponse"
                }
              }
            }
          },

          400: {
            description: "Invalid request."
          },

          401: {
            description: "Invalid email or password."
          },

          403: {
            description: "Email is not verified."
          },

          500: {
            description: "Internal server error."
          }
        }
      }
    },

    "/api/auth/logout": {
      post: {
        tags: ["Authentication"],
        summary: "Logout user",
        description: "Clears the JWT authentication cookie.",
        security: [{ cookieAuth: [] }],

        responses: {
          200: {
            description: "Logged out successfully.",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Logged out successfully."
                }
              }
            }
          },

          401: {
            description: "Authentication token missing."
          },

          403: {
            description: "Invalid authentication token."
          }
        }
      }
    },

    "/api/auth/verify": {
      post: {
        tags: ["Authentication"],
        summary: "Send verification OTP",
        description: `Generates a 6-digit verification OTP and sends it to the user's email.\n
**Note:** OTP delivery may be delayed due to occasional delays on the SMTP provider's side.`,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/EmailRequest"
              }
            }
          }
        },

        responses: {
          200: {
            description: "OTP sent successfully.",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message:
                    "OTP has been sent to your registered email account."
                }
              }
            }
          },

          400: {
            description: "Invalid email, account does not exist, or already verified."
          },

          500: {
            description: "Internal server error."
          }
        }
      },

      put: {
        tags: ["Authentication"],
        summary: "Verify email",
        description:
          "Verifies the user's email using the verification OTP.",

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/VerifyRequest"
              }
            }
          }
        },

        responses: {
          200: {
            description: "Account verification successful.",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Account verification successful."
                }
              }
            }
          },

          400: {
            description: "Invalid, missing, expired or mismatched OTP."
          },

          500: {
            description: "Internal server error."
          }
        }
      }
    },

    "/api/auth/forgot-password": {
      post: {
        tags: ["Authentication"],
        summary: "Request password reset",
        description:
          "Generates a password-reset OTP and sends it to the registered email.",

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/EmailRequest"
              }
            }
          }
        },

        responses: {
          200: {
            description: "Reset OTP sent.",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message:
                    "OTP has been sent to your registered email account."
                }
              }
            }
          },

          400: {
            description: "Invalid email or account does not exist."
          },

          500: {
            description: "Internal server error."
          }
        }
      }
    },

    "/api/auth/reset-password": {
      patch: {
        tags: ["Authentication"],
        summary: "Reset password",
        description:
          "Validates the password-reset OTP and changes the user's password.",

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ResetPasswordRequest"
              }
            }
          }
        },

        responses: {
          200: {
            description: "Password updated.",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message:
                    "Password updated successfully. You can now log in."
                }
              }
            }
          },

          400: {
            description:
              "Invalid email, OTP, password, expired OTP or incorrect OTP."
          },

          500: {
            description: "Internal server error."
          }
        }
      }
    },

    "/api/auth/delete-user": {
      delete: {
        tags: ["Authentication"],
        summary: "Delete current user",
        description:
          "Deletes the authenticated user's account after checking email and password.",
        security: [{ cookieAuth: [] }],

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/DeleteUserRequest"
              }
            }
          }
        },

        responses: {
          200: {
            description: "User deleted."
          },

          400: {
            description: "Invalid user credentials or validation error."
          },

          401: {
            description: "Authentication token missing."
          },

          403: {
            description: "Invalid authentication token."
          },

          500: {
            description: "Internal server error."
          }
        }
      }
    },

    // =========================
    // URL MANAGEMENT
    // =========================

    "/api/url": {
      post: {
        tags: ["URL Management"],
        summary: "Create short URL",
        description:
          "Creates a shortened URL owned by the authenticated user.",
        security: [{ cookieAuth: [] }],

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreateUrlRequest"
              }
            }
          }
        },

        responses: {
          201: {
            description: "Short URL created successfully.",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Short URL created successfully",
                  data: {
                    _id: "...",
                    originalURL:
                      "https://example.com/very/long/path",
                    slug: "aB3xYz9",
                    user: "...",
                    expiresAt: "2026-09-17T00:00:00.000Z",
                    status: "active"
                  }
                }
              }
            }
          },

          400: {
            description: "Invalid URL or expiration duration."
          },

          401: {
            description: "Authentication required."
          },

          403: {
            description: "Invalid authentication token."
          },

          500: {
            description: "Internal server error."
          }
        }
      },

      get: {
        tags: ["URL Management"],
        summary: "Find short URL by original URL",
        description:
          "Finds a short URL belonging to the authenticated user using its original URL.",
        security: [{ cookieAuth: [] }],

        parameters: [
          {
            name: "originalURL",
            in: "query",
            required: true,
            description: "Original URL to search for.",
            schema: {
              type: "string",
              example: "https://example.com"
            }
          }
        ],

        responses: {
          200: {
            description: "URL found.",
            content: {
              "application/json": {
                example: {
                  originalURL: "https://example.com",
                  slug: "aB3xYz9",
                  status: "active"
                }
              }
            }
          },

          400: {
            description: "URL does not exist for this user."
          },

          401: {
            description: "Authentication required."
          },

          403: {
            description: "Invalid authentication token."
          },

          500: {
            description: "Internal server error."
          }
        }
      }
    },

    "/api/url/{slug}": {
      get: {
        tags: ["URL Management"],
        summary: "Redirect using short URL",
        description: `Publicly resolves a short URL slug and redirects to the original URL.

**Note:** Swagger UI may display "Failed to fetch" when testing this redirect endpoint due to browser/CORS restrictions. If this occurs, try the endpoint using Postman, cURL, or open the short URL directly in your browser.`,
        parameters: [
          {
            name: "slug",
            in: "path",
            required: true,
            description: "Short URL slug.",
            schema: {
              type: "string",
              example: "aB3xYz9"
            }
          }
        ],

        responses: {
          302: {
            description: "Redirects to the original URL."
          },

          403: {
            description: "Link is temporarily deactivated."
          },

          404: {
            description: "Invalid or unknown URL."
          },

          410: {
            description: "Link has expired."
          },

          429: {
            description: "Public rate limit exceeded."
          }
        }
      },

      delete: {
        tags: ["URL Management"],
        summary: "Delete short URL",
        description:
          "Deletes a short URL if it belongs to the authenticated user.",
        security: [{ cookieAuth: [] }],

        parameters: [
          {
            name: "slug",
            in: "path",
            required: true,
            description: "Short URL slug.",
            schema: {
              type: "string",
              example: "aB3xYz9"
            }
          }
        ],

        responses: {
          200: {
            description: "URL deleted.",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message:
                    "The URL associated with aB3xYz9 has now been deleted."
                }
              }
            }
          },

          400: {
            description: "URL does not belong to this user."
          },

          401: {
            description: "Authentication required."
          },

          403: {
            description: "Invalid authentication token."
          },

          429: {
            description: "User rate limit exceeded."
          },

          500: {
            description: "Internal server error."
          }
        }
      }
    },

    // =========================
    // USER RESOURCES
    // =========================

    "/api/user/urls": {
      get: {
        tags: ["User Resources"],
        summary: "Get user's URLs",
        description:
          "Returns all short URLs created by the authenticated user.",
        security: [{ cookieAuth: [] }],

        responses: {
          200: {
            description: "URLs returned successfully.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/Url"
                  }
                }
              }
            }
          },

          400: {
            description: "User has not created any short links."
          },

          401: {
            description: "Authentication required."
          },

          403: {
            description: "Invalid authentication token."
          },

          429: {
            description: "User rate limit exceeded."
          },

          500: {
            description: "Internal server error."
          }
        }
      }
    },

    // =========================
    // TESTING
    // =========================

    "/api/test": {
      get: {
        tags: ["Testing"],
        summary: "Test public rate limiter",
        description:
          "Simple endpoint used to test the public Redis/IP-based rate limiter.",

        responses: {
          200: {
            description: "Request accepted.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SuccessResponse"
                },
                example: {
                  success: true,
                  message: "Request accepted"
                }
              }
            }
          },

          429: {
            description: "Rate limit exceeded.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse"
                },
                example: {
                  success: false,
                  message:
                    "Too many requests. Rate limit exceeded."
                }
              }
            }
          }
        }
      }
    }
  }
};

export default swaggerDocument;
