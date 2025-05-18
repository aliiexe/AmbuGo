import { redirect } from 'next/navigation'
import { checkRole } from '@/utils/roles'
import { SearchUsers } from '@/components/SearchUsers'
import { clerkClient } from '@clerk/nextjs/server'
import { removeRole, setRole } from './_actions'
import UserActionsClient from './UserActionsClient'

interface ClientUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  publicMetadata: { role?: string | null };
  emailAddresses: Array<{ id: string, emailAddress: string }>;
  primaryEmailAddressId?: string | null;
}

export default async function AdminDashboard(params: {
  searchParams: { search?: string }
}) {
  const search = params.searchParams?.search;

  if (!await checkRole('admin')) {
    redirect('/')
  }

  const clerk = await clerkClient()

  const usersResponse = search
    ? await clerk.users.getUserList({ query: search })
    : await clerk.users.getUserList();

  const users: ClientUser[] = usersResponse.data.map(user => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    publicMetadata: { role: user.publicMetadata.role as string || undefined },
    emailAddresses: user.emailAddresses.map(e => ({ id: e.id, emailAddress: e.emailAddress})),
    primaryEmailAddressId: user.primaryEmailAddressId,
  }));

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Tableau de Bord Administrateur</h1>
      <p className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 text-sm text-blue-700">
        Ceci est le tableau de bord administrateur protégé, réservé aux utilisateurs avec le rôle `admin`.
      </p>

      <div className="mb-8">
        <SearchUsers />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => {
          const clientUser: ClientUser = {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            publicMetadata: { role: user.publicMetadata.role || null },
            emailAddresses: user.emailAddresses,
            primaryEmailAddressId: user.primaryEmailAddressId,
          };
          return (
            <div key={user.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-gray-600 text-sm">
                  {
                    user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)
                      ?.emailAddress
                  }
                </p>
                <div className="mt-2">
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                    {(user.publicMetadata.role as string) || "Aucun Rôle"}
                  </span>
                </div>
              </div>
              <UserActionsClient user={clientUser} setRole={setRole} removeRole={removeRole} />
            </div>
          )
        })}
      </div>
      
      {users.length === 0 && search && (
        <p className="text-center py-8 text-gray-500">Aucun utilisateur trouvé pour &quot;{search}&quot;</p>
      )}
    </div>
  )
}