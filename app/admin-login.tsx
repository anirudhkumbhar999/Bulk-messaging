import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import supabase from './lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleAdminLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            setLoading(true);
            console.log('Attempting admin login for:', email);

            // First try to sign in
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (signInError) {
                console.log('Sign in error:', signInError.message);
                Alert.alert('Error', 'Invalid email or password');
                return;
            }

            console.log('Successfully signed in, checking admin status...', signInData.session?.user);

            // Check admin status by email (case-insensitive)
            const { data: adminData, error: adminError } = await supabase
                .from('admins')
                .select('*')
                .ilike('email', email)
                .maybeSingle();

            console.log('Admin check result:', {
                email,
                adminData,
                adminError,
                user: signInData.session?.user
            });

            if (adminError) {
                console.log('Admin check error:', adminError);
                Alert.alert('Error', 'Error checking admin status');
                return;
            }

            if (!adminData) {
                console.log('No admin record found for email:', email);
                Alert.alert('Error', 'This account does not have admin privileges');
                return;
            }

            // Successfully verified as admin
            console.log('Admin verification successful:', adminData);
            router.replace('/admin-dashboard');

        } catch (error) {
            console.error('Admin login error:', error);
            Alert.alert('Error', error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#2c3e50', '#3498db']}
            style={styles.container}
        >
            <View style={styles.content}>
                <View style={styles.header}>
                    <MaterialIcons name="admin-panel-settings" size={60} color="#fff" />
                    <Text style={styles.title}>Admin Login</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <MaterialIcons name="email" size={24} color="#fff" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="#ccc"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            autoComplete="email"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <MaterialIcons name="lock" size={24} color="#fff" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#ccc"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoComplete="password"
                        />
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleAdminLogin}
                            disabled={loading}
                        >
                            <Text style={styles.buttonText}>
                                {loading ? 'Logging in...' : 'Login as Admin'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.replace('/')}
                            style={styles.backLink}
                            disabled={loading}
                        >
                            <Text style={styles.backLinkText}>
                                <MaterialIcons name="arrow-back" size={16} color="#fff" /> Back to Sign In
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 10,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    form: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 15,
        padding: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 10,
        marginBottom: 15,
        paddingHorizontal: 15,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        paddingVertical: 12,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    button: {
        backgroundColor: '#2ecc71',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#95a5a6',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    backLink: {
        marginTop: 20,
        alignItems: 'center',
    },
    backLinkText: {
        color: '#fff',
        fontSize: 14,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        opacity: 0.9,
    },
}); 