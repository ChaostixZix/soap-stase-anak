# SOAP Manager API - Testing Guide

Complete guide for testing the SOAP STASE ANAK API with database seeding and Postman collections.

## Quick Start

1. **Seed Database** - Populate with realistic test data
2. **Import Postman** - Load collection and environment
3. **Set Authentication** - Configure JWT token
4. **Run Tests** - Execute comprehensive test suite

## 📊 Database Seeding

### Installation

The seeder is already configured. Just run:

```bash
npm run seed
```

### What it creates:

| Type | Count | Examples |
|------|-------|----------|
| 🏥 Hospitals | 3 | RSUP Dr. Sardjito, RS Dr. Moewardi, RSUP Dr. Kariadi |
| 🏨 Bangsal | 12 | Anak A, NICU, PICU, Dahlia Anak, Melati 1 |
| 👶 Patients | 10 | Bintang Putra, Anisa Putri, Muhammad Farid |
| 📋 SOAP | 10 | Pneumonia, Gastroenteritis, Heart disease |
| 💊 Plans | 30+ | Paracetamol, Amoxicillin, Cefotaxime |

### Sample Data Features:

- **Realistic Names**: Indonesian names for cultural accuracy
- **Medical Conditions**: Age-appropriate pediatric cases
- **Medication Plans**: Proper dosing with Jakarta timezone dates
- **Room Assignments**: Realistic room numbers and MRN codes
- **Status Computation**: Active/done medications based on current date

### Manual Seeding

For custom environments or debugging:

```bash
# Development
SUPABASE_URL=your-dev-url SUPABASE_SERVICE_KEY=your-dev-key npm run seed

# Production (careful!)
SUPABASE_URL=your-prod-url SUPABASE_SERVICE_KEY=your-prod-key npm run seed
```

## 🧪 Postman Testing

### Files to Import

1. **Collection**: `postman/SOAP-Manager-API.postman_collection.json`
2. **Environment**: `postman/SOAP-Manager-API.postman_environment.json`

### Setup Steps

1. **Import Collection**
   - Open Postman
   - File → Import → Select collection file
   - Collection appears in sidebar

2. **Import Environment**
   - File → Import → Select environment file
   - Select "SOAP Manager API Environment" in top-right

3. **Configure Authentication**
   - Click environment name → Edit
   - Set `auth_token` to your JWT Bearer token
   - Update `base_url` if not using `http://localhost:5173`

### Getting Authentication Token

#### For Development:
```javascript
// In your SvelteKit app or browser console
import { supabase } from '$lib/supabaseClient';
const session = await supabase.auth.getSession();
console.log(session.data.session?.access_token);
```

#### For Testing:
```bash
# Create test user via Supabase Auth
curl -X POST 'YOUR_SUPABASE_URL/auth/v1/signup' \
  -H 'Content-Type: application/json' \
  -H 'apikey: YOUR_ANON_KEY' \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

## 🎯 Test Execution

### Automated Test Suite

The collection includes **50+ automated tests** covering:

#### ✅ Happy Path Tests
- Create, read, update, delete operations
- Data relationships and constraints
- Search and filtering functionality
- Plan item date computation
- Jakarta timezone handling

#### 🚨 Error Handling Tests
- 401 Unauthorized (missing token)
- 400 Bad Request (invalid data)
- 404 Not Found (non-existent resources)
- 409 Conflict (unique constraint violations)
- 403 Forbidden (RLS violations)

#### 🔄 Workflow Tests
- Complete patient admission workflow
- SOAP documentation with plan management
- Medication status updates over time
- Cross-resource validation

### Test Categories

| 🏥 Hospitals | 🏨 Bangsal | 👶 Patients | 📋 SOAP | 💊 Plans | 🧪 Errors |
|-------------|-----------|------------|---------|---------|---------|
| 5 tests | 4 tests | 6 tests | 5 tests | 2 tests | 4 tests |

### Running Tests

#### Individual Folders
- Right-click folder → "Run folder"
- Watch tests execute with automatic assertions
- Variables automatically passed between requests

#### Full Collection
- Click collection → "Run collection"
- Select all folders or specific ones
- Monitor test results in real-time

#### Command Line (Newman)
```bash
npm install -g newman
newman run postman/SOAP-Manager-API.postman_collection.json \
  -e postman/SOAP-Manager-API.postman_environment.json
