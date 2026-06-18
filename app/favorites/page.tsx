"use client";
import { useTranslation } from "@/hooks/useTranslation";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import FavouriteProducts from "@/app/components/FavouriteProducts";
import Sidebar from "@/components/Sidebar";
import { SidebarSkeleton, FavouriteProductsSkeleton } from "@/components/skeletons";
import { redirectToLogin } from "@/utils/helpers";

/**
 * Global Favorites Page
 * Displays a clean, full-width list of favorite products without a sidebar.
 * This is the single source of truth for favorites across the entire application.
 */
export default function FavoritesPage() {
    const { data: session, status: authStatus } = useSession();
    const router = useRouter();
    const { t } = useTranslation();

    useEffect(() => {
        if (authStatus === "unauthenticated") {
            redirectToLogin(router);
        }
    }, [authStatus, router]);

    if (authStatus === "loading") {
        // Page-shaped skeleton (sidebar + favourites grid) instead of a full-page spinner.
        return (
            <div className="flex-1 flex flex-col lg:flex-row min-h-0 bg-white font-rubik">
                <SidebarSkeleton />
                <div className="w-full mt-4 md:mt-8 px-4 md:px-10 pb-10 bg-white">
                    <FavouriteProductsSkeleton count={10} />
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 bg-white font-rubik scroll-smooth text-black">
            <Sidebar />

            <div className="w-full mt-4 md:mt-8 px-4 md:px-10 pb-10 bg-white">
                <FavouriteProducts
                    title={
                        <h1 className="text-[20px] md:text-[26px] font-black text-black uppercase tracking-wide text-center">
                            {t("sidebar.favoriteProducts")}
                        </h1>
                    }
                />
            </div>
        </div>
    );
}
