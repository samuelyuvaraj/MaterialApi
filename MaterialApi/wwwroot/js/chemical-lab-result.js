(() => {
    "use strict";

    const LIST_URL = "/api/chemical-lab-result";
    const COMPLETE_URL = "/api/chemical-lab-result/complete";

    // =========================================================
    // HARD-CODED CHEMICAL TEST PARAMETERS
    // TEST PARAMETER -> SPECIFICATION / EXPECTED RESULT
    // =========================================================
    const CHEMICAL_TEST_PARAMETERS = [
        { parameter: "C", specification: "0.22-0.28" },
        { parameter: "Mn", specification: "0.30-0.70" },
        { parameter: "Cr", specification: "16.30-17.70" },
        { parameter: "Si", specification: "2.30-2.80" },
        { parameter: "Mg", specification: "0.20-0.80" },
        { parameter: "Fe", specification: "0.65-0.70" },
        { parameter: "Ti", specification: "0.1-0.30" },
        { parameter: "Zn", specification: "0.1-0.20" },
        { parameter: "Al", specification: "0.30-2.80" }
    ];

    let allRecords = [];
    let displayedRecords = [];
    let selectedRecord = null;

    const $ = id => document.getElementById(id);

    document.addEventListener(
        "DOMContentLoaded",
        initialize
    );

    async function initialize() {
        bindEvents();
        await loadRecords();
    }

    // =========================================================
    // EVENTS
    // =========================================================

    function bindEvents() {

        $("searchButton")
            ?.addEventListener(
                "click",
                runSearch
            );

        $("resultSearch")
            ?.addEventListener(
                "keydown",
                e => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        runSearch();
                    }
                }
            );

        $("resultSearch")
            ?.addEventListener(
                "input",
                updateClearButton
            );

        $("clearSearch")
            ?.addEventListener(
                "click",
                clearSearch
            );

        $("scanButton")
            ?.addEventListener(
                "click",
                openScanModal
            );

        $("closeScan")
            ?.addEventListener(
                "click",
                closeScanModal
            );

        $("cancelScan")
            ?.addEventListener(
                "click",
                closeScanModal
            );

        $("processScan")
            ?.addEventListener(
                "click",
                processQrScan
            );

        $("qrModal")
            ?.addEventListener(
                "click",
                e => {
                    if (
                        e.target ===
                        $("qrModal")
                    ) {
                        closeScanModal();
                    }
                }
            );

        $("closeDetails")
            ?.addEventListener(
                "click",
                closeDetails
            );

        $("addRow")
            ?.addEventListener(
                "click",
                () => addResultRow()
            );

        $("completeButton")
            ?.addEventListener(
                "click",
                completeResult
            );

        $("resultRows")
            ?.addEventListener(
                "input",
                updateRowConformance
            );

        $("resultRows")
            ?.addEventListener(
                "change",
                updateRowConformance
            );
    }

    // =========================================================
    // LOAD RECORDS
    // =========================================================

    async function loadRecords() {

        setMessage(
            "searchMessage",
            "Loading accepted Chemical Lab assignments...",
            "info"
        );

        try {

            const response =
                await fetch(
                    LIST_URL,
                    {
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
                    `Unable to load records. HTTP ${response.status}`
                );
            }

            allRecords =
                (
                    Array.isArray(data.records)
                        ? data.records
                        : []
                )
                    .map(normalizeRecord)
                    .sort(sortNewestFirst);

            displayedRecords =
                [...allRecords];

            renderRecords(
                displayedRecords
            );

            hideMessage(
                "searchMessage"
            );

        }
        catch (error) {

            console.error(
                "Chemical Lab Result load error:",
                error
            );

            allRecords = [];
            displayedRecords = [];

            renderRecords([]);

            setMessage(
                "searchMessage",
                error.message ||
                "Unable to load Chemical Lab Result records.",
                "error"
            );
        }
    }

    // =========================================================
    // NORMALIZE RECORD
    // =========================================================

    function normalizeRecord(r) {

        return {

            assignmentId:
                value(r.assignmentId),

            date:
                value(r.date),

            time:
                value(r.time),

            po:
                value(r.po),

            so:
                value(r.so),

            materialId:
                value(r.materialId),

            materialName:
                value(r.materialName),

            grn:
                value(r.grn),

            unit:
                value(r.unit),

            // Vendor support
            vendor:
                value(
                    r.vendor ??
                    r.Vendor
                ),

            chemicalGrade:
                value(
                    r.chemicalGrade
                ),

            chemicalQuantity:
                r.chemicalQuantity,

            chemicalEquipment:
                value(
                    r.chemicalEquipment
                ),

            chemicalSampleConsumed:
                value(
                    r.chemicalSampleConsumed
                ),

            chemicalStatus:
                value(
                    r.chemicalStatus
                ),

            acceptedDate:
                value(
                    r.acceptedDate
                ),

            acceptedTime:
                value(
                    r.acceptedTime
                ),

            resultId:
                value(
                    r.resultId
                ),

            resultStatus:
                value(
                    r.resultStatus
                ) || "Pending",

            resultEntryDate:
                value(
                    r.resultEntryDate
                ),

            resultEntryTime:
                value(
                    r.resultEntryTime
                ),

            results:
                Array.isArray(r.results)
                    ? r.results.map(
                        (x, i) => ({
                            sno:
                                Number(x.sno) ||
                                i + 1,

                            testParameter:
                                value(
                                    x.testParameter
                                ),

                            specification:
                                value(
                                    x.specification
                                ),

                            result:
                                value(
                                    x.result
                                ),

                            conformance:
                                value(
                                    x.conformance
                                ) ||
                                "Pending"
                        })
                    )
                    : []
        };
    }

    // =========================================================
    // SEARCH
    // =========================================================

    function runSearch() {

        const q =
            normalize(
                $("resultSearch")?.value
            );

        displayedRecords =
            !q
                ? [...allRecords]
                : allRecords.filter(
                    r =>
                        [
                            r.assignmentId,
                            r.po,
                            r.so,
                            r.materialId,
                            r.grn,
                            r.materialName,
                            r.chemicalGrade,
                            r.vendor
                        ].some(
                            x =>
                                normalize(x)
                                    .includes(q)
                        )
                );

        renderRecords(
            displayedRecords
        );

        closeDetails();

        updateClearButton();

        if (q) {

            setMessage(
                "searchMessage",
                displayedRecords.length
                    ? `${displayedRecords.length} accepted record(s) found.`
                    : "No accepted Chemical Lab records match the search value.",
                displayedRecords.length
                    ? "success"
                    : "error"
            );

        }
        else {

            hideMessage(
                "searchMessage"
            );
        }
    }

    function clearSearch() {

        if ($("resultSearch")) {
            $("resultSearch").value = "";
        }

        displayedRecords =
            [...allRecords];

        renderRecords(
            displayedRecords
        );

        closeDetails();

        hideMessage(
            "searchMessage"
        );

        updateClearButton();

        $("resultSearch")?.focus();
    }

    function updateClearButton() {

        $("clearSearch")
            ?.classList.toggle(
                "hidden",
                !normalize(
                    $("resultSearch")?.value
                )
            );
    }

    // =========================================================
    // RECORD TABLE
    // =========================================================

    function renderRecords(records) {

        const body =
            $("recordsBody");

        if (!body) return;

        body.innerHTML = "";

        if ($("recordCount")) {
            $("recordCount")
                .textContent =
                records.length;
        }

        $("emptyState")
            ?.classList.toggle(
                "hidden",
                records.length > 0
            );

        for (const record of records) {

            const row =
                document.createElement("tr");

            appendButtonCell(
                row,
                record.assignmentId,
                () =>
                    showDetails(record)
            );

            [
                record.po,
                record.so,
                record.materialId,
                record.grn,
                record.chemicalGrade,
                formatQuantity(
                    record.chemicalQuantity,
                    record.unit
                )
            ].forEach(
                v =>
                    row.appendChild(
                        textCell(v)
                    )
            );

            const status =
                document.createElement("td");

            status.innerHTML =
                `<span class="status accepted">Accepted</span>`;

            row.appendChild(status);

            row.appendChild(
                textCell(record.date)
            );

            row.appendChild(
                textCell(record.time)
            );

            const action =
                document.createElement("td");

            const btn =
                document.createElement("button");

            btn.className =
                "action-button";

            btn.type =
                "button";

            btn.textContent =
                resultIsCompleted(record)
                    ? "VIEW RESULT"
                    : "RESULT";

            btn.addEventListener(
                "click",
                e => {
                    e.stopPropagation();
                    showDetails(record);
                }
            );

            action.appendChild(btn);
            row.appendChild(action);

            row.addEventListener(
                "click",
                () => showDetails(record)
            );

            body.appendChild(row);
        }
    }

    function appendButtonCell(
        row,
        text,
        action
    ) {

        const td =
            document.createElement("td");

        const b =
            document.createElement("button");

        b.type =
            "button";

        b.className =
            "assignment-link";

        b.textContent =
            text || "-";

        b.addEventListener(
            "click",
            e => {
                e.stopPropagation();
                action();
            }
        );

        td.appendChild(b);

        row.appendChild(td);
    }

    function textCell(v) {

        const td =
            document.createElement("td");

        td.textContent =
            display(v);

        return td;
    }

    // =========================================================
    // DETAILS
    // =========================================================

    function showDetails(record) {

        selectedRecord =
            record;

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

        // Vendor
        setText(
            "detailVendor",
            record.vendor
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
            "detailMaterialName",
            record.materialName
        );

        setText(
            "detailGrn",
            record.grn
        );

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

        setText(
            "detailResultStatus",
            record.resultStatus
        );

        setText(
            "detailEntryDate",
            record.resultEntryDate
        );

        setText(
            "detailEntryTime",
            record.resultEntryTime
        );

        const status =
            $("detailStatus");

        if (status) {

            status.textContent =
                "Accepted";

            status.className =
                "status accepted";
        }

        renderResultRows(
            record.results.length
                ? record.results
                : [
                    {
                        sno: 1,
                        testParameter: "",
                        specification: "",
                        result: "",
                        conformance: "Pending"
                    }
                ]
        );

        const completed =
            resultIsCompleted(record);

        if ($("completeButton")) {

            $("completeButton").disabled =
                completed;

            $("completeButton").textContent =
                completed
                    ? "✓ RESULT COMPLETED"
                    : "✓ COMPLETE RESULT";
        }

        updateOverall();

        hideMessage(
            "resultMessage"
        );

        $("detailsPanel")
            ?.classList.remove(
                "hidden"
            );

        requestAnimationFrame(
            () =>
                $("detailsPanel")
                    ?.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    })
        );
    }

    // =========================================================
    // RESULT ROWS
    // =========================================================

    function renderResultRows(rows) {

        const body =
            $("resultRows");

        if (!body) return;

        body.innerHTML = "";

        rows.forEach(
            (r, i) =>
                appendResultRow(
                    r,
                    i + 1
                )
        );

        updateOverall();
    }

    function addResultRow(
        row = {
            sno: 0,
            testParameter: "",
            specification: "",
            result: "",
            conformance: "Pending"
        }
    ) {

        appendResultRow(
            row,
            $("resultRows")
                ?.children.length + 1 || 1
        );

        updateOverall();
    }

    // =========================================================
    // RESULT ROW
    //
    // TEST PARAMETER = DROPDOWN
    // SPECIFICATION = AUTO FILLED
    // =========================================================

    function appendResultRow(
        r,
        sno
    ) {

        const tr =
            document.createElement("tr");

        const tdS =
            document.createElement("td");

        tdS.textContent =
            sno;

        tr.appendChild(tdS);

        // TEST PARAMETER DROPDOWN
        tr.appendChild(
            parameterSelectCell(
                r.testParameter,
                r.specification
            )
        );

        // SPECIFICATION AUTO-FILLED
        tr.appendChild(
            specificationCell(
                r.testParameter,
                r.specification
            )
        );

        // ACTUAL RESULT
        tr.appendChild(
            inputCell(
                "result",
                r.result,
                "Actual laboratory result"
            )
        );

        // CONFORMANCE
        const conf =
            document.createElement("td");

        const badge =
            document.createElement("span");

        badge.className =
            `conformance ${confClass(
                r.conformance
            )}`;

        badge.textContent =
            r.conformance ||
            "Pending";

        conf.appendChild(badge);

        tr.appendChild(conf);

        // REMOVE
        const remove =
            document.createElement("td");

        const b =
            document.createElement("button");

        b.type =
            "button";

        b.className =
            "remove-row";

        b.textContent =
            "×";

        b.title =
            "Remove row";

        b.addEventListener(
            "click",
            () => {
                tr.remove();
                renumberRows();
                updateOverall();
            }
        );

        remove.appendChild(b);

        tr.appendChild(remove);

        $("resultRows")
            ?.appendChild(tr);

        tr.dataset.conformance =
            r.conformance ||
            "Pending";

        updateRowConformance({
            target:
                tr.querySelector(
                    '[data-field="result"]'
                )
        });
    }

    // =========================================================
    // TEST PARAMETER DROPDOWN
    // =========================================================

    function parameterSelectCell(
        selectedParameter,
        existingSpecification
    ) {

        const td =
            document.createElement("td");

        const select =
            document.createElement("select");

        select.dataset.field =
            "parameter";

        select.className =
            "result-parameter-select";

        const placeholder =
            document.createElement("option");

        placeholder.value =
            "";

        placeholder.textContent =
            "Select test parameter";

        select.appendChild(
            placeholder
        );

        CHEMICAL_TEST_PARAMETERS.forEach(
            item => {

                const option =
                    document.createElement("option");

                option.value =
                    item.parameter;

                option.textContent =
                    item.parameter;

                option.dataset.specification =
                    item.specification;

                if (
                    normalize(
                        item.parameter
                    ) ===
                    normalize(
                        selectedParameter
                    )
                ) {
                    option.selected =
                        true;
                }

                select.appendChild(
                    option
                );
            }
        );

        /*
         * Preserve an older saved parameter
         * if it isn't in the hard-coded list.
         */
        if (
            selectedParameter &&
            !CHEMICAL_TEST_PARAMETERS.some(
                x =>
                    normalize(
                        x.parameter
                    ) ===
                    normalize(
                        selectedParameter
                    )
            )
        ) {

            const legacy =
                document.createElement(
                    "option"
                );

            legacy.value =
                selectedParameter;

            legacy.textContent =
                selectedParameter;

            legacy.selected =
                true;

            legacy.dataset.specification =
                existingSpecification ||
                "";

            select.appendChild(
                legacy
            );
        }

        select.addEventListener(
            "change",
            () => {

                const option =
                    select.options[
                    select.selectedIndex
                    ];

                const specification =
                    option?.dataset
                        .specification ||
                    "";

                const specInput =
                    select
                        .closest("tr")
                        ?.querySelector(
                            '[data-field="specification"]'
                        );

                if (specInput) {

                    specInput.value =
                        specification;
                }

                updateRowConformance({
                    target: select
                });
            }
        );

        td.appendChild(
            select
        );

        return td;
    }

    // =========================================================
    // SPECIFICATION
    // =========================================================

    function specificationCell(
        parameter,
        specification
    ) {

        const td =
            document.createElement("td");

        const input =
            document.createElement("input");

        input.type =
            "text";

        input.dataset.field =
            "specification";

        input.readOnly =
            true;

        input.className =
            "result-specification-input";

        const found =
            CHEMICAL_TEST_PARAMETERS.find(
                x =>
                    normalize(
                        x.parameter
                    ) ===
                    normalize(
                        parameter
                    )
            );

        input.value =
            found?.specification ||
            specification ||
            "";

        input.placeholder =
            "Auto-filled specification";

        td.appendChild(
            input
        );

        return td;
    }

    // =========================================================
    // INPUT CELL
    // =========================================================

    function inputCell(
        field,
        val,
        placeholder
    ) {

        const td =
            document.createElement("td");

        const input =
            document.createElement("input");

        input.type =
            "text";

        input.dataset.field =
            field;

        input.value =
            val || "";

        input.placeholder =
            placeholder;

        td.appendChild(
            input
        );

        return td;
    }

    function renumberRows() {

        [
            ...$("resultRows")
                .children
        ].forEach(
            (tr, i) =>
                tr.children[0]
                    .textContent =
                i + 1
        );
    }

    // =========================================================
    // CONFORMANCE
    // =========================================================

    function updateRowConformance(e) {

        const input =
            e.target;

        if (
            !input?.closest("tr")
        ) {
            return;
        }

        const tr =
            input.closest("tr");

        const spec =
            tr.querySelector(
                '[data-field="specification"]'
            )?.value.trim() ||
            "";

        const result =
            tr.querySelector(
                '[data-field="result"]'
            )?.value.trim() ||
            "";

        const badge =
            tr.querySelector(
                ".conformance"
            );

        if (!badge) return;

        const status =
            evaluate(
                spec,
                result
            );

        tr.dataset.conformance =
            status;

        badge.textContent =
            status;

        badge.className =
            `conformance ${confClass(
                status
            )}`;

        updateOverall();
    }

    function evaluate(
        spec,
        result
    ) {

        if (
            !spec ||
            !result
        ) {
            return "Pending";
        }

        const n =
            Number(
                result.replace(
                    ",",
                    "."
                )
            );

        const normalized =
            spec
                .replace(
                    /[–—]/g,
                    "-"
                )
                .trim();

        if (
            Number.isFinite(n)
        ) {

            let m =
                normalized.match(
                    /^(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)$/
                );

            if (m) {

                const a =
                    Number(m[1]);

                const b =
                    Number(m[2]);

                return n >= a &&
                    n <= b
                    ? "Conforming"
                    : "Not Conforming";
            }

            m =
                normalized.match(
                    /^(<=|>=|<|>)\s*(-?\d+(?:\.\d+)?)$/
                );

            if (m) {

                const x =
                    Number(m[2]);

                const ok =
                    m[1] === "<="
                        ? n <= x
                        : m[1] === ">="
                            ? n >= x
                            : m[1] === "<"
                                ? n < x
                                : n > x;

                return ok
                    ? "Conforming"
                    : "Not Conforming";
            }

            if (
                Number.isFinite(
                    Number(
                        normalized
                    )
                )
            ) {

                return n ===
                    Number(normalized)
                    ? "Conforming"
                    : "Not Conforming";
            }
        }

        return normalize(spec) ===
            normalize(result)
            ? "Conforming"
            : "Not Conforming";
    }

    // =========================================================
    // COMPLETE RESULT
    // =========================================================

    async function completeResult() {

        if (
            !selectedRecord?.assignmentId
        ) {
            return;
        }

        const rows =
            [
                ...$("resultRows")
                    .querySelectorAll("tr")
            ]
                .map(
                    (tr, i) => ({
                        sno:
                            i + 1,

                        testParameter:
                            tr.querySelector(
                                '[data-field="parameter"]'
                            )?.value.trim() ||
                            "",

                        specification:
                            tr.querySelector(
                                '[data-field="specification"]'
                            )?.value.trim() ||
                            "",

                        result:
                            tr.querySelector(
                                '[data-field="result"]'
                            )?.value.trim() ||
                            ""
                    })
                );

        if (!rows.length) {

            setMessage(
                "resultMessage",
                "Add at least one result row.",
                "error"
            );

            return;
        }

        const invalid =
            rows.findIndex(
                r =>
                    !r.testParameter ||
                    !r.specification ||
                    !r.result
            );

        if (invalid >= 0) {

            setMessage(
                "resultMessage",
                `Complete Test Parameter, Specification and Result for row ${invalid + 1}.`,
                "error"
            );

            return;
        }

        const button =
            $("completeButton");

        if (button) {

            button.disabled =
                true;

            button.textContent =
                "SAVING...";
        }

        try {

            const response =
                await fetch(
                    COMPLETE_URL,
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Accept:
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                assignmentId:
                                    selectedRecord.assignmentId,

                                results:
                                    rows
                            }),

                        cache:
                            "no-store"
                    }
                );

            const data =
                await readJson(
                    response
                );

            if (
                !response.ok ||
                data?.success === false
            ) {

                throw new Error(
                    data?.message ||
                    `Unable to complete result. HTTP ${response.status}`
                );
            }

            const updated =
                normalizeRecord(
                    data.record || {}
                );

            const id =
                normalize(
                    selectedRecord.assignmentId
                );

            const ai =
                allRecords.findIndex(
                    x =>
                        normalize(
                            x.assignmentId
                        ) === id
                );

            if (ai >= 0) {
                allRecords[ai] =
                    updated;
            }

            const di =
                displayedRecords.findIndex(
                    x =>
                        normalize(
                            x.assignmentId
                        ) === id
                );

            if (di >= 0) {
                displayedRecords[di] =
                    updated;
            }

            selectedRecord =
                updated;

            renderRecords(
                displayedRecords
            );

            showDetails(
                updated
            );

            setMessage(
                "resultMessage",
                data.message ||
                "Chemical Lab result completed successfully.",
                "success"
            );

        }
        catch (error) {

            console.error(
                "Chemical Lab Result completion error:",
                error
            );

            if (button) {

                button.disabled =
                    false;

                button.textContent =
                    "✓ COMPLETE RESULT";
            }

            setMessage(
                "resultMessage",
                error.message ||
                "Chemical Lab Result completion failed.",
                "error"
            );
        }
    }

    // =========================================================
    // OVERALL RESULT
    // =========================================================

    function updateOverall() {

        const rows =
            [
                ...$("resultRows")
                    ?.children || []
            ];

        const statuses =
            rows.map(
                r =>
                    r.dataset.conformance ||
                    "Pending"
            );

        const box =
            $("overallResult");

        if (!box) return;

        if (
            !rows.length ||
            statuses.some(
                x =>
                    x === "Pending"
            )
        ) {

            box.className =
                "overall pending";

            box.textContent =
                "RESULT NOT COMPLETED";

        }
        else if (
            statuses.every(
                x =>
                    x === "Conforming"
            )
        ) {

            box.className =
                "overall good";

            box.textContent =
                "ALL RESULTS CONFORMING";

        }
        else {

            box.className =
                "overall bad";

            box.textContent =
                "NOT CONFORMING";
        }
    }

    function resultIsCompleted(r) {

        return normalize(
            r.resultStatus
        ).startsWith(
            "completed"
        );
    }

    function confClass(x) {

        return normalize(x) ===
            "conforming"

            ? "conforming"

            : normalize(x) ===
                "not conforming"

                ? "not-conforming"

                : "pending";
    }

    // =========================================================
    // QR SCAN
    // =========================================================

    function openScanModal() {

        $("qrModal")
            ?.classList.remove(
                "hidden"
            );

        if ($("qrData")) {

            $("qrData").value =
                "";

            setTimeout(
                () =>
                    $("qrData").focus(),
                50
            );
        }

        hideMessage(
            "scanMessage"
        );
    }

    function closeScanModal() {

        $("qrModal")
            ?.classList.add(
                "hidden"
            );

        hideMessage(
            "scanMessage"
        );
    }

    function processQrScan() {

        const raw =
            $("qrData")
                ?.value.trim() ||
            "";

        if (!raw) {

            setMessage(
                "scanMessage",
                "Enter or scan an R1 QR value.",
                "error"
            );

            return;
        }

        const p =
            raw
                .split("|")
                .map(
                    x =>
                        x.trim()
                );

        if (
            p.length !== 6 ||
            p[0].toUpperCase() !==
            "R1"
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
            id,
            ,
            grn
        ] = p;

        const matches =
            allRecords.filter(
                r =>
                    normalize(r.po) ===
                    normalize(po) &&

                    normalize(r.so) ===
                    normalize(so) &&

                    normalize(r.materialId) ===
                    normalize(id) &&

                    normalize(r.grn) ===
                    normalize(grn)
            );

        closeScanModal();

        displayedRecords =
            matches;

        if ($("resultSearch")) {
            $("resultSearch")
                .value = id;
        }

        renderRecords(
            matches
        );

        updateClearButton();

        if (!matches.length) {

            closeDetails();

            setMessage(
                "searchMessage",
                "No accepted Chemical Lab assignment was found for the scanned material.",
                "error"
            );

        }
        else {

            setMessage(
                "searchMessage",
                `${matches.length} accepted Chemical Lab record(s) found.`,
                "success"
            );
        }
    }

    // =========================================================
    // CLOSE DETAILS
    // =========================================================

    function closeDetails() {

        $("detailsPanel")
            ?.classList.add(
                "hidden"
            );

        selectedRecord =
            null;

        hideMessage(
            "resultMessage"
        );
    }

    // =========================================================
    // HELPERS
    // =========================================================

    async function readJson(
        response
    ) {

        const raw =
            await response.text();

        if (!raw) {
            return {};
        }

        try {
            return JSON.parse(
                raw
            );
        }
        catch {

            throw new Error(
                "The Chemical Lab Result API returned invalid JSON."
            );
        }
    }

    function setText(
        id,
        v
    ) {

        if ($(id)) {

            $(id).textContent =
                display(v);
        }
    }

    function setMessage(
        id,
        msg,
        type
    ) {

        if (!$(id)) {
            return;
        }

        $(id).textContent =
            msg || "";

        $(id).className =
            `clr-message ${type || "info"}`;
    }

    function hideMessage(id) {

        $(id)
            ?.classList.add(
                "hidden"
            );
    }

    function sortNewestFirst(
        a,
        b
    ) {

        return (
            `${b.date} ${b.time}`
        )
            .localeCompare(
                `${a.date} ${a.time}`
            );
    }

    function formatQuantity(
        q,
        u
    ) {

        return q === null ||
            q === undefined ||
            q === ""

            ? "-"

            : u
                ? `${q} ${u}`
                : String(q);
    }

    function display(v) {

        return v === null ||
            v === undefined ||
            v === ""

            ? "-"

            : String(v);
    }

    function value(v) {

        return v === null ||
            v === undefined

            ? ""

            : String(v).trim();
    }

    function normalize(v) {

        return v === null ||
            v === undefined

            ? ""

            : String(v)
                .trim()
                .toLowerCase();
    }

})();