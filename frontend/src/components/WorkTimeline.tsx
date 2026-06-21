import { motion } from "framer-motion";
import { WORK_STAGES } from "../content/specialist";

export function WorkTimeline() {
  return (
    <div className="relative border-l border-umber/25 pl-6">
      {WORK_STAGES.map((label, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, x: -6 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05 }}
          className="relative pb-8 last:pb-0"
        >
          <span className="absolute -left-[29px] top-1 flex h-[11px] w-[11px] items-center justify-center rounded-full border-2 border-umber bg-parchment" />
          <p className="text-xs text-sepia">Этап {i + 1} из {WORK_STAGES.length}</p>
          <p className="mt-1 font-medium text-ink">{label}</p>
        </motion.div>
      ))}
    </div>
  );
}
