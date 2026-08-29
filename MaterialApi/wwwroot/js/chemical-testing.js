/* =========================================================
   BDL MES - CHEMICAL LAB
   =========================================================
   Chemical Lab reads ONLY Chemical Testing assignments
   from the IGQC Chemical Lab API.

   Backend endpoints:
     GET  /api/chemical-lab
     GET  /api/chemical-lab/{assignmentId}
     POST /api/chemical-lab/{assignmentId}/accept
   ========================================================= */

(() => {
    "use strict";

    // =====================================================
    // API ENDPOINTS
    // =====================================================

    const API_LIST_URL = "/api/chemical-lab";

    const API_ACCEPT_URL = assignmentId =>
        `/api/chemical-lab/${encodeURIComponent(assignmentId)}/accept`;


    // =====================================================
    // STATE
    // =====================================================

    let allRecords = [];
    let displayedRecords = [];
    let selectedRecord = null;


    // =====================================================
    // HELPERS
    // =====================================================

    const $ = id => document.getElementById(id);


    // =====================================================
    // INITIALIZE
    // =====================================================

    document.addEventListener("DOMContentLoaded", initialize);

    async function initialize() {
        bindEvents();
        updateClearButton();
        await loadRecords();
    }


    // =====================================================
    // EVENTS
    // =====================================================

    function bindEvents() {

        $("searchButton")?.addEventListener(
            "click",
            runSearch
        );

        $("chemicalSearch")?.addEventListener(
            "keydown",
            event => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    runSearch();
                }
            }
        );

        $("chemicalSearch")?.addEventListener(
            "input",
            updateClearButton
        );

        $("clearSearch")?.addEventListener(
            "click",
            clearSearch
        );

        $("scanButton")?.addEventListener(
            "click",
            openScanModal
        );

        $("closeScan")?.addEventListener(
            "click",
            closeScanModal
        );

        $("cancelScan")?.addEventListener(
            "click",
            closeScanModal
        );

        $("processScan")?.addEventListener(
            "click",
            processQrScan
        );

        $("qrModal")?.addEventListener(
            "click",
            event => {
                if (event.target === $("qrModal")) {
                    closeScanModal();
                }
            }
        );

        $("qrData")?.addEventListener(
            "keydown",
            event => {
                if (event.ctrlKey && event.key === "Enter") {
                    event.preventDefault();
                    processQrScan();
                }
            }
        );

        $("closeDetails")?.addEventListener(
            "click",
            closeDetails
        );

        $("acceptButton")?.addEventListener(
            "click",
            acceptSelectedRecord
        );
    }


    // =====================================================
    // LOAD CHEMICAL LAB RECORDS
    // =====================================================

    async function loadRecords() {

        setMessage(
            "searchMessage",
            "Loading Chemical Lab assignments...",
            "info"
        );

        try {

            const response = await fetch(API_LIST_URL, {
                method: "GET",
                headers: {
                    Accept: "application/json"
                },
                cache: "no-store"
            });

            const data = await readJson(response);

            if (!response.ok || data?.success === false) {

                throw new Error(
                    data?.message ||
                    `Unable to load Chemical Lab assignments. HTTP ${response.status}`
                );
            }

            const source =
                Array.isArray(data?.records)
                    ? data.records
                    : Array.isArray(data?.assignments)
                        ? data.assignments
                        : [];

            /*
             * IMPORTANT:
             * Chemical Lab must show ONLY records having
             * Chemical Testing information.
             */
            allRecords = source
                .filter(isChemicalRecord)
                .map(normalizeRecord)
                .sort(sortNewestFirst);

            displayedRecords = [...allRecords];

            renderRecords(displayedRecords);

            hideMessage("searchMessage");

        }
        catch (error) {

            console.error(
                "Chemical Lab load error:",
                error
            );

            allRecords = [];
            displayedRecords = [];

            renderRecords([]);

            setMessage(
                "searchMessage",
                error.message ||
                "Unable to load Chemical Lab assignments.",
                "error"
            );
        }
    }


    // =====================================================
    // CHEMICAL RECORD FILTER
    // =====================================================

    function isChemicalRecord(record) {

        if (!record) {
            return false;
        }

        /*
         * If backend explicitly says this is Chemical Testing.
         */
        if (record.chemicalTesting === true) {
            return true;
        }

        if (
            String(record.chemicalTesting)
                .trim()
                .toLowerCase() === "yes"
        ) {
            return true;
        }

        /*
         * Current Chemical Lab API returns these fields.
         */
        return Boolean(
            record.chemicalGrade ||
            record.chemicalQuantity !== undefined ||
            record.chemicalEquipment
        );
    }


    // =====================================================
    // NORMALIZE RECORD
    // =====================================================

    function normalizeRecord(record) {

        return {

            assignmentId:
                value(record.assignmentId),

            date:
                value(record.date),

            time:
                value(record.time),

            po:
                value(
                    record.po ??
                    record.poNumber
                ),

            so:
                value(
                    record.so ??
                    record.soNumber
                ),

            materialId:
                value(
                    record.materialId ??
                    record.materialIdentifier
                ),

            grn:
                value(
                    record.grn ??
                    record.receiptId
                ),

            materialName:
                value(
                    record.materialName
                ),

            unit:
                value(
                    record.unit ??
                    record.uom ??
                    record.unitOfMeasure
                ),

            // -----------------------------
            // Chemical Testing ONLY
            // -----------------------------

            chemicalGrade:
                value(record.chemicalGrade),

            chemicalQuantity:
                record.chemicalQuantity,

            chemicalEquipment:
                value(record.chemicalEquipment),

            chemicalSampleConsumed:
                value(record.chemicalSampleConsumed),

            chemicalStatus:
                value(record.chemicalStatus) ||
                "Pending",

            acceptedDate:
                value(record.acceptedDate),

            acceptedTime:
                value(record.acceptedTime)
        };
    }


    // =====================================================
    // SORT
    // =====================================================

    function sortNewestFirst(a, b) {

        const left =
            `${a.date} ${a.time}`;

        const right =
            `${b.date} ${b.time}`;

        return right.localeCompare(left);
    }


    // =====================================================
    // SEARCH
    // =====================================================

    function runSearch() {

        const query =
            normalize(
                $("chemicalSearch")?.value
            );

        /*
         * Empty search = show everything.
         */
        if (!query) {

            displayedRecords =
                [...allRecords];

            renderRecords(
                displayedRecords
            );

            hideMessage("searchMessage");
            closeDetails();
            updateClearButton();

            return;
        }


        displayedRecords =
            allRecords.filter(record => {

                const searchableValues = [

                    record.assignmentId,
                    record.po,
                    record.so,
                    record.materialId,
                    record.grn,
                    record.materialName,
                    record.chemicalGrade,
                    record.chemicalEquipment

                ];

                return searchableValues.some(
                    field =>
                        normalize(field)
                            .includes(query)
                );
            });


        renderRecords(
            displayedRecords
        );

        closeDetails();


        if (displayedRecords.length > 0) {

            setMessage(
                "searchMessage",
                `${displayedRecords.length} Chemical Lab record(s) found.`,
                "success"
            );

        }
        else {

            setMessage(
                "searchMessage",
                "No Chemical Lab records match the search value.",
                "error"
            );
        }


        updateClearButton();
    }


    // =====================================================
    // CLEAR SEARCH
    // =====================================================

    function clearSearch() {

        const input =
            $("chemicalSearch");

        if (input) {
            input.value = "";
        }


        displayedRecords =
            [...allRecords];


        renderRecords(
            displayedRecords
        );

        hideMessage("searchMessage");

        closeDetails();

        updateClearButton();

        /*
         * Do not force focus if the browser/UI
         * has another active element.
         */
        if (input) {
            input.focus();
        }
    }


    // =====================================================
    // CLEAR BUTTON VISIBILITY
    // =====================================================

    function updateClearButton() {

        const input =
            $("chemicalSearch");

        const button =
            $("clearSearch");

        if (!input || !button) {
            return;
        }

        button.classList.toggle(
            "hidden",
            input.value.trim() === ""
        );
    }


    // =====================================================
    // RENDER TABLE
    // =====================================================

    function renderRecords(records) {

        const body =
            $("recordsBody");

        const count =
            $("recordCount");

        const empty =
            $("emptyState");


        if (!body) {
            return;
        }


        body.innerHTML = "";


        if (count) {

            count.textContent =
                `${records.length} RECORD${records.length === 1 ? "" : "S"}`;
        }


        if (empty) {

            empty.classList.toggle(
                "hidden",
                records.length > 0
            );
        }


        for (const record of records) {

            const row =
                document.createElement("tr");


            // -----------------------------------------
            // Assignment ID
            // -----------------------------------------

            const assignmentCell =
                document.createElement("td");

            const assignmentButton =
                document.createElement("button");

            assignmentButton.type =
                "button";

            assignmentButton.className =
                "cl-assignment-button";

            assignmentButton.textContent =
                record.assignmentId || "-";


            assignmentButton.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    showDetails(record);
                }
            );


            assignmentCell.appendChild(
                assignmentButton
            );

            row.appendChild(
                assignmentCell
            );


            // -----------------------------------------
            // Standard fields
            // -----------------------------------------

            row.appendChild(
                textCell(record.date)
            );

            row.appendChild(
                textCell(record.time)
            );

            row.appendChild(
                textCell(record.po)
            );

            row.appendChild(
                textCell(record.so)
            );

            row.appendChild(
                textCell(
                    record.materialId,
                    record.materialName
                )
            );

            row.appendChild(
                textCell(record.grn)
            );


            // -----------------------------------------
            // Chemical Grade
            // -----------------------------------------

            row.appendChild(
                textCell(
                    record.chemicalGrade
                )
            );


            // -----------------------------------------
            // Quantity
            // -----------------------------------------

            row.appendChild(
                textCell(
                    formatQuantity(
                        record.chemicalQuantity,
                        record.unit
                    )
                )
            );


            // -----------------------------------------
            // Status
            // -----------------------------------------

            const statusCell =
                document.createElement("td");

            const status =
                document.createElement("span");


            status.className =
                `cl-status-badge ${statusClass(record.chemicalStatus)}`;

            status.textContent =
                record.chemicalStatus ||
                "Pending";


            statusCell.appendChild(
                status
            );

            row.appendChild(
                statusCell
            );


            // -----------------------------------------
            // Row click
            // -----------------------------------------

            row.addEventListener(
                "click",
                () => showDetails(record)
            );


            body.appendChild(row);
        }
    }


    // =====================================================
    // TABLE CELL
    // =====================================================

    function textCell(value, title = "") {

        const cell =
            document.createElement("td");

        cell.textContent =
            display(value);


        if (title) {
            cell.title = title;
        }


        return cell;
    }


    // =====================================================
    // SHOW DETAILS
    // =====================================================

    function showDetails(record) {

        selectedRecord =
            record;


        // -----------------------------------------
        // Common IGQC information
        // -----------------------------------------

        setText(
            "detailAssignmentId",
            record.assignmentId
        );

        setText(
            "detailDate",
            record.date
        );

        setText(
            "detailTime",
            record.time
        );

        setText(
            "detailPo",
            record.po
        );

        setText(
            "detailSo",
            record.so
        );

        setText(
            "detailMaterialId",
            record.materialId
        );

        setText(
            "detailGrn",
            record.grn
        );

        setText(
            "detailMaterialName",
            record.materialName
        );

        setText(
            "detailUnit",
            record.unit
        );


        // -----------------------------------------
        // Chemical Testing information ONLY
        // -----------------------------------------

        setText(
            "detailGrade",
            record.chemicalGrade
        );

        setText(
            "detailQuantity",
            formatQuantity(
                record.chemicalQuantity,
                record.unit
            )
        );

        setText(
            "detailEquipment",
            record.chemicalEquipment
        );

        setText(
            "detailSample",
            record.chemicalSampleConsumed
        );


        // -----------------------------------------
        // Status
        // -----------------------------------------

        const status =
            $("detailStatus");

        if (status) {

            status.textContent =
                record.chemicalStatus ||
                "Pending";

            status.className =
                `cl-status-badge ${statusClass(record.chemicalStatus)}`;
        }


        // -----------------------------------------
        // Accept button
        // -----------------------------------------

        const acceptButton =
            $("acceptButton");

        const acceptedInfo =
            $("acceptedInfo");


        const accepted =
            normalize(
                record.chemicalStatus
            ) === "accepted";


        if (acceptButton) {

            acceptButton.disabled =
                accepted;

            acceptButton.innerHTML =
                accepted
                    ? "<span>✓</span> ACCEPTED"
                    : "<span>✓</span> ACCEPT";
        }


        // -----------------------------------------
        // Acceptance timestamp
        // -----------------------------------------

        if (
            accepted &&
            (
                record.acceptedDate ||
                record.acceptedTime
            )
        ) {

            if (acceptedInfo) {

                acceptedInfo.textContent =
                    `Accepted: ${display(record.acceptedDate)} ${display(record.acceptedTime)}`;

                acceptedInfo.classList.remove(
                    "hidden"
                );
            }

        }
        else {

            if (acceptedInfo) {

                acceptedInfo.textContent =
                    "";

                acceptedInfo.classList.add(
                    "hidden"
                );
            }
        }


        hideMessage(
            "acceptMessage"
        );


        $("detailsPanel")
            ?.classList.remove("hidden");


        requestAnimationFrame(() => {

            $("detailsPanel")
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
        });
    }


    // =====================================================
    // CLOSE DETAILS
    // =====================================================

    function closeDetails() {

        selectedRecord =
            null;

        $("detailsPanel")
            ?.classList.add("hidden");

        hideMessage(
            "acceptMessage"
        );
    }


    // =====================================================
    // ACCEPT CHEMICAL LAB ASSIGNMENT
    // =====================================================

    async function acceptSelectedRecord() {

        if (!selectedRecord?.assignmentId) {

            setMessage(
                "acceptMessage",
                "Select a Chemical Lab assignment first.",
                "error"
            );

            return;
        }


        if (
            normalize(
                selectedRecord.chemicalStatus
            ) === "accepted"
        ) {
            return;
        }


        const button =
            $("acceptButton");


        if (!button) {
            return;
        }


        button.disabled =
            true;

        button.innerHTML =
            "<span>…</span> ACCEPTING...";


        try {

            /*
             * IMPORTANT:
             *
             * Backend endpoint:
             *
             * POST
             * /api/chemical-lab/{assignmentId}/accept
             *
             * No JSON body is required.
             */

            const response =
                await fetch(
                    API_ACCEPT_URL(
                        selectedRecord.assignmentId
                    ),
                    {
                        method: "POST",

                        headers: {
                            Accept:
                                "application/json"
                        },

                        cache: "no-store"
                    }
                );


            const data =
                await readJson(response);


            if (
                !response.ok ||
                data?.success === false
            ) {

                throw new Error(
                    data?.message ||
                    `Chemical Lab acceptance failed. HTTP ${response.status}`
                );
            }


            // -----------------------------------------
            // Backend returns updated record
            // -----------------------------------------

            const updated =
                data?.record ||
                data?.assignment ||
                data?.data;

            if (updated) {
                selectedRecord = normalizeRecord(updated);
            } else {
                selectedRecord.chemicalStatus = "Accepted";
            }

            // Always synchronize BOTH arrays
            const assignmentId = normalize(selectedRecord.assignmentId);

            const allIndex = allRecords.findIndex(
                x => normalize(x.assignmentId) === assignmentId
            );

            if (allIndex >= 0) {
                allRecords[allIndex] = selectedRecord;
            }

            const displayedIndex = displayedRecords.findIndex(
                x => normalize(x.assignmentId) === assignmentId
            );

            if (displayedIndex >= 0) {
                displayedRecords[displayedIndex] = selectedRecord;
            }

            // Re-render using the updated displayed record
            renderRecords(displayedRecords);
            showDetails(selectedRecord);


            


            // -----------------------------------------
            // Success message
            // -----------------------------------------

            setMessage(
                "acceptMessage",
                data?.message ||
                "Chemical Lab material accepted successfully.",
                "success"
            );
        }
        catch (error) {

            console.error(
                "Chemical Lab accept error:",
                error
            );


            button.disabled =
                false;

            button.innerHTML =
                "<span>✓</span> ACCEPT";


            setMessage(
                "acceptMessage",
                error.message ||
                "Chemical Lab acceptance failed.",
                "error"
            );
        }
    }


    // =====================================================
    // QR SCAN
    // =====================================================

    function openScanModal() {

        $("qrModal")
            ?.classList.remove("hidden");


        const input =
            $("qrData");


        if (input) {

            input.value = "";

            setTimeout(
                () => input.focus(),
                50
            );
        }


        hideMessage(
            "scanMessage"
        );
    }


    function closeScanModal() {

        $("qrModal")
            ?.classList.add("hidden");

        hideMessage(
            "scanMessage"
        );
    }


    function processQrScan() {

        const raw =
            $("qrData")
                ?.value
                .trim() ||
            "";


        if (!raw) {

            setMessage(
                "scanMessage",
                "Enter or scan an R1 QR value.",
                "error"
            );

            return;
        }


        const parts =
            raw
                .split("|")
                .map(
                    part => part.trim()
                );


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


        const [
            ,
            po,
            so,
            materialId,
            materialName,
            grn
        ] = parts;


        const matches =
            allRecords.filter(
                record =>
                    normalize(record.po) ===
                    normalize(po) &&

                    normalize(record.so) ===
                    normalize(so) &&

                    normalize(record.materialId) ===
                    normalize(materialId) &&

                    normalize(record.grn) ===
                    normalize(grn)
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


        displayedRecords =
            matches;


        const search =
            $("chemicalSearch");


        if (search) {

            search.value =
                materialId;
        }


        renderRecords(
            displayedRecords
        );


        updateClearButton();


        setMessage(
            "searchMessage",
            `${matches.length} Chemical Testing record(s) found for scanned material.`,
            "success"
        );


        closeDetails();
    }


    // =====================================================
    // JSON READER
    // =====================================================

    async function readJson(response) {

        const raw =
            await response.text();


        if (!raw) {
            return {};
        }


        try {

            return JSON.parse(raw);

        }
        catch {

            throw new Error(
                "The Chemical Lab API returned invalid JSON."
            );
        }
    }


    // =====================================================
    // UI HELPERS
    // =====================================================

    function setText(id, value) {

        const element =
            $(id);


        if (element) {

            element.textContent =
                display(value);
        }
    }


    function setMessage(
        id,
        message,
        type
    ) {

        const element =
            $(id);


        if (!element) {
            return;
        }


        element.textContent =
            message || "";


        element.className =
            `cl-message ${type || "info"}`;


        element.classList.remove(
            "hidden"
        );
    }


    function hideMessage(id) {

        $(id)
            ?.classList.add("hidden");
    }


    // =====================================================
    // STATUS
    // =====================================================

    function statusClass(status) {

        return normalize(status) ===
            "accepted"

            ? "accepted"
            : "pending";
    }


    // =====================================================
    // QUANTITY
    // =====================================================

    function formatQuantity(
        quantity,
        unit
    ) {

        if (
            quantity === null ||
            quantity === undefined ||
            quantity === ""
        ) {

            return "-";
        }


        return unit
            ? `${quantity} ${unit}`
            : String(quantity);
    }


    // =====================================================
    // DISPLAY
    // =====================================================

    function display(value) {

        return (
            value === null ||
            value === undefined ||
            value === ""
        )
            ? "-"
            : String(value);
    }


    function value(value) {

        return (
            value === null ||
            value === undefined
        )
            ? ""
            : String(value).trim();
    }


    function normalize(value) {

        return (
            value === null ||
            value === undefined
        )
            ? ""
            : String(value)
                .trim()
                .toLowerCase();
    }


    // =====================================================
    // FALLBACK DATE/TIME
    // =====================================================

    function getTodayDate() {

        const now =
            new Date();

        return [
            now.getFullYear(),
            String(
                now.getMonth() + 1
            ).padStart(2, "0"),
            String(
                now.getDate()
            ).padStart(2, "0")
        ].join("-");
    }


    function getCurrentTime() {

        const now =
            new Date();

        return [
            String(
                now.getHours()
            ).padStart(2, "0"),

            String(
                now.getMinutes()
            ).padStart(2, "0"),

            String(
                now.getSeconds()
            ).padStart(2, "0")
        ].join(":");
    }

})();