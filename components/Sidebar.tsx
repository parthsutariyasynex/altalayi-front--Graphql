"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useLocalePath } from "@/hooks/useLocalePath";
import { api } from "@/lib/api/api-client";
import { Loader2 } from "lucide-react";

/**
 * Dynamic Sidebar component for the My Account section.
 * Fetches and renders menu items directly from the Magento API via a proxy route.
 */
interface SidebarItem {
    label: string;
    url: string;
    code: string;
    is_visible: boolean;
    sort_order: number;
}

interface SidebarResponse {
    user_type: string;
    items: SidebarItem[];
}

const Sidebar = () => {
    const pathname = usePathname();
    const { t } = useTranslation();
    const lp = useLocalePath();
    const [sidebarData, setSidebarData] = useState<SidebarResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const fetchSidebar = async () => {
            try {
                setLoading(true);
                // Call our local API proxy route which interacts with Magento
                const data = await api.get("/kleverapi/account-sidebar");
                if (isMounted) {
                    setSidebarData(data);
                    setError(null);
                }
            } catch (err: any) {
                console.error("[Sidebar] Fetch error:", err);
                if (isMounted) {
                    setError(err.message || "Failed to load sidebar");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchSidebar();
        return () => { isMounted = false; };
    }, []);

    // Graceful loading state
    if (loading) {
        return (
            <aside className="w-full lg:w-64 flex-shrink-0 bg-[#f8f8f8] border-b lg:border-b-0 ltr:lg:border-r rtl:lg:border-l border-[#ebebeb] z-30 sticky top-[56px] sm:top-[64px] lg:top-[108px] h-auto lg:h-[calc(100vh-108px)] flex flex-col items-center justify-center p-10">
                <Loader2 className="w-6 h-6 animate-spin text-[#f5a623] mb-2" />
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t("common.loading") || "Loading..."}</span>
            </aside>
        );
    }

    // Graceful error state/fallback
    if (error || !sidebarData || !sidebarData.items || sidebarData.items.length === 0) {
        return (
            <aside className="w-full lg:w-64 flex-shrink-0 bg-[#f8f8f8] border-b lg:border-b-0 ltr:lg:border-r rtl:lg:border-l border-[#ebebeb] z-30 sticky top-[56px] sm:top-[64px] lg:top-[108px] h-auto lg:h-[calc(100vh-108px)] p-4">
                <p className="text-[12px] text-gray-500 italic text-center py-10">
                    {t("sidebar.error") || "Account menu currently unavailable."}
                </p>
            </aside>
        );
    }

    // Process and sort items based on API response
    const visibleItems = sidebarData.items
        .filter(item => item.is_visible)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    return (
        <aside className="w-full lg:w-64 flex-shrink-0 bg-[#f8f8f8] border-b lg:border-b-0 ltr:lg:border-r rtl:lg:border-l border-[#ebebeb] z-30 sticky top-[56px] sm:top-[64px] lg:top-[108px] h-auto lg:h-[calc(100vh-108px)] overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto custom-scrollbar shadow-sm lg:shadow-none">
            <nav className="p-0 lg:p-4">
                <ul className="flex flex-row lg:flex-col space-y-0 lg:space-y-1">
                    {visibleItems.map((item) => {
                        // Handle absolute URLs from Magento: convert to relative paths
                        let href = item.url || "#";
                        try {
                            if (href.startsWith("http")) {
                                const urlObj = new URL(href);
                                href = urlObj.pathname + urlObj.search;
                            }
                        } catch (e) {
                            console.error("[Sidebar] URL parsing error:", e);
                        }

                        // Logout logic is triggered by identifying the code (no hardcoded links)
                        const isSignOut = item.code === "sign_out" || item.code === "logout" || item.code === "customer_logout";
                        
                        // Dynamic active state detection
                        const isActive = !isSignOut && (pathname === href || (href !== "/" && pathname.startsWith(href)));

                        if (isSignOut) {
                            return (
                                <li key={item.code} className="flex-shrink-0">
                                    <button
                                        onClick={() => signOut({ callbackUrl: `${window.location.origin}${lp("/login")}` })}
                                        className="block w-full ltr:text-left rtl:text-right py-3 px-6 lg:px-4 text-gray-600 hover:text-black hover:bg-gray-100 transition-all duration-200 border-b-[3px] lg:border-b-0 ltr:lg:border-l-4 rtl:lg:border-r-4 border-transparent whitespace-nowrap font-medium text-[13px] md:text-[14px]"
                                    >
                                        {item.label}
                                    </button>
                                </li>
                            );
                        }

                        return (
                            <li key={item.code} className="flex-shrink-0">
                                <Link
                                    href={href}
                                    className={`block py-3 px-6 lg:px-4 transition-all duration-200 whitespace-nowrap ltr:text-left rtl:text-right text-[13px] md:text-[14px] ${isActive
                                        ? "font-bold text-black border-b-[3px] lg:border-b-0 ltr:lg:border-l-4 rtl:lg:border-r-4 border-[#f5a623] bg-white shadow-sm"
                                        : "text-gray-600 hover:text-black hover:bg-gray-100 border-b-[3px] lg:border-b-0 ltr:lg:border-l-4 rtl:lg:border-r-4 border-transparent"
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;
