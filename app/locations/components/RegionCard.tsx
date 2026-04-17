"use client";

import React, { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface RegionCardProps {
    title: string;
    address: string;
    mapLink: string;
    index: number;
}

const RegionCard: React.FC<RegionCardProps> = ({ title, address, mapLink, index }) => {
    const { t, isRtl } = useTranslation();
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
            { threshold: 0.15 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={`border border-gray-200 bg-white p-6 sm:p-7 flex flex-col justify-between group hover:shadow-md transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            style={{ minHeight: '260px', transitionDelay: isVisible ? `${index * 150}ms` : '0ms' }}
            dir={isRtl ? "rtl" : "ltr"}
        >
            <div className="flex-1">
                <h2 className="text-base sm:text-lg font-extrabold text-black uppercase tracking-tight mb-4">
                    {title}
                </h2>
                <div className="text-sm sm:text-[15px] leading-relaxed text-gray-700 space-y-0.5">
                    {address.split("\n").map((line, i) => (
                        <p key={i} dir="ltr" style={{ unicodeBidi: "isolate" }}>{line}</p>
                    ))}
                </div>
            </div>
            <a
                href={mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm font-bold text-black hover:text-[#f5a623] transition-all w-fit mt-6"
            >
                <div className="bg-gray-800 text-white p-2 rounded-full group-hover:bg-[#f5a623] transition-all duration-300">
                    <MapPin className="w-4 h-4" />
                </div>
                <span className="uppercase tracking-wide">{t("locations.googleMap")}</span>
            </a>
        </div>
    );
};

export default RegionCard;