```

## 📋 Test Scenarios

### 1. Basic CRUD Operations

Test the fundamental create, read, update, delete operations for all entities:

**Order**: Hospitals → Bangsal → Patients → SOAP → Plans

**Variables**: IDs are automatically captured and passed between requests

### 2. Search and Filtering

```
Search Scenarios:
├── Name search: "Bintang" → finds patients with "Bintang" in name
├── Hospital filter: hospital_id → patients in that hospital
├── Bangsal filter: bangsal_id → patients in that ward
└── Combined filters: hospital + bangsal + search
```

### 3. Medical Workflows

```
Clinical Workflow:
├── Admit patient → Hospital + Bangsal + Room
├── Create SOAP → S/O/A + Initial plan
├── Add medications → Plan items with dates
├── Update assessment → Modify S/O/A only
└── Recompute plan → Update medication statuses
```

### 4. Data Validation

```
Validation Tests:
├── UUID format validation → 400 for invalid UUIDs
├── Required fields → 400 for missing data
├── Relationship integrity → 400 for invalid references
├── Unique constraints → 409 for duplicates
└── RLS enforcement → 403 for unauthorized access
```

## 🔍 Test Results Interpretation

### Successful Test Output
```
✅ Response is successful (200/201)
✅ Response has correct structure
✅ Data validation passed
✅ Variables set correctly
```

### Common Failures & Solutions

#### 401 Unauthorized
```
❌ Response is 401 Unauthorized
🔧 Solution: Check auth_token in environment
```

#### 400 Bad Request
```
❌ Response is 400 Bad Request
🔧 Solution: Check request body format, UUID validity
```

#### 404 Not Found
```
❌ Response is 404 Not Found  
🔧 Solution: Ensure resource exists, check RLS permissions
```

#### 500 Internal Error
```
❌ Response is 500 Internal Server Error
🔧 Solution: Check server logs, database connection
```

## 🔄 Advanced Testing

### Custom Test Scenarios

Create your own tests by:

1. **Copying existing requests**
2. **Modifying request data**
3. **Adding custom assertions**

Example custom test:
```javascript
pm.test("Patient has correct hospital", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data.hospital.name).to.include("Sardjito");
});
```

### Performance Testing

Monitor response times:
```javascript
pm.test("Response time is less than 1000ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(1000);
});
```

### Data-Driven Testing

Use CSV files for bulk testing:
```csv
hospital_name,expected_status
"Valid Hospital",201
"",400
"Duplicate Name",409
```

## 🧹 Cleanup

The collection includes cleanup scripts that:
- Delete test patients (cascades to SOAP)
- Delete test bangsal
- Delete test hospitals
- Reset environment variables

**Always run cleanup** after testing to maintain clean state.

## 🐛 Troubleshooting

### Database Issues
```bash
# Check database connection
npm run seed

# Reset database (if needed)  
# Run your migration reset commands
```

### Authentication Issues
```bash
# Verify token is valid
curl -H "Authorization: Bearer YOUR_TOKEN" YOUR_SUPABASE_URL/auth/v1/user
```

### CORS Issues
```javascript
// In your SvelteKit app
// Ensure CORS is configured for API routes
export async function OPTIONS() {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
```

## 📈 Test Metrics

Track your testing:
- ✅ **Coverage**: All endpoints tested
- ⏱️ **Performance**: Response times < 1s
- 🔒 **Security**: RLS properly enforced  
- 🎯 **Reliability**: Tests pass consistently
- 📊 **Data Quality**: Realistic test scenarios

## 🚀 Next Steps

After successful API testing:

1. **Frontend Integration**: Connect UI to tested APIs
2. **MCP Server**: Implement tool interfaces
3. **Telegram Bot**: Add chat interface
4. **Production Deploy**: Use tested endpoints in production
5. **Monitoring**: Set up API monitoring based on test patterns

The comprehensive test suite ensures your API is production-ready with proper validation, error handling, and data integrity.