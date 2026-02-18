# Perspective Demo — Test Users

These users are pre-configured in the Perspective Demo identity provider.
All passwords: `Demo1234!`

Store these in a `lib/users.ts` file as a typed array. Hash passwords with bcrypt (cost 12) at build time or on first startup.

## User 1: John Smith (Bricklayer)

| Field | Value |
|-------|-------|
| Email | john@smithbricklaying.com.au |
| Password | Demo1234! |
| ContactId | a1b2c3d4-e5f6-7890-abcd-ef1234567890 |
| FirstNames | John |
| Surname | Smith |
| MobileNumber | 0412345678 |
| AddressLineOne | 45 Builder Lane |
| AddressLineTwo | |
| Suburb | Penrith |
| Poscode | 2750 |
| OrganisationContactId | e5f6a7b8-c9d0-1234-5678-9abcdef01234 |
| OrganisationFullName | Smith Bricklaying Pty Ltd |
| TradingName | Smith Bricklaying |
| ABN | 12345678901 |
| OrganisationAlternateKey (Vendor ID) | SMIBRIC |

## User 2: Sarah Chen (Painter)

| Field | Value |
|-------|-------|
| Email | sarah@chenpaint.com.au |
| Password | Demo1234! |
| ContactId | b2c3d4e5-f6a7-8901-bcde-f12345678901 |
| FirstNames | Sarah |
| Surname | Chen |
| MobileNumber | 0423456789 |
| AddressLineOne | 12 Colour Street |
| AddressLineTwo | |
| Suburb | Blacktown |
| Poscode | 2148 |
| OrganisationContactId | f6a7b8c9-d0e1-2345-6789-abcdef012345 |
| OrganisationFullName | Chen Painting Services Pty Ltd |
| TradingName | Chen Painting |
| ABN | 23456789012 |
| OrganisationAlternateKey (Vendor ID) | PLWPAIN |

## User 3: David Wilson (Frame Carpenter)

| Field | Value |
|-------|-------|
| Email | david@wilsonframes.com.au |
| Password | Demo1234! |
| ContactId | c3d4e5f6-a7b8-9012-cdef-123456789012 |
| FirstNames | David |
| Surname | Wilson |
| MobileNumber | 0434567890 |
| AddressLineOne | 78 Timber Road |
| AddressLineTwo | Unit 3 |
| Suburb | Castle Hill |
| Poscode | 2154 |
| OrganisationContactId | a7b8c9d0-e1f2-3456-789a-bcdef0123456 |
| OrganisationFullName | Wilson Framing & Carpentry Pty Ltd |
| TradingName | Wilson Frames |
| ABN | 34567890123 |
| OrganisationAlternateKey (Vendor ID) | FEIDAPA |

## User 4: Admin / Demo User

| Field | Value |
|-------|-------|
| Email | admin@perspective-demo.com |
| Password | Demo1234! |
| ContactId | d4e5f6a7-b8c9-0123-defa-234567890123 |
| FirstNames | Demo |
| Surname | Admin |
| MobileNumber | 0400000000 |
| AddressLineOne | 1 Demo Street |
| AddressLineTwo | |
| Suburb | Sydney |
| Poscode | 2000 |
| OrganisationContactId | b8c9d0e1-f2a3-4567-89ab-cdef01234567 |
| OrganisationFullName | Perspective Demo Pty Ltd |
| TradingName | Perspective Demo |
| ABN | 00000000000 |
| OrganisationAlternateKey (Vendor ID) | DEMADM |
