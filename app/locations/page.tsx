"use client";
import { useTranslation } from "@/hooks/useTranslation";

import React, { useEffect, useRef, useState } from "react";
import MapSection from "./components/MapSection";
import RegionGrid from "./components/RegionGrid";
import ContactForm from "./components/ContactForm";

function useScrollReveal(threshold = 0.15) {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [threshold]);

    return { ref, isVisible };
}

export default function BranchLocationsPage() {
    const { t, isRtl } = useTranslation();
    const heading = useScrollReveal();
    const form = useScrollReveal(0.1);

    return (
        <div className="min-h-screen bg-white font-sans text-black overflow-x-hidden">

            {/* Google Map Section */}
            <MapSection />

            {/* Main Content Area */}
            <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12" dir={isRtl ? "rtl" : "ltr"}>

                {/* Contact Heading Section */}
                <div
                    ref={heading.ref}
                    className={`text-center mb-8 md:mb-10 transition-all duration-700 ease-out ${heading.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
                >
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-black uppercase tracking-tight leading-none">
                        {t("locations.title")}
                    </h2>
                </div>

                {/* Region Selection Grid */}
                <RegionGrid />

                {/* Contact Form Section */}
                <div
                    ref={form.ref}
                    className={`mt-6 md:mt-10 transition-all duration-700 ease-out delay-100 ${form.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                >
                    <ContactForm />
                </div>
            </main>
        </div>
    );
}
