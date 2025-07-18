import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import { getOrganizationById } from "@features/organisation/api/getOrganizationById";
import type { OrganizationProfile } from "@features/organisation/types/OrganizationProfile";
import { OrganizationProfileView } from "@features/organisation/ui/OrganizationProfileView";
import { Reviews } from "@features/review/ui/Reviews.tsx"; // можно переименовать
import { useToast } from "@shared/context/ToastContext";

export const OrganizationPage = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [data, setData] = useState<OrganizationProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const toast = location.state?.toast;
        if (toast) {
            showToast(toast.message, toast.type || "info");
            setTimeout(() => {
                navigate(location.pathname, { replace: true });
            }, 100);
        }
    }, []);

    useEffect(() => {
        if (!id) return;
        getOrganizationById(id)
            .then(setData)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="p-6 text-center">Загрузка...</div>;
    if (error) return <div className="p-6 text-red-500 text-center">Ошибка: {error}</div>;
    if (!data) return null;

    return (
        <main className="flex-grow p-6 flex flex-col items-center">
            <OrganizationProfileView data={data} />
            <Reviews type="organization" />
        </main>
    );
};
