"use client";
import { useTranslation } from "@/hooks/useTranslation";
import React, { useState, useEffect, useCallback } from "react";
import { X, AlertCircle } from "lucide-react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface GuideItem {
    id: number;
    titleKey: string;
    image: string;
    videoId: string;
}

const guidesData: GuideItem[] = [
    {
        id: 1,
        titleKey: "guides.whyBtire",
        image: "/images/Why-Btire-English.jpg",
        videoId: "",
    },
    {
        id: 2,
        titleKey: "guides.whatIsBtire",
        image: "/images/What-is-Btire-English.jpg",
        videoId: "",
    },
    {
        id: 3,
        titleKey: "guides.myAccountProfile",
        image: "/images/My-account-information-English.jpg",
        videoId: "",
    },
    {
        id: 4,
        titleKey: "guides.btireOrderCycle",
        image: "/images/Create-an-order-english.jpg",
        videoId: "",
    },
];

function VideoModal({
    isOpen,
    onClose,
    videoId,
    title,
}: {
    isOpen: boolean;
    onClose: () => void;
    videoId: string;
    title: string;
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        },
        [onClose]
    );

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, handleKeyDown]);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-8"
                >
                    {/* Backdrop - gray overlay like reference */}
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        data-video-modal
                        className="relative w-full max-w-[960px] z-10 shadow-2xl"
                    >
                        {/* Header - black bar */}
                        <div className="flex items-center justify-between bg-[#1a1a1a] px-4 py-2">
                            <span className="text-white text-[13px] font-normal truncate pr-4">
                                {title}
                            </span>
                            <div className="flex items-center gap-1 flex-shrink-0">
                                {/* Fullscreen icon in circle */}
                                <button
                                    onClick={() => {
                                        const modal = document.querySelector('[data-video-modal]');
                                        if (modal) {
                                            if (document.fullscreenElement) {
                                                document.exitFullscreen();
                                            } else {
                                                (modal as HTMLElement).requestFullscreen();
                                            }
                                        }
                                    }}
                                    className="w-6 h-6 rounded-full border border-gray-500 flex items-center justify-center text-gray-400 hover:text-white hover:border-white transition-colors"
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" />
                                    </svg>
                                </button>
                                {/* Close X in circle */}
                                <button
                                    onClick={onClose}
                                    className="w-6 h-6 rounded-full border border-gray-500 flex items-center justify-center text-gray-400 hover:text-white hover:border-white transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Video player */}
                        <div className="relative w-full aspect-video bg-[#282828]">
                            {videoId ? (
                                <iframe
                                    src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                                    title={title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                    className="absolute inset-0 w-full h-full"
                                    style={{ border: 0 }}
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    {/* Error icon + message like reference */}
                                    <div className="flex items-center gap-4">
                                        <AlertCircle className="w-12 h-12 text-gray-500 stroke-[1.5]" />
                                        <div>
                                            <p className="text-white text-base underline font-medium">Watch video on YouTube</p>
                                            <p className="text-gray-400 text-sm mt-1">Error 153</p>
                                            <p className="text-gray-400 text-sm">Video player configuration error</p>
                                        </div>
                                    </div>
                                    {/* YouTube icon bottom right */}
                                    <div className="absolute bottom-4 right-4">
                                        <svg className="w-8 h-6 text-red-600" viewBox="0 0 28 20" fill="currentColor">
                                            <path d="M27.4 3.1s-.3-1.8-1-2.6C25.2-.7 23.8-.7 23.2-.8 19.4-1 14-1 14-1s-5.4 0-9.2.2c-.6.1-2 .1-3.2 1.2-.8.8-1 2.6-1 2.6S0 5.2 0 7.4v2c0 2.2.6 4.3.6 4.3s.3 1.8 1 2.6c1.2 1.2 2.8 1.2 3.5 1.3C7.6 17.8 14 17.9 14 17.9s5.4 0 9.2-.3c.6-.1 2-.1 3.2-1.2.8-.8 1-2.6 1-2.6s.6-2.1.6-4.3v-2c0-2.2-.6-4.4-.6-4.4zM11.1 12.3V5.4l6.2 3.5-6.2 3.4z"/>
                                        </svg>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}

export default function UserGuidesPage() {
    const { t, isRtl } = useTranslation();
    const [activeVideo, setActiveVideo] = useState<GuideItem | null>(null);

    return (
        <div className="min-h-screen bg-white">
            {/* Banner Section */}
            <div className="w-full">
                <img
                    src="/images/about-tyresonline-uae.jpg"
                    alt="Al-Talayi Warehouse Banner"
                    className="w-full h-auto object-cover max-h-[500px]"
                />
            </div>

            {/* Content Section */}
            <div
                className="max-w-[1200px] mx-auto px-6 mt-16 md:mt-20 pb-10 sm:pb-16 md:pb-20"
                dir={isRtl ? "rtl" : "ltr"}
            >
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-center mb-16 tracking-tight text-black uppercase">
                    {t("guides.title")}
                </h1>

                {/* Guides Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 w-full max-w-[1000px] mx-auto">
                    {guidesData.map((guide) => (
                        <div
                            key={guide.id}
                            className="w-full flex justify-center"
                            onClick={() => setActiveVideo(guide)}
                        >
                            <div className="w-full border-[2px] border-gray-200 bg-white hover:border-gray-300 transition-colors duration-300 flex flex-col group cursor-pointer shadow-sm">
                                <div className="relative w-full aspect-[16/9] bg-[#1a1a1e] flex items-center justify-center overflow-hidden">
                                    <img
                                        src={guide.image}
                                        alt={t(guide.titleKey)}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform group-hover:scale-110 duration-300">
                                        <div className="w-14 h-14 bg-[#f5b21a] rounded-full flex items-center justify-center shadow-md">
                                            <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full border-t-[2px] border-gray-200 py-4 flex justify-center bg-white">
                                    <span className="text-black font-bold text-[15px]">
                                        {t(guide.titleKey)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Video Popup Modal */}
            <VideoModal
                isOpen={!!activeVideo}
                onClose={() => setActiveVideo(null)}
                videoId={activeVideo?.videoId || ""}
                title={activeVideo ? t(activeVideo.titleKey) : ""}
            />
        </div>
    );
}
