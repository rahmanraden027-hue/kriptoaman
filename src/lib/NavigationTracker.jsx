import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { base44 } from '@/api/base44Client';
import { pagesConfig } from '@/pages.config';

const INDEXABLE_PAGE_KEYS = new Set([
    'Home', 'AboutUs', 'Edukasi', 'Contact', 'Disclaimer', 'PrivacyPolicy', 'RPCPrivacyPolicy',
    'TermsOfService', 'AccountDeletion', 'Market', 'KAM', 'KAMCampaignNews', 'KAMDeveloper',
    'KAMGlobalRoadmap', 'KAMLaunchReadiness', 'KAMNetwork', 'KAMNetworkDocs', 'KAMTokenomics',
]);

const INDEXABLE_DIRECT_PATHS = new Set([
    '/', '/en', '/founder', '/company', '/LegalCorporateInformation', '/SystemStatus', '/news/kam-campaign-2026',
]);

const PUBLIC_ROUTE_SEO = {
    '/': {
        title: 'KriptoAman — Crypto Intelligence & Digital Asset Monitoring',
        description: 'KriptoAman is a crypto intelligence and digital asset monitoring platform for market information, public-address monitoring, education, and risk context.',
    },
    '/AboutUs': {
        title: 'Tentang KriptoAman | PT Kripto Aman Indonesia',
        description: 'Mengenal KriptoAman, platform informasi dan pemantauan aset digital yang dioperasikan oleh PT Kripto Aman Indonesia, termasuk misi, kemampuan platform, dan kepemimpinan publik.',
    },
    '/Contact': {
        title: 'Kontak KriptoAman | PT Kripto Aman Indonesia',
        description: 'Kanal kontak resmi KriptoAman untuk dukungan dan pertanyaan mengenai platform PT Kripto Aman Indonesia.',
    },
    '/PrivacyPolicy': {
        title: 'Kebijakan Privasi | KriptoAman',
        description: 'Kebijakan Privasi KriptoAman menjelaskan data yang diproses, tujuan penggunaan, keamanan, retensi, penghapusan akun, dan hak pengguna.',
    },
    '/TermsOfService': {
        title: 'Syarat & Ketentuan Layanan | KriptoAman',
        description: 'Syarat dan ketentuan penggunaan KriptoAman, termasuk tanggung jawab pengguna, batasan layanan, risiko, dan ketentuan hukum yang berlaku.',
    },
    '/Disclaimer': {
        title: 'Disclaimer & Peringatan Risiko | KriptoAman',
        description: 'Disclaimer KriptoAman mengenai informasi aset digital, risiko pasar, data pihak ketiga, dan batasan bahwa konten bukan saran investasi.',
    },
    '/AccountDeletion': {
        title: 'Penghapusan Akun | KriptoAman',
        description: 'Informasi resmi mengenai cara pengguna KriptoAman meminta atau melakukan penghapusan akun dan data terkait yang berada dalam cakupan layanan.',
    },
    '/founder': {
        title: 'Raden Abdul Rahman — Founder & CEO KriptoAman',
        description: 'Profil resmi Raden Abdul Rahman, Founder & CEO KriptoAman. KriptoAman dioperasikan oleh PT Kripto Aman Indonesia.',
    },
    '/company': {
        title: 'PT Kripto Aman Indonesia — Company Facts | KriptoAman',
        description: 'Fakta resmi PT Kripto Aman Indonesia: identitas perusahaan, brand KriptoAman, kepemimpinan, corporate office, ruang lingkup platform, dan kanal verifikasi resmi.',
    },
    '/LegalCorporateInformation': {
        title: 'Legal & Corporate Information | PT Kripto Aman Indonesia',
        description: 'Informasi legal dan korporat PT Kripto Aman Indonesia, corporate office, ruang lingkup platform, posisi regulasi, dan kanal verifikasi resmi.',
    },
};

function ensureMeta(name) {
    let meta = document.querySelector(`meta[name="${name}"]`);
    if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
    }
    return meta;
}

function ensureCanonicalLink() {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
    }
    return link;
}

export default function NavigationTracker() {
    const location = useLocation();
    const { isAuthenticated } = useAuth();
    const { Pages } = pagesConfig;

    useEffect(() => {
        const pathname = location.pathname;
        const isLandingPage = pathname === '/' || pathname === '';
        let pageName = null;

        if (isLandingPage) {
            pageName = 'Home';
        } else {
            const pathSegment = pathname.replace(/^\//, '').split('/')[0];
            const pageKeys = Object.keys(Pages);
            pageName = pageKeys.find(key => key.toLowerCase() === pathSegment.toLowerCase()) || null;
        }

        const isIndexable = INDEXABLE_DIRECT_PATHS.has(pathname) || !!(pageName && INDEXABLE_PAGE_KEYS.has(pageName));
        ensureMeta('robots').setAttribute('content', isIndexable ? 'index, follow, max-image-preview:large' : 'noindex, nofollow, noarchive');

        ensureCanonicalLink().setAttribute(
            'href',
            isIndexable ? `https://kriptoaman.com${isLandingPage ? '/' : pathname}` : 'https://kriptoaman.com/'
        );

        const seo = PUBLIC_ROUTE_SEO[pathname];
        if (seo) {
            document.title = seo.title;
            ensureMeta('description').setAttribute('content', seo.description);
        }

        if (isAuthenticated && pageName) {
            base44.appLogs.logUserInApp(pageName).catch(() => {});
        }
    }, [location, isAuthenticated, Pages]);

    return null;
}
