import supabase from './supabase';

interface AdminUser {
    id: string;
    email: string;
    is_super_admin: boolean;
    created_at?: string;
    privileges: string[];
}

const DEFAULT_ADMIN_PRIVILEGES = [
    'manage_users',
    'view_profiles',
    'edit_profiles',
    'delete_profiles',
    'manage_messages',
    'view_analytics',
    'system_settings'
];

export async function checkAdminStatus(userId: string): Promise<{ isAdmin: boolean; privileges: string[] }> {
    try {
        const { data, error } = await supabase
            .from('admins')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error checking admin status:', error.message);
            return { isAdmin: false, privileges: [] };
        }

        return {
            isAdmin: !!data,
            privileges: data?.privileges || DEFAULT_ADMIN_PRIVILEGES
        };
    } catch (error) {
        console.error('Error checking admin status:', error);
        return { isAdmin: false, privileges: [] };
    }
}

export async function makeUserAdmin(userId: string, email: string, isSuperAdmin: boolean = false): Promise<{ success: boolean; error?: string }> {
    try {
        // Check if user is already an admin
        const { data: existingAdmin } = await supabase
            .from('admins')
            .select('*')
            .eq('id', userId)
            .single();

        if (existingAdmin) {
            return { success: false, error: 'User is already an admin' };
        }

        // Add user as admin with full privileges
        const { error } = await supabase
            .from('admins')
            .insert([
                {
                    id: userId,
                    email: email,
                    is_super_admin: isSuperAdmin,
                    privileges: DEFAULT_ADMIN_PRIVILEGES
                }
            ]);

        if (error) throw error;

        // Update user's role in auth.users if possible
        try {
            await supabase.auth.admin.updateUserById(
                userId,
                { user_metadata: { role: 'admin' } }
            );
        } catch (roleError) {
            console.warn('Could not update user role metadata:', roleError);
            // Continue anyway as this is not critical
        }

        return { success: true };
    } catch (error) {
        console.error('Error making user admin:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to make user admin'
        };
    }
}

export async function listAllAdmins(): Promise<{ admins: AdminUser[]; error?: string }> {
    try {
        const { data, error } = await supabase
            .from('admins')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return { admins: data || [] };
    } catch (error) {
        console.error('Error listing admins:', error);
        return {
            admins: [],
            error: error instanceof Error ? error.message : 'Failed to list admins'
        };
    }
}

export async function updateAdminPrivileges(
    userId: string,
    privileges: string[]
): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('admins')
            .update({ privileges })
            .eq('id', userId);

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('Error updating admin privileges:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update admin privileges'
        };
    }
}

export async function removeAdmin(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('admins')
            .delete()
            .eq('id', userId);

        if (error) throw error;

        // Remove admin role from user metadata
        try {
            await supabase.auth.admin.updateUserById(
                userId,
                { user_metadata: { role: 'user' } }
            );
        } catch (roleError) {
            console.warn('Could not update user role metadata:', roleError);
            // Continue anyway as this is not critical
        }

        return { success: true };
    } catch (error) {
        console.error('Error removing admin:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to remove admin'
        };
    }
}

export async function setupAdminTable() {
    try {
        // Check if admins table exists by attempting to select from it
        const { error: checkError } = await supabase
            .from('admins')
            .select('id')
            .limit(1);

        if (checkError) {
            console.log('Creating admins table...');

            // Create the admins table
            const { error: createError } = await supabase
                .rpc('create_admin_table', {});

            if (createError) {
                throw new Error(`Failed to create admin table: ${createError.message}`);
            }

            console.log('Admin table created successfully');
        } else {
            console.log('Admin table already exists');
        }

        return { success: true };
    } catch (error) {
        console.error('Error setting up admin table:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
} 