import { jsPDF } from "jspdf";
import { JournalEntry } from "../types.ts";

export interface ExportOptions {
  sortOrder?: "newest" | "oldest";
  userEmail?: string | null;
  includeAiReflections?: boolean;
}

/**
 * Formats a timestamp into a human-readable date & time string
 */
function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

/**
 * Exports journal entries as a cleanly formatted Plain Text (.txt) file
 */
export function exportAsPlainText(entries: JournalEntry[], options: ExportOptions = {}) {
  if (!entries || entries.length === 0) {
    throw new Error("No entries to export.");
  }

  const sorted = [...entries].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return options.sortOrder === "oldest" ? dateA - dateB : dateB - dateA;
  });

  const exportDate = formatDateTime(new Date().toISOString());
  const lines: string[] = [];

  lines.push("================================================================================");
  lines.push("                           PERSONAL GEMINI JOURNAL ARCHIVE                      ");
  lines.push("================================================================================");
  lines.push(`Exported On: ${exportDate}`);
  if (options.userEmail) {
    lines.push(`Author: ${options.userEmail}`);
  }
  lines.push(`Total Entries: ${sorted.length}`);
  lines.push(`Ordering: ${options.sortOrder === "oldest" ? "Chronological (Oldest First)" : "Reverse Chronological (Newest First)"}`);
  lines.push("================================================================================");
  lines.push("");
  lines.push("");

  sorted.forEach((entry, index) => {
    lines.push(`ENTRY #${index + 1}`);
    lines.push(`Date:    ${formatDateTime(entry.createdAt)}`);
    lines.push(`Title:   ${entry.title || "Untitled"}`);
    lines.push(`Mood:    ${entry.mood || "Reflective"} (Valence: ${entry.moodScore ?? 5}/10)`);
    if (entry.tags && entry.tags.length > 0) {
      lines.push(`Tags:    ${entry.tags.map((t) => `#${t}`).join(", ")}`);
    }
    if (entry.coverImagePrompt) {
      lines.push(`Cover Art: "${entry.coverImagePrompt}" (Imagen AI)`);
    }
    lines.push("--------------------------------------------------------------------------------");
    lines.push("");
    lines.push(entry.content || "");
    lines.push("");

    if (options.includeAiReflections !== false) {
      const hasAiData =
        entry.sentimentAnalysis ||
        entry.reflectionInsight ||
        (entry.emotionalTriggers && entry.emotionalTriggers.length > 0) ||
        (entry.copingStrategies && entry.copingStrategies.length > 0) ||
        entry.followUpPrompt;

      if (hasAiData) {
        lines.push("~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~");
        lines.push("[GEMINI AI MOOD & REFLECTION INSIGHTS]");

        if (entry.sentimentAnalysis) {
          lines.push(`* Sentiment Arc: ${entry.sentimentAnalysis}`);
        }

        if (entry.emotionalTriggers && entry.emotionalTriggers.length > 0) {
          lines.push(`* Identified Emotional Triggers: ${entry.emotionalTriggers.join("; ")}`);
        }

        if (entry.copingStrategies && entry.copingStrategies.length > 0) {
          lines.push(`* Evidence-Based Coping Strategies:`);
          entry.copingStrategies.forEach((strat) => {
            lines.push(`    - ${strat}`);
          });
        }

        if (entry.reflectionInsight) {
          lines.push("");
          lines.push(`* Mindful Reflection:`);
          lines.push(entry.reflectionInsight);
        }

        if (entry.followUpPrompt) {
          lines.push("");
          lines.push(`* Introspective Seed: ${entry.followUpPrompt}`);
        }
        lines.push("~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~");
        lines.push("");
      }
    }

    lines.push("================================================================================");
    lines.push("");
    lines.push("");
  });

  const fullText = lines.join("\n");
  const blob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStr = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `personal-gemini-journal-export-${dateStr}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports journal entries as a styled, paginated PDF document
 */
export function exportAsPdf(entries: JournalEntry[], options: ExportOptions = {}) {
  if (!entries || entries.length === 0) {
    throw new Error("No entries to export.");
  }

  const sorted = [...entries].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return options.sortOrder === "oldest" ? dateA - dateB : dateB - dateA;
  });

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 20;
  const marginRight = 20;
  const printWidth = pageWidth - marginLeft - marginRight;
  const marginBottom = 20;

  let y = 25;

  const ensureSpace = (requiredMm: number) => {
    if (y + requiredMm > pageHeight - marginBottom) {
      doc.addPage();
      y = 25;
      return true;
    }
    return false;
  };

  // Header Banner
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.text("Personal Gemini Journal", marginLeft, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // Slate 500
  const exportDate = formatDateTime(new Date().toISOString());
  doc.text(
    `Archive Export • ${exportDate} • ${sorted.length} Entries${options.userEmail ? ` • ${options.userEmail}` : ""}`,
    marginLeft,
    y
  );
  y += 6;

  // Header divider
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineWidth(0.5);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 12;

  sorted.forEach((entry, idx) => {
    ensureSpace(35);

    // Entry Index & Date
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(99, 102, 241); // Indigo 500
    const entryDate = formatDateTime(entry.createdAt);
    doc.text(`ENTRY #${idx + 1}  •  ${entryDate}`, marginLeft, y);
    y += 6;

    // Entry Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // Slate 900
    const titleLines = doc.splitTextToSize(entry.title || "Untitled Reflection", printWidth);
    doc.text(titleLines, marginLeft, y);
    y += titleLines.length * 6 + 1;

    // Mood & Valence pill text
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105); // Slate 600
    let moodBadge = `Emotion / Mood: ${entry.mood || "Reflective"} (Valence Score: ${entry.moodScore ?? 5}/10)`;
    if (entry.tags && entry.tags.length > 0) {
      moodBadge += `  |  Tags: ${entry.tags.map((t) => `#${t}`).join(", ")}`;
    }
    doc.text(moodBadge, marginLeft, y);
    y += 5.5;

    if (entry.coverImagePrompt) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(124, 58, 237); // Purple 600
      doc.text(`Cover Artwork: "${entry.coverImagePrompt}" (Imagen AI)`, marginLeft, y);
      y += 5;
    }

    // Divider before content
    doc.setDrawColor(241, 245, 249); // Slate 100
    doc.setLineWidth(0.3);
    doc.line(marginLeft, y, pageWidth - marginRight, y);
    y += 6;

    // Content body
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85); // Slate 700
    const contentLines = doc.splitTextToSize(entry.content || "", printWidth);

    for (let i = 0; i < contentLines.length; i++) {
      ensureSpace(6);
      doc.text(contentLines[i], marginLeft, y);
      y += 5.2;
    }
    y += 4;

    // Gemini Insights block (if enabled & present)
    if (options.includeAiReflections !== false) {
      const hasAi =
        entry.sentimentAnalysis ||
        entry.reflectionInsight ||
        (entry.emotionalTriggers && entry.emotionalTriggers.length > 0) ||
        (entry.copingStrategies && entry.copingStrategies.length > 0);

      if (hasAi) {
        ensureSpace(25);
        // Box background for AI insights
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(79, 70, 229); // Indigo 600
        doc.text("✦ Gemini Mood & Evidence-Based Coping Insights", marginLeft, y);
        y += 5;

        if (entry.sentimentAnalysis) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(8.5);
          doc.setTextColor(100, 116, 139);
          const sentLines = doc.splitTextToSize(`Sentiment: "${entry.sentimentAnalysis}"`, printWidth);
          for (let s of sentLines) {
            ensureSpace(5);
            doc.text(s, marginLeft, y);
            y += 4.5;
          }
        }

        if (entry.emotionalTriggers && entry.emotionalTriggers.length > 0) {
          ensureSpace(6);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(185, 28, 28); // Rose 700
          doc.text(`Identified Emotional Triggers:`, marginLeft, y);
          y += 4.5;

          doc.setFont("helvetica", "normal");
          doc.setTextColor(71, 85, 105);
          entry.emotionalTriggers.forEach((trig) => {
            ensureSpace(5);
            doc.text(`• ${trig}`, marginLeft + 4, y);
            y += 4.5;
          });
        }

        if (entry.copingStrategies && entry.copingStrategies.length > 0) {
          ensureSpace(6);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(16, 185, 129); // Emerald 600
          doc.text(`Personalized Evidence-Based Coping Practices:`, marginLeft, y);
          y += 4.5;

          doc.setFont("helvetica", "normal");
          doc.setTextColor(71, 85, 105);
          entry.copingStrategies.forEach((strat) => {
            const stratLines = doc.splitTextToSize(`• ${strat}`, printWidth - 6);
            for (let sl of stratLines) {
              ensureSpace(5);
              doc.text(sl, marginLeft + 4, y);
              y += 4.5;
            }
          });
        }

        if (entry.reflectionInsight) {
          ensureSpace(8);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(67, 56, 202);
          doc.text(`Empathetic Reflection:`, marginLeft, y);
          y += 4.5;

          doc.setFont("helvetica", "normal");
          doc.setTextColor(71, 85, 105);
          const refLines = doc.splitTextToSize(entry.reflectionInsight, printWidth - 4);
          for (let r of refLines) {
            ensureSpace(5);
            doc.text(r, marginLeft + 4, y);
            y += 4.5;
          }
        }

        y += 4;
      }
    }

    // Divider between entries
    ensureSpace(12);
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.setLineWidth(0.4);
    doc.line(marginLeft, y, pageWidth - marginRight, y);
    y += 10;
  });

  // Footer page numbers
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(
      `Personal Gemini Journal Archive • Page ${p} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`personal-gemini-journal-export-${dateStr}.pdf`);
}
