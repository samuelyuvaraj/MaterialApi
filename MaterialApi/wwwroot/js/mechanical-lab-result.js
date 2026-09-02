/*
 * BDL MES - MECHANICAL LAB RESULT
 *
 * Flow:
 *
 * IGQC Testing Assignment
 *        ↓
 * Mechanical Lab
 *        ↓
 * Accept
 *        ↓
 * Mechanical Lab Result
 *        ↓
 * Enter Results
 *        ↓
 * Complete Result
 *        ↓
 * Mechanical_Lab_Result_Data.xlsx
 *        ↓
 * IGQC_Data.xlsx
 */

(() => {
    "use strict";

    // =========================================================
    // API
    // =========================================================

    const LIST_URL = "/api/mechanical-lab-result";

    const COMPLETE_URL =
        "/api/mechanical-lab-result/complete";


    // =========================================================
    // MECHANICAL TEST PARAMETERS
    // =========================================================

    const MECHANICAL_TEST_PARAMETERS = [
        {
            parameter: "UTS",
            specification: ">=540"
        },
        {
            parameter: "Yeild Strenght",
            specification: ">=480"
        },
        {
            parameter: "Tensile Strength",
            specification: ">=90"
        },
        {
            parameter: "Elongation",
            specification: ">=250"
        },
        {
            parameter: "Residual Elongation",
            specification: "<=12"
        },
        {
            parameter: "Shore Hardness A",
            specification: "55-70"
        },
        {
            parameter: "Hardness(HV)",
            specification: "280-380"
        }
    ];


    // =========================================================
    // STATE
    // =========================================================

    let allRecords = [];

    let displayedRecords = [];

    let selectedRecord = null;


    // =========================================================
    // HELPER
    // =========================================================

    const $ = id =>
        document.getElementById(id);


    // =========================================================
    // INITIALIZE
    // =========================================================

    document.addEventListener(
        "DOMContentLoaded",
        initialize
    );


    async function initialize() {

        bindEvents();

        updateClearButton();

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


        $("qrData")
            ?.addEventListener(
                "keydown",
                e => {

                    if (
                        e.ctrlKey &&
                        e.key === "Enter"
                    ) {

                        e.preventDefault();

                        processQrScan();
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
    // LOAD ACCEPTED MECHANICAL ASSIGNMENTS
    // =========================================================

    async function loadRecords() {

        setMessage(
            "searchMessage",
            "Loading accepted Mechanical Lab assignments...",
            "info"
        );

        try {

            const response =
                await fetch(
                    LIST_URL,
                    {
                        method: "GET",

                        headers: {
                            Accept:
                                "application/json"
                        },

                        cache:
                            "no-store"
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
                    `Unable to load Mechanical Lab Result records. HTTP ${response.status}`
                );
            }


            const source =
                Array.isArray(data?.records)
                    ? data.records
                    : [];


            allRecords =
                source
                    .map(
                        normalizeRecord
                    )
                    .sort(
                        sortNewestFirst
                    );


            displayedRecords =
                [...allRecords];


            renderRecords(
                displayedRecords
            );


            hideMessage(
                "searchMessage"
            );


            console.log(
                "Mechanical Lab Result records:",
                source
            );

        }
        catch (error) {

            console.error(
                "Mechanical Lab Result load error:",
                error
            );


            allRecords = [];

            displayedRecords = [];


            renderRecords([]);


            setMessage(
                "searchMessage",
                error.message ||
                "Unable to load Mechanical Lab Result records.",
                "error"
            );
        }
    }


    // =========================================================
    // NORMALIZE MECHANICAL RECORD
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
                value(
                    r.po ??
                    r.poNumber
                ),


            so:
                value(
                    r.so ??
                    r.soNumber
                ),


            materialId:
                value(
                    r.materialId ??
                    r.materialIdentifier
                ),


            materialName:
                value(
                    r.materialName
                ),


            grn:
                value(
                    r.grn ??
                    r.receiptId
                ),


            unit:
                value(
                    r.unit ??
                    r.uom ??
                    r.unitOfMeasure
                ),


            vendor:
                value(
                    r.vendor ??
                    r.Vendor
                ),


            // =================================================
            // MECHANICAL
            // =================================================

            mechanicalGrade:
                value(
                    r.mechanicalGrade
                ),


            mechanicalQuantity:
                r.mechanicalQuantity,


            mechanicalEquipment:
                value(
                    r.mechanicalEquipment
                ),


            mechanicalSampleConsumed:
                value(
                    r.mechanicalSampleConsumed
                ),


            mechanicalStatus:
                value(
                    r.mechanicalStatus
                ) || "Pending",


            acceptedDate:
                value(
                    r.acceptedDate
                ),


            acceptedTime:
                value(
                    r.acceptedTime
                ),


            // =================================================
            // RESULT
            // =================================================

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
                                Number(
                                    x.sno
                                ) ||
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
                                    x.result ??
                                    x.actualResult
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


        if (!q) {

            displayedRecords =
                [...allRecords];

        }
        else {

            displayedRecords =
                allRecords.filter(
                    r =>
                        [
                            r.assignmentId,
                            r.po,
                            r.so,
                            r.materialId,
                            r.grn,
                            r.materialName,
                            r.vendor,
                            r.mechanicalGrade
                        ].some(
                            x =>
                                normalize(x)
                                    .includes(q)
                        )
                );
        }


        renderRecords(
            displayedRecords
        );


        closeDetails();


        updateClearButton();


        if (q) {

            setMessage(
                "searchMessage",

                displayedRecords.length
                    ? `${displayedRecords.length} accepted Mechanical Lab record(s) found.`
                    : "No accepted Mechanical Lab records match the search value.",

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


    // =========================================================
    // CLEAR SEARCH
    // =========================================================

    function clearSearch() {

        const input =
            $("resultSearch");


        if (input) {

            input.value =
                "";

            input.focus();
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
    }


    function updateClearButton() {

        const input =
            $("resultSearch");

        const button =
            $("clearSearch");


        if (!input || !button)
            return;


        button.classList.toggle(
            "hidden",
            input.value.trim() === ""
        );
    }


    // =========================================================
    // RECORD TABLE
    // =========================================================

    function renderRecords(records) {

        const body =
            $("recordsBody");


        if (!body)
            return;


        body.innerHTML =
            "";


        const count =
            $("recordCount");


        if (count) {

            count.textContent =
                records.length;
        }


        $("emptyState")
            ?.classList.toggle(
                "hidden",
                records.length > 0
            );


        records.forEach(
            record => {

                const row =
                    document.createElement(
                        "tr"
                    );


                // ASSIGNMENT ID

                appendButtonCell(
                    row,
                    record.assignmentId,
                    () =>
                        showDetails(record)
                );


                // PO

                row.appendChild(
                    textCell(
                        record.po
                    )
                );


                // SO

                row.appendChild(
                    textCell(
                        record.so
                    )
                );


                // MATERIAL

                row.appendChild(
                    textCell(
                        record.materialId,
                        record.materialName
                    )
                );


                // GRN

                row.appendChild(
                    textCell(
                        record.grn
                    )
                );


                // GRADE

                row.appendChild(
                    textCell(
                        record.mechanicalGrade
                    )
                );


                // QUANTITY

                row.appendChild(
                    textCell(
                        formatQuantity(
                            record.mechanicalQuantity,
                            record.unit
                        )
                    )
                );


                // STATUS

                const statusCell =
                    document.createElement(
                        "td"
                    );


                const status =
                    document.createElement(
                        "span"
                    );


                status.className =
                    `status ${statusClass(
                        record.mechanicalStatus
                    )}`;


                status.textContent =
                    record.mechanicalStatus ||
                    "Accepted";


                statusCell.appendChild(
                    status
                );


                row.appendChild(
                    statusCell
                );


                // DATE

                row.appendChild(
                    textCell(
                        record.date
                    )
                );


                // TIME

                row.appendChild(
                    textCell(
                        record.time
                    )
                );


                // ACTION

                const action =
                    document.createElement(
                        "td"
                    );


                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";


                button.className =
                    "action-button";


                button.textContent =
                    resultIsCompleted(record)
                        ? "VIEW RESULT"
                        : "RESULT";


                button.addEventListener(
                    "click",
                    e => {

                        e.stopPropagation();

                        showDetails(record);
                    }
                );


                action.appendChild(
                    button
                );


                row.appendChild(
                    action
                );


                row.addEventListener(
                    "click",
                    () =>
                        showDetails(record)
                );


                body.appendChild(
                    row
                );
            }
        );
    }


    // =========================================================
    // APPEND ASSIGNMENT BUTTON
    // =========================================================

    function appendButtonCell(
        row,
        text,
        action
    ) {

        const td =
            document.createElement(
                "td"
            );


        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";


        button.className =
            "assignment-link";


        button.textContent =
            text || "-";


        button.addEventListener(
            "click",
            e => {

                e.stopPropagation();

                action();
            }
        );


        td.appendChild(
            button
        );


        row.appendChild(
            td
        );
    }


    function textCell(
        v,
        title = ""
    ) {

        const td =
            document.createElement(
                "td"
            );


        td.textContent =
            display(v);


        if (title)
            td.title =
                title;


        return td;
    }


    // =========================================================
    // SHOW DETAILS
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
            "detailVendor",
            record.vendor
        );


        setText(
            "detailGrn",
            record.grn
        );


        // =====================================================
        // MECHANICAL DETAILS
        // =====================================================

        setText(
            "detailGrade",
            record.mechanicalGrade
        );


        setText(
            "detailQuantity",
            formatQuantity(
                record.mechanicalQuantity,
                record.unit
            )
        );


        setText(
            "detailEquipment",
            record.mechanicalEquipment
        );


        setText(
            "detailSample",
            record.mechanicalSampleConsumed
        );


        // =====================================================
        // MECHANICAL STATUS
        // =====================================================

        const status =
            $("detailStatus");


        if (status) {

            status.textContent =
                record.mechanicalStatus ||
                "Accepted";


            status.className =
                `status ${statusClass(
                    record.mechanicalStatus
                )}`;
        }


        // =====================================================
        // RESULT INFORMATION
        // =====================================================

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


        // =====================================================
        // RESULT ROWS
        // =====================================================

        const rows =
            record.results?.length
                ? record.results
                : [
                    {
                        sno: 1,
                        testParameter: "",
                        specification: "",
                        result: "",
                        conformance: "Pending"
                    }
                ];


        renderResultRows(
            rows
        );


        // =====================================================
        // COMPLETE BUTTON
        // =====================================================

        const completed =
            resultIsCompleted(record);


        const completeButton =
            $("completeButton");


        if (completeButton) {

            completeButton.disabled =
                completed;


            completeButton.textContent =
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
            () => {

                $("detailsPanel")
                    ?.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
            }
        );
    }


    // =========================================================
    // CLOSE DETAILS
    // =========================================================

    function closeDetails() {

        selectedRecord =
            null;


        $("detailsPanel")
            ?.classList.add(
                "hidden"
            );


        hideMessage(
            "resultMessage"
        );
    }


    // =========================================================
    // RESULT ROWS
    // =========================================================

    function renderResultRows(rows) {

        const body =
            $("resultRows");


        if (!body)
            return;


        body.innerHTML =
            "";


        rows.forEach(
            (row, index) => {

                appendResultRow(
                    row,
                    index + 1
                );
            }
        );


        updateOverall();
    }


    function addResultRow() {

        const body =
            $("resultRows");


        if (!body)
            return;


        appendResultRow(
            {
                sno:
                    body.children.length + 1,

                testParameter:
                    "",

                specification:
                    "",

                result:
                    "",

                conformance:
                    "Pending"
            },

            body.children.length + 1
        );


        updateOverall();
    }


    // =========================================================
    // RESULT ROW
    // =========================================================

    function appendResultRow(
        r,
        sno
    ) {

        const tr =
            document.createElement(
                "tr"
            );


        // S.NO

        const snoCell =
            document.createElement(
                "td"
            );


        snoCell.textContent =
            sno;


        tr.appendChild(
            snoCell
        );


        // TEST PARAMETER

        tr.appendChild(
            parameterSelectCell(
                r.testParameter,
                r.specification
            )
        );


        // SPECIFICATION

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
                r.result ??
                r.actualResult,
                "Actual mechanical result"
            )
        );


        // CONFORMANCE

        const confCell =
            document.createElement(
                "td"
            );


        const badge =
            document.createElement(
                "span"
            );


        badge.className =
            `conformance ${confClass(
                r.conformance
            )}`;


        badge.textContent =
            r.conformance ||
            "Pending";


        confCell.appendChild(
            badge
        );


        tr.appendChild(
            confCell
        );


        // REMOVE BUTTON

        const removeCell =
            document.createElement(
                "td"
            );


        const removeButton =
            document.createElement(
                "button"
            );


        removeButton.type =
            "button";


        removeButton.className =
            "remove-row";


        removeButton.textContent =
            "×";


        removeButton.title =
            "Remove row";


        removeButton.addEventListener(
            "click",
            () => {

                tr.remove();

                renumberRows();

                updateOverall();
            }
        );


        removeCell.appendChild(
            removeButton
        );


        tr.appendChild(
            removeCell
        );


        tr.dataset.conformance =
            r.conformance ||
            "Pending";


        $("resultRows")
            ?.appendChild(
                tr
            );


        const resultInput =
            tr.querySelector(
                '[data-field="result"]'
            );


        updateRowConformance({
            target:
                resultInput
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
            document.createElement(
                "td"
            );


        const select =
            document.createElement(
                "select"
            );


        select.dataset.field =
            "parameter";


        select.className =
            "result-parameter-select";


        // Placeholder

        const placeholder =
            document.createElement(
                "option"
            );


        placeholder.value =
            "";


        placeholder.textContent =
            "Select test parameter";


        select.appendChild(
            placeholder
        );


        // Mechanical parameters

        MECHANICAL_TEST_PARAMETERS.forEach(
            item => {

                const option =
                    document.createElement(
                        "option"
                    );


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


        // Preserve old value

        if (
            selectedParameter &&
            !MECHANICAL_TEST_PARAMETERS.some(
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


        // Parameter change

        select.addEventListener(
            "change",
            () => {

                const option =
                    select.options[
                    select.selectedIndex
                    ];


                const specification =
                    option?.dataset
                        ?.specification ||
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
                    target:
                        select
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
            document.createElement(
                "td"
            );


        const input =
            document.createElement(
                "input"
            );


        input.type =
            "text";


        input.dataset.field =
            "specification";


        input.readOnly =
            true;


        input.className =
            "result-specification-input";


        const found =
            MECHANICAL_TEST_PARAMETERS.find(
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
    // RESULT INPUT
    // =========================================================

    function inputCell(
        field,
        val,
        placeholder
    ) {

        const td =
            document.createElement(
                "td"
            );


        const input =
            document.createElement(
                "input"
            );


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


    // =========================================================
    // RENUMBER
    // =========================================================

    function renumberRows() {

        [
            ...$("resultRows")
                .children
        ].forEach(
            (tr, index) => {

                tr.children[0]
                    .textContent =
                    index + 1;
            }
        );
    }


    // =========================================================
    // CONFORMANCE
    // =========================================================

    function updateRowConformance(e) {

        const input =
            e.target;


        if (!input)
            return;


        const tr =
            input.closest("tr");


        if (!tr)
            return;


        const specification =
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


        if (!badge)
            return;


        const conformance =
            evaluateConformance(
                specification,
                result
            );


        tr.dataset.conformance =
            conformance;


        badge.textContent =
            conformance;


        badge.className =
            `conformance ${confClass(
                conformance
            )}`;


        updateOverall();
    }


    // =========================================================
    // EVALUATE CONFORMANCE
    // =========================================================

    function evaluateConformance(
        specification,
        result
    ) {

        if (
            !specification ||
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


        const spec =
            specification
                .replace(
                    /[–—]/g,
                    "-"
                )
                .trim();


        // Range

        if (
            Number.isFinite(n)
        ) {

            let match =
                spec.match(
                    /^(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)$/
                );


            if (match) {

                const min =
                    Number(match[1]);


                const max =
                    Number(match[2]);


                return n >= min &&
                    n <= max

                    ? "Conforming"

                    : "Not Conforming";
            }


            // >= / <= / > / <

            match =
                spec.match(
                    /^(<=|>=|<|>)\s*(-?\d+(?:\.\d+)?)$/
                );


            if (match) {

                const operator =
                    match[1];


                const limit =
                    Number(match[2]);


                let valid;


                switch (operator) {

                    case "<=":
                        valid =
                            n <= limit;
                        break;

                    case ">=":
                        valid =
                            n >= limit;
                        break;

                    case "<":
                        valid =
                            n < limit;
                        break;

                    case ">":
                        valid =
                            n > limit;
                        break;

                    default:
                        valid =
                            false;
                }


                return valid
                    ? "Conforming"
                    : "Not Conforming";
            }


            // Exact number

            if (
                Number.isFinite(
                    Number(spec)
                )
            ) {

                return n ===
                    Number(spec)

                    ? "Conforming"

                    : "Not Conforming";
            }
        }


        // Text result

        return normalize(spec) ===
            normalize(result)

            ? "Conforming"

            : "Not Conforming";
    }


    // =========================================================
    // COMPLETE MECHANICAL RESULT
    // =========================================================

    async function completeResult() {

        if (
            !selectedRecord?.assignmentId
        ) {

            setMessage(
                "resultMessage",
                "Select a Mechanical Lab assignment first.",
                "error"
            );

            return;
        }


        const rows =
            [
                ...$("resultRows")
                    .querySelectorAll("tr")
            ]
                .map(
                    (tr, index) => ({

                        sno:
                            index + 1,


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


                        // Keep "result" internally.
                        // It will be converted to
                        // "actualResult" before API submission.

                        result:
                            tr.querySelector(
                                '[data-field="result"]'
                            )?.value.trim() ||
                            "",


                        conformance:
                            tr.dataset.conformance ||
                            "Pending"
                    })
                );


        // =====================================================
        // NO ROWS
        // =====================================================

        if (!rows.length) {

            setMessage(
                "resultMessage",
                "Add at least one mechanical test result.",
                "error"
            );

            return;
        }


        // =====================================================
        // VALIDATE ROWS
        // =====================================================

        const invalidIndex =
            rows.findIndex(
                row =>
                    !row.testParameter ||
                    !row.specification ||
                    !row.result
            );


        if (invalidIndex >= 0) {

            setMessage(
                "resultMessage",

                `Complete Test Parameter, Specification and Actual Result for row ${invalidIndex + 1}.`,

                "error"
            );

            return;
        }


        // =====================================================
        // VALIDATE CONFORMANCE
        // =====================================================

        const pending =
            rows.findIndex(
                row =>
                    row.conformance ===
                    "Pending"
            );


        if (pending >= 0) {

            setMessage(
                "resultMessage",

                `Enter the actual result for row ${pending + 1} so conformance can be determined.`,

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

            // =================================================
            // IMPORTANT API PAYLOAD
            // =================================================
            //
            // UI internally uses:
            //
            //     row.result
            //
            // Backend expects:
            //
            //     actualResult
            //
            // Therefore convert ONLY here.
            // =================================================

            const apiResults =
                rows.map(
                    row => ({

                        sno:
                            row.sno,

                        testParameter:
                            row.testParameter,

                        specification:
                            row.specification,

                        actualResult:
                            row.result,

                        conformance:
                            row.conformance
                    })
                );


            const request = {

                assignmentId:
                    selectedRecord.assignmentId,


                date:
                    selectedRecord.date,


                time:
                    selectedRecord.time,


                po:
                    selectedRecord.po,


                so:
                    selectedRecord.so,


                materialId:
                    selectedRecord.materialId,


                materialName:
                    selectedRecord.materialName,


                grn:
                    selectedRecord.grn,


                unit:
                    selectedRecord.unit,


                mechanicalGrade:
                    selectedRecord.mechanicalGrade,


                mechanicalQuantity:
                    selectedRecord.mechanicalQuantity,


                mechanicalEquipment:
                    selectedRecord.mechanicalEquipment,


                mechanicalSampleConsumed:
                    selectedRecord.mechanicalSampleConsumed,


                mechanicalStatus:
                    selectedRecord.mechanicalStatus,


                acceptedDate:
                    selectedRecord.acceptedDate,


                acceptedTime:
                    selectedRecord.acceptedTime,


                resultStatus:
                    "Completed",


                vendor:
                    selectedRecord.vendor,


                // IMPORTANT:
                // Send actualResult to backend.

                results:
                    apiResults
            };


            console.log(
                "Submitting Mechanical Lab Result:",
                request
            );


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
                            JSON.stringify(
                                request
                            ),

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
                    data?.detail ||
                    `Unable to complete Mechanical Lab result. HTTP ${response.status}`
                );
            }


            console.log(
                "Mechanical Lab Result completed:",
                data
            );


            // =================================================
            // UPDATE LOCAL RECORD
            // =================================================

            const updated =
                normalizeRecord(
                    data.record ||
                    {}
                );


            /*
             * If API does not return the full record,
             * keep the current record and update result fields.
             */

            if (
                !updated.assignmentId
            ) {

                selectedRecord.resultStatus =
                    "Completed";


                selectedRecord.results =
                    rows;


                selectedRecord.resultEntryDate =
                    new Date()
                        .toISOString()
                        .substring(
                            0,
                            10
                        );


                selectedRecord.resultEntryTime =
                    new Date()
                        .toTimeString()
                        .substring(
                            0,
                            8
                        );

            }
            else {

                selectedRecord =
                    updated;
            }


            const id =
                normalize(
                    selectedRecord.assignmentId
                );


            const allIndex =
                allRecords.findIndex(
                    x =>
                        normalize(
                            x.assignmentId
                        ) === id
                );


            if (
                allIndex >= 0
            ) {

                allRecords[
                    allIndex
                ] =
                    selectedRecord;
            }


            const displayedIndex =
                displayedRecords.findIndex(
                    x =>
                        normalize(
                            x.assignmentId
                        ) === id
                );


            if (
                displayedIndex >= 0
            ) {

                displayedRecords[
                    displayedIndex
                ] =
                    selectedRecord;
            }


            renderRecords(
                displayedRecords
            );


            showDetails(
                selectedRecord
            );


            setMessage(
                "resultMessage",

                data.message ||
                "Mechanical Lab result completed successfully.",

                "success"
            );

        }
        catch (error) {

            console.error(
                "Mechanical Lab Result completion error:",
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
                "Mechanical Lab Result completion failed.",

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
                ...(
                    $("resultRows")
                        ?.children ||
                    []
                )
            ];


        const box =
            $("overallResult");


        if (!box)
            return;


        if (!rows.length) {

            box.className =
                "overall pending";

            box.textContent =
                "RESULT NOT COMPLETED";

            return;
        }


        const statuses =
            rows.map(
                row =>
                    row.dataset.conformance ||
                    "Pending"
            );


        if (
            statuses.some(
                x =>
                    x ===
                    "Pending"
            )
        ) {

            box.className =
                "overall pending";

            box.textContent =
                "RESULT NOT COMPLETED";

            return;
        }


        if (
            statuses.every(
                x =>
                    x ===
                    "Conforming"
            )
        ) {

            box.className =
                "overall good";

            box.textContent =
                "ALL RESULTS CONFORMING";

            return;
        }


        box.className =
            "overall bad";


        box.textContent =
            "NOT CONFORMING";
    }


    // =========================================================
    // RESULT COMPLETED?
    // =========================================================

    function resultIsCompleted(record) {

        return normalize(
            record.resultStatus
        ).startsWith(
            "completed"
        );
    }


    // =========================================================
    // STATUS CLASS
    // =========================================================

    function statusClass(status) {

        const value =
            normalize(status);


        if (
            value ===
            "accepted"
        ) {

            return "accepted";
        }


        if (
            value ===
            "completed"
        ) {

            return "accepted";
        }


        return "pending";
    }


    // =========================================================
    // CONFORMANCE CLASS
    // =========================================================

    function confClass(
        value
    ) {

        const normalized =
            normalize(value);


        if (
            normalized ===
            "conforming"
        ) {

            return "conforming";
        }


        if (
            normalized ===
            "not conforming"
        ) {

            return "not-conforming";
        }


        return "pending";
    }


    // =========================================================
    // QR MODAL
    // =========================================================

    function openScanModal() {

        $("qrModal")
            ?.classList.remove(
                "hidden"
            );


        const input =
            $("qrData");


        if (input) {

            input.value =
                "";


            setTimeout(
                () =>
                    input.focus(),
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


    // =========================================================
    // QR PROCESS
    // =========================================================

    function processQrScan() {

        const raw =
            $("qrData")
                ?.value
                ?.trim() ||
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
                    x =>
                        x.trim()
                );


        if (
            parts.length !== 6 ||
            parts[0].toUpperCase() !==
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
            materialId,
            ,
            grn
        ] =
            parts;


        const matches =
            allRecords.filter(
                record =>

                    normalize(
                        record.po
                    ) ===
                    normalize(po)

                    &&

                    normalize(
                        record.so
                    ) ===
                    normalize(so)

                    &&

                    normalize(
                        record.materialId
                    ) ===
                    normalize(materialId)

                    &&

                    normalize(
                        record.grn
                    ) ===
                    normalize(grn)
            );


        closeScanModal();


        displayedRecords =
            matches;


        if ($("resultSearch")) {

            $("resultSearch")
                .value =
                materialId;
        }


        renderRecords(
            matches
        );


        updateClearButton();


        if (!matches.length) {

            closeDetails();


            setMessage(
                "searchMessage",

                "No accepted Mechanical Lab assignment was found for the scanned material.",

                "error"
            );

            return;
        }


        setMessage(
            "searchMessage",

            `${matches.length} accepted Mechanical Lab record(s) found.`,

            "success"
        );
    }


    // =========================================================
    // JSON
    // =========================================================

    async function readJson(
        response
    ) {

        const raw =
            await response.text();


        if (!raw)
            return {};


        try {

            return JSON.parse(
                raw
            );

        }
        catch {

            throw new Error(
                "The Mechanical Lab Result API returned invalid JSON."
            );
        }
    }


    // =========================================================
    // UI HELPERS
    // =========================================================

    function setText(
        id,
        value
    ) {

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


        if (!element)
            return;


        element.textContent =
            message || "";


        element.className =
            `clr-message ${type || "info"}`;


        element.classList.remove(
            "hidden"
        );
    }


    function hideMessage(
        id
    ) {

        $(id)
            ?.classList.add(
                "hidden"
            );
    }


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


    function display(
        value
    ) {

        return (
            value === null ||
            value === undefined ||
            value === ""
        )

            ? "-"

            : String(value);
    }


    function value(
        input
    ) {

        return (
            input === null ||
            input === undefined
        )

            ? ""

            : String(input).trim();
    }


    function normalize(
        input
    ) {

        return (
            input === null ||
            input === undefined
        )

            ? ""

            : String(input)
                .trim()
                .toLowerCase();
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

})();