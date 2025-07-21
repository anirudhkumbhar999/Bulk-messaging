import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import supabase from './lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { makeUserAdmin, removeAdmin } from './lib/admin-setup';

interface User {
    id: string;
    email: string;
    created_at: string;
}

interface AdminData {
    id: string;
    email: string;
    is_super_admin: boolean;
}

export default function AdminDashboard() {
    const [users, setUsers] = useState<User[]>([]);
    const [adminData, setAdminData] = useState<AdminData | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkAdminStatus();
        fetchUsers();
    }, []);

    const checkAdminStatus = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.replace('/admin-login');
                return;
            }

            const { data: adminData, error: adminError } = await supabase
                .from('admins')
                .select('*')
                .eq('id', user.id)
                .single();

            if (adminError || !adminData) {
                router.replace('/admin-login');
                return;
            }

            setAdminData(adminData);
        } catch (error) {
            console.error('Error checking admin status:', error);
            router.replace('/admin-login');
        }
    };

    const fetchUsers = async () => {
        try {
            const { data: users, error } = await supabase
                .from('profiles')
                .select('id, email, created_at')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(users || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            Alert.alert('Error', 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            router.replace('/admin-login');
        } catch (error) {
            console.error('Error signing out:', error);
            Alert.alert('Error', 'Failed to sign out');
        }
    };

    const handleMakeAdmin = async (userId: string, userEmail: string) => {
        if (!adminData?.is_super_admin) {
            Alert.alert('Error', 'Only super admins can promote users to admin');
            return;
        }

        try {
            const result = await makeUserAdmin(userId, userEmail);
            if (result.success) {
                Alert.alert('Success', 'User promoted to admin');
                fetchUsers(); // Refresh the user list
            } else {
                Alert.alert('Error', result.error || 'Failed to promote user to admin');
            }
        } catch (error) {
            console.error('Error making admin:', error);
            Alert.alert('Error', 'Failed to promote user to admin');
        }
    };

    const handleRemoveAdmin = async (userId: string) => {
        if (!adminData?.is_super_admin) {
            Alert.alert('Error', 'Only super admins can remove admin privileges');
            return;
        }

        try {
            const result = await removeAdmin(userId);
            if (result.success) {
                Alert.alert('Success', 'Admin privileges removed');
                fetchUsers(); // Refresh the user list
            } else {
                Alert.alert('Error', result.error || 'Failed to remove admin privileges');
            }
        } catch (error) {
            console.error('Error removing admin:', error);
            Alert.alert('Error', 'Failed to remove admin privileges');
        }
    };

    return (
        <LinearGradient
            colors={['#2c3e50', '#3498db']}
            style={styles.container}
        >
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <MaterialIcons name="admin-panel-settings" size={40} color="#fff" />
                    <View style={styles.headerTexts}>
                        <Text style={styles.title}>Welcome to Admin Dashboard</Text>
                        <Text style={styles.subtitle}>Manage your application settings and users</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <MaterialIcons name="logout" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.adminInfo}>
                <Text style={styles.adminText}>
                    Logged in as: {adminData?.email}
                    {adminData?.is_super_admin ? ' (Super Admin)' : ' (Admin)'}
                </Text>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>User Management</Text>
                    {loading ? (
                        <Text style={styles.loadingText}>Loading users...</Text>
                    ) : (
                        users.map((user) => (
                            <View key={user.id} style={styles.userCard}>
                                <View style={styles.userInfo}>
                                    <Text style={styles.userEmail}>{user.email}</Text>
                                    <Text style={styles.userDate}>
                                        Joined: {new Date(user.created_at).toLocaleDateString()}
                                    </Text>
                                </View>
                                {adminData?.is_super_admin && (
                                    <View style={styles.actionButtons}>
                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.promoteButton]}
                                            onPress={() => handleMakeAdmin(user.id, user.email)}
                                        >
                                            <Text style={styles.actionButtonText}>Make Admin</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.removeButton]}
                                            onPress={() => handleRemoveAdmin(user.id)}
                                        >
                                            <Text style={styles.actionButtonText}>Remove Admin</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerTexts: {
        marginLeft: 15,
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    subtitle: {
        fontSize: 14,
        color: '#fff',
        opacity: 0.8,
        marginTop: 5,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    logoutButton: {
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
    },
    adminInfo: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 10,
        marginHorizontal: 20,
        borderRadius: 8,
    },
    adminText: {
        color: '#fff',
        fontSize: 14,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    section: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 15,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    loadingText: {
        color: '#fff',
        textAlign: 'center',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    userCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
    },
    userInfo: {
        flex: 1,
    },
    userEmail: {
        color: '#fff',
        fontSize: 16,
        marginBottom: 5,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    userDate: {
        color: '#ccc',
        fontSize: 12,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        padding: 8,
        borderRadius: 6,
        marginLeft: 10,
    },
    promoteButton: {
        backgroundColor: '#2ecc71',
    },
    removeButton: {
        backgroundColor: '#e74c3c',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
}); 