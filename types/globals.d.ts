export {}

// Create a type for the roles
export type Roles = 'ambulance' | 'hopital' | 'admin'

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Roles
    }
  }
}