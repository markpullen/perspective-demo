import bcrypt from 'bcryptjs'

export interface UserProfile {
  ContactId: string
  ContactFullName: string
  FirstNames: string
  Surname: string
  EmailAddress: string
  MobileNumber: string
  ContactPostalAddress: {
    AddressLineOne: string
    AddressLineTwo: string
    Suburb: string
    Poscode: string
    FullAddress: string
  }
  Organisations: Array<{
    OrganisationContactId: string
    OrganisationFullName: string
    TradingName: string
    ABN: string
    OrganisationAlternateKey: string
  }>
}

export interface User {
  id: string
  email: string
  passwordHash: string
  profile: UserProfile
}

// Password hash for "Demo1234!" with bcrypt cost 12
const DEMO_PASSWORD_HASH = '$2a$12$9AkFNVq2snCbqOpkSYvIq.pbuiABQeXqHSUG.SGbp05C29/0OoSKO'

export const users: User[] = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    email: 'john@smithbricklaying.com.au',
    passwordHash: DEMO_PASSWORD_HASH,
    profile: {
      ContactId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      ContactFullName: 'John Smith',
      FirstNames: 'John',
      Surname: 'Smith',
      EmailAddress: 'john@smithbricklaying.com.au',
      MobileNumber: '0412345678',
      ContactPostalAddress: {
        AddressLineOne: '45 Builder Lane',
        AddressLineTwo: '',
        Suburb: 'Penrith',
        Poscode: '2750',
        FullAddress: '45 Builder Lane, Penrith 2750',
      },
      Organisations: [
        {
          OrganisationContactId: 'e5f6a7b8-c9d0-1234-5678-9abcdef01234',
          OrganisationFullName: 'Smith Bricklaying Pty Ltd',
          TradingName: 'Smith Bricklaying',
          ABN: '12345678901',
          OrganisationAlternateKey: 'SMIBRIC',
        },
      ],
    },
  },
  {
    id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    email: 'sarah@chenpaint.com.au',
    passwordHash: DEMO_PASSWORD_HASH,
    profile: {
      ContactId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      ContactFullName: 'Sarah Chen',
      FirstNames: 'Sarah',
      Surname: 'Chen',
      EmailAddress: 'sarah@chenpaint.com.au',
      MobileNumber: '0423456789',
      ContactPostalAddress: {
        AddressLineOne: '12 Colour Street',
        AddressLineTwo: '',
        Suburb: 'Blacktown',
        Poscode: '2148',
        FullAddress: '12 Colour Street, Blacktown 2148',
      },
      Organisations: [
        {
          OrganisationContactId: 'f6a7b8c9-d0e1-2345-6789-abcdef012345',
          OrganisationFullName: 'Chen Painting Services Pty Ltd',
          TradingName: 'Chen Painting',
          ABN: '23456789012',
          OrganisationAlternateKey: 'PLWPAIN',
        },
      ],
    },
  },
  {
    id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    email: 'david@wilsonframes.com.au',
    passwordHash: DEMO_PASSWORD_HASH,
    profile: {
      ContactId: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
      ContactFullName: 'David Wilson',
      FirstNames: 'David',
      Surname: 'Wilson',
      EmailAddress: 'david@wilsonframes.com.au',
      MobileNumber: '0434567890',
      ContactPostalAddress: {
        AddressLineOne: '78 Timber Road',
        AddressLineTwo: 'Unit 3',
        Suburb: 'Castle Hill',
        Poscode: '2154',
        FullAddress: '78 Timber Road Unit 3, Castle Hill 2154',
      },
      Organisations: [
        {
          OrganisationContactId: 'a7b8c9d0-e1f2-3456-789a-bcdef0123456',
          OrganisationFullName: 'Wilson Framing & Carpentry Pty Ltd',
          TradingName: 'Wilson Frames',
          ABN: '34567890123',
          OrganisationAlternateKey: 'FEIDAPA',
        },
      ],
    },
  },
  {
    id: 'd4e5f6a7-b8c9-0123-defa-234567890123',
    email: 'admin@perspective-demo.com',
    passwordHash: DEMO_PASSWORD_HASH,
    profile: {
      ContactId: 'd4e5f6a7-b8c9-0123-defa-234567890123',
      ContactFullName: 'Demo Admin',
      FirstNames: 'Demo',
      Surname: 'Admin',
      EmailAddress: 'admin@perspective-demo.com',
      MobileNumber: '0400000000',
      ContactPostalAddress: {
        AddressLineOne: '1 Demo Street',
        AddressLineTwo: '',
        Suburb: 'Sydney',
        Poscode: '2000',
        FullAddress: '1 Demo Street, Sydney 2000',
      },
      Organisations: [
        {
          OrganisationContactId: 'b8c9d0e1-f2a3-4567-89ab-cdef01234567',
          OrganisationFullName: 'Perspective Demo Pty Ltd',
          TradingName: 'Perspective Demo',
          ABN: '00000000000',
          OrganisationAlternateKey: 'DEMADM',
        },
      ],
    },
  },
]

export function findUserByEmail(email: string): User | undefined {
  return users.find(u => u.email.toLowerCase() === email.toLowerCase())
}

export function findUserById(id: string): User | undefined {
  return users.find(u => u.id === id)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
