import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { base44 } from '@/api/base44Client';
import { pagesConfig } from '@/pages.config';

// Halaman publik statis yang boleh diindeks mesin pencari
const INDEXABLE_PAGE_KEYS = new Set([
    'Home', 'AboutUs', 'Edukasi', 'Contact', 'Disclaimer', 'PrivacyPolicy', 'TermsOfService',
]);

function ensureRobotsMeta() {
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'robots');
        document.head.appendChild(meta);
    }
    return meta;
}

export default function NavigationTracker() {
    const location = useLocation();
    const { isAuthenticated } = useAuth();
    const { Pages, mainPage } = pagesConfig;
    const mainPageKey = mainPage ?? Object.keys(Pages)[0];

    useEffect(() => {
        const pathname = location.pathname;
        let pageName;

        if (pathname === '/' || pathname === '') {
            pageName = mainPageKey;
        } else {
            const pathSegment = pathname.replace(/^\//, '').split('/')[0];
            const pageKeys = Object.keys(Pages);
            const matchedKey = pageKeys.find(
                key => key.toLowerCase() === pathSegment.toLowerCase()
            );
            pageName = matchedKey || null;
        }

        // noindex untuk halaman admin & internal; index hanya halaman publik statis
        const meta = ensureRobotsMeta();
        const isIndexable = !!(pageName && INDEXABLE_PAGE_KEYS.has(pageName));
        meta.setAttribute('content', isIndexable ? 'index, follow' : 'noindex, nofollow');

        if (isAuthenticated && pageName) {
            base44.appLogs.logUserInApp(pageName).catch(() => {});
        }
    }, [location, isAuthenticated, Pages, mainPageKey]);

    return null;
}