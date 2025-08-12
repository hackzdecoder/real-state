import React from 'react';
import Layout from './Layout';
import ResponsiveDrawer from '../shared/ResponsiveDrawer';

interface AppLayoutProps {
    children: React.ReactNode;
    primaryColor?: string;
    secondaryColor?: string;
    mode?: 'light' | 'dark';
    textColor?: string;
}

export default function AppLayout({
    children,
    primaryColor,
    secondaryColor,
    mode,
}: AppLayoutProps) {
    return (
        <Layout
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            mode={mode}
        >
            <ResponsiveDrawer>
                {children}
            </ResponsiveDrawer>
        </Layout>
    );
}
