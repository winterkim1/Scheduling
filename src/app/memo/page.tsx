"use client";

import { useEffect, useState } from "react";
import { AppLink } from "@/components/app-link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";

const MEMO_STORAGE_KEY = "meetflow-memo-v1";

export default function MemoPage() {
  const { t } = useI18n();
  const [content, setContent] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(MEMO_STORAGE_KEY);
    if (saved) setContent(saved);
  }, []);

  const handleChange = (value: string) => {
    setContent(value);
    localStorage.setItem(MEMO_STORAGE_KEY, value);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto">
      <AppLink
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {t.dashboard.backToDashboard}
      </AppLink>

      <motion.div initial={false} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t.memo.title}</h1>
        <p className="text-muted-foreground mt-1">{t.memo.subtitle}</p>
      </motion.div>

      <Textarea
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={t.memo.placeholder}
        className="min-h-[420px] resize-y text-base leading-relaxed"
      />
    </div>
  );
}
