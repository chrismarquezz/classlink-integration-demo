# Best Practices for Security and Efficiency

This document outlines best practices implemented in the ClassLink Integration Demo to ensure security, performance, and maintainability. These principles support the application’s architecture and operation in a production-ready environment.

---

## I. Security Best Practices

### 1. Secrets Management via AWS Secrets Manager

**Practice:** All sensitive credentials (e.g., API tokens, OIDC client secrets) are retrieved at runtime from **AWS Secrets Manager**. Secrets are never hardcoded or committed to version control.

**Benefit:** Prevents accidental exposure of sensitive credentials and allows secure rotation of secrets without modifying application code.

---

### 2. Principle of Least Privilege (PoLP)

**Practice:** Each AWS Lambda function is assigned an IAM execution role with only the permissions required to perform its intended function.

**Examples:**
- The `classlink-data-ingestion` function has write access to DynamoDB and read access to Secrets Manager.
- The `get-user-data` function has read-only access to DynamoDB.

**Benefit:** Minimizes the blast radius of a potential compromise by limiting access to only what is explicitly required.

---

### 3. Secured OAuth2 Authorization Flow

**Practice:** ClassLink's OAuth2 and OIDC login flow is used for user authentication. After login, a one-time authorization code is exchanged securely for an access token using backend logic.

**Benefit:** Authentication occurs through ClassLink's secure LaunchPad system. No sensitive tokens are exposed on the client side, and the server verifies access through a backend-only token exchange.

---

## II. Data Architecture Best Practices

### 1. Composite Keys for Multi-Tenancy

**Practice:** A composite key, formed by concatenating the `tenantId` and `sourcedId` (`tenantId_sourcedId`), is used as the primary `userId` in the DynamoDB tables.

**Benefit:** The `sourcedId` from the Roster Server API is only unique *within* a specific tenant (e.g., a school district). This composite key strategy creates a globally unique identifier for every user across all possible tenants, preventing data collisions and ensuring data integrity.

---

### 2. Data Isolation for Multiple Tenants

**Practice:** For applications designed to handle data from multiple tenants simultaneously, the recommended best practice is to segregate data into separate DynamoDB tables for each tenant.

**Benefit:** This ensures strict data isolation and security, preventing any possibility of one tenant's data being accidentally exposed to another.

---

## III. Efficiency and Maintainability Best Practices

### 1. Serverless Architecture

**Practice:** Backend functions are implemented using **AWS Lambda** and invoked via **API Gateway**.

**Benefit:**
- **Cost-efficient:** Compute is charged only during function execution.
- **Scalable:** Functions scale automatically with traffic volume.
- **Low maintenance:** No server provisioning or patching required.

---
