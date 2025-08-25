# SOAP Manager API Documentation

Complete API reference for the SOAP STASE ANAK hospital management system.

## Table of Contents

- [Authentication](#authentication)
- [Response Format](#response-format)
- [Error Codes](#error-codes)
- [Endpoints](#endpoints)
  - [Hospitals](#hospitals)
  - [Bangsal (Wards)](#bangsal-wards)
  - [Patients](#patients)
  - [SOAP Documentation](#soap-documentation)
  - [Plan Management](#plan-management)
- [Testing](#testing)
- [Database Seeding](#database-seeding)

## Authentication

All API endpoints require authentication using JWT Bearer tokens.

```http
Authorization: Bearer <your-jwt-token>
```

The JWT token should be obtained from Supabase authentication. The API uses Row Level Security (RLS) to ensure users can only access their own data.

## Response Format

All endpoints return a standardized JSON response:

### Success Response
```json
{
  "ok": true,
  "data": { /* response data */ },
  "requestId": "req_1234567890_abcdef123"
}
```

### Error Response
```json
{
  "ok": false,
  "error": "Error message",
  "requestId": "req_1234567890_abcdef123"
}
```

## Error Codes

| HTTP Status | Error Type | Description |
|-------------|------------|-------------|
| 400 | Bad Request | Invalid request data, malformed UUID, missing parameters |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | RLS violation - accessing data you don't own |
| 404 | Not Found | Resource doesn't exist or RLS prevents access |
| 409 | Conflict | Unique constraint violation (duplicate names) |
| 500 | Internal Error | Server error |

## Endpoints

### Hospitals

Hospital management endpoints. Each user can have multiple hospitals with unique names.

#### `GET /api/hospitals`

List all hospitals owned by the authenticated user.

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "owner_id": "user-123",
      "name": "RSUP Dr. Sardjito Yogyakarta"
    }
  ]
}
```

#### `POST /api/hospitals`

Create a new hospital.

**Request:**
```json
{
  "name": "Hospital Name"
}
```

**Response (201):**
```json
{
  "ok": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "owner_id": "user-123",
    "name": "Hospital Name"
  }
}
```

#### `GET /api/hospitals/{id}`

Get specific hospital details.

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "owner_id": "user-123", 
    "name": "Hospital Name"
  }
}
```

#### `PUT /api/hospitals/{id}`

Update hospital information.

**Request:**
```json
{
  "name": "Updated Hospital Name"
}
```

#### `DELETE /api/hospitals/{id}`

Delete a hospital and all related data (cascade delete).

**Response:**
```json
{
  "ok": true,
  "data": { "deleted": true }
}
```

### Bangsal (Wards)

Ward management within hospitals.

#### `GET /api/bangsal?hospital_id={hospital_id}`

List all bangsal for a specific hospital.

**Parameters:**
- `hospital_id` (required): Hospital UUID

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "456e7890-e89b-12d3-a456-426614174000",
      "hospital_id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Anak A"
    }
  ]
}
```

#### `POST /api/bangsal`

Create a new bangsal within a hospital.

**Request:**
```json
{
  "hospital_id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "ICU Anak"
}
```

#### `GET /api/bangsal/{id}`

Get bangsal details with hospital information.

#### `PUT /api/bangsal/{id}`

Update bangsal name.

#### `DELETE /api/bangsal/{id}`

Delete a bangsal.

### Patients

Patient management with hospital and bangsal assignments.

#### `GET /api/patients`

List patients with optional filtering and searching.

**Query Parameters:**
- `hospital_id` (optional): Filter by hospital
- `bangsal_id` (optional): Filter by bangsal  
- `search` (optional): Search by name (case-insensitive, partial matching)

**Examples:**
- `/api/patients` - All patients
- `/api/patients?search=Bintang` - Search for "Bintang"
- `/api/patients?hospital_id=123...&bangsal_id=456...` - Filter by location

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "789e1234-e89b-12d3-a456-426614174000",
      "owner_id": "user-123",
      "hospital_id": "123e4567-e89b-12d3-a456-426614174000",
      "bangsal_id": "456e7890-e89b-12d3-a456-426614174000",
      "room_number": "101",
      "full_name": "Bintang Putra Ramadhan",
      "mrn": "MRN0001",
      "created_at": "2024-01-15T10:30:00Z",
      "hospital": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "RSUP Dr. Sardjito"
      },
      "bangsal": {
        "id": "456e7890-e89b-12d3-a456-426614174000",
        "name": "Anak A"
      }
    }
  ]
}
```

#### `POST /api/patients`

Create a new patient.

**Request:**
```json
{
  "hospital_id": "123e4567-e89b-12d3-a456-426614174000",
  "bangsal_id": "456e7890-e89b-12d3-a456-426614174000",
  "full_name": "Patient Name",
  "room_number": "101",
  "mrn": "MRN001"
}
```

**Validation:**
- `hospital_id` and `bangsal_id` are required and must be valid UUIDs
- `full_name` is required
- `room_number` and `mrn` are optional
- The bangsal must belong to the specified hospital
- The hospital must be owned by the authenticated user

#### `GET /api/patients/{id}`

Get patient details with hospital and bangsal information.

#### `PUT /api/patients/{id}`

Update patient information. All fields are optional.

**Request:**
```json
{
  "full_name": "Updated Name",
  "room_number": "102",
  "bangsal_id": "different-bangsal-id"
}
```

#### `DELETE /api/patients/{id}`

Delete a patient and all related SOAP entries.

### SOAP Documentation

SOAP (Subjective, Objective, Assessment, Plan) medical documentation.

#### `GET /api/patients/{patient_id}/soap/latest`

Get the most recent SOAP entry for a patient.

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "abc12345-e89b-12d3-a456-426614174000",
    "patient_id": "789e1234-e89b-12d3-a456-426614174000",
    "s": "Patient complains of fever for 2 days",
    "o": "Temperature 38.5°C, HR 100 bpm, RR 24/min",
    "a": "Community acquired pneumonia",
    "p": [
      {
        "drug": "Paracetamol",
        "dose": "500mg",
        "route": "PO",
        "freq": "q6h",
        "days": 3,
        "start_date": "2024-01-15",
        "end_date": "2024-01-17",
        "status": "active"
      }
    ],
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

Returns `null` if no SOAP entries exist for the patient.

#### `POST /api/patients/{patient_id}/soap`

Create a new SOAP entry with plan items.

**Request:**
```json
{
  "patient_id": "789e1234-e89b-12d3-a456-426614174000",
  "s": "Subjective findings",
  "o": "Objective findings", 
  "a": "Assessment",
  "p": [
    {
      "drug": "Paracetamol",
      "dose": "500mg",
      "route": "PO",
      "freq": "q6h",
      "days": 3
    },
    {
      "drug": "Amoxicillin",
      "dose": "250mg",
      "route": "PO", 
      "freq": "q8h",
      "days": 7,
      "start_date": "2024-01-16"
    }
  ]
}
```

**Plan Item Fields:**
- `drug` (required): Medication name
- `dose` (optional): Dosage amount
- `route` (optional): Route of administration (PO, IV, IM, etc.)
- `freq` (optional): Frequency (q6h, bid, tid, etc.)
- `days` (optional): Duration in days
- `start_date` (optional): Start date (YYYY-MM-DD). Defaults to today in Jakarta timezone

**Auto-computed fields:**
- `end_date`: Calculated as start_date + days - 1
- `status`: 'active' if end_date >= today, 'done' otherwise

#### `GET /api/soap/{soap_id}`

Get a specific SOAP entry by ID.

#### `PUT /api/soap/{soap_id}`

Update S/O/A fields of a SOAP entry. Plan items are managed separately.

**Request:**
```json
{
  "s": "Updated subjective",
  "o": "Updated objective",
  "a": "Updated assessment"
}
```

### Plan Management

Medication plan management with automatic status computation.

#### `POST /api/soap/{soap_id}/plan-items`

Add new plan items to an existing SOAP entry.

**Request:**
```json
{
  "items": [
    {
      "drug": "Cefotaxime",
      "dose": "1g",
      "route": "IV",
      "freq": "q8h", 
      "days": 5
    },
    {
      "drug": "Furosemide",
      "dose": "20mg",
      "route": "IV",
      "freq": "q12h",
      "days": 3
    }
  ]
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "soap": { /* updated SOAP object */ },
    "planSummary": "Plan Aktif\n- Cefotaxime 1g IV q8h (5 hari, sampai 20 Jan)\n- Furosemide 20mg IV q12h (3 hari, sampai 18 Jan)\n\n---- Plan Selesai\n- Paracetamol 500mg PO q6h (3 hari, selesai 17 Jan)",
    "addedItems": 2
  }
}
```

This endpoint:
1. Adds new plan items with auto-computed dates and status
2. Recomputes status of existing plan items
3. Returns a formatted plan summary in Indonesian

#### `POST /api/soap/{soap_id}/recompute-plan`

Recompute plan item statuses based on current date.

**Response:**
```json
{
  "ok": true,
  "data": {
    "soap": { /* updated SOAP object */ },
    "planSummary": "Plan Aktif\n- Active items...\n\n---- Plan Selesai\n- Completed items...",
    "changed": true,
    "statusChanges": 2
  }
}
```

Use this endpoint to:
- Update plan statuses when the date changes
- Get a formatted summary of active vs completed medications
- Check if any statuses actually changed

## Testing

### 1. Database Seeding

First, seed the database with test data:

```bash
npm run seed
```

This creates:
- 3 sample hospitals
- 4 bangsal per hospital  
- 10 sample patients with Indonesian names
- SOAP entries with realistic medical data
- Plan items with various medication schedules

### 2. Postman Collection

Import the Postman collection and environment:

1. **Collection**: `postman/SOAP-Manager-API.postman_collection.json`
2. **Environment**: `postman/SOAP-Manager-API.postman_environment.json`

### 3. Authentication Setup

1. Get a JWT token from your Supabase authentication
2. Set the `auth_token` variable in Postman environment
3. Update `base_url` to match your server (default: `http://localhost:5173`)

### 4. Test Execution

The Postman collection includes:

- ✅ **Automated tests** for all endpoints
- 🔄 **Variable management** (IDs are passed between requests)
- 🧪 **Error scenarios** (401, 400, 404, 409)
- 🧹 **Cleanup scripts** to remove test data

**Run order:**
1. **Hospitals** → Create and manage hospitals
2. **Bangsal** → Create wards within hospitals
3. **Patients** → Create patients in wards
4. **SOAP** → Create medical documentation
5. **Plan Management** → Add and manage medications
6. **Error Cases** → Test validation and security
7. **Cleanup** → Remove test data

### 5. cURL Examples

#### Get all hospitals
```bash
curl -X GET "http://localhost:5173/api/hospitals" \
  -H "Authorization: Bearer <your-token>"
```

#### Search patients
```bash
curl -X GET "http://localhost:5173/api/patients?search=Bintang" \
  -H "Authorization: Bearer <your-token>"
```

#### Create SOAP entry
```bash
curl -X POST "http://localhost:5173/api/patients/{patient_id}/soap" \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "s": "Patient complains of fever",
    "o": "Temperature 38.5°C",
    "a": "Suspected pneumonia",
    "p": [
      {
        "drug": "Paracetamol",
        "dose": "500mg", 
        "route": "PO",
        "freq": "q6h",
        "days": 3
      }
    ]
  }'
```

## Database Seeding

The seeder creates realistic test data:

### Hospitals
- RSUP Dr. Sardjito Yogyakarta
- RS Dr. Moewardi Solo
- RSUP Dr. Kariadi Semarang

### Sample Patients
- Bintang Putra Ramadhan
- Anisa Putri Sari
- Muhammad Farid
- Siti Nurhaliza
- (and 6 more with Indonesian names)

### SOAP Templates
- Pneumonia cases
- Gastroenteritis cases
- Congenital heart disease cases

### Medications
- Paracetamol, Amoxicillin, Cefotaxime
- Furosemide, Ondansetron, Ranitidine
- Realistic dosing with proper routes and frequencies

All dates are computed in Jakarta timezone (Asia/Jakarta) and medication statuses are automatically determined based on current date vs end date.

## Notes

- All timestamps use ISO 8601 format
- Dates are in YYYY-MM-DD format
- All operations respect Row Level Security (users can only access their own data)
- Plan items automatically compute active/done status based on Jakarta timezone
- Search is case-insensitive with partial matching using PostgreSQL ILIKE
- Hospital and bangsal names must be unique per owner
- Cascade deletes preserve data integrity