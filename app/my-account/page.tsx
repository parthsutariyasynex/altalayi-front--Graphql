"use client";
import { useTranslation } from "@/hooks/useTranslation";
import { useLocalePath } from "@/hooks/useLocalePath";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { fetchCustomerInfo } from "@/store/actions/customerActions";
import Sidebar from "@/components/Sidebar";
import { useSession } from "next-auth/react";
import Link from "next/link";
import BusinessOverviewEditModal from "@/components/BusinessOverviewEditModal";
import { redirectToLogin } from "@/utils/helpers";
import PortalDropdown from "@/components/PortalDropdown";
import { Hourglass } from "lucide-react";
import CreditLimit from "@/app/components/CreditLimit";
import { AccountSkeleton, SidebarSkeleton } from "@/components/skeletons";


type CustomAttribute = {
    attribute_code: string;
    value: string;
};

type Address = {
    id?: number | string;
    default_billing?: boolean;
    default_shipping?: boolean;
    firstname?: string;
    lastname?: string;
    street?: string[];
    city?: string;
    postcode?: string;
    country_id?: string;
    country_code?: string;
    telephone?: string;
    company?: string;
};

export default function MyAccountPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const lp = useLocalePath();
    const pathname = usePathname();
    const dispatch = useDispatch<AppDispatch>();
    const { data: session, status } = useSession();
    const { data: customer, loading } = useSelector((state: RootState) => state.customer);
    const token = useSelector((state: RootState) => state.auth.token);

    const [isSubAccountSession, setIsSubAccountSession] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const isSub = localStorage.getItem("isSubAccount") === "true";
            setIsSubAccountSession(isSub);

            // Redirect sub-account users to their dedicated page
            if (isSub) {
                router.replace(lp("/subaccount/my-account"));
                return;
            }
        }
    }, [pathname, router]);

    const [businessOverview, setBusinessOverview] = useState<any>(null);
    const [targets, setTargets] = useState<any>(null);
    const [availableYears, setAvailableYears] = useState<number[]>([]);
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    // The customer reducer never sets its own loading/error — so track a failed profile
    // fetch here to render an error fallback (with retry) instead of a blank page.
    const [fetchError, setFetchError] = useState(false);

    const fetchTargets = async (year: string) => {
        try {
            const response = await fetch(`/api/kleverapi/targets-achievements?year=${year}`);
            const data = await response.json();

            if (data.available_years) setAvailableYears(data.available_years);

            // Extract targets for the current year from data.years array or use first matching object
            const yearData = data.years?.[0] || {};
            setTargets(yearData);
        } catch (err) {
            console.error("Targets Fetch Error:", err);
            setTargets({});
        }
    };

    const fetchOverview = async () => {
        try {
            const response = await fetch("/api/kleverapi/business-overview");
            const data = await response.json();
            setBusinessOverview(Array.isArray(data) ? data[0] : data);
        } catch (err) {
            console.error("Overview Fetch Error:", err);
        }
    };

    useEffect(() => {
        if (status === "unauthenticated") {
            redirectToLogin(router);
            return;
        }

        if (status === "authenticated" && token) {
            setFetchError(false);
            dispatch(fetchCustomerInfo((err: any) => { if (err) setFetchError(true); }));
            fetchOverview();
            fetchTargets(selectedYear);
        }
    }, [status, token, dispatch, router, selectedYear]);

    // Re-attempt loading the account profile after an error (used by the error fallback).
    const retryLoad = () => {
        setFetchError(false);
        dispatch(fetchCustomerInfo((err: any) => { if (err) setFetchError(true); }));
        fetchOverview();
        fetchTargets(selectedYear);
    };

    const getOverviewAttr = (key: string, fallback: string = "N/A") => {
        return businessOverview?.[key] || fallback;
    };

    // Full-page skeleton while the session is still resolving, OR while we're authenticated
    // and the profile hasn't arrived yet (and hasn't errored). NEVER return blank/null:
    // the redux `loading` flag is never set by the reducer, so the loading state is derived
    // from session status + whether we actually have data. Unauthenticated users are being
    // redirected to login by the effect above — they see the skeleton briefly, not a blank.
    const showSkeleton = loading || status === "loading" || (!customer && !fetchError);
    if (showSkeleton) {
        return (
            <div className="min-h-screen flex flex-col w-full bg-[#fcfcfc] font-rubik">
                <div className="flex flex-col lg:flex-row flex-1 w-full">
                    <SidebarSkeleton />
                    <main className="flex-1 min-w-0">
                        <AccountSkeleton />
                    </main>
                </div>
            </div>
        );
    }

    // Fetch failed and we have no profile data → proper error fallback with retry (never blank).
    if (!customer) {
        return (
            <div className="min-h-screen flex flex-col w-full bg-[#fcfcfc] font-rubik">
                <div className="flex flex-col lg:flex-row flex-1 w-full">
                    <Sidebar />
                    <main className="flex-1 w-full px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-10">
                        <h1 className="text-[20px] sm:text-[22px] md:text-[26px] font-black text-black mb-6 md:mb-10 uppercase tracking-wide">
                            {t("account.title")}
                        </h1>
                        <div className="border border-gray-300 bg-white shadow-sm rounded-none p-8 md:p-12 text-center max-w-xl">
                            <p className="text-[15px] font-bold text-black mb-2 uppercase">{t("common.error")}</p>
                            <p className="text-[13px] text-gray-600 mb-6">{t("m.sorry-there-has-been-an-error-processing-your-request-please-try-again-later")}</p>
                            <button
                                onClick={retryLoad}
                                className="bg-[#F5B21B] hover:bg-[#e0a116] text-black text-[12px] font-bold px-6 py-2.5 uppercase transition-all rounded-sm"
                            >
                                {t("common.tryAgain")}
                            </button>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    const getAttr = (code: string, fallback: string = "N/A") => {
        if ((customer as any)[code] !== undefined) return (customer as any)[code];
        if ((customer as any).extension_attributes && (customer as any).extension_attributes[code] !== undefined) {
            return (customer as any).extension_attributes[code];
        }
        const attr = (customer as any).custom_attributes?.find(
            (a: CustomAttribute) => a.attribute_code === code
        )?.value;
        return attr ? attr : fallback;
    }

    const formatCurrency = (val: string) => {
        if (!val || val === "N/A") return "0.00";
        const num = parseFloat(val);
        if (isNaN(num)) return val;
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const cardBase = "border border-gray-300 bg-white shadow-sm rounded-none";
    const sectionHeader = "bg-[#f5f5f5] px-4 py-3 border-b border-gray-300 text-black font-bold uppercase text-[13px]";

    const addresses = (customer as any).addresses as Address[] | undefined;
    const defaultBilling = addresses?.find((a: Address) => a.default_billing);
    const defaultShipping = addresses?.find((a: Address) => a.default_shipping);

    // Address priority: default billing → default shipping → first address.
    const selectedAddress = defaultBilling || defaultShipping || addresses?.[0];
    // Resolve a field across that priority so an empty value on the primary falls through
    // (e.g. the default address has no company → use the next address that does).
    const pickAddr = (field: keyof Address): string | undefined =>
        (defaultBilling?.[field] as string | undefined)
        || (defaultShipping?.[field] as string | undefined)
        || (addresses?.[0]?.[field] as string | undefined)
        || undefined;

    // All mapped from native GraphQL fields only — no REST, no hardcoded/fake values.
    const customerMobile = pickAddr("telephone") || "N/A";                 // address.telephone
    const customerCompany = pickAddr("company") || "N/A";                  // address.company
    const addrCity = pickAddr("city");
    const addrCountry = pickAddr("country_code") || pickAddr("country_id") || "SA";
    const customerLocation = addrCity ? `${addrCity} ,${addrCountry}` : "N/A"; // city + country_code
    // Customer Code & Industry: native GraphQL does NOT expose these → stay N/A (no fake data).
    const customerCode = getAttr("customer_code");
    const customerIndustry = getAttr("industry");

    // TEMP: trace the GraphQL-derived address mapping (remove after verifying).
    console.log('[MY ACCOUNT] selected address:', selectedAddress);
    console.log('[MY ACCOUNT] company:', selectedAddress?.company, '→ mapped:', customerCompany);
    console.log('[MY ACCOUNT] telephone:', selectedAddress?.telephone, '→ mapped mobile:', customerMobile);
    console.log('[MY ACCOUNT] city:', selectedAddress?.city);
    console.log('[MY ACCOUNT] country:', selectedAddress?.country_code);


    return (
        <>


            <div className="min-h-screen flex flex-col w-full bg-[#fcfcfc] font-rubik">
                <div className="flex flex-col lg:flex-row flex-1 w-full">
                    <Sidebar />

                    {/* Right Content */}
                    <main className="flex-1 w-full px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-10">

                        {/* Sub-account Identity Banner */}
                        {isSubAccountSession && (
                            <div className="bg-[#e7f6e7] border-l-4 border-[#2d8a2d] text-[#1b5e20] p-4 mb-8 flex items-center gap-3 animate-in fade-in slide-in-from-top duration-500 shadow-sm" role="alert">
                                <span className="text-[#2d8a2d] font-bold text-lg">✔</span>
                                <p className="text-[14px] font-medium tracking-tight">{t("account.youAreLoggedAs")}</p>
                            </div>
                        )}

                        <h1 className="text-[20px] sm:text-[22px] md:text-[26px] font-black text-black mb-6 md:mb-10 uppercase tracking-wide">
                            {t("account.title")}
                        </h1>

                        <div className="space-y-8">
                            {/* ACCOUNT INFORMATION */}
                            <div>
                                <h2 className="text-[14px] md:text-[16px] font-bold text-black uppercase mb-3">{t("account.accountInformation")}</h2>
                                <hr className="border-gray-200 mb-6" />

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                                    {/* Contact Information */}
                                    <div className={cardBase}>
                                        <div className={sectionHeader}>
                                            {t("account.contactInformation")}
                                        </div>
                                        <div className="p-3 md:p-5 text-[13px] text-gray-700 space-y-2.5 font-medium leading-relaxed">
                                            <p>{t("account.contactName")}: {(customer as any).firstname} {(customer as any).lastname}</p>
                                            <p>{t("account.email")}: {(customer as any).email}</p>
                                            <p>{t("account.customerMobile")}: {customerMobile}</p>
                                            <p>{t("account.companyName")}: {customerCompany}</p>
                                            <p>{t("account.customerCode")}: {customerCode}</p>
                                            <p>{t("m.industry")}: {customerIndustry}</p>
                                            <p>{t("m.location")}: {customerLocation}</p>
                                            <p>{t("account.contactInformation")}: {(customer as any).email} ,{customerMobile}</p>

                                            <div className="flex flex-col md:flex-row gap-3 pt-4 md:pt-6">
                                                <Link href={lp("/customer/account/edit")} className="w-full md:w-auto text-center bg-[#F5B21B] hover:bg-[#e0a116] text-black text-[12px] font-bold px-6 py-2 uppercase transition-all rounded-sm">
                                                    {t("m.edit")}
                                                </Link>
                                                <Link href={lp("/customer/account/edit?change=password")} className="w-full md:w-auto text-center bg-[#F5B21B] hover:bg-[#e0a116] text-black text-[12px] font-bold px-6 py-2 uppercase transition-all rounded-sm whitespace-nowrap">
                                                    {t("changePassword.title")}
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* BUSINESS OVERVIEW & SALES DATA */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                                <div className={cardBase}>
                                    <div className={sectionHeader + " flex justify-between items-center"}>
                                        <span>{t("dashboard.businessOverview")}</span>
                                        <button
                                            onClick={() => setIsEditModalOpen(true)}
                                            className="bg-[#F5B21B] hover:bg-black hover:text-white text-black text-[10px] font-bold px-4 py-1.5 uppercase transition-all rounded-sm shadow-sm"
                                        >
                                            {t("m.edit")}
                                        </button>
                                    </div>
                                    <div className="p-3 md:p-5 text-[13px] text-gray-700 space-y-2.5 font-medium leading-relaxed">
                                        <p>{t("m.company-size")}: {getOverviewAttr("total_employees")} {t("account.employees")}, {getOverviewAttr("trucks")} {t("account.trucks")}, {getOverviewAttr("annual_revenue")} {t("account.annualRevenue")}</p>
                                        <p>{t("m.business-model")}: {getOverviewAttr("business_model")}</p>
                                        <p>{t("m.products-services-offered")}: {getOverviewAttr("products_offered")}</p>
                                    </div>
                                </div>

                                <div className={cardBase}>
                                    <div className={sectionHeader}>
                                        {t("m.sales-data-qty")}
                                    </div>
                                    <div className="p-3 md:p-5 text-[13px] text-gray-700 space-y-2.5 font-medium leading-relaxed">
                                        <p>{t("m.total-sales-qty")}: {getAttr("total_sales_qty", "0")}</p>
                                        <p>{t("m.order-frequency")}: {getAttr("order_frequency", "0")} {t("account.ordersPerMonth")}</p>
                                    </div>
                                </div>
                            </div>

                            {/* TARGETS & BEHAVIOR */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                                <div className={cardBase}>
                                    <div className={sectionHeader + " flex justify-between items-center"}>
                                        <span>{t("m.targets-and-achievements")}</span>
                                        <PortalDropdown
                                            value={selectedYear}
                                            onChange={setSelectedYear}
                                            options={(availableYears.length > 0 ? availableYears : [2023, 2024, 2025]).map(y => ({ label: String(y), value: String(y) }))}
                                            minWidth={70}
                                        />
                                    </div>
                                    <div className="p-3 md:p-5 text-[13px] text-gray-700 space-y-2.5 font-medium leading-relaxed">
                                        {targets ? (
                                            <>
                                                <p>{t("m.sales-targets")}: {targets.sales_target || "0"}</p>
                                                <p>{t("m.achievements")}: {targets.achievement || "0"}</p>
                                                <p>{t("m.incentive")}: SAR {formatCurrency(targets.incentive)}</p>
                                                {/* Customer Incentive — reads targets.customer_incentive. The GraphQL field
                                                    does not exist yet (KLEVER_TARGETS_ACHIEVEMENTS_QUERY can't select it without
                                                    breaking the query); shows 0.00 until the backend adds `customer_incentive`,
                                                    then add that field to the query and this auto-populates. */}
                                                <p>{t("account.customerIncentive")}: SAR {formatCurrency(targets.customer_incentive)}</p>
                                                {targets.remarks && <p className="text-[#F5B21B] font-bold">{t("m.comment")}: {targets.remarks}</p>}
                                            </>
                                        ) : (
                                            <>
                                                <p>{t("m.sales-targets")}: {getAttr("sales_targets")}</p>
                                                <p>{t("m.achievements")}: {getAttr("achievements")}</p>
                                                <p>{t("m.incentive")}: SAR {formatCurrency(getAttr("incentive"))}</p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className={cardBase}>
                                    <div className={sectionHeader}>
                                        {t("m.customer-behavior")}
                                    </div>
                                    <div className="p-3 md:p-5 text-[13px] text-gray-700 space-y-2.5 font-medium leading-relaxed">
                                        <p>{t("m.payment-historydso")}: {getAttr("payment_history")}</p>
                                        <p>{t("m.credit-limit")}: SAR {formatCurrency(getAttr("total_credit_limit"))}</p>
                                        <p>{t("m.credit-period")}: {getAttr("credit_period") } {t("account.days")}</p>
                                    </div>
                                </div>
                            </div>

                            {/* CREDIT ACCOUNT INFORMATION */}
                            <CreditLimit />

                            {/* ADDRESS BOOK */}

                            <div>
                                <h2 className="text-[14px] md:text-[16px] font-bold text-black uppercase mb-3">{t("addressBook.title")}</h2>
                                <hr className="border-gray-200 mb-6" />

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                                    {/* Default Billing Address Card */}
                                    <div className={cardBase + " flex flex-col"}>
                                        <div className={sectionHeader}>
                                            {t("addressBook.defaultBillingAddress")}
                                        </div>
                                        <div className="p-3 md:p-5 flex flex-col flex-1">
                                            {defaultBilling ? (
                                                <div className="text-[13px] text-gray-800 leading-relaxed space-y-1 font-normal flex-1">
                                                    <p dir="ltr" style={{ unicodeBidi: "isolate" }}>{defaultBilling.firstname} {defaultBilling.lastname}</p>
                                                    {defaultBilling.company && <p dir="ltr" style={{ unicodeBidi: "isolate" }}>{defaultBilling.company}</p>}
                                                    {defaultBilling.street?.map((s: string, i: number) => <p key={i} dir="ltr" style={{ unicodeBidi: "isolate" }}>{s}</p>)}
                                                    <p dir="ltr" style={{ unicodeBidi: "isolate" }}>{defaultBilling.city}, {defaultBilling.postcode}</p>
                                                    {(() => { const c = defaultBilling.country_code || defaultBilling.country_id; return c ? <p>{c === 'SA' ? t("data.Saudi Arabia") : c}</p> : null; })()}
                                                    <p dir="ltr" style={{ unicodeBidi: "isolate" }}>T: {defaultBilling.telephone}</p>
                                                </div>
                                            ) : (
                                                <p className="text-[13px] text-gray-500 italic flex-1">{t("addressBook.noBillingAddress")}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Default Shipping Address Card */}
                                    <div className={cardBase + " flex flex-col"}>
                                        <div className={sectionHeader}>
                                            {t("addressBook.defaultShippingAddress")}
                                        </div>
                                        <div className="p-3 md:p-5 flex flex-col flex-1">
                                            {defaultShipping ? (
                                                <div className="text-[13px] text-gray-800 leading-relaxed space-y-1 font-normal flex-1">
                                                    <p dir="ltr" style={{ unicodeBidi: "isolate" }}>{defaultShipping.firstname} {defaultShipping.lastname}</p>
                                                    {defaultShipping.company && <p dir="ltr" style={{ unicodeBidi: "isolate" }}>{defaultShipping.company}</p>}
                                                    {defaultShipping.street?.map((s: string, i: number) => <p key={i} dir="ltr" style={{ unicodeBidi: "isolate" }}>{s}</p>)}
                                                    <p dir="ltr" style={{ unicodeBidi: "isolate" }}>{defaultShipping.city}, {defaultShipping.postcode}</p>
                                                    {(() => { const c = defaultShipping.country_code || defaultShipping.country_id; return c ? <p>{c === 'SA' ? t("data.Saudi Arabia") : c}</p> : null; })()}
                                                    <p dir="ltr" style={{ unicodeBidi: "isolate" }}>T: {defaultShipping.telephone}</p>
                                                </div>
                                            ) : (
                                                <p className="text-[13px] text-gray-500 italic flex-1">{t("addressBook.noShippingAddress")}</p>
                                            )}

                                            <div className="pt-4 md:pt-8">
                                                {defaultShipping?.id ? (
                                                    <Link href={lp(`/customer/address-book/edit/${defaultShipping.id}`)} className="w-full md:w-auto text-center bg-[#F5B21B] hover:bg-[#e0a116] text-black text-[13px] font-bold px-4 md:px-8 py-2.5 uppercase transition-all rounded-none inline-block">
                                                        {t("addressBook.editAddress")}
                                                    </Link>
                                                ) : (
                                                    <Link href={lp("/customer/address")} className="w-full md:w-auto text-center bg-[#F5B21B] hover:bg-[#e0a116] text-black text-[13px] font-bold px-4 md:px-8 py-2.5 uppercase transition-all rounded-none inline-block">
                                                        {t("addressBook.addAddress")}
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            <BusinessOverviewEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                initialData={businessOverview}
                onSuccess={fetchOverview}
            />
        </>
    );
}
