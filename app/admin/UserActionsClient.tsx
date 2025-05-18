'use client'

import { toast } from 'react-hot-toast'

interface ClientUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
}

type ActionResponse = {
  message: string;
  data?: any; 
  error?: any; 
};

interface UserActionsClientProps {
  user: ClientUser; 
  setRole: (formData: FormData) => Promise<ActionResponse>;
  removeRole: (formData: FormData) => Promise<ActionResponse>;
}

export default function UserActionsClient({ user, setRole, removeRole }: UserActionsClientProps) {
  const handleFormSubmit = async (
    action: (formData: FormData) => Promise<ActionResponse>,
    formData: FormData,
    successMessageOverride?: string
  ) => {
    try {
      const res = await action(formData);
      if (res.error) {
        toast.error(res.message || 'Erreur lors de la mise à jour du rôle.');
      } else {
        toast.success(successMessageOverride || res.message || 'Rôle mis à jour avec succès !');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Une erreur inattendue est survenue.');
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <form 
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(); 
            formData.append('id', user.id);
            formData.append('role', 'admin');
            await handleFormSubmit(setRole, formData, 'Rôle Admin attribué.');
          }}
          className="inline-block"
        >
          <button type="submit" className="px-3 py-1 text-xs rounded bg-purple-600 text-white hover:bg-purple-700 transition-colors">
            Admin
          </button>
        </form>

        <form 
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData();
            formData.append('id', user.id);
            formData.append('role', 'hopital');
            await handleFormSubmit(setRole, formData, 'Rôle Hôpital attribué.');
          }}
          className="inline-block"
        >
          <button type="submit" className="px-3 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700 transition-colors">
            Hôpital
          </button>
        </form>

        <form 
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData();
            formData.append('id', user.id);
            formData.append('role', 'ambulance');
            await handleFormSubmit(setRole, formData, 'Rôle Ambulance attribué.'); 
          }}
          className="inline-block"
        >
          <button type="submit" className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            Ambulance
          </button>
        </form>

        <form 
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData();
            formData.append('id', user.id);
            await handleFormSubmit(removeRole, formData, 'Rôle supprimé.');
          }}
          className="inline-block"
        >
          <button type="submit" className="px-3 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 transition-colors">
            Supprimer le Rôle
          </button>
        </form>
      </div>
    </>
  );
}
