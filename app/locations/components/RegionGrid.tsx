"use client";

import React from "react";
import RegionCard from "./RegionCard";
import { useTranslation } from "@/hooks/useTranslation";

const RegionGrid: React.FC = () => {
    const { t } = useTranslation();

    const regionsData = [
        {
            id: 1,
            title: t("locations.westRegion"),
            address: t("locations.westAddress"),
            mapLink: "https://www.google.com/maps/place/FazCo+Trading+Company+Limited+Head+Office/@21.4180425,39.2131238,17z"
        },
        {
            id: 2,
            title: t("locations.centRegion"),
            address: t("locations.centAddress"),
            mapLink: "https://www.google.com/maps/place/Riyadh,+Al-Malaz+St,+Khurais+Road/@24.6869,46.7224,17z"
        },
        {
            id: 3,
            title: t("locations.eastRegion"),
            address: t("locations.eastAddress"),
            mapLink: "https://www.google.com/maps/place/Al-Kubar,+Al-Rakah+District/@26.2172,50.1971,17z"
        }
    ];

    return (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {regionsData.map((region, index) => (
                <RegionCard
                    key={region.id}
                    title={region.title}
                    address={region.address}
                    mapLink={region.mapLink}
                    index={index}
                />
            ))}
        </section>
    );
};

export default RegionGrid;
