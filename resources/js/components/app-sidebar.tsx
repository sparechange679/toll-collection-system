import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as walletIndex, transactions as walletTransactions } from '@/routes/wallet';
import { index as vehiclesIndex, create as vehiclesCreate } from '@/routes/vehicles';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, Wallet, Receipt, Car, Bell, Database, FileText, Activity } from 'lucide-react';
import AppLogo from './app-logo';

const getMainNavItems = (userRole: string): NavItem[] => {
    const items: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },
    ];

    // Add driver-specific links
    if (userRole === 'driver') {
        items.push(
            {
                title: 'My Vehicles',
                icon: Car,
                items: [
                    {
                        title: 'View All Vehicles',
                        href: vehiclesIndex(),
                    },
                    {
                        title: 'Add New Vehicle',
                        href: vehiclesCreate(),
                    },
                ],
            },
            {
                title: 'Notifications',
                href: { url: '/notifications', method: 'get' },
                icon: Bell,
            },
            {
                title: 'Wallet',
                href: walletIndex(),
                icon: Wallet,
            },
            {
                title: 'Transaction History',
                href: walletTransactions(),
                icon: Receipt,
            }
        );
    }

    // Add admin-specific links (mirroring Admin Dashboard quick actions)
    if (userRole === 'admin') {
        items.push(
            {
                title: 'Vehicles',
                icon: Database,
                items: [
                    {
                        title: 'Users & Vehicles',
                        href: { url: '/admin/vehicles/users', method: 'get' },
                        // icon left for submenu items is not supported in current NavMain
                    },
                    {
                        title: 'Vehicle Registry',
                        href: { url: '/admin/vehicles', method: 'get' },
                    },
                ],
            },
            {
                title: 'Notifications',
                icon: Bell,
                items: [
                    {
                        title: 'Send Toll Rate Notification',
                        href: { url: '/admin/notifications/toll-rate', method: 'get' },
                    },
                    {
                        title: 'All Notifications',
                        href: { url: '/admin/notifications', method: 'get' },
                    },
                ],
            },
            {
                title: 'Reports',
                href: { url: '/admin/reports', method: 'get' },
                icon: FileText,
            }
        );
    }

    // Add staff-specific links
    if (userRole === 'staff') {
        items.push(
            {
                title: 'Toll Gate Monitor',
                href: { url: '/staff/toll-gate-monitor', method: 'get' },
                icon: Activity,
            }
        );
    }

    return items;
};

export function AppSidebar() {
    const { auth } = usePage().props as unknown as {
        auth: { user: { role: string } };
    };
    const mainNavItems = getMainNavItems(auth.user.role);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
