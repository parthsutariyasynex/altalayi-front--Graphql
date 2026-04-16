"use client";

import React, { useState } from "react";
import { Send, User, Phone, Mail, MessageSquare, Loader2, CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

const ContactForm: React.FC = () => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        comment: ""
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = t("contact.nameRequired");
        if (!formData.phone.trim()) newErrors.phone = t("contact.phoneRequired");
        if (!formData.email.trim()) {
            newErrors.email = t("contact.emailRequired");
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = t("contact.emailInvalid");
        }
        if (!formData.comment.trim()) newErrors.comment = t("contact.messageRequired");

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setIsSubmitted(true);
            setFormData({ name: "", phone: "", email: "", comment: "" });
            setTimeout(() => setIsSubmitted(false), 8000);
        }, 1500);
    };

    if (isSubmitted) {
        return (
            <div className="w-full max-w-[1100px] mx-auto bg-green-50 border border-green-200 p-8 sm:p-12 md:p-16 text-center rounded-xl shadow-inner">
                <div className="flex justify-center mb-6">
                    <CheckCircle2 className="w-20 h-20 text-green-500 animate-bounce" />
                </div>
                <h3 className="text-[26px] font-black text-green-800 mb-4 uppercase tracking-tight">{t("contact.success")}</h3>
                <p className="text-green-700 font-medium text-[16px]">{t("contact.successDesc")}</p>
                <button
                    onClick={() => setIsSubmitted(false)}
                    className="mt-10 px-8 py-3 bg-green-800 text-white font-bold rounded hover:bg-green-900 transition-all uppercase text-[13px] tracking-widest shadow-md"
                >
                    {t("contact.sendAnother")}
                </button>
            </div>
        );
    }

    return (
        <section className="w-full max-w-[1100px] mx-auto pb-16">
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="relative group">
                        <div className="absolute left-4 top-[16px] text-gray-400 group-hover:text-[#f5a623] transition-colors pointer-events-none">
                            <User className="w-5 h-5" />
                        </div>
                        <input
                            name="name"
                            type="text"
                            placeholder={t("contact.namePlaceholder")}
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full pl-11 pr-4 py-4 border ${errors.name ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#f5a623]'} focus:outline-none transition-all bg-white text-black text-[15px]`}
                        />
                        {errors.name && <span className="text-red-500 text-xs font-semibold mt-1 block pl-1">{errors.name}</span>}
                    </div>
                    <div className="relative group">
                        <div className="absolute left-4 top-[16px] text-gray-400 group-hover:text-[#f5a623] transition-colors pointer-events-none">
                            <Phone className="w-5 h-5" />
                        </div>
                        <input
                            name="phone"
                            type="tel"
                            placeholder={t("contact.phonePlaceholder")}
                            value={formData.phone}
                            onChange={handleChange}
                            className={`w-full pl-11 pr-4 py-4 border ${errors.phone ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#f5a623]'} focus:outline-none transition-all bg-white text-black text-[15px]`}
                        />
                        {errors.phone && <span className="text-red-500 text-xs font-semibold mt-1 block pl-1">{errors.phone}</span>}
                    </div>
                </div>

                <div className="relative group">
                    <div className="absolute left-4 top-[16px] text-gray-400 group-hover:text-[#f5a623] transition-colors pointer-events-none">
                        <Mail className="w-5 h-5" />
                    </div>
                    <input
                        name="email"
                        type="email"
                        placeholder={t("contact.emailPlaceholder")}
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full pl-11 pr-4 py-4 border ${errors.email ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#f5a623]'} focus:outline-none transition-all bg-white text-black text-[15px]`}
                    />
                    {errors.email && <span className="text-red-500 text-xs font-semibold mt-1 block pl-1">{errors.email}</span>}
                </div>

                <div className="relative group">
                    <div className="absolute left-4 top-[16px] text-gray-400 group-hover:text-[#f5a623] transition-colors pointer-events-none">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <textarea
                        name="comment"
                        placeholder={t("contact.messagePlaceholder")}
                        rows={6}
                        value={formData.comment}
                        onChange={handleChange}
                        className={`w-full pl-11 pr-4 py-4 border ${errors.comment ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#f5a623]'} focus:outline-none transition-all bg-white text-black text-[15px] resize-none`}
                    ></textarea>
                    {errors.comment && <span className="text-red-500 text-xs font-semibold mt-1 block pl-1">{errors.comment}</span>}
                </div>

                <div className="pt-2 flex flex-col items-center sm:items-start">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`bg-[#f5a623] text-black font-bold px-10 py-4 uppercase tracking-widest hover:bg-black hover:text-white transition-all duration-300 text-[15px] flex items-center justify-center gap-3 min-w-[240px]`}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {t("contact.processing")}
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                {t("contact.sendMessage")}
                            </>
                        )}
                    </button>
                    <p className="text-xs text-gray-400 mt-2 font-medium italic">{t("contact.privacyNote")}</p>
                </div>
            </form>
        </section>
    );
};

export default ContactForm;
