import { jsPDF } from "jspdf";

// Helper: Load Image from URL to Base64
const getImageData = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.setAttribute('crossOrigin', 'anonymous');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg'));
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

export const generatePDF = async (result, selectedVillage, socialMetrics) => {
    try {
        if (!result) return;
        const doc = new jsPDF();
        const vyomCost = result.kpis.capex;
        const legacyCost = result.kpis.legacy_capex || (vyomCost * 1.65);
        const savings = legacyCost - vyomCost;
        const metrics = socialMetrics;

        // --- BACKGROUND ---
        doc.setFillColor(248, 250, 252); // Very Light Slate
        doc.rect(0, 0, 210, 297, 'F');

        // --- HEADER ---
        doc.setFillColor(15, 23, 42); // Midnight Blue
        doc.rect(0, 0, 210, 50, 'F');
        
        doc.setTextColor(16, 185, 129); // Vyom Green
        doc.setFontSize(26);
        doc.setFont("helvetica", "bold");
        doc.text("VyomSetu GridOS", 20, 25);
        
        doc.setFontSize(12);
        doc.setTextColor(148, 163, 184); // Slate 400
        doc.setFont("helvetica", "normal");
        doc.text("NEXT-GEN RESILIENT INFRASTRUCTURE REPORT", 20, 35);

        // --- IMAGE LOADER ---
        const villageImage = await getImageData(selectedVillage.img);
        
        if (villageImage) {
            doc.addImage(villageImage, 'JPEG', 20, 60, 170, 80);
            
            // Image Overlay Text
            doc.setFillColor(0, 0, 0); 
            doc.setDrawColor(16, 185, 129); 
            doc.setLineWidth(0.5);
            doc.rect(130, 125, 55, 12, 'FD'); 
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.text(`SECTOR: ${selectedVillage.name.toUpperCase()}`, 132, 132);
        } else {
            // Fallback
            doc.setFillColor(226, 232, 240);
            doc.rect(20, 60, 170, 80, 'F');
            doc.setTextColor(100);
            doc.text("SATELLITE IMAGERY LOADING FAILED", 70, 100);
        }

        // --- SECTION 1: MISSION PROFILE ---
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("1. MISSION PROFILE", 20, 155);
        doc.setLineWidth(0.5);
        doc.setDrawColor(16, 185, 129);
        doc.line(20, 158, 200, 158);

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        doc.text(`• Region Topology: ${selectedVillage.terrain.toUpperCase()} TERRAIN`, 25, 168);
        doc.text(`• Connectivity Tech: ${result.terrain_breakdown.tech}`, 25, 176);
        doc.text(`• Serviceable Area: ${result.kpis.area.toFixed(2)} km sq`, 25, 184);

        // --- SECTION 2: FINANCIAL IMPACT ---
        doc.setFillColor(16, 185, 129, 0.1); 
        doc.roundedRect(20, 195, 170, 40, 3, 3, 'F');
        
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.text("2. FINANCIAL INTELLIGENCE", 30, 208);
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`Projected Cost: INR ${(vyomCost/100000).toFixed(2)} L`, 30, 220);
        doc.setTextColor(185, 28, 28); 
        doc.text(`Legacy Cost: INR ${(legacyCost/100000).toFixed(2)} L`, 100, 220);
        
        doc.setTextColor(16, 185, 129); 
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(`TOTAL SAVINGS: INR ${(savings/100000).toFixed(2)} Lakhs`, 30, 230);

        // --- SECTION 3: SOCIAL IMPACT ---
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(14);
        doc.text("3. SOCIAL IMPACT", 20, 255);
        doc.setDrawColor(16, 185, 129);
        doc.line(20, 258, 200, 258);

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        doc.text(`Lives Impacted: ${metrics.pop}`, 25, 268);
        doc.text(`Critical Infra: ${metrics.hospitals} Hospitals, ${metrics.schools} Schools`, 100, 268);
        doc.text(`Status: ${metrics.label}`, 25, 276);

        // --- FOOTER ---
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text("CONFIDENTIAL // GOVERNMENT OF INDIA // VYOMSETU", 105, 290, null, null, "center");

        doc.save(`VyomSetu_DPR_${selectedVillage.id}.pdf`);
    } catch (err) {
        console.error("PDF Export Error:", err);
        alert("Export failed. Please check console.");
    }
};