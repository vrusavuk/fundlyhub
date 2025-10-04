/**
 * OpenAPI 3.0 specification for FundlyHub API
 * Based on Supabase schema and service layer architecture
 */

export const apiSpecification = {
  openapi: "3.0.3",
  info: {
    title: "FundlyHub API",
    description: "The official API for the FundlyHub crowdfunding platform. Access fundraisers, user profiles, categories, donations, and search functionality.",
    version: "1.0.0",
    contact: {
      name: "FundlyHub API Support",
      url: "https://fundlyhub.com/support",
      email: "api@fundlyhub.com"
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT"
    }
  },
  servers: [
    {
      url: "https://sgcaqrtnxqhrrqzxmupa.supabase.co/rest/v1",
      description: "Production API"
    }
  ],
  paths: {
    "/fundraisers": {
      get: {
        summary: "List fundraisers",
        description: "Retrieve a paginated list of active public fundraisers with optional filtering",
        tags: ["Fundraisers"],
        parameters: [
          {
            name: "category_id",
            in: "query",
            description: "Filter by category ID",
            schema: { type: "string", format: "uuid" }
          },
          {
            name: "status",
            in: "query",
            description: "Filter by fundraiser status",
            schema: { 
              type: "string", 
              enum: ["draft", "active", "paused", "ended", "closed", "pending"] 
            }
          },
          {
            name: "limit",
            in: "query",
            description: "Number of results to return (max 100)",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 20 }
          },
          {
            name: "offset",
            in: "query",
            description: "Number of results to skip for pagination",
            schema: { type: "integer", minimum: 0, default: 0 }
          }
        ],
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Fundraiser" }
                }
              }
            }
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "500": { $ref: "#/components/responses/InternalError" }
        }
      },
      post: {
        summary: "Create fundraiser",
        description: "Create a new fundraiser (requires authentication)",
        tags: ["Fundraisers"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateFundraiserRequest" }
            }
          }
        },
        responses: {
          "201": {
            description: "Fundraiser created successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Fundraiser" }
              }
            }
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "500": { $ref: "#/components/responses/InternalError" }
        }
      }
    },
    "/fundraisers/{id}": {
      get: {
        summary: "Get fundraiser details",
        description: "Retrieve detailed information about a specific fundraiser",
        tags: ["Fundraisers"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Fundraiser ID or slug",
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Fundraiser details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/FundraiserDetail" }
              }
            }
          },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/InternalError" }
        }
      },
      put: {
        summary: "Update fundraiser",
        description: "Update fundraiser details (owner only)",
        tags: ["Fundraisers"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Fundraiser ID",
            schema: { type: "string", format: "uuid" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateFundraiserRequest" }
            }
          }
        },
        responses: {
          "200": {
            description: "Fundraiser updated successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Fundraiser" }
              }
            }
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/InternalError" }
        }
      }
    },
    "/categories": {
      get: {
        summary: "List categories",
        description: "Retrieve all active fundraising categories",
        tags: ["Categories"],
        responses: {
          "200": {
            description: "List of categories",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Category" }
                }
              }
            }
          },
          "500": { $ref: "#/components/responses/InternalError" }
        }
      }
    },
    "/rpc/get_category_stats": {
      post: {
        summary: "Get category statistics",
        description: "Retrieve statistics for all categories including campaign counts and total raised",
        tags: ["Categories"],
        responses: {
          "200": {
            description: "Category statistics",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/CategoryStats" }
                }
              }
            }
          },
          "500": { $ref: "#/components/responses/InternalError" }
        }
      }
    },
    "/donations": {
      post: {
        summary: "Create donation",
        description: "Create a new donation for a fundraiser",
        tags: ["Donations"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateDonationRequest" }
            }
          }
        },
        responses: {
          "201": {
            description: "Donation created successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Donation" }
              }
            }
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "500": { $ref: "#/components/responses/InternalError" }
        }
      }
    },
    "/profiles": {
      get: {
        summary: "List user profiles",
        description: "Retrieve public user profiles",
        tags: ["Profiles"],
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 20 }
          },
          {
            name: "offset",
            in: "query",
            schema: { type: "integer", minimum: 0, default: 0 }
          }
        ],
        responses: {
          "200": {
            description: "List of user profiles",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Profile" }
                }
              }
            }
          },
          "500": { $ref: "#/components/responses/InternalError" }
        }
      }
    },
    "/profiles/{userId}": {
      get: {
        summary: "Get user profile",
        description: "Retrieve a specific user's public profile",
        tags: ["Profiles"],
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            description: "User ID",
            schema: { type: "string", format: "uuid" }
          }
        ],
        responses: {
          "200": {
            description: "User profile",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Profile" }
              }
            }
          },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/InternalError" }
        }
      },
      put: {
        summary: "Update user profile",
        description: "Update user's own profile (authentication required)",
        tags: ["Profiles"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            description: "User ID",
            schema: { type: "string", format: "uuid" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateProfileRequest" }
            }
          }
        },
        responses: {
          "200": {
            description: "Profile updated successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Profile" }
              }
            }
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/InternalError" }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Supabase JWT authentication token"
      }
    },
    schemas: {
      Fundraiser: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string" },
          slug: { type: "string" },
          summary: { type: "string", nullable: true },
          story_html: { type: "string", nullable: true },
          goal_amount: { type: "number" },
          currency: { type: "string", default: "USD" },
          category: { type: "string", nullable: true },
          status: { 
            type: "string", 
            enum: ["draft", "active", "paused", "ended", "closed", "pending"] 
          },
          visibility: { type: "string", enum: ["public", "unlisted"] },
          cover_image: { type: "string", nullable: true },
          images: { type: "array", items: { type: "string" }, nullable: true },
          video_url: { type: "string", nullable: true },
          location: { type: "string", nullable: true },
          tags: { type: "array", items: { type: "string" }, nullable: true },
          end_date: { type: "string", format: "date", nullable: true },
          beneficiary_name: { type: "string", nullable: true },
          beneficiary_contact: { type: "string", nullable: true },
          owner_user_id: { type: "string", format: "uuid" },
          org_id: { type: "string", format: "uuid", nullable: true },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" }
        }
      },
      FundraiserDetail: {
        allOf: [
          { $ref: "#/components/schemas/Fundraiser" },
          {
            type: "object",
            properties: {
              total_raised: { type: "number" },
              donor_count: { type: "integer" },
              days_left: { type: "integer", nullable: true },
              profiles: { $ref: "#/components/schemas/Profile" }
            }
          }
        ]
      },
      CreateFundraiserRequest: {
        type: "object",
        required: ["title", "goal_amount"],
        properties: {
          title: { type: "string", minLength: 3, maxLength: 100 },
          summary: { type: "string", maxLength: 500 },
          story_html: { type: "string" },
          goal_amount: { type: "number", minimum: 1 },
          currency: { type: "string", default: "USD" },
          category_id: { type: "string", format: "uuid" },
          cover_image: { type: "string" },
          images: { type: "array", items: { type: "string" } },
          video_url: { type: "string" },
          location: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          end_date: { type: "string", format: "date" },
          beneficiary_name: { type: "string" },
          beneficiary_contact: { type: "string" }
        }
      },
      UpdateFundraiserRequest: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 3, maxLength: 100 },
          summary: { type: "string", maxLength: 500 },
          story_html: { type: "string" },
          goal_amount: { type: "number", minimum: 1 },
          status: { 
            type: "string", 
            enum: ["draft", "active", "paused", "ended", "closed"] 
          },
          category_id: { type: "string", format: "uuid" },
          cover_image: { type: "string" },
          images: { type: "array", items: { type: "string" } },
          video_url: { type: "string" },
          location: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          end_date: { type: "string", format: "date" },
          beneficiary_name: { type: "string" },
          beneficiary_contact: { type: "string" }
        }
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          emoji: { type: "string" },
          color_class: { type: "string" },
          description: { type: "string", nullable: true },
          display_order: { type: "integer" },
          is_active: { type: "boolean" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" }
        }
      },
      CategoryStats: {
        type: "object",
        properties: {
          category_id: { type: "string", format: "uuid" },
          category_name: { type: "string" },
          emoji: { type: "string" },
          color_class: { type: "string" },
          active_campaigns: { type: "integer" },
          closed_campaigns: { type: "integer" },
          total_raised: { type: "number" },
          campaign_count: { type: "integer" }
        }
      },
      Donation: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          fundraiser_id: { type: "string", format: "uuid" },
          donor_user_id: { type: "string", format: "uuid", nullable: true },
          amount: { type: "number" },
          tip_amount: { type: "number", nullable: true },
          net_amount: { type: "number", nullable: true },
          fee_amount: { type: "number", nullable: true },
          currency: { type: "string", default: "USD" },
          payment_provider: { type: "string", nullable: true },
          payment_status: { 
            type: "string", 
            enum: ["pending", "paid", "failed", "refunded"] 
          },
          receipt_id: { type: "string", nullable: true },
          created_at: { type: "string", format: "date-time" }
        }
      },
      CreateDonationRequest: {
        type: "object",
        required: ["fundraiser_id", "amount"],
        properties: {
          fundraiser_id: { type: "string", format: "uuid" },
          amount: { type: "number", minimum: 1 },
          tip_amount: { type: "number", minimum: 0 },
          currency: { type: "string", default: "USD" },
          payment_provider: { type: "string" }
        }
      },
      Profile: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          email: { type: "string", format: "email", nullable: true },
          avatar: { type: "string", nullable: true },
          bio: { type: "string", nullable: true },
          location: { type: "string", nullable: true },
          website: { type: "string", nullable: true },
          role: { type: "string", enum: ["visitor", "user", "admin"] },
          profile_visibility: { type: "string", default: "public" },
          campaign_count: { type: "integer" },
          total_funds_raised: { type: "number" },
          follower_count: { type: "integer" },
          following_count: { type: "integer" },
          social_links: { type: "object" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" }
        }
      },
      '/rpc/get_user_profile_stats': {
        post: {
          tags: ['Profiles'],
          summary: 'Get user profile statistics',
          operationId: 'getUserProfileStats',
          description: 'Returns aggregated statistics for a user profile',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user_id: { type: 'string', format: 'uuid' },
                  },
                  required: ['user_id'],
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Profile statistics',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      campaign_count: { type: 'integer' },
                      total_funds_raised: { type: 'number' },
                      follower_count: { type: 'integer' },
                      following_count: { type: 'integer' },
                    },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/rpc/get_organization_profile_stats': {
        post: {
          tags: ['Organizations'],
          summary: 'Get organization profile statistics',
          operationId: 'getOrganizationProfileStats',
          description: 'Returns aggregated statistics for an organization',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    org_id: { type: 'string', format: 'uuid' },
                  },
                  required: ['org_id'],
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Organization statistics',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      campaign_count: { type: 'integer' },
                      total_funds_raised: { type: 'number' },
                      follower_count: { type: 'integer' },
                    },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      UpdateProfileRequest: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 100 },
          bio: { type: "string", maxLength: 500 },
          location: { type: "string", maxLength: 100 },
          website: { type: "string", format: "uri" },
          avatar: { type: "string" },
          profile_visibility: { type: "string", enum: ["public", "private"] },
          social_links: { type: "object" }
        }
      },
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
          message: { type: "string" },
          code: { type: "string" }
        }
      }
    },
    responses: {
      BadRequest: {
        description: "Bad request",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" }
          }
        }
      },
      Unauthorized: {
        description: "Authentication required",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" }
          }
        }
      },
      Forbidden: {
        description: "Access denied",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" }
          }
        }
      },
      NotFound: {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" }
          }
        }
      },
      InternalError: {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" }
          }
        }
      }
    }
  },
  tags: [
    {
      name: "Fundraisers",
      description: "Operations for managing fundraising campaigns"
    },
    {
      name: "Categories",
      description: "Fundraiser categories and statistics"
    },
    {
      name: "Donations",
      description: "Donation operations and tracking"
    },
    {
      name: "Profiles", 
      description: "User profile management"
    }
  ]
};