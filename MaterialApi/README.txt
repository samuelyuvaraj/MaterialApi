COPY:
Models/*.cs -> MaterialApi/Models/
Services/*.cs -> MaterialApi/Services/
wwwroot/igqc-testing.html -> MaterialApi/wwwroot/
wwwroot/css/igqc-testing.css -> MaterialApi/wwwroot/css/
wwwroot/js/igqc-testing.js -> MaterialApi/wwwroot/js/

TestingGrade.xlsx must be at Data/TestingGrade.xlsx.
IGQC_Data.xlsx will be created/updated at Data/IGQC_Data.xlsx.

Do NOT replace Program.cs with Program_IGQC_Testing_API.txt.
Add the registrations and endpoints from that file to your existing Program.cs.

In existing consumptions.js, before redirect:
sessionStorage.setItem("igqcMaterial", JSON.stringify(currentConsumptionRecord));
window.location.href = "/igqc-testing.html";
