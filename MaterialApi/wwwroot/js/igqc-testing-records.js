/* =========================================================
   IGQC TESTING RECORDS
   Working API:
       GET /api/igqc/testing

   Search:
       PO / SO / Material ID / GRN / Assignment ID

   QR:
       R1|PO|SO|ID|Material|GRN

   Clear button is explicitly bound and clears the field.
   ========================================================= */

(() => {
    "use strict";

    const API_URL = "/api/igqc/testing";

    let allRecords = [];
    let displayedRecords = [];
    let selectedRow = null;

    const $ = id => document.getElementById(id);

    document.addEventListener("DOMContentLoaded", init);

    async function init() {
        bindEvents();
        await loadRecords();
    }

    function bindEvents() {

        $("searchButton")?.addEventListener("click", runSearch);

        $("recordSearch")?.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();
                runSearch();
            }
        });

        $("recordSearch")?.addEventListener("input", updateClearButton);

        // Explicit clear handler.
        $("clearSearch")?.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
            clearSearch();
        });

        $("scanButton")?.addEventListener("click", openScanModal);
        $("closeScan")?.addEventListener("click", closeScanModal);
        $("cancelScan")?.addEventListener("click", closeScanModal);
        $("processScan")?.addEventListener("click", processQrScan);

        $("qrData")?.addEventListener("keydown", event => {
            if (event.ctrlKey && event.key === "Enter") {
                event.preventDefault();
                processQrScan();
            }
        });

        $("closeDetails")?.addEventListener("click", closeDetails);

        $("qrModal")?.addEventListener("click", event => {
            if (event.target === $("qrModal")) {
                closeScanModal();
            }
        });

        document.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                closeScanModal();
            }
        });

        updateClearButton();
    }

    async function loadRecords() {
        try {
            const response = await fetch(API_URL, {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                },
                cache: "no-store"
            });

            const data = await response.json();

            if (!response.ok || data.success === false) {
                throw new Error(
                    data.message || "Unable to load testing records."
                );
            }

            allRecords = Array.isArray(data.records)
                ? data.records
                : [];

            sortRecords();

            displayedRecords = [...allRecords];

            renderRecords(displayedRecords);
            hideSearchMessage();

        } catch (error) {
            console.error("IGQC testing records load error:", error);

            allRecords = [];
            displayedRecords = [];

            renderRecords([]);

            showSearchMessage(
                error.message || "Unable to load testing records.",
                "error"
            );
        }
    }

    function sortRecords() {
        allRecords.sort((a, b) => {
            const aa = `${a.date || ""} ${a.time || ""}`;
            const bb = `${b.date || ""} ${b.time || ""}`;

            return bb.localeCompare(aa);
        });
    }

    function runSearch() {
        const query = normalize($("recordSearch")?.value);

        if (!query) {
            displayedRecords = [...allRecords];

            renderRecords(displayedRecords);
            hideSearchMessage();
            closeDetails();
            updateClearButton();

            return;
        }

        displayedRecords = allRecords.filter(record => {

            const searchable = [
                record.assignmentId,
                record.po,
                record.so,
                record.materialId,
                record.grn,
                record.materialName
            ];

            return searchable.some(value =>
                normalize(value).includes(query)
            );
        });

        renderRecords(displayedRecords);
        closeDetails();
        updateClearButton();

        if (displayedRecords.length) {
            showSearchMessage(
                `${displayedRecords.length} testing record(s) found for search.`,
                "success"
            );
        } else {
            showSearchMessage(
                "No testing records match the search value.",
                "error"
            );
        }
    }

    function clearSearch() {
        const input = $("recordSearch");

        if (input) {
            input.value = "";
        }

        displayedRecords = [...allRecords];

        renderRecords(displayedRecords);
        hideSearchMessage();
        closeDetails();
        updateClearButton();

        if (input) {
            requestAnimationFrame(() => input.focus());
        }
    }

    function updateClearButton() {
        const input = $("recordSearch");
        const button = $("clearSearch");

        if (!input || !button) {
            return;
        }

        const hasValue = input.value.trim().length > 0;

        button.classList.toggle("hidden", !hasValue);
    }

    function renderRecords(records) {
        const body = $("recordsBody");

        if (!body) {
            return;
        }

        body.innerHTML = "";
        selectedRow = null;

        const count = $("recordCount");

        if (count) {
            count.textContent =
                `${records.length} RECORD${records.length === 1 ? "" : "S"}`;
        }

        $("emptyState")?.classList.toggle(
            "hidden",
            records.length > 0
        );

        records.forEach(record => {

            const row = document.createElement("tr");

            const types = getTestingTypes(record);
            const status = getOverallStatus(record);

            row.innerHTML = `
                <td>
                    <button type="button"
                            class="assignment-button">
                        ${escapeHtml(record.assignmentId || "-")}
                    </button>
                </td>

                <td>${escapeHtml(record.date || "-")}</td>

                <td>${escapeHtml(record.time || "-")}</td>

                <td>${escapeHtml(record.po || "-")}</td>

                <td>${escapeHtml(record.so || "-")}</td>

                <td title="${escapeAttr(record.materialName || "")}">
                    ${escapeHtml(record.materialId || "-")}
                </td>

                <td>${escapeHtml(record.grn || "-")}</td>

                <td>
                    ${types.length
                    ? types.map(type =>
                        `<span class="testing-badge">
                                ${escapeHtml(type)}
                             </span>`
                    ).join(" ")
                    : "-"
                }
                </td>

                <td>
                    <span class="status-badge ${statusClass(status)}">
                        ${escapeHtml(status)}
                    </span>
                </td>
            `;

            row.addEventListener("click", () => {
                showDetails(record, row);
            });

            row.querySelector(".assignment-button")
                ?.addEventListener("click", event => {
                    event.preventDefault();
                    event.stopPropagation();
                    showDetails(record, row);
                });

            body.appendChild(row);
        });
    }

    function showDetails(record, row) {
        const panel = $("detailsPanel");
        const material = $("materialDetails");
        const tests = $("testingDetails");

        if (!panel || !material || !tests) {
            return;
        }

        if (selectedRow) {
            selectedRow.classList.remove("selected");
        }

        selectedRow = row || null;

        if (selectedRow) {
            selectedRow.classList.add("selected");
        }

        material.innerHTML = [
            detailCell("ASSIGNMENT ID", record.assignmentId),
            detailCell("DATE", record.date),
            detailCell("TIME", record.time),
            detailCell("PURCHASE ORDER", record.po),
            detailCell("SALES ORDER", record.so),
            detailCell("MATERIAL ID", record.materialId),
            detailCell("GRN", record.grn),
            detailCell("MATERIAL NAME", record.materialName),
            detailCell("UNIT", record.unit)
        ].join("");

        tests.innerHTML = [
            testingCard(
                "chemical",
                "Chemical Testing",
                record.chemicalTesting,
                record.chemicalGrade,
                record.chemicalQuantity,
                record.chemicalEquipment,
                record.chemicalSampleConsumed,
                record.chemicalStatus
            ),

            testingCard(
                "mechanical",
                "Mechanical Testing",
                record.mechanicalTesting,
                record.mechanicalGrade,
                record.mechanicalQuantity,
                record.mechanicalEquipment,
                record.mechanicalSampleConsumed,
                record.mechanicalStatus
            ),

            testingCard(
                "dimensional",
                "Dimensional Testing",
                record.dimensionalTesting,
                record.dimensionalGrade,
                record.dimensionalQuantity,
                record.dimensionalEquipment,
                record.dimensionalSampleConsumed,
                record.dimensionalStatus
            )
        ].join("");

        panel.classList.remove("hidden");

        requestAnimationFrame(() => {
            panel.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });
    }

    function closeDetails() {
        $("detailsPanel")?.classList.add("hidden");

        if (selectedRow) {
            selectedRow.classList.remove("selected");
            selectedRow = null;
        }
    }

    function detailCell(label, value) {
        return `
            <div class="detail-cell">
                <div class="detail-label">
                    ${escapeHtml(label)}
                </div>

                <div class="detail-value">
                    ${display(value)}
                </div>
            </div>
        `;
    }

    function testingCard(
        cls,
        title,
        selected,
        grade,
        quantity,
        equipment,
        sample,
        status
    ) {
        if (!selected) {
            return `
                <div class="test-detail-card ${cls}">
                    <h3>${escapeHtml(title)}</h3>

                    <div class="test-field">
                        <span>TESTING</span>
                        <span>Not Selected</span>
                    </div>
                </div>
            `;
        }

        return `
            <div class="test-detail-card ${cls}">

                <h3>${escapeHtml(title)}</h3>

                ${testField(
            "STATUS",
            status || "Pending",
            true
        )}

                ${testField("GRADE", grade)}
                ${testField("QUANTITY", quantity)}
                ${testField("EQUIPMENT", equipment)}
                ${testField("SAMPLE CONSUMED", sample)}

            </div>
        `;
    }

    function testField(label, value, statusField = false) {
        const v =
            value === null ||
                value === undefined ||
                value === ""
                ? "-"
                : value;

        if (statusField) {
            return `
                <div class="test-field">
                    <span>${escapeHtml(label)}</span>

                    <span>
                        <span class="status-badge ${statusClass(v)}">
                            ${escapeHtml(v)}
                        </span>
                    </span>
                </div>
            `;
        }

        return `
            <div class="test-field">
                <span>${escapeHtml(label)}</span>
                <span>${escapeHtml(v)}</span>
            </div>
        `;
    }

    function getTestingTypes(record) {
        const result = [];

        if (record.chemicalTesting) {
            result.push("Chemical");
        }

        if (record.mechanicalTesting) {
            result.push("Mechanical");
        }

        if (record.dimensionalTesting) {
            result.push("Dimensional");
        }

        return result;
    }

    function getOverallStatus(record) {
        const statuses = [];

        if (record.chemicalTesting) {
            statuses.push(record.chemicalStatus || "Pending");
        }

        if (record.mechanicalTesting) {
            statuses.push(record.mechanicalStatus || "Pending");
        }

        if (record.dimensionalTesting) {
            statuses.push(record.dimensionalStatus || "Pending");
        }

        if (!statuses.length) {
            return "Pending";
        }

        if (
            statuses.every(
                value => normalize(value) === "completed"
            )
        ) {
            return "Completed";
        }

        return "Pending";
    }

    function statusClass(status) {
        const value = normalize(status);

        if (value === "completed") {
            return "completed";
        }

        if (
            value === "not selected" ||
            value === "not applicable"
        ) {
            return "not-applicable";
        }

        return "";
    }

    function openScanModal() {
        const modal = $("qrModal");

        if (!modal) {
            return;
        }

        modal.classList.remove("hidden");

        const input = $("qrData");

        if (input) {
            input.value = "";

            setTimeout(() => {
                input.focus();
            }, 50);
        }

        hideMessage("scanMessage");
    }

    function closeScanModal() {
        $("qrModal")?.classList.add("hidden");
        hideMessage("scanMessage");
    }

    function processQrScan() {
        const raw =
            $("qrData")?.value?.trim() || "";

        if (!raw) {
            showMessage(
                "scanMessage",
                "Enter or scan the R1 QR value.",
                "error"
            );

            return;
        }

        const qr = parseR1Qr(raw);

        if (!qr) {
            showMessage(
                "scanMessage",
                "Invalid R1 QR format. Expected: R1|PO|SO|ID|Material|GRN",
                "error"
            );

            return;
        }

        const matches = allRecords.filter(record =>

            normalize(record.po) === normalize(qr.po) &&
            normalize(record.so) === normalize(qr.so) &&
            normalize(record.materialId) === normalize(qr.materialId) &&
            normalize(record.grn) === normalize(qr.grn)

        );

        closeScanModal();

        if (!matches.length) {

            displayedRecords = [];

            renderRecords([]);

            showSearchMessage(
                "No testing records found for the scanned material.",
                "error"
            );

            const search = $("recordSearch");

            if (search) {
                search.value = qr.materialId;
            }

            updateClearButton();

            return;
        }

        displayedRecords = matches;

        renderRecords(matches);

        const search = $("recordSearch");

        if (search) {
            search.value = qr.materialId;
        }

        updateClearButton();

        showSearchMessage(
            `${matches.length} testing record(s) found for scanned material.`,
            "success"
        );

        closeDetails();

        requestAnimationFrame(() => {
            $("recordsBody")?.closest(".records-table-wrap")
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
        });
    }

    function parseR1Qr(raw) {
        const parts =
            raw.split("|").map(value => value.trim());

        if (
            parts.length !== 6 ||
            parts[0].toUpperCase() !== "R1"
        ) {
            return null;
        }

        if (
            parts.some(
                (value, index) =>
                    index > 0 && !value
            )
        ) {
            return null;
        }

        return {
            version: parts[0],
            po: parts[1],
            so: parts[2],
            materialId: parts[3],
            materialName: parts[4],
            grn: parts[5]
        };
    }

    function showSearchMessage(text, type) {
        const element = $("searchMessage");

        if (!element) {
            return;
        }

        element.textContent = text;

        element.className =
            `search-result-message ${type || "info"}`;
    }

    function hideSearchMessage() {
        $("searchMessage")?.classList.add("hidden");
    }

    function showMessage(id, text, type) {
        const element = $(id);

        if (!element) {
            return;
        }

        element.textContent = text;

        element.className =
            `message ${type || "info"}`;
    }

    function hideMessage(id) {
        $(id)?.classList.add("hidden");
    }

    function normalize(value) {
        return String(value ?? "")
            .trim()
            .toLowerCase();
    }

    function display(value) {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return "-";
        }

        return escapeHtml(value);
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function escapeAttr(value) {
        return escapeHtml(value);
    }

})();
