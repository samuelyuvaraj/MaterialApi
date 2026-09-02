/* =========================================================
   BDL MES - CHEMICAL LAB
   Vendor support:
   - API returns Vendor from ChemicalLabRecord
   - Chemical_Lab_Data.xlsm Vendor is column 17
   - IGQC_Data.xlsx Vendor is column 28
   ========================================================= */

(() => {
    "use strict";

    const API_LIST_URL = "/api/chemical-lab";
    const API_ACCEPT_URL = id =>
        `/api/chemical-lab/${encodeURIComponent(id)}/accept`;

    let allRecords = [];
    let displayedRecords = [];
    let selectedRecord = null;

    const $ = id => document.getElementById(id);

    document.addEventListener("DOMContentLoaded", initialize);

    async function initialize() {
        bindEvents();
        updateClearButton();
        await loadRecords();
    }

    function bindEvents() {
        $("searchButton")?.addEventListener("click", runSearch);

        $("chemicalSearch")?.addEventListener("keydown", e => {
            if (e.key === "Enter") {
                e.preventDefault();
                runSearch();
            }
        });

        $("chemicalSearch")?.addEventListener("input", updateClearButton);
        $("clearSearch")?.addEventListener("click", clearSearch);

        $("scanButton")?.addEventListener("click", openScanModal);
        $("closeScan")?.addEventListener("click", closeScanModal);
        $("cancelScan")?.addEventListener("click", closeScanModal);
        $("processScan")?.addEventListener("click", processQrScan);

        $("qrModal")?.addEventListener("click", e => {
            if (e.target === $("qrModal")) closeScanModal();
        });

        $("qrData")?.addEventListener("keydown", e => {
            if (e.ctrlKey && e.key === "Enter") {
                e.preventDefault();
                processQrScan();
            }
        });

        $("closeDetails")?.addEventListener("click", closeDetails);
        $("acceptButton")?.addEventListener("click", acceptSelectedRecord);
    }

    async function loadRecords() {
        setMessage("searchMessage", "Loading Chemical Lab assignments...", "info");

        try {
            const response = await fetch(API_LIST_URL, {
                method: "GET",
                headers: { Accept: "application/json" },
                cache: "no-store"
            });

            const data = await readJson(response);

            if (!response.ok || data?.success === false) {
                throw new Error(
                    data?.message ||
                    `Unable to load Chemical Lab assignments. HTTP ${response.status}`
                );
            }

            const source = Array.isArray(data?.records)
                ? data.records
                : Array.isArray(data?.assignments)
                    ? data.assignments
                    : [];

            allRecords = source
                .filter(isChemicalRecord)
                .map(normalizeRecord)
                .sort(sortNewestFirst);

            displayedRecords = [...allRecords];
            renderRecords(displayedRecords);
            hideMessage("searchMessage");

            console.log("Chemical Lab API records:", source);
            console.log("Vendor values received:", allRecords.map(r => ({
                assignmentId: r.assignmentId,
                vendor: r.vendor
            })));
        } catch (error) {
            console.error("Chemical Lab load error:", error);
            allRecords = [];
            displayedRecords = [];
            renderRecords([]);

            setMessage(
                "searchMessage",
                error.message || "Unable to load Chemical Lab assignments.",
                "error"
            );
        }
    }

    function isChemicalRecord(record) {
        if (!record) return false;

        if (record.chemicalTesting === true) return true;

        if (
            String(record.chemicalTesting)
                .trim()
                .toLowerCase() === "yes"
        ) return true;

        return Boolean(
            record.chemicalGrade ||
            record.chemicalQuantity !== undefined ||
            record.chemicalEquipment
        );
    }

    function normalizeRecord(record) {
        return {
            assignmentId: value(record.assignmentId),
            date: value(record.date),
            time: value(record.time),

            po: value(record.po ?? record.poNumber),
            so: value(record.so ?? record.soNumber),

            materialId: value(
                record.materialId ??
                record.materialIdentifier
            ),

            grn: value(record.grn ?? record.receiptId),
            materialName: value(record.materialName),

            unit: value(
                record.unit ??
                record.uom ??
                record.unitOfMeasure
            ),

            // VENDOR - API property is "vendor"
            // Chemical_Lab_Data.xlsm source column = 17.
            vendor: value(
                record.vendor ??
                record.Vendor
            ),

            chemicalGrade: value(record.chemicalGrade),
            chemicalQuantity: record.chemicalQuantity,
            chemicalEquipment: value(record.chemicalEquipment),
            chemicalSampleConsumed: value(record.chemicalSampleConsumed),

            chemicalStatus:
                value(record.chemicalStatus) || "Pending",

            acceptedDate: value(record.acceptedDate),
            acceptedTime: value(record.acceptedTime)
        };
    }

    function sortNewestFirst(a, b) {
        return `${b.date} ${b.time}`.localeCompare(
            `${a.date} ${a.time}`
        );
    }

    function runSearch() {
        const query = normalize($("chemicalSearch")?.value);

        if (!query) {
            displayedRecords = [...allRecords];
            renderRecords(displayedRecords);
            hideMessage("searchMessage");
            closeDetails();
            updateClearButton();
            return;
        }

        displayedRecords = allRecords.filter(record => [
            record.assignmentId,
            record.po,
            record.so,
            record.materialId,
            record.grn,
            record.materialName,
            record.vendor,
            record.chemicalGrade,
            record.chemicalEquipment
        ].some(field => normalize(field).includes(query)));

        renderRecords(displayedRecords);
        closeDetails();

        setMessage(
            "searchMessage",
            displayedRecords.length
                ? `${displayedRecords.length} Chemical Lab record(s) found.`
                : "No Chemical Lab records match the search value.",
            displayedRecords.length ? "success" : "error"
        );

        updateClearButton();
    }

    function clearSearch() {
        const input = $("chemicalSearch");
        if (input) {
            input.value = "";
            input.focus();
        }

        displayedRecords = [...allRecords];
        renderRecords(displayedRecords);
        hideMessage("searchMessage");
        closeDetails();
        updateClearButton();
    }

    function updateClearButton() {
        const input = $("chemicalSearch");
        const button = $("clearSearch");

        if (!input || !button) return;

        button.classList.toggle("hidden", input.value.trim() === "");
    }

    function renderRecords(records) {
        const body = $("recordsBody");
        if (!body) return;

        body.innerHTML = "";

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

            const assignmentCell = document.createElement("td");
            const assignmentButton = document.createElement("button");

            assignmentButton.type = "button";
            assignmentButton.className = "cl-assignment-button";
            assignmentButton.textContent = record.assignmentId || "-";

            assignmentButton.addEventListener("click", e => {
                e.stopPropagation();
                showDetails(record);
            });

            assignmentCell.appendChild(assignmentButton);
            row.appendChild(assignmentCell);

            row.appendChild(textCell(record.date));
            row.appendChild(textCell(record.time));
            row.appendChild(textCell(record.po));
            row.appendChild(textCell(record.so));
            row.appendChild(textCell(record.materialId, record.materialName));
            row.appendChild(textCell(record.grn));
            row.appendChild(textCell(record.chemicalGrade));
            row.appendChild(textCell(
                formatQuantity(record.chemicalQuantity, record.unit)
            ));

            const statusCell = document.createElement("td");
            const status = document.createElement("span");

            status.className =
                `cl-status-badge ${statusClass(record.chemicalStatus)}`;
            status.textContent = record.chemicalStatus || "Pending";

            statusCell.appendChild(status);
            row.appendChild(statusCell);

            row.addEventListener("click", () => showDetails(record));
            body.appendChild(row);
        });
    }

    function textCell(v, title = "") {
        const cell = document.createElement("td");
        cell.textContent = display(v);
        if (title) cell.title = title;
        return cell;
    }

    function showDetails(record) {
        selectedRecord = record;

        setText("detailAssignmentId", record.assignmentId);
        setText("detailDate", record.date);
        setText("detailTime", record.time);
        setText("detailPo", record.po);
        setText("detailSo", record.so);
        setText("detailMaterialId", record.materialId);
        setText("detailGrn", record.grn);
        setText("detailMaterialName", record.materialName);
        setText("detailUnit", record.unit);

        // VENDOR is displayed from the API response.
        setText("detailVendor", record.vendor);

        setText("detailGrade", record.chemicalGrade);
        setText(
            "detailQuantity",
            formatQuantity(record.chemicalQuantity, record.unit)
        );
        setText("detailEquipment", record.chemicalEquipment);
        setText("detailSample", record.chemicalSampleConsumed);

        const status = $("detailStatus");
        if (status) {
            status.textContent = record.chemicalStatus || "Pending";
            status.className =
                `cl-status-badge ${statusClass(record.chemicalStatus)}`;
        }

        const acceptButton = $("acceptButton");
        const acceptedInfo = $("acceptedInfo");

        const accepted =
            normalize(record.chemicalStatus) === "accepted";

        if (acceptButton) {
            acceptButton.disabled = accepted;
            acceptButton.innerHTML = accepted
                ? "<span>✓</span> ACCEPTED"
                : "<span>✓</span> ACCEPT";
        }

        if (accepted && (record.acceptedDate || record.acceptedTime)) {
            if (acceptedInfo) {
                acceptedInfo.textContent =
                    `Accepted: ${display(record.acceptedDate)} ${display(record.acceptedTime)}`;
                acceptedInfo.classList.remove("hidden");
            }
        } else {
            acceptedInfo?.classList.add("hidden");
        }

        hideMessage("acceptMessage");

        $("detailsPanel")?.classList.remove("hidden");

        requestAnimationFrame(() => {
            $("detailsPanel")?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });
    }

    function closeDetails() {
        selectedRecord = null;
        $("detailsPanel")?.classList.add("hidden");
        hideMessage("acceptMessage");
    }

    async function acceptSelectedRecord() {
        if (!selectedRecord?.assignmentId) {
            setMessage(
                "acceptMessage",
                "Select a Chemical Lab assignment first.",
                "error"
            );
            return;
        }

        if (normalize(selectedRecord.chemicalStatus) === "accepted") {
            return;
        }

        const button = $("acceptButton");
        if (!button) return;

        button.disabled = true;
        button.innerHTML = "<span>…</span> ACCEPTING...";

        try {
            const response = await fetch(
                API_ACCEPT_URL(selectedRecord.assignmentId),
                {
                    method: "POST",
                    headers: { Accept: "application/json" },
                    cache: "no-store"
                }
            );

            const data = await readJson(response);

            if (!response.ok || data?.success === false) {
                throw new Error(
                    data?.message ||
                    `Chemical Lab acceptance failed. HTTP ${response.status}`
                );
            }

            const updated =
                data?.record ||
                data?.assignment ||
                data?.data;

            if (updated) {
                selectedRecord = normalizeRecord(updated);
            } else {
                selectedRecord.chemicalStatus = "Accepted";
            }

            const id = normalize(selectedRecord.assignmentId);

            const allIndex = allRecords.findIndex(
                x => normalize(x.assignmentId) === id
            );

            if (allIndex >= 0) {
                allRecords[allIndex] = selectedRecord;
            }

            const displayedIndex = displayedRecords.findIndex(
                x => normalize(x.assignmentId) === id
            );

            if (displayedIndex >= 0) {
                displayedRecords[displayedIndex] = selectedRecord;
            }

            renderRecords(displayedRecords);
            showDetails(selectedRecord);

            setMessage(
                "acceptMessage",
                data?.message ||
                "Chemical Lab material accepted successfully.",
                "success"
            );
        } catch (error) {
            console.error("Chemical Lab accept error:", error);

            button.disabled = false;
            button.innerHTML = "<span>✓</span> ACCEPT";

            setMessage(
                "acceptMessage",
                error.message ||
                "Chemical Lab acceptance failed.",
                "error"
            );
        }
    }

    function openScanModal() {
        $("qrModal")?.classList.remove("hidden");

        const input = $("qrData");
        if (input) {
            input.value = "";
            setTimeout(() => input.focus(), 50);
        }

        hideMessage("scanMessage");
    }

    function closeScanModal() {
        $("qrModal")?.classList.add("hidden");
        hideMessage("scanMessage");
    }

    function processQrScan() {
        const raw = $("qrData")?.value?.trim() || "";

        if (!raw) {
            setMessage(
                "scanMessage",
                "Enter or scan an R1 QR value.",
                "error"
            );
            return;
        }

        const parts = raw.split("|").map(x => x.trim());

        if (
            parts.length !== 6 ||
            parts[0].toUpperCase() !== "R1"
        ) {
            setMessage(
                "scanMessage",
                "Invalid R1 QR format. Expected: R1|PO|SO|ID|Material|GRN",
                "error"
            );
            return;
        }

        const [, po, so, materialId, materialName, grn] = parts;

        const matches = allRecords.filter(record =>
            normalize(record.po) === normalize(po) &&
            normalize(record.so) === normalize(so) &&
            normalize(record.materialId) === normalize(materialId) &&
            normalize(record.grn) === normalize(grn)
        );

        closeScanModal();

        if (!matches.length) {
            displayedRecords = [];
            renderRecords([]);
            closeDetails();

            setMessage(
                "searchMessage",
                "No Chemical Testing assignment was found for the scanned material.",
                "error"
            );
            return;
        }

        displayedRecords = matches;

        const search = $("chemicalSearch");
        if (search) search.value = materialId;

        renderRecords(displayedRecords);
        updateClearButton();

        setMessage(
            "searchMessage",
            `${matches.length} Chemical Testing record(s) found for scanned material.`,
            "success"
        );

        closeDetails();
    }

    async function readJson(response) {
        const raw = await response.text();
        if (!raw) return {};

        try {
            return JSON.parse(raw);
        } catch {
            throw new Error(
                "The Chemical Lab API returned invalid JSON."
            );
        }
    }

    function setText(id, v) {
        const element = $(id);
        if (element) element.textContent = display(v);
    }

    function setMessage(id, message, type) {
        const element = $(id);
        if (!element) return;

        element.textContent = message || "";
        element.className = `cl-message ${type || "info"}`;
        element.classList.remove("hidden");
    }

    function hideMessage(id) {
        $(id)?.classList.add("hidden");
    }

    function statusClass(status) {
        return normalize(status) === "accepted"
            ? "accepted"
            : "pending";
    }

    function formatQuantity(quantity, unit) {
        if (
            quantity === null ||
            quantity === undefined ||
            quantity === ""
        ) return "-";

        return unit
            ? `${quantity} ${unit}`
            : String(quantity);
    }

    function display(v) {
        return (
            v === null ||
            v === undefined ||
            v === ""
        ) ? "-" : String(v);
    }

    function value(v) {
        return (
            v === null ||
            v === undefined
        ) ? "" : String(v).trim();
    }

    function normalize(v) {
        return (
            v === null ||
            v === undefined
        ) ? "" : String(v).trim().toLowerCase();
    }
})();
