'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

const icons = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

export default function Toast({ toast }) {
  const Icon = icons[toast?.type || 'info'];

  return (
    <AnimatePresence>
      {toast?.message ? (
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          className={`toast toast-${toast.type || 'info'}`}
        >
          <Icon size={16} />
          <span>{toast.message}</span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
