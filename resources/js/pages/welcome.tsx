import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Truck, Users, Shield, UserCircle, TrendingUp, CreditCard, AlertCircle, FileText, DollarSign } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
                {/* Navigation */}
                <nav className="bg-white shadow-sm dark:bg-gray-900">
                    <div className="container mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-semibold text-gray-900 dark:text-white">
                                    <AppLogoIcon className="h-12 w-auto object-contain" />
                                </span>
                            </div>
                            <div className="hidden md:flex items-center gap-8">
                                <a href="#home" className="text-gray-700 hover:text-blue-600 dark:text-gray-300">
                                    Home
                                </a>
                                <a href="#staff" className="text-gray-700 hover:text-blue-600 dark:text-gray-300">
                                    Staff Dashboard
                                </a>
                                <a href="#driver" className="text-gray-700 hover:text-blue-600 dark:text-gray-300">
                                    Driver Portal
                                </a>
                                <a href="#admin" className="text-gray-700 hover:text-blue-600 dark:text-gray-300">
                                    Admin Dashboard
                                </a>
                            </div>
                            <div className="flex items-center gap-3">
                                {auth.user ? (
                                    <Link
                                        href={dashboard()}
                                        className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={login()}
                                            className="rounded-md border border-blue-600 px-5 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors dark:border-blue-400 dark:text-blue-400 dark:hover:bg-gray-800"
                                        >
                                            Log In
                                        </Link>
                                        {canRegister && (
                                            <Link
                                                href={register()}
                                                className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                                            >
                                                Sign Up
                                            </Link>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <section className="container mx-auto px-6 py-16">
                    <div className="rounded-2xl overflow-hidden shadow-2xl">
                        <div className="relative h-[400px] md:h-[500px]">
                            <img
                                src="/assets/images/bg-home.jpg"
                                alt="Toll Collection System"
                                className="w-full h-full object-cover object-center"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                                <div className="p-8 md:p-12 text-white">
                                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                                        Malawi RoadToll System
                                    </h1>
                                    <p className="text-lg md:text-xl text-gray-200 max-w-2xl">
                                        Professional transportation management for efficient toll collection and road safety across Malawi
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Portal Cards */}
                <section className="container mx-auto px-6 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Driver Portal */}
                        <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow dark:bg-gray-800">
                            <div className="flex justify-center mb-6">
                                <div className="bg-blue-100 p-4 rounded-full dark:bg-blue-900">
                                    <UserCircle className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-center mb-3 text-gray-900 dark:text-white">
                                Driver Portal
                            </h3>
                            <p className="text-gray-600 text-center mb-6 dark:text-gray-300">
                                Manage toll payments, track speed violations, and manage your account efficiently
                            </p>
                            <Link
                                href={auth.user?.role === 'driver' ? dashboard() : register()}
                                className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                            >
                                Access Driver Portal
                            </Link>
                        </div>

                        {/* Staff Dashboard */}
                        <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow dark:bg-gray-800">
                            <div className="flex justify-center mb-6">
                                <div className="bg-green-100 p-4 rounded-full dark:bg-green-900">
                                    <TrendingUp className="h-12 w-12 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-center mb-3 text-gray-900 dark:text-white">
                                Staff Dashboard
                            </h3>
                            <p className="text-gray-600 text-center mb-6 dark:text-gray-300">
                                Monitor vehicle flow, manage toll rates, and process real-time traffic data
                            </p>
                            <Link
                                href={auth.user?.role === 'staff' ? dashboard() : login()}
                                className="block w-full bg-green-600 text-white text-center py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                            >
                                Access Staff Dashboard
                            </Link>
                        </div>

                        {/* Admin Dashboard */}
                        <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow dark:bg-gray-800">
                            <div className="flex justify-center mb-6">
                                <div className="bg-purple-100 p-4 rounded-full dark:bg-purple-900">
                                    <Shield className="h-12 w-12 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-center mb-3 text-gray-900 dark:text-white">
                                Admin Dashboard
                            </h3>
                            <p className="text-gray-600 text-center mb-6 dark:text-gray-300">
                                Oversee system operations, manage users, and control policies and infrastructure
                            </p>
                            <Link
                                href={auth.user?.role === 'admin' ? dashboard() : login()}
                                className="block w-full bg-purple-600 text-white text-center py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                            >
                                Access Admin Dashboard
                            </Link>
                        </div>
                    </div>
                </section>

                {/* System Overview */}
                <section className="bg-white py-16 dark:bg-gray-800">
                    <div className="container mx-auto px-6">
                        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
                            System Overview
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            <div className="text-center">
                                <div className="flex justify-center mb-4">
                                    <Users className="h-12 w-12 text-blue-600" />
                                </div>
                                <div className="text-3xl font-bold text-gray-900 mb-2 dark:text-white">
                                    1,247
                                </div>
                                <div className="text-gray-600 dark:text-gray-400">Active Users</div>
                            </div>
                            <div className="text-center">
                                <div className="flex justify-center mb-4">
                                    <FileText className="h-12 w-12 text-green-600" />
                                </div>
                                <div className="text-3xl font-bold text-gray-900 mb-2 dark:text-white">
                                    15,392
                                </div>
                                <div className="text-gray-600 dark:text-gray-400">Toll Transactions</div>
                            </div>
                            <div className="text-center">
                                <div className="flex justify-center mb-4">
                                    <DollarSign className="h-12 w-12 text-purple-600" />
                                </div>
                                <div className="text-3xl font-bold text-gray-900 mb-2 dark:text-white">
                                    MWK 2.8M
                                </div>
                                <div className="text-gray-600 dark:text-gray-400">Revenue</div>
                            </div>
                            <div className="text-center">
                                <div className="flex justify-center mb-4">
                                    <AlertCircle className="h-12 w-12 text-orange-600" />
                                </div>
                                <div className="text-3xl font-bold text-gray-900 mb-2 dark:text-white">
                                    89
                                </div>
                                <div className="text-gray-600 dark:text-gray-400">Recent Alerts</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Quick Actions */}
                <section className="container mx-auto px-6 py-16">
                    <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <button className="bg-blue-600 text-white p-6 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-3">
                            <CreditCard className="h-6 w-6" />
                            <span className="font-medium">Pay Toll</span>
                        </button>
                        <button className="bg-blue-600 text-white p-6 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-3">
                            <AlertCircle className="h-6 w-6" />
                            <span className="font-medium">Check Violations</span>
                        </button>
                        <button className="bg-blue-600 text-white p-6 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-3">
                            <TrendingUp className="h-6 w-6" />
                            <span className="font-medium">Update Status</span>
                        </button>
                        <button className="bg-blue-600 text-white p-6 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-3">
                            <FileText className="h-6 w-6" />
                            <span className="font-medium">View Reports</span>
                        </button>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-gray-900 text-white py-12">
                    <div className="container mx-auto px-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div>
                                <h3 className="font-bold text-lg mb-4">Malawi RoadToll System</h3>
                                <p className="text-gray-400 text-sm">
                                    Professional road toll management for efficient toll collection and road safety across Malawi
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-4">System</h4>
                                <ul className="space-y-2 text-sm text-gray-400">
                                    <li><a href="#" className="hover:text-white">Staff Dashboard</a></li>
                                    <li><a href="#" className="hover:text-white">Driver Portal</a></li>
                                    <li><a href="#" className="hover:text-white">Admin Dashboard</a></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-4">Management</h4>
                                <ul className="space-y-2 text-sm text-gray-400">
                                    <li><a href="#" className="hover:text-white">User Management</a></li>
                                    <li><a href="#" className="hover:text-white">Policy Management</a></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-4">Support</h4>
                                <ul className="space-y-2 text-sm text-gray-400">
                                    <li><a href="#" className="hover:text-white">Technical Support</a></li>
                                    <li><a href="#" className="hover:text-white">Emergency Hotline</a></li>
                                </ul>
                            </div>
                        </div>
                        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
                            © 2025 Malawi Road Toll Infrastructure. All rights reserved. System Version 1.0
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
