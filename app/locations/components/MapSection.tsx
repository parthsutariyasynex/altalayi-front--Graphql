"use client";

import React, { useEffect, useRef, useState } from "react";

const MapSection: React.FC = () => {
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
            { threshold: 0.1 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <section
            ref={ref}
            className={`w-full h-[200px] sm:h-[280px] md:h-[350px] relative overflow-hidden transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
            <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3714.2828552174624!2d39.2131238!3d21.4180425!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x15c3d11b8fd6a2e9%3A0xe74e78a63f707f59!2sFazCo%20Trading%20Company%20Limited%20Head%20Office!5e0!3m2!1sen!2ssa!4v1711204000000!5m2!1sen!2ssa"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Al-Talayi Locations"
            ></iframe>
        </section>
    );
};

export default MapSection;
