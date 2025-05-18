'use server'

import { checkRole } from '@/utils/roles'
import { clerkClient } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export async function setRole(formData: FormData) {
  const client = await clerkClient()
  const userId = formData.get('id') as string;
  const role = formData.get('role') as string;

  // Check that the user trying to set the role is an admin
  if (!await checkRole('admin')) {
    return { message: 'Not Authorized' }
  }

  try {
    const res = await client.users.updateUserMetadata(userId, {
      publicMetadata: { role: role },
    })
    revalidatePath('/admin') // refresh/revalidate the admin page
    return { message: `Role ${role} set for user ${userId}`, data: res.publicMetadata }
  } catch (err) {
    return { message: `Error setting role: ${err}` }
  }
}

export async function removeRole(formData: FormData) {
  const client = await clerkClient()
  const userId = formData.get('id') as string;
  
  // Check that the user trying to remove the role is an admin
  if (!await checkRole('admin')) {
    return { message: 'Not Authorized' }
  }

  try {
    const res = await client.users.updateUserMetadata(userId, {
      publicMetadata: { role: null },
    })
    revalidatePath('/admin') // refresh/revalidate  the admin page
    return { message: `Role removed for user ${userId}`, data: res.publicMetadata }
  } catch (err) {
    return { message: `Error removing role: ${err}` }
  }
} 